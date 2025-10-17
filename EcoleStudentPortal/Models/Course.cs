using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics;

namespace EcoleStudentPortal.Models
{
    [Table("Courses")]
    public class Course
    {
        [Key]
        public Guid Id { get; set; }

        [Required] public string CourseName { get; set; } = default!;
        public string? Description { get; set; }
        [Required] public int CreditWeight { get; set; }
        public string? CourseContent { get; set; }

        // 1:N with CourseSchedule
        public virtual ICollection<CourseSchedule> Schedules { get; set; } = new List<CourseSchedule>();

        // M:N with Student via Grade
        public virtual ICollection<Grade> Grades { get; set; } = new List<Grade>();

        // M:N with Professor via ProfessorCourse
        public virtual ICollection<ProfessorCourse> ProfessorCourses { get; set; } = new List<ProfessorCourse>();

        // M:N with Programme via ProgrammeCourse
        public virtual ICollection<ProgrammeCourse> ProgrammeCourses { get; set; } = new List<ProgrammeCourse>();
    }
}
