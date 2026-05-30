using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Team;
using SEAL.NET.Models.Entities;
using SEAL.NET.Models.Enums;
using System.Security.Claims;

namespace SEAL.NET.Controllers
{
    [Route("api/teams")]
    [ApiController]
    [Authorize]
    public class TeamsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public TeamsController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        private Guid GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.Parse(userId!);
        }

        [HttpPost]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> CreateTeam([FromBody] CreateTeamRequest request)
        {
            var leaderId = GetCurrentUserId();

            var leader = await _userManager.FindByIdAsync(leaderId.ToString());
            if (leader == null)
                return Unauthorized(new { message = "User not found." });

            if (!leader.IsApproved)
                return BadRequest(new { message = "Your account has not been approved yet." });

            var category = await _context.Categories
                .Include(c => c.Event)
                .FirstOrDefaultAsync(c => c.CategoryId == request.CategoryId);

            if (category == null)
                return NotFound(new { message = "Category not found." });

            var eventId = category.EventId;

            var allMemberIds = request.MemberIds
                .Append(leaderId)
                .Distinct()
                .ToList();

            if (allMemberIds.Count < 3 || allMemberIds.Count > 5)
                return BadRequest(new { message = "A team must have 3 to 5 members including the leader." });

            var existingUsers = await _context.Users
                .Where(u => allMemberIds.Contains(u.Id))
                .Select(u => u.Id)
                .ToListAsync();

            if (existingUsers.Count != allMemberIds.Count)
                return BadRequest(new { message = "One or more members do not exist." });

            var unapprovedUsers = await _context.Users
                .Where(u => allMemberIds.Contains(u.Id) && !u.IsApproved)
                .Select(u => u.Email)
                .ToListAsync();

            if (unapprovedUsers.Any())
                return BadRequest(new
                {
                    message = "One or more members have not been approved.",
                    users = unapprovedUsers
                });

            var categoryIdsInSameEvent = await _context.Categories
                .Where(c => c.EventId == eventId)
                .Select(c => c.CategoryId)
                .ToListAsync();

            var alreadyJoined = await _context.TeamMembers
                .Include(tm => tm.Team)
                .Where(tm =>
                    allMemberIds.Contains(tm.UserId) &&
                    categoryIdsInSameEvent.Contains(tm.Team!.CategoryId))
                .Select(tm => new
                {
                    tm.UserId,
                    tm.User!.Email,
                    tm.Team!.TeamName
                })
                .ToListAsync();

            if (alreadyJoined.Any())
                return BadRequest(new
                {
                    message = "One or more members already joined a team in this event.",
                    users = alreadyJoined
                });

            var duplicateTeamName = await _context.Teams.AnyAsync(t =>
                t.CategoryId == request.CategoryId &&
                t.TeamName.ToLower() == request.TeamName.ToLower());

            if (duplicateTeamName)
                return BadRequest(new { message = "Team name already exists in this category." });

            var firstRound = await _context.Rounds
                .Where(r => r.EventId == eventId)
                .OrderBy(r => r.RoundOrder)
                .FirstOrDefaultAsync();

            var team = new Team
            {
                TeamName = request.TeamName,
                LeaderId = leaderId,
                CategoryId = request.CategoryId,
                CurrentRoundId = firstRound?.RoundId,
                Status = TeamStatus.Pending
            };

            _context.Teams.Add(team);

            foreach (var memberId in allMemberIds)
            {
                _context.TeamMembers.Add(new TeamMember
                {
                    TeamId = team.TeamId,
                    UserId = memberId,
                    Role = memberId == leaderId ? "Leader" : "Member"
                });
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Team registered successfully and is waiting for approval.",
                teamId = team.TeamId,
                teamName = team.TeamName,
                status = team.Status.ToString()
            });
        }

        [HttpGet("my-team")]
        public async Task<IActionResult> GetMyTeam()
        {
            var userId = GetCurrentUserId();

            var team = await _context.TeamMembers
                .Where(tm => tm.UserId == userId)
                .Include(tm => tm.Team!)
                    .ThenInclude(t => t.Category)
                .Include(tm => tm.Team!)
                    .ThenInclude(t => t.CurrentRound)
                .Include(tm => tm.Team!)
                    .ThenInclude(t => t.Members)
                        .ThenInclude(m => m.User)
                .Select(tm => tm.Team)
                .FirstOrDefaultAsync();

            if (team == null)
                return NotFound(new { message = "You have not joined any team yet." });

            return Ok(new
            {
                team.TeamId,
                team.TeamName,
                status = team.Status.ToString(),
                leaderId = team.LeaderId,
                category = new
                {
                    team.Category!.CategoryId,
                    team.Category.CategoryName
                },
                currentRound = team.CurrentRound == null ? null : new
                {
                    team.CurrentRound.RoundId,
                    team.CurrentRound.RoundName
                },
                members = team.Members.Select(m => new
                {
                    m.UserId,
                    m.User!.FullName,
                    m.User.Email
                })
            });
        }

        [HttpPost("{teamId}/members")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> AddMember(Guid teamId, [FromBody] AddTeamMemberRequest request)
        {
            var currentUserId = GetCurrentUserId();

            var team = await _context.Teams
                .Include(t => t.Members)
                .Include(t => t.Category)
                .FirstOrDefaultAsync(t => t.TeamId == teamId);

            if (team == null)
                return NotFound(new { message = "Team not found." });

            if (team.LeaderId != currentUserId)
                return Forbid();

            if (team.Status != TeamStatus.Pending)
                return BadRequest(new { message = "Cannot modify members after team approval." });

            if (team.Members.Count >= 5)
                return BadRequest(new { message = "A team can have maximum 5 members." });

            var user = await _userManager.FindByIdAsync(request.UserId.ToString());
            if (user == null)
                return NotFound(new { message = "User not found." });

            if (!user.IsApproved)
                return BadRequest(new { message = "This user has not been approved yet." });

            var alreadyInTeam = team.Members.Any(m => m.UserId == request.UserId);
            if (alreadyInTeam)
                return BadRequest(new { message = "User is already in this team." });

            var eventId = team.Category!.EventId;

            var categoryIdsInSameEvent = await _context.Categories
                .Where(c => c.EventId == eventId)
                .Select(c => c.CategoryId)
                .ToListAsync();

            var alreadyJoinedEvent = await _context.TeamMembers
                .Include(tm => tm.Team)
                .AnyAsync(tm =>
                    tm.UserId == request.UserId &&
                    categoryIdsInSameEvent.Contains(tm.Team!.CategoryId));

            if (alreadyJoinedEvent)
                return BadRequest(new { message = "User already joined another team in this event." });

            _context.TeamMembers.Add(new TeamMember
            {
                TeamId = team.TeamId,
                UserId = request.UserId,
                Role = "Member"
            });

            await _context.SaveChangesAsync();

            return Ok(new { message = "Member added successfully." });
        }

        [HttpDelete("{teamId}/members/{userId}")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> RemoveMember(Guid teamId, Guid userId)
        {
            var currentUserId = GetCurrentUserId();

            var team = await _context.Teams
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.TeamId == teamId);

            if (team == null)
                return NotFound(new { message = "Team not found." });

            if (team.LeaderId != currentUserId)
                return Forbid();

            if (team.Status != TeamStatus.Pending)
                return BadRequest(new { message = "Cannot modify members after team approval." });

            if (team.LeaderId == userId)
                return BadRequest(new { message = "Leader cannot be removed from the team." });

            var member = team.Members.FirstOrDefault(m => m.UserId == userId);
            if (member == null)
                return NotFound(new { message = "Member not found in this team." });

            _context.TeamMembers.Remove(member);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Member removed successfully." });
        }
    }
}
