import type { IncomingMessage, ServerResponse } from "node:http";

type FetchHandler = {
  fetch: (
    request: Request,
    env: unknown,
    ctx: { waitUntil: (p: Promise<unknown>) => void },
  ) => Promise<Response>;
};

let serverEntry: FetchHandler | undefined;

async function getEntry(): Promise<FetchHandler> {
  if (!serverEntry) {
    // Imported after build — dist/server/server.js is created by `bun run build`
    const serverUrl = new URL("../dist/server/server.js", import.meta.url).href;
    const mod = (await import(serverUrl)) as {
      default: FetchHandler;
    };
    serverEntry = mod.default;
  }
  return serverEntry;
}

function toWebRequest(req: IncomingMessage): Request {
  const proto =
    (req.headers["x-forwarded-proto"] as string | undefined) ?? "https";
  const host = req.headers.host ?? "localhost";
  const url = `${proto}://${host}${req.url ?? "/"}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }

  const method = req.method ?? "GET";
  const hasBody = method !== "GET" && method !== "HEAD";

  if (!hasBody) {
    return new Request(url, { method, headers });
  }

  // Stream the request body
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      req.on("data", (chunk: Buffer) => controller.enqueue(chunk));
      req.on("end", () => controller.close());
      req.on("error", (err) => controller.error(err));
    },
  });

  return new Request(url, {
    method,
    headers,
    body,
    // @ts-expect-error - required for streaming bodies in Node.js fetch
    duplex: "half",
  });
}

async function sendWebResponse(
  webRes: Response,
  res: ServerResponse,
): Promise<void> {
  res.statusCode = webRes.status;
  webRes.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  try {
    if (webRes.body) {
      const reader = webRes.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
  } finally {
    res.end();
  }
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const entry = await getEntry();
    const request = toWebRequest(req);
    const response = await entry.fetch(request, {}, { waitUntil: () => {} });
    await sendWebResponse(response, res);
  } catch (err) {
    console.error("[vercel-handler] unhandled error:", err);
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain");
    res.end("Internal Server Error");
  }
}
