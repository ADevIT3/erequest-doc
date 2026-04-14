using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class UtilisateurSiteRepository
    {
        private readonly AppDbContext _context;
        public UtilisateurSiteRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all UtilisateurProjet
        public List<UtilisateurSite> GetUtilisateurSites()
        {
            return _context.UtilisateurSite.ToList();
        }

        // Get UtilisateurProjet by Id
        public UtilisateurSite GetUtilisateurSiteById(int id)
        {
            return _context.UtilisateurSite.FirstOrDefault(t => t.IdUtilisateurSite == id);
        }

        public List<UtilisateurSite> GetUtilisateurSiteByIdUtilisateur(int id)
        {
            return _context.UtilisateurSite.FromSqlRaw("select * from utilisateursite where idutilisateur = @p0", id).ToList();
        }


        // Add a new UtilisateurProjet
        public void AddUtilisateurSite(UtilisateurSite UtilisateurSite)
        {
            _context.UtilisateurSite.Add(UtilisateurSite);
            _context.SaveChanges();
        }

        // Update a UtilisateurProjet
        public void UpdateUtilisateurSite(UtilisateurSite UtilisateurSite)
        {
            _context.UtilisateurSite.Update(UtilisateurSite);
            _context.SaveChanges();
        }

        // Delete a UtilisateurProjet
        public void DeleteUtilisateurSite(int id)
        {
            var UtilisateurSite = _context.UtilisateurSite.Find(id);
            if (UtilisateurSite != null)
            {
                _context.UtilisateurSite.Remove(UtilisateurSite);
                _context.SaveChanges();
            }
        }
        
    }
}
