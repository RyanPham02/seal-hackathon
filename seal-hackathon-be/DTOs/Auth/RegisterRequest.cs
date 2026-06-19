using System.ComponentModel.DataAnnotations;
using SEAL.NET.Models.Enums;

namespace SEAL.NET.DTOs.Auth
{
    public class RegisterRequest
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        public StudentType StudentType { get; set; }

        [Required]
        public string StudentCode { get; set; } = string.Empty;

        public string? SchoolName { get; set; }

        [Required]
        [Phone]
        [MaxLength(30)]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        public string DeveloperRole { get; set; } = string.Empty;

        [Required]
        [MinLength(1, ErrorMessage = "Select at least one programming language or technology.")]
        public List<string> ProgrammingLanguages { get; set; } = new();
    }
}
