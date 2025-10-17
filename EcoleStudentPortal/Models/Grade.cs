using System.ComponentModel.DataAnnotations.Schema;

namespace EcoleStudentPortal.Models
{
    // Join + payload (Score) - composite PK configured in OnModelCreating
    [Table("Grades")]
    public class Grade
    {
        [ForeignKey("Student")]
        public Guid StudentId { get; set; }
        public virtual Student Student { get; set; } = default!;

        [ForeignKey("Course")]
        public Guid CourseId { get; set; }
        public virtual Course Course { get; set; } = default!;

        public decimal? Score { get; set; } // e.g., precision 5,2 via Fluent API
    }
}
