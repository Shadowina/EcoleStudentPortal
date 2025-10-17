using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoleStudentPortal.Models
{
    [Table("CourseSchedules")]
    public class CourseSchedule
    {
        [Key]
        public Guid Id { get; set; }

        [Required] public string Location { get; set; } = default!;
        [Required] public DateOnly Date { get; set; }
        [Required] public TimeOnly StartTime { get; set; }
        [Required] public TimeOnly EndTime { get; set; }

        [ForeignKey("Course")]
        public Guid CourseId { get; set; }
        public virtual Course Course { get; set; } = default!;
    }
}
