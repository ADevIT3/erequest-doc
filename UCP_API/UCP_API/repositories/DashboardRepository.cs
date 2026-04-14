using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.dto;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace UCP_API.repositories
{
    public class DashboardRepository
    {
        private readonly AppDbContext _context;

        public DashboardRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<DashboardRetardDTO>> GetRequetesRetardValidation()
        {
            // Indique que le DTO est "Keyless"
            var data = await _context.Set<DashboardRetardDTO>()
     .FromSqlRaw(@"
SELECT 
    p.nom AS Projet,
    s.nom AS Site,
    r.numRequete AS NumeroRequete,
    r.objet AS Objet,
    'AGMO' AS AGMO,
    SUM(e.duree) AS DureeTotaleCircuit, -- somme des durées du circuit
    DATEADD(DAY, SUM(e.duree), r.creationdate) AS DateLimite, -- date limite
    DATEDIFF(HOUR, DATEADD(DAY, SUM(e.duree), r.creationdate), GETDATE()) AS RetardHeures, -- retard par rapport à la durée totale
    --CASE 
       -- WHEN DATEDIFF(DAY,GETDATE(),DATEADD(DAY, SUM(e.duree), r.creationdate)) <= 5 and  DATEDIFF(DAY,GETDATE(),DATEADD(DAY, SUM(e.duree), r.creationdate))  >= 0
        --THEN DATEDIFF(DAY,GETDATE(),  DATEADD(DAY, SUM(e.duree), r.creationdate)) ELSE 0
    --END AS A_risque -- à risque si moins de 5 jours avant date limite
    DATEDIFF(DAY,GETDATE(),  DATEADD(DAY, SUM(e.duree), r.creationdate)) A_risque
FROM Requete r
INNER JOIN Projet p ON r.idProjet = p.idProjet
LEFT JOIN Site s ON r.idSite = s.idSite
INNER JOIN CircuitRequete cr ON r.idRequete = cr.idRequete
INNER JOIN circuitEtape e ON cr.idCircuit = e.idCircuit
WHERE r.EtatValidation != 1 -- requêtes non validées
GROUP BY 
    p.nom, s.nom, r.numRequete, r.objet, r.creationdate
ORDER BY RetardHeures DESC;

")
     .AsNoTracking()
     .ToListAsync();


            return data;
        }
    }
}