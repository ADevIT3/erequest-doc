using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class UnitRepository
    {
        private readonly AppDbContext _context;
        public UnitRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all Unit
        public List<Unit> GetUnits()
        {
            return _context.Unit.ToList();
        }

        // Get Unit by Id
        public Unit GetUnitById(int id)
        {
            return _context.Unit.FirstOrDefault(t => t.IdUnit == id);
        }

        // Add a new Unit
        public void AddUnit(Unit Unit)
        {
            _context.Unit.Add(Unit);
            _context.SaveChanges();
        }

        // Update a Unit
        public void UpdateUnit(Unit Unit)
        {
            _context.Unit.Update(Unit);
            _context.SaveChanges();
        }

        // Delete a Unit
        public void DeleteUnit(int id)
        {
            var Unit = _context.Unit.Find(id);
            if (Unit != null)
            {
                _context.Unit.Remove(Unit);
                _context.SaveChanges();
            }
        }

    }
}
