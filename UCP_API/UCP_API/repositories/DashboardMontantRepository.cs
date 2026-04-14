using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.dto;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace UCP_API.repositories
{
    public class DashboardMontantRepository
    {
        private readonly AppDbContext _context;

        public DashboardMontantRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<DashboardMontantDTO>> GetMontantRequetes()
        {
            var query = @"
SELECT 
    p.nom AS Projet,
    s.nom AS Site,
    r.numRequete AS NumeroRequete,
    r.objet AS Objet,
    'AGMO' AS AGMO,
    CAST(ISNULL(r.montant, 0) AS DECIMAL(18, 2)) AS MontantInitial,
    CAST(ISNULL(r.montantValide, 0) AS DECIMAL(18, 2)) AS MontantValide
FROM Requete r
INNER JOIN Projet p ON r.idProjet = p.idProjet
LEFT JOIN Site s ON r.idSite = s.idSite
WHERE r.EtatValidation != 5 and r.EtatValidation != 2   -- ❗ TOUT sauf valide
ORDER BY p.nom, s.nom;";

            var data = await _context.Set<DashboardMontantDTO>()
                                     .FromSqlRaw(query)
                                     .AsNoTracking()
                                     .ToListAsync();

            return data;
        }
    }
}