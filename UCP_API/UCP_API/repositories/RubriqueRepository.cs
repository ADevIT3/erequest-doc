using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class RubriqueRepository
    {
        private readonly AppDbContext _context;
        public RubriqueRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all Rubrique
        public List<Rubrique> GetRubriques()
        {
            return _context.Rubrique.ToList();
        }


        public List<Rubrique> GetRubriquesByCategorieAndRequete(int idRequete, int idCategorieRubrique)
        {
            return _context.Rubrique.FromSqlRaw("select * from  getRubriquesOfCategorieAndRequete(@p0,@p1)", idRequete, idCategorieRubrique).ToList();
        }

        public List<Rubrique> GetRubriquesByCategorieRubrique(int idCategorieRubrique)
        {
            return _context.Rubrique.FromSqlRaw("select rubrique.* from rubriqueCategorieRubrique join rubrique on rubriqueCategorieRubrique.idRubrique = rubrique.idRubrique and rubriqueCategorieRubrique.idCategorieRubrique = @p0",idCategorieRubrique).AsNoTracking().ToList();
        }

        public Rubrique GetRubriqueAutres()
        {
            return _context.Rubrique.FromSqlRaw(" select * from rubrique where nom = 'autres' ").FirstOrDefault();
        }

        // Get Rubrique by Id
        public Rubrique GetRubriqueById(int id)
        {
            return _context.Rubrique.FirstOrDefault(t => t.IdRubrique == id);
        }

        // Add a new Rubrique
        public void AddRubrique(Rubrique Rubrique)
        {
            _context.Rubrique.Add(Rubrique);
            _context.SaveChanges();
        }

        // Update a Rubrique
        public void UpdateRubrique(Rubrique Rubrique)
        {
            _context.Rubrique.Update(Rubrique);
            _context.SaveChanges();
        }

        // Delete a Rubrique
        public void DeleteRubrique(int id)
        {
            var Rubrique = _context.Rubrique.Find(id);
            if (Rubrique != null)
            {
                _context.Rubrique.Remove(Rubrique);
                _context.SaveChanges();
            }
        }

    }
}
