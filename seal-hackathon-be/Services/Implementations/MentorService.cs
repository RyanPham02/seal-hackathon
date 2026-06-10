using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Team;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class MentorService : IMentorService
    {
        private readonly ApplicationDbContext _context;

        public MentorService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult> GetAssignedTeamsAsync(Guid mentorUserId)
        {
            var assignments = await _context.MentorAssignments
                .Include(ma => ma.Team)
                    .ThenInclude(t => t.Category)
                        .ThenInclude(c => c.Event)
                .Include(ma => ma.Team)
                    .ThenInclude(t => t.Members)
                .Include(ma => ma.Team)
                    .ThenInclude(t => t.Submissions)
                        .ThenInclude(s => s.Round)
                .Where(ma => ma.MentorUserId == mentorUserId && ma.IsActive)
                .ToListAsync();

            var result = assignments.Select(ma =>
            {
                var team = ma.Team;
                var latestSub = team.Submissions
                    .OrderByDescending(s => s.SubmittedAt)
                    .FirstOrDefault();

                return new MentorTeamResponseDto
                {
                    TeamId = team.TeamId,
                    TeamName = team.TeamName,
                    CategoryName = team.Category.CategoryName,
                    EventName = team.Category.Event?.EventName ?? string.Empty,
                    Status = team.Status.ToString(),
                    MembersCount = team.Members.Count,
                    Notes = ma.Notes,
                    LatestSubmission = latestSub == null ? null : new MentorTeamSubmissionDto
                    {
                        SubmissionId = latestSub.SubmissionId,
                        RepositoryUrl = latestSub.RepositoryUrl,
                        DemoUrl = latestSub.DemoUrl,
                        SlideUrl = latestSub.SlideUrl,
                        SubmittedAt = latestSub.SubmittedAt,
                        RoundName = latestSub.Round?.RoundName ?? "General"
                    }
                };
            }).ToList();

            return ServiceResult.Ok(result);
        }

        public async Task<ServiceResult> GetAssignedTeamDetailAsync(Guid mentorUserId, Guid teamId)
        {
            var assignment = await _context.MentorAssignments
                .FirstOrDefaultAsync(ma => ma.MentorUserId == mentorUserId && ma.TeamId == teamId && ma.IsActive);

            if (assignment == null)
                return ServiceResult.Forbidden();

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

            return ServiceResult.Ok(new
            {
                team.TeamId,
                team.TeamName,
                status = team.Status.ToString(),
                category = new
                {
                    team.Category!.CategoryId,
                    team.Category.CategoryName,
                    eventId = team.Category.EventId,
                    eventName = team.Category.Event?.EventName
                },
                currentRound = team.CurrentRound == null ? null : new
                {
                    team.CurrentRound.RoundId,
                    team.CurrentRound.RoundName
                },
                notes = assignment.Notes,
                members = team.Members.Select(m => new
                {
                    id = m.UserId,
                    name = m.User!.FullName,
                    email = m.User.Email,
                    role = m.Role,
                    studentCode = m.User.StudentCode,
                    schoolName = m.User.SchoolName
                }),
                submissions = team.Submissions.Select(s => new
                {
                    s.SubmissionId,
                    s.RepositoryUrl,
                    s.DemoUrl,
                    s.SlideUrl,
                    s.SubmittedAt,
                    roundName = s.Round?.RoundName ?? "General"
                })
            });
        }

        public async Task<ServiceResult> SaveTeamNotesAsync(Guid mentorUserId, Guid teamId, SaveNotesRequest request)
        {
            var assignment = await _context.MentorAssignments
                .FirstOrDefaultAsync(ma => ma.MentorUserId == mentorUserId && ma.TeamId == teamId && ma.IsActive);

            if (assignment == null)
                return ServiceResult.Forbidden();

            assignment.Notes = request.Notes;
            await _context.SaveChangesAsync();

            return ServiceResult.OkMessage("Notes saved successfully.");
        }
    }
}
