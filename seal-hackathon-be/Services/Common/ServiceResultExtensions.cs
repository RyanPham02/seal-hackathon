using Microsoft.AspNetCore.Mvc;

namespace SEAL.NET.Services.Common
{
    /// <summary>
    /// Translates a transport-agnostic <see cref="ServiceResult"/> into an
    /// <see cref="IActionResult"/>. Keeps controllers thin: they call a service and
    /// hand the result straight to this mapper.
    /// </summary>
    public static class ServiceResultExtensions
    {
        public static IActionResult ToActionResult(this ControllerBase controller, ServiceResult result) =>
            result.Outcome switch
            {
                ServiceOutcome.Ok => controller.Ok(result.Body),
                ServiceOutcome.Created => controller.CreatedAtAction(
                    result.CreatedAtActionName, result.CreatedRouteValues, result.Body),
                ServiceOutcome.BadRequest => controller.BadRequest(result.Body),
                ServiceOutcome.Unauthorized => controller.Unauthorized(result.Body),
                ServiceOutcome.NotFound => controller.NotFound(result.Body),
                ServiceOutcome.Forbidden => controller.Forbid(),
                ServiceOutcome.ServerError => controller.StatusCode(500, result.Body),
                _ => controller.StatusCode(500)
            };
    }
}
