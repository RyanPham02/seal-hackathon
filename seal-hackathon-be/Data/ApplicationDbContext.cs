using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
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

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<ApplicationUser>().ToTable("Users");
            builder.Entity<IdentityRole<Guid>>().ToTable("Roles");
            builder.Entity<IdentityUserRole<Guid>>().ToTable("UserRoles");
            builder.Entity<IdentityUserClaim<Guid>>().ToTable("UserClaims");
            builder.Entity<IdentityUserLogin<Guid>>().ToTable("UserLogins");
            builder.Entity<IdentityRoleClaim<Guid>>().ToTable("RoleClaims");
            builder.Entity<IdentityUserToken<Guid>>().ToTable("UserTokens");

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
        }
    }
}
