using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using System.Data.SqlClient;
using UCP_API.data;
using UCP_API.dto;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class ProjetRepository
    {
        private readonly AppDbContext _context;
        public ProjetRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all Projet
        public async Task<List<Projet>> GetProjets()
        {
            return await _context.Projet.Where(a => a.deletionDate == null).ToListAsync();
        }

        public Projet GetProjetByActivite(int idActivite)
        {
           var result = _context.Projet.FromSqlRaw("select projet.* from activite join projet on activite.idProjet = projet.idProjet and activite.idActivite = @p0",idActivite).ToList();
            if (result != null || result.Count() != 0)
            {
                return result[0];
            }
            else
            {
                return null;
            }
        }

        public List<Projet> GetProjetsByUtilisateur(int IdUtilisateur)
        {
            return _context.Projet.FromSqlRaw("select projet.* from utilisateurProjet join projet on utilisateurProjet.idProjet = projet.idProjet and utilisateurProjet.idUtilisateur = @p0", IdUtilisateur).ToList();
        }

        public List<Projet> GetProjetsByDroit(int IdUtilisateur,int idAgmo)
        {
            return _context.Projet.FromSqlRaw("select * from (select projet.*,coalesce(tab2.idprojet,null) tab2idprojet from utilisateurProjet \r\njoin projet on utilisateurProjet.idProjet = projet.idProjet and utilisateurProjet.idUtilisateur = @p0\r\nleft join\r\n(select distinct projet.* from \r\n(select tab.idrequete,coalesce(justificatif.idjustif,0) idjustif from \r\n(select requete.idrequete,utilisateur.idagmo from requete \r\njoin utilisateur on utilisateur.idutilisateur = requete.idutilisateur \r\nwhere EtatValidation = 5 and utilisateur.idagmo = @p1 AND DATEADD(DAY,15 + (2 * ((15 + DATEPART(WEEKDAY, requete.datefinexecution) - 1) / 5)),requete.datefinexecution) <= CAST(GETDATE() AS DATE)) tab \r\nleft join justificatif on tab.idrequete = justificatif.idrequete ) tab1 \r\njoin requete on requete.idrequete = tab1.idrequete\r\njoin projet on requete.idprojet = projet.idprojet\r\nwhere idjustif = 0) tab2\r\non tab2.idprojet = projet.idprojet) tab3\r\nwhere tab2idprojet is null", IdUtilisateur,idAgmo).ToList();
        }


        // Get Projet by Id
        public Projet GetProjetById(int id)
        {
            return _context.Projet.FirstOrDefault(a => a.idProjet == id && a.deletionDate == null);
        }

        // Add a new Projet
        public void AddProjet(Projet Projet, int currentUserId)
        {
            Projet.creationDate = DateTime.Now;
            Projet.createdBy = currentUserId;

            _context.Projet.Add(Projet);
            _context.SaveChanges();
        }

        // Update a Projet
        public bool UpdateProjet(Projet Projet, int id)
        {
            var isProject = _context.Projet.FirstOrDefault(a => a.idProjet == id && a.deletionDate == null);

            if (isProject == null)
                return false;

            isProject.nom = Projet.nom;
            //isProject.storage = Projet.storage; /*Alako lo sao dia miteraka erreur coté déploiment ra efa prod*/
            isProject.serverName = Projet.serverName;
            isProject.login = Projet.login;
            isProject.password = Projet.password;
            isProject.serverName = Projet.serverName;
            isProject.databaseName = Projet.databaseName;
            _context.SaveChanges();
            return true;
        }

        // Delete a Projet
        public bool DeleteProjet(int id, int currentUserId)
        {
            var isProject = _context.Projet.FirstOrDefault(a => a.idProjet == id && a.deletionDate == null);
            if (isProject == null)
                return false;

            isProject.deletionDate = DateTime.Now;
            isProject.deletedBy = currentUserId;

            _context.SaveChanges();
            return true;
        }

        // Get Projet by NAME
        public async Task<Projet?> GetProjetByNameStorage(string nom, string storage)
        {
            return await _context.Projet.Where(x => (x.nom == nom || x.storage == storage) && x.deletionDate == null).FirstOrDefaultAsync();
        }

        // Get Projet by NAME and ID
        public async Task<Projet?> GetProjetByNameStorageId(string nom, string storage, int id)
        {
            return await _context.Projet.Where(x => x.idProjet != id && (x.nom == nom || x.storage == storage) && x.deletionDate == null).FirstOrDefaultAsync();
        }

        public async Task<List<Database>> GetDatabases(DBConnexionDetails connexionDetails)
        {
            var connectionString = connexionDetails.Login == null || connexionDetails.Password == null ?
                    $"Server={connexionDetails.ServerName}; Persist Security Info=False;Trusted_Connection=True; "
                    : $"Server={connexionDetails.ServerName}; User Id={connexionDetails.Login}; Password={connexionDetails.Password}; TrustServerCertificate=true; ";

            using var conn = new SqlConnection(connectionString);
            await conn.OpenAsync();

            var res = new List<Database>();

            using var cmd = new SqlCommand(@"
                SELECT database_id AS Id, name AS Name
                FROM sys.databases;
            ", conn);

            using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                res.Add(new Database
                {
                    Id = reader["Id"].ToString()!,
                    Name = reader["Name"].ToString()!
                });
            }

            return res;
        }


        // Get All Projet by idUser
        public List<Projet> GetProjetsByIdUser(int idUtilisateur)
        {
            /*var projets = await (from up in _context.UtilisateurProjet
                                 join p in _context.Projet on up.IdProjet equals p.idProjet
                                 where up.IdUtilisateur == idUtilisateur && p.deletionDate == null
                                 select p).ToListAsync();

            return projets;*/
            List<Projet> projets =  _context.Projet.FromSqlRaw("select projet.* from utilisateurprojet join projet on utilisateurprojet.idprojet = projet.idprojet and utilisateurprojet.idutilisateur = @p0 ", idUtilisateur).ToList();
            return projets;
        }
    }
}