using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcoleStudentPortal.Data;
using EcoleStudentPortal.Models;

namespace EcoleStudentPortal.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DepartmentAdminsController : ControllerBase
    {
        private readonly EcoleStudentPortalContext _context;

        public DepartmentAdminsController(EcoleStudentPortalContext context)
        {
            _context = context;
        }

        // GET: api/DepartmentAdmins
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DepartmentAdmin>>> GetDepartmentAdmins()
        {
            return await _context.DepartmentAdmins.ToListAsync();
        }

        // GET: api/DepartmentAdmins/5
        [HttpGet("{id}")]
        public async Task<ActionResult<DepartmentAdmin>> GetDepartmentAdmin(Guid id)
        {
            var departmentAdmin = await _context.DepartmentAdmins.FindAsync(id);

            if (departmentAdmin == null)
            {
                return NotFound();
            }

            return departmentAdmin;
        }

        // PUT: api/DepartmentAdmins/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutDepartmentAdmin(Guid id, DepartmentAdmin departmentAdmin)
        {
            if (id != departmentAdmin.Id)
            {
                return BadRequest();
            }

            _context.Entry(departmentAdmin).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!DepartmentAdminExists(id))
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

        // POST: api/DepartmentAdmins
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<DepartmentAdmin>> PostDepartmentAdmin(DepartmentAdmin departmentAdmin)
        {
            _context.DepartmentAdmins.Add(departmentAdmin);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetDepartmentAdmin", new { id = departmentAdmin.Id }, departmentAdmin);
        }

        // DELETE: api/DepartmentAdmins/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDepartmentAdmin(Guid id)
        {
            var departmentAdmin = await _context.DepartmentAdmins.FindAsync(id);
            if (departmentAdmin == null)
            {
                return NotFound();
            }

            _context.DepartmentAdmins.Remove(departmentAdmin);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool DepartmentAdminExists(Guid id)
        {
            return _context.DepartmentAdmins.Any(e => e.Id == id);
        }
    }
}
