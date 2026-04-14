using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class RubriqueCategorieRubriqueRepository
    {
        private readonly AppDbContext _context;
        public RubriqueCategorieRubriqueRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all RubriqueCategorieRubrique
        public List<RubriqueCategorieRubrique> GetRubriqueCategorieRubriques()
        {
            return _context.RubriqueCategorieRubrique
                .FromSqlRaw(@"
                    SELECT rcr.*, r.nom as rubriqueNom, cr.nom as categorieNom 
                    FROM rubriqueCategorieRubrique rcr
                    JOIN rubrique r ON rcr.idRubrique = r.idRubrique
                    JOIN categorieRubrique cr ON rcr.idCategorieRubrique = cr.idCategorieRubrique
                ")
                .ToList();
        }

        // Get RubriqueCategorieRubrique by Id
        public RubriqueCategorieRubrique GetRubriqueCategorieRubriqueById(int id)
        {
            return _context.RubriqueCategorieRubrique.FirstOrDefault(t => t.IdRubriqueCategorieRubrique == id);
        }

        // Add a new RubriqueCategorieRubrique
        public void AddRubriqueCategorieRubrique(RubriqueCategorieRubrique RubriqueCategorieRubrique)
        {
            _context.RubriqueCategorieRubrique.Add(RubriqueCategorieRubrique);
            _context.SaveChanges();
        }

        // Update a RubriqueCategorieRubrique
        public void UpdateRubriqueCategorieRubrique(RubriqueCategorieRubrique RubriqueCategorieRubrique)
        {
            _context.RubriqueCategorieRubrique.Update(RubriqueCategorieRubrique);
            _context.SaveChanges();
        }

        // Delete a RubriqueCategorieRubrique
        public void DeleteRubriqueCategorieRubrique(int id)
        {
            var RubriqueCategorieRubrique = _context.RubriqueCategorieRubrique.Find(id);
            if (RubriqueCategorieRubrique != null)
            {
                _context.RubriqueCategorieRubrique.Remove(RubriqueCategorieRubrique);
                _context.SaveChanges();
            }
        }

    }
}
