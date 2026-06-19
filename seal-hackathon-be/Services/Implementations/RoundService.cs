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
            {
                var finalTeams = await _context.Teams
                    .Include(t => t.Category)
                    .Include(t => t.Members)
                    .Include(t => t.Submissions.Where(s => s.RoundId == roundId))
                        .ThenInclude(s => s.Scores)
                            .ThenInclude(sc => sc.Criteria)
                    .Where(t =>
                        t.CurrentRoundId == roundId &&
                        t.Status == TeamStatus.Approved)
                    .ToListAsync();

                if (!finalTeams.Any())
                    return ServiceResult.BadRequest("No active teams found for the final round.");

                var eventPrizes = await _context.Prizes
                    .Where(p => p.EventId == currentRound.EventId)
                    .OrderBy(p => p.Rank)
                    .ToListAsync();

                var groupedByFinalCategory = finalTeams.GroupBy(t => t.CategoryId);
                var finalResults = new List<object>();

                foreach (var categoryGroup in groupedByFinalCategory)
                {
                    var rankedTeams = categoryGroup
                        .Select(t => {
                            var submission = t.Submissions.FirstOrDefault();
                            decimal averageScore = 0;
                            if (submission != null)
                            {
                                var judgeScores = submission.Scores
                                    .GroupBy(sc => sc.JudgeId)
                                    .Select(g => g.Sum(sc =>
                                        sc.Criteria == null || sc.Criteria.MaxScore == 0
                                            ? 0
                                            : (sc.ScoreValue / sc.Criteria.MaxScore) * sc.Criteria.Weight))
                                    .ToList();
                                
                                averageScore = judgeScores.Any() ? judgeScores.Average() : 0m;
                            }

                            return new
                            {
                                Team = t,
                                TotalScore = averageScore,
                                CategoryName = t.Category?.CategoryName ?? string.Empty
                            };
                        })
                        .OrderByDescending(x => x.TotalScore)
                        .ToList();

                    for (int i = 0; i < rankedTeams.Count; i++)
                    {
                        var item = rankedTeams[i];
                        int rank = i + 1;
                        item.Team.FinalRank = rank;

                        var matchedPrize = eventPrizes.FirstOrDefault(p =>
                            p.Rank == rank &&
                            !string.IsNullOrEmpty(p.Track) &&
                            p.Track.Equals(item.CategoryName, StringComparison.OrdinalIgnoreCase));

                        if (matchedPrize == null)
                        {
                            matchedPrize = eventPrizes.FirstOrDefault(p =>
                                p.Rank == rank &&
                                string.IsNullOrEmpty(p.Track));
                        }

                        if (matchedPrize != null)
                        {
                            item.Team.FinalPrize = $"{matchedPrize.Title} ({matchedPrize.Amount})";
                        }

                        if (rank == 1)
                        {
                            item.Team.Status = TeamStatus.Champion;
                        }

                        finalResults.Add(new
                        {
                            item.Team.TeamId,
                            item.Team.TeamName,
                            categoryName = item.CategoryName,
                            finalRank = rank,
                            finalPrize = item.Team.FinalPrize,
                            totalScore = item.TotalScore
                        });

                        var memberIds = item.Team.Members.Select(m => m.UserId).ToList();
                        if (memberIds.Any())
                        {
                          var notificationMessage = matchedPrize != null
                            ? $"Congratulations! Your team {item.Team.TeamName} finished in the Top {rank} of the {item.CategoryName} track. You have won the prize: {matchedPrize.Title} worth {matchedPrize.Amount}."
                            : $"Your team {item.Team.TeamName} has completed the competition in the Top {rank} of the {item.CategoryName} track.";
                            
                            await _notificationService.CreateForUsersAsync(
                                memberIds,
                                "Final Competition Results",
                                notificationMessage,
                                "competition_results");
                        }
                    }
                }

                var eventItem = await _context.Events.FindAsync(currentRound.EventId);
                if (eventItem != null)
                {
                    eventItem.Status = EventStatus.Completed;
                }

                await _context.SaveChangesAsync();

                return ServiceResult.Ok(new
                {
                    message = "Competition completed successfully. All teams have been ranked, prizes awarded, and notifications sent.",
                    eventCompleted = true,
                    finalResults
                });
            }

            var teams = await _context.Teams
                .Include(t => t.Category)
                .Include(t => t.Members)
                .Include(t => t.Submissions.Where(s => s.RoundId == roundId))
                    .ThenInclude(s => s.Scores)
                        .ThenInclude(sc => sc.Criteria)
                .Where(t =>
                    t.CurrentRoundId == roundId &&
                    t.Status == TeamStatus.Approved)
                .ToListAsync();

            if (!teams.Any())
                return ServiceResult.BadRequest("No active teams found for this round.");

            var groupedByCategory = teams
                .GroupBy(t => t.CategoryId);

            var advancedTeams = new List<object>();
            var eliminatedTeams = new List<object>();

            foreach (var categoryGroup in groupedByCategory)
            {
                var rankedTeams = categoryGroup
                    .Select(t => {
                        var submission = t.Submissions.FirstOrDefault();
                        decimal averageScore = 0;
                        if (submission != null)
                        {
                            var judgeScores = submission.Scores
                                .GroupBy(sc => sc.JudgeId)
                                .Select(g => g.Sum(sc =>
                                    sc.Criteria == null || sc.Criteria.MaxScore == 0
                                        ? 0
                                        : (sc.ScoreValue / sc.Criteria.MaxScore) * sc.Criteria.Weight))
                                .ToList();
                            
                            averageScore = judgeScores.Any() ? judgeScores.Average() : 0m;
                        }

                        return new
                        {
                            Team = t,
                            TotalScore = averageScore,
                            Submitted = submission != null
                        };
                    })
                    .OrderByDescending(x => x.TotalScore)
                    .ToList();

                var winners = rankedTeams
                    .Where(x => x.TotalScore >= 40m)
                    .ToList();

                var losers = rankedTeams
                    .Where(x => x.TotalScore < 40m)
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
                    item.Team.EliminationReason = item.Submitted 
                        ? "Eliminated because score was below 40." 
                        : "Eliminated because no project was submitted.";
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
                        var reasonMsg = item.Submitted
                            ? $"score was {item.TotalScore:F1} (minimum required: 40)"
                            : "no project was submitted before the deadline";

                        await _notificationService.CreateForUsersAsync(
                            memberIds,
                            "Team eliminated",
                            $"Team {item.Team.TeamName} was eliminated after {currentRound.RoundName} because {reasonMsg}.",
                            "round_eliminate");
                    }
                }
            }

            await _context.SaveChangesAsync();

            return ServiceResult.Ok(new
            {
                message = "Round advanced successfully based on score threshold (>= 40).",
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
