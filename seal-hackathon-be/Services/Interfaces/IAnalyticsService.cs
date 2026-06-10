using SEAL.NET.DTOs.Analytics;

namespace SEAL.NET.Services.Interfaces
{
    /// <summary>
    /// Inter-rater reliability analytics extracted from <c>AnalyticsController</c>
    /// (ICC computation, per-criterion agreement, per-team variance).
    /// </summary>
    public interface IAnalyticsService
    {
        Task<InterRaterAnalyticsDto> GetInterRaterAsync(Guid? eventId);
    }
}
