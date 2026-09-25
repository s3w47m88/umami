-- Deferred: drop Umami's local password/session identity once every user has a tpc_sub and native
-- login has been off in production for the agreed retention window (see integration report for the
-- date). Not applied. Run manually after that window, in a single transaction with a fresh backup.
--
-- Preconditions before running:
--   1. select count(*) from "user" where tpc_sub is null and deleted_at is null; -- must be 0
--   2. select count(*) from "team" where tpc_org_id is null and deleted_at is null; -- must be 0
--   3. DISABLE_LOGIN has been set in the deployed environment for the whole retention window.

BEGIN;

ALTER TABLE "user" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "user" DROP COLUMN IF EXISTS "requires_password_change";
-- Keep the password column nullable rather than dropping it outright: Umami's own migrations
-- reference it in the Prisma client. Null it out for every TPC-managed user instead.
UPDATE "user" SET "password" = NULL WHERE "tpc_sub" IS NOT NULL;

COMMIT;
