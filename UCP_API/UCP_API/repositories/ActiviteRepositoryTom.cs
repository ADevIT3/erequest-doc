using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Conventions;
using System.Data.SqlClient;
using UCP_API.data;
using UCP_API.dto;
using UCP_API.models;
using utils;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace UCP_API.repositories
{
    public class ActiviteRepositoryTom
    {
        private readonly AppDbContext _context;
        public ActiviteRepositoryTom(AppDbContext context)
        {
            _context = context;
        }

        //Get Parametre connexion TOMPRO
        public async Task<TomProConnection?> GetTomProDBConnection(int idProjet)
        {
            var isProjet = await _context.Projet.Where(p => p.idProjet == idProjet && p.deletionDate == null).FirstOrDefaultAsync();

            if (isProjet == null)
                return null;

            return new TomProConnection
            {
                ServerName = isProjet.serverName ?? string.Empty,
                Login = isProjet.login ?? string.Empty,
                Password = isProjet.password ?? string.Empty,
                DatabaseName = isProjet.databaseName ?? string.Empty
            };
        }

        // Get all exercice by idProjet
        public async Task<List<REXERCICE>> GetExercicesByIdProjet(int idProjet)
        {
            List<REXERCICE> lisExo = new List<REXERCICE>();

            var tomProDBConnection = await GetTomProDBConnection(idProjet);

            if (tomProDBConnection == null)
                return lisExo;

            var connectionString = ConnexTOM.ConnexTOMPRO(tomProDBConnection);

            using var connTom = new SqlConnection(connectionString);
            await connTom.OpenAsync();

            using var cmd = new SqlCommand(@"
                SELECT ANNEE, DATEDEB, DATEFIN, DEFAULTBUDGET
                FROM REXERCICE
				WHERE DEFAULTBUDGET <> 0;
            ", connTom);

            using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                lisExo.Add(new REXERCICE
                {
                    ANNEE = reader["ANNEE"].ToString()!,
                    DATEDEB = DateTime.Parse(reader["DATEDEB"].ToString()!),
                    DATEFIN = DateTime.Parse(reader["DATEFIN"].ToString()!),
                    DEFAULTBUDGET = int.Parse(reader["DEFAULTBUDGET"].ToString()!)
                });
            }

            return lisExo;
        }

        // Get all budget by NUMBUD
        public async Task<List<RBUDGET>> GetBudgetsByIdProjet(int idProjet, int Numbud)
        {
            List<RBUDGET> lisBud = new List<RBUDGET>();

            var tomProDBConnection = await GetTomProDBConnection(idProjet);

            if (tomProDBConnection == null)
                return lisBud;

            var connectionString = ConnexTOM.ConnexTOMPRO(tomProDBConnection);

            using var connTom = new SqlConnection(connectionString);
            await connTom.OpenAsync();

            using var cmd = new SqlCommand(@"
                SELECT NUMBUD, LIBELLE, COURS
                FROM RBUDGET
				WHERE NUMBUD = @Numbud;
            "
            , connTom);

            cmd.Parameters.AddWithValue("@Numbud", Numbud);

            using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                lisBud.Add(new RBUDGET
                {
                    NUMBUD = int.Parse(reader["NUMBUD"].ToString()!),
                    LIBELLE = reader["LIBELLE"].ToString()!,
                    COURS = decimal.Parse(reader["COURS"].ToString()!)
                });
            }

            return lisBud;
        }

        // Get all activités by NUMBUD
        public async Task<List<MBUDGET>> GetActivitesByIdProjet(int idProjet, int Numbud, decimal cours)
        {
            List<MBUDGET> lisActi = new List<MBUDGET>();

            var tomProDBConnection = await GetTomProDBConnection(idProjet);

            if (tomProDBConnection == null)
                return lisActi;

            var connectionString = ConnexTOM.ConnexTOMPRO(tomProDBConnection);

            using var connTom = new SqlConnection(connectionString);
            await connTom.OpenAsync();

            using var cmd = new SqlCommand(@"
                WITH Ranked AS (
                    SELECT 
                        ANNEE, NUMBUD, ACTI, LIBELLE, MONTBUDGET,
                        ROW_NUMBER() OVER (PARTITION BY ACTI ORDER BY ANNEE DESC) AS rn
                    FROM MBUDGET
                    WHERE NUMBUD = @Numbud
                )
                SELECT ANNEE, NUMBUD, ACTI, LIBELLE, MONTBUDGET
                FROM Ranked
                WHERE rn = 1;
            "
            , connTom);

            cmd.Parameters.AddWithValue("@Numbud", Numbud);

            using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                lisActi.Add(new MBUDGET
                {
                    ANNEE = reader["ANNEE"].ToString()!,
                    NUMBUD = int.Parse(reader["NUMBUD"].ToString()!),
                    ACTI = reader["ACTI"].ToString()!,
                    LIBELLE = reader["LIBELLE"].ToString()!,
                    MONTBUDGET = cours == 0 ? decimal.Parse(reader["MONTBUDGET"].ToString()!) : (decimal.Parse(reader["MONTBUDGET"].ToString()!) * cours)
                });
            }

            return lisActi;
        }

        // Get TOTAL MBUDGET (activité) by NUMBUD et ACTI
        public async Task<decimal?> GetSommeActivitesByIdProjet(int idProjet, int Numbud, string Acti, decimal cours/*, string Exercice*/)
        {
            var tomProDBConnection = await GetTomProDBConnection(idProjet);

            if (tomProDBConnection == null)
                return null;

            var connectionString = ConnexTOM.ConnexTOMPRO(tomProDBConnection);

            using var connTom = new SqlConnection(connectionString);
            await connTom.OpenAsync();

            using var cmd = new SqlCommand(@"
                SELECT SUM(MONTBUDGET) AS Total
                FROM MBUDGET
				WHERE NUMBUD = @Numbud AND ACTI = @Acti;
            "
            , connTom);

            cmd.Parameters.AddWithValue("@Numbud", Numbud);
            cmd.Parameters.AddWithValue("@Acti", Acti);
            //cmd.Parameters.AddWithValue("@Exercice", Exercice);

            var result = await cmd.ExecuteScalarAsync();

            if (result == DBNull.Value)
                return null;

            decimal value = (decimal)result;
            return cours == 0 ? value : value * cours;
        }

        // Get TOTAL MCOMPTA (réalisé) by ACTI
        public async Task<decimal?> GetRealiseActivitesByIdProjet(int idProjet, string Acti/*, string Execice*/)
        {
            var tomProDBConnection = await GetTomProDBConnection(idProjet);

            if (tomProDBConnection == null)
                return null;

            var connectionString = ConnexTOM.ConnexTOMPRO(tomProDBConnection);

            using var connTom = new SqlConnection(connectionString);
            await connTom.OpenAsync();

            using var cmd = new SqlCommand(@"
                SELECT SUM(
                    CASE 
                        WHEN S = 'D' THEN MONTANT
                        WHEN S = 'C' THEN -MONTANT
                        ELSE 0
                    END
                ) AS Total
                FROM MCOMPTA
                WHERE (COGE LIKE '2%' OR COGE LIKE '6%') 
                AND ACTI = @Acti;
            "
            , connTom);

            cmd.Parameters.AddWithValue("@Acti", Acti);
            //cmd.Parameters.AddWithValue("@Annee", Execice);

            var result = await cmd.ExecuteScalarAsync();
            return result != DBNull.Value ? (decimal?)result : null;
        }

        //// Get all Acti
        //public async Task<List<Activite>> GetActis(List<Projet> listProjet)
        //{
        //    return await _context.Activite.Where(a => a.deletiondate == null).ToListAsync();
        //}

        //// Get all Acti by idProjet
        //public async Task<List<Activite>> GetActisByIdProjet(int idProjet)
        //{
        //    return await _context.Activite.Where(a => a.idProjet == idProjet && a.deletiondate == null).ToListAsync();
        //}

        //// Get Acti by Id
        //public Activite GetActiById(int id)
        //{
        //    return _context.Activite.FirstOrDefault(a => a.idActivite == id && a.deletiondate == null);
        //}

        //// Get Acti by IdUser
        //public async Task<List<Activite>> GetActivitesByUser(int idUtilisateur)
        //{
        //    var userProjects = await _context.UtilisateurProjet
        //                                     .Where(up => up.IdUtilisateur == idUtilisateur)
        //                                     .Select(up => up.IdProjet)
        //                                     .ToListAsync();

        //    var activites = await _context.Activite
        //                                  .Where(a => userProjects.Contains(a.idProjet) && a.deletiondate == null)
        //                                  .ToListAsync();

        //    return activites;
        //}

        //// Add a new Acti
        //public void AddActivite(Activite Acti, int currentUserId, int idProjet)
        //{
        //    Acti.idProjet = idProjet;
        //    Acti.creationdate = DateTime.Now;
        //    Acti.createdby = currentUserId;

        //    _context.Activite.Add(Acti);
        //    _context.SaveChanges();
        //}

        //// Update a Acti
        //public bool UpdateActi(Activite Activite, int id)
        //{
        //    var isActi = _context.Activite.FirstOrDefault(a => a.idActivite == id && a.deletiondate == null);

        //    if (isActi == null)
        //        return false;

        //    isActi.code = Activite.code;
        //    isActi.nom = Activite.nom;

        //    _context.SaveChanges();
        //    return true;
        //}

        //// Delete a Acti
        //public bool DeleteActi(int id, int currentUserId)
        //{
        //    var acti = _context.Activite.FirstOrDefault(a => a.idActivite == id && a.deletiondate == null);
        //    if (acti == null)
        //        return false;

        //    acti.deletiondate = DateTime.Now;
        //    acti.deletedby = currentUserId;

        //    _context.SaveChanges();
        //    return true;
        //}

        //// Get Acti by CODE et NAME
        //public async Task<Activite?> GetActiByNameCodeProjet(string code, string nom, int idProjet)
        //{
        //    return await _context.Activite.Where(x => (x.code == code || x.nom == nom) && x.idProjet == idProjet && x.deletiondate == null).FirstOrDefaultAsync();
        //}

        //// Get Acti by CODE et NAME and ID
        //public async Task<Activite?> GetActiByNameCodeId(string code, string nom, int id)
        //{
        //    var idProjet = _context.Activite.Where(x => x.idActivite == id && x.deletiondate == null).FirstOrDefault().idProjet;

        //    return await _context.Activite.Where(x => x.idActivite != id && (x.code == code || x.nom == nom) && x.idProjet == idProjet && x.deletiondate == null).FirstOrDefaultAsync();
        //}
    }
}