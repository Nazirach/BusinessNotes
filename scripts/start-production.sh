#!/bin/sh
set -e

echo "[BusinessNotes] Running database migrations..."
pnpm db:migrate

echo "[BusinessNotes] Starting application..."
exec pnpm start
