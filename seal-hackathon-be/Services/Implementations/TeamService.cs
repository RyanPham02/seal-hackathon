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
                        .ThenInclude(c => c.Event)
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

            // Add leader as the sole initial member of the team
            _context.TeamMembers.Add(new TeamMember
            {
                TeamId = team.TeamId,
                UserId = leaderId,
                Role = "Leader"
            });

            // For all other members, create a pending team invitation and system notification
            foreach (var memberId in allMemberIds)
            {
                if (memberId != leaderId)
                {
                    var invitation = new TeamInvitation
                    {
                        TeamId = team.TeamId,
                        InviterUserId = leaderId,
                        InviteeUserId = memberId,
                        Status = InvitationStatus.Pending,
                        Message = $"Invitation to join team {team.TeamName}",
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.TeamInvitations.Add(invitation);

                    try
                    {
                        await _notificationService.CreateAsync(
                            memberId,
                            "Team Invitation",
                            $"You have been invited to join team {team.TeamName}.",
                            "team"
                        );
                    }
                    catch { }
                }
            }

            await _context.SaveChangesAsync();

            return ServiceResult.Ok(new
            {
                message = "Team registered successfully and invitations have been sent.",
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

            var assignedJudge = await _context.JudgeAssignments
                .Where(ja => ja.TeamId == team.TeamId || (ja.CategoryId == team.CategoryId && ja.TeamId == null))
                .OrderByDescending(ja => ja.TeamId.HasValue)
                .Include(ja => ja.Judge)
                .Select(ja => ja.Judge)
                .FirstOrDefaultAsync();

            var hideMentorAndJudge = team.Status == TeamStatus.Rejected || 
                                     team.Status == TeamStatus.Eliminated || 
                                     team.Status == TeamStatus.Withdrawn;

            return ServiceResult.Ok(new
            {
                team.TeamId,
                team.TeamName,
                status = team.Status.ToString(),
                leaderId = team.LeaderId,
                category = new
                {
                    team.Category!.CategoryId,
                    team.Category.CategoryName,
                    eventName = team.Category.Event?.EventName
                },
                currentRound = team.CurrentRound == null ? null : new
                {
                    team.CurrentRound.RoundId,
                    team.CurrentRound.RoundName,
                    team.CurrentRound.SubmissionDeadline
                },
                members = team.Members.Select(m => new
                {
                    m.UserId,
                    m.User!.FullName,
                    m.User.Email,
                    m.User.StudentCode,
                    m.Role
                }),
                mentor = (hideMentorAndJudge || activeMentor == null) ? null : new
                {
                    id = activeMentor.Id,
                    fullName = activeMentor.FullName,
                    email = activeMentor.Email,
                    schoolName = activeMentor.SchoolName
                },
                judge = (hideMentorAndJudge || assignedJudge == null) ? null : new
                {
                    id = assignedJudge.Id,
                    fullName = assignedJudge.FullName,
                    email = assignedJudge.Email
                },
                eventStatus = team.Category?.Event?.Status.ToString(),
                finalRank = team.FinalRank,
                finalPrize = team.FinalPrize
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

            // Check if there is already a pending invitation
            var existingPending = await _context.TeamInvitations
                .AnyAsync(ti => ti.TeamId == team.TeamId && ti.InviteeUserId == user.Id && ti.Status == InvitationStatus.Pending);

            if (existingPending)
                return ServiceResult.BadRequest("You have already sent a pending invitation to this user.");

            var invitation = new TeamInvitation
            {
                TeamId = team.TeamId,
                InviterUserId = currentUserId,
                InviteeUserId = user.Id,
                Status = InvitationStatus.Pending,
                Message = $"Invitation to join team {team.TeamName}",
                CreatedAt = DateTime.UtcNow
            };

            _context.TeamInvitations.Add(invitation);
            await _context.SaveChangesAsync();

            try
            {
                await _notificationService.CreateAsync(
                    user.Id,
                    "Team Invitation",
                    $"You have been invited to join team {team.TeamName}.",
                    "team"
                );
            }
            catch { }

            return ServiceResult.OkMessage("Invitation sent successfully.");
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

            if (team.LeaderId == currentUserId)
            {
                var eventIsCompleted = team.Category?.Event?.Status == EventStatus.Completed;
                if (team.Members.Count > 1 &&
                    (team.Status == TeamStatus.Approved || team.Status == TeamStatus.Active) &&
                    !eventIsCompleted &&
                    team.Status != TeamStatus.Champion)
                {
                    return ServiceResult.BadRequest("Team leader must transfer leadership or remove other members before leaving.");
                }

                // Disband the team. We do NOT delete the team row itself to prevent violating
                // foreign key constraints (e.g. MentorAssignments, Submissions, Scores) and to
                // preserve history. Instead we mark it Withdrawn so it no longer surfaces in
                // recruiting / matchmaking listings, remove its members, and cancel any pending
                // invitations so they cannot still be acted on.
                var teamName = team.TeamName;
                var otherMemberIds = team.Members
                    .Where(m => m.UserId != currentUserId)
                    .Select(m => m.UserId)
                    .ToList();

                _context.TeamMembers.RemoveRange(team.Members.ToList());

                var pendingInvitations = await _context.TeamInvitations
                    .Where(ti => ti.TeamId == team.TeamId && ti.Status == InvitationStatus.Pending)
                    .ToListAsync();

                foreach (var invitation in pendingInvitations)
                {
                    invitation.Status = InvitationStatus.Cancelled;
                    invitation.RespondedAt = DateTime.UtcNow;
                }

                team.Status = TeamStatus.Withdrawn;

                await _context.SaveChangesAsync();

                if (otherMemberIds.Any())
                {
                    try
                    {
                        await _notificationService.CreateForUsersAsync(
                            otherMemberIds,
                            "Team disbanded",
                            $"Team {teamName} has been disbanded by its leader.",
                            "team");
                    }
                    catch { }
                }

                return ServiceResult.OkMessage("You have left the team and disbanded it.");
            }

            var membership = team.Members.FirstOrDefault(m => m.UserId == currentUserId);
            if (membership == null)
                return ServiceResult.NotFound("Team membership not found.");

            _context.TeamMembers.Remove(membership);
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

            var assignedJudge = await _context.JudgeAssignments
                .Where(ja => ja.TeamId == team.TeamId || (ja.CategoryId == team.CategoryId && ja.TeamId == null))
                .OrderByDescending(ja => ja.TeamId.HasValue)
                .Include(ja => ja.Judge)
                .Select(ja => ja.Judge)
                .FirstOrDefaultAsync();

            var hideMentorAndJudge = team.Status == TeamStatus.Rejected || 
                                     team.Status == TeamStatus.Eliminated || 
                                     team.Status == TeamStatus.Withdrawn;

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
                mentor = (hideMentorAndJudge || activeMentor == null) ? null : new
                {
                    id = activeMentor.Id,
                    fullName = activeMentor.FullName,
                    email = activeMentor.Email,
                    schoolName = activeMentor.SchoolName
                },
                judge = (hideMentorAndJudge || assignedJudge == null) ? null : new
                {
                    id = assignedJudge.Id,
                    fullName = assignedJudge.FullName,
                    email = assignedJudge.Email
                },
                eventStatus = team.Category?.Event?.Status.ToString(),
                finalRank = team.FinalRank,
                finalPrize = team.FinalPrize
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

        public async Task<ServiceResult> CreateKickRequestAsync(Guid currentUserId, Guid userId, CreateKickRequestRequest request)
        {
            var team = await GetCurrentUserTeamAsync(currentUserId);

            if (team == null)
                return ServiceResult.NotFound("You have not joined any team yet.");

            if (team.LeaderId != currentUserId)
                return ServiceResult.Forbidden();

            var isApprovedTeam = team.Status == TeamStatus.Approved;
            if (!isApprovedTeam)
                return ServiceResult.BadRequest("Only approved teams can submit kick requests.");

            var isMember = team.Members.Any(m => m.UserId == userId);
            if (!isMember)
                return ServiceResult.NotFound("Member not found in this team.");

            if (userId == currentUserId)
                return ServiceResult.BadRequest("You cannot kick yourself.");

            var pending = await _context.KickRequests.AnyAsync(kr => kr.TeamId == team.TeamId && kr.UserId == userId && kr.Status == "Pending");
            if (pending)
                return ServiceResult.BadRequest("A kick request for this member is already pending.");

            var kickRequest = new KickRequest
            {
                TeamId = team.TeamId,
                UserId = userId,
                Reason = request.Reason.Trim(),
                Status = "Pending",
                RequestedAt = DateTime.UtcNow
            };

            _context.KickRequests.Add(kickRequest);
            await _context.SaveChangesAsync();

            // Send notification to judges assigned to this round and category
            var judges = await _context.JudgeAssignments
                .Where(ja => ja.CategoryId == team.CategoryId && ja.RoundId == team.CurrentRoundId)
                .Select(ja => ja.JudgeId)
                .Distinct()
                .ToListAsync();

            if (judges.Any())
            {
                await _notificationService.CreateForUsersAsync(
                    judges,
                    "Member Kick Request",
                    $"Leader of team {team.TeamName} requested to kick a member. Reason: {request.Reason}",
                    "team");
            }

            return ServiceResult.OkMessage("Kick request submitted for Judge approval.");
        }

        public async Task<ServiceResult> GetPendingKickRequestsForJudgeAsync(Guid judgeUserId)
        {
            var assignedPairs = await _context.JudgeAssignments
                .Where(ja => ja.JudgeId == judgeUserId)
                .Select(ja => new { ja.CategoryId, ja.RoundId, ja.TeamId })
                .ToListAsync();

            var pendingRequests = await _context.KickRequests
                .Include(kr => kr.Team)
                .Include(kr => kr.User)
                .Where(kr => kr.Status == "Pending")
                .ToListAsync();

            var judgeRequests = pendingRequests
                .Where(kr => assignedPairs.Any(ja => ja.CategoryId == kr.Team.CategoryId && ja.RoundId == kr.Team.CurrentRoundId && (ja.TeamId == null || ja.TeamId == kr.TeamId)))
                .Select(kr => new
                {
                    kr.KickRequestId,
                    kr.TeamId,
                    teamName = kr.Team.TeamName,
                    userId = kr.UserId,
                    userName = kr.User.FullName,
                    userEmail = kr.User.Email,
                    kr.Reason,
                    kr.Status,
                    kr.RequestedAt
                })
                .OrderByDescending(kr => kr.RequestedAt)
                .ToList();

            return ServiceResult.Ok(judgeRequests);
        }

        public async Task<ServiceResult> ApproveKickRequestAsync(Guid judgeUserId, Guid kickRequestId)
        {
            var kickRequest = await _context.KickRequests
                .Include(kr => kr.Team)
                .Include(kr => kr.User)
                .FirstOrDefaultAsync(kr => kr.KickRequestId == kickRequestId);

            if (kickRequest == null)
                return ServiceResult.NotFound("Kick request not found.");

            if (kickRequest.Status != "Pending")
                return ServiceResult.BadRequest("Kick request has already been resolved.");

            // Verify if the judge is assigned to this team's category & round
            var isAssigned = await _context.JudgeAssignments
                .AnyAsync(ja => ja.JudgeId == judgeUserId && ja.CategoryId == kickRequest.Team.CategoryId && ja.RoundId == kickRequest.Team.CurrentRoundId && (ja.TeamId == null || ja.TeamId == kickRequest.TeamId));

            // Check if user is Admin as well (Admin can resolve too)
            var isAdmin = await _context.UserRoles
                .AnyAsync(ur => ur.UserId == judgeUserId && _context.Roles.Any(r => r.Id == ur.RoleId && r.Name == "Admin"));

            if (!isAssigned && !isAdmin)
                return ServiceResult.Forbidden();

            kickRequest.Status = "Approved";

            var membership = await _context.TeamMembers
                .FirstOrDefaultAsync(tm => tm.TeamId == kickRequest.TeamId && tm.UserId == kickRequest.UserId);

            if (membership != null)
            {
                _context.TeamMembers.Remove(membership);
            }

            await _context.SaveChangesAsync();

            // Notify member and leader
            await _notificationService.CreateAsync(
                kickRequest.UserId,
                "Removed from team",
                $"You were removed from team {kickRequest.Team.TeamName} after Judge approval.",
                "team");

            await _notificationService.CreateAsync(
                kickRequest.Team.LeaderId,
                "Kick Request Approved",
                $"Your request to kick member {kickRequest.User.FullName} was approved by the Judge.",
                "team");

            return ServiceResult.OkMessage("Kick request approved. Member has been removed from the team.");
        }

        public async Task<ServiceResult> RejectKickRequestAsync(Guid judgeUserId, Guid kickRequestId)
        {
            var kickRequest = await _context.KickRequests
                .Include(kr => kr.Team)
                .Include(kr => kr.User)
                .FirstOrDefaultAsync(kr => kr.KickRequestId == kickRequestId);

            if (kickRequest == null)
                return ServiceResult.NotFound("Kick request not found.");

            if (kickRequest.Status != "Pending")
                return ServiceResult.BadRequest("Kick request has already been resolved.");

            // Verify if the judge is assigned to this team's category & round
            var isAssigned = await _context.JudgeAssignments
                .AnyAsync(ja => ja.JudgeId == judgeUserId && ja.CategoryId == kickRequest.Team.CategoryId && ja.RoundId == kickRequest.Team.CurrentRoundId && (ja.TeamId == null || ja.TeamId == kickRequest.TeamId));

            // Check if user is Admin
            var isAdmin = await _context.UserRoles
                .AnyAsync(ur => ur.UserId == judgeUserId && _context.Roles.Any(r => r.Id == ur.RoleId && r.Name == "Admin"));

            if (!isAssigned && !isAdmin)
                return ServiceResult.Forbidden();

            kickRequest.Status = "Rejected";
            await _context.SaveChangesAsync();

            // Notify leader
            await _notificationService.CreateAsync(
                kickRequest.Team.LeaderId,
                "Kick Request Rejected",
                $"Your request to kick member {kickRequest.User.FullName} was rejected by the Judge.",
                "team");

            return ServiceResult.OkMessage("Kick request rejected. Member remains in the team.");
        }

        public async Task<ServiceResult> GetRecruitingTeamsAsync(Guid currentUserId)
        {
            var teams = await _context.Teams
                .Where(t => t.Status == TeamStatus.Pending)
                .Include(t => t.Category)
                .Include(t => t.Members)
                    .ThenInclude(tm => tm.User)
                .ToListAsync();

            var pendingRequests = await _context.TeamInvitations
                .Where(ti => ti.InviterUserId == currentUserId && ti.Status == InvitationStatus.Pending)
                .Select(ti => ti.TeamId)
                .ToListAsync();

            var dtoList = new List<RecruitingTeamDto>();

            foreach (var team in teams)
            {
                if (team.Members.Count >= 5)
                    continue;

                if (team.Members.Any(m => m.UserId == currentUserId))
                    continue;

                var leader = team.Members.FirstOrDefault(m => m.UserId == team.LeaderId)?.User;

                dtoList.Add(new RecruitingTeamDto
                {
                    TeamId = team.TeamId,
                    TeamName = team.TeamName,
                    CategoryName = team.Category?.CategoryName ?? string.Empty,
                    LeaderName = leader?.FullName ?? "Unknown",
                    MemberCount = team.Members.Count,
                    Members = team.Members.Select(m => m.User!.FullName).ToList(),
                    HasPendingRequest = pendingRequests.Contains(team.TeamId)
                });
            }

            return ServiceResult.Ok(dtoList);
        }

        public async Task<ServiceResult> RequestToJoinTeamAsync(Guid currentUserId, Guid teamId)
        {
            var team = await _context.Teams
                .Include(t => t.Category)
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.TeamId == teamId);

            if (team == null)
                return ServiceResult.NotFound("Team not found.");

            if (team.Status != TeamStatus.Pending)
                return ServiceResult.BadRequest("This team is already approved and closed to changes.");

            if (team.Members.Count >= 5)
                return ServiceResult.BadRequest("This team is already full.");

            if (team.Members.Any(m => m.UserId == currentUserId))
                return ServiceResult.BadRequest("You are already a member of this team.");

            var existingPending = await _context.TeamInvitations
                .AnyAsync(ti => ti.TeamId == teamId && ti.InviterUserId == currentUserId && ti.Status == InvitationStatus.Pending);

            if (existingPending)
                return ServiceResult.BadRequest("You have already sent a pending join request to this team.");

            var eventId = team.Category!.EventId;
            var categoryIdsInSameEvent = await _context.Categories
                .Where(c => c.EventId == eventId)
                .Select(c => c.CategoryId)
                .ToListAsync();

            var alreadyJoinedEvent = await _context.TeamMembers
                .Include(tm => tm.Team)
                .AnyAsync(tm =>
                    tm.UserId == currentUserId &&
                    categoryIdsInSameEvent.Contains(tm.Team!.CategoryId));

            if (alreadyJoinedEvent)
                return ServiceResult.BadRequest("You have already joined another team in this event.");

            var invitation = new TeamInvitation
            {
                TeamId = team.TeamId,
                InviterUserId = currentUserId,
                InviteeUserId = team.LeaderId,
                Status = InvitationStatus.Pending,
                Message = "Request to join your team.",
                CreatedAt = DateTime.UtcNow
            };

            _context.TeamInvitations.Add(invitation);
            await _context.SaveChangesAsync();

            try
            {
                var applicant = await _userManager.FindByIdAsync(currentUserId.ToString());
                if (applicant != null)
                {
                    await _notificationService.CreateAsync(
                        team.LeaderId,
                        "Join Request",
                        $"{applicant.FullName} has requested to join your team {team.TeamName}.",
                        "team"
                    );
                }
            }
            catch { }

            return ServiceResult.OkMessage("Join request sent successfully.");
        }
    }
}
