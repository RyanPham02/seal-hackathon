using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.DTOs.Team;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;
using System.Security.Claims;

namespace SEAL.NET.Controllers
{
    [Route("api")]
    [ApiController]
    [Authorize]
    public class MatchmakingController : ControllerBase
    {
        private readonly IMatchmakingService _matchmakingService;

        public MatchmakingController(IMatchmakingService matchmakingService)
        {
            _matchmakingService = matchmakingService;
        }

        private Guid? TryGetCurrentUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(raw, out var id) ? id : null;
        }

        [HttpGet("users/free-agents")]
        public async Task<IActionResult> GetFreeAgents(
            [FromQuery] Guid? eventId,
            [FromQuery] Guid? categoryId,
            [FromQuery] string? search,
            [FromQuery] string? role)
            => this.ToActionResult(await _matchmakingService.GetFreeAgentsAsync(eventId, categoryId, search, role));

        [HttpGet("matchmaking/suggestions")]
        public async Task<IActionResult> GetSuggestions()
            => this.ToActionResult(await _matchmakingService.GetSuggestionsAsync(TryGetCurrentUserId().GetValueOrDefault()));

        [HttpPost("teams/invitations")]
        public async Task<IActionResult> CreateInvitation([FromBody] CreateInvitationRequest request)
            => this.ToActionResult(await _matchmakingService.CreateInvitationAsync(TryGetCurrentUserId(), request));

        [HttpGet("teams/invitations/sent")]
        public async Task<IActionResult> GetSentInvitations()
            => this.ToActionResult(await _matchmakingService.GetSentInvitationsAsync(TryGetCurrentUserId()));

        [HttpGet("teams/invitations/received")]
        public async Task<IActionResult> GetReceivedInvitations()
            => this.ToActionResult(await _matchmakingService.GetReceivedInvitationsAsync(TryGetCurrentUserId()));

        [HttpPost("teams/invitations/{id}/accept")]
        public async Task<IActionResult> AcceptInvitation(Guid id)
            => this.ToActionResult(await _matchmakingService.AcceptInvitationAsync(TryGetCurrentUserId(), id));

        [HttpPost("teams/invitations/{id}/reject")]
        public async Task<IActionResult> RejectInvitation(Guid id)
            => this.ToActionResult(await _matchmakingService.RejectInvitationAsync(TryGetCurrentUserId(), id));

        [HttpPost("teams/invitations/{id}/cancel")]
        public async Task<IActionResult> CancelInvitation(Guid id)
            => this.ToActionResult(await _matchmakingService.CancelInvitationAsync(TryGetCurrentUserId(), id));
    }
}
