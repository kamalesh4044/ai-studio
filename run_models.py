import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
VENV_DIR = ROOT / ".models-venv"


def run(cmd, **kwargs):
    print(f"[run_models] $ {' '.join(cmd)}")
    subprocess.check_call(cmd, **kwargs)


def ensure_venv() -> Path:
    if not VENV_DIR.exists():
        run([sys.executable, "-m", "venv", str(VENV_DIR)])
    if os.name == "nt":
        python_path = VENV_DIR / "Scripts" / "python.exe"
    else:
        python_path = VENV_DIR / "bin" / "python"
    return python_path


def main():
    python = ensure_venv()

    # Install or update model dependencies
    req_file = ROOT / "models_requirements.txt"
    run([str(python), "-m", "pip", "install", "--upgrade", "pip"])
    run([str(python), "-m", "pip", "install", "-r", str(req_file)])

    # Start the FastAPI gateway (blocks)
    env = os.environ.copy()
    env.setdefault("CHAT_MODEL", "Qwen/Qwen2.5-3B-Instruct")
    env.setdefault("IMAGE_MODEL", "stabilityai/sdxl-turbo")

    run(
        [
            str(python),
            "-m",
            "uvicorn",
            "model_gateway:app",
            "--host",
            "0.0.0.0",
            "--port",
            "8000",
        ],
        cwd=str(ROOT),
        env=env,
    )


if __name__ == "__main__":
    main()

