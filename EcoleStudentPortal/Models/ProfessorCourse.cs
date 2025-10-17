using System.ComponentModel.DataAnnotations.Schema;

namespace EcoleStudentPortal.Models
{

    // Join table - composite PK configured in OnModelCreating
    [Table("ProfessorCourses")]
    public class ProfessorCourse
    {
        [ForeignKey("Professor")]
        public Guid ProfessorId { get; set; }
        public virtual Professor Professor { get; set; } = default!;

        [ForeignKey("Course")]
        public Guid CourseId { get; set; }
        public virtual Course Course { get; set; } = default!;
    }
}
