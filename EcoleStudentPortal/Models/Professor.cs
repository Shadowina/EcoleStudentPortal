using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoleStudentPortal.Models
{
    [Table("Professors")]
    public class Professor
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [ForeignKey("User")]
        public Guid UserId { get; set; }
        public virtual User User { get; set; } = default!;

        public string? Specialization { get; set; }

        [ForeignKey("Department")]
        public Guid DepartmentId { get; set; }
        public virtual Department Department { get; set; } = default!;

        // M:N with Course via ProfessorCourse
        public virtual ICollection<ProfessorCourse> ProfessorCourses { get; set; } = new List<ProfessorCourse>();
    }
}
