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
    public class CourseSchedulesController : ControllerBase
    {
        private readonly EcoleStudentPortalContext _context;

        public CourseSchedulesController(EcoleStudentPortalContext context)
        {
            _context = context;
        }

        // GET: api/CourseSchedules
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CourseSchedule>>> GetCourseSchedules()
        {
            return await _context.CourseSchedules
                .Include(cs => cs.Course)
                .ToListAsync();
        }

        // GET: api/CourseSchedules/5
        [HttpGet("{id}")]
        public async Task<ActionResult<CourseSchedule>> GetCourseSchedule(Guid id)
        {
            var courseSchedule = await _context.CourseSchedules
                .Include(cs => cs.Course)
                .FirstOrDefaultAsync(cs => cs.Id == id);

            if (courseSchedule == null)
            {
                return NotFound();
            }

            return courseSchedule;
        }

        // PUT: api/CourseSchedules/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCourseSchedule(Guid id, CourseScheduleRequest request)
        {
            // Get the existing course schedule from the database
            var existingSchedule = await _context.CourseSchedules.FindAsync(id);
            if (existingSchedule == null)
            {
                return NotFound();
            }

            // Validate that Course exists
            var courseExists = await _context.Courses.AnyAsync(c => c.Id == request.CourseId);
            if (!courseExists)
            {
                return BadRequest(new { message = "Course not found." });
            }

            // Validate that end time is after start time
            if (request.EndTime <= request.StartTime)
            {
                return BadRequest(new { message = "End time must be after start time." });
            }

            existingSchedule.CourseId = request.CourseId;
            existingSchedule.Location = request.Location;
            existingSchedule.Date = request.Date;
            existingSchedule.StartTime = request.StartTime;
            existingSchedule.EndTime = request.EndTime;

            var course = await _context.Courses.FindAsync(request.CourseId);
            if (course != null)
            {
                existingSchedule.Course = course;
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CourseScheduleExists(id))
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

        // POST: api/CourseSchedules
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<CourseSchedule>> PostCourseSchedule(CourseScheduleRequest request)
        {
            // Validate that Course exists
            var courseExists = await _context.Courses.AnyAsync(c => c.Id == request.CourseId);
            if (!courseExists)
            {
                return BadRequest(new { message = "Course not found." });
            }

            // Validate that end time is after start time
            if (request.EndTime <= request.StartTime)
            {
                return BadRequest(new { message = "End time must be after start time." });
            }

            // Generate ID if not provided
            var course = await _context.Courses.FindAsync(request.CourseId);
            if (course == null)
            {
                return BadRequest(new { message = "Course not found." });
            }

            var courseSchedule = new CourseSchedule
            {
                Id = Guid.NewGuid(),
                CourseId = request.CourseId,
                Location = request.Location,
                Date = request.Date,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                Course = course
            };

            _context.CourseSchedules.Add(courseSchedule);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetCourseSchedule", new { id = courseSchedule.Id }, courseSchedule);
        }

        // DELETE: api/CourseSchedules/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCourseSchedule(Guid id)
        {
            var courseSchedule = await _context.CourseSchedules.FindAsync(id);
            if (courseSchedule == null)
            {
                return NotFound();
            }

            _context.CourseSchedules.Remove(courseSchedule);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CourseScheduleExists(Guid id)
        {
            return _context.CourseSchedules.Any(e => e.Id == id);
        }
    }

    // CourseSchedule request
    public class CourseScheduleRequest
    {
        [Required]
        public Guid CourseId { get; set; }
        [Required]
        public string Location { get; set; } = default!;
        [Required]
        public DateOnly Date { get; set; }
        [Required]
        public TimeOnly StartTime { get; set; }
        [Required]
        public TimeOnly EndTime { get; set; }
    }
}
