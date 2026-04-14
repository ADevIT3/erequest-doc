using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class CircuitEtapeCheckListRepository
    {
        /*private readonly AppDbContext _context;
        public CircuitEtapeRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all CircuitEtape
        public List<CircuitEtape> GetCircuitEtapes()
        {
            return _context.CircuitEtape.ToList();
        }

        // Get CircuitEtape by Id
        public CircuitEtape GetCircuitEtapeById(int id)
        {
            return _context.CircuitEtape.FirstOrDefault(t => t.IdCircuitEtape == id);
        }

        // Add a new CircuitEtape
        public void AddCircuitEtape(CircuitEtape CircuitEtape)
        {
            _context.CircuitEtape.Add(CircuitEtape);
            _context.SaveChanges();
        }

        // Update a CircuitEtape
        public void UpdateCircuitEtape(CircuitEtape CircuitEtape)
        {
            _context.CircuitEtape.Update(CircuitEtape);
            _context.SaveChanges();
        }

        // Delete a CircuitEtape
        public void DeleteCircuitEtape(int id)
        {
            var CircuitEtape = _context.CircuitEtape.Find(id);
            if (CircuitEtape != null)
            {
                _context.CircuitEtape.Remove(CircuitEtape);
                _context.SaveChanges();
            }
        }
        */
    }
}
