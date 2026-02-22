import type { NextApiRequest, NextApiResponse } from "next";
import { MOCK_VIDEO_URLS } from "@/utils/models";

type TransitionRequest = {
  image1?: string;
  image2?: string;
  prompt?: string;
  model?: string;
};

const TRANSITION_ENDPOINT = process.env.TRANSITION_ENDPOINT || process.env.FILM_ENDPOINT || "";
const TRANSITION_API_KEY = process.env.TRANSITION_API_KEY || process.env.FILM_API_KEY || "";
const DEFAULT_TRANSITION_MODEL = process.env.TRANSITION_MODEL || "google-research/frame-interpolation";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickVideoFromJson(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;

  if (typeof record.video === "string") return record.video;
  if (typeof record.url === "string") return record.url;

  if (Array.isArray(record.videos) && record.videos.length > 0) {
    const first = record.videos[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") {
      const video = (first as { video?: unknown }).video;
      const url = (first as { url?: unknown }).url;
      if (typeof video === "string") return video;
      if (typeof url === "string") return url;
    }
  }

  if (record.data && Array.isArray(record.data) && record.data.length > 0) {
    const first = record.data[0] as Record<string, unknown>;
    if (typeof first?.b64_json === "string") {
      return `data:video/mp4;base64,${first.b64_json}`;
    }
    if (typeof first?.url === "string") {
      return first.url;
    }
  }

  return "";
}

function ensureVideoUrl(video: string): string {
  if (video.startsWith("data:video/") || video.startsWith("http://") || video.startsWith("https://")) {
    return video;
  }
  return `data:video/mp4;base64,${video}`;
}

async function callUpstreamTransition(body: TransitionRequest): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (TRANSITION_API_KEY) {
    headers.Authorization = `Bearer ${TRANSITION_API_KEY}`;
  }

  const response = await fetch(TRANSITION_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({
      image1: body.image1,
      image2: body.image2,
      prompt: body.prompt || "",
      model: body.model && body.model !== "mock-default" ? body.model : DEFAULT_TRANSITION_MODEL
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Upstream transition failed (${response.status}): ${detail.slice(0, 220)}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.startsWith("video/")) {
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  }

  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as unknown;
    const video = pickVideoFromJson(payload);
    if (!video) throw new Error("No video found in upstream JSON payload.");
    return ensureVideoUrl(video);
  }

  const text = (await response.text()).trim();
  if (text.startsWith("http://") || text.startsWith("https://")) {
    return text;
  }
  if (text) {
    return ensureVideoUrl(text);
  }
  throw new Error("Unsupported upstream transition response format.");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { image1, image2, prompt = "", model = DEFAULT_TRANSITION_MODEL } = req.body as TransitionRequest;
  if (!image1 || !image2) {
    return res.status(400).json({ error: "Both images are required." });
  }

  if (TRANSITION_ENDPOINT && model !== "mock-default") {
    try {
      const video = await callUpstreamTransition({ image1, image2, prompt, model });
      return res.status(200).json({
        video,
        message: `Transition complete with model ${model}`
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upstream transition request failed";
      console.error("[transition] upstream error:", message);
      return res.status(200).json({
        video: `${MOCK_VIDEO_URLS.transition}?t=${Date.now()}`,
        message: `Fallback to mock: ${message}`
      });
    }
  }

  await sleep(1600);
  return res.status(200).json({
    video: `${MOCK_VIDEO_URLS.transition}?t=${Date.now()}`,
    message: `Mock transition complete (${model}). Prompt: ${prompt || "none"}`
  });
}
