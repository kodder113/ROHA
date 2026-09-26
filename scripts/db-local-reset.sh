#!/usr/bin/env bash
# Recreates a local PostgreSQL database with the Supabase shim, all ROHA
# migrations and (optionally) the demonstration seed. For development/testing
# without Docker. Usage: scripts/db-local-reset.sh [dbname] [--no-seed]
set -euo pipefail
DB="${1:-roha_dev}"
ADMIN_URL="${PG_ADMIN_URL:-postgres://postgres:postgres@localhost:5432/postgres}"
DB_URL="${ADMIN_URL%/*}/$DB"
cd "$(dirname "$0")/.."
psql "$ADMIN_URL" -qc "drop database if exists \"$DB\" with (force)" -c "create database \"$DB\""
psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f supabase/tests/supabase_shim.sql
for f in supabase/migrations/*.sql; do
  psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$f"
done
if [[ "${2:-}" != "--no-seed" ]]; then
  psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f supabase/seed.sql > /dev/null
fi
echo "Database $DB ready: $DB_URL"
