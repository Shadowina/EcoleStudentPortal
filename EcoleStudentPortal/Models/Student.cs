using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoleStudentPortal.Models
{
    [Table("Students")]
    public class Student : User
    {
        [Required]
        public int Year { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? AverageGrade { get; set; }

        [ForeignKey("Programme")]
        public Guid ProgrammeId { get; set; }
        public virtual Programme Programme { get; set; } = default!;

        // M:N with Course via Grade
        public virtual ICollection<Grade> Grades { get; set; } = new List<Grade>();
    }
}
