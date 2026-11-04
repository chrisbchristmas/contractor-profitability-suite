#!/usr/bin/env bash
# Deploy all ported edge functions. Project is already linked (supabase/.temp/linked-project.json).
# Run `supabase secrets set --env-file supabase/.env` first (see .env.example).
set -euo pipefail
cd "$(dirname "$0")"
supabase functions deploy --no-verify-jwt
