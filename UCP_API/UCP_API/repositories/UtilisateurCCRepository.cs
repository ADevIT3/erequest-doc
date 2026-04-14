using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class UtilisateurCCRepository
    {
        private readonly AppDbContext _context;
        public UtilisateurCCRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all UtilisateurCC
        public List<UtilisateurCC> GetUtilisateurCCs()
        {
            return _context.UtilisateurCC.ToList();
        }
        // Get UtilisateurCC by Id
        public UtilisateurCC GetUtilisateurCCByUtilisateur(int idUtilisateur)
        {
            UtilisateurCC result = _context.UtilisateurCC.FirstOrDefault(e => e.idUtilisateurCC == idUtilisateur);
            if(result != null)
            {
                return result;
            }
            else
            {
                return null;
            }            
        }

        public List<UtilisateurCC> GetUtilisateurCCsByUtilisateur(int idUtilisateur)
        {
            List<UtilisateurCC> result = _context.UtilisateurCC.FromSqlRaw("select * from utilisateurcc where idutilisateur = @p0",idUtilisateur).ToList();
            return result;
        }
        // Add a new UtilisateurCC
        public void AddUtilisateurCC(UtilisateurCC UtilisateurCC)
        {
            _context.UtilisateurCC.Add(UtilisateurCC);
            _context.SaveChanges();
        }

        // Update a UtilisateurCC
        public void UpdateUtilisateurCC(UtilisateurCC UtilisateurCC)
        {
            _context.UtilisateurCC.Update(UtilisateurCC);
            _context.SaveChanges();
        }

        // Delete a UtilisateurCC
        public void DeleteUtilisateurCC(int id)
        {
            var UtilisateurCC = _context.UtilisateurCC.Find(id);
            if (UtilisateurCC != null)
            {
                _context.UtilisateurCC.Remove(UtilisateurCC);
                _context.SaveChanges();
            }
        }

    }
}
