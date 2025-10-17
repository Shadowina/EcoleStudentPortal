using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using EcoleStudentPortal.Data;

namespace EcoleStudentPortal
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            builder.Services.AddDbContext<EcoleStudentPortalContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("EcoleStudentPortalContext") ?? throw new InvalidOperationException("Connection string 'EcoleStudentPortalContext' not found.")));

            // Add services to the container.

            builder.Services.AddControllers();
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
