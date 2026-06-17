using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Round;
using SEAL.NET.Models.Entities;
using SEAL.NET.Models.Enums;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class RoundService : IRoundService
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;

        public RoundService(ApplicationDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<ServiceResult> GetRoundsAsync(Guid eventId)
        {
            var eventExists = await _context.Events.AnyAsync(e => e.EventId == eventId);
            if (!eventExists)
                return ServiceResult.NotFound("Event not found.");

            var rounds = await _context.Rounds
                .Where(r => r.EventId == eventId)
                .OrderBy(r => r.RoundOrder)
                .Select(r => new
                {
                    r.RoundId,
                    r.RoundName,
                    r.SubmissionDeadline,
                    r.RoundOrder,
                    r.MaxTeamsAdvancing,
                    r.EventId
                })
                .ToListAsync();

            return ServiceResult.Ok(rounds);
        }

        public async Task<ServiceResult> GetRoundByIdAsync(Guid eventId, Guid roundId)
        {
            var round = await _context.Rounds
                .Where(r => r.EventId == eventId && r.RoundId == roundId)
                .Select(r => new
                {
                    r.RoundId,
                    r.RoundName,
                    r.SubmissionDeadline,
                    r.RoundOrder,
                    r.MaxTeamsAdvancing,
                    r.EventId
                })
                .FirstOrDefaultAsync();

            if (round == null)
                return ServiceResult.NotFound("Round not found.");

            return ServiceResult.Ok(round);
        }

        public async Task<ServiceResult> CreateRoundAsync(Guid eventId, CreateRoundRequest request)
        {
            var eventItem = await _context.Events.FindAsync(eventId);

            if (eventItem == null)
                return ServiceResult.NotFound("Event not found.");

            if (request.SubmissionDeadline < eventItem.StartDate || request.SubmissionDeadline > eventItem.EndDate)
                return ServiceResult.BadRequest("SubmissionDeadline must be within event date range.");

            var duplicateOrder = await _context.Rounds.AnyAsync(r =>
                r.EventId == eventId &&
                r.RoundOrder == request.RoundOrder);

            if (duplicateOrder)
                return ServiceResult.BadRequest("RoundOrder already exists in this event.");

            var round = new Round
            {
                EventId = eventId,
                RoundName = request.RoundName,
                SubmissionDeadline = request.SubmissionDeadline,
                RoundOrder = request.RoundOrder,
                MaxTeamsAdvancing = request.MaxTeamsAdvancing
            };

            _context.Rounds.Add(round);
            await _context.SaveChangesAsync();

            return ServiceResult.Created(
                "GetRoundById",
                new { eventId, roundId = round.RoundId },
                new
                {
                    message = "Round created successfully.",
                    round.RoundId
                });
        }

        public async Task<ServiceResult> UpdateRoundAsync(Guid eventId, Guid roundId, UpdateRoundRequest request)
        {
            var round = await _context.Rounds
                .FirstOrDefaultAsync(r => r.EventId == eventId && r.RoundId == roundId);

            if (round == null)
                return ServiceResult.NotFound("Round not found.");

            var eventItem = await _context.Events.FindAsync(eventId);

            if (eventItem == null)
                return ServiceResult.NotFound("Event not found.");

            if (request.SubmissionDeadline < eventItem.StartDate || request.SubmissionDeadline > eventItem.EndDate)
                return ServiceResult.BadRequest("SubmissionDeadline must be within event date range.");

            var duplicateOrder = await _context.Rounds.AnyAsync(r =>
                r.EventId == eventId &&
                r.RoundId != roundId &&
                r.RoundOrder == request.RoundOrder);

            if (duplicateOrder)
                return ServiceResult.BadRequest("RoundOrder already exists in this event.");

            round.RoundName = request.RoundName;
            round.SubmissionDeadline = request.SubmissionDeadline;
            round.RoundOrder = request.RoundOrder;
            round.MaxTeamsAdvancing = request.MaxTeamsAdvancing;

            await _context.SaveChangesAsync();

            return ServiceResult.OkMessage("Round updated successfully.");
        }

        public async Task<ServiceResult> DeleteRoundAsync(Guid eventId, Guid roundId)
        {
            var round = await _context.Rounds
                .Include(r => r.CriteriaList)
                .Include(r => r.Submissions)
                .Include(r => r.JudgeAssignments)
                .FirstOrDefaultAsync(r => r.EventId == eventId && r.RoundId == roundId);

            if (round == null)
                return ServiceResult.NotFound("Round not found.");

            if (round.CriteriaList.Any() || round.Submissions.Any() || round.JudgeAssignments.Any())
                return ServiceResult.BadRequest("Cannot delete round because it already has criteria, submissions, or judge assignments.");

            _context.Rounds.Remove(round);
            await _context.SaveChangesAsync();

            return ServiceResult.OkMessage("Round deleted successfully.");
        }

        public async Task<ServiceResult> AdvanceRoundAsync(Guid roundId)
        {
            var currentRound = await _context.Rounds
                .FirstOrDefaultAsync(r => r.RoundId == roundId);

            if (currentRound == null)
                return ServiceResult.NotFound("Round not found.");

            var nextRound = await _context.Rounds
                .Where(r => r.EventId == currentRound.EventId &&
                            r.RoundOrder > currentRound.RoundOrder)
                .OrderBy(r => r.RoundOrder)
                .FirstOrDefaultAsync();

            if (nextRound == null)
                return ServiceResult.BadRequest("This is the final round. No next round found.");

            if (currentRound.MaxTeamsAdvancing <= 0)
                return ServiceResult.BadRequest("MaxTeamsAdvancing must be greater than 0.");

            var submissions = await _context.Submissions
                .Include(s => s.Team)
                    .ThenInclude(t => t.Category)
                .Include(s => s.Team)
                    .ThenInclude(t => t.Members)
                .Include(s => s.Scores)
                    .ThenInclude(sc => sc.Criteria)
                .Where(s =>
                    s.RoundId == roundId &&
                    s.Team != null &&
                    s.Team.Status == TeamStatus.Approved)
                .ToListAsync();

            if (!submissions.Any())
                return ServiceResult.BadRequest("No submissions found for this round.");

            var groupedByCategory = submissions
                .GroupBy(s => s.Team!.CategoryId);

            var advancedTeams = new List<object>();
            var eliminatedTeams = new List<object>();

            foreach (var categoryGroup in groupedByCategory)
            {
                var rankedSubmissions = categoryGroup
                    .Select(s => new
                    {
                        Submission = s,
                        Team = s.Team!,
                        TotalScore = s.Scores.Sum(sc =>
                            sc.Criteria == null || sc.Criteria.MaxScore == 0
                                ? 0
                                : (sc.ScoreValue / sc.Criteria.MaxScore) * sc.Criteria.Weight)
                    })
                    .OrderByDescending(x => x.TotalScore)
                    .ThenBy(x => x.Submission.SubmittedAt)
                    .ToList();

                var winners = rankedSubmissions
                    .Take(currentRound.MaxTeamsAdvancing)
                    .ToList();

                var losers = rankedSubmissions
                    .Skip(currentRound.MaxTeamsAdvancing)
                    .ToList();

                foreach (var item in winners)
                {
                    item.Team.CurrentRoundId = nextRound.RoundId;
                    item.Team.Status = TeamStatus.Approved;

                    advancedTeams.Add(new
                    {
                        item.Team.TeamId,
                        item.Team.TeamName,
                        categoryId = item.Team.CategoryId,
                        totalScore = item.TotalScore
                    });

                    var memberIds = item.Team.Members.Select(m => m.UserId).ToList();
                    if (memberIds.Any())
                    {
                        await _notificationService.CreateForUsersAsync(
                            memberIds,
                            "Advanced to next round",
                            $"Congratulations! Team {item.Team.TeamName} has advanced to {nextRound.RoundName} with a total score of {item.TotalScore:F1}.",
                            "round_advance");
                    }
                }

                foreach (var item in losers)
                {
                    item.Team.Status = TeamStatus.Eliminated;
                    item.Team.EliminationReason = "Eliminated after round ranking.";
                    item.Team.EliminatedAt = DateTime.UtcNow;

                    eliminatedTeams.Add(new
                    {
                        item.Team.TeamId,
                        item.Team.TeamName,
                        categoryId = item.Team.CategoryId,
                        totalScore = item.TotalScore
                    });

                    var memberIds = item.Team.Members.Select(m => m.UserId).ToList();
                    if (memberIds.Any())
                    {
                        await _notificationService.CreateForUsersAsync(
                            memberIds,
                            "Team eliminated",
                            $"Team {item.Team.TeamName} was eliminated after round ranking of {currentRound.RoundName} with a score of {item.TotalScore:F1}.",
                            "round_eliminate");
                    }
                }
            }

            await _context.SaveChangesAsync();

            return ServiceResult.Ok(new
            {
                message = "Round advanced successfully.",
                fromRound = new
                {
                    currentRound.RoundId,
                    currentRound.RoundName
                },
                toRound = new
                {
                    nextRound.RoundId,
                    nextRound.RoundName
                },
                advancedTeams,
                eliminatedTeams
            });
        }
    }
}
