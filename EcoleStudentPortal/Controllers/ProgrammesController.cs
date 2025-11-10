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
    public class ProgrammesController : ControllerBase
    {
        private readonly EcoleStudentPortalContext _context;

        public ProgrammesController(EcoleStudentPortalContext context)
        {
            _context = context;
        }

        // GET: api/Programmes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Programme>>> GetProgrammes()
        {
            return await _context.Programmes.ToListAsync();
        }

        // GET: api/Programmes/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Programme>> GetProgramme(Guid id)
        {
            var programme = await _context.Programmes.FindAsync(id);

            if (programme == null)
            {
                return NotFound();
            }

            return programme;
        }

        // PUT: api/Programmes/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProgramme(Guid id, ProgrammeRequest request)
        {
            // Validate that Department exists
            var department = await _context.Departments.FindAsync(request.DepartmentId);
            if (department == null)
            {
                return BadRequest(new { message = "Department not found." });
            }

            // Get the existing programme from the database
            var existingProgramme = await _context.Programmes.FindAsync(id);
            if (existingProgramme == null)
            {
                return NotFound();
            }

            // Validate session dates
            if (request.SessionEnd <= request.SessionStart)
            {
                return BadRequest(new { message = "Session end date must be after session start date." });
            }

            existingProgramme.ProgrammeName = request.ProgrammeName;
            existingProgramme.SessionStart = request.SessionStart;
            existingProgramme.SessionEnd = request.SessionEnd;
            existingProgramme.DepartmentId = request.DepartmentId;
            existingProgramme.Department = department;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProgrammeExists(id))
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

        // POST: api/Programmes
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Programme>> PostProgramme(ProgrammeRequest request)
        {
            // Validate that Department exists
            var department = await _context.Departments.FindAsync(request.DepartmentId);
            if (department == null)
            {
                return BadRequest(new { message = "Department not found." });
            }

            // Validate session dates
            if (request.SessionEnd <= request.SessionStart)
            {
                return BadRequest(new { message = "Session end date must be after session start date." });
            }

            // Create new programme entity
            var programme = new Programme
            {
                Id = Guid.NewGuid(),
                ProgrammeName = request.ProgrammeName,
                SessionStart = request.SessionStart,
                SessionEnd = request.SessionEnd,
                DepartmentId = request.DepartmentId,
                Department = department
            };

            _context.Programmes.Add(programme);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetProgramme", new { id = programme.Id }, programme);
        }

        // DELETE: api/Programmes/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProgramme(Guid id)
        {
            var programme = await _context.Programmes.FindAsync(id);
            if (programme == null)
            {
                return NotFound();
            }

            _context.Programmes.Remove(programme);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ProgrammeExists(Guid id)
        {
            return _context.Programmes.Any(e => e.Id == id);
        }
    }

    // Programme request
    public class ProgrammeRequest
    {
        [Required]
        public string ProgrammeName { get; set; } = default!;
        [Required]
        public DateOnly SessionStart { get; set; }
        [Required]
        public DateOnly SessionEnd { get; set; }
        [Required]
        public Guid DepartmentId { get; set; }
    }
}
