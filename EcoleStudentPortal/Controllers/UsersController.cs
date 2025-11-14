using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EcoleStudentPortal.Data;
using EcoleStudentPortal.Models;

namespace EcoleStudentPortal.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly EcoleStudentPortalContext _context;

        public UsersController(EcoleStudentPortalContext context)
        {
            _context = context;
        }

        // GET: api/Users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            return await _context.Users.ToListAsync();
        }

        // GET: api/Users/5
        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(Guid id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound();
            }

            return user;
        }

        // PUT: api/Users/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUser(Guid id, User user)
        {
            if (id != user.Id)
            {
                return BadRequest();
            }

            _context.Entry(user).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UserExists(id))
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

        // POST: api/Users
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<User>> PostUser(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetUser", new { id = user.Id }, user);
        }

        // DELETE: api/Users/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool UserExists(Guid id)
        {
            return _context.Users.Any(e => e.Id == id);
        }

        // POST: api/Users/login
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null || !VerifyPassword(request.Password, user.Password))
                return Unauthorized(new { message = "Invalid email or password" });

            string userType = "";
            Guid? profileId = null;

            var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == user.Id);
            if (student != null)
            {
                userType = "Student";
                profileId = student.Id;
            }
            else
            {
                var professor = await _context.Professors.FirstOrDefaultAsync(p => p.UserId == user.Id);
                if (professor != null)
                {
                    userType = "Professor";
                    profileId = professor.Id;
                }
                else
                {
                    var admin = await _context.DepartmentAdmins.FirstOrDefaultAsync(a => a.UserId == user.Id);
                    if (admin != null)
                    {
                        userType = "DepartmentAdmin";
                        profileId = admin.Id;
                    }
                }
            }

            var token = GenerateJwtToken(user, userType, profileId);

            return new AuthResponse
            {
                Token = token,
                UserType = userType,
                UserId = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                ProfileId = profileId,
                ExpiresAt = DateTime.UtcNow.AddHours(24)
            };
        }

        // POST: api/Users/register
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
        {
            if (request.UserType != "Student" && request.UserType != "Professor")
                return BadRequest(new { message = "Only Students and Professors can register through this endpoint." });

            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                return BadRequest(new { message = "User with this email already exists" });

            var registrationNumber = GenerateRegistrationNumber(request.UserType);

            var user = new User
            {
                Id = Guid.NewGuid(),
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                Password = request.Password,
                RegistrationNumber = registrationNumber,
                Address = request.Address,
                PostalCode = request.PostalCode
            };

            _context.Users.Add(user);

            if (request.UserType == "Student")
            {
                var student = new Student
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    Year = request.Year ?? 1,
                    ProgrammeId = request.ProgrammeId
                };
                _context.Students.Add(student);
            }
            else if (request.UserType == "Professor")
            {
                var professor = new Professor
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    Specialization = request.Specialization,
                    DepartmentId = request.DepartmentId
                };
                _context.Professors.Add(professor);
            }

            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user, request.UserType, null);
            return new AuthResponse
            {
                Token = token,
                UserType = request.UserType,
                UserId = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                ExpiresAt = DateTime.UtcNow.AddHours(24)
            };
        }

        // Generate registration number based on user type and timestamp
        private string GenerateRegistrationNumber(string userType)
        {
            var now = DateTime.UtcNow;
            var year = now.Year;
            var month = now.Month.ToString("D2");
            var day = now.Day.ToString("D2");
            var hour = now.Hour.ToString("D2");
            var minute = now.Minute.ToString("D2");
            var second = now.Second.ToString("D2");

            string prefix = userType switch
            {
                "Student" => "STU",
                "Professor" => "PRO",
                "DepartmentAdmin" => "ADM",
                _ => "USR"
            };

            var today = now.Date;
            var sequenceNumber = _context.Users
                .Where(u => u.RegistrationNumber.StartsWith(prefix) && 
                           u.RegistrationNumber.Contains(today.ToString("yyyyMMdd")))
                .Count() + 1;

            return $"{prefix}-{year}{month}{day}-{hour}{minute}{second}-{sequenceNumber:D3}";
        }

        private string GenerateJwtToken(User user, string userType, Guid? profileId)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
                new Claim("UserType", userType),
                new Claim("RegistrationNumber", user.RegistrationNumber)
            };

            if (profileId.HasValue)
                claims = claims.Append(new Claim("ProfileId", profileId.Value.ToString())).ToArray();

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("3sYnaySSJblnexjIDLp1w76_7Fb092XGhq2HhC2C1-LdIxYXCjFtl6dnA_8QLCZe4w_GI0i3oFzTi-w2iMtrjg"));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: "EcoleStudentPortal",
                audience: "EcoleStudentPortalUsers",
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private bool VerifyPassword(string password, string dbPassword)
        {
            return password == dbPassword;
        }
    }

    public class RegisterRequest
    {
        public string FirstName { get; set; } = default!;
        public string LastName { get; set; } = default!;
        public string Email { get; set; } = default!;
        public string Password { get; set; } = default!;
        public string? Address { get; set; }
        public string? PostalCode { get; set; }
        public string UserType { get; set; } = default!; // "Student", "Professor", "DepartmentAdmin"
        
        // Student specific
        public int? Year { get; set; }
        public Guid? ProgrammeId { get; set; }
        
        // Professor specific
        public string? Specialization { get; set; }
        public Guid? DepartmentId { get; set; }
    }
}
