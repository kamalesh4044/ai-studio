# AI Studio (Mock + Real Model Ready)

This app runs immediately in mock mode and can switch to real models by setting environment variables.

## What You Get

- Chat interface with streaming output
- Image generation
- Image-to-video
- Two-image transition
- Model selector
- Dark/light mode
- Local file uploads
- Responsive layout

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Real Model Mode

Copy `.env.local.example` to `.env.local` and configure endpoints.

The API routes now automatically:
- use real upstream endpoints when configured
- fall back to mock responses if upstream fails

Routes:
- `pages/api/chat.ts`
- `pages/api/generate-image.ts`
- `pages/api/image-to-video.ts`
- `pages/api/transition.ts`

## Recommended Models (Best Practical Stack)

### Chat
- Best balance: `Qwen/Qwen2.5-7B-Instruct`
- Faster/lower VRAM: `Qwen/Qwen2.5-3B-Instruct`
- Alternative: `meta-llama/Llama-3.1-8B-Instruct`

### Image
- Fast + strong quality: `stabilityai/sdxl-turbo`
- Higher quality but heavier: SDXL 1.0 base + refiner flow

### Image-to-video
- `stabilityai/stable-video-diffusion-img2vid-xt` (heavy)

### Transition
- `google-research/frame-interpolation` (FILM/RIFE style interpolation)

## Colab Notebooks

- Basic app hosting: `colab/Run_AI_Studio_in_Colab.ipynb`
- Real model mode (Qwen + SDXL Turbo): `colab/Run_AI_Studio_Real_Models.ipynb`

The real-model notebook:
1. Installs Node + Python deps
2. Starts a local FastAPI gateway (`/chat`, `/generate-image`)
3. Wires `.env.local` to that gateway
4. Runs Next.js and exposes it with Cloudflare tunnel

## Notes

- Free Colab usually handles chat + image better than full video generation.
- Video/transition routes remain usable because they auto-fallback to mock output if no endpoint is set.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run typecheck`
