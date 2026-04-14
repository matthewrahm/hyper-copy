#!/bin/bash
# Run FastAPI backend and Next.js frontend concurrently

trap 'kill 0' EXIT

echo "Starting FastAPI on :8001..."
cd "$(dirname "$0")/.." || exit 1
uv run uvicorn api.main:app --reload --host 127.0.0.1 --port 8001 &

echo "Starting Next.js on :3002..."
cd web && npm run dev -- --port 3002 &

wait
