using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.DTOs.Event;
using SEAL.NET.Services.Interfaces;
using System.Security.Claims;

namespace SEAL.NET.Controllers
{
    [ApiController]                   
    [Route("api/[controller]")]       
    public class EventsController : ControllerBase
    {
        private readonly IEventService _eventService;
        private readonly IAuditLogService _auditLogService;

        public EventsController(IEventService eventService, IAuditLogService auditLogService)
        {
            _eventService = eventService;
            _auditLogService = auditLogService;
        }

        private Guid? GetActorUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(userId, out var parsed) ? parsed : null;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllEvents()
        {
            var result = await _eventService.GetAllEventsAsync();
            return Ok(result);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetEventById(Guid id)
        {
            var result = await _eventService.GetEventByIdAsync(id);
            if (result == null) return NotFound(new { message = "Event not found." });
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateEvent([FromBody] CreateEventRequest request)
        {
            var result = await _eventService.CreateEventAsync(request);
            if (!result.Success) return BadRequest(new { message = result.Message });
            await _auditLogService.LogAsync(
                GetActorUserId(),
                "create_event",
                "Event",
                result.Id?.ToString(),
                $"Created event {request.EventName}.");
            return CreatedAtAction(nameof(GetEventById), new { id = result.Id }, new { id = result.Id });
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateEvent(Guid id, [FromBody] UpdateEventRequest request)
        {
            var result = await _eventService.UpdateEventAsync(id, request);
            if (!result.Success) return BadRequest(new { message = result.Message });
            await _auditLogService.LogAsync(
                GetActorUserId(),
                "update_event",
                "Event",
                id.ToString(),
                $"Updated event {request.EventName}.");
            return Ok(new { message = result.Message });
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteEvent(Guid id)
        {
            var result = await _eventService.DeleteEventAsync(id);
            if (!result.Success) return BadRequest(new { message = result.Message });
            await _auditLogService.LogAsync(
                GetActorUserId(),
                "delete_event",
                "Event",
                id.ToString(),
                $"Deleted event {id}.");
            return Ok(new { message = result.Message });
        }
    }
}
