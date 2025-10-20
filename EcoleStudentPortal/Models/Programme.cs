using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoleStudentPortal.Models
{
    [Table("Programmes")]
    public class Programme
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string ProgrammeName { get; set; } = default!;

        [Required]
        public DateOnly SessionStart { get; set; }

        [Required]
        public DateOnly SessionEnd { get; set; }

        [ForeignKey("Department")]
        public Guid DepartmentId { get; set; }
        public virtual Department Department { get; set; } = default!;

        // 1:N with Student
        public virtual ICollection<Student> Students { get; set; } = new List<Student>();

        // M:N with Course via ProgrammeCourse
        public virtual ICollection<ProgrammeCourse> ProgrammeCourses { get; set; } = new List<ProgrammeCourse>();
    }
}
