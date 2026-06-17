using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.DTOs.Prize;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PrizesController : ControllerBase
    {
        private readonly IPrizeService _prizeService;

        public PrizesController(IPrizeService prizeService)
        {
            _prizeService = prizeService;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetPrizes([FromQuery] Guid? eventId)
            => this.ToActionResult(await _prizeService.GetPrizesAsync(eventId));

        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPrizeById(Guid id)
            => this.ToActionResult(await _prizeService.GetPrizeByIdAsync(id));

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreatePrize([FromBody] CreatePrizeRequest request)
            => this.ToActionResult(await _prizeService.CreatePrizeAsync(request));

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdatePrize(Guid id, [FromBody] UpdatePrizeRequest request)
            => this.ToActionResult(await _prizeService.UpdatePrizeAsync(id, request));

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeletePrize(Guid id)
            => this.ToActionResult(await _prizeService.DeletePrizeAsync(id));
    }
}
