using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEAL.NET.Migrations
{
    /// <inheritdoc />
    public partial class StoreUserProfileEnumsAsText : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""DROP INDEX IF EXISTS "UserNameIndex";""");
            migrationBuilder.Sql("""DROP INDEX IF EXISTS "RoleNameIndex";""");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "UserTokens",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(450)");

            migrationBuilder.AlterColumn<string>(
                name: "LoginProvider",
                table: "UserTokens",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(450)");

            migrationBuilder.AlterColumn<string>(
                name: "StudentType",
                table: "Users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "DeveloperRole",
                table: "Users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.Sql("""
                ALTER TABLE "Users"
                ADD COLUMN IF NOT EXISTS "PlainPassword" character varying(100);
                """);

            migrationBuilder.AlterColumn<string>(
                name: "ProviderKey",
                table: "UserLogins",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(450)");

            migrationBuilder.AlterColumn<string>(
                name: "LoginProvider",
                table: "UserLogins",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(450)");

            migrationBuilder.Sql("""CREATE UNIQUE INDEX IF NOT EXISTS "UserNameIndex" ON "Users" ("NormalizedUserName");""");
            migrationBuilder.Sql("""CREATE UNIQUE INDEX IF NOT EXISTS "RoleNameIndex" ON "Roles" ("NormalizedName");""");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""DROP INDEX IF EXISTS "UserNameIndex";""");
            migrationBuilder.Sql("""DROP INDEX IF EXISTS "RoleNameIndex";""");

            migrationBuilder.DropColumn(
                name: "PlainPassword",
                table: "Users");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "UserTokens",
                type: "character varying(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "LoginProvider",
                table: "UserTokens",
                type: "character varying(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<int>(
                name: "StudentType",
                table: "Users",
                type: "integer",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "DeveloperRole",
                table: "Users",
                type: "integer",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ProviderKey",
                table: "UserLogins",
                type: "character varying(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "LoginProvider",
                table: "UserLogins",
                type: "character varying(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "Users",
                column: "NormalizedUserName",
                unique: true,
                filter: "\"NormalizedUserName\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "Roles",
                column: "NormalizedName",
                unique: true,
                filter: "\"NormalizedName\" IS NOT NULL");
        }
    }
}
