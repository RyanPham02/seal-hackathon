namespace SEAL.NET.Services.Interfaces
{
    /// <summary>
    /// Ranking computation extracted from <c>RankingController</c>: the weighted/normalized
    /// total-score formula, ordering, tie-breaking and rank numbering. Returns the ready-to-
    /// serialize projection the controller wraps in <c>Ok(...)</c>.
    /// </summary>
    public interface IRankingService
    {
        Task<object> GetRoundRankingAsync(Guid roundId);
        Task<object> GetCategoryRoundRankingAsync(Guid categoryId, Guid roundId);
    }
}
