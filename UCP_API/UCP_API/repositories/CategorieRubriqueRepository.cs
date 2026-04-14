using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.dto;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class CategorieRubriqueRepository
    {
        private readonly AppDbContext _context;
        public CategorieRubriqueRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all CategorieRubrique
        public List<CategorieRubrique> GetCategorieRubriques()
        {
            return _context.CategorieRubrique.ToList();
        }

        public List<CategorieRubrique> GetCategorieRubriquesByTypeRubrique(int idTypeRubrique)
        {
            return _context.CategorieRubrique.FromSqlRaw("select categorieRubrique.* from typeCategorieRubrique join categorieRubrique on typeCategorieRubrique.idTypeRubrique = @p0 and typeCategorieRubrique.idCategorieRubrique = categorieRubrique.idCategorieRubrique",idTypeRubrique).ToList();
        }

        public List<CategorieRubrique> GetCategorieRubriquesOfRequete(int idRequete)
        {
            return _context.CategorieRubrique.FromSqlRaw("select * from getCategoriesOfRequete(@p0) ",idRequete).ToList();
        }

        public CategorieRubrique GetCategorieAutres()
        {
            return _context.CategorieRubrique.FromSqlRaw("select * from categorierubrique where nom = 'autres'").FirstOrDefault();
        }
        // Get CategorieRubrique by Id
        public CategorieRubrique GetCategorieRubriqueById(int id)
        {
            return _context.CategorieRubrique.FirstOrDefault(t => t.IdCategorieRubrique == id);
        }

        // Add a new CategorieRubrique
        public void AddCategorieRubrique(CategorieRubrique CategorieRubrique)
        {
            _context.CategorieRubrique.Add(CategorieRubrique);
            _context.SaveChanges();
        }

        // Update a CategorieRubrique
        public void UpdateCategorieRubrique(CategorieRubrique CategorieRubrique)
        {
            _context.CategorieRubrique.Update(CategorieRubrique);
            _context.SaveChanges();
        }

        // Delete a CategorieRubrique
        public void DeleteCategorieRubrique(int id)
        {
            var CategorieRubrique = _context.CategorieRubrique.Find(id);
            if (CategorieRubrique != null)
            {
                _context.CategorieRubrique.Remove(CategorieRubrique);
                _context.SaveChanges();
            }
        }

        public List<SommeCategorieRubriqueDTO> GetSommeCategorieRubriquesOfRequete(int idRequete)
        {
            return _context.SommeCategorieRubriqueDTO.FromSqlRaw("select * from getSommeCategoriesOfRequete(@p0) ", idRequete).ToList();
        }

         public float? GetTotalByRubriqueAndCategorie(int idCategorie,int idRequete)
        {
            var result = _context.Set<FloatResult>().FromSqlRaw(@"
        select SUM(TRY_CAST(requeterubrique.valeur as float)) value from requeterubrique join categorierubriquecolonne on requeterubrique.idcategorierubriquecolonne = categorierubriquecolonne.idcategorierubriquecolonne and categorierubriquecolonne.nom = 'Total' where idCategorieRubrique = @p0 and idRequete = @p1
    ", idCategorie, idRequete).FirstOrDefault();

            return result?.Value != null ? (float?)result.Value : null;
        }

    }
}
