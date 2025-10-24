namespace EcoleStudentPortal.Models
{
    public class AuthResponse
    {
        public string Token { get; set; } = default!;
        public string UserType { get; set; } = default!; // "Student", "Professor", "DepartmentAdmin"
        public Guid UserId { get; set; }
        public string Email { get; set; } = default!;
        public string FirstName { get; set; } = default!;
        public string LastName { get; set; } = default!;
        public Guid? ProfileId { get; set; } // Student.Id, Professor.Id, or DepartmentAdmin.Id
        public DateTime ExpiresAt { get; set; }
    }
}
