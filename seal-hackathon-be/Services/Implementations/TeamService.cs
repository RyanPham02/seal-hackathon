using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Team;
using SEAL.NET.Models.Entities;
using SEAL.NET.Models.Enums;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class TeamService : ITeamService
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly UserManager<ApplicationUser> _userManager;

        public TeamService(
            ApplicationDbContext context,
            INotificationService notificationService,
            UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _notificationService = notificationService;
            _userManager = userManager;
        }

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

        /// <summary>Returns a failing <see cref="ServiceResult"/>, or <c>null</c> when the member can be added.</summary>
        private async Task<ServiceResult?> ValidateCanAddMemberAsync(Team team, Guid currentUserId, ApplicationUser user)
        {
            if (team.LeaderId != currentUserId)
                return ServiceResult.Forbidden();

            if (team.Status != TeamStatus.Pending)
                return ServiceResult.BadRequest("Cannot modify members after team approval.");

            if (team.Members.Count >= 5)
                return ServiceResult.BadRequest("A team can have maximum 5 members.");

            if (user.Id == currentUserId)
                return ServiceResult.BadRequest("You cannot add yourself to your own team.");

            if (!user.IsApproved)
                return ServiceResult.BadRequest("This user's account is disabled or not allowed to access.");

            var alreadyInTeam = team.Members.Any(m => m.UserId == user.Id);
            if (alreadyInTeam)
                return ServiceResult.BadRequest("User is already in this team.");

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
                return ServiceResult.BadRequest("User already joined another team in this event.");

            return null;
        }

        public async Task<ServiceResult> CreateTeamAsync(Guid leaderId, CreateTeamRequest request)
        {
            var leader = await _userManager.FindByIdAsync(leaderId.ToString());
            if (leader == null)
                return ServiceResult.NotFound("User not found.");

            if (!leader.IsApproved)
                return ServiceResult.BadRequest("Your account is disabled or not allowed to access.");

            var category = await _context.Categories
                .Include(c => c.Event)
                .FirstOrDefaultAsync(c => c.CategoryId == request.CategoryId);

            if (category == null)
                return ServiceResult.NotFound("Category not found.");

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
                    return ServiceResult.BadRequest(ex.Message);
                }

                if (member == null)
                    return ServiceResult.BadRequest($"No active user found for student code or email: {memberCode}.");

                memberIdsFromCodes.Add(member.Id);
            }

            var allMemberIds = request.MemberIds
                .Concat(memberIdsFromCodes)
                .Append(leaderId)
                .Distinct()
                .ToList();

            if (allMemberIds.Count < 3 || allMemberIds.Count > 5)
                return ServiceResult.BadRequest("A team must have 3 to 5 members including the leader.");

            var existingUsers = await _context.Users
                .Where(u => allMemberIds.Contains(u.Id))
                .Select(u => u.Id)
                .ToListAsync();

            if (existingUsers.Count != allMemberIds.Count)
                return ServiceResult.BadRequest("One or more members do not exist.");

            var unapprovedUsers = await _context.Users
                .Where(u => allMemberIds.Contains(u.Id) && !u.IsApproved)
                .Select(u => u.Email)
                .ToListAsync();

            if (unapprovedUsers.Any())
                return ServiceResult.BadRequestBody(new
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
                return ServiceResult.BadRequestBody(new
                {
                    message = "One or more members already joined a team in this event.",
                    users = alreadyJoined
                });

            var duplicateTeamName = await _context.Teams.AnyAsync(t =>
                t.CategoryId == request.CategoryId &&
                t.TeamName.ToLower() == request.TeamName.ToLower());

            if (duplicateTeamName)
                return ServiceResult.BadRequest("Team name already exists in this category.");

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

            return ServiceResult.Ok(new
            {
                message = "Team registered successfully and is waiting for approval.",
                teamId = team.TeamId,
                teamName = team.TeamName,
                status = team.Status.ToString()
            });
        }

        public async Task<ServiceResult> GetMyTeamAsync(Guid userId)
        {
            var team = await GetCurrentUserTeamAsync(userId);

            if (team == null)
                return ServiceResult.NotFound("You have not joined any team yet.");

            var activeMentor = await _context.MentorAssignments
                .Where(ma => ma.TeamId == team.TeamId && ma.IsActive)
                .Include(ma => ma.Mentor)
                .Select(ma => ma.Mentor)
                .FirstOrDefaultAsync();

            return ServiceResult.Ok(new
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

        public async Task<ServiceResult> AddMemberToMyTeamAsync(Guid currentUserId, AddTeamMemberByStudentCodeRequest request)
        {
            var team = await GetCurrentUserTeamAsync(currentUserId);

            if (team == null)
                return ServiceResult.NotFound("You have not joined any team yet.");

            ApplicationUser? user;
            try
            {
                user = await FindUserByStudentCodeOrEmailAsync(request.StudentCodeOrEmail);
            }
            catch (InvalidOperationException ex)
            {
                return ServiceResult.BadRequest(ex.Message);
            }

            if (user == null)
                return ServiceResult.NotFound("No active user found for that student code or email.");

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

            return ServiceResult.OkMessage("Member added successfully.");
        }

        public async Task<ServiceResult> RemoveMemberFromMyTeamAsync(Guid currentUserId, string studentCode)
        {
            var team = await GetCurrentUserTeamAsync(currentUserId);

            if (team == null)
                return ServiceResult.NotFound("You have not joined any team yet.");

            if (team.LeaderId != currentUserId)
                return ServiceResult.Forbidden();

            if (team.Status != TeamStatus.Pending)
                return ServiceResult.BadRequest("Cannot modify members after team approval.");

            ApplicationUser? user;
            try
            {
                user = await FindUserByStudentCodeOrEmailAsync(studentCode);
            }
            catch (InvalidOperationException ex)
            {
                return ServiceResult.BadRequest(ex.Message);
            }

            if (user == null)
                return ServiceResult.NotFound("User not found.");

            if (team.LeaderId == user.Id)
                return ServiceResult.BadRequest("Leader cannot be removed from the team.");

            var member = team.Members.FirstOrDefault(m => m.UserId == user.Id);
            if (member == null)
                return ServiceResult.NotFound("Member not found in this team.");

            _context.TeamMembers.Remove(member);
            await _context.SaveChangesAsync();
            await _notificationService.CreateAsync(
                user.Id,
                "Removed from team",
                $"You were removed from team {team.TeamName}.",
                "team");

            return ServiceResult.OkMessage("Member removed successfully.");
        }

        public async Task<ServiceResult> LeaveTeamAsync(Guid currentUserId)
        {
            var team = await GetCurrentUserTeamAsync(currentUserId);

            if (team == null)
                return ServiceResult.NotFound("You have not joined any team yet.");

            if (team.LeaderId == currentUserId && team.Members.Count > 1)
                return ServiceResult.BadRequest("Team leader must transfer leadership or remove other members before leaving.");

            var membership = team.Members.FirstOrDefault(m => m.UserId == currentUserId);
            if (membership == null)
                return ServiceResult.NotFound("Team membership not found.");

            if (team.LeaderId == currentUserId && team.Members.Count == 1)
            {
                _context.Teams.Remove(team);
            }
            else
            {
                _context.TeamMembers.Remove(membership);
            }

            await _context.SaveChangesAsync();

            return ServiceResult.OkMessage("You have left the team.");
        }

        public async Task<ServiceResult> UpdateMyTeamAsync(Guid currentUserId, UpdateMyTeamRequest request)
        {
            var team = await GetCurrentUserTeamAsync(currentUserId);

            if (team == null)
                return ServiceResult.NotFound("You have not joined any team yet.");

            if (team.LeaderId != currentUserId)
                return ServiceResult.Forbidden();

            if (team.Status != TeamStatus.Pending)
                return ServiceResult.BadRequest("Cannot modify team after approval.");

            var duplicateTeamName = await _context.Teams.AnyAsync(t =>
                t.TeamId != team.TeamId &&
                t.CategoryId == team.CategoryId &&
                t.TeamName.ToLower() == request.TeamName.ToLower());

            if (duplicateTeamName)
                return ServiceResult.BadRequest("Team name already exists in this category.");

            team.TeamName = request.TeamName.Trim();
            await _context.SaveChangesAsync();

            return ServiceResult.OkMessage("Team updated successfully.");
        }

        public async Task<ServiceResult> TransferLeaderAsync(Guid currentUserId, TransferLeaderRequest request)
        {
            var team = await GetCurrentUserTeamAsync(currentUserId);

            if (team == null)
                return ServiceResult.NotFound("You have not joined any team yet.");

            if (team.LeaderId != currentUserId)
                return ServiceResult.Forbidden();

            if (team.Status != TeamStatus.Pending)
                return ServiceResult.BadRequest("Cannot transfer leader after team approval.");

            ApplicationUser? newLeader;
            try
            {
                newLeader = await FindUserByStudentCodeOrEmailAsync(request.NewLeaderStudentCodeOrEmail);
            }
            catch (InvalidOperationException ex)
            {
                return ServiceResult.BadRequest(ex.Message);
            }

            if (newLeader == null)
                return ServiceResult.NotFound("No team member found for that student code or email.");

            var newLeaderMembership = team.Members.FirstOrDefault(m => m.UserId == newLeader.Id);
            if (newLeaderMembership == null)
                return ServiceResult.BadRequest("New leader must be an existing team member.");

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

            return ServiceResult.OkMessage("Team leader transferred successfully.");
        }

        public async Task<ServiceResult> AddMemberAsync(Guid currentUserId, Guid teamId, AddTeamMemberRequest request)
        {
            var team = await _context.Teams
                .Include(t => t.Members)
                .Include(t => t.Category)
                .FirstOrDefaultAsync(t => t.TeamId == teamId);

            if (team == null)
                return ServiceResult.NotFound("Team not found.");

            var user = await _userManager.FindByIdAsync(request.UserId.ToString());
            if (user == null)
                return ServiceResult.NotFound("User not found.");

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

            return ServiceResult.OkMessage("Member added successfully.");
        }

        public async Task<ServiceResult> RemoveMemberAsync(Guid currentUserId, Guid teamId, Guid userId)
        {
            var team = await _context.Teams
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.TeamId == teamId);

            if (team == null)
                return ServiceResult.NotFound("Team not found.");

            if (team.LeaderId != currentUserId)
                return ServiceResult.Forbidden();

            if (team.Status != TeamStatus.Pending)
                return ServiceResult.BadRequest("Cannot modify members after team approval.");

            if (team.LeaderId == userId)
                return ServiceResult.BadRequest("Leader cannot be removed from the team.");

            var member = team.Members.FirstOrDefault(m => m.UserId == userId);
            if (member == null)
                return ServiceResult.NotFound("Member not found in this team.");

            _context.TeamMembers.Remove(member);
            await _context.SaveChangesAsync();
            await _notificationService.CreateAsync(
                userId,
                "Removed from team",
                $"You were removed from team {team.TeamName}.",
                "team");

            return ServiceResult.OkMessage("Member removed successfully.");
        }

        public async Task<ServiceResult> GetTeamByIdAsync(Guid currentUserId, Guid teamId, bool isPrivileged)
        {
            var team = await _context.Teams
                .Include(t => t.Category)
                    .ThenInclude(c => c.Event)
                .Include(t => t.CurrentRound)
                .Include(t => t.Members)
                    .ThenInclude(m => m.User)
                .Include(t => t.Submissions)
                    .ThenInclude(s => s.Round)
                .FirstOrDefaultAsync(t => t.TeamId == teamId);

            if (team == null)
                return ServiceResult.NotFound("Team not found.");

            var isMember = team.Members.Any(m => m.UserId == currentUserId);
            if (!isMember && !isPrivileged)
                return ServiceResult.Forbidden();

            var activeMentor = await _context.MentorAssignments
                .Where(ma => ma.TeamId == team.TeamId && ma.IsActive)
                .Include(ma => ma.Mentor)
                .Select(ma => ma.Mentor)
                .FirstOrDefaultAsync();

            return ServiceResult.Ok(new
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

        public async Task<ServiceResult> GetMentorsAsync()
        {
            var mentorRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Mentor");
            if (mentorRole == null)
                return ServiceResult.Ok(new List<object>());

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

            return ServiceResult.Ok(mentors);
        }

        public async Task<ServiceResult> AssignMentorToMyTeamAsync(Guid currentUserId, ChooseMentorRequest request)
        {
            var team = await GetCurrentUserTeamAsync(currentUserId);

            if (team == null)
                return ServiceResult.NotFound("You have not joined any team yet.");

            if (team.LeaderId != currentUserId)
                return ServiceResult.Forbidden();

            if (team.Status != TeamStatus.Pending)
                return ServiceResult.BadRequest("Cannot modify team after approval.");

            var mentor = await _userManager.FindByIdAsync(request.MentorUserId.ToString());
            if (mentor == null)
                return ServiceResult.NotFound("Mentor user not found.");

            if (!mentor.IsApproved)
                return ServiceResult.BadRequest("This mentor's account is disabled.");

            var isMentor = await _userManager.IsInRoleAsync(mentor, "Mentor");
            if (!isMentor)
                return ServiceResult.BadRequest("Selected user is not a mentor.");

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

            return ServiceResult.OkMessage("Mentor selected successfully.");
        }

        public async Task<ServiceResult> RemoveMentorFromMyTeamAsync(Guid currentUserId)
        {
            var team = await GetCurrentUserTeamAsync(currentUserId);

            if (team == null)
                return ServiceResult.NotFound("You have not joined any team yet.");

            if (team.LeaderId != currentUserId)
                return ServiceResult.Forbidden();

            if (team.Status != TeamStatus.Pending)
                return ServiceResult.BadRequest("Cannot modify team after approval.");

            var activeAssignments = await _context.MentorAssignments
                .Where(ma => ma.TeamId == team.TeamId && ma.IsActive)
                .ToListAsync();

            if (!activeAssignments.Any())
                return ServiceResult.BadRequest("Your team does not have a mentor assigned.");

            foreach (var ma in activeAssignments)
            {
                ma.IsActive = false;
            }

            await _context.SaveChangesAsync();

            return ServiceResult.OkMessage("Mentor removed successfully.");
        }
    }
}
