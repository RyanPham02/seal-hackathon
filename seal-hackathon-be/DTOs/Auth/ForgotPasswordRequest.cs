using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.Auth
{
    public class ForgotPasswordRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }
}
