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
    public class StudentsController : ControllerBase
    {
        private readonly EcoleStudentPortalContext _context;

        public StudentsController(EcoleStudentPortalContext context)
        {
            _context = context;
        }

        // GET: api/Students
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Student>>> GetStudents()
        {
            return await _context.Students
                .Include(s => s.User)
                .Include(s => s.Programme)
                .ToListAsync();
        }

        // GET: api/Students/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Student>> GetStudent(Guid id)
        {
            var student = await _context.Students
                .Include(s => s.User)
                .Include(s => s.Programme)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (student == null)
            {
                return NotFound();
            }

            return student;
        }

        // PUT: api/Students/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutStudent(Guid id, StudentRequest request)
        {
            var existingStudent = await _context.Students.FindAsync(id);
            if (existingStudent == null)
            {
                return NotFound();
            }

            if (request.UserId != existingStudent.UserId)
            {
                return BadRequest(new { message = "Cannot change UserId. User must remain the same." });
            }

            if (request.ProgrammeId.HasValue)
            {
                var programmeExists = await _context.Programmes.AnyAsync(p => p.Id == request.ProgrammeId.Value);
                if (!programmeExists)
                {
                    return BadRequest(new { message = "Programme not found." });
                }
            }

            if (request.Year < 1 || request.Year > 10)
            {
                return BadRequest(new { message = "Year must be between 1 and 10." });
            }

            existingStudent.Year = request.Year;
            existingStudent.ProgrammeId = request.ProgrammeId;
            existingStudent.AverageGrade = request.AverageGrade;

            if (request.ProgrammeId.HasValue)
            {
                existingStudent.Programme = await _context.Programmes.FindAsync(request.ProgrammeId.Value);
            }
            else
            {
                existingStudent.Programme = null;
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!StudentExists(id))
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


        // DELETE: api/Students/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStudent(Guid id)
        {
            var student = await _context.Students.FindAsync(id);
            if (student == null)
            {
                return NotFound();
            }

            var hasGrades = await _context.Grades.AnyAsync(g => g.StudentId == id);
            if (hasGrades)
            {
                return BadRequest(new { message = "Cannot delete student. They have grades assigned. Please remove grades first." });
            }

            _context.Students.Remove(student);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool StudentExists(Guid id)
        {
            return _context.Students.Any(e => e.Id == id);
        }
    }

    // Student request
    public class StudentRequest
    {
        [Required]
        public Guid UserId { get; set; }
        [Required]
        [Range(1, 10)]
        public int Year { get; set; }
        public decimal? AverageGrade { get; set; }
        public Guid? ProgrammeId { get; set; }
    }
}
