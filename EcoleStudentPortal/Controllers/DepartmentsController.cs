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
    public class DepartmentsController : ControllerBase
    {
        private readonly EcoleStudentPortalContext _context;

        public DepartmentsController(EcoleStudentPortalContext context)
        {
            _context = context;
        }

        // GET: api/Departments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Department>>> GetDepartments()
        {
            return await _context.Departments.ToListAsync();
        }

        // GET: api/Departments/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Department>> GetDepartment(Guid id)
        {
            var department = await _context.Departments.FindAsync(id);

            if (department == null)
            {
                return NotFound();
            }

            return department;
        }

        // PUT: api/Departments/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutDepartment(Guid id, DepartmentRequest request)
        {
            var departmentAdmin = await _context.DepartmentAdmins.FindAsync(request.DepartmentAdminId);
            if (departmentAdmin == null)
            {
                return BadRequest(new { message = "DepartmentAdmin not found." });
            }

            var existingDepartment = await _context.Departments.FindAsync(id);
            if (existingDepartment == null)
            {
                return NotFound();
            }

            existingDepartment.DepartmentName = request.DepartmentName;
            existingDepartment.Description = request.Description;
            existingDepartment.DepartmentAdminId = request.DepartmentAdminId;
            existingDepartment.DepartmentAdmin = departmentAdmin;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!DepartmentExists(id))
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

        // POST: api/Departments
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Department>> PostDepartment(DepartmentRequest request)
        {
            var departmentAdmin = await _context.DepartmentAdmins.FindAsync(request.DepartmentAdminId);
            if (departmentAdmin == null)
            {
                return BadRequest(new { message = "DepartmentAdmin not found." });
            }

            var department = new Department
            {
                Id = Guid.NewGuid(),
                DepartmentName = request.DepartmentName,
                Description = request.Description,
                DepartmentAdminId = request.DepartmentAdminId,
                DepartmentAdmin = departmentAdmin
            };

            _context.Departments.Add(department);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetDepartment", new { id = department.Id }, department);
        }

        // DELETE: api/Departments/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDepartment(Guid id)
        {
            var department = await _context.Departments.FindAsync(id);
            if (department == null)
            {
                return NotFound();
            }

            _context.Departments.Remove(department);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool DepartmentExists(Guid id)
        {
            return _context.Departments.Any(e => e.Id == id);
        }
    }

    // Department request
    public class DepartmentRequest
    {
        [Required]
        public string DepartmentName { get; set; } = default!;
        public string? Description { get; set; }
        [Required]
        public Guid DepartmentAdminId { get; set; }
    }
}
