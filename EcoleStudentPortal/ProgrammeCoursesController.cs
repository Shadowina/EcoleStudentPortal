using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcoleStudentPortal.Data;
using EcoleStudentPortal.Models;

namespace EcoleStudentPortal
{
    [Route("api/[controller]")]
    [ApiController]
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

        // GET: api/ProgrammeCourses/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ProgrammeCourse>> GetProgrammeCourse(Guid id)
        {
            var programmeCourse = await _context.ProgrammeCourses.FindAsync(id);

            if (programmeCourse == null)
            {
                return NotFound();
            }

            return programmeCourse;
        }

        // PUT: api/ProgrammeCourses/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProgrammeCourse(Guid id, ProgrammeCourse programmeCourse)
        {
            if (id != programmeCourse.ProgrammeId)
            {
                return BadRequest();
            }

            _context.Entry(programmeCourse).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProgrammeCourseExists(id))
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

        // POST: api/ProgrammeCourses
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<ProgrammeCourse>> PostProgrammeCourse(ProgrammeCourse programmeCourse)
        {
            _context.ProgrammeCourses.Add(programmeCourse);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (ProgrammeCourseExists(programmeCourse.ProgrammeId))
                {
                    return Conflict();
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetProgrammeCourse", new { id = programmeCourse.ProgrammeId }, programmeCourse);
        }

        // DELETE: api/ProgrammeCourses/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProgrammeCourse(Guid id)
        {
            var programmeCourse = await _context.ProgrammeCourses.FindAsync(id);
            if (programmeCourse == null)
            {
                return NotFound();
            }

            _context.ProgrammeCourses.Remove(programmeCourse);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ProgrammeCourseExists(Guid id)
        {
            return _context.ProgrammeCourses.Any(e => e.ProgrammeId == id);
        }
    }
}
