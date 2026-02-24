#!/usr/bin/env bash
set -euo pipefail

JOB_DIR="$1"
ENV_FILE="/root/Magnat/Analytics/.env"
LOG_DIR="/root/Magnat/Analytics/logs"

mkdir -p "$LOG_DIR"

JOB_NAME="$(basename "$JOB_DIR")"
LOG_FILE="$LOG_DIR/${JOB_NAME}.log"

# Загружаем env
set -a
source "$ENV_FILE"
set +a

echo "===== $(date -Is) start $JOB_NAME =====" >> "$LOG_FILE"

cd "$JOB_DIR"

/usr/bin/go run . >> "$LOG_FILE" 2>&1

echo "===== $(date -Is) end $JOB_NAME (exit=$?) =====" >> "$LOG_FILE"