using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class TypeRubriqueRepository
    {
        private readonly AppDbContext _context;
        public TypeRubriqueRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all TypeRubrique
        public List<TypeRubrique> GetTypeRubriques()
        {
            return _context.TypeRubrique.ToList();
        }

        // Get TypeRubrique by Id
        public TypeRubrique GetTypeRubriqueById(int id)
        {
            return _context.TypeRubrique.FirstOrDefault(t => t.IdTypeRubrique == id);
        }

        public TypeRubrique GetTypeRubriqueAutres()
        {
            return _context.TypeRubrique.FromSqlRaw("select * from typerubrique where nom = 'autres'").ToList()[0];
        }

        // Add a new TypeRubrique
        public void AddTypeRubrique(TypeRubrique TypeRubrique)
        {
            _context.TypeRubrique.Add(TypeRubrique);
            _context.SaveChanges();
        }

        // Update a TypeRubrique
        public void UpdateTypeRubrique(TypeRubrique TypeRubrique)
        {
            _context.TypeRubrique.Update(TypeRubrique);
            _context.SaveChanges();
        }

        // Delete a TypeRubrique
        public void DeleteTypeRubrique(int id)
        {
            var TypeRubrique = _context.TypeRubrique.Find(id);
            if (TypeRubrique != null)
            {
                _context.TypeRubrique.Remove(TypeRubrique);
                _context.SaveChanges();
            }
        }

    }
}
