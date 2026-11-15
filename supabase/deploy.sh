#!/usr/bin/env bash
# Deploy all edge functions from supabase/functions.
# MUST run from the repo root: running the CLI inside supabase/ makes it treat that dir as the
# project root and silently deploy a stale nested copy (this caused stale prod deploys in Nov 2026).
# Secrets: `supabase secrets set --env-file supabase/.env` (see .env.example).
set -euo pipefail
cd "$(dirname "$0")/.."
supabase functions deploy --no-verify-jwt --use-api
