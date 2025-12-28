import { fetch } from "undici";

export type HttpMethod = "GET" | "POST" | "PUT" | "HEAD";

export type HttpCheckInput = {
  url: string;
  method: HttpMethod;
  timeoutMs: number;
  expectedStatus: number;
};

export type HttpCheckResult =
  | {
      status: "UP";
      statusCode: number;
      responseTime: number;
      error: null;
    }
  | {
      status: "DOWN";
      statusCode: number | null;
      responseTime: number;
      error: string;
    };

export async function runHttpCheck(input: HttpCheckInput): Promise<HttpCheckResult> {
  const controller = new AbortController();
  const start = Date.now();

  const timeout = setTimeout(() => controller.abort(), input.timeoutMs);

  try {
    const res = await fetch(input.url, {
      method: input.method,
      signal: controller.signal
    });

    const responseTime = Date.now() - start;
    const statusCode = res.status;

    // لا نحتاج body الآن (Health endpoint غالبًا صغير)
    // لكن نستهلكه لتفادي leaks في بعض الحالات
    try {
      await res.arrayBuffer();
    } catch {
      // ignore
    }

    if (statusCode === input.expectedStatus) {
      return { status: "UP", statusCode, responseTime, error: null };
    }

    return {
      status: "DOWN",
      statusCode,
      responseTime,
      error: `Unexpected status code: ${statusCode} (expected ${input.expectedStatus})`
    };
  } catch (e: any) {
    const responseTime = Date.now() - start;

    const msg =
      e?.name === "AbortError"
        ? `timeout after ${input.timeoutMs}ms`
        : (e?.message ?? "request failed");

    return { status: "DOWN", statusCode: null, responseTime, error: msg };
  } finally {
    clearTimeout(timeout);
  }
}
