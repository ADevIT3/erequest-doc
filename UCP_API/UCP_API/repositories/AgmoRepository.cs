using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class AgmoRepository
    {
        private readonly AppDbContext _context;
        public AgmoRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all Agmo
        public async Task<List<Agmo>> GetAgmos()
        {
            return await _context.Agmo.Where(a => a.deletiondate == null).ToListAsync();
        }

        // Get Agmo by Id
        public Agmo GetAgmoById(int id)
        {
            return _context.Agmo.FirstOrDefault(a => a.idAgmo == id && a.deletiondate == null);
        }

        // Add a new Agmo
        public void AddAgmo(Agmo Agmo, int currentUserId)
        {
            Agmo.creationdate = DateTime.Now;
            Agmo.createdby = currentUserId;

            _context.Agmo.Add(Agmo);
            _context.SaveChanges();
        }

        // Update Agmo
        public bool UpdateAgmo(Agmo Agmo, int id)
        {
            var isAgmo = _context.Agmo.FirstOrDefault(a => a.idAgmo == id && a.deletiondate == null);

            if (isAgmo == null)
                return false;

            isAgmo.nom = Agmo.nom;

            _context.SaveChanges();
            return true;
        }

        // Delete Agmo
        public bool DeleteAgmo(int id, int currentUserId)
        {
            var agmo = _context.Agmo.FirstOrDefault(a => a.idAgmo == id && a.deletiondate == null);
            if (agmo == null)
                return false;

            agmo.deletiondate = DateTime.Now;
            agmo.deletedby = currentUserId;

            _context.SaveChanges();
            return true;
        }

        // Get Agmo by NAME
        public async Task<Agmo?> GetAgmoByName(string nom)
        {
            return await _context.Agmo.Where(x => x.nom == nom && x.deletiondate == null).FirstOrDefaultAsync();
        }

        // Get Agmo by NAME and ID
        public async Task<Agmo?> GetAgmoByNameId(string nom, int id)
        {
            return await _context.Agmo.Where(x => x.idAgmo != id && x.nom == nom && x.deletiondate == null).FirstOrDefaultAsync();
        }

        // Get storage Agmo by ID Agmo en relation utilisateur même Agmo si existe
        public async Task<string> GetStorageAgmoByIdAgmo(int idAgmo)
        {
            var utilisateur = await _context.Utilisateur.FirstOrDefaultAsync(u => u.idAgmo == idAgmo && u.deletionDate == null);

            return utilisateur?.storage ?? "";
        }
    }
}