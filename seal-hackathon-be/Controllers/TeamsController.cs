using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Team;
using SEAL.NET.Models.Entities;
using SEAL.NET.Models.Enums;
using SEAL.NET.Services.Interfaces;
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
        private readonly INotificationService _notificationService;

        public TeamsController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            INotificationService notificationService)
        {
            _context = context;
            _userManager = userManager;
            _notificationService = notificationService;
        }

        private Guid? TryGetCurrentUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(raw, out var id) ? id : null;
        }

        private Guid GetCurrentUserId() => TryGetCurrentUserId() ?? Guid.Empty;

        private async Task<Team?> GetCurrentUserTeamAsync(Guid userId)
        {
            return await _context.TeamMembers
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
        }

        private async Task<ApplicationUser?> FindUserByStudentCodeOrEmailAsync(string studentCodeOrEmail)
        {
            var normalized = studentCodeOrEmail.Trim().ToLower();

            var matches = await _context.Users
                .Where(u =>
                (u.StudentCode != null && u.StudentCode.ToLower() == normalized) ||
                (u.Email != null && u.Email.ToLower() == normalized))
                .Take(2)
                .ToListAsync();

            if (matches.Count > 1)
                throw new InvalidOperationException("More than one user matches this student code or email. Please contact an administrator.");

            return matches.FirstOrDefault();
        }

        private async Task<IActionResult?> ValidateCanAddMemberAsync(Team team, Guid currentUserId, ApplicationUser user)
        {
            if (team.LeaderId != currentUserId)
                return Forbid();

            if (team.Status != TeamStatus.Pending)
                return BadRequest(new { message = "Cannot modify members after team approval." });

            if (team.Members.Count >= 5)
                return BadRequest(new { message = "A team can have maximum 5 members." });

            if (user.Id == currentUserId)
                return BadRequest(new { message = "You cannot add yourself to your own team." });

            if (!user.IsApproved)
                return BadRequest(new { message = "This user's account is disabled or not allowed to access." });

            var alreadyInTeam = team.Members.Any(m => m.UserId == user.Id);
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
                    tm.UserId == user.Id &&
                    categoryIdsInSameEvent.Contains(tm.Team!.CategoryId));

            if (alreadyJoinedEvent)
                return BadRequest(new { message = "User already joined another team in this event." });

            return null;
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
                return BadRequest(new { message = "Your account is disabled or not allowed to access." });

            var category = await _context.Categories
                .Include(c => c.Event)
                .FirstOrDefaultAsync(c => c.CategoryId == request.CategoryId);

            if (category == null)
                return NotFound(new { message = "Category not found." });

            var eventId = category.EventId;

            var memberIdsFromCodes = new List<Guid>();
            var memberCodes = request.MemberStudentCodesOrEmails
                .Concat(request.MemberStudentCodes)
                .Where(code => !string.IsNullOrWhiteSpace(code))
                .Distinct(StringComparer.OrdinalIgnoreCase);

            foreach (var memberCode in memberCodes)
            {
                ApplicationUser? member;
                try
                {
                    member = await FindUserByStudentCodeOrEmailAsync(memberCode);
                }
                catch (InvalidOperationException ex)
                {
                    return BadRequest(new { message = ex.Message });
                }

                if (member == null)
                    return BadRequest(new { message = $"No active user found for student code or email: {memberCode}." });

                memberIdsFromCodes.Add(member.Id);
            }

            var allMemberIds = request.MemberIds
                .Concat(memberIdsFromCodes)
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
                    message = "One or more members' accounts are disabled or not allowed to access.",
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

            var team = await GetCurrentUserTeamAsync(userId);

            if (team == null)
                return NotFound(new { message = "You have not joined any team yet." });

            var activeMentor = await _context.MentorAssignments
                .Where(ma => ma.TeamId == team.TeamId && ma.IsActive)
                .Include(ma => ma.Mentor)
                .Select(ma => ma.Mentor)
                .FirstOrDefaultAsync();

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
                    m.User.Email,
                    m.User.StudentCode,
                    m.Role
                }),
                mentor = activeMentor == null ? null : new
                {
                    id = activeMentor.Id,
                    fullName = activeMentor.FullName,
                    email = activeMentor.Email,
                    schoolName = activeMentor.SchoolName
                }
            });
        }

        [HttpPost("my-team/members")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> AddMemberToMyTeam([FromBody] AddTeamMemberByStudentCodeRequest request)
        {
            var currentUserId = GetCurrentUserId();
            var team = await GetCurrentUserTeamAsync(currentUserId);

            if (team == null)
                return NotFound(new { message = "You have not joined any team yet." });

            ApplicationUser? user;
            try
            {
                user = await FindUserByStudentCodeOrEmailAsync(request.StudentCodeOrEmail);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }

            if (user == null)
                return NotFound(new { message = "No active user found for that student code or email." });

            var validationResult = await ValidateCanAddMemberAsync(team, currentUserId, user);
            if (validationResult != null)
                return validationResult;

            _context.TeamMembers.Add(new TeamMember
            {
                TeamId = team.TeamId,
                UserId = user.Id,
                Role = "Member"
            });

            await _context.SaveChangesAsync();
            await _notificationService.CreateAsync(
                user.Id,
                "Added to team",
                $"You were added to team {team.TeamName}.",
                "team");

            return Ok(new { message = "Member added successfully." });
        }

        [HttpDelete("my-team/members/{studentCode}")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> RemoveMemberFromMyTeam(string studentCode)
        {
            var currentUserId = GetCurrentUserId();
            var team = await GetCurrentUserTeamAsync(currentUserId);

            if (team == null)
                return NotFound(new { message = "You have not joined any team yet." });

            if (team.LeaderId != currentUserId)
                return Forbid();

            if (team.Status != TeamStatus.Pending)
                return BadRequest(new { message = "Cannot modify members after team approval." });

            ApplicationUser? user;
            try
            {
                user = await FindUserByStudentCodeOrEmailAsync(studentCode);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }

            if (user == null)
                return NotFound(new { message = "User not found." });

            if (team.LeaderId == user.Id)
                return BadRequest(new { message = "Leader cannot be removed from the team." });

            var member = team.Members.FirstOrDefault(m => m.UserId == user.Id);
            if (member == null)
                return NotFound(new { message = "Member not found in this team." });

            _context.TeamMembers.Remove(member);
            await _context.SaveChangesAsync();
            await _notificationService.CreateAsync(
                user.Id,
                "Removed from team",
                $"You were removed from team {team.TeamName}.",
                "team");

            return Ok(new { message = "Member removed successfully." });
        }

        [HttpPost("leave")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> LeaveTeam()
        {
            var currentUserId = GetCurrentUserId();
            var team = await GetCurrentUserTeamAsync(currentUserId);

            if (team == null)
                return NotFound(new { message = "You have not joined any team yet." });

            if (team.LeaderId == currentUserId && team.Members.Count > 1)
                return BadRequest(new { message = "Team leader must transfer leadership or remove other members before leaving." });

            var membership = team.Members.FirstOrDefault(m => m.UserId == currentUserId);
            if (membership == null)
                return NotFound(new { message = "Team membership not found." });

            if (team.LeaderId == currentUserId && team.Members.Count == 1)
            {
                _context.Teams.Remove(team);
            }
            else
            {
                _context.TeamMembers.Remove(membership);
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "You have left the team." });
        }

        [HttpPut("my-team")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> UpdateMyTeam([FromBody] UpdateMyTeamRequest request)
        {
            var currentUserId = GetCurrentUserId();
            var team = await GetCurrentUserTeamAsync(currentUserId);

            if (team == null)
                return NotFound(new { message = "You have not joined any team yet." });

            if (team.LeaderId != currentUserId)
                return Forbid();

            if (team.Status != TeamStatus.Pending)
                return BadRequest(new { message = "Cannot modify team after approval." });

            var duplicateTeamName = await _context.Teams.AnyAsync(t =>
                t.TeamId != team.TeamId &&
                t.CategoryId == team.CategoryId &&
                t.TeamName.ToLower() == request.TeamName.ToLower());

            if (duplicateTeamName)
                return BadRequest(new { message = "Team name already exists in this category." });

            team.TeamName = request.TeamName.Trim();
            await _context.SaveChangesAsync();

            return Ok(new { message = "Team updated successfully." });
        }

        [HttpPut("transfer-leader")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> TransferLeader([FromBody] TransferLeaderRequest request)
        {
            var currentUserId = GetCurrentUserId();
            var team = await GetCurrentUserTeamAsync(currentUserId);

            if (team == null)
                return NotFound(new { message = "You have not joined any team yet." });

            if (team.LeaderId != currentUserId)
                return Forbid();

            if (team.Status != TeamStatus.Pending)
                return BadRequest(new { message = "Cannot transfer leader after team approval." });

            ApplicationUser? newLeader;
            try
            {
                newLeader = await FindUserByStudentCodeOrEmailAsync(request.NewLeaderStudentCodeOrEmail);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }

            if (newLeader == null)
                return NotFound(new { message = "No team member found for that student code or email." });

            var newLeaderMembership = team.Members.FirstOrDefault(m => m.UserId == newLeader.Id);
            if (newLeaderMembership == null)
                return BadRequest(new { message = "New leader must be an existing team member." });

            var currentLeaderMembership = team.Members.FirstOrDefault(m => m.UserId == currentUserId);
            if (currentLeaderMembership != null)
                currentLeaderMembership.Role = "Member";

            newLeaderMembership.Role = "Leader";
            team.LeaderId = newLeader.Id;

            await _context.SaveChangesAsync();
            await _notificationService.CreateAsync(
                newLeader.Id,
                "Team leadership transferred",
                $"You are now the leader of team {team.TeamName}.",
                "team");

            return Ok(new { message = "Team leader transferred successfully." });
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

            var user = await _userManager.FindByIdAsync(request.UserId.ToString());
            if (user == null)
                return NotFound(new { message = "User not found." });

            var validationResult = await ValidateCanAddMemberAsync(team, currentUserId, user);
            if (validationResult != null)
                return validationResult;

            _context.TeamMembers.Add(new TeamMember
            {
                TeamId = team.TeamId,
                UserId = request.UserId,
                Role = "Member"
            });

            await _context.SaveChangesAsync();
            await _notificationService.CreateAsync(
                user.Id,
                "Added to team",
                $"You were added to team {team.TeamName}.",
                "team");

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
            await _notificationService.CreateAsync(
                userId,
                "Removed from team",
                $"You were removed from team {team.TeamName}.",
                "team");

            return Ok(new { message = "Member removed successfully." });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTeamById(Guid id)
        {
            var userId = GetCurrentUserId();
            var isAdminOrJudgeOrMentor = User.IsInRole("Admin") || User.IsInRole("Judge") || User.IsInRole("Mentor");

            var team = await _context.Teams
                .Include(t => t.Category)
                    .ThenInclude(c => c.Event)
                .Include(t => t.CurrentRound)
                .Include(t => t.Members)
                    .ThenInclude(m => m.User)
                .Include(t => t.Submissions)
                    .ThenInclude(s => s.Round)
                .FirstOrDefaultAsync(t => t.TeamId == id);

            if (team == null)
                return NotFound(new { message = "Team not found." });

            var isMember = team.Members.Any(m => m.UserId == userId);
            if (!isMember && !isAdminOrJudgeOrMentor)
                return Forbid();

            var activeMentor = await _context.MentorAssignments
                .Where(ma => ma.TeamId == team.TeamId && ma.IsActive)
                .Include(ma => ma.Mentor)
                .Select(ma => ma.Mentor)
                .FirstOrDefaultAsync();

            return Ok(new
            {
                team.TeamId,
                team.TeamName,
                status = team.Status.ToString(),
                registeredAt = team.CreatedAt.ToString("MMM dd, yyyy"),
                category = new
                {
                    team.Category!.CategoryId,
                    team.Category.CategoryName,
                    eventId = team.Category.EventId,
                    eventName = team.Category.Event!.EventName
                },
                currentRound = team.CurrentRound == null ? null : new
                {
                    team.CurrentRound.RoundId,
                    team.CurrentRound.RoundName
                },
                members = team.Members.Select(m => new
                {
                    id = m.UserId,
                    name = m.User!.FullName,
                    email = m.User.Email,
                    role = m.Role,
                    studentCode = m.User.StudentCode,
                    schoolName = m.User.SchoolName,
                    joined = m.User.CreatedAt.ToString("MMM dd")
                }),
                submissions = team.Submissions.Select(s => new
                {
                    s.SubmissionId,
                    s.RepositoryUrl,
                    s.DemoUrl,
                    s.SlideUrl,
                    s.SubmittedAt,
                    roundName = s.Round!.RoundName
                }),
                mentor = activeMentor == null ? null : new
                {
                    id = activeMentor.Id,
                    fullName = activeMentor.FullName,
                    email = activeMentor.Email,
                    schoolName = activeMentor.SchoolName
                }
            });
        }

        [HttpGet("mentors")]
        public async Task<IActionResult> GetMentors()
        {
            var mentorRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Mentor");
            if (mentorRole == null)
                return Ok(new List<object>());

            var mentorUserIds = await _context.UserRoles
                .Where(ur => ur.RoleId == mentorRole.Id)
                .Select(ur => ur.UserId)
                .ToListAsync();

            var mentors = await _context.Users
                .Where(u => mentorUserIds.Contains(u.Id) && u.IsApproved)
                .Select(u => new
                {
                    id = u.Id,
                    fullName = u.FullName,
                    email = u.Email,
                    schoolName = u.SchoolName
                })
                .ToListAsync();

            return Ok(mentors);
        }

        [HttpPost("my-team/mentor")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> AssignMentorToMyTeam([FromBody] ChooseMentorRequest request)
        {
            var currentUserId = GetCurrentUserId();
            var team = await GetCurrentUserTeamAsync(currentUserId);

            if (team == null)
                return NotFound(new { message = "You have not joined any team yet." });

            if (team.LeaderId != currentUserId)
                return Forbid();

            if (team.Status != TeamStatus.Pending)
                return BadRequest(new { message = "Cannot modify team after approval." });

            var mentor = await _userManager.FindByIdAsync(request.MentorUserId.ToString());
            if (mentor == null)
                return NotFound(new { message = "Mentor user not found." });

            if (!mentor.IsApproved)
                return BadRequest(new { message = "This mentor's account is disabled." });

            var isMentor = await _userManager.IsInRoleAsync(mentor, "Mentor");
            if (!isMentor)
                return BadRequest(new { message = "Selected user is not a mentor." });

            // Deactivate any existing active mentor assignments for this team
            var activeAssignments = await _context.MentorAssignments
                .Where(ma => ma.TeamId == team.TeamId && ma.IsActive)
                .ToListAsync();

            foreach (var ma in activeAssignments)
            {
                ma.IsActive = false;
            }

            var assignment = new MentorAssignment
            {
                MentorUserId = request.MentorUserId,
                TeamId = team.TeamId,
                AssignedByUserId = currentUserId,
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
                    $"You have been selected to mentor team {team.TeamName}.",
                    "team"
                );
            }
            catch { }

            return Ok(new { message = "Mentor selected successfully." });
        }

        [HttpDelete("my-team/mentor")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> RemoveMentorFromMyTeam()
        {
            var currentUserId = GetCurrentUserId();
            var team = await GetCurrentUserTeamAsync(currentUserId);

            if (team == null)
                return NotFound(new { message = "You have not joined any team yet." });

            if (team.LeaderId != currentUserId)
                return Forbid();

            if (team.Status != TeamStatus.Pending)
                return BadRequest(new { message = "Cannot modify team after approval." });

            var activeAssignments = await _context.MentorAssignments
                .Where(ma => ma.TeamId == team.TeamId && ma.IsActive)
                .ToListAsync();

            if (!activeAssignments.Any())
                return BadRequest(new { message = "Your team does not have a mentor assigned." });

            foreach (var ma in activeAssignments)
            {
                ma.IsActive = false;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Mentor removed successfully." });
        }
    }
}
