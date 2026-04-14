using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class CategorieRubriqueColonneRepository
    {
        private readonly AppDbContext _context;
        public CategorieRubriqueColonneRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all CategorieRubriqueColonne
        public List<CategorieRubriqueColonne> GetCategorieRubriqueColonnes()
        {
            return _context.CategorieRubriqueColonne
                .FromSqlRaw(@"
                    SELECT crc.*, cr.nom as categorieNom 
                    FROM categorieRubriqueColonne crc
                    JOIN categorieRubrique cr ON crc.idCategorieRubrique = cr.idCategorieRubrique
order by crc.numero
                ")
                .ToList();
        }

        public List<CategorieRubriqueColonne> GetCategorieRubriqueColonnesByCategorie(int idCategorieRubrique)
        {
            return _context.CategorieRubriqueColonne.FromSqlRaw("select * from categorieRubriqueColonne where idCategorieRubrique = @p0 order by numero asc ",idCategorieRubrique).ToList();
        }

        // Get CategorieRubriqueColonne by Id
        public CategorieRubriqueColonne GetCategorieRubriqueColonneById(int id)
        {
            return _context.CategorieRubriqueColonne.FirstOrDefault(t => t.IdCategorieRubriqueColonne == id);
        }

        // Add a new CategorieRubriqueColonne
        public void AddCategorieRubriqueColonne(CategorieRubriqueColonne CategorieRubriqueColonne)
        {
            _context.CategorieRubriqueColonne.Add(CategorieRubriqueColonne);
            _context.SaveChanges();
        }

        // Update a CategorieRubriqueColonne
        public void UpdateCategorieRubriqueColonne(CategorieRubriqueColonne CategorieRubriqueColonne)
        {
            _context.CategorieRubriqueColonne.Update(CategorieRubriqueColonne);
            _context.SaveChanges();
        }

        // Delete a CategorieRubriqueColonne
        public void DeleteCategorieRubriqueColonne(int id)
        {
            var CategorieRubriqueColonne = _context.CategorieRubriqueColonne.Find(id);
            if (CategorieRubriqueColonne != null)
            {
                _context.CategorieRubriqueColonne.Remove(CategorieRubriqueColonne);
                _context.SaveChanges();
            }
        }

    }
}
