#!/usr/bin/env bash
set -euo pipefail

JOB_DIR="$1"
ENV_FILE="/root/Magnat/Analytics/.env"
LOG_DIR="/root/Magnat/Analytics/logs"

mkdir -p "$LOG_DIR"

JOB_NAME="$(basename "$JOB_DIR")"
LOG_FILE="$LOG_DIR/${JOB_NAME}.log"

# Загружаем env
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

echo "===== $(date -Is) start $JOB_NAME =====" >> "$LOG_FILE"

cd "$JOB_DIR"

# Активируем виртуальное окружение
if [ -f "venv/bin/activate" ]; then
  source venv/bin/activate
else
  echo "venv not found!" >> "$LOG_FILE"
  exit 1
fi

if python main.py >> "$LOG_FILE" 2>&1; then
  echo "===== $(date -Is) end $JOB_NAME (exit=0) =====" >> "$LOG_FILE"
else
  EXIT_CODE=$?
  echo "===== $(date -Is) ERROR $JOB_NAME (exit=$EXIT_CODE) =====" >> "$LOG_FILE"
  exit $EXIT_CODE
fi