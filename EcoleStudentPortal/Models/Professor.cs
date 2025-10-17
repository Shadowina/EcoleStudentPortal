using System.ComponentModel.DataAnnotations.Schema;

namespace EcoleStudentPortal.Models
{
    [Table("Professors")]
    public class Professor : User
    {
        public string? Specialization { get; set; }

        [ForeignKey("Department")]
        public Guid DepartmentId { get; set; }
        public virtual Department Department { get; set; } = default!;

        // M:N with Course via ProfessorCourse
        public virtual ICollection<ProfessorCourse> ProfessorCourses { get; set; } = new List<ProfessorCourse>();
    }
}
