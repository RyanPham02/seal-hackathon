using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Controllers
{
    [Route("api/ranking")]
    [ApiController]
    [Authorize]
    public class RankingController : ControllerBase
    {
        private readonly IRankingService _rankingService;

        public RankingController(IRankingService rankingService)
        {
            _rankingService = rankingService;
        }

        [HttpGet("round/{roundId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRoundRanking(Guid roundId)
            => Ok(await _rankingService.GetRoundRankingAsync(roundId));

        [HttpGet("category/{categoryId}/round/{roundId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategoryRoundRanking(Guid categoryId, Guid roundId)
            => Ok(await _rankingService.GetCategoryRoundRankingAsync(categoryId, roundId));
    }
}
