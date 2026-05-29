const { spawn } = require("node:child_process");

const proxyArgs = getProxyArgs();

while (proxyArgs[0] === "--") {
  proxyArgs.shift();
}

const serverCommand = proxyArgs[0];
const serverArgs = proxyArgs.slice(1);

function getProxyArgs() {
  const separatorIndex = process.argv.indexOf("--");
  if (separatorIndex !== -1) {
    return process.argv.slice(separatorIndex + 1);
  }

  const entry = process.argv[1] || "";
  if (/(?:^|[\\/])al-lsp-proxy\.js$/i.test(entry)) {
    return process.argv.slice(2);
  }

  return process.argv.slice(1);
}

if (!serverCommand) {
  console.error("usage: al-lsp-proxy <server-command> [server-args...]");
  process.exit(2);
}

const completionRequestIds = new Set();
const child = spawn(serverCommand, serverArgs, {
  stdio: ["pipe", "pipe", "pipe"],
  windowsHide: true,
});

process.on("uncaughtException", (error) => {
  logError(`uncaught proxy exception: ${formatError(error)}`);
  shutdown(1);
});

process.on("unhandledRejection", (error) => {
  logError(`unhandled proxy rejection: ${formatError(error)}`);
  shutdown(1);
});

child.stderr.pipe(process.stderr);

child.on("error", (error) => {
  logError(`failed to start AL language server proxy target: ${error.message}`);
  shutdown(1);
});

child.on("exit", (code, signal) => {
  const exitCode = code ?? (signal ? 1 : 0);

  if (signal || code) {
    logError(
      `AL language server proxy target exited${signal ? ` with signal ${signal}` : ` with code ${code}`}`,
    );
  }

  process.exitCode = exitCode;
  process.stdin.pause();
  process.stdout.end(() => process.exit(exitCode));
});

child.stdin.on("error", (error) => {
  logError(`failed writing to AL language server stdin: ${error.message}`);
  shutdown(1);
});

child.stdout.on("error", (error) => {
  logError(`failed reading AL language server stdout: ${error.message}`);
  shutdown(1);
});

process.stdin.on("end", () => {
  if (!child.stdin.destroyed) {
    child.stdin.end();
  }
});
process.stdin.on("error", (error) => {
  logError(`failed reading proxy stdin: ${error.message}`);
  child.stdin.destroy();
});
process.stdout.on("error", () => {
  shutdown(1);
});

const clientParser = createMessageParser((message) => {
  trackCompletionRequests(message);
  writeMessage(child.stdin, message);
}, "client");

const serverParser = createMessageParser((message) => {
  writeMessage(process.stdout, rewriteCompletionResponse(message));
}, "server");

process.stdin.on("data", (chunk) => safePush(clientParser, chunk));
child.stdout.on("data", (chunk) => safePush(serverParser, chunk));

function createMessageParser(onMessage, name) {
  let buffer = Buffer.alloc(0);

  return {
    push(chunk) {
      buffer = Buffer.concat([buffer, chunk]);

      while (true) {
        const separator = findHeaderSeparator(buffer);
        const headerEnd = separator.index;
        if (headerEnd === -1) {
          return;
        }

        const header = buffer.subarray(0, headerEnd).toString("ascii");
        const lengthMatch = /^content-length:\s*(\d+)$/im.exec(header);
        if (!lengthMatch) {
          const recovered = recoverFromMalformedHeader(buffer, name);
          if (recovered.length === buffer.length) {
            throw new Error(`${name} LSP message missing Content-Length header`);
          }

          buffer = recovered;
          continue;
        }

        const contentLength = Number.parseInt(lengthMatch[1], 10);
        const bodyStart = headerEnd + separator.length;
        const messageEnd = bodyStart + contentLength;

        if (buffer.length < messageEnd) {
          return;
        }

        const body = buffer.subarray(bodyStart, messageEnd).toString("utf8");
        buffer = buffer.subarray(messageEnd);
        onMessage(JSON.parse(body));
      }
    },
  };
}

