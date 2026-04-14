using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class CircuitRequeteRepository
    {
        private readonly AppDbContext _context;
        public CircuitRequeteRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all CircuitEtape
        public List<CircuitRequete> GetCircuitRequetes()
        {
            return _context.CircuitRequete.ToList();
        }

        public CircuitRequete? GetCircuitRequetesByIdRequete(int idRequete)
        {
            return _context.CircuitRequete.FromSqlRaw("select * from circuitrequete where idrequete = @p0",idRequete).FirstOrDefault();
        }

        // Get CircuitEtape by Id
        public CircuitRequete GetCircuitRequeteById(int id)
        {
            return _context.CircuitRequete.FirstOrDefault(t => t.idCircuitRequete == id);
        }

        // Add a new CircuitEtape
        public void AddCircuitRequete(CircuitRequete CircuitRequete)
        {
            _context.CircuitRequete.Add(CircuitRequete);
            _context.SaveChanges();
        }

        // Update a CircuitEtape
        public void UpdateCircuitRequete(CircuitRequete CircuitRequete)
        {
            _context.CircuitRequete.Update(CircuitRequete);
            _context.SaveChanges();
        }

        // Delete a CircuitEtape
        public void DeleteCircuitRequete(int id)
        {
            var CircuitRequete = _context.CircuitRequete.Find(id);
            if (CircuitRequete != null)
            {
                _context.CircuitRequete.Remove(CircuitRequete);
                _context.SaveChanges();
            }
        }
        
    }
}
