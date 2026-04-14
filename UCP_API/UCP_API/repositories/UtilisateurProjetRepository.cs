using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class UtilisateurProjetRepository
    {
        private readonly AppDbContext _context;
        public UtilisateurProjetRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all UtilisateurProjet
        public List<UtilisateurProjet> GetUtilisateurProjets()
        {
            return _context.UtilisateurProjet.ToList();
        }

        // Get UtilisateurProjet by Id
        public UtilisateurProjet GetUtilisateurProjetById(int id)
        {
            return _context.UtilisateurProjet.FirstOrDefault(t => t.IdUtilisateurProjet == id);
        }

        public List<UtilisateurProjet> GetUtilisateurProjetByIdUtilisateur(int id)
        {
            return _context.UtilisateurProjet.FromSqlRaw("select * from utilisateurprojet where idutilisateur = @p0",id).ToList();
        }

        // Add a new UtilisateurProjet
        public void AddUtilisateurProjet(UtilisateurProjet UtilisateurProjet)
        {
            _context.UtilisateurProjet.Add(UtilisateurProjet);
            _context.SaveChanges();
        }

        // Update a UtilisateurProjet
        public void UpdateUtilisateurProjet(UtilisateurProjet UtilisateurProjet)
        {
            _context.UtilisateurProjet.Update(UtilisateurProjet);
            _context.SaveChanges();
        }

        // Delete a UtilisateurProjet
        public void DeleteUtilisateurProjet(int id)
        {
            var UtilisateurProjet = _context.UtilisateurProjet.Find(id);
            if (UtilisateurProjet != null)
            {
                _context.UtilisateurProjet.Remove(UtilisateurProjet);
                _context.SaveChanges();
            }
        }
        
    }
}
