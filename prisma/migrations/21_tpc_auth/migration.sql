-- TPC Auth integration: re-key user/team identity onto TPC Auth's ids.
-- Additive only. Written, NOT applied by this change. Apply with:
--   psql "$DATABASE_URL" -f prisma/migrations/21_tpc_auth/migration.sql
-- (or `prisma migrate deploy` once this migration is checked in as the head).
--
-- Backfill: existing Umami users/teams have no TPC identity yet. Export
-- `username (email), user_id` and `team_id, name` and hand them to the TPC Auth
-- operator to get back `email -> tpc_sub` and `team -> tpc_org_id` mappings
-- (see tpc-auth/scripts/link-identities.mjs). Apply the backfill UPDATEs in a
-- follow-up transactional migration once that mapping comes back; do not guess.

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "tpc_sub" uuid;
CREATE UNIQUE INDEX IF NOT EXISTS "user_tpc_sub_key" ON "user" ("tpc_sub");

ALTER TABLE "team" ADD COLUMN IF NOT EXISTS "tpc_org_id" uuid;
CREATE UNIQUE INDEX IF NOT EXISTS "team_tpc_org_id_key" ON "team" ("tpc_org_id");
