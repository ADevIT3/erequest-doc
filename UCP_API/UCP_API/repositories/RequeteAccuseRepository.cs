using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.dto;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class RequeteAccuseRepository
    {
        private readonly AppDbContext _context;
        public RequeteAccuseRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all RequeteAccuse
        public List<RequeteAccuse> GetRequeteAccuses()
        {
            return _context.RequeteAccuse.ToList();
        }

        // Get RequeteAccuse by Id
        public RequeteAccuse GetRequeteAccuseById(int id)
        {
            return _context.RequeteAccuse.FirstOrDefault(r => r.idRequeteAccuse == id);
        }

        public List<RequeteAccuse> GetRequeteAccuseByIdRequete(int idRequete)
        {
            return _context.RequeteAccuse.FromSqlRaw("select * from requeteaccuse where idrequete = @p0",idRequete).ToList();
        }

        // Add a new RequeteAccuse
        public void AddRequeteAccuse(RequeteAccuse RequeteAccuse)
        {
            _context.RequeteAccuse.Add(RequeteAccuse);
            _context.SaveChanges();
        }

        // Update a RequeteAccuse
        public void UpdateRequeteAccuse(RequeteAccuse RequeteAccuse)
        {
            _context.RequeteAccuse.Update(RequeteAccuse);
            _context.SaveChanges();
        }

        // Delete a RequeteAccuse
        public void DeleteRequeteAccuse(int id)
        {
            var RequeteAccuse = _context.RequeteAccuse.Find(id);
            if (RequeteAccuse != null)
            {
                _context.RequeteAccuse.Remove(RequeteAccuse);
                _context.SaveChanges();
            }
        }

     
    }
}
