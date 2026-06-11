<div align="center">

# 🚀 AI Studio
**The Ultimate Mock-to-Real AI Application Platform**

[![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![Colab Ready](https://img.shields.io/badge/Google_Colab-F9AB00?style=for-the-badge&logo=googlecolab&logoColor=white)](#-colab-notebooks)
[![Issues](https://img.shields.io/github/issues/kamalesh4044/ai-studio?style=for-the-badge&logo=github)](https://github.com/kamalesh4044/ai-studio/issues)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

A modern, responsive Next.js application that runs instantly in **mock mode** and seamlessly scales to use **real open-source models** (LLMs, Diffusion, Video) by simply setting environment variables. Perfect for rapid prototyping and local AI development!

</div>

---

## ✨ Features

- 💬 **Interactive Chat:** High-performance chat interface with real-time streaming output.
- 🎨 **Image Generation:** Create stunning visuals using top-tier diffusion models.
- 🎞️ **Image-to-Video:** Bring your static images to life with video generation capabilities.
- 🔄 **Two-Image Transition:** Seamless FILM/RIFE style interpolation between two images.
- 🎛️ **Dynamic Model Selector:** Switch between different AI models on the fly.
- 🌓 **Dark & Light Mode:** Beautiful UI that adapts to your system preferences.
- 📁 **Local File Uploads:** Easily upload and process local images and documents.
- 📱 **Responsive Design:** Flawless experience across desktop, tablet, and mobile.

---

## ⚡ Quick Start (Mock Mode)

Want to see the UI in action without downloading massive AI models? The app runs completely locally with mock data out of the box!

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🧠 Real Model Mode

Ready to plug in actual AI brains? The API routes are designed to auto-fallback to mock responses if upstream models fail or aren't configured.

1. Copy the environment template:
   ```bash
   cp .env.local.example .env.local
   ```
2. Configure your endpoints inside `.env.local`.

### 🛣️ Core API Routes
- `pages/api/chat.ts`
- `pages/api/generate-image.ts`
- `pages/api/image-to-video.ts`
- `pages/api/transition.ts`

---

## 🏆 Recommended Model Stack

For the best balance of speed, VRAM usage, and quality, we recommend the following local stack:

| Capability | Model Recommendation | Notes |
| :--- | :--- | :--- |
| **Chat (Balanced)** | `Qwen/Qwen2.5-7B-Instruct` | Best overall performance |
| **Chat (Fast)** | `Qwen/Qwen2.5-3B-Instruct` | Ideal for lower VRAM |
| **Chat (Alt)** | `meta-llama/Llama-3.1-8B-Instruct` | Excellent reasoning alternative |
| **Image (Fast)** | `stabilityai/sdxl-turbo` | Real-time generation |
| **Image (HQ)** | SDXL 1.0 base + refiner | Highest quality outputs |
| **Image-to-Video** | `stable-video-diffusion-img2vid-xt` | Requires significant VRAM |
| **Transition** | `google-research/frame-interpolation` | Smooth FILM/RIFE interpolation |

---

## ☁️ Colab Integration

Don't have a powerful GPU? Run the entire stack for free using Google Colab!

We provide ready-to-use notebooks inside the `colab/` directory:

1. 🟢 **Basic App Hosting:** `Run_AI_Studio_in_Colab.ipynb`
2. 🚀 **Real Model Mode (Qwen + SDXL Turbo):** `Run_AI_Studio_Real_Models.ipynb`

### How the Real-Model Colab Works:
1. Installs Node.js & Python dependencies.
2. Starts a local **FastAPI Gateway** serving `/chat` and `/generate-image`.
3. Wires `.env.local` directly to the Python gateway.
4. Boots up the Next.js server and securely exposes it to the web using a **Cloudflare Tunnel**.

> **Note:** Free-tier Colab handles Chat and Image Generation exceptionally well. Video generation requires heavier compute, but the UI gracefully falls back to mock responses if the endpoint times out!

---

## 📂 Project Structure

```text
├── colab/                 # Google Colab notebooks for cloud deployment
├── components/            # Reusable React components (UI, Chat, Modals)
├── pages/                 # Next.js App routes & API endpoints
│   ├── api/               # Backend API handlers (chat, generate, etc.)
│   └── index.tsx          # Main application entry point
├── styles/                # Tailwind & global CSS styles
├── model_gateway.py       # Python FastAPI layer for local models
├── run_models.py          # Script to initialize model endpoints
└── .env.local.example     # Environment variable template
```

---

## 🗺️ Roadmap

- [x] Initial Next.js Mock UI setup
- [x] FastAPI Model Gateway integration
- [x] Google Colab 1-click deployment
- [ ] Implement user authentication
- [ ] Add support for audio-to-text (Whisper)
- [ ] Build a prompt library feature

---

## 🛠️ Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the local development server |
| `npm run build`| Compiles the application for production |
| `npm run start`| Runs the compiled production build |
| `npm run typecheck`| Runs TypeScript validation across the project |

---

## 📜 License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute as you see fit.

<div align="center">
Made with ❤️ by <a href="https://github.com/kamalesh4044">Kamalesh</a>
</div>


---
<br>
<div align="center">
  <a href="https://github.com/kamalesh4044/ai-studio">
    <img src="https://api.visitorbadge.io/api/visitors?path=https%3A%2F%2Fgithub.com%2Fkamalesh4044%2Fai-studio&label=PROJECT%20VIEWS&labelColor=%230d1117&countColor=%2300ff88&style=for-the-badge" alt="Views"/>
  </a>
</div>

