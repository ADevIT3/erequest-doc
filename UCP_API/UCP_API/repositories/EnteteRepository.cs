using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class EnteteRepository
    {
        private readonly AppDbContext _context;
        public EnteteRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all Entete
        public List<Entete> GetEntetes()
        {
            return _context.Entete.ToList();
        }
        // Get Entete by Id
        public Entete GetEnteteByUtilisateur(int idUtilisateur)
        {
            Entete result = _context.Entete.FirstOrDefault(e => e.idUtilisateurAGMO == idUtilisateur);
            if(result != null)
            {
                return result;
            }
            else
            {
                return null;
            }            
        }
        // Add a new Entete
        public void AddEntete(Entete Entete)
        {
            _context.Entete.Add(Entete);
            _context.SaveChanges();
        }

        // Update a Entete
        public void UpdateEntete(Entete Entete)
        {
            _context.Entete.Update(Entete);
            _context.SaveChanges();
        }

        // Delete a Entete
        public void DeleteEntete(int id)
        {
            var Entete = _context.Entete.Find(id);
            if (Entete != null)
            {
                _context.Entete.Remove(Entete);
                _context.SaveChanges();
            }
        }

    }
}
