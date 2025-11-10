using System;
using System.Collections.Generic;
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
    public class CoursesController : ControllerBase
    {
        private readonly EcoleStudentPortalContext _context;

        public CoursesController(EcoleStudentPortalContext context)
        {
            _context = context;
        }

        // GET: api/Courses
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Course>>> GetCourses()
        {
            return await _context.Courses.ToListAsync();
        }

        // GET: api/Courses/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Course>> GetCourse(Guid id)
        {
            var course = await _context.Courses.FindAsync(id);

            if (course == null)
            {
                return NotFound();
            }

            return course;
        }

        // PUT: api/Courses/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCourse(Guid id, Course course)
        {
            // Get the existing course from the database
            var existingCourse = await _context.Courses.FindAsync(id);
            if (existingCourse == null)
            {
                return NotFound();
            }

            existingCourse.CourseName = course.CourseName;
            existingCourse.Description = course.Description;
            existingCourse.CreditWeight = course.CreditWeight;
            existingCourse.CourseContent = course.CourseContent;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CourseExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/Courses
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Course>> PostCourse(Course course)
        {
            // Generate ID if not provided or empty
            if (course.Id == Guid.Empty)
            {
                course.Id = Guid.NewGuid();
            }

            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetCourse", new { id = course.Id }, course);
        }

        // DELETE: api/Courses/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCourse(Guid id)
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null)
            {
                return NotFound();
            }

            // Check if course has schedules
            var hasSchedules = await _context.CourseSchedules.AnyAsync(cs => cs.CourseId == id);
            if (hasSchedules)
            {
                return BadRequest(new { message = "Cannot delete course. It has schedules assigned. Please remove schedules first." });
            }

            // Check if course has grades
            var hasGrades = await _context.Grades.AnyAsync(g => g.CourseId == id);
            if (hasGrades)
            {
                return BadRequest(new { message = "Cannot delete course. It has grades assigned. Please remove grades first." });
            }

            // Check if course is assigned to professors
            var hasProfessorCourses = await _context.ProfessorCourses.AnyAsync(pc => pc.CourseId == id);
            if (hasProfessorCourses)
            {
                return BadRequest(new { message = "Cannot delete course. It is assigned to professors. Please remove professor assignments first." });
            }

            // Check if course is assigned to programmes
            var hasProgrammeCourses = await _context.ProgrammeCourses.AnyAsync(pc => pc.CourseId == id);
            if (hasProgrammeCourses)
            {
                return BadRequest(new { message = "Cannot delete course. It is assigned to programmes. Please remove programme assignments first." });
            }

            _context.Courses.Remove(course);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CourseExists(Guid id)
        {
            return _context.Courses.Any(e => e.Id == id);
        }
    }
}
