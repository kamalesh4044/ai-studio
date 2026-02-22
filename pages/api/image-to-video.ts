import type { NextApiRequest, NextApiResponse } from "next";
import { MOCK_VIDEO_URLS } from "@/utils/models";

type ImageToVideoRequest = {
  image?: string;
  prompt?: string;
  model?: string;
};

const VIDEO_ENDPOINT = process.env.VIDEO_ENDPOINT || process.env.SVD_ENDPOINT || "";
const VIDEO_API_KEY = process.env.VIDEO_API_KEY || process.env.SVD_API_KEY || "";
const DEFAULT_VIDEO_MODEL = process.env.VIDEO_MODEL || "stabilityai/stable-video-diffusion-img2vid-xt";

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

async function callUpstreamVideo(body: ImageToVideoRequest): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (VIDEO_API_KEY) {
    headers.Authorization = `Bearer ${VIDEO_API_KEY}`;
  }

  const response = await fetch(VIDEO_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({
      image: body.image,
      prompt: body.prompt || "",
      model: body.model && body.model !== "mock-default" ? body.model : DEFAULT_VIDEO_MODEL
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Upstream image-to-video failed (${response.status}): ${detail.slice(0, 220)}`);
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
  throw new Error("Unsupported upstream image-to-video response format.");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { image, prompt = "", model = DEFAULT_VIDEO_MODEL } = req.body as ImageToVideoRequest;
  if (!image) {
    return res.status(400).json({ error: "Missing image input." });
  }

  if (VIDEO_ENDPOINT && model !== "mock-default") {
    try {
      const video = await callUpstreamVideo({ image, prompt, model });
      return res.status(200).json({
        video,
        message: `Image-to-video complete with model ${model}`
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upstream image-to-video request failed";
      console.error("[image-to-video] upstream error:", message);
      return res.status(200).json({
        video: `${MOCK_VIDEO_URLS.imageToVideo}?v=${Date.now()}`,
        message: `Fallback to mock: ${message}`
      });
    }
  }

  await sleep(1300);
  return res.status(200).json({
    video: `${MOCK_VIDEO_URLS.imageToVideo}?v=${Date.now()}`,
    message: `Mock image-to-video complete (${model}). Prompt: ${prompt || "none"}`
  });
}
