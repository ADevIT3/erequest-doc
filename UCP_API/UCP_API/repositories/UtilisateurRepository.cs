using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Data;
using UCP_API.data;
using UCP_API.dto;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class UtilisateurRepository
    {
        private readonly AppDbContext _context;
        public UtilisateurRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all Utilisateur in request
        /*public async Task<List<UtilisateurProjetsSites>> GetUtilisateurs()
        {
            return await _context.Utilisateur.Where(a => a.deletionDate == null).Include(a => a.UtilisateurProjets).Include(a => a.UtilisateurSites).Select(a => new UtilisateurProjetsSites
            {
                Utilisateur = a,
                Projets = a.UtilisateurProjets.Select(up => up.IdProjet).ToList(),
                Sites = a.UtilisateurSites.Select(us => us.IdSite).ToList()
            }).ToListAsync();
        }*/

        /*public  List<Utilisateur> GetUtilisateurs()
        {
            return _context.Utilisateur.Include(u => u.Role).Include(u => u.Agmo).ToList();
        }*/

        public List<Utilisateur> GetUtilisateurs()
        {
            return _context.Utilisateur.FromSqlRaw("select * from utilisateur where deletionDate is null").Include(u => u.Role).Include(u => u.Agmo).ToList();
        }

        public int GetNbPageUtilisateurs()
        {
            int nbUtilisateur = _context.Utilisateur.FromSqlRaw("select * from utilisateur where deletionDate is null").Count();
            int quotient = nbUtilisateur / 10;
            if (nbUtilisateur - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }

        public int GetNbPageUtilisateursByWord(string word)
        {

            int nbUtilisateur = _context.Utilisateur.FromSqlRaw("select * from (select utilisateur.*,role.nom nomrole,agmo.nom nomagmo from utilisateur join role on role.idrole = utilisateur.idrole join agmo on agmo.idagmo = utilisateur.idagmo ) tab where (username LIKE @p1 or email LIKE @p1 or firstname LIKE @p1 or lastname LIKE @p1 or fonction LIKE @p1 or nomrole LIKE @p0 or nomagmo LIKE @p1) and deletionDate is null ", word + "%", "%" + word + "%").Count();
            int quotient = nbUtilisateur / 10;
            if (nbUtilisateur - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }

        public int GetNbUtilisateur()
        {
            return _context.Utilisateur.FromSqlRaw("select * from utilisateur where deletionDate is null").Count();
        }

        public List<Utilisateur> GetUtilisateursByPage(int page)
        {

            return _context.Utilisateur.FromSqlRaw("select * from utilisateur where deletionDate is null ORDER BY idUtilisateur OFFSET (@p0 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY ", page).Include(u => u.Role).Include(u => u.Agmo).ToList();
        }

        public List<Utilisateur> GetUtilisateursByPageAndWord(string word, int page)
        {

            return _context.Utilisateur.FromSqlRaw("select idutilisateur,username,password,email,idrole,firstname,lastname,fonction,creationdate,createdBy,deletiondate,deletedby,storage,isreceivedrequete,phonenumber,idagmo,isclotureur,canDeleteAttachment from (select utilisateur.*,role.nom nomrole,agmo.nom nomagmo from utilisateur join role on role.idrole = utilisateur.idrole join agmo on agmo.idagmo = utilisateur.idagmo ) tab where (username LIKE @p2 or email LIKE @p2 or firstname LIKE @p2 or lastname LIKE @p2 or fonction LIKE @p2 or nomrole LIKE @p2 or nomagmo LIKE @p2) and deletionDate is  null ORDER BY idUtilisateur OFFSET (@p0 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", page, word + "%", "%" + word + "%").Include(u => u.Role).Include(u => u.Agmo).ToList();
        }

        public Utilisateur FindByIdUtilisateur(int idUtilisateur)
        {
            return _context.Utilisateur.FromSqlRaw("select * from utilisateur where idutilisateur = @p0", idUtilisateur).Include(u => u.Agmo).ToList()[0];
        }

        // Get all Utilisateur, même projet qu'utilisateur connecté
        public async Task<List<UtilisateurProjetsSites>> GetUtilisateursSameProjet(int currentUserId)
        {
            var userProjects = await _context.UtilisateurProjet
                                              .Where(up => up.IdUtilisateur == currentUserId)
                                              .Select(up => up.IdProjet)
                                              .ToListAsync();

            var utilisateurs = await _context.Utilisateur
                                      .Where(u => u.deletionDate == null &&
                                                  u.UtilisateurProjets.Any(up => userProjects.Contains(up.IdProjet)))
                                      .Include(u => u.UtilisateurProjets)
                                      .Include(u => u.UtilisateurSites)
                                      .Select(u => new UtilisateurProjetsSites
                                      {
                                          Utilisateur = u,
                                          Projets = u.UtilisateurProjets.Select(up => up.IdProjet).ToList(),
                                          Sites = u.UtilisateurSites.Select(us => us.IdSite).ToList()
                                      })
                                      .ToListAsync();

            return utilisateurs;
        }
        public Utilisateur GetUtilisateurByRequete(int idRequete)
        {
            var result = _context.Utilisateur.FromSqlRaw("select utilisateur.* from requete join utilisateur on requete.idUtilisateur = utilisateur.idUtilisateur and requete.idRequete = @p0", idRequete).Include(r => r.Agmo).ToList();
            if (result != null || result.Count() != 0)
            {
                return result[0];
            }
            else
            {
                return null;
            }
        }

        //Get Role by Name
        public async Task<int> GetRoleByName(string? nom)
        {
            var role = await _context.Role.FirstOrDefaultAsync(r => r.nom == nom);
            return role.idRole;
        }

        // Get all AGMO même projet et site qu'utilisateur connecté
        public async Task<List<Utilisateur>> GetAgmosSameProjetSite(int currentUserId, int idRole, FiltresDTO filtres)
        {
            var userProjects = await _context.UtilisateurProjet.Where(up => up.IdUtilisateur == currentUserId).Select(up => up.IdProjet).ToListAsync();
            var userSites = await _context.UtilisateurSite.Where(up => up.IdUtilisateur == currentUserId).Select(up => up.IdSite).ToListAsync();

            var projetsFiltres = filtres.idprojets.Any() ? filtres.idprojets : userProjects;
            var sitesFiltres = filtres.idsites.Any() ? filtres.idsites : userSites;

            var utilisateurs = await _context.Utilisateur.Where(u => u.idrole == idRole && u.deletionDate == null && u.UtilisateurProjets.Any(up => userProjects.Contains(up.IdProjet)) && u.UtilisateurSites.Any(up => userSites.Contains(up.IdSite))).ToListAsync();

            return utilisateurs;
        }


        public Utilisateur GetUtilisateurById(int id)
        {
            return _context.Utilisateur.FromSqlRaw("select * from utilisateur where idutilisateur = @p0", id).Include(u => u.Agmo).ToList()[0];
        }

        // Get Utilisateur by Id
        /* public async Task<UtilisateurProjetsSites> GetUtilisateurById(int id)
         {
             return await _context.Utilisateur.Where(t => t.IdUtilisateur == id && t.deletionDate == null).Include(t => t.UtilisateurProjets).Include(t => t.UtilisateurSites).Select(t => new UtilisateurProjetsSites
             {
                 Utilisateur = t,
                 Projets = t.UtilisateurProjets.Select(up => up.IdProjet).ToList(),
                 Sites = t.UtilisateurSites.Select(us => us.IdSite).ToList()
             }).FirstOrDefaultAsync();
         }*/

        // Add a new Utilisateur
        public void AddUtilisateur(Utilisateur Utilisateur)
        {
            _context.Utilisateur.Add(Utilisateur);
            _context.SaveChanges();
        }

        // Update a Utilisateur
        public async Task<bool> UpdateUtilisateur(Utilisateur utilisateur, int id, List<int> idSites, List<int> idProjets, List<string> mailccs)
        {
            /*var isUser = await _context.Utilisateur.FirstOrDefaultAsync(a => a.IdUtilisateur == id && a.deletionDate == null);

            if (isUser == null)
                return false;

           /* isUser.username = utilisateur.username;
            isUser.password = utilisateur.password;
            isUser.email = utilisateur.email;
            //isUser.phonenumber = utilisateur.phonenumber;
            isUser.idrole = utilisateur.idrole;
            isUser.firstname = utilisateur.firstname;
            isUser.lastname = utilisateur.lastname;
            isUser.fonction = utilisateur.fonction;
            isUser.isReceivedRequete = utilisateur.isReceivedRequete;*/

            //isUser.idAgmo = utilisateur.idAgmo;

            _context.Utilisateur.Update(utilisateur);
            await _context.SaveChangesAsync();

            //utilisateur - projets
            var oldProjets = _context.UtilisateurProjet.Where(a => a.IdUtilisateur == id);
            if (oldProjets != null)
            {
                _context.UtilisateurProjet.RemoveRange(oldProjets);
            }


            foreach (var idProjet in idProjets)
            {
                var newProjet = new UtilisateurProjet
                {
                    IdUtilisateur = id,
                    IdProjet = idProjet
                };
                _context.UtilisateurProjet.Add(newProjet);
            }

            //utilisateur - sites

            var oldSites = _context.UtilisateurSite.Where(a => a.IdUtilisateur == id);
            if (oldSites != null)
            {
                _context.UtilisateurSite.RemoveRange(oldSites);
            }



            foreach (var idSite in idSites)
            {
                var newSite = new UtilisateurSite
                {
                    IdUtilisateur = id,
                    IdSite = idSite
                };
                _context.UtilisateurSite.Add(newSite);
            }

            //utilisateur - projets
            var oldCC = _context.UtilisateurCC.Where(a => a.idUtilisateur == id);
            if (oldProjets != null)
            {
                _context.UtilisateurCC.RemoveRange(oldCC);
            }


            foreach (var mailCC in mailccs)
            {
                var UtilisateurCC = new UtilisateurCC
                {
                    idUtilisateur = id,
                    mailCC = mailCC
                };
                _context.UtilisateurCC.Add(UtilisateurCC);
            }

            await _context.SaveChangesAsync();

            return true;
        }

        public Boolean changePassword(string newPassword, int idUtilisateur)
        {
            try
            {
                _context.Database.ExecuteSqlRaw("update utilisateur set password = @p0 where idUtilisateur = @p1", newPassword, idUtilisateur);
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<List<UtilisateurProjetsSites>> GetUtilisateursByIds(List<int> id)
        {
            var utilisateurs = await _context.Utilisateur.Where(t => id.Contains(t.IdUtilisateur) && t.deletionDate == null).ToListAsync();

            var result = utilisateurs.Select(utilisateur => new UtilisateurProjetsSites
            {
                Utilisateur = utilisateur
            }).ToList();

            return result;
        }

        // Delete a Utilisateur
        public async Task<bool> DeleteUtilisateur(int id, int currentUserId)
        {
            var user = await _context.Utilisateur.FirstOrDefaultAsync(a => a.IdUtilisateur == id && a.deletionDate == null);
            if (user == null)
                return false;

            user.deletionDate = DateTime.Now;
            user.deletedBy = currentUserId;

            //utilisateur - projets
            var userProjets = _context.UtilisateurProjet.Where(a => a.IdUtilisateur == id);
            _context.UtilisateurProjet.RemoveRange(userProjets);

            //utilisateur - sites
            var userSites = _context.UtilisateurSite.Where(a => a.IdUtilisateur == id);
            _context.UtilisateurSite.RemoveRange(userSites);

            await _context.SaveChangesAsync();
            return true;
        }

        // Get Utilisateur by NAME
        public async Task<Utilisateur?> GetUtilisateurByUserName(string username)
        {
            if (_context.Utilisateur.Any(x => x.username == username && x.deletionDate == null))
                return await _context.Utilisateur.FirstOrDefaultAsync(a => a.username == username && a.deletionDate == null);

            return null;
        }

        //Add utilisateur - projets
        public async Task AddUtilisateurProjet(UtilisateurProjet utilisateurProjet)
        {
            _context.UtilisateurProjet.Add(utilisateurProjet);
            await _context.SaveChangesAsync();
        }

        //Add utilisateur - sites
        public async Task AddUtilisateurSite(UtilisateurSite utilisateurSite)
        {
            _context.UtilisateurSite.Add(utilisateurSite);
            await _context.SaveChangesAsync();
        }

        //Get Role by id
        public async Task<Role> GetRoleById(int idRole)
        {
            return await _context.Role.FirstOrDefaultAsync(r => r.idRole == idRole);
        }

   

        //Get projet by id
        public async Task<Projet> GetProjetById(int idProjet)
        {
            return await _context.Projet.FirstOrDefaultAsync(p => p.idProjet == idProjet);
        }

        //Change password
        public async Task UpdateUtilisateurPwd(Utilisateur utilisateur)
        {
            _context.Utilisateur.Update(utilisateur);
            await _context.SaveChangesAsync();
        }

        // Delete a ENTETE AGMO
        public async Task<bool> DeleteEnteteAGMO(int id)
        {
            var entete = _context.Entete.Where(a => a.idUtilisateurAGMO == id);

            if (entete.Any())
            {
                _context.Entete.RemoveRange(entete);
                await _context.SaveChangesAsync();

                return true;
            }

            return false;
        }

        // Add a ENTETE AGMO
        public async Task AddEnteteAGMO(Entete entete, int currentUserId)
        {
            entete.creationdate = DateTime.Now;
            entete.createdby = currentUserId;

            _context.Entete.Add(entete);
            await _context.SaveChangesAsync();
        }



    }
}