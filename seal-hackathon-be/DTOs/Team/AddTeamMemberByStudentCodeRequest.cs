using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.Team
{
    public class AddTeamMemberByStudentCodeRequest
    {
        [Required]
        public string StudentCodeOrEmail { get; set; } = string.Empty;
    }
}
