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
    [Authorize]
    public class ProfessorCoursesController : ControllerBase
    {
        private readonly EcoleStudentPortalContext _context;

        public ProfessorCoursesController(EcoleStudentPortalContext context)
        {
            _context = context;
        }

        // GET: api/ProfessorCourses
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProfessorCourse>>> GetProfessorCourses()
        {
            return await _context.ProfessorCourses.ToListAsync();
        }

        // GET: api/ProfessorCourses/professor/{professorId}
        [HttpGet("professor/{professorId}")]
        public async Task<ActionResult<IEnumerable<ProfessorCourse>>> GetProfessorCoursesForProfessor(Guid professorId)
        {
            var professorCourses = await _context.ProfessorCourses
                .Where(pc => pc.ProfessorId == professorId)
                .ToListAsync();

            if (!professorCourses.Any())
            {
                return new List<ProfessorCourse>();
            }

            return professorCourses;
        }

        // POST: api/ProfessorCourses
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<ProfessorCourse>> PostProfessorCourse(ProfessorCourseRequest request)
        {
            // Validate that Professor and Course exist
            var professorExists = await _context.Professors.AnyAsync(p => p.Id == request.ProfessorId);
            if (!professorExists)
            {
                return BadRequest(new { message = "Professor not found." });
            }

            var courseExists = await _context.Courses.AnyAsync(c => c.Id == request.CourseId);
            if (!courseExists)
            {
                return BadRequest(new { message = "Course not found." });
            }

            // Check if the relationship already exists
            var exists = await _context.ProfessorCourses.AnyAsync(pc =>
                pc.ProfessorId == request.ProfessorId &&
                pc.CourseId == request.CourseId);

            if (exists)
            {
                return Conflict(new { message = "This course is already assigned to the professor." });
            }

            var professorCourse = new ProfessorCourse
            {
                ProfessorId = request.ProfessorId,
                CourseId = request.CourseId
            };

            _context.ProfessorCourses.Add(professorCourse);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProfessorCoursesForProfessor), new { professorId = professorCourse.ProfessorId }, professorCourse);
        }

        // DELETE: api/ProfessorCourses/{professorId}/{courseId}
        [HttpDelete("{professorId}/{courseId}")]
        public async Task<IActionResult> DeleteProfessorCourse(Guid professorId, Guid courseId)
        {
            var professorCourse = await _context.ProfessorCourses
                .FirstOrDefaultAsync(pc => pc.ProfessorId == professorId && pc.CourseId == courseId);
            if (professorCourse == null)
            {
                return NotFound();
            }

            _context.ProfessorCourses.Remove(professorCourse);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    // ProfessorCourse request
    public class ProfessorCourseRequest
    {
        [Required]
        public Guid ProfessorId { get; set; }
        [Required]
        public Guid CourseId { get; set; }
    }
}
