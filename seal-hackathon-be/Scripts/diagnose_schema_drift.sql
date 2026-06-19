-- ============================================================================
-- SEAL Hackathon — PostgreSQL schema drift diagnostic & fix
-- Run in Supabase SQL Editor. STEP 1 is read-only. Review its output BEFORE
-- running STEP 2. STEP 2 only changes columns that are actually the wrong type.
--
-- Background: the EF migrations in this repo are in SQL Server format and were
-- never applied to this Postgres database, so several columns were created by
-- hand with the wrong type (e.g. enum columns created as varchar instead of
-- integer), which breaks login with:
--   System.InvalidCastException: Reading as 'System.Int32' is not supported
--   for fields having DataTypeName 'character varying'
-- ============================================================================


-- ----------------------------------------------------------------------------
-- STEP 1 — DIAGNOSTIC (read-only)
-- Lists the actual type of every column EF expects as a non-text type, and
-- flags the ones whose type does not match what EF will read.
-- ----------------------------------------------------------------------------
WITH expected(table_name, column_name, expected_type) AS (
    VALUES
        -- enum columns -> integer
        ('Users',            'StudentType',     'integer'),
        ('Users',            'DeveloperRole',   'integer'),
        ('Events',           'Status',          'integer'),
        ('Teams',            'Status',          'integer'),
        ('TeamInvitations',  'Status',          'integer'),
        -- bool columns
        ('Users',            'IsApproved',      'boolean'),
        -- numeric columns
        ('Scores',           'ScoreValue',      'numeric'),
        ('Criteria',         'Weight',          'numeric'),
        ('Criteria',         'MaxScore',        'numeric'),
        ('Rounds',           'RoundOrder',      'integer'),
        ('Rounds',           'MaxTeamsAdvancing','integer'),
        ('Prizes',           'Rank',            'integer'),
        ('Documents',        'Size',            'bigint'),
        ('Documents',        'Content',         'bytea')
)
SELECT
    e.table_name,
    e.column_name,
    e.expected_type,
    c.data_type            AS actual_type,
    CASE
        WHEN c.data_type IS NULL THEN '❌ COLUMN MISSING'
        WHEN c.data_type = e.expected_type
          OR (e.expected_type = 'numeric' AND c.data_type = 'numeric')
            THEN '✅ ok'
        ELSE '⚠️ MISMATCH — needs ALTER'
    END AS status
FROM expected e
LEFT JOIN information_schema.columns c
       ON c.table_name  = e.table_name
      AND c.column_name = e.column_name
      AND c.table_schema = 'public'
ORDER BY status DESC, e.table_name, e.column_name;


-- ----------------------------------------------------------------------------
-- STEP 2 — FIX (run only after reviewing STEP 1 output)
-- Each block is guarded: it only runs the ALTER if the column is currently a
-- text type. Safe to run repeatedly. Uncomment / keep only the ones STEP 1
-- flagged as MISMATCH.
--
-- NOTE on enum text -> integer conversion:
--   If a column currently holds enum *names* as text ('FPT', 'External', ...)
--   the plain ::integer cast will fail. The blocks below handle BOTH cases:
--   numeric-looking text casts directly; otherwise it maps known enum names.
-- ----------------------------------------------------------------------------

-- Users.StudentType  (enum StudentType: FPT=0, External=1)
DO $$
BEGIN
    IF (SELECT data_type FROM information_schema.columns
        WHERE table_schema='public' AND table_name='Users' AND column_name='StudentType')
       LIKE '%character%' THEN
        ALTER TABLE "Users"
            ALTER COLUMN "StudentType" TYPE integer
            USING (CASE
                WHEN "StudentType" IS NULL OR "StudentType" = '' THEN NULL
                WHEN "StudentType" ~ '^[0-9]+$' THEN "StudentType"::integer
                WHEN "StudentType" = 'FPT' THEN 0
                WHEN "StudentType" = 'External' THEN 1
            END);
    END IF;
END $$;

