using System.ComponentModel.DataAnnotations.Schema;

namespace EcoleStudentPortal.Models
{
    // Join table - composite PK configured in OnModelCreating
    [Table("ProgrammeCourses")]
    public class ProgrammeCourse
    {
        [ForeignKey("Programme")]
        public Guid ProgrammeId { get; set; }
        public virtual Programme Programme { get; set; } = default!;

        [ForeignKey("Course")]
        public Guid CourseId { get; set; }
        public virtual Course Course { get; set; } = default!;
    }
}
