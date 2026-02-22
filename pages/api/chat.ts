import type { NextApiRequest, NextApiResponse } from "next";

type ChatRequest = {
  model?: string;
  stream?: boolean;
  temperature?: number;
  messages?: Array<{ role: string; content: string }>;
};

const CHAT_ENDPOINT = process.env.CHAT_ENDPOINT || process.env.LLAMA3_ENDPOINT || "";
const CHAT_API_KEY = process.env.CHAT_API_KEY || process.env.LLAMA3_API_KEY || "";
const DEFAULT_CHAT_MODEL = process.env.CHAT_MODEL || "Qwen/Qwen2.5-7B-Instruct";
const DEFAULT_CHAT_TEMPERATURE = Number(process.env.CHAT_TEMPERATURE || 0.7);
const DEFAULT_CHAT_MAX_TOKENS = Number(process.env.CHAT_MAX_TOKENS || 1024);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeTextContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          const text = (part as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .join("");
  }

  return "";
}

function extractTextFromPayload(payload: unknown): string {
  if (typeof payload === "string") {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return "";
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.text === "string") return record.text;
  if (typeof record.output_text === "string") return record.output_text;
  if (typeof record.generated_text === "string") return record.generated_text;
  if (typeof record.reply === "string") return record.reply;
  if (typeof record.content === "string") return record.content;

  if (Array.isArray(record.choices) && record.choices.length > 0) {
    const first = record.choices[0] as Record<string, unknown>;
    const message = first?.message as Record<string, unknown> | undefined;
    if (message?.content !== undefined) {
      return normalizeTextContent(message.content);
    }
    if (first.delta && typeof first.delta === "object") {
      const delta = first.delta as Record<string, unknown>;
      if (delta.content !== undefined) {
        return normalizeTextContent(delta.content);
      }
    }
    if (typeof first.text === "string") {
      return first.text;
    }
  }

  if (Array.isArray(record.output) && record.output.length > 0) {
    const parts = record.output
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "text" in item) {
          const text = (item as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .filter(Boolean);

    if (parts.length > 0) {
      return parts.join("\n");
    }
  }

  return "";
}

function buildMockReply(model: string, latestUserMessage: string, upstreamError?: string) {
  const cleaned = latestUserMessage.trim();
  const intro = cleaned
    ? `You said: "${cleaned}". `
    : "I did not receive text content, so I am responding in generic mode. ";

  const modelLine = `Model profile: ${model}. `;
  const guidance =
    "This response is streamed from a mock endpoint. Configure CHAT_ENDPOINT to use your real self-hosted model API. ";

  const fallback = upstreamError ? `Upstream note: ${upstreamError}. ` : "";
  return `${intro}${modelLine}${guidance}${fallback}`;
}

async function streamText(res: NextApiResponse, text: string) {
  const chunks = text.match(/\S+\s*/g) ?? [text];
  for (const chunk of chunks) {
    res.write(chunk);
    await sleep(28 + Math.floor(Math.random() * 16));
  }
  res.end();
}

async function callUpstreamChat(body: ChatRequest) {
  const requestModel = body.model && body.model !== "mock-default" ? body.model : DEFAULT_CHAT_MODEL;

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (CHAT_API_KEY) {
    headers.Authorization = `Bearer ${CHAT_API_KEY}`;
  }

  const upstream = await fetch(CHAT_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: requestModel,
      messages: body.messages ?? [],
      stream: false,
      temperature: body.temperature ?? DEFAULT_CHAT_TEMPERATURE,
      max_tokens: DEFAULT_CHAT_MAX_TOKENS
    })
  });

  if (!upstream.ok) {
    const detail = await upstream.text();
    throw new Error(`Upstream chat failed (${upstream.status}): ${detail.slice(0, 220)}`);
  }

  const contentType = upstream.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const payload = (await upstream.json()) as unknown;
    return extractTextFromPayload(payload);
  }

  const plain = await upstream.text();
  return plain;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as ChatRequest;
  const model = body.model || DEFAULT_CHAT_MODEL;
  const latestUserMessage =
    [...(body.messages ?? [])].reverse().find((message) => message.role === "user")?.content ?? "";

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  if (CHAT_ENDPOINT && model !== "mock-default") {
    try {
      const text = await callUpstreamChat(body);
      const fallbackText = text.trim() || "Upstream model returned an empty response.";
      await streamText(res, fallbackText);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown upstream chat error";
      console.error("[chat] upstream error:", message);
      const mockText = buildMockReply(model, latestUserMessage, message);
      await streamText(res, mockText);
      return;
    }
  }

  const mockText = buildMockReply(model, latestUserMessage);
  await streamText(res, mockText);
}
