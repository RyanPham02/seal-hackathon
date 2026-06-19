-- ============================================================================
-- SEAL Hackathon — Baseline the existing PostgreSQL database
-- Run in Supabase SQL Editor AFTER diagnose_schema_drift.sql.
--
-- Why: the EF migrations were regenerated for PostgreSQL (migration
-- 20260610041636_InitialPostgres). The production database already contains
-- all the tables, so we do NOT run the migration's CREATE TABLE statements.
-- Instead we tell EF this baseline migration is "already applied", so future
-- schema changes can be applied normally with `dotnet ef database update`.
--
-- ORDER OF OPERATIONS:
--   1. Run Scripts/diagnose_schema_drift.sql  (fix any column-type drift first,
--      so the real schema matches the InitialPostgres baseline).
--   2. Run THIS script (registers the baseline in __EFMigrationsHistory).
--   3. From then on, new migrations apply with `dotnet ef database update`.
-- ============================================================================

-- 1. Ensure EF's migration-history table exists (EF Core 8 standard shape).
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId"    character varying(150) NOT NULL,
    "ProductVersion" character varying(32)  NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

-- 2. Mark the InitialPostgres baseline as applied (idempotent).
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260610041636_InitialPostgres', '8.0.27')
ON CONFLICT ("MigrationId") DO NOTHING;

-- 3. Verify.
SELECT * FROM "__EFMigrationsHistory";
