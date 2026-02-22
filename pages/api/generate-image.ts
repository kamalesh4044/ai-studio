import type { NextApiRequest, NextApiResponse } from "next";

type ImageRequest = {
  prompt?: string;
  model?: string;
  negative_prompt?: string;
  steps?: number;
};

const IMAGE_ENDPOINT = process.env.IMAGE_ENDPOINT || process.env.SDXL_ENDPOINT || "";
const IMAGE_API_KEY = process.env.IMAGE_API_KEY || process.env.SDXL_API_KEY || "";
const DEFAULT_IMAGE_MODEL = process.env.IMAGE_MODEL || "stabilityai/sdxl-turbo";
const DEFAULT_IMAGE_STEPS = Number(process.env.IMAGE_STEPS || 4);

function escapeXml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickImageFromJson(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;

  if (typeof record.image === "string") return record.image;
  if (typeof record.url === "string") return record.url;

  if (Array.isArray(record.images) && record.images.length > 0) {
    const first = record.images[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") {
      const image = (first as { image?: unknown }).image;
      const url = (first as { url?: unknown }).url;
      if (typeof image === "string") return image;
      if (typeof url === "string") return url;
    }
  }

  if (record.data && Array.isArray(record.data) && record.data.length > 0) {
    const first = record.data[0] as Record<string, unknown>;
    if (typeof first?.b64_json === "string") {
      return `data:image/png;base64,${first.b64_json}`;
    }
    if (typeof first?.url === "string") {
      return first.url;
    }
  }

  return "";
}

function ensureDataUrl(image: string): string {
  if (image.startsWith("data:image/") || image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }
  return `data:image/png;base64,${image}`;
}

async function callUpstreamImage(body: ImageRequest): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (IMAGE_API_KEY) {
    headers.Authorization = `Bearer ${IMAGE_API_KEY}`;
  }

  const response = await fetch(IMAGE_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({
      prompt: body.prompt || "Untitled image",
      negative_prompt: body.negative_prompt || "",
      steps: body.steps || DEFAULT_IMAGE_STEPS,
      model: body.model && body.model !== "mock-default" ? body.model : DEFAULT_IMAGE_MODEL
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Upstream image failed (${response.status}): ${detail.slice(0, 220)}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.startsWith("image/")) {
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  }

  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as unknown;
    const image = pickImageFromJson(payload);
    if (!image) {
      throw new Error("No image found in upstream JSON payload.");
    }
    return ensureDataUrl(image);
  }

  const text = await response.text();
  if (text.startsWith("http://") || text.startsWith("https://")) {
    return text;
  }
  if (text.trim()) {
    return ensureDataUrl(text.trim());
  }
  throw new Error("Unsupported upstream image response format.");
}

function buildMockImage(prompt: string, model: string) {
  const safePrompt = escapeXml(prompt.slice(0, 120));
  const safeModel = escapeXml(model);
  const svg = `<svg width="1024" height="640" viewBox="0 0 1024 640" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#0d9488"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
    <radialGradient id="spot" cx="80%" cy="10%" r="60%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.42)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="640" fill="url(#g1)"/>
  <rect width="1024" height="640" fill="url(#spot)"/>
  <g fill="none" stroke="rgba(255,255,255,0.22)">
    <path d="M40 540 Q240 460 420 520 T760 500 T990 520" stroke-width="3"/>
    <path d="M20 430 Q230 350 470 395 T850 370 T1000 390" stroke-width="2"/>
  </g>
  <rect x="58" y="52" width="908" height="536" rx="28" fill="rgba(15,23,42,0.28)" stroke="rgba(255,255,255,0.32)"/>
  <text x="84" y="120" fill="#D1FAE5" font-size="20" font-family="monospace">MOCK IMAGE OUTPUT</text>
  <text x="84" y="162" fill="#ECFEFF" font-size="32" font-family="monospace">${safePrompt}</text>
  <text x="84" y="204" fill="#A5F3FC" font-size="18" font-family="monospace">model: ${safeModel}</text>
  <text x="84" y="560" fill="#CCFBF1" font-size="14" font-family="monospace">set IMAGE_ENDPOINT to enable real generation</text>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as ImageRequest;
  const prompt = body.prompt?.trim() || "Untitled mock image";
  const model = body.model || DEFAULT_IMAGE_MODEL;

  if (IMAGE_ENDPOINT && model !== "mock-default") {
    try {
      const image = await callUpstreamImage(body);
      return res.status(200).json({ image });
    } catch (error) {
      console.error("[generate-image] upstream error:", error);
      const image = buildMockImage(prompt, model);
      const message = error instanceof Error ? error.message : "Upstream image request failed";
      return res.status(200).json({ image, message: `Fallback to mock: ${message}` });
    }
  }

  await sleep(900);
  const image = buildMockImage(prompt, model);
  return res.status(200).json({ image });
}
