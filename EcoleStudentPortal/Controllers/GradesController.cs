using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcoleStudentPortal.Data;
using EcoleStudentPortal.Models;

namespace EcoleStudentPortal.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Requires authentication
    public class GradesController : ControllerBase
    {
        private readonly EcoleStudentPortalContext _context;

        public GradesController(EcoleStudentPortalContext context)
        {
            _context = context;
        }

        // GET: api/Grades
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Grade>>> GetGrades()
        {
            return await _context.Grades
                .Include(g => g.Student)
                .Include(g => g.Course)
                .ToListAsync();
        }

        // GET: api/Grades/student/{studentId}
        [HttpGet("student/{studentId}")]
        public async Task<ActionResult<IEnumerable<Grade>>> GetGradesForStudent(Guid studentId)
        {
            var grades = await _context.Grades
                .Include(g => g.Student)
                .Include(g => g.Course)
                .Where(g => g.StudentId == studentId)
                .ToListAsync();

            if (!grades.Any())
            {
                return new List<Grade>();
            }

            return grades;
        }

        // GET: api/Grades/{studentId}/{courseId}
        [HttpGet("{studentId}/{courseId}")]
        public async Task<ActionResult<Grade>> GetGrade(Guid studentId, Guid courseId)
        {
            var grade = await _context.Grades
                .Include(g => g.Student)
                .Include(g => g.Course)
                .FirstOrDefaultAsync(g => g.StudentId == studentId && g.CourseId == courseId);

            if (grade == null)
            {
                return NotFound();
            }

            return grade;
        }

        // PUT: api/Grades/{studentId}/{courseId}
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{studentId}/{courseId}")]
        public async Task<IActionResult> PutGrade(Guid studentId, Guid courseId, GradeRequest request)
        {
            // Validate that Student and Course exist
            var studentExists = await _context.Students.AnyAsync(s => s.Id == studentId);
            if (!studentExists)
            {
                return BadRequest(new { message = "Student not found." });
            }

            var courseExists = await _context.Courses.AnyAsync(c => c.Id == courseId);
            if (!courseExists)
            {
                return BadRequest(new { message = "Course not found." });
            }

            // Validate Score if provided
            if (request.Score.HasValue && (request.Score.Value < 0 || request.Score.Value > 100))
            {
                return BadRequest(new { message = "Score must be between 0 and 100." });
            }

            // Find existing grade or create new one
            var grade = await _context.Grades
                .FirstOrDefaultAsync(g => g.StudentId == studentId && g.CourseId == courseId);

            if (grade == null)
            {
                grade = new Grade
                {
                    StudentId = studentId,
                    CourseId = courseId,
                    Score = request.Score
                };
                _context.Grades.Add(grade);
            }
            else
            {
                grade.Score = request.Score;
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return BadRequest(new { message = "Error saving grade." });
            }

            return NoContent();
        }

        // POST: api/Grades
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Grade>> PostGrade(GradeRequest request)
        {
            // Validate that Student and Course exist
            var studentExists = await _context.Students.AnyAsync(s => s.Id == request.StudentId);
            if (!studentExists)
            {
                return BadRequest(new { message = "Student not found." });
            }

            var courseExists = await _context.Courses.AnyAsync(c => c.Id == request.CourseId);
            if (!courseExists)
            {
                return BadRequest(new { message = "Course not found." });
            }

            // Validate Score if provided
            if (request.Score.HasValue && (request.Score.Value < 0 || request.Score.Value > 100))
            {
                return BadRequest(new { message = "Score must be between 0 and 100." });
            }

            // Check if the grade already exists
            var exists = await _context.Grades.AnyAsync(g =>
                g.StudentId == request.StudentId &&
                g.CourseId == request.CourseId);

            if (exists)
            {
                return Conflict(new { message = "Grade for this student and course already exists. Use PUT to update." });
            }

            var grade = new Grade
            {
                StudentId = request.StudentId,
                CourseId = request.CourseId,
                Score = request.Score
            };

            _context.Grades.Add(grade);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetGrade), new { studentId = grade.StudentId, courseId = grade.CourseId }, grade);
        }

        // DELETE: api/Grades/{studentId}/{courseId}
        [HttpDelete("{studentId}/{courseId}")]
        public async Task<IActionResult> DeleteGrade(Guid studentId, Guid courseId)
        {
            var grade = await _context.Grades
                .FirstOrDefaultAsync(g => g.StudentId == studentId && g.CourseId == courseId);
            
            if (grade == null)
            {
                return NotFound();
            }

            _context.Grades.Remove(grade);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool GradeExists(Guid studentId, Guid courseId)
        {
            return _context.Grades.Any(g => g.StudentId == studentId && g.CourseId == courseId);
        }
    }

    // Grade request DTO (without navigation properties)
    public class GradeRequest
    {
        [Required]
        public Guid StudentId { get; set; }
        [Required]
        public Guid CourseId { get; set; }
        [Range(0, 100)]
        public decimal? Score { get; set; }
    }
}
