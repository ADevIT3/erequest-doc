using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class RoleRepository
    {
        private readonly AppDbContext _context;
        public RoleRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all Role
        public List<Role> GetRoles()
        {
            return _context.Role.ToList();
        }

        // Get Role by Id
        public Role GetRoleById(int id)
        {
            return _context.Role.FirstOrDefault(t => t.idRole == id);
        }

        public Role FindByIdUtilisateur(int idUtilisateur)
        {
            return _context.Role.FromSqlRaw("select role.* from utilisateur join role on utilisateur.idrole = role.idrole and utilisateur.idutilisateur = @p0",idUtilisateur).FirstOrDefault();
        }

        // Add a new Role
        public void AddRole(Role Role)
        {
            _context.Role.Add(Role);
            _context.SaveChanges();
        }

        // Update a Role
        public void UpdateRole(Role Role)
        {
            _context.Role.Update(Role);
            _context.SaveChanges();
        }

        // Delete a Role
        public void DeleteRole(int id)
        {
            var Role = _context.Role.Find(id);
            if (Role != null)
            {
                _context.Role.Remove(Role);
                _context.SaveChanges();
            }
        }

    }
}
