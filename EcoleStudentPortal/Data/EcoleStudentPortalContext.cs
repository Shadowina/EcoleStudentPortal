using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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

        public DbSet<EcoleStudentPortal.Models.User> User { get; set; } = default!;

      
    }
}
