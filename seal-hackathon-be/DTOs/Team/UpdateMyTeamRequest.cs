using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.Team
{
    public class UpdateMyTeamRequest
    {
        [Required]
        [MaxLength(100)]
        public string TeamName { get; set; } = string.Empty;
    }
}
