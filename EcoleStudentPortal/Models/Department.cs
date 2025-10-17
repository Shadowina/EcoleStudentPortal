using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoleStudentPortal.Models
{
    [Table("Departments")]
    public class Department
    {
        [Key]
        public Guid Id { get; set; }

        [Required] public string DepartmentName { get; set; } = default!;
        public string? Description { get; set; }

        [ForeignKey("DepartmentAdmin")]
        public Guid DepartmentAdminId { get; set; }
        public virtual DepartmentAdmin DepartmentAdmin { get; set; } = default!;

        // 1:N with Professor, Programme
        public virtual ICollection<Professor> Professors { get; set; } = new List<Professor>();
        public virtual ICollection<Programme> Programmes { get; set; } = new List<Programme>();
    }
}
