using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class JustifPjRepository
    {
        private readonly AppDbContext _context;
        public JustifPjRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all JustifPj
        public List<JustifPj> GetJustifPjs()
        {
            return _context.JustifPj.ToList();
        }

        // Get JustifPj by Id
        public JustifPj GetJustifPjById(int id)
        {
            return _context.JustifPj.FirstOrDefault(t => t.IdJustifPj == id);
        }

        // Add a new JustifPj
        public void AddJustifPj(JustifPj JustifPj)
        {
            _context.JustifPj.Add(JustifPj);
            _context.SaveChanges();
        }

        // Update a JustifPj
        public void UpdateJustifPj(JustifPj JustifPj)
        {
            _context.JustifPj.Update(JustifPj);
            _context.SaveChanges();
        }

        // Delete a JustifPj
        public void DeleteJustifPj(int id)
        {
            var JustifPj = _context.JustifPj.Find(id);
            if (JustifPj != null)
            {
                _context.JustifPj.Remove(JustifPj);
                _context.SaveChanges();
            }
        }

    }
}
