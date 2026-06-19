using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Judge")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsService _analyticsService;

        public AnalyticsController(IAnalyticsService analyticsService)
        {
            _analyticsService = analyticsService;
        }

        [HttpGet("inter-rater")]
        public async Task<IActionResult> GetInterRater([FromQuery] Guid? eventId)
            => Ok(await _analyticsService.GetInterRaterAsync(eventId));
    }
}
