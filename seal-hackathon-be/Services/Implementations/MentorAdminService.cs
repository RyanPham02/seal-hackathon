using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Team;
using SEAL.NET.Models.Entities;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class MentorAdminService : IMentorAdminService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly INotificationService _notificationService;

        public MentorAdminService(
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
            var assignments = await _context.MentorAssignments
                .Include(ma => ma.Mentor)
                .Include(ma => ma.Team)
                .Include(ma => ma.AssignedBy)
                .OrderByDescending(ma => ma.AssignedAt)
                .Select(ma => new MentorAssignmentResponseDto
                {
                    Id = ma.Id,
                    MentorUserId = ma.MentorUserId,
                    MentorName = ma.Mentor.FullName,
                    MentorEmail = ma.Mentor.Email ?? string.Empty,
                    TeamId = ma.TeamId,
                    TeamName = ma.Team.TeamName,
                    AssignedByName = ma.AssignedBy != null ? ma.AssignedBy.FullName : "System",
                    AssignedAt = ma.AssignedAt,
                    IsActive = ma.IsActive
                })
                .ToListAsync();

            return ServiceResult.Ok(assignments);
        }

        public async Task<ServiceResult> AssignMentorAsync(Guid actorUserId, AssignMentorRequest request)
        {
            var mentor = await _userManager.FindByIdAsync(request.MentorUserId.ToString());
            if (mentor == null)
                return ServiceResult.NotFound("Mentor user not found.");

            if (!mentor.IsApproved)
                return ServiceResult.BadRequest("This mentor's account is disabled or not allowed to access.");

            var isMentor = await _userManager.IsInRoleAsync(mentor, "Mentor");
            if (!isMentor)
                return ServiceResult.BadRequest("Selected user does not have the Mentor role.");

            var team = await _context.Teams
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.TeamId == request.TeamId);

            if (team == null)
                return ServiceResult.NotFound("Team not found.");

            var duplicate = await _context.MentorAssignments
                .AnyAsync(ma => ma.MentorUserId == request.MentorUserId && ma.TeamId == request.TeamId && ma.IsActive);

            if (duplicate)
                return ServiceResult.BadRequest("This mentor is already actively assigned to this team.");

            var assignment = new MentorAssignment
            {
                MentorUserId = request.MentorUserId,
                TeamId = request.TeamId,
                AssignedByUserId = actorUserId,
                IsActive = true,
                AssignedAt = DateTime.UtcNow
            };

            _context.MentorAssignments.Add(assignment);
            await _context.SaveChangesAsync();

            // Notify mentor
            try
            {
                await _notificationService.CreateAsync(
                    mentor.Id,
                    "Mentor Assignment",
                    $"You have been assigned to mentor team {team.TeamName}.",
                    "team"
                );
            }
            catch { }

            // Notify team leader
            try
            {
                await _notificationService.CreateAsync(
                    team.LeaderId,
                    "Mentor Assigned",
                    $"{mentor.FullName} has been assigned as your team's mentor.",
                    "team"
                );
            }
            catch { }

            return ServiceResult.OkMessage("Mentor assigned successfully.");
        }

        public async Task<ServiceResult> DeactivateAssignmentAsync(Guid id)
        {
            var assignment = await _context.MentorAssignments.FirstOrDefaultAsync(ma => ma.Id == id);
            if (assignment == null)
                return ServiceResult.NotFound("Assignment not found.");

            if (!assignment.IsActive)
                return ServiceResult.BadRequest("Assignment is already inactive.");

            assignment.IsActive = false;
            await _context.SaveChangesAsync();

            return ServiceResult.OkMessage("Assignment deactivated successfully.");
        }
    }
}
