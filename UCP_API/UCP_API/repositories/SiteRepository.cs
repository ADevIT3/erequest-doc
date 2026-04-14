using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion.Internal;
using UCP_API.data;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class SiteRepository
    {
        private readonly AppDbContext _context;
        public SiteRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all Site
        public async Task<List<Site>> GetSites()
        {
            return await _context.Site.Where(a => a.deletiondate == null).ToListAsync();
        }

        public List<Site> GetSitesByUtilisateur(int IdUtilisateur)
        {
            return _context.Site.FromSqlRaw("select site.* from utilisateurSite join site on utilisateurSite.idSite = site.idSite and utilisateurSite.idUtilisateur = @p0", IdUtilisateur).ToList();
        }

        public Site? CheckDoublon(string code, string nom)
        {
            return _context.Site.FromSqlRaw("select * from site where code = @p0 and nom = @p1", code, nom).FirstOrDefault();
        }

        // Get Site by Id
        public Site GetSiteById(int id)
        {
            return _context.Site.FirstOrDefault(a => a.idSite == id && a.deletiondate == null);
        }

        // Add a new Site
        public void AddSite(Site Site, int currentUserId)
        {
            Site.creationdate = DateTime.Now;
            Site.createdby = currentUserId;

            _context.Site.Add(Site);
            _context.SaveChanges();
        }

        // Update a Site
        public bool UpdateSite(Site Site, int id)
        {
            var isSite = _context.Site.FirstOrDefault(a => a.idSite == id && a.deletiondate == null);

            if (isSite == null)
                return false;

            isSite.code = Site.code;
            isSite.nom = Site.nom;

            _context.SaveChanges();
            return true;
        }

        // Delete a Site
        public bool DeleteSite(int id, int currentUserId)
        {
            var site = _context.Site.FirstOrDefault(a => a.idSite == id && a.deletiondate == null);
            if (site == null)
                return false;

            site.deletiondate = DateTime.Now;
            site.deletedby = currentUserId;

            _context.SaveChanges();
            return true;
        }

        // Get Site by CODE et NAME
        public async Task<Site?> GetSiteByNameCode(string code, string nom)
        {
            return await _context.Site.Where(x => (x.code == code || x.nom == nom) && x.deletiondate == null).FirstOrDefaultAsync();
        }

        // Get Site by CODE et NAME and ID
        public async Task<Site?> GetSiteByNameCodeId(string code, string nom, int id)
        {
            return await _context.Site.Where(x => x.idSite != id && (x.code == code || x.nom == nom) && x.deletiondate == null).FirstOrDefaultAsync();
        }

        public List<Site> GetSitesByIdUser(int idUtilisateur)
        {
            /*var projets = await (from up in _context.UtilisateurProjet
                                 join p in _context.Projet on up.IdProjet equals p.idProjet
                                 where up.IdUtilisateur == idUtilisateur && p.deletionDate == null
                                 select p).ToListAsync();

            return projets;*/
            List<Site> sites = _context.Site.FromSqlRaw("select site.* from utilisateursite join site on utilisateursite.idsite = site.idsite and utilisateursite.idutilisateur = @p0 ", idUtilisateur).ToList();
            return sites;
        }
    }
}