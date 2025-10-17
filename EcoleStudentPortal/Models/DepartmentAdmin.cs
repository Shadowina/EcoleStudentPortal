using System.ComponentModel.DataAnnotations.Schema;

namespace EcoleStudentPortal.Models
{
    [Table("DepartmentAdmins")]
    public class DepartmentAdmin : User
    {
        public string? RoleTitle { get; set; }

        // 1:N managed departments
        public virtual ICollection<Department> ManagedDepartments { get; set; } = new List<Department>();
    }
}
