using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.dto;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class RequeteRubriqueRepository
    {
        private readonly AppDbContext _context;
        public RequeteRubriqueRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all RequeteRubrique
        public List<RequeteRubrique> GetRequeteRubriques()
        {
            return _context.RequeteRubrique.ToList();
        }

        public float? GetSommeRequeteRubriquesByRequete(int idRequete)
        {
            var result = _context.Set<FloatResult>().FromSqlRaw(@"
        SELECT SUM(TRY_CAST(valeur as float)) value 
        FROM (
            SELECT tab.* 
            FROM (
                SELECT * FROM requeteRubrique WHERE idRequete = @p0
            ) tab 
            JOIN categorieRubriqueColonne 
            ON tab.idCategorieRubriqueColonne = categorieRubriqueColonne.idCategorieRubriqueColonne 
            AND categorieRubriqueColonne.nom = 'total'
        ) tab1
    ", idRequete).FirstOrDefault();

            return result?.Value != null ? (float?)result.Value : null;
        }

        public float? GetSommeRequeteRubriquesValideByRequete(int idRequete)
        {
            var result = _context.Set<FloatResult>().FromSqlRaw(@"
        SELECT SUM(TRY_CAST(valeur as float)) value 
        FROM (
            SELECT tab.* 
            FROM (
                SELECT * FROM requeteRubrique WHERE idRequete = @p0
            ) tab 
            JOIN categorieRubriqueColonne 
            ON tab.idCategorieRubriqueColonne = categorieRubriqueColonne.idCategorieRubriqueColonne 
            AND categorieRubriqueColonne.nom = 'Total_valide'
        ) tab1
    ", idRequete).FirstOrDefault();

            return result?.Value != null ? (float?)result.Value : null;
        }


        public float? GetTotalByRubriqueAndRequeteAndCategorie(int idRubrique,int idCategorie,int idRequete)
        {
            var result = _context.Set<FloatResult>().FromSqlRaw(@"
        select SUM(TRY_CAST(requeterubrique.valeur as float)) value from requeterubrique join categorierubriquecolonne on requeterubrique.idcategorierubriquecolonne = categorierubriquecolonne.idcategorierubriquecolonne and categorierubriquecolonne.nom = 'Total' where idRubrique = @p0 and idCategorieRubrique = @p1 and idRequete = @p2
    ", idRubrique, idCategorie, idRequete).FirstOrDefault();

            return result?.Value != null ? (float?)result.Value : null;
        }

        public float? GetTotalValideByRubriqueAndRequeteAndCategorie(int idRubrique, int idCategorie, int idRequete)
        {
            var result = _context.Set<FloatResult>().FromSqlRaw(@"
        select SUM(TRY_CAST(requeterubrique.valeur as float)) value from requeterubrique join categorierubriquecolonne on requeterubrique.idcategorierubriquecolonne = categorierubriquecolonne.idcategorierubriquecolonne and categorierubriquecolonne.nom = 'Total_valide' where idRubrique = @p0 and idCategorieRubrique = @p1 and idRequete = @p2
    ", idRubrique, idCategorie, idRequete).FirstOrDefault();

            return result?.Value != null ? (float?)result.Value : null;
        }

        public List<RequeteRubrique> GetRequeteRubriqueByIdRequeteAndCategorie(int idRequete, int idCategorieRubrique)
        {
            return _context.RequeteRubrique.FromSqlRaw("select * from (select requeterubrique.*, categorierubriquecolonne.idcategorierubrique, categorierubriquecolonne.numero from requeterubrique join categorierubriquecolonne on requeterubrique.idcategorierubriquecolonne = categorierubriquecolonne.idcategorierubriquecolonne and idRequete = @p0 where idcategorierubrique = @p1) tab order by numero ",idRequete,idCategorieRubrique).ToList();
        }


        // Get RequeteRubrique by Id
        public RequeteRubrique GetRequeteRubriqueById(int id)
        {
            return _context.RequeteRubrique.FirstOrDefault(t => t.IdRequeteRubrique == id);
        }

        // Add a new RequeteRubrique
        public void AddRequeteRubrique(RequeteRubrique RequeteRubrique)
        {
            _context.RequeteRubrique.Add(RequeteRubrique);
            _context.SaveChanges();
        }

        // Update a RequeteRubrique
        public void UpdateRequeteRubrique(RequeteRubrique RequeteRubrique)
        {
            _context.RequeteRubrique.Update(RequeteRubrique);
            _context.SaveChanges();
        }

        // Delete a RequeteRubrique
        public void DeleteRequeteRubrique(int id)
        {
            var RequeteRubrique = _context.RequeteRubrique.Find(id);
            if (RequeteRubrique != null)
            {
                _context.RequeteRubrique.Remove(RequeteRubrique);
                _context.SaveChanges();
            }
        }

        public List<RequeteRubrique> GetRequeteRubriquesByRequeteAndRubrique(int idRequete,int idRubrique,int idCategorie)
        {
            Console.WriteLine("select * from getRequeteRubriquesOfRubriqueAndRequete(@p0,@p1,@p2)", idRequete, idRubrique, idCategorie);
            var result = _context.RequeteRubrique.FromSqlRaw("select * from getRequeteRubriquesOfRubriqueAndRequete(@p0,@p1,@p2)", idRequete, idRubrique,idCategorie).AsNoTracking().OrderBy(r => r.IdRequeteRubrique).ToList();
            if(result == null)
            {
                result = new List<RequeteRubrique>();
            }
            return result;
        }

        public List<RequeteRubrique> GetRequeteRubriquesByRequeteAndRubriqueAndType(int idRequete, int idRubrique, int idCategorie, int idType)
        {
            var result = _context.RequeteRubrique.FromSqlRaw("select * from getRequeteRubriquesOfRubriqueAndRequeteAndType(@p0,@p1,@p2,@p3)", idRequete, idRubrique, idCategorie, idType).AsNoTracking().ToList();
            if (result == null)
            {
                result = new List<RequeteRubrique>();
            }
            return result;
        }

        public void DeleteRequeteRubriquesOfRequete(int idRequete)
        {
             _context.Database.ExecuteSqlRaw("delete  from requeterubrique where idrequete = @p0",idRequete);
            
        }

    }
}
