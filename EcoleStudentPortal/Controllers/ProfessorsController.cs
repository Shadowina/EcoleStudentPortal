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
    public class ProfessorsController : ControllerBase
    {
        private readonly EcoleStudentPortalContext _context;

        public ProfessorsController(EcoleStudentPortalContext context)
        {
            _context = context;
        }

        // GET: api/Professors
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Professor>>> GetProfessors()
        {
            return await _context.Professors
                .Include(p => p.User)
                .Include(p => p.Department)
                .ToListAsync();
        }

        // GET: api/Professors/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Professor>> GetProfessor(Guid id)
        {
            var professor = await _context.Professors
                .Include(p => p.User)
                .Include(p => p.Department)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (professor == null)
            {
                return NotFound();
            }

            return professor;
        }

        // PUT: api/Professors/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProfessor(Guid id, ProfessorRequest request)
        {
            // Get the existing professor from the database
            var existingProfessor = await _context.Professors.FindAsync(id);
            if (existingProfessor == null)
            {
                return NotFound();
            }

            // Validate Department if provided
            if (request.DepartmentId.HasValue)
            {
                var departmentExists = await _context.Departments.AnyAsync(d => d.Id == request.DepartmentId.Value);
                if (!departmentExists)
                {
                    return BadRequest(new { message = "Department not found." });
                }
            }

            // Update only allowed properties (Specialization, DepartmentId)
            existingProfessor.Specialization = request.Specialization;
            existingProfessor.DepartmentId = request.DepartmentId;

            if (request.DepartmentId.HasValue)
            {
                existingProfessor.Department = await _context.Departments.FindAsync(request.DepartmentId.Value);
            }
            else
            {
                existingProfessor.Department = null;
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProfessorExists(id))
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


        // DELETE: api/Professors/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProfessor(Guid id)
        {
            var professor = await _context.Professors.FindAsync(id);
            if (professor == null)
            {
                return NotFound();
            }

            // Check if professor has course assignments
            var hasCourseAssignments = await _context.ProfessorCourses.AnyAsync(pc => pc.ProfessorId == id);
            if (hasCourseAssignments)
            {
                return BadRequest(new { message = "Cannot delete professor. They have courses assigned. Please remove course assignments first." });
            }

            _context.Professors.Remove(professor);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ProfessorExists(Guid id)
        {
            return _context.Professors.Any(e => e.Id == id);
        }
    }

    // Professor request
    public class ProfessorRequest
    {
        [Required]
        public Guid UserId { get; set; }
        public string? Specialization { get; set; }
        public Guid? DepartmentId { get; set; }
    }
}
