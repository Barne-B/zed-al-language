const { spawn } = require("node:child_process");
const path = require("node:path");

const proxyScript = path.resolve("scripts/al-lsp-proxy.js");

run().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});

async function run() {
  await runInitializeTest("script file path");
  await runCompletionRewriteTest("script file path");
}

function runInitializeTest(name, options = {}) {
  const mockServer = String.raw`
    runServer((request) => {
      if (request.method !== "initialize") {
        process.exit(4);
      }

      return { jsonrpc: "2.0", id: request.id, result: { capabilities: {} } };
    });

    ${mockServerSource()}
  `;

  return runProxyTest({
    name: `initialize (${name})`,
    mockServer,
    request: { jsonrpc: "2.0", id: 1, method: "initialize", params: { capabilities: {} } },
    ...options,
    assertResponse(response) {
      if (response.id !== 1 || !response.result || !response.result.capabilities) {
        throw new Error(`bad initialize response: ${JSON.stringify(response)}`);
      }
    },
  });
}

function runCompletionRewriteTest(name, options = {}) {
  const mockServer = String.raw`
    runServer((request) => {
      if (request.method !== "textDocument/completion") {
        process.exit(4);
      }

      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          items: [
            {
              label: { label: "field", detail: " detail", description: " desc" },
              filterText: "fallback",
            },
          ],
        },
      };
    });

    ${mockServerSource()}
  `;

  return runProxyTest({
    name: `completion rewrite (${name})`,
    mockServer,
    request: {
      jsonrpc: "2.0",
      id: 2,
      method: "textDocument/completion",
      params: {},
    },
    ...options,
    assertResponse(response) {
      const item = response.result && response.result.items && response.result.items[0];

      if (!item) {
        throw new Error(`missing completion item: ${JSON.stringify(response)}`);
      }

      if (item.label !== "field") {
        throw new Error(`label was not rewritten: ${JSON.stringify(item.label)}`);
      }

      if (!item.labelDetails || item.labelDetails.detail !== " detail") {
        throw new Error(`missing labelDetails.detail: ${JSON.stringify(item)}`);
      }

      if (item.labelDetails.description !== " desc") {
        throw new Error(`missing labelDetails.description: ${JSON.stringify(item)}`);
      }
    },
  });
}

function runProxyTest({ name, mockServer, request, assertResponse }) {
  return new Promise((resolve, reject) => {
    const serverArgs = ["--", process.execPath, "-e", mockServer];
    const proxyArgs = [proxyScript, ...serverArgs];

    const proxy = spawn(process.execPath, proxyArgs, {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = Buffer.alloc(0);
    let stderr = "";
    let completed = false;

    const timer = setTimeout(() => {
      if (!completed) {
        proxy.kill();
        reject(new Error(`${name} proxy test timed out\n${stderr}`));
      }
    }, 3000);

    proxy.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    proxy.stdout.on("data", (chunk) => {
      try {
        stdout = Buffer.concat([stdout, chunk]);
        const response = tryReadMessage(stdout);

        if (!response) {
          return;
        }

        assertResponse(response.message);
        completed = true;
        clearTimeout(timer);
        proxy.kill();
        resolve();
      } catch (error) {
        completed = true;
        clearTimeout(timer);
        proxy.kill();
        reject(error);
      }
    });

    proxy.on("exit", (code) => {
      if (!completed) {
        clearTimeout(timer);
        reject(new Error(`${name} proxy exited before response: ${code}\n${stderr}`));
      }
    });

    writeMessage(proxy.stdin, request);
  });
}

function tryReadMessage(buffer) {
  const text = buffer.toString("utf8");
  const separatorIndex = text.indexOf("\r\n\r\n");

  if (separatorIndex === -1) {
    return null;
  }

  const lengthMatch = /^content-length:\s*(\d+)$/im.exec(text.slice(0, separatorIndex));
  if (!lengthMatch) {
    throw new Error("proxy response missing Content-Length");
  }

  const bodyStart = separatorIndex + 4;
  const bodyEnd = bodyStart + Number(lengthMatch[1]);

  if (buffer.length < bodyEnd) {
    return null;
  }

  return {
    message: JSON.parse(buffer.subarray(bodyStart, bodyEnd).toString("utf8")),
    bytesRead: bodyEnd,
  };
}

function writeMessage(stream, message) {
  const body = JSON.stringify(message);
  stream.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
}

function mockServerSource() {
  return String.raw`
    function runServer(handleRequest) {
      let buffer = Buffer.alloc(0);

      process.stdin.on("data", (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        const text = buffer.toString("utf8");
        const separatorIndex = text.indexOf("\r\n\r\n");

        if (separatorIndex === -1) {
          return;
        }

        const lengthMatch = /^content-length:\s*(\d+)$/im.exec(text.slice(0, separatorIndex));
        if (!lengthMatch) {
          process.exit(3);
        }

        const bodyStart = separatorIndex + 4;
        const bodyEnd = bodyStart + Number(lengthMatch[1]);

        if (buffer.length < bodyEnd) {
          return;
        }

        const request = JSON.parse(buffer.subarray(bodyStart, bodyEnd).toString("utf8"));
        writeMessage(process.stdout, handleRequest(request));
      });
    }

    function writeMessage(stream, message) {
      const body = JSON.stringify(message);
      stream.write("Content-Length: " + Buffer.byteLength(body) + "\r\n\r\n" + body);
    }
  `;
}
