using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Team;
using SEAL.NET.Models.Entities;
using SEAL.NET.Models.Enums;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class MatchmakingService : IMatchmakingService
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;

        public MatchmakingService(ApplicationDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        private async Task<Team?> GetCurrentUserTeamAsync(Guid userId)
        {
            return await _context.TeamMembers
                .Where(tm => tm.UserId == userId)
                .Include(tm => tm.Team!)
                    .ThenInclude(t => t.Category)
                .Include(tm => tm.Team!)
                    .ThenInclude(t => t.Members)
                        .ThenInclude(m => m.User)
                .Select(tm => tm.Team)
                .FirstOrDefaultAsync();
        }

        private static (string Role, List<string> Skills, int Xp) GetDeterministicDetails(Guid userId, string fullName)
        {
            int hash = Math.Abs(userId.GetHashCode());
            string[] roles = ["Frontend Developer", "Backend Developer", "UI/UX Designer", "AI Engineer", "Web3 Developer", "Fullstack Developer"];

            List<string>[] skills = [
                new List<string> {"React", "TypeScript", "Tailwind CSS", "Next.js", "Redux"},
                new List<string> {"Node.js", "Express", "ASP.NET Core", "SQL Server", "Docker"},
                new List<string> {"Figma", "UI/UX Design", "Wireframing", "Prototyping", "User Research"},
                new List<string> {"Python", "PyTorch", "NLP", "Machine Learning", "OpenAI"},
                new List<string> {"Solidity", "Rust", "Smart Contracts", "Cryptography", "Ether.js"},
                new List<string> {"Vue.js", "NestJS", "PostgreSQL", "AWS", "GraphQL"}
            ];

            int roleIdx = hash % roles.Length;
            string role = roles[roleIdx];
            List<string> userSkills = skills[roleIdx];
            int xp = 1000 + (hash % 1000);

            return (role, userSkills, xp);
        }

        public async Task<ServiceResult> GetFreeAgentsAsync(Guid? eventId, Guid? categoryId, string? search, string? role)
        {
            var nonMemberRoles = await _context.Roles
                .Where(r => r.Name == "Admin" || r.Name == "Judge" || r.Name == "Mentor")
                .Select(r => r.Id)
                .ToListAsync();

            var nonMemberUserIds = await _context.UserRoles
                .Where(ur => nonMemberRoles.Contains(ur.RoleId))
                .Select(ur => ur.UserId)
                .ToListAsync();

            var query = _context.Users.Where(u => u.IsApproved && !nonMemberUserIds.Contains(u.Id));

            if (categoryId != null && categoryId != Guid.Empty)
            {
                var eventOfCategory = await _context.Categories
                    .Where(c => c.CategoryId == categoryId)
                    .Select(c => c.EventId)
                    .FirstOrDefaultAsync();

                if (eventOfCategory != Guid.Empty)
                {
                    var categoryIdsInEvent = await _context.Categories
                        .Where(c => c.EventId == eventOfCategory)
                        .Select(c => c.CategoryId)
                        .ToListAsync();

                    var usersInEventTeams = await _context.TeamMembers
                        .Include(tm => tm.Team)
                        .Where(tm => categoryIdsInEvent.Contains(tm.Team!.CategoryId))
                        .Select(tm => tm.UserId)
                        .ToListAsync();

                    query = query.Where(u => !usersInEventTeams.Contains(u.Id));
                }
            }
            else if (eventId != null && eventId != Guid.Empty)
            {
                var categoryIdsInEvent = await _context.Categories
                    .Where(c => c.EventId == eventId)
                    .Select(c => c.CategoryId)
                    .ToListAsync();

                var usersInEventTeams = await _context.TeamMembers
                    .Include(tm => tm.Team)
                    .Where(tm => categoryIdsInEvent.Contains(tm.Team!.CategoryId))
                    .Select(tm => tm.UserId)
                    .ToListAsync();

                query = query.Where(u => !usersInEventTeams.Contains(u.Id));
            }
            else
            {
                var usersInTeams = await _context.TeamMembers.Select(tm => tm.UserId).ToListAsync();
                query = query.Where(u => !usersInTeams.Contains(u.Id));
            }

            var users = await query.ToListAsync();
            var dtoList = users.Select(u =>
            {
                var details = GetDeterministicDetails(u.Id, u.FullName);
                return new FreeAgentDto
                {
                    Id = u.Id,
                    Name = u.FullName,
                    Email = u.Email ?? string.Empty,
                    StudentCode = u.StudentCode,
                    SchoolName = u.SchoolName,
                    StudentType = u.StudentType?.ToString() ?? "External",
                    Role = details.Role,
                    Skills = details.Skills,
                    Xp = details.Xp
                };
            });

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                dtoList = dtoList.Where(d =>
                    d.Name.ToLower().Contains(searchLower) ||
                    d.Email.ToLower().Contains(searchLower) ||
                    (d.StudentCode != null && d.StudentCode.ToLower().Contains(searchLower)) ||
                    (d.SchoolName != null && d.SchoolName.ToLower().Contains(searchLower)) ||
                    d.Skills.Any(s => s.ToLower().Contains(searchLower))
                );
            }

            if (!string.IsNullOrWhiteSpace(role))
            {
                var roleLower = role.ToLower();
                dtoList = dtoList.Where(d => d.Role.ToLower().Contains(roleLower) || d.Skills.Any(s => s.ToLower().Contains(roleLower)));
            }

            return ServiceResult.Ok(dtoList.ToList());
        }

        public async Task<ServiceResult> GetSuggestionsAsync(Guid userId)
        {
            var team = await GetCurrentUserTeamAsync(userId);

            var nonMemberRoles = await _context.Roles
                .Where(r => r.Name == "Admin" || r.Name == "Judge" || r.Name == "Mentor")
                .Select(r => r.Id)
                .ToListAsync();

            var nonMemberUserIds = await _context.UserRoles
                .Where(ur => nonMemberRoles.Contains(ur.RoleId))
                .Select(ur => ur.UserId)
                .ToListAsync();

            var membersInTeams = await _context.TeamMembers.Select(tm => tm.UserId).ToListAsync();
            var freeAgentsQuery = _context.Users.Where(u => !membersInTeams.Contains(u.Id) && !nonMemberUserIds.Contains(u.Id) && u.IsApproved);
            var freeAgents = await freeAgentsQuery.ToListAsync();

            if (team == null)
            {
                var defaultList = freeAgents.Take(10).Select(u =>
                {
                    var details = GetDeterministicDetails(u.Id, u.FullName);
                    return new MatchmakingSuggestionDto
                    {
                        Id = u.Id,
                        Name = u.FullName,
                        Email = u.Email ?? string.Empty,
                        Role = details.Role,
                        Skills = details.Skills,
                        Xp = details.Xp,
                        MatchPercentage = 80,
                        MatchReasons = ["Highly active user available for any team"]
                    };
                }).ToList();

                return ServiceResult.Ok(defaultList);
            }

            var teamMemberRoles = team.Members.Select(m =>
            {
                var details = GetDeterministicDetails(m.UserId, m.User!.FullName);
                return details.Role;
            }).ToList();

            var allRolesList = new List<string> { "Frontend Developer", "Backend Developer", "UI/UX Designer", "AI Engineer", "Web3 Developer" };
            var missingRoles = allRolesList.Where(r => !teamMemberRoles.Contains(r)).ToList();

            var suggestions = freeAgents.Select(u =>
            {
                var details = GetDeterministicDetails(u.Id, u.FullName);
                int matchPercentage = 60;
                var matchReasons = new List<string>();

                if (missingRoles.Contains(details.Role))
                {
                    matchPercentage += 25;
                    matchReasons.Add($"Your team lacks a {details.Role}");
                }

                if (team.Members.Any(m => m.User!.SchoolName != null && m.User.SchoolName.Equals(u.SchoolName, StringComparison.OrdinalIgnoreCase)))
                {
                    matchPercentage += 10;
                    matchReasons.Add($"Same university ({u.SchoolName})");
                }

                if (details.Xp > 1500)
                {
                    matchPercentage += 4;
                    matchReasons.Add("Experienced developer (High XP)");
                }

                if (matchPercentage > 99) matchPercentage = 99;

                return new MatchmakingSuggestionDto
                {
                    Id = u.Id,
                    Name = u.FullName,
                    Email = u.Email ?? string.Empty,
                    Role = details.Role,
                    Skills = details.Skills,
                    Xp = details.Xp,
                    MatchPercentage = matchPercentage,
                    MatchReasons = matchReasons
                };
            })
            .OrderByDescending(s => s.MatchPercentage)
            .Take(10)
            .ToList();

            return ServiceResult.Ok(suggestions);
        }

        public async Task<ServiceResult> CreateInvitationAsync(Guid? currentUserIdRaw, CreateInvitationRequest request)
        {
            if (currentUserIdRaw == null) return ServiceResult.Unauthorized("Invalid authentication token.");
            var currentUserId = currentUserIdRaw.Value;
            var team = await GetCurrentUserTeamAsync(currentUserId);

            if (team == null)
                return ServiceResult.NotFound("You have not joined any team yet.");

            if (team.LeaderId != currentUserId)
                return ServiceResult.BadRequest("Only the team leader can invite members.");

            if (team.Status != TeamStatus.Pending)
                return ServiceResult.BadRequest("Cannot modify members after team approval.");

            if (team.Members.Count >= 5)
                return ServiceResult.BadRequest("Your team is already full (maximum 5 members).");

            ApplicationUser? invitee = null;
            if (request.InviteeUserId != null && request.InviteeUserId != Guid.Empty)
            {
                invitee = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.InviteeUserId);
            }
            else if (!string.IsNullOrWhiteSpace(request.StudentCodeOrEmail))
            {
                var normalized = request.StudentCodeOrEmail.Trim().ToLower();
                invitee = await _context.Users.FirstOrDefaultAsync(u =>
                    (u.StudentCode != null && u.StudentCode.ToLower() == normalized) ||
                    (u.Email != null && u.Email.ToLower() == normalized));
            }

            if (invitee == null)
                return ServiceResult.NotFound("Invitee user not found.");

            if (!invitee.IsApproved)
                return ServiceResult.BadRequest("This user's account is disabled or not allowed to access.");

            if (invitee.Id == currentUserId)
                return ServiceResult.BadRequest("You cannot invite yourself.");

            var eventId = team.Category!.EventId;
            var categoryIdsInSameEvent = await _context.Categories
                .Where(c => c.EventId == eventId)
                .Select(c => c.CategoryId)
                .ToListAsync();

            var alreadyJoinedEvent = await _context.TeamMembers
                .Include(tm => tm.Team)
                .AnyAsync(tm =>
                    tm.UserId == invitee.Id &&
                    categoryIdsInSameEvent.Contains(tm.Team!.CategoryId));

            if (alreadyJoinedEvent)
                return ServiceResult.BadRequest("User already joined another team in this event.");

            var existingPending = await _context.TeamInvitations
                .AnyAsync(ti => ti.TeamId == team.TeamId && ti.InviteeUserId == invitee.Id && ti.Status == InvitationStatus.Pending);

            if (existingPending)
                return ServiceResult.BadRequest("You have already sent a pending invitation to this user.");

            var invitation = new TeamInvitation
            {
                TeamId = team.TeamId,
                InviterUserId = currentUserId,
                InviteeUserId = invitee.Id,
                Status = InvitationStatus.Pending,
                Message = request.Message?.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.TeamInvitations.Add(invitation);
            await _context.SaveChangesAsync();

            try
            {
                await _notificationService.CreateAsync(
                    invitee.Id,
                    "Team Invitation",
                    $"You have been invited to join team {team.TeamName}.",
                    "team"
                );
            }
            catch { }

            return ServiceResult.OkMessage("Invitation sent successfully.");
        }

        public async Task<ServiceResult> GetSentInvitationsAsync(Guid? currentUserIdRaw)
        {
            if (currentUserIdRaw == null) return ServiceResult.Unauthorized("Invalid authentication token.");
            var currentUserId = currentUserIdRaw.Value;
            var team = await GetCurrentUserTeamAsync(currentUserId);

            IQueryable<TeamInvitation> query = _context.TeamInvitations
                .Include(ti => ti.Team)
                .Include(ti => ti.InviteeUser)
                .Include(ti => ti.InviterUser);

            if (team != null)
            {
                query = query.Where(ti => ti.TeamId == team.TeamId);
            }
            else
            {
                query = query.Where(ti => ti.InviterUserId == currentUserId);
            }

            var sent = await query
                .OrderByDescending(ti => ti.CreatedAt)
                .Select(ti => new InvitationResponseDto
                {
                    Id = ti.Id,
                    TeamId = ti.TeamId,
                    TeamName = ti.Team.TeamName,
                    InviterUserId = ti.InviterUserId,
                    InviterUserName = ti.InviterUser.FullName,
                    InviteeUserId = ti.InviteeUserId,
                    InviteeUserName = ti.InviteeUser.FullName,
                    InviteeUserEmail = ti.InviteeUser.Email ?? string.Empty,
                    Status = ti.Status.ToString(),
                    Message = ti.Message,
                    CreatedAt = ti.CreatedAt,
                    RespondedAt = ti.RespondedAt
                })
                .ToListAsync();

            return ServiceResult.Ok(sent);
        }

        public async Task<ServiceResult> GetReceivedInvitationsAsync(Guid? currentUserIdRaw)
        {
            if (currentUserIdRaw == null) return ServiceResult.Unauthorized("Invalid authentication token.");
            var currentUserId = currentUserIdRaw.Value;

            var received = await _context.TeamInvitations
                .Include(ti => ti.Team)
                .Include(ti => ti.InviteeUser)
                .Include(ti => ti.InviterUser)
                .Where(ti => ti.InviteeUserId == currentUserId)
                .OrderByDescending(ti => ti.CreatedAt)
                .Select(ti => new InvitationResponseDto
                {
                    Id = ti.Id,
                    TeamId = ti.TeamId,
                    TeamName = ti.Team.TeamName,
                    InviterUserId = ti.InviterUserId,
                    InviterUserName = ti.InviterUser.FullName,
                    InviteeUserId = ti.InviteeUserId,
                    InviteeUserName = ti.InviteeUser.FullName,
                    InviteeUserEmail = ti.InviteeUser.Email ?? string.Empty,
                    Status = ti.Status.ToString(),
                    Message = ti.Message,
                    CreatedAt = ti.CreatedAt,
                    RespondedAt = ti.RespondedAt
                })
                .ToListAsync();

            return ServiceResult.Ok(received);
        }

        public async Task<ServiceResult> AcceptInvitationAsync(Guid? currentUserIdRaw, Guid id)
        {
            if (currentUserIdRaw == null) return ServiceResult.Unauthorized("Invalid authentication token.");
            var currentUserId = currentUserIdRaw.Value;

            var invitation = await _context.TeamInvitations
                .Include(ti => ti.Team)
                    .ThenInclude(t => t.Category)
                .Include(ti => ti.InviteeUser)
                .FirstOrDefaultAsync(ti => ti.Id == id);

            if (invitation == null)
                return ServiceResult.NotFound("Invitation not found.");

            if (invitation.InviteeUserId != currentUserId)
                return ServiceResult.Forbidden();

            if (invitation.Status != InvitationStatus.Pending)
                return ServiceResult.BadRequest("This invitation is no longer pending.");

            var team = await _context.Teams
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.TeamId == invitation.TeamId);

            if (team == null)
                return ServiceResult.NotFound("Team not found.");

            if (team.Status != TeamStatus.Pending)
                return ServiceResult.BadRequest("This team is already approved and closed to changes.");

            if (team.Members.Count >= 5)
                return ServiceResult.BadRequest("This team is already full (maximum 5 members).");

            var eventId = invitation.Team.Category!.EventId;
            var categoryIdsInSameEvent = await _context.Categories
                .Where(c => c.EventId == eventId)
                .Select(c => c.CategoryId)
                .ToListAsync();

            var isJoinRequest = invitation.Team.LeaderId == invitation.InviteeUserId;
            var targetUserId = isJoinRequest ? invitation.InviterUserId : currentUserId;

            var alreadyJoinedEvent = await _context.TeamMembers
                .Include(tm => tm.Team)
                .AnyAsync(tm =>
                    tm.UserId == targetUserId &&
                    categoryIdsInSameEvent.Contains(tm.Team!.CategoryId));

            if (alreadyJoinedEvent)
                return ServiceResult.BadRequest(isJoinRequest ? "This applicant has already joined another team in this event." : "You have already joined another team in this event.");

            var membership = new TeamMember
            {
                TeamId = team.TeamId,
                UserId = targetUserId,
                Role = "Member"
            };

            _context.TeamMembers.Add(membership);

            invitation.Status = InvitationStatus.Accepted;
            invitation.RespondedAt = DateTime.UtcNow;

            var otherPendingInEvent = await _context.TeamInvitations
                .Include(ti => ti.Team)
                .Where(ti => ti.InviteeUserId == targetUserId && ti.Status == InvitationStatus.Pending && ti.Id != id)
                .ToListAsync();

            foreach (var otherInvite in otherPendingInEvent)
            {
                if (categoryIdsInSameEvent.Contains(otherInvite.Team.CategoryId))
                {
                    otherInvite.Status = InvitationStatus.Rejected;
                    otherInvite.RespondedAt = DateTime.UtcNow;
                }
            }

            var otherRequestsInEvent = await _context.TeamInvitations
                .Include(ti => ti.Team)
                .Where(ti => ti.InviterUserId == targetUserId && ti.Status == InvitationStatus.Pending && ti.Id != id)
                .ToListAsync();

            foreach (var otherRequest in otherRequestsInEvent)
            {
                if (categoryIdsInSameEvent.Contains(otherRequest.Team.CategoryId))
                {
                    otherRequest.Status = InvitationStatus.Rejected;
                    otherRequest.RespondedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();

            try
            {
                if (isJoinRequest)
                {
                    await _notificationService.CreateAsync(
                        invitation.InviterUserId,
                        "Join Request Accepted",
                        $"Your request to join team {team.TeamName} has been accepted.",
                        "team"
                    );
                }
                else
                {
                    await _notificationService.CreateAsync(
                        team.LeaderId,
                        "Invitation Accepted",
                        $"{invitation.InviteeUser.FullName} accepted your invitation to join {team.TeamName}.",
                        "team"
                    );
                }
            }
            catch { }

            return ServiceResult.OkMessage(isJoinRequest ? "Join request accepted successfully." : "You have joined the team successfully.");
        }

        public async Task<ServiceResult> RejectInvitationAsync(Guid? currentUserIdRaw, Guid id)
        {
            if (currentUserIdRaw == null) return ServiceResult.Unauthorized("Invalid authentication token.");
            var currentUserId = currentUserIdRaw.Value;

            var invitation = await _context.TeamInvitations
                .Include(ti => ti.Team)
                .Include(ti => ti.InviteeUser)
                .FirstOrDefaultAsync(ti => ti.Id == id);

            if (invitation == null)
                return ServiceResult.NotFound("Invitation not found.");

            if (invitation.InviteeUserId != currentUserId)
                return ServiceResult.Forbidden();

            if (invitation.Status != InvitationStatus.Pending)
                return ServiceResult.BadRequest("This invitation is no longer pending.");

            var isJoinRequest = invitation.Team.LeaderId == invitation.InviteeUserId;

            invitation.Status = InvitationStatus.Rejected;
            invitation.RespondedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            try
            {
                if (isJoinRequest)
                {
                    await _notificationService.CreateAsync(
                        invitation.InviterUserId,
                        "Join Request Declined",
                        $"Your request to join team {invitation.Team.TeamName} has been declined.",
                        "team"
                    );
                }
                else
                {
                    await _notificationService.CreateAsync(
                        invitation.Team.LeaderId,
                        "Invitation Rejected",
                        $"{invitation.InviteeUser.FullName} rejected your invitation to join {invitation.Team.TeamName}.",
                        "team"
                    );
                }
            }
            catch { }

            return ServiceResult.OkMessage(isJoinRequest ? "Join request rejected successfully." : "Invitation rejected successfully.");
        }

        public async Task<ServiceResult> CancelInvitationAsync(Guid? currentUserIdRaw, Guid id)
        {
            if (currentUserIdRaw == null) return ServiceResult.Unauthorized("Invalid authentication token.");
            var currentUserId = currentUserIdRaw.Value;

            var invitation = await _context.TeamInvitations
                .Include(ti => ti.Team)
                .FirstOrDefaultAsync(ti => ti.Id == id);

            if (invitation == null)
                return ServiceResult.NotFound("Invitation not found.");

            if (invitation.InviterUserId != currentUserId && invitation.Team.LeaderId != currentUserId)
                return ServiceResult.Forbidden();

            if (invitation.Status != InvitationStatus.Pending)
                return ServiceResult.BadRequest("This invitation is no longer pending.");

            invitation.Status = InvitationStatus.Cancelled;
            invitation.RespondedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return ServiceResult.OkMessage("Invitation cancelled successfully.");
        }
    }
}
