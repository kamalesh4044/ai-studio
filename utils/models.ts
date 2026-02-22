import type { ChatModel } from "@/types/chat";

export const CHAT_MODELS: ChatModel[] = [
  {
    id: "Qwen/Qwen2.5-7B-Instruct",
    name: "Qwen2.5 7B Instruct",
    provider: "Self-hosted",
    notes: "Best quality/performance balance for single-GPU setups"
  },
  {
    id: "Qwen/Qwen2.5-3B-Instruct",
    name: "Qwen2.5 3B Instruct",
    provider: "Self-hosted",
    notes: "Fast and Colab-friendly"
  },
  {
    id: "meta-llama/Llama-3.1-8B-Instruct",
    name: "Llama 3.1 8B Instruct",
    provider: "Self-hosted",
    notes: "Strong general-purpose instruction model"
  },
  {
    id: "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
    name: "DeepSeek R1 Distill 7B",
    provider: "Self-hosted",
    notes: "Reasoning-heavy tasks"
  },
  {
    id: "mock-default",
    name: "Mock Fallback",
    provider: "Local mock",
    notes: "No external model required"
  }
];

export const DEFAULT_CHAT_MODEL = CHAT_MODELS[0].id;

export const MOCK_VIDEO_URLS = {
  imageToVideo: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  transition: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
};
