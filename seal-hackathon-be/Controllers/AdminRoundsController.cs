using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Controllers
{
    [Route("api/admin/rounds")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminRoundsController : ControllerBase
    {
        private readonly IRoundService _roundService;

        public AdminRoundsController(IRoundService roundService)
        {
            _roundService = roundService;
        }

        [HttpPost("{roundId}/advance")]
        public async Task<IActionResult> AdvanceRound(Guid roundId)
            => this.ToActionResult(await _roundService.AdvanceRoundAsync(roundId));
    }
}
