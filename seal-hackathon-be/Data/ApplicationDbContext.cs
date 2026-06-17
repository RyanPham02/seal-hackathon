using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using SEAL.NET.Models.Entities;

namespace SEAL.NET.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Event> Events { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Round> Rounds { get; set; }
        public DbSet<Team> Teams { get; set; }
        public DbSet<TeamMember> TeamMembers { get; set; }
        public DbSet<Criteria> Criteria { get; set; }
        public DbSet<Submission> Submissions { get; set; }
        public DbSet<JudgeAssignment> JudgeAssignments { get; set; }
        public DbSet<Score> Scores { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<TeamInvitation> TeamInvitations { get; set; }
        public DbSet<MentorAssignment> MentorAssignments { get; set; }
        public DbSet<Prize> Prizes { get; set; }
        public DbSet<Document> Documents { get; set; }
        public DbSet<KickRequest> KickRequests { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            var dateTimeConverter = new ValueConverter<DateTime, DateTime>(
                value => DateTime.SpecifyKind(value, DateTimeKind.Unspecified),
                value => value);

            var nullableDateTimeConverter = new ValueConverter<DateTime?, DateTime?>(
                value => value.HasValue ? DateTime.SpecifyKind(value.Value, DateTimeKind.Unspecified) : value,
                value => value);

            foreach (var entityType in builder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties())
                {
                    if (property.ClrType == typeof(DateTime))
                    {
                        property.SetColumnType("timestamp without time zone");
                        property.SetValueConverter(dateTimeConverter);
                    }
                    else if (property.ClrType == typeof(DateTime?))
                    {
                        property.SetColumnType("timestamp without time zone");
                        property.SetValueConverter(nullableDateTimeConverter);
                    }
                }
            }

            builder.Entity<ApplicationUser>().ToTable("Users");
            builder.Entity<ApplicationUser>()
                .HasIndex(u => u.StudentCode)
                .IsUnique()
                .HasFilter("\"StudentCode\" IS NOT NULL");

            builder.Entity<ApplicationUser>()
                .Property(u => u.StudentType)
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Entity<ApplicationUser>()
                .Property(u => u.DeveloperRole)
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Entity<IdentityRole<Guid>>().ToTable("Roles");
            builder.Entity<IdentityUserRole<Guid>>().ToTable("UserRoles");
            builder.Entity<IdentityUserClaim<Guid>>().ToTable("UserClaims");
            builder.Entity<IdentityUserLogin<Guid>>().ToTable("UserLogins");
            builder.Entity<IdentityRoleClaim<Guid>>().ToTable("RoleClaims");
            builder.Entity<IdentityUserToken<Guid>>().ToTable("UserTokens");

            builder.Entity<Event>()
                .Property(e => e.Status)
                .HasConversion<int>();

            builder.Entity<Team>()
                .Property(t => t.Status)
                .HasConversion<int>();

            builder.Entity<Team>()
                .HasIndex(t => new { t.CategoryId, t.TeamName })
                .IsUnique();

            builder.Entity<Team>()
                .HasOne(t => t.Leader)
                .WithMany(u => u.LedTeams)
                .HasForeignKey(t => t.LeaderId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Team>()
                .HasOne(t => t.CurrentRound)
                .WithMany()
                .HasForeignKey(t => t.CurrentRoundId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<TeamMember>()
                .HasOne(tm => tm.User)
                .WithMany(u => u.TeamMemberships)
                .HasForeignKey(tm => tm.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Score>()
                .HasOne(s => s.Criteria)
                .WithMany(c => c.Scores)
                .HasForeignKey(s => s.CriteriaId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Score>()
                .HasOne(s => s.Submission)
                .WithMany(sub => sub.Scores)
                .HasForeignKey(s => s.SubmissionId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Score>()
                .HasOne(s => s.Judge)
                .WithMany(u => u.ScoresGiven)
                .HasForeignKey(s => s.JudgeId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<JudgeAssignment>()
                .HasOne(ja => ja.Judge)
                .WithMany(u => u.JudgeAssignments)
                .HasForeignKey(ja => ja.JudgeId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<JudgeAssignment>()
                .HasOne(j => j.Round)
                .WithMany(r => r.JudgeAssignments)
                .HasForeignKey(j => j.RoundId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<JudgeAssignment>()
                .HasOne(j => j.Category)
                .WithMany(c => c.JudgeAssignments)
                .HasForeignKey(j => j.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Submission>()
                .HasOne(s => s.Round)
                .WithMany(r => r.Submissions)
                .HasForeignKey(s => s.RoundId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Score>()
                .HasIndex(s => new { s.SubmissionId, s.JudgeId, s.CriteriaId })
                .IsUnique();

            builder.Entity<TeamMember>()
                .HasIndex(tm => new { tm.TeamId, tm.UserId })
                .IsUnique();

            builder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<AuditLog>()
                .HasOne(a => a.ActorUser)
                .WithMany()
                .HasForeignKey(a => a.ActorUserId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.Entity<TeamInvitation>()
                .Property(ti => ti.Status)
                .HasConversion<int>();

            builder.Entity<TeamInvitation>()
                .HasIndex(ti => new { ti.TeamId, ti.InviteeUserId })
                .IsUnique()
                .HasFilter("\"Status\" = 0");

            builder.Entity<TeamInvitation>()
                .HasOne(ti => ti.Team)
                .WithMany()
                .HasForeignKey(ti => ti.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<TeamInvitation>()
                .HasOne(ti => ti.InviterUser)
                .WithMany()
                .HasForeignKey(ti => ti.InviterUserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<TeamInvitation>()
                .HasOne(ti => ti.InviteeUser)
                .WithMany()
                .HasForeignKey(ti => ti.InviteeUserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<MentorAssignment>()
                .HasIndex(ma => new { ma.MentorUserId, ma.TeamId })
                .IsUnique()
                .HasFilter("\"IsActive\" = TRUE");

            builder.Entity<MentorAssignment>()
                .HasOne(ma => ma.Mentor)
                .WithMany()
                .HasForeignKey(ma => ma.MentorUserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<MentorAssignment>()
                .HasOne(ma => ma.AssignedBy)
                .WithMany()
                .HasForeignKey(ma => ma.AssignedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<MentorAssignment>()
                .HasOne(ma => ma.Team)
                .WithMany()
                .HasForeignKey(ma => ma.TeamId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Prize>()
                .HasOne(p => p.Event)
                .WithMany()
                .HasForeignKey(p => p.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Document>()
                .HasOne(d => d.Uploader)
                .WithMany()
                .HasForeignKey(d => d.UploaderId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.Entity<KickRequest>()
                .HasOne(kr => kr.Team)
                .WithMany()
                .HasForeignKey(kr => kr.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<KickRequest>()
                .HasOne(kr => kr.User)
                .WithMany()
                .HasForeignKey(kr => kr.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<JudgeAssignment>()
                .HasOne(ja => ja.Team)
                .WithMany()
                .HasForeignKey(ja => ja.TeamId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
