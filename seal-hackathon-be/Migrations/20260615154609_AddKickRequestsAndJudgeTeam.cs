using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEAL.NET.Migrations
{
    /// <inheritdoc />
    public partial class AddKickRequestsAndJudgeTeam : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // NOTE: These objects may already exist because an earlier stop-gap created them
            // via raw DDL in DbSeeder (since removed). The statements below are idempotent so
            // this migration applies cleanly to both fresh databases and databases that already
            // ran the stop-gap. This mirrors the existing "ADD COLUMN IF NOT EXISTS" convention
            // used in the StoreUserProfileEnumsAsText migration.

            migrationBuilder.Sql(@"
                ALTER TABLE ""JudgeAssignments"" ADD COLUMN IF NOT EXISTS ""TeamId"" uuid NULL;

                DO $$ BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_JudgeAssignments_Teams_TeamId') THEN
                        ALTER TABLE ""JudgeAssignments""
                            ADD CONSTRAINT ""FK_JudgeAssignments_Teams_TeamId""
                            FOREIGN KEY (""TeamId"") REFERENCES ""Teams"" (""TeamId"") ON DELETE CASCADE;
                    END IF;
                END $$;

                CREATE TABLE IF NOT EXISTS ""KickRequests"" (
                    ""KickRequestId"" uuid NOT NULL CONSTRAINT ""PK_KickRequests"" PRIMARY KEY,
                    ""TeamId"" uuid NOT NULL,
                    ""UserId"" uuid NOT NULL,
                    ""Reason"" text NOT NULL,
                    ""Status"" text NOT NULL,
                    ""RequestedAt"" timestamp without time zone NOT NULL,
                    CONSTRAINT ""FK_KickRequests_Teams_TeamId"" FOREIGN KEY (""TeamId"") REFERENCES ""Teams"" (""TeamId"") ON DELETE CASCADE,
                    CONSTRAINT ""FK_KickRequests_Users_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS ""IX_JudgeAssignments_TeamId"" ON ""JudgeAssignments"" (""TeamId"");
                CREATE INDEX IF NOT EXISTS ""IX_KickRequests_TeamId"" ON ""KickRequests"" (""TeamId"");
                CREATE INDEX IF NOT EXISTS ""IX_KickRequests_UserId"" ON ""KickRequests"" (""UserId"");
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""JudgeAssignments"" DROP CONSTRAINT IF EXISTS ""FK_JudgeAssignments_Teams_TeamId"";
                DROP INDEX IF EXISTS ""IX_JudgeAssignments_TeamId"";
                DROP TABLE IF EXISTS ""KickRequests"";
                ALTER TABLE ""JudgeAssignments"" DROP COLUMN IF EXISTS ""TeamId"";
            ");
        }
    }
}
