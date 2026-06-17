using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Team;
using SEAL.NET.Models.Enums;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class AdminTeamService : IAdminTeamService
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IAuditLogService _auditLogService;

        public AdminTeamService(
            ApplicationDbContext context,
            INotificationService notificationService,
            IAuditLogService auditLogService)
        {
            _context = context;
            _notificationService = notificationService;
            _auditLogService = auditLogService;
        }

        public async Task<ServiceResult> GetTeamsAsync()
        {
            var teams = await _context.Teams
                .Include(t => t.Category)
                .Include(t => t.CurrentRound)
                .Include(t => t.Members)
                    .ThenInclude(m => m.User)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    t.TeamId,
                    t.TeamName,
                    status = t.Status.ToString(),
                    category = new
                    {
                        t.Category!.CategoryId,
                        t.Category.CategoryName
                    },
                    currentRound = t.CurrentRound == null ? null : new
                    {
                        t.CurrentRound.RoundId,
                        t.CurrentRound.RoundName
                    },
                    members = t.Members.Select(m => new
                    {
                        m.UserId,
                        m.User!.FullName,
                        m.User.Email
                    })
                })
                .ToListAsync();

            return ServiceResult.Ok(teams);
        }

        public async Task<ServiceResult> ApproveTeamAsync(Guid? actorUserId, Guid teamId)
        {
            var team = await _context.Teams
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.TeamId == teamId);

            if (team == null)
                return ServiceResult.NotFound("Team not found.");

            if (team.Status == TeamStatus.Rejected || team.Status == TeamStatus.Eliminated)
                return ServiceResult.BadRequest("Cannot approve a team that has been rejected or eliminated.");

            if (team.Members.Count < 3 || team.Members.Count > 5)
                return ServiceResult.BadRequest("Team must have 3 to 5 members before approval.");

            team.Status = TeamStatus.Approved;

            await _context.SaveChangesAsync();
            await _notificationService.CreateForUsersAsync(
                team.Members.Select(m => m.UserId),
                "Team approved",
                $"Team {team.TeamName} has been approved.",
                "team");
            await _auditLogService.LogAsync(
                actorUserId,
                "approve_team",
                "Team",
                team.TeamId.ToString(),
                $"Approved team {team.TeamName}.");

            return ServiceResult.OkMessage("Team approved successfully.");
        }

        public async Task<ServiceResult> RejectTeamAsync(Guid? actorUserId, Guid teamId)
        {
            var team = await _context.Teams
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.TeamId == teamId);

            if (team == null)
                return ServiceResult.NotFound("Team not found.");

            team.Status = TeamStatus.Rejected;

            await _context.SaveChangesAsync();
            await _notificationService.CreateForUsersAsync(
                team.Members.Select(m => m.UserId),
                "Team rejected",
                $"Team {team.TeamName} was rejected.",
                "team");
            await _auditLogService.LogAsync(
                actorUserId,
                "reject_team",
                "Team",
                team.TeamId.ToString(),
                $"Rejected team {team.TeamName}.");

            return ServiceResult.OkMessage("Team rejected successfully.");
        }

        public async Task<ServiceResult> EliminateTeamAsync(Guid? actorUserId, Guid teamId, EliminateTeamRequest request)
        {
            var team = await _context.Teams
                .Include(t => t.Category)
                .Include(t => t.CurrentRound)
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.TeamId == teamId);

            if (team == null)
                return ServiceResult.NotFound("Team not found.");

            if (team.Status == TeamStatus.Eliminated)
                return ServiceResult.BadRequest("Team is already eliminated.");

            if (team.Status != TeamStatus.Approved &&
                team.Status != TeamStatus.Active &&
                team.Status != TeamStatus.Champion)
                return ServiceResult.BadRequest("Only an approved team that is still in the competition can be eliminated.");

            team.Status = TeamStatus.Eliminated;
            team.EliminationReason = request.Reason;
            team.EliminatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await _notificationService.CreateForUsersAsync(
                team.Members.Select(m => m.UserId),
                "Team eliminated",
                $"Team {team.TeamName} was eliminated. Reason: {request.Reason}",
                "team");
            await _auditLogService.LogAsync(
                actorUserId,
                "eliminate_team",
                "Team",
                team.TeamId.ToString(),
                $"Eliminated team {team.TeamName}. Reason: {request.Reason}");

            return ServiceResult.Ok(new
            {
                message = "Team eliminated successfully.",
                team = new
                {
                    team.TeamId,
                    team.TeamName,
                    status = team.Status.ToString(),
                    team.EliminationReason,
                    team.EliminatedAt,
                    category = team.Category == null ? null : new
                    {
                        team.Category.CategoryId,
                        team.Category.CategoryName
                    },
                    currentRound = team.CurrentRound == null ? null : new
                    {
                        team.CurrentRound.RoundId,
                        team.CurrentRound.RoundName
                    }
                }
            });
        }
    }
}
