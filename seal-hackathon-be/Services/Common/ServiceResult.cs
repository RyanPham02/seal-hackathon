namespace SEAL.NET.Services.Common
{
    public enum ServiceOutcome
    {
        Ok,
        Created,
        BadRequest,
        Unauthorized,
        NotFound,
        Forbidden,
        ServerError
    }

    /// <summary>
    /// Transport-agnostic result returned by service-layer methods. Controllers translate
    /// it into an <see cref="Microsoft.AspNetCore.Mvc.IActionResult"/>, keeping HTTP
    /// concerns out of the services and business logic out of the controllers.
    /// <para>
    /// The <see cref="Body"/> is the value serialized to the response, so services build
    /// the exact response shape (anonymous object or DTO) the frontend already expects.
    /// </para>
    /// </summary>
    public sealed class ServiceResult
    {
        public ServiceOutcome Outcome { get; }
        public object? Body { get; }

        /// <summary>Action name for a <see cref="ServiceOutcome.Created"/> result's Location header.</summary>
        public string? CreatedAtActionName { get; private init; }

        /// <summary>Route values for a <see cref="ServiceOutcome.Created"/> result's Location header.</summary>
        public object? CreatedRouteValues { get; private init; }

        private ServiceResult(ServiceOutcome outcome, object? body)
        {
            Outcome = outcome;
            Body = body;
        }

        public static ServiceResult Ok(object? body) => new(ServiceOutcome.Ok, body);

        /// <summary>201 Created with a Location header pointing at <paramref name="actionName"/>.</summary>
        public static ServiceResult Created(string actionName, object routeValues, object? body) =>
            new(ServiceOutcome.Created, body)
            {
                CreatedAtActionName = actionName,
                CreatedRouteValues = routeValues
            };

        /// <summary>200 with a simple <c>{ message }</c> body.</summary>
        public static ServiceResult OkMessage(string message) => new(ServiceOutcome.Ok, new { message });

        /// <summary>400 with a <c>{ message }</c> body.</summary>
        public static ServiceResult BadRequest(string message) => new(ServiceOutcome.BadRequest, new { message });

        /// <summary>400 with a custom body (e.g. <c>{ message, users }</c>).</summary>
        public static ServiceResult BadRequestBody(object body) => new(ServiceOutcome.BadRequest, body);

        /// <summary>401 with a <c>{ message }</c> body.</summary>
        public static ServiceResult Unauthorized(string message) => new(ServiceOutcome.Unauthorized, new { message });

        /// <summary>404 with a <c>{ message }</c> body.</summary>
        public static ServiceResult NotFound(string message) => new(ServiceOutcome.NotFound, new { message });

        /// <summary>403 (no body, mirrors <c>Forbid()</c>).</summary>
        public static ServiceResult Forbidden() => new(ServiceOutcome.Forbidden, null);

        /// <summary>500 with a <c>{ message }</c> body.</summary>
        public static ServiceResult ServerError(string message) => new(ServiceOutcome.ServerError, new { message });
    }
}
