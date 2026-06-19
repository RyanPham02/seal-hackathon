using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.DTOs.Round;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Controllers
{
    [Route("api/events/{eventId}/rounds")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class RoundsController : ControllerBase
    {
        private readonly IRoundService _roundService;

        public RoundsController(IRoundService roundService)
        {
            _roundService = roundService;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetRounds(Guid eventId)
            => this.ToActionResult(await _roundService.GetRoundsAsync(eventId));

        [HttpGet("{roundId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRoundById(Guid eventId, Guid roundId)
            => this.ToActionResult(await _roundService.GetRoundByIdAsync(eventId, roundId));

        [HttpPost]
        public async Task<IActionResult> CreateRound(Guid eventId, [FromBody] CreateRoundRequest request)
            => this.ToActionResult(await _roundService.CreateRoundAsync(eventId, request));

        [HttpPut("{roundId}")]
        public async Task<IActionResult> UpdateRound(Guid eventId, Guid roundId, [FromBody] UpdateRoundRequest request)
            => this.ToActionResult(await _roundService.UpdateRoundAsync(eventId, roundId, request));

        [HttpDelete("{roundId}")]
        public async Task<IActionResult> DeleteRound(Guid eventId, Guid roundId)
            => this.ToActionResult(await _roundService.DeleteRoundAsync(eventId, roundId));
    }
}