-- Users.DeveloperRole  (enum DeveloperRole: Backend=0, Frontend=1, Fullstack=2)
DO $$
BEGIN
    IF (SELECT data_type FROM information_schema.columns
        WHERE table_schema='public' AND table_name='Users' AND column_name='DeveloperRole')
       LIKE '%character%' THEN
        ALTER TABLE "Users"
            ALTER COLUMN "DeveloperRole" TYPE integer
            USING (CASE
                WHEN "DeveloperRole" IS NULL OR "DeveloperRole" = '' THEN NULL
                WHEN "DeveloperRole" ~ '^[0-9]+$' THEN "DeveloperRole"::integer
                WHEN "DeveloperRole" = 'Backend'   THEN 0
                WHEN "DeveloperRole" = 'Frontend'  THEN 1
                WHEN "DeveloperRole" = 'Fullstack' THEN 2
            END);
    END IF;
END $$;

-- Events.Status  (enum EventStatus: Upcoming=0, Ongoing=1, Completed=2, Cancelled=3)
DO $$
BEGIN
    IF (SELECT data_type FROM information_schema.columns
        WHERE table_schema='public' AND table_name='Events' AND column_name='Status')
       LIKE '%character%' THEN
        ALTER TABLE "Events"
            ALTER COLUMN "Status" TYPE integer
            USING (CASE
                WHEN "Status" ~ '^[0-9]+$' THEN "Status"::integer
                WHEN "Status" = 'Upcoming'  THEN 0
                WHEN "Status" = 'Ongoing'   THEN 1
                WHEN "Status" = 'Completed' THEN 2
                WHEN "Status" = 'Cancelled' THEN 3
            END);
    END IF;
END $$;

-- Teams.Status  (enum TeamStatus: Pending=0, Approved=1, Active=2, Eliminated=3,
--                Withdrawn=4, Champion=5, Rejected=6)
DO $$
BEGIN
    IF (SELECT data_type FROM information_schema.columns
        WHERE table_schema='public' AND table_name='Teams' AND column_name='Status')
       LIKE '%character%' THEN
        ALTER TABLE "Teams"
            ALTER COLUMN "Status" TYPE integer
            USING (CASE
                WHEN "Status" ~ '^[0-9]+$' THEN "Status"::integer
                WHEN "Status" = 'Pending'    THEN 0
                WHEN "Status" = 'Approved'   THEN 1
                WHEN "Status" = 'Active'     THEN 2
                WHEN "Status" = 'Eliminated' THEN 3
                WHEN "Status" = 'Withdrawn'  THEN 4
                WHEN "Status" = 'Champion'   THEN 5
                WHEN "Status" = 'Rejected'   THEN 6
            END);
    END IF;
END $$;

-- TeamInvitations.Status  (enum InvitationStatus: Pending=0, Accepted=1,
--                          Rejected=2, Cancelled=3)
DO $$
BEGIN
    IF (SELECT data_type FROM information_schema.columns
        WHERE table_schema='public' AND table_name='TeamInvitations' AND column_name='Status')
       LIKE '%character%' THEN
        ALTER TABLE "TeamInvitations"
            ALTER COLUMN "Status" TYPE integer
            USING (CASE
                WHEN "Status" ~ '^[0-9]+$' THEN "Status"::integer
                WHEN "Status" = 'Pending'   THEN 0
                WHEN "Status" = 'Accepted'  THEN 1
                WHEN "Status" = 'Rejected'  THEN 2
                WHEN "Status" = 'Cancelled' THEN 3
            END);
    END IF;
END $$;

-- Users.IsApproved  (boolean)
DO $$
BEGIN
    IF (SELECT data_type FROM information_schema.columns
        WHERE table_schema='public' AND table_name='Users' AND column_name='IsApproved')
       LIKE '%character%' THEN
        ALTER TABLE "Users"
            ALTER COLUMN "IsApproved" TYPE boolean
            USING (CASE
                WHEN "IsApproved" IN ('true','True','t','1') THEN true
                ELSE false
            END);
    END IF;
END $$;


-- ----------------------------------------------------------------------------
-- STEP 3 — VERIFY: re-run STEP 1. Every row should now read '✅ ok'.
-- ----------------------------------------------------------------------------
