using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.dto;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class JustificatifAccuseRepository
    {
        private readonly AppDbContext _context;
        public JustificatifAccuseRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all JustificatifAccuse
        public List<JustificatifAccuse> GetJustificatifAccuses()
        {
            return _context.JustificatifAccuse.ToList();
        }

        // Get JustificatifAccuse by Id
        public JustificatifAccuse GetJustificatifAccuseById(int id)
        {
            return _context.JustificatifAccuse.FirstOrDefault(r => r.idJustifAccuse == id);
        }

        public JustificatifAccuse GetJustificatifAccuseByIdRequete(int idRequete)
        {
            var result = _context.JustificatifAccuse.FromSqlRaw("select * from justificatifaccuse where idJustif = @p0",idRequete).ToList();
            if (result.Count == 0) {
                return null;
            }
            else
            {
                return result[0];
            }
        }

        // Add a new JustificatifAccuse
        public void AddJustificatifAccuse(JustificatifAccuse JustificatifAccuse)
        {
            _context.JustificatifAccuse.Add(JustificatifAccuse);
            _context.SaveChanges();
        }

        // Update a JustificatifAccuse
        public void UpdateJustificatifAccuse(JustificatifAccuse JustificatifAccuse)
        {
            _context.JustificatifAccuse.Update(JustificatifAccuse);
            _context.SaveChanges();
        }

        // Delete a JustificatifAccuse
        public void DeleteJustificatifAccuse(int id)
        {
            var JustificatifAccuse = _context.JustificatifAccuse.Find(id);
            if (JustificatifAccuse != null)
            {
                _context.JustificatifAccuse.Remove(JustificatifAccuse);
                _context.SaveChanges();
            }
        }

     
    }
}
