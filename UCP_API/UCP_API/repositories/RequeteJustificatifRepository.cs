using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class RequeteJustificatifRepository
    {
        private readonly AppDbContext _context;
        public RequeteJustificatifRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all RequeteJustificatif
        public List<RequeteJustificatif> GetRequeteJustificatifs()
        {
            return _context.RequeteJustificatif.AsNoTracking().ToList();
        }

        // Get RequeteJustificatif by Id
        public RequeteJustificatif GetRequeteJustificatifById(int id)
        {
            return _context.RequeteJustificatif.FirstOrDefault(t => t.IdRequeteJustificatif == id);
        }

        public List<RequeteJustificatif> GetRequeteJustificatifByIdRequete(int idRequete)
        {
            return _context.RequeteJustificatif.FromSqlRaw("select * from requetejustificatif where idRequete = @p0", idRequete).ToList();
        }
        public List<RequeteJustificatif> GetRequeteJustificatifByIdJustif(int idJustificatif)
        {
            return _context.RequeteJustificatif.FromSqlRaw("select requetejustificatif.* from justificatif \r\njoin requetejustificatif on justificatif.idrequete = requetejustificatif.idrequete\r\nwhere idjustif = @p0", idJustificatif).ToList();
        }

        // Add a new RequeteJustificatif
        public void AddRequeteJustificatif(RequeteJustificatif RequeteJustificatif)
        {
            _context.RequeteJustificatif.Add(RequeteJustificatif);
            _context.SaveChanges();
        }

        // Update a RequeteJustificatif
        public void UpdateRequeteJustificatif(RequeteJustificatif RequeteJustificatif)
        {
            _context.RequeteJustificatif.Update(RequeteJustificatif);
            _context.SaveChanges();
        }

        // Delete a RequeteJustificatif
        public void DeleteRequeteJustificatif(int id)
        {
            var RequeteJustificatif = _context.RequeteJustificatif.Find(id);
            if (RequeteJustificatif != null)
            {
                _context.RequeteJustificatif.Remove(RequeteJustificatif);
                _context.SaveChanges();
            }
        }
        
    }
}
