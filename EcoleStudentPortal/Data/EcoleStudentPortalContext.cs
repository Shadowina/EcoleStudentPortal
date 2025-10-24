using Microsoft.EntityFrameworkCore;
using EcoleStudentPortal.Models;

namespace EcoleStudentPortal.Data
{
    public class EcoleStudentPortalContext : DbContext
    {
        public EcoleStudentPortalContext (DbContextOptions<EcoleStudentPortalContext> options)
            : base(options)
        {
        }

        public DbSet<EcoleStudentPortal.Models.User> Users { get; set; } = default!;
        public DbSet<EcoleStudentPortal.Models.Student> Students { get; set; } = default!;
        public DbSet<EcoleStudentPortal.Models.Professor> Professors { get; set; } = default!;
        public DbSet<EcoleStudentPortal.Models.DepartmentAdmin> DepartmentAdmins { get; set; } = default!;
        public DbSet<EcoleStudentPortal.Models.Grade> Grades { get; set; } = default!;
        public DbSet<EcoleStudentPortal.Models.Course> Courses { get; set; } = default!;
        public DbSet<EcoleStudentPortal.Models.Programme> Programmes { get; set; } = default!;
        public DbSet<EcoleStudentPortal.Models.Department> Departments { get; set; } = default!;
        public DbSet<EcoleStudentPortal.Models.CourseSchedule> CourseSchedules { get; set; } = default!;
        public DbSet<EcoleStudentPortal.Models.ProfessorCourse> ProfessorCourses { get; set; } = default!;
        public DbSet<EcoleStudentPortal.Models.ProgrammeCourse> ProgrammeCourses { get; set; } = default!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure User relationships
            modelBuilder.Entity<Student>()
                .HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Professor>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DepartmentAdmin>()
                .HasOne(da => da.User)
                .WithMany()
                .HasForeignKey(da => da.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Grade entity with composite primary key
            modelBuilder.Entity<Grade>()
                .HasKey(g => new { g.StudentId, g.CourseId });

            // Configure ProfessorCourse entity with composite primary key
            modelBuilder.Entity<ProfessorCourse>()
                .HasKey(pc => new { pc.ProfessorId, pc.CourseId });

            // Configure ProgrammeCourse entity with composite primary key
            modelBuilder.Entity<ProgrammeCourse>()
                .HasKey(pc => new { pc.ProgrammeId, pc.CourseId });
        }
    }
}