function safePush(parser, chunk) {
  try {
    parser.push(chunk);
  } catch (error) {
    logError(formatError(error));
    shutdown(1);
  }
}

function findHeaderSeparator(buffer) {
  const crlfIndex = buffer.indexOf("\r\n\r\n");
  const lfIndex = buffer.indexOf("\n\n");

  if (crlfIndex === -1) {
    return { index: lfIndex, length: lfIndex === -1 ? 0 : 2 };
  }

  if (lfIndex === -1 || crlfIndex < lfIndex) {
    return { index: crlfIndex, length: 4 };
  }

  return { index: lfIndex, length: 2 };
}

function recoverFromMalformedHeader(buffer, name) {
  const text = buffer.toString("ascii");
  const headerStart = text.search(/(?:^|\r?\n)content-length\s*:/i);

  if (headerStart > 0) {
    logError(`${name} emitted non-LSP stdout before headers; discarding ${headerStart} bytes`);
    return buffer.subarray(headerStart);
  }

  const separator = findHeaderSeparator(buffer);
  if (separator.index !== -1) {
    logError(`${name} emitted malformed LSP headers; discarding header block`);
    return buffer.subarray(separator.index + separator.length);
  }

  return buffer;
}

function writeMessage(stream, message) {
  const body = JSON.stringify(message);
  const length = Buffer.byteLength(body, "utf8");
  stream.write(`Content-Length: ${length}\r\n\r\n${body}`);
}

function trackCompletionRequests(message) {
  visitMessages(message, (item) => {
    if (item && item.method === "textDocument/completion" && item.id !== undefined) {
      completionRequestIds.add(JSON.stringify(item.id));
    }
  });
}

function rewriteCompletionResponse(message) {
  visitMessages(message, (item) => {
    if (!item || item.id === undefined || !Object.prototype.hasOwnProperty.call(item, "result")) {
      return;
    }

    const key = JSON.stringify(item.id);
    if (!completionRequestIds.delete(key)) {
      return;
    }

    rewriteCompletionResult(item.result);
  });

  return message;
}

function visitMessages(message, visitor) {
  if (Array.isArray(message)) {
    for (const item of message) {
      visitor(item);
    }
  } else {
    visitor(message);
  }
}

function rewriteCompletionResult(result) {
  if (Array.isArray(result)) {
    for (const item of result) {
      rewriteCompletionItem(item);
    }
    return;
  }

  if (result && Array.isArray(result.items)) {
    for (const item of result.items) {
      rewriteCompletionItem(item);
    }
  }
}

function rewriteCompletionItem(item) {
  if (!item || !item.label || typeof item.label !== "object" || Array.isArray(item.label)) {
    return;
  }

  const label = item.label;
  const replacement =
    stringOrEmpty(label.label) ||
    stringOrEmpty(item.filterText) ||
    stringOrEmpty(item.insertText) ||
    stringOrEmpty(item.detail) ||
    "";

  if (!item.labelDetails && (typeof label.detail === "string" || typeof label.description === "string")) {
    item.labelDetails = {};

    if (typeof label.detail === "string") {
      item.labelDetails.detail = label.detail;
    }

    if (typeof label.description === "string") {
      item.labelDetails.description = label.description;
    }
  }

  item.label = replacement;
}

function stringOrEmpty(value) {
  return typeof value === "string" ? value : "";
}

function shutdown(code) {
  process.exitCode = code;

  if (!child.killed) {
    child.kill();
  }

  process.stdin.pause();
}

function logError(message) {
  process.stderr.write(`[al-lsp-proxy] ${message}\n`);
}

function formatError(error) {
  if (error && error.stack) {
    return error.stack;
  }

  if (error && error.message) {
    return error.message;
  }

  return String(error);
}
