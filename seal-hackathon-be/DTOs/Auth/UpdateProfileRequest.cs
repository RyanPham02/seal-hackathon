using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.Auth
{
    public class UpdateProfileRequest
    {
        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Phone]
        public string? PhoneNumber { get; set; }

        [MaxLength(50)]
        public string? StudentCode { get; set; }

        // Developer profile fields (optional, descriptive only — not auth roles).
        // DeveloperRole must be one of: Backend, Frontend, Fullstack (validated in
        // the controller). ProgrammingLanguages must be a list of allowed values.
        public string? DeveloperRole { get; set; }

        public List<string>? ProgrammingLanguages { get; set; }
    }
}
