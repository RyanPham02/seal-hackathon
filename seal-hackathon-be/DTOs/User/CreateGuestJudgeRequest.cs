using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.User
{
    public class CreateGuestJudgeRequest
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty;

        [MaxLength(150)]
        public string? Company { get; set; }
    }
}
