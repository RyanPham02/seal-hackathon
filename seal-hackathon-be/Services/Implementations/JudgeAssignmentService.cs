using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Judge;
using SEAL.NET.Models.Entities;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class JudgeAssignmentService : IJudgeAssignmentService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly INotificationService _notificationService;

        public JudgeAssignmentService(
            ApplicationDbContext context, 
            UserManager<ApplicationUser> userManager,
            INotificationService notificationService)
        {
            _context = context;
            _userManager = userManager;
            _notificationService = notificationService;
        }

        public async Task<ServiceResult> GetAssignmentsAsync()
        {
            var rawAssignments = await _context.JudgeAssignments
                .Include(a => a.Judge)
                .Include(a => a.Round)
                .Include(a => a.Category)
                .Include(a => a.Team)
                .ToListAsync();

            var grouped = rawAssignments
                .GroupBy(a => new { a.JudgeId, a.RoundId, a.CategoryId })
                .Select(g => {
                    var first = g.First();
                    // If any assignment in the group has a TeamId, we select those specific teams
                    var assignedTeams = g.Where(a => a.Team != null).Select(a => new { a.Team!.TeamId, a.Team.TeamName }).ToList();
                    
                    return new
                    {
                        AssignmentId = first.AssignmentId,
                        AssignmentIds = g.Select(a => a.AssignmentId).ToList(),
                        judge = new
                        {
                            first.JudgeId,
                            first.Judge!.FullName,
                            first.Judge.Email
                        },
                        round = new
                        {
                            first.RoundId,
                            first.Round!.RoundName
                        },
                        category = new
                        {
                            first.CategoryId,
                            first.Category!.CategoryName,
                            // If assigned to specific teams, show them. Otherwise show all teams in the category.
                            Teams = assignedTeams.Any() 
                                ? assignedTeams 
                                : _context.Teams.Where(t => t.CategoryId == first.CategoryId).Select(t => new { t.TeamId, t.TeamName }).ToList()
                        }
                    };
                })
                .ToList();

            return ServiceResult.Ok(grouped);
        }

        public async Task<ServiceResult> CreateAssignmentAsync(CreateJudgeAssignmentRequest request)
        {
            var judge = await _userManager.FindByIdAsync(request.JudgeId.ToString());
            if (judge == null)
                return ServiceResult.NotFound("Judge not found.");

            var isJudge = await _userManager.IsInRoleAsync(judge, "Judge");
            if (!isJudge)
                return ServiceResult.BadRequest("This user is not a Judge.");

            var round = await _context.Rounds.FindAsync(request.RoundId);
            if (round == null)
                return ServiceResult.NotFound("Round not found.");

            var category = await _context.Categories.FindAsync(request.CategoryId);
            if (category == null)
                return ServiceResult.NotFound("Category not found.");

            if (round.EventId != category.EventId)
                return ServiceResult.BadRequest("Round and category must belong to the same event.");

            // 1. Remove existing assignments for this specific judge, round, and category combination (to avoid duplicates or update assignments)
            var existingForJudge = await _context.JudgeAssignments
                .Where(a => a.JudgeId == request.JudgeId && a.RoundId == request.RoundId && a.CategoryId == request.CategoryId)
                .ToListAsync();
            if (existingForJudge.Any())
            {
                _context.JudgeAssignments.RemoveRange(existingForJudge);
            }

            // 2. Remove existing assignments for the selected teams for this round and category, REGARDLESS of the judge,
            // because a team should only have one judge managing/grading them for a specific round & category.
            if (request.TeamIds != null && request.TeamIds.Any())
            {
                var existingForTeams = await _context.JudgeAssignments
                    .Where(a => a.RoundId == request.RoundId && a.CategoryId == request.CategoryId && a.TeamId != null && request.TeamIds.Contains(a.TeamId.Value))
                    .ToListAsync();
                if (existingForTeams.Any())
                {
                    _context.JudgeAssignments.RemoveRange(existingForTeams);
                }
            }
            else
            {
                // If it is a category-wide assignment (TeamIds is empty/null), we remove any existing category-wide assignments (TeamId is null)
                // for this round and category, regardless of the judge.
                var existingCategoryWide = await _context.JudgeAssignments
                    .Where(a => a.RoundId == request.RoundId && a.CategoryId == request.CategoryId && a.TeamId == null)
                    .ToListAsync();
                if (existingCategoryWide.Any())
                {
                    _context.JudgeAssignments.RemoveRange(existingCategoryWide);
                }
            }

            // Create assignments
            if (request.TeamIds != null && request.TeamIds.Any())
            {
                foreach (var teamId in request.TeamIds)
                {
                    var team = await _context.Teams.FindAsync(teamId);
                    if (team == null || team.CategoryId != request.CategoryId)
                    {
                        return ServiceResult.BadRequest($"Team with ID {teamId} does not exist or is not in the selected category.");
                    }

                    var assignment = new JudgeAssignment
                    {
                        JudgeId = request.JudgeId,
                        RoundId = request.RoundId,
                        CategoryId = request.CategoryId,
                        TeamId = teamId
                    };
                    _context.JudgeAssignments.Add(assignment);
                }

                // Send notification
                var teamNames = await _context.Teams
                    .Where(t => request.TeamIds.Contains(t.TeamId))
                    .Select(t => t.TeamName)
                    .ToListAsync();
                string teamNamesStr = string.Join(", ", teamNames);
                string notifMessage = $"You have been assigned to manage/grade the following teams in {category.CategoryName} for {round.RoundName}: {teamNamesStr}.";
                await _notificationService.CreateAsync(request.JudgeId, "New Judge Assignment", notifMessage, "info");
            }
            else
            {
                // Category-wide assignment (TeamId is null)
                var assignment = new JudgeAssignment
                {
                    JudgeId = request.JudgeId,
                    RoundId = request.RoundId,
                    CategoryId = request.CategoryId,
                    TeamId = null
                };
                _context.JudgeAssignments.Add(assignment);

                // Send notification
                string notifMessage = $"You have been assigned to manage/grade all teams in {category.CategoryName} for {round.RoundName}.";
                await _notificationService.CreateAsync(request.JudgeId, "New Judge Assignment", notifMessage, "info");
            }

            await _context.SaveChangesAsync();

            return ServiceResult.Ok(new
            {
                message = "Judge assigned successfully."
            });
        }

        public async Task<ServiceResult> DeleteAssignmentAsync(Guid assignmentId)
        {
            var assignment = await _context.JudgeAssignments.FindAsync(assignmentId);

            if (assignment == null)
                return ServiceResult.NotFound("Assignment not found.");

            // Remove all assignments in this group (JudgeId, RoundId, CategoryId)
            var group = await _context.JudgeAssignments
                .Where(a => a.JudgeId == assignment.JudgeId && a.RoundId == assignment.RoundId && a.CategoryId == assignment.CategoryId)
                .ToListAsync();

            _context.JudgeAssignments.RemoveRange(group);
            await _context.SaveChangesAsync();

            return ServiceResult.OkMessage("Judge assignment removed successfully.");
        }
    }
}
