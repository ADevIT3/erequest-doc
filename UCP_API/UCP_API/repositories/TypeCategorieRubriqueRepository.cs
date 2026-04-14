using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class TypeCategorieRubriqueRepository
    {
        private readonly AppDbContext _context;
        public TypeCategorieRubriqueRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all TypeCategorieRubrique
        public List<TypeCategorieRubrique> GetTypeCategorieRubriques()
        {
            return _context.TypeCategorieRubrique.ToList();
        }

        // Get TypeCategorieRubrique by Id
        public TypeCategorieRubrique GetTypeCategorieRubriqueById(int id)
        {
            return _context.TypeCategorieRubrique.FirstOrDefault(t => t.IdTypeCategorieRubrique == id);
        }

        // Add a new TypeCategorieRubrique
        public void AddTypeCategorieRubrique(TypeCategorieRubrique TypeCategorieRubrique)
        {
            _context.TypeCategorieRubrique.Add(TypeCategorieRubrique);
            _context.SaveChanges();
        }

        // Update a TypeCategorieRubrique
        public void UpdateTypeCategorieRubrique(TypeCategorieRubrique TypeCategorieRubrique)
        {
            _context.TypeCategorieRubrique.Update(TypeCategorieRubrique);
            _context.SaveChanges();
        }

        // Delete a TypeCategorieRubrique
        public void DeleteTypeCategorieRubrique(int id)
        {
            var TypeCategorieRubrique = _context.TypeCategorieRubrique.Find(id);
            if (TypeCategorieRubrique != null)
            {
                _context.TypeCategorieRubrique.Remove(TypeCategorieRubrique);
                _context.SaveChanges();
            }
        }

    }
}
