using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using EcoleStudentPortal.Data;
using EcoleStudentPortal.Models;

namespace EcoleStudentPortal
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            
            // Load local configuration file if it exists (for Mac development)
            // This will override appsettings.json values since it's loaded after
            builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);
            
            // Configure database based on connection string
            var connectionString = builder.Configuration.GetConnectionString("EcoleStudentPortalContext") 
                ?? throw new InvalidOperationException("Connection string 'EcoleStudentPortalContext' not found.");
            
            builder.Services.AddDbContext<EcoleStudentPortalContext>(options =>
            {
                // Use SQLite if connection string starts with "Data Source=" (SQLite format)
                // Otherwise use SQL Server (default for Windows)
                if (connectionString.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase) || 
                    connectionString.StartsWith("DataSource=", StringComparison.OrdinalIgnoreCase))
                {
                    options.UseSqlite(connectionString);
                }
                else
                {
                    options.UseSqlServer(connectionString);
                }
            });

            // Add services to the container.

            builder.Services.AddControllers();
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // Add JWT Authentication
            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = builder.Configuration["Jwt:Issuer"],
                        ValidAudience = builder.Configuration["Jwt:Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
                    };
                });

            builder.Services.AddAuthorization();

            // Add CORS
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend", policy =>
                {
                    policy.AllowAnyOrigin()
                    .AllowAnyHeader()
                    .AllowAnyMethod();
                });
            });

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseCors("AllowFrontend");
            app.UseAuthentication();
            app.UseAuthorization();


            app.MapControllers();

            // addition for database creation
#pragma warning disable CS8602 // Dereferencing a possible null reference.
            using (var serviceScope = app.Services.GetService<IServiceScopeFactory>().CreateScope())
#pragma warning restore CS8602 // Dereferencing a possible null reference.
            {
                var context = serviceScope.ServiceProvider.GetRequiredService<EcoleStudentPortalContext>();
                //context.Database.EnsureDeleted();
                context.Database.EnsureCreated();
                
                // Create master admin user
                SeedMasterAdmin(context);
            }

            app.Run();
        }

        private static void SeedMasterAdmin(EcoleStudentPortalContext context)
        {
            const string adminEmail = "admin@ecole.com";
            const string adminPassword = "password";

            // Check if admin already exists
            var existingAdmin = context.Users.FirstOrDefault(u => u.Email == adminEmail);
            if (existingAdmin != null)
            {
                return; 
            }

            // Create master admin user
            var adminUser = new User
            {
                Id = Guid.NewGuid(),
                FirstName = "Master",
                LastName = "Admin",
                Email = adminEmail,
                Password = adminPassword,
                RegistrationNumber = $"ADM-{DateTime.UtcNow:yyyyMMdd}-000000-001",
                Address = null,
                PostalCode = null
            };

            context.Users.Add(adminUser);

            // Create DepartmentAdmin profile
            var departmentAdmin = new DepartmentAdmin
            {
                Id = Guid.NewGuid(),
                UserId = adminUser.Id,
                RoleTitle = "Master Administrator"
            };

            context.DepartmentAdmins.Add(departmentAdmin);

            context.SaveChanges();
        }
    }
}
