using Microsoft.AspNetCore.Identity;
using SEAL.NET.Models.Entities;

namespace SEAL.NET.Data
{
    public static class DbSeeder
    {
        public static async Task SeedRolesAndAdminAsync(IServiceProvider serviceProvider)
        {
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var configuration = serviceProvider.GetRequiredService<IConfiguration>();

            string[] roles =
            {
                "Admin",
                "Member",
                "TeamLeader",
                "Judge",
                "Mentor"
            };

            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole<Guid>(role));
                }
            }

            if (!configuration.GetValue<bool>("AdminBootstrap:Enabled"))
                return;

            var adminEmail = configuration["AdminBootstrap:Email"];
            var adminPassword = configuration["AdminBootstrap:Password"];

            if (string.IsNullOrWhiteSpace(adminEmail) || string.IsNullOrWhiteSpace(adminPassword))
                throw new InvalidOperationException("Admin bootstrap is enabled but email or password is missing.");

            var admin = await userManager.FindByEmailAsync(adminEmail);

            if (admin == null)
            {
                admin = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    FullName = "System Admin",
                    PlainPassword = adminPassword,
                    EmailConfirmed = true,
                    IsApproved = true
                };

                var result = await userManager.CreateAsync(admin, adminPassword);

                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(admin, "Admin");
                }
                else
                {
                    foreach (var error in result.Errors)
                    {
                        Console.WriteLine($"Seed admin error: {error.Description}");
                    }
                }
            }

            var dbContext = serviceProvider.GetRequiredService<ApplicationDbContext>();
            if (!dbContext.Events.Any())
            {
                var evt = new Event { EventId = Guid.NewGuid(), EventName = "SEAL Hackathon 2026", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(7), Status = SEAL.NET.Models.Enums.EventStatus.Ongoing };
                var cat = new Category { CategoryId = Guid.NewGuid(), CategoryName = "Software", Event = evt };
                var round = new Round { RoundId = Guid.NewGuid(), RoundName = "Finals", Event = evt };
                var crit = new Criteria { CriteriaId = Guid.NewGuid(), CriteriaName = "Functionality", MaxScore = 100, Weight = 100, Round = round };
                dbContext.Events.Add(evt);
                dbContext.Categories.Add(cat);
                dbContext.Rounds.Add(round);
                dbContext.Criteria.Add(crit);
                await dbContext.SaveChangesAsync();
            }
        }
    }
}
