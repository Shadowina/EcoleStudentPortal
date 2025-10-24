using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoleStudentPortal.Models
{
    [Table("DepartmentAdmins")]
    public class DepartmentAdmin
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [ForeignKey("User")]
        public Guid UserId { get; set; }
        public virtual User User { get; set; } = default!;

        public string? RoleTitle { get; set; }

        // 1:N managed departments
        public virtual ICollection<Department> ManagedDepartments { get; set; } = new List<Department>();
    }
}
