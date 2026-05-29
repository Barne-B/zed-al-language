# AL for Zed

AL language support for [Zed](https://zed.dev), targeting Microsoft Dynamics 365 Business Central development.

This extension provides:

- `.al` file detection.
- Tree-sitter syntax highlighting, brackets, indentation, folding, and outline support via [`SShadowS/tree-sitter-al`](https://github.com/SShadowS/tree-sitter-al).
- Language Server Protocol support through Microsoft ALTool's standalone LSP command.

## Requirements

Install ALTool and make sure either `al` or `altool` is available on your `PATH`.

Microsoft recommends installing the Business Central development tools as a .NET global tool:

```sh
dotnet tool install --global Microsoft.Dynamics.BusinessCentral.Development.Tools
```

The language server is launched over stdio with:

```sh
al launchlspserver "<path-to-project>" --packagecachepath "<symbols>"
```

## Zed Settings

The extension uses the current Zed worktree root as the AL project path and passes `.alpackages` as the default symbol package cache:

```sh
al launchlspserver "<worktree-root>" --packagecachepath "<worktree-root>/.alpackages"
```

If your symbols live somewhere else, configure `packageCachePath`.

For cross-app navigation in a workspace with multiple AL apps, pass every app folder to ALTool:

```json
{
  "lsp": {
    "al": {
      "settings": {
        "projects": [
          "BaseApp",
          "MyDependencyApp",
          "MyMainApp"
        ],
        "packageCachePath": "C:\\path\\to\\symbols"
      }
    }
  }
}
```

Relative `projects` entries are resolved from the Zed worktree root. You can also use absolute paths. ALTool reads each project's `app.json` and resolves dependency relationships so go-to-definition and find-references can work across those apps.

To configure the symbol package cache from Zed, add:

```json
{
  "lsp": {
    "al": {
      "settings": {
        "packageCachePath": "C:\\path\\to\\symbols"
      }
    }
  }
}
```

The adapter also accepts these optional settings:

- `settingsPath`: passed as `--settingspath`.
- `workspaceFile`: passed as `--workspacefile`.
- `logFile`: passed as `--logfile`.
- `logLevel`: passed as `--loglevel`.
- `projects` or `projectPaths`: AL project folders passed as positional `launchlspserver` project arguments.

You can override the executable or full argument list with Zed's standard LSP binary settings:

```json
{
  "lsp": {
    "al": {
      "binary": {
        "path": "C:\\path\\to\\al.exe",
        "arguments": [
          "launchlspserver",
          "C:\\path\\to\\project",
          "--packagecachepath",
          "C:\\path\\to\\symbols"
        ]
      }
    }
  }
}
```

When `binary.arguments` is set, it replaces the default generated arguments.

## Development

Install this folder as a Zed dev extension:

1. Open Zed's Extensions page.
2. Run `zed: install dev extension`.
3. Select this repository folder.

For local validation, open an AL project containing `app.json`, at least one `.al` file, and the required `.app` symbol packages. Then verify syntax highlighting and LSP features such as hover, completions, go-to-definition, diagnostics, formatting, and rename.

If the language server does not start, check Zed's log for missing `al`/`altool`, invalid package cache paths, or missing symbol packages.
