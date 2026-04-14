using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class TypeRequeteRepository
    {
        private readonly AppDbContext _context;
        public TypeRequeteRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all TypeRequete
        public List<TypeRequete> GetTypeRequetes()
        {
            return _context.TypeRequete.ToList();
        }

        // Get TypeRequete by Id
        public TypeRequete GetTypeRequeteById(int id)
        {
            return _context.TypeRequete.FirstOrDefault(t => t.IdTypeRequete == id);
        }

        public TypeRequete GetFirstTypeRequete()
        {
            return _context.TypeRequete.FirstOrDefault();
        }


        // Add a new TypeRequete
        public void AddTypeRequete(TypeRequete typeRequete)
        {
            _context.TypeRequete.Add(typeRequete);
            _context.SaveChanges();
        }

        // Update a TypeRequete
        public void UpdateTypeRequete(TypeRequete typeRequete)
        {
            _context.TypeRequete.Update(typeRequete);
            _context.SaveChanges();
        }

        // Delete a TypeRequete
        public void DeleteTypeRequete(int id)
        {
            var typeRequete = _context.TypeRequete.Find(id);
            if (typeRequete != null)
            {
                _context.TypeRequete.Remove(typeRequete);
                _context.SaveChanges();
            }
        }
    }
}