using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class HistoriqueValidationRequeteRepository
    {
        private readonly AppDbContext _context;
        public HistoriqueValidationRequeteRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all HistoriqueValidationRequete
        public List<HistoriqueValidationRequete> GetHistoriqueValidationRequetes()
        {
            return _context.HistoriqueValidationRequete.ToList();
        }

        // Get HistoriqueValidationRequete by Id
        public HistoriqueValidationRequete GetHistoriqueValidationRequeteById(int id)
        {
            return _context.HistoriqueValidationRequete.FirstOrDefault(t => t.idHistoriqueValidationRequete == id);
        }

        // Add a new HistoriqueValidationRequete
        public void AddHistoriqueValidationRequete(HistoriqueValidationRequete HistoriqueValidationRequete)
        {
            _context.HistoriqueValidationRequete.Add(HistoriqueValidationRequete);
            _context.SaveChanges();
        }

        // Update a HistoriqueValidationRequete
        public void UpdateHistoriqueValidationRequete(HistoriqueValidationRequete HistoriqueValidationRequete)
        {
            _context.HistoriqueValidationRequete.Update(HistoriqueValidationRequete);
            _context.SaveChanges();
        }

        // Delete a HistoriqueValidationRequete
        public void DeleteHistoriqueValidationRequete(int id)
        {
            var HistoriqueValidationRequete = _context.HistoriqueValidationRequete.Find(id);
            if (HistoriqueValidationRequete != null)
            {
                _context.HistoriqueValidationRequete.Remove(HistoriqueValidationRequete);
                _context.SaveChanges();
            }
        }
        
    }
}
