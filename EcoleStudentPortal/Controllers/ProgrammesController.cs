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
        public async Task<IActionResult> PutProgramme(Guid id, Programme programme)
        {
            if (id != programme.Id)
            {
                return BadRequest();
            }

            _context.Entry(programme).State = EntityState.Modified;

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
        public async Task<ActionResult<Programme>> PostProgramme(Programme programme)
        {
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
}
