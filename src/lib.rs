use zed::settings::LspSettings;
use zed_extension_api as zed;

const LANGUAGE_SERVER_ID: &str = "al";
const DEFAULT_BINARY_NAME: &str = "al";
const FALLBACK_BINARY_NAME: &str = "altool";
const DEFAULT_PACKAGE_CACHE_PATH: &str = ".alpackages";

struct AlExtension;

impl AlExtension {
    fn language_server_settings(worktree: &zed::Worktree) -> zed::Result<LspSettings> {
        LspSettings::for_worktree(LANGUAGE_SERVER_ID, worktree)
    }

    fn resolve_command(settings: &LspSettings, worktree: &zed::Worktree) -> zed::Result<String> {
        if let Some(path) = settings
            .binary
            .as_ref()
            .and_then(|binary| binary.path.as_ref())
        {
            return Ok(path.clone());
        }

        worktree
            .which(DEFAULT_BINARY_NAME)
            .or_else(|| worktree.which(FALLBACK_BINARY_NAME))
            .ok_or_else(|| {
                format!(
                    "Could not find `{DEFAULT_BINARY_NAME}` on PATH. Install Microsoft.Dynamics.BusinessCentral.Development.Tools or configure lsp.{LANGUAGE_SERVER_ID}.binary.path."
                )
            })
    }

    fn resolve_args(settings: &LspSettings, worktree: &zed::Worktree) -> Vec<String> {
        if let Some(arguments) = settings
            .binary
            .as_ref()
            .and_then(|binary| binary.arguments.as_ref())
        {
            return arguments.clone();
        }

        let mut args = vec!["launchlspserver".to_string()];
        let projects = setting_strings(settings, &["projects", "projectPaths", "project_paths"]);

        if projects.is_empty() {
            args.push(worktree.root_path());
        } else {
            args.extend(
                projects
                    .into_iter()
                    .map(|project| resolve_worktree_path(worktree, &project)),
            );
        }

        let package_cache_path = setting_path_list(
            settings,
            &[
                "packageCachePath",
                "packageCachePaths",
                "package_cache_path",
            ],
        )
        .unwrap_or_else(|| join_paths(&worktree.root_path(), DEFAULT_PACKAGE_CACHE_PATH));

        args.push("--packagecachepath".to_string());
        args.push(package_cache_path);

        if let Some(settings_path) = setting_string(settings, &["settingsPath", "settings_path"]) {
            args.push("--settingspath".to_string());
            args.push(settings_path);
        }

        if let Some(workspace_file) = setting_string(settings, &["workspaceFile", "workspace_file"])
        {
            args.push("--workspacefile".to_string());
            args.push(workspace_file);
        }

        if let Some(log_file) = setting_string(settings, &["logFile", "log_file"]) {
            args.push("--logfile".to_string());
            args.push(log_file);
        }

        if let Some(log_level) = setting_string(settings, &["logLevel", "log_level"]) {
            args.push("--loglevel".to_string());
            args.push(log_level);
        }

        args
    }

    fn resolve_env(settings: &LspSettings, worktree: &zed::Worktree) -> Vec<(String, String)> {
        let mut env = worktree.shell_env();

        if let Some(binary_env) = settings
            .binary
            .as_ref()
            .and_then(|binary| binary.env.as_ref())
        {
            for (key, value) in binary_env {
                env.retain(|(existing_key, _)| existing_key != key);
                env.push((key.clone(), value.clone()));
            }
        }

        env
    }
}

impl zed::Extension for AlExtension {
    fn new() -> Self {
        Self
    }

    fn language_server_command(
        &mut self,
        language_server_id: &zed::LanguageServerId,
        worktree: &zed::Worktree,
    ) -> zed::Result<zed::Command> {
        if language_server_id.as_ref() != LANGUAGE_SERVER_ID {
            return Err(format!(
                "unsupported language server `{language_server_id}`"
            ));
        }

        let settings = Self::language_server_settings(worktree)?;
        let command = Self::resolve_command(&settings, worktree)?;
        let args = Self::resolve_args(&settings, worktree);
        let env = Self::resolve_env(&settings, worktree);

        Ok(zed::Command { command, args, env })
    }

    fn language_server_initialization_options(
        &mut self,
        language_server_id: &zed::LanguageServerId,
        worktree: &zed::Worktree,
    ) -> zed::Result<Option<zed::serde_json::Value>> {
        if language_server_id.as_ref() != LANGUAGE_SERVER_ID {
            return Ok(None);
        }

        Self::language_server_settings(worktree).map(|settings| settings.initialization_options)
    }
}

fn setting_string(settings: &LspSettings, keys: &[&str]) -> Option<String> {
    let settings = settings.settings.as_ref()?;

    for key in keys {
        if let Some(value) = settings.get(*key).and_then(|value| value.as_str()) {
            if !value.trim().is_empty() {
                return Some(value.to_string());
            }
        }
    }

    None
}

fn setting_strings(settings: &LspSettings, keys: &[&str]) -> Vec<String> {
    let Some(settings) = settings.settings.as_ref() else {
        return Vec::new();
    };

    for key in keys {
        if let Some(value) = settings.get(*key) {
            if let Some(value) = value.as_str() {
                let value = value.trim();

                if !value.is_empty() {
                    return vec![value.to_string()];
                }
            }

            if let Some(values) = value.as_array() {
                return values
                    .iter()
                    .filter_map(|value| value.as_str())
                    .map(str::trim)
                    .filter(|value| !value.is_empty())
                    .map(ToOwned::to_owned)
                    .collect();
            }
        }
    }

    Vec::new()
}

fn setting_path_list(settings: &LspSettings, keys: &[&str]) -> Option<String> {
    let paths = setting_strings(settings, keys);

    if paths.is_empty() {
        None
    } else {
        Some(paths.join(";"))
    }
}

fn resolve_worktree_path(worktree: &zed::Worktree, path: &str) -> String {
    if is_absolute_path(path) {
        path.to_string()
    } else {
        join_paths(&worktree.root_path(), path)
    }
}

fn is_absolute_path(path: &str) -> bool {
    path.starts_with('/')
        || path.starts_with('\\')
        || path
            .as_bytes()
            .get(1)
            .is_some_and(|separator| *separator == b':')
}

fn join_paths(root: &str, path: &str) -> String {
    if root.ends_with('/') || root.ends_with('\\') {
        format!("{root}{path}")
    } else if root.contains('\\') {
        format!("{root}\\{path}")
    } else {
        format!("{root}/{path}")
    }
}

zed::register_extension!(AlExtension);
