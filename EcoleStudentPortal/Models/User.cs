using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoleStudentPortal.Models
{
    [Table("Users")]
    public class User
    {

        [Key]
        public Guid Id { get; set; }

        [Required] public string FirstName { get; set; } = default!;
        [Required] public string LastName { get; set; } = default!;
        [Required]
        public string Email { get; set; } = default!;
        [Required] public string Password { get; set; } = default!;
        public string? Address { get; set; }
        public string? PostalCode { get; set; }

        [Required]
        public string RegistrationNumber { get; set; } = default!;

        //public virtual Student? StudentProfile { get; set; }
        //public virtual Professor? ProfessorProfile { get; set; }
        //public virtual DepartmentAdmin? DepartmentAdminProfile { get; set; }
    }
}
