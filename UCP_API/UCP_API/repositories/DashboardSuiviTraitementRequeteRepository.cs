using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using UCP_API.dto;

namespace UCP_API.repositories
{
    public class DashboardSuiviTraitementRequeteRepository
    {
        private readonly string _connectionString;

        public DashboardSuiviTraitementRequeteRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        /// <summary>
        /// Récupère les étapes d'un circuit pour afficher les colonnes dynamiques
        /// </summary>
        public async Task<List<CircuitEtapesDto>> GetEtapesByCircuit(int idCircuit)
        {
            var etapes = new List<CircuitEtapesDto>();

            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();

                string query = @"
                    SELECT 
                        numero, 
                        description 
                    FROM circuitEtape 
                    WHERE idCircuit = @idCircuit 
                        AND deletiondate IS NULL
                    ORDER BY numero";

                using (var command = new SqlCommand(query, connection))
                {
                    command.Parameters.AddWithValue("@idCircuit", idCircuit);

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            etapes.Add(new CircuitEtapesDto
                            {
                                Numero = Convert.ToInt32(reader["numero"]),
                                Description = reader["description"]?.ToString() ?? $"Etape {reader["numero"]}"
                            });
                        }
                    }
                }
            }

            return etapes;
        }

        /// <summary>
        /// Récupère les données de suivi avec les durées par étape
        /// </summary>
        public async Task<List<DashboardSuiviTraitementRequeteDto>> GetSuiviTraitementRequete(
            int? idProjet = null,
            int? idSite = null,
            int? idCircuit = null,
            DateTime? dateDebut = null,
            DateTime? dateFin = null,
            string? numRequete = null,
            string? referenceInterne = null)
        {
            var result = new List<DashboardSuiviTraitementRequeteDto>();

            if (!idCircuit.HasValue)
            {
                Console.WriteLine("Erreur: idCircuit n'est pas fourni");
                return result;
            }

            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();

                var query = new StringBuilder(@"
WITH HistoriqueEtapes AS (
    SELECT 
        r.idRequete,
        r.numRequete,
        r.referenceInterne,
        r.objet,
        r.creationdate AS DateCreationRequete,
        p.nom AS Projet,
        s.nom AS Site,
        ce.numero AS NumeroEtape,
        ce.description AS DescriptionEtape,
        h.dateValidation,
        h.creationdate AS Hcreationdate,
        LAG(h.dateValidation) OVER (
            PARTITION BY r.idRequete 
            ORDER BY h.dateValidation
        ) AS DatePrecedente,
        r.idProjet,
        r.idSite,
        r.creationdate
    FROM requete r
    INNER JOIN projet p ON p.idProjet = r.idProjet
    LEFT JOIN site s ON s.idSite = r.idSite
    INNER JOIN CircuitRequete cr ON cr.idRequete = r.idRequete
    INNER JOIN circuit c ON c.idCircuit = cr.idCircuit
    INNER JOIN historiqueValidationRequete h ON h.idRequete = r.idRequete
    INNER JOIN circuitEtape ce ON ce.idCircuitEtape = h.idCircuitEtape
    WHERE c.idCircuit = @idCircuit
        AND ce.deletiondate IS NULL");

                // AJOUT DES FILTRES DANS LA CTE
                if (idProjet.HasValue)
                    query.Append(" AND r.idProjet = @idProjet");

                if (idSite.HasValue)
                    query.Append(" AND r.idSite = @idSite");

                if (dateDebut.HasValue && dateFin.HasValue)
                    query.Append(" AND r.creationdate BETWEEN @dateDebut AND @dateFin");

                if (!string.IsNullOrWhiteSpace(numRequete))
                    query.Append(" AND r.numRequete LIKE @numRequete");

                if (!string.IsNullOrWhiteSpace(referenceInterne))
                    query.Append(" AND r.referenceInterne LIKE @referenceInterne");

                query.Append(@")
SELECT 
    Projet,
    Site,
    numRequete AS NumeroRequete,
    referenceInterne AS ReferenceInterne,
    objet AS Objet,
    NumeroEtape,
    DescriptionEtape,
    DATEDIFF(
        HOUR,
        ISNULL(DatePrecedente, Hcreationdate),
        ISNULL(dateValidation, GETDATE())
    ) AS DureeHeures
FROM HistoriqueEtapes
ORDER BY numRequete, NumeroEtape");

                using (var command = new SqlCommand(query.ToString(), connection))
                {
                    // Paramètres
                    command.Parameters.AddWithValue("@idCircuit", idCircuit.Value);

                    if (idProjet.HasValue)
                        command.Parameters.AddWithValue("@idProjet", idProjet.Value);

                    if (idSite.HasValue)
                        command.Parameters.AddWithValue("@idSite", idSite.Value);

                    if (dateDebut.HasValue && dateFin.HasValue)
                    {
                        command.Parameters.AddWithValue("@dateDebut", dateDebut.Value);
                        command.Parameters.AddWithValue("@dateFin", dateFin.Value);
                    }

                    if (!string.IsNullOrWhiteSpace(numRequete))
                        command.Parameters.AddWithValue("@numRequete", $"%{numRequete}%");

                    if (!string.IsNullOrWhiteSpace(referenceInterne))
                        command.Parameters.AddWithValue("@referenceInterne", $"%{referenceInterne}%");

                    // Log pour debug
                    Console.WriteLine("=== SQL QUERY ===");
                    Console.WriteLine(query.ToString());
                    Console.WriteLine("=== PARAMETERS ===");
                    foreach (SqlParameter param in command.Parameters)
                    {
                        Console.WriteLine($"{param.ParameterName}: {param.Value}");
                    }

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        var requetesDict = new Dictionary<string, DashboardSuiviTraitementRequeteDto>();

                        while (await reader.ReadAsync())
                        {
                            string numeroRequete = reader["NumeroRequete"]?.ToString() ?? "";

                            if (!requetesDict.ContainsKey(numeroRequete))
                            {
                                var dto = new DashboardSuiviTraitementRequeteDto
                                {
                                    Projet = reader["Projet"]?.ToString() ?? "-",
                                    Site = reader["Site"]?.ToString() ?? "-",
                                    NumeroRequete = numeroRequete,
                                    ReferenceInterne = reader["ReferenceInterne"]?.ToString() ?? "-",
                                    Objet = reader["Objet"]?.ToString() ?? "-",
                                    DureesParEtape = new Dictionary<int, double>()
                                };
                                requetesDict[numeroRequete] = dto;
                            }

                            var requete = requetesDict[numeroRequete];
                            int numeroEtape = Convert.ToInt32(reader["NumeroEtape"]);
                            double duree = reader["DureeHeures"] == DBNull.Value
                                ? 0
                                : Convert.ToDouble(reader["DureeHeures"]);

                            requete.DureesParEtape[numeroEtape] = duree;
                        }

                        result = requetesDict.Values.ToList();
                    }
                }
            }

            Console.WriteLine($"Total requêtes trouvées: {result.Count}");
            return result;
        }
    }
}