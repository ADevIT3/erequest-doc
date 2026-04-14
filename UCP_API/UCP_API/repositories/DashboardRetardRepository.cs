using System.Collections.Generic;
using System.Data.SqlClient;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using UCP_API.dto;

namespace UCP_API.repositories
{
    public class DashboardRetardRepository
    {
        private readonly string _connectionString;

        public DashboardRetardRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<List<RequeteRetardDto>> GetRequetesEnRetard()
        {
            var requetes = new List<RequeteRetardDto>();

            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();

                var query = @"
                    SELECT 
    p.nom AS Projet,
    s.nom AS Site,
    r.numRequete AS NumeroRequete,
    r.objet AS Objet,
    'AGMO' AS AGMO,
    ISNULL(r.montantValide, 0) AS MontantValide,
    ISNULL(r.montant, 0) AS MontantJustifie,
    r.dateFinExecution AS DateFinEcheance,
    DATEDIFF(HOUR, r.dateFinExecution, GETDATE()) AS RetardHeures
FROM Requete r
INNER JOIN Projet p ON r.idProjet = p.idProjet
LEFT JOIN Site s ON r.idSite = s.idSite
WHERE r.dateFinExecution < GETDATE()
ORDER BY r.dateFinExecution ASC;

                ";

                using (var command = new SqlCommand(query, connection))
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        requetes.Add(new RequeteRetardDto
                        {
                            Projet = reader["Projet"].ToString(),
                            Site = reader["Site"].ToString(),
                            NumeroRequete = reader["NumeroRequete"].ToString(),
                            Objet = reader["Objet"].ToString(),
                            AGMO = reader["AGMO"].ToString(),
                            MontantValide = Convert.ToDecimal(reader["MontantValide"]),
                            MontantJustifie = Convert.ToDecimal(reader["MontantJustifie"]),
                            DateFinEcheance = reader.GetDateTime(reader.GetOrdinal("DateFinEcheance")),
                            RetardHeures = Convert.ToDouble(reader["RetardHeures"]) // ✅ remplace GetDouble
                        });


                    }
                }
            }

            return requetes;
        }
    }
}