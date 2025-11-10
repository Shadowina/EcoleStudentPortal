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
    public class ProgrammeCoursesController : ControllerBase
    {
        private readonly EcoleStudentPortalContext _context;

        public ProgrammeCoursesController(EcoleStudentPortalContext context)
        {
            _context = context;
        }

        // GET: api/ProgrammeCourses
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProgrammeCourse>>> GetProgrammeCourses()
        {
            return await _context.ProgrammeCourses.ToListAsync();
        }

        // GET: api/ProgrammeCourses/programme/{programmeId}
        [HttpGet("programme/{programmeId}")]
        public async Task<ActionResult<IEnumerable<ProgrammeCourse>>> GetProgrammeCoursesForProgramme(Guid programmeId)
        {
            var programmeCourses = await _context.ProgrammeCourses
                .Where(pc => pc.ProgrammeId == programmeId)
                .ToListAsync();

            if (!programmeCourses.Any())
            {
                return new List<ProgrammeCourse>();
            }

            return programmeCourses;
        }

        // POST: api/ProgrammeCourses
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<ProgrammeCourse>> PostProgrammeCourse(ProgrammeCourseRequest request)
        {
            // Validate that Programme and Course exist
            var programmeExists = await _context.Programmes.AnyAsync(p => p.Id == request.ProgrammeId);
            if (!programmeExists)
            {
                return BadRequest(new { message = "Programme not found." });
            }

            var courseExists = await _context.Courses.AnyAsync(c => c.Id == request.CourseId);
            if (!courseExists)
            {
                return BadRequest(new { message = "Course not found." });
            }

            // Check if the relationship already exists
            var exists = await _context.ProgrammeCourses.AnyAsync(pc =>
                pc.ProgrammeId == request.ProgrammeId &&
                pc.CourseId == request.CourseId);

            if (exists)
            {
                return Conflict(new { message = "This course is already assigned to the programme." });
            }

            var programmeCourse = new ProgrammeCourse
            {
                ProgrammeId = request.ProgrammeId,
                CourseId = request.CourseId
            };

            _context.ProgrammeCourses.Add(programmeCourse);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProgrammeCoursesForProgramme), new { programmeId = programmeCourse.ProgrammeId }, programmeCourse);
        }

        // DELETE: api/ProgrammeCourses/{programmeId}/{courseId}
        [HttpDelete("{programmeId}/{courseId}")]
        public async Task<IActionResult> DeleteProgrammeCourse(Guid programmeId, Guid courseId)
        {
            var programmeCourse = await _context.ProgrammeCourses
                .FirstOrDefaultAsync(pc => pc.ProgrammeId == programmeId && pc.CourseId == courseId);
            if (programmeCourse == null)
            {
                return NotFound();
            }

            _context.ProgrammeCourses.Remove(programmeCourse);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        public class ProgrammeCourseRequest
        {
            [Required]
            public Guid ProgrammeId { get; set; }
            [Required]
            public Guid CourseId { get; set; }
        }

    }
}
