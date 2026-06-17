using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;
using System.Security.Claims;

namespace SEAL.NET.Controllers
{
    [Route("api/judge/kick-requests")]
    [ApiController]
    [Authorize(Roles = "Admin,Judge")]
    public class JudgeKickRequestsController : ControllerBase
    {
        private readonly ITeamService _teamService;

        public JudgeKickRequestsController(ITeamService teamService)
        {
            _teamService = teamService;
        }

        private Guid GetCurrentUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
        }

        private IActionResult ToActionResult(ServiceResult result) => result.Outcome switch
        {
            ServiceOutcome.Ok => Ok(result.Body),
            ServiceOutcome.BadRequest => BadRequest(result.Body),
            ServiceOutcome.NotFound => NotFound(result.Body),
            ServiceOutcome.Forbidden => Forbid(),
            _ => StatusCode(500)
        };

        [HttpGet]
        public async Task<IActionResult> GetPendingKickRequests()
            => ToActionResult(await _teamService.GetPendingKickRequestsForJudgeAsync(GetCurrentUserId()));

        [HttpPost("{kickRequestId}/approve")]
        public async Task<IActionResult> ApproveKickRequest(Guid kickRequestId)
            => ToActionResult(await _teamService.ApproveKickRequestAsync(GetCurrentUserId(), kickRequestId));

        [HttpPost("{kickRequestId}/reject")]
        public async Task<IActionResult> RejectKickRequest(Guid kickRequestId)
            => ToActionResult(await _teamService.RejectKickRequestAsync(GetCurrentUserId(), kickRequestId));
    }
}
