using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.dto;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class JustificatifRepository
    {
        private readonly AppDbContext _context;
        public JustificatifRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all Justificatif
        public List<Justificatif> GetJustificatifs()
        {
            return _context.Justificatif.ToList();
        }

        // Get Justificatif by Id
        public Justificatif GetJustificatifById(int id)
        {
            return _context.Justificatif.FirstOrDefault(t => t.IdJustif == id);
        }

        // Add a new Justificatif
        public void AddJustificatif(Justificatif Justificatif)
        {
            _context.Justificatif.Add(Justificatif);
            _context.SaveChanges();
        }

        // Update a Justificatif
        public void UpdateJustificatif(Justificatif Justificatif)
        {
            _context.Justificatif.Update(Justificatif);
            _context.SaveChanges();
        }

        public void UpdateJustificatifWithSql(int idJustif, double montantValide)
        {
            _context.Database.ExecuteSqlRaw("update justificatif set montantValide = @p0 where idJustif = @p1",montantValide,idJustif);
            _context.SaveChanges();
        }

        public void UpdateCommentaireRevision(int idJustif, string commentaire)
        {
            _context.Database.ExecuteSqlRaw("update justificatif set commentaireRevision = @p0 where idJustif = @p1", commentaire, idJustif);

        }


        // Delete a Justificatif
        public void DeleteJustificatif(int id)
        {
            var Justificatif = _context.Justificatif.Find(id);
            if (Justificatif != null)
            {
                _context.Justificatif.Remove(Justificatif);
                _context.SaveChanges();
            }
        }

        public int? GetNbJustificatif(int idRequete)
        {
            var result = _context.Set<IntResult>().FromSqlRaw(@"
        select count(idjustif) value from justificatif where idrequete = @p0
    ", idRequete).FirstOrDefault();

            return result?.Value != null ? (int?)result.Value : null;
        }
        /*------------------------------------------------------------------------*/
        public int GetNbJustifsInitieesByUtilisateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(tab.idjustif) value from (select justificatif.*,coalesce(tab.exist,0) exist from justificatif left join (select distinct idJustif exist from historiquevalidationjustificatif) tab on justificatif.idJustif = tab.exist where idUtilisateur = @p0) tab where exist = 0", idUtilisateur).FirstOrDefault();
            int quotient = (int)result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }

        public int GetNombreJustifsInitieesByUtilisateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(tab.idjustif) value from (select justificatif.*,coalesce(tab.exist,0) exist from justificatif left join (select distinct idJustif exist from historiquevalidationjustificatif) tab on justificatif.idJustif = tab.exist where idUtilisateur = @p0) tab where exist = 0", idUtilisateur).FirstOrDefault();
            return (int)result.Value;
           
        }

        public int GetNbJustifsInitieesByUtilisateurByWord(int idUtilisateur,string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idjustif) value from (select tab.*,requete.referenceInterne,requete.objet objetrequete,requete.numactiviteinterne,requete.montantValide,utilisateur.username,agmo.nom nomagmo from \r\n(select justificatif.*,coalesce(tab.exist,0) exist from justificatif \r\nleft join (select distinct idJustif exist from historiquevalidationjustificatif) tab on justificatif.idJustif = tab.exist \r\nwhere idUtilisateur = @p0) tab\r\njoin requete on requete.idrequete = tab.idrequete\r\njoin utilisateur on utilisateur.idUtilisateur = tab.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\n where exist = 0) tab1\r\n where nomagmo LIKE @p1 or username LIKE @p1 or referenceInterne LIKE @p1 or username LIKE @p1 or numero LIKE @p1 or username LIKE @p1 or objetrequete LIKE @p1 or numActiviteInterne LIKE @p1 or montantValide LIKE @p1 or username LIKE @p1 or montant LIKE @p1", idUtilisateur, "%"+word+"%").FirstOrDefault();
            int quotient = (int)result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }


        public List<Justificatif> GetJustifsInitieesByUtilisateur(int idUtilisateur)
        {
            var result = _context.Justificatif.FromSqlRaw("select count(idjustif) value from (select justificatif.*,coalesce(tab.exist,0) exist from justificatif left join (select distinct idJustif exist from historiquevalidationjustificatif) tab on justificatif.idJustif = tab.exist where idUtilisateur = @p0) tab where exist = 0", idUtilisateur).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        public List<Justificatif> GetJustifsInitieesByUtilisateurByPage(int idUtilisateur,int page)
        {
            var result = _context.Justificatif.FromSqlRaw("select * from (select justificatif.*,coalesce(tab.exist,0) exist from justificatif left join (select distinct idJustif exist from historiquevalidationjustificatif) tab on justificatif.idJustif = tab.exist where idUtilisateur = @p0) tab where exist = 0 ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur,page).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        public List<Justificatif> GetJustifsInitieesByUtilisateurByPageAndWord(int idUtilisateur, string word, int page)
        {
            var result = _context.Justificatif.FromSqlRaw("select * from (select tab.*,requete.referenceInterne,requete.objet objetrequete,requete.numactiviteinterne,requete.montantValide,utilisateur.username,agmo.nom nomagmo from \r\n(select justificatif.*,coalesce(tab.exist,0) exist from justificatif \r\nleft join (select distinct idJustif exist from historiquevalidationjustificatif) tab on justificatif.idJustif = tab.exist \r\nwhere idUtilisateur = @p0) tab\r\njoin requete on requete.idrequete = tab.idrequete\r\njoin utilisateur on utilisateur.idUtilisateur = tab.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\n where exist = 0) tab1\r\n where nomagmo LIKE @p1 or username LIKE @p1 or referenceInterne LIKE @p1 or username LIKE @p1 or numero LIKE @p1 or username LIKE @p1 or objetrequete LIKE @p1 or numActiviteInterne LIKE @p1 or montantValide LIKE @p1 or username LIKE @p1 or montant LIKE @p1 ORDER BY idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%"+word+"%", page).Include(r => r.Utilisateur).Include(r => r.Requete).AsNoTracking().ToList();
            return result;
        }
        /*------------------------------------------------------------------------*/

        public int GetNbJustifsEnCoursByUtilisateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(tab.idjustif) value from justificatif join (select distinct idJustif from historiquevalidationjustificatif) tab on justificatif.idJustif = tab.idJustif where idUtilisateur = @p0 and (etatValidation != 2 and etatValidation != 5)", idUtilisateur).FirstOrDefault();
            int quotient = (int)result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }

        public int GetNombreJustifsEnCoursByUtilisateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(tab.idjustif) value from justificatif join (select distinct idJustif from historiquevalidationjustificatif) tab on justificatif.idJustif = tab.idJustif where idUtilisateur = @p0 and (etatValidation != 2 and etatValidation != 5)", idUtilisateur).FirstOrDefault();
            return (int)result.Value;
           
        }

        public int GetNbJustifsEnCoursByUtilisateurAndWord(int idUtilisateur,string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idjustif) value from (select justificatif.*,requete.referenceInterne,requete.objet objetrequete,requete.numactiviteinterne,requete.montantValide,utilisateur.username,agmo.nom nomagmo  from justificatif \r\njoin (select distinct idJustif from historiquevalidationjustificatif) tab on justificatif.idJustif = tab.idJustif \r\njoin requete on requete.idrequete = justificatif.idrequete\r\njoin utilisateur on utilisateur.idUtilisateur = justificatif.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere justificatif.idUtilisateur = @p0 and (justificatif.etatValidation != 2 and justificatif.etatValidation != 5))tab1\r\nwhere nomagmo LIKE @p1 or username LIKE @p1 or referenceInterne LIKE @p1 or username LIKE @p1 or numero LIKE @p1 or username LIKE @p1 or objetrequete LIKE @p1 or numActiviteInterne LIKE @p1 or montantValide LIKE @p1 or username LIKE @p1 or montant LIKE @p1", idUtilisateur, "%"+word+"%").FirstOrDefault();
            int quotient = (int)result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }


        public List<Justificatif> GetJustifsEnCoursByUtilisateur(int idUtilisateur)
        {
            var result = _context.Justificatif.FromSqlRaw("select justificatif.* from justificatif join (select distinct idJustif from historiquevalidationjustificatif) tab on justificatif.idJustif = tab.idJustif where idUtilisateur = @p0 and (etatValidation != 2 and etatValidation != 5)", idUtilisateur).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        public List<Justificatif> GetJustifsEnCoursByUtilisateurByPage(int idUtilisateur,int page)
        {
            var result = _context.Justificatif.FromSqlRaw("select justificatif.* from justificatif join (select distinct idJustif from historiquevalidationjustificatif) tab on justificatif.idJustif = tab.idJustif where idUtilisateur = @p0 and (etatValidation != 2 and etatValidation != 5) ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, page).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        public List<Justificatif> GetJustifsEnCoursByUtilisateurByPageAndWord(int idUtilisateur,string word, int page)
        {
            var result = _context.Justificatif.FromSqlRaw("select * from \r\n(select justificatif.*,requete.referenceInterne,requete.objet objetrequete,requete.numactiviteinterne,requete.montantValide,utilisateur.username,agmo.nom nomagmo  from justificatif \r\njoin (select distinct idJustif from historiquevalidationjustificatif) tab on justificatif.idJustif = tab.idJustif \r\njoin (\t\r\n\tselect distinct idjustif,etape_actuelle from \r\n\t(select *,MAX(rank2) OVER (PARTITION BY idjustif) etape_actuelle from\r\n\t(select idjustif,idcircuitetape,idvalidateur,dense_rank() over (partition by idjustif order by idcircuitetape) as rank2 from \r\n\t(select HistoriqueValidationJustificatif.*, row_number() over (partition by idjustif,idcircuitetape order by etatValidation desc) as rank \r\n\tfrom HistoriqueValidationJustificatif  ) tab2 \r\n\twhere datevalidation is null) tab3) tab4 \r\n\twhere rank2 = etape_actuelle \r\n)tab_util on tab.idjustif = tab_util.idJustif\r\njoin requete on requete.idrequete = justificatif.idrequete\r\njoin utilisateur on utilisateur.idUtilisateur = justificatif.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere justificatif.idUtilisateur = @p0 and (justificatif.etatValidation != 2 and justificatif.etatValidation != 5))tab1\r\nwhere nomagmo LIKE @p1 or username LIKE @p1 or referenceInterne LIKE @p1 or username LIKE @p1 or numero LIKE @p1 or username LIKE @p1 or objetrequete LIKE @p1 or numActiviteInterne LIKE @p1 or montantValide LIKE @p1 or username LIKE @p1 or montant LIKE @p1 ORDER BY etape_actuelle,idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%"+word+"%", page).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        /*-------------------------------------------------------------------------*/

        public int GetNbJustifsValidesByUtilisateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idjustif) value from justificatif  where idUtilisateur = @p0 and etatValidation = 5", idUtilisateur).FirstOrDefault();
            int quotient = (int)result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }


        public int GetNombreJustifsValidesByUtilisateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idjustif) value from justificatif  where idUtilisateur = @p0 and etatValidation = 5", idUtilisateur).FirstOrDefault();
            return (int)result.Value;
            
        }

        public int GetNbJustifsValidesByUtilisateurAndWord(int idUtilisateur,string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idjustif) value from (select justificatif.*,requete.referenceInterne,requete.objet objetrequete,requete.numactiviteinterne,requete.montantValide,utilisateur.username,agmo.nom nomagmo from justificatif  \r\njoin requete on requete.idrequete = justificatif.idrequete\r\njoin utilisateur on utilisateur.idUtilisateur = justificatif.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere justificatif.idUtilisateur = @p0 and justificatif.etatValidation = 5) tab\r\n where nomagmo LIKE @p1 or username LIKE @p1 or referenceInterne LIKE @p1 or username LIKE @p1 or numero LIKE @p1 or username LIKE @p1 or objetrequete LIKE @p1 or numActiviteInterne LIKE @p1 or montantValide LIKE @p1 or username LIKE @p1 or montant LIKE @p1", idUtilisateur, "%"+word+"%").FirstOrDefault();
            int quotient = (int)result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }

        public List<Justificatif> GetJustifsValidesByUtilisateur(int idUtilisateur)
        {
            var result = _context.Justificatif.FromSqlRaw("select * from justificatif  where idUtilisateur = @p0 and etatValidation = 5", idUtilisateur).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        public List<Justificatif> GetJustifsValidesByUtilisateurByPage(int idUtilisateur,int page)
        {
            var result = _context.Justificatif.FromSqlRaw("select * from justificatif  where idUtilisateur = @p0 and etatValidation = 5 ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur,page).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        public List<Justificatif> GetJustifsValidesByUtilisateurByPageAndWord(int idUtilisateur,string word, int page)
        {
            var result = _context.Justificatif.FromSqlRaw("select * from (select justificatif.*,requete.referenceInterne,requete.objet objetrequete,requete.numactiviteinterne,requete.montantValide,utilisateur.username,agmo.nom nomagmo from justificatif  \r\njoin requete on requete.idrequete = justificatif.idrequete\r\njoin utilisateur on utilisateur.idUtilisateur = justificatif.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere justificatif.idUtilisateur = @p0 and justificatif.etatValidation = 5) tab\r\n where nomagmo LIKE @p1 or username LIKE @p1 or referenceInterne LIKE @p1 or username LIKE @p1 or numero LIKE @p1 or username LIKE @p1 or objetrequete LIKE @p1 or numActiviteInterne LIKE @p1 or montantValide LIKE @p1 or username LIKE @p1 or montant LIKE @p1 ORDER BY idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%"+word+"%", page).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }


        /*--------------------------------------------------------------------------*/

        public int GetNbJustifsRefusesByUtilisateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idjustif) value from justificatif  where idUtilisateur = @p0 and etatValidation = 2", idUtilisateur).FirstOrDefault();
            int quotient = (int)result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }

        public int GetNombreJustifsRefusesByUtilisateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idjustif) value from justificatif  where idUtilisateur = @p0 and etatValidation = 2", idUtilisateur).FirstOrDefault();
            return (int)result.Value ;
           
        }

        public int GetNbJustifsRefusesByUtilisateurAndWord(int idUtilisateur,string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idjustif) value from (select justificatif.*,requete.referenceInterne,requete.objet objetrequete,requete.numactiviteinterne,requete.montantValide,utilisateur.username,agmo.nom nomagmo \r\n from justificatif  \r\njoin requete on requete.idrequete = justificatif.idrequete\r\njoin utilisateur on utilisateur.idUtilisateur = justificatif.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere justificatif.idUtilisateur = @p0 and justificatif.etatValidation = 2) tab\r\n where nomagmo LIKE @p1 or username LIKE @p1 or referenceInterne LIKE @p1 or username LIKE @p1 or numero LIKE @p1 or username LIKE @p1 or objetrequete LIKE @p1 or numActiviteInterne LIKE @p1 or montantValide LIKE @p1 or username LIKE @p1 or montant LIKE @p1", idUtilisateur, "%"+word+"%").FirstOrDefault();
            int quotient = (int)result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }

        public List<Justificatif> GetJustifsRefusesByUtilisateur(int idUtilisateur)
        {
            var result = _context.Justificatif.FromSqlRaw("select * from justificatif  where idUtilisateur = @p0 and etatValidation = 2", idUtilisateur).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        public List<Justificatif> GetJustifsRefusesByUtilisateurByPage(int idUtilisateur,int page)
        {
            var result = _context.Justificatif.FromSqlRaw("select * from justificatif  where idUtilisateur = @p0 and etatValidation = 2 ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur,page).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        public List<Justificatif> GetJustifsRefusesByUtilisateurByPageAndWord(int idUtilisateur,string word, int page)
        {
            var result = _context.Justificatif.FromSqlRaw("select * from (select justificatif.*,requete.referenceInterne,requete.objet objetrequete,requete.numactiviteinterne,requete.montantValide,utilisateur.username,agmo.nom nomagmo \r\n from justificatif  \r\njoin requete on requete.idrequete = justificatif.idrequete\r\njoin utilisateur on utilisateur.idUtilisateur = justificatif.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere justificatif.idUtilisateur = @p0 and justificatif.etatValidation = 2) tab\r\n where nomagmo LIKE @p1 or username LIKE @p1 or referenceInterne LIKE @p1 or username LIKE @p1 or numero LIKE @p1 or username LIKE @p1 or objetrequete LIKE @p1 or numActiviteInterne LIKE @p1 or montantValide LIKE @p1 or username LIKE @p1 or montant LIKE @p1 ORDER BY idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%"+word+"%", page).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }
        /*--------------------------------------------------------------------------*/

        public int GetNbJustifsAmettreCircuit(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(tab4.idjustif) value from \r\n(select tab3.* from\r\n(select tab1.*, requete.idprojet, requete.idsite from\r\n(select * from (select justificatif.*,coalesce(tab.exist,0) exist from justificatif \r\nleft join (select  idJustif exist from circuitjustificatif) tab on justificatif.idJustif = tab.exist ) tab where exist = 0) tab1\r\njoin requete on tab1.idRequete = requete.idRequete) tab3\r\njoin utilisateursite on utilisateursite.idsite = tab3.idsite where utilisateursite.idutilisateur = @p0 ) tab4\r\njoin utilisateurprojet on utilisateurprojet.idprojet = tab4.idprojet where utilisateurprojet.idutilisateur = @p0", idUtilisateur).FirstOrDefault();
            int quotient = (int)result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }

        public int GetNombreJustifsAmettreCircuit(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(tab4.idjustif) value from \r\n(select tab3.* from\r\n(select tab1.*, requete.idprojet, requete.idsite from\r\n(select * from (select justificatif.*,coalesce(tab.exist,0) exist from justificatif \r\nleft join (select  idJustif exist from circuitjustificatif) tab on justificatif.idJustif = tab.exist ) tab where exist = 0) tab1\r\njoin requete on tab1.idRequete = requete.idRequete) tab3\r\njoin utilisateursite on utilisateursite.idsite = tab3.idsite where utilisateursite.idutilisateur = @p0 ) tab4\r\njoin utilisateurprojet on utilisateurprojet.idprojet = tab4.idprojet where utilisateurprojet.idutilisateur = @p0", idUtilisateur).FirstOrDefault();
            return (int)result.Value ;
           
        }


        public int GetNbJustifsAmettreCircuitByWord(int idUtilisateur,string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idjustif) value from (select tab4.*,requete.referenceInterne,requete.objet objetrequete,requete.numactiviteinterne,requete.montantValide montantValideRequete,utilisateur.username,agmo.nom nomagmo from \r\n(select tab3.* from\r\n(select tab1.*, requete.idprojet, requete.idsite from\r\n(select * from (select justificatif.*,coalesce(tab.exist,0) exist from justificatif \r\nleft join (select  idJustif exist from circuitjustificatif) tab on justificatif.idJustif = tab.exist ) tab where exist = 0) tab1\r\njoin requete on tab1.idRequete = requete.idRequete) tab3\r\njoin utilisateursite on utilisateursite.idsite = tab3.idsite where utilisateursite.idutilisateur = @p0 ) tab4\r\njoin utilisateurprojet on utilisateurprojet.idprojet = tab4.idprojet \r\njoin requete on requete.idrequete = tab4.idrequete\r\njoin utilisateur on utilisateur.idUtilisateur = tab4.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere utilisateurprojet.idutilisateur = @p0) tab5\r\nwhere nomagmo LIKE @p1 or username LIKE @p1 or referenceInterne LIKE @p1 or username LIKE @p1 or numero LIKE @p1 or username LIKE @p1 or objetrequete LIKE @p1 or numActiviteInterne LIKE @p1 or montantValideRequete LIKE @p1 or username LIKE @p1 or montant LIKE @p1", idUtilisateur, "%"+word+"%").FirstOrDefault();
            int quotient = (int)result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }

        public List<Justificatif> GetJustifsAmettreCircuit(int idUtilisateur)
        {
            var result = _context.Justificatif.FromSqlRaw("select tab4.* from \r\n(select tab3.* from\r\n(select tab1.*, requete.idprojet, requete.idsite from\r\n(select * from (select justificatif.*,coalesce(tab.exist,0) exist from justificatif \r\nleft join (select  idJustif exist from circuitjustificatif) tab on justificatif.idJustif = tab.exist ) tab where exist = 0) tab1\r\njoin requete on tab1.idRequete = requete.idRequete) tab3\r\njoin utilisateursite on utilisateursite.idsite = tab3.idsite where utilisateursite.idutilisateur = @p0 ) tab4\r\njoin utilisateurprojet on utilisateurprojet.idprojet = tab4.idprojet where utilisateurprojet.idutilisateur = @p0", idUtilisateur).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        public List<Justificatif> GetJustifsAmettreCircuitByPage(int idUtilisateur,int page)
        {
            var result = _context.Justificatif.FromSqlRaw("select tab4.* from \r\n(select tab3.* from\r\n(select tab1.*, requete.idprojet, requete.idsite from\r\n(select * from (select justificatif.*,coalesce(tab.exist,0) exist from justificatif \r\nleft join (select  idJustif exist from circuitjustificatif) tab on justificatif.idJustif = tab.exist ) tab where exist = 0) tab1\r\njoin requete on tab1.idRequete = requete.idRequete) tab3\r\njoin utilisateursite on utilisateursite.idsite = tab3.idsite where utilisateursite.idutilisateur = @p0 ) tab4\r\njoin utilisateurprojet on utilisateurprojet.idprojet = tab4.idprojet where utilisateurprojet.idutilisateur = @p0 ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur,page).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        public List<Justificatif> GetJustifsAmettreCircuitByPageAndWord(int idUtilisateur,string word, int page)
        {
            var result = _context.Justificatif.FromSqlRaw("select * from (select tab4.*,requete.referenceInterne,requete.objet objetrequete,requete.numactiviteinterne,requete.montantValide montantValideRequete,utilisateur.username,agmo.nom nomagmo from \r\n(select tab3.* from\r\n(select tab1.*, requete.idprojet, requete.idsite from\r\n(select * from (select justificatif.*,coalesce(tab.exist,0) exist from justificatif \r\nleft join (select  idJustif exist from circuitjustificatif) tab on justificatif.idJustif = tab.exist ) tab where exist = 0) tab1\r\njoin requete on tab1.idRequete = requete.idRequete) tab3\r\njoin utilisateursite on utilisateursite.idsite = tab3.idsite where utilisateursite.idutilisateur = @p0 ) tab4\r\njoin utilisateurprojet on utilisateurprojet.idprojet = tab4.idprojet \r\njoin requete on requete.idrequete = tab4.idrequete\r\njoin utilisateur on utilisateur.idUtilisateur = tab4.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere utilisateurprojet.idutilisateur = @p0) tab5\r\nwhere nomagmo LIKE @p1 or username LIKE @p1 or referenceInterne LIKE @p1 or username LIKE @p1 or numero LIKE @p1 or username LIKE @p1 or objetrequete LIKE @p1 or numActiviteInterne LIKE @p1 or montantValideRequete LIKE @p1 or username LIKE @p1 or montant LIKE @p1 ORDER BY idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%"+word+"%", page).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }
        /*--------------------------------------------------------------------------*/
        public int GetNbJustifsAvalider(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(justificatif.idjustif) value from\r\n( select * from (select *,MAX(rank2) OVER (PARTITION BY idjustif) etape_actuelle from\r\n(select idjustif,idcircuitetape,idvalidateur,dense_rank() over (partition by idjustif order by idcircuitetape) as rank2 from \r\n(select historiquevalidationjustificatif.*, row_number() over (partition by idjustif,idcircuitetape order by etatValidation desc) as rank from historiquevalidationjustificatif  ) tab2\r\nwhere isPotential = 1 and dateValidation is null) tab3) tab4 where rank2 = etape_actuelle and tab4.idvalidateur = @p0 ) tab5\r\njoin justificatif on tab5.idjustif = justificatif.idjustif where justificatif.etatValidation != 2 and justificatif.etatValidation != 5 and justificatif.manquePj != 1", idUtilisateur).FirstOrDefault();
            int quotient = (int)result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }

        public int GetNombreJustifsAvalider(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(justificatif.idjustif) value from\r\n( select * from (select *,MAX(rank2) OVER (PARTITION BY idjustif) etape_actuelle from\r\n(select idjustif,idcircuitetape,idvalidateur,dense_rank() over (partition by idjustif order by idcircuitetape) as rank2 from \r\n(select historiquevalidationjustificatif.*, row_number() over (partition by idjustif,idcircuitetape order by etatValidation desc) as rank from historiquevalidationjustificatif  ) tab2\r\nwhere isPotential = 1 and dateValidation is null) tab3) tab4 where rank2 = etape_actuelle and tab4.idvalidateur = @p0 ) tab5\r\njoin justificatif on tab5.idjustif = justificatif.idjustif where justificatif.etatValidation != 2 and justificatif.etatValidation != 5 and justificatif.manquePj != 1", idUtilisateur).FirstOrDefault();
            return (int)result.Value ;
            
        }

        public int GetNbJustifsAvaliderByWord(int idUtilisateur,string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idjustif) value from (select justificatif.*,requete.referenceInterne,requete.objet objetrequete,requete.numactiviteinterne,requete.montantValide montantValideRequete,utilisateur.username,agmo.nom nomagmo \r\n from\r\n( select * from (select *,MAX(rank2) OVER (PARTITION BY idjustif) etape_actuelle from\r\n(select idjustif,idcircuitetape,idvalidateur,dense_rank() over (partition by idjustif order by idcircuitetape) as rank2 from \r\n(select historiquevalidationjustificatif.*, row_number() over (partition by idjustif,idcircuitetape order by etatValidation desc) as rank from historiquevalidationjustificatif  ) tab2\r\nwhere isPotential = 1 and dateValidation is null) tab3) tab4 where rank2 = etape_actuelle and tab4.idvalidateur = @p0 ) tab5\r\njoin justificatif on tab5.idjustif = justificatif.idjustif \r\njoin requete on requete.idrequete = justificatif.idrequete\r\njoin utilisateur on utilisateur.idUtilisateur = justificatif.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere justificatif.etatValidation != 2 and justificatif.etatValidation != 5 and justificatif.manquePj != 1) tab6\r\nwhere nomagmo LIKE @p1 or username LIKE @p1 or referenceInterne LIKE @p1 or username LIKE @p1 or numero LIKE @p1 or username LIKE @p1 or objetrequete LIKE @p1 or numActiviteInterne LIKE @p1 or montantValideRequete LIKE @p1 or username LIKE @p1 or montant LIKE @p1", idUtilisateur, "%"+word+"%").FirstOrDefault();
            int quotient = (int)result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }

        public List<Justificatif> GetJustifsAvalider(int idUtilisateur)
        {
            var result = _context.Justificatif.FromSqlRaw("select justificatif.* from\r\n( select * from (select *,MAX(rank2) OVER (PARTITION BY idjustif) etape_actuelle from\r\n(select idjustif,idcircuitetape,idvalidateur,dense_rank() over (partition by idjustif order by idcircuitetape) as rank2 from \r\n(select historiquevalidationjustificatif.*, row_number() over (partition by idjustif,idcircuitetape order by etatValidation desc) as rank from historiquevalidationjustificatif  ) tab2\r\nwhere isPotential = 1 and dateValidation is null) tab3) tab4 where rank2 = etape_actuelle and tab4.idvalidateur = @p0 ) tab5\r\njoin justificatif on tab5.idjustif = justificatif.idjustif where justificatif.etatValidation != 2 and justificatif.etatValidation != 5 and justificatif.manquePj != 1", idUtilisateur).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            
            return result;
        }

        public List<Justificatif> GetJustifsAvaliderByPage(int idUtilisateur,int page)
        {
            var result = _context.Justificatif.FromSqlRaw("select justificatif.* from\r\n( select * from (select *,MAX(rank2) OVER (PARTITION BY idjustif) etape_actuelle from\r\n(select idjustif,idcircuitetape,idvalidateur,dense_rank() over (partition by idjustif order by idcircuitetape) as rank2 from \r\n(select historiquevalidationjustificatif.*, row_number() over (partition by idjustif,idcircuitetape order by etatValidation desc) as rank from historiquevalidationjustificatif  ) tab2\r\nwhere isPotential = 1 and dateValidation is null) tab3) tab4 where rank2 = etape_actuelle and tab4.idvalidateur = @p0 ) tab5\r\njoin justificatif on tab5.idjustif = justificatif.idjustif where justificatif.etatValidation != 2 and justificatif.etatValidation != 5 and justificatif.manquePj != 1 ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur,page).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();

            return result;
        }

        public List<Justificatif> GetJustifsAvaliderByPageAndWord(int idUtilisateur,string word, int page)
        {
            var result = _context.Justificatif.FromSqlRaw("select * from \r\n(select justificatif.*,requete.referenceInterne,requete.objet objetrequete,requete.numactiviteinterne,requete.montantValide montantValideRequete,utilisateur.username,agmo.nom nomagmo,etape_actuelle\r\nfrom\r\n( select * from \r\n(select *,MAX(rank2) OVER (PARTITION BY idjustif) etape_actuelle from\r\n(select idjustif,idcircuitetape,idvalidateur,dense_rank() over (partition by idjustif order by idcircuitetape) as rank2 from \r\n(select historiquevalidationjustificatif.*, row_number() over (partition by idjustif,idcircuitetape order by etatValidation desc) as rank from historiquevalidationjustificatif  ) tab2\r\nwhere isPotential = 1 and dateValidation is null) tab3) tab4 where rank2 = etape_actuelle and tab4.idvalidateur = @p0) tab5\r\njoin justificatif on tab5.idjustif = justificatif.idjustif \r\njoin requete on requete.idrequete = justificatif.idrequete\r\njoin utilisateur on utilisateur.idUtilisateur = justificatif.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere justificatif.etatValidation != 2 and justificatif.etatValidation != 5 and justificatif.manquePj != 1) tab6\r\nwhere nomagmo LIKE @p1 or username LIKE @p1 or referenceInterne LIKE @p1 or username LIKE @p1 or numero LIKE @p1 or username LIKE @p1 or objetrequete LIKE @p1 or numActiviteInterne LIKE @p1 or montantValideRequete LIKE @p1 or username LIKE @p1 or montant LIKE @p1 ORDER BY etape_actuelle,idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%"+word+"%", page).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();

            return result;
        }
        /*--------------------------------------------------------------------------*/

        public int GetNbJustifsEnCoursValidateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(justificatif.idjustif) value from\r\n(select tab.* from\r\n(select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif\r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif and justificatif.EtatValidation != 5 and justificatif.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin justificatif on justificatif.idJustif = tab3.idJustif", idUtilisateur).FirstOrDefault();
            int quotient = (int)result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }

        public int GetNombreJustifsEnCoursValidateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(justificatif.idjustif) value from\r\n(select tab.* from\r\n(select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif\r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif and justificatif.EtatValidation != 5 and justificatif.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin justificatif on justificatif.idJustif = tab3.idJustif", idUtilisateur).FirstOrDefault();
            return (int)result.Value;
           
        }

        public int GetNbJustifsEnCoursValidateurByWord(int idUtilisateur,string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idjustif) value from (select justificatif.*,requete.referenceInterne,requete.objet objetrequete,requete.numactiviteinterne,requete.montantValide montantValideRequete,utilisateur.username,agmo.nom nomagmo \r\n from\r\n(select tab.* from\r\n(select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif\r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif and justificatif.EtatValidation != 5 and justificatif.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin justificatif on justificatif.idJustif = tab3.idJustif\r\njoin requete on requete.idrequete = justificatif.idrequete\r\njoin utilisateur on utilisateur.idUtilisateur = justificatif.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) tab4\r\nwhere nomagmo LIKE @p1 or username LIKE @p1 or referenceInterne LIKE @p1 or username LIKE @p1 or numero LIKE @p1 or username LIKE @p1 or objetrequete LIKE @p1 or numActiviteInterne LIKE @p1 or montantValideRequete LIKE @p1 or username LIKE @p1 or montant LIKE @p1", idUtilisateur, "%"+word+"%").FirstOrDefault();
            int quotient = (int)result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }

        public List<Justificatif> GetJustifsEnCoursValidateur(int idUtilisateur)
        {
            var result = _context.Justificatif.FromSqlRaw("select justificatif.* from\r\n(select tab.* from\r\n(select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif\r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif and justificatif.EtatValidation != 5 and justificatif.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin justificatif on justificatif.idJustif = tab3.idJustif", idUtilisateur).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        public List<Justificatif> GetJustifsEnCoursValidateurByPage(int idUtilisateur,int page)
        {
            var result = _context.Justificatif.FromSqlRaw("select justificatif.* from\r\n(select tab.* from\r\n(select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif\r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif and justificatif.EtatValidation != 5 and justificatif.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin justificatif on justificatif.idJustif = tab3.idJustif ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur,page).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        public List<Justificatif> GetJustifsEnCoursValidateurByPageAndWord(int idUtilisateur,string word, int page)
        {
            var result = _context.Justificatif.FromSqlRaw("select * from \r\n(select justificatif.*,requete.referenceInterne,requete.objet objetrequete,requete.numactiviteinterne,requete.montantValide montantValideRequete,utilisateur.username,agmo.nom nomagmo,tab_util.etape_actuelle \r\nfrom\r\n(select tab.* from\r\n(select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif\r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif and justificatif.EtatValidation != 5 and justificatif.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin justificatif on justificatif.idJustif = tab3.idJustif\r\njoin (\t\r\n\tselect distinct idjustif,etape_actuelle from \r\n\t(select *,MAX(rank2) OVER (PARTITION BY idjustif) etape_actuelle from\r\n\t(select idjustif,idcircuitetape,idvalidateur,dense_rank() over (partition by idjustif order by idcircuitetape) as rank2 from \r\n\t(select HistoriqueValidationJustificatif.*, row_number() over (partition by idjustif,idcircuitetape order by etatValidation desc) as rank \r\n\tfrom HistoriqueValidationJustificatif  ) tab2 \r\n\twhere datevalidation is null) tab3) tab4 \r\n\twhere rank2 = etape_actuelle and idValidateur = @p0\r\n)tab_util on justificatif.idjustif = tab_util.idJustif\r\njoin requete on requete.idrequete = justificatif.idrequete\r\njoin utilisateur on utilisateur.idUtilisateur = justificatif.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) tab4\r\nwhere nomagmo LIKE @p1 or username LIKE @p1 or referenceInterne LIKE @p1 or username LIKE @p1 or numero LIKE @p1 or username LIKE @p1 or objetrequete LIKE @p1 or numActiviteInterne LIKE @p1 or montantValideRequete LIKE @p1 or username LIKE @p1 or montant LIKE @p1 ORDER BY etape_actuelle,idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%"+word+"%", page).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }
        /*---------------------------------------------------------------------------*/

        public int GetNbJustifsEnCoursAdmin(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(justificatif.idjustif) value from justificatif\r\njoin CircuitJustificatif on CircuitJustificatif.idJustif = justificatif.idJustif\r\njoin requete on requete.idRequete = justificatif.idRequete\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\nwhere justificatif.etatValidation != 2 and justificatif.etatValidation != 5", idUtilisateur).FirstOrDefault();
            int quotient = (int)result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }

        public int GetNombreJustifsEnCoursAdmin(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(justificatif.idjustif) value from justificatif\r\njoin CircuitJustificatif on CircuitJustificatif.idJustif = justificatif.idJustif\r\njoin requete on requete.idRequete = justificatif.idRequete\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\nwhere justificatif.etatValidation != 2 and justificatif.etatValidation != 5", idUtilisateur).FirstOrDefault();
            return (int)result.Value;

        }

        public int GetNbJustifsEnCoursAdminByWord(int idUtilisateur, string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idjustif) value from (select justificatif.*,requete.referenceInterne,requete.objet objetrequete,requete.numactiviteinterne,requete.montantValide montantValideRequete,utilisateur.username,agmo.nom nomagmo \r\nfrom\r\njustificatif\r\njoin CircuitJustificatif on CircuitJustificatif.idJustif = justificatif.idJustif\r\njoin requete on requete.idRequete = justificatif.idRequete\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\njoin utilisateur on utilisateur.idUtilisateur = justificatif.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere justificatif.etatValidation != 2 and justificatif.etatValidation != 5) tab\r\nwhere nomagmo LIKE @p1 or username LIKE @p1 or referenceInterne LIKE @p1 or username LIKE @p1 or numero LIKE @p1 or username LIKE @p1 or objetrequete LIKE @p1 or numActiviteInterne LIKE @p1 or montantValideRequete LIKE @p1 or username LIKE @p1 or montant LIKE @p1", idUtilisateur, "%" + word + "%").FirstOrDefault();
            int quotient = (int)result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }

        public List<Justificatif> GetJustifsEnCoursAdmin(int idUtilisateur)
        {
            var result = _context.Justificatif.FromSqlRaw("select * from justificatif\r\njoin CircuitJustificatif on CircuitJustificatif.idJustif = justificatif.idJustif\r\njoin requete on requete.idRequete = justificatif.idRequete\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\nwhere justificatif.etatValidation != 2 and justificatif.etatValidation != 5", idUtilisateur).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        public List<Justificatif> GetJustifsEnCoursAdminByPage(int idUtilisateur, int page)
        {
            var result = _context.Justificatif.FromSqlRaw("select justificatif.* from justificatif\r\njoin CircuitJustificatif on CircuitJustificatif.idJustif = justificatif.idJustif\r\njoin requete on requete.idRequete = justificatif.idRequete\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\nwhere justificatif.etatValidation != 2 and justificatif.etatValidation != 5 ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, page).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        public List<Justificatif> GetJustifsEnCoursAdminByPageAndWord(int idUtilisateur, string word, int page)
        {
            var result = _context.Justificatif.FromSqlRaw("select * from \r\n(select justificatif.*,requete.referenceInterne,requete.objet objetrequete,requete.numactiviteinterne,requete.montantValide montantValideRequete,utilisateur.username,agmo.nom nomagmo,tab_util.etape_actuelle \r\nfrom\r\n(select tab.* from\r\n(select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif\r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif and justificatif.EtatValidation != 5 and justificatif.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape ) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin justificatif on justificatif.idJustif = tab3.idJustif\r\njoin (select distinct idjustif,etape_actuelle from (select *,MAX(rank2) OVER (PARTITION BY idjustif) etape_actuelle from\r\n(select idjustif,idcircuitetape,idvalidateur,dense_rank() over (partition by idjustif order by idcircuitetape) as rank2 from \r\n(select HistoriqueValidationJustificatif.*, row_number() over (partition by idjustif,idcircuitetape order by etatValidation desc) as rank \r\nfrom HistoriqueValidationJustificatif  ) tab2 \r\nwhere datevalidation is null) tab3) tab4 \r\nwhere rank2 = etape_actuelle \r\n)tab_util on justificatif.idjustif = tab_util.idJustif\r\njoin requete on requete.idrequete = justificatif.idrequete\r\njoin utilisateur on utilisateur.idUtilisateur = justificatif.idutilisateur\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurprojet.idUtilisateur = @p0\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) tab4\r\nwhere nomagmo LIKE @p1 or username LIKE @p1 or referenceInterne LIKE @p1 or username LIKE @p1 or numero LIKE @p1 or username LIKE @p1 or objetrequete LIKE @p1 or numActiviteInterne LIKE @p1 or montantValideRequete LIKE @p1 or username LIKE @p1 or montant LIKE @p1 ORDER BY etape_actuelle,idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%" + word + "%", page).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        /*---------------------------------------------------------------------------*/

        public int GetNbJustifsValidesValidateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(justificatif.idjustif) value from\r\n(select tab.* from\r\n(select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif\r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif  and justificatif.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin justificatif on justificatif.idJustif = tab3.idJustif", idUtilisateur).FirstOrDefault();
            int quotient = (int)result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }

        public int GetNombreJustifsValidesValidateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(justificatif.idjustif) value from\r\n(select tab.* from\r\n(select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif\r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif  and justificatif.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin justificatif on justificatif.idJustif = tab3.idJustif", idUtilisateur).FirstOrDefault();
            return (int)result.Value;
           
        }


        public int GetNbJustifsValidesValidateurByWord(int idUtilisateur,string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idjustif) value from (select justificatif.*,requete.referenceInterne,requete.objet objetrequete,requete.numactiviteinterne,requete.montantValide,utilisateur.username,agmo.nom nomagmo \r\n from\r\n(select tab.* from\r\n(select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif\r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif  and justificatif.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin justificatif on justificatif.idJustif = tab3.idJustif\r\njoin requete on requete.idrequete = justificatif.idrequete\r\njoin utilisateur on utilisateur.idUtilisateur = justificatif.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) tab4\r\nwhere nomagmo LIKE @p1 or username LIKE @p1 or referenceInterne LIKE @p1 or username LIKE @p1 or numero LIKE @p1 or username LIKE @p1 or objetrequete LIKE @p1 or numActiviteInterne LIKE @p1 or montantValide LIKE @p1 or username LIKE @p1 or montant LIKE @p1", idUtilisateur, "%"+word+"%").FirstOrDefault();
            int quotient = (int)result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }

        public List<Justificatif> GetJustifsValidesValidateur(int idUtilisateur)
        {
            var result = _context.Justificatif.FromSqlRaw("select justificatif.* from\r\n(select tab.* from\r\n(select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif\r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif  and justificatif.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin justificatif on justificatif.idJustif = tab3.idJustif", idUtilisateur).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        public List<Justificatif> GetJustifsValidesValidateurByPage(int idUtilisateur, int page)
        {
            var result = _context.Justificatif.FromSqlRaw("select justificatif.* from\r\n(select tab.* from\r\n(select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif\r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif  and justificatif.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin justificatif on justificatif.idJustif = tab3.idJustif ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, page).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        public List<Justificatif> GetJustifsValidesValidateurByPageAndWord(int idUtilisateur,string word, int page)
        {
            var result = _context.Justificatif.FromSqlRaw("select * from (select justificatif.*,requete.referenceInterne,requete.objet objetrequete,requete.numactiviteinterne,requete.montantValide,utilisateur.username,agmo.nom nomagmo \r\n from\r\n(select tab.* from\r\n(select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif\r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif  and justificatif.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin justificatif on justificatif.idJustif = tab3.idJustif\r\njoin requete on requete.idrequete = justificatif.idrequete\r\njoin utilisateur on utilisateur.idUtilisateur = justificatif.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) tab4\r\nwhere nomagmo LIKE @p1 or username LIKE @p1 or referenceInterne LIKE @p1 or username LIKE @p1 or numero LIKE @p1 or username LIKE @p1 or objetrequete LIKE @p1 or numActiviteInterne LIKE @p1 or montantValide LIKE @p1 or username LIKE @p1 or montant LIKE @p1 ORDER BY idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%"+word+"%", page).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }
        /*---------------------------------------------------------------------------*/

        public int GetNbJustifsAreviser(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idjustif) value from justificatif where manquePj = 1 and idutilisateur = @p0 ", idUtilisateur).FirstOrDefault();
            int quotient = (int)result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }

        public int GetNombreJustifsAreviser(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(justificatif.idjustif) value from justificatif where manquePj = 1 and idutilisateur = @p0", idUtilisateur).FirstOrDefault();
            return (int)result.Value;

        }

        public int GetNbJustifsAreviserByWord(int idUtilisateur, string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idjustif) value from (select justificatif.*,requete.referenceInterne,requete.objet objetrequete,requete.numactiviteinterne,requete.montantValide,utilisateur.username,agmo.nom nomagmo \r\n from justificatif  \r\njoin requete on requete.idrequete = justificatif.idrequete\r\njoin utilisateur on utilisateur.idUtilisateur = justificatif.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere justificatif.idUtilisateur = @p0 and justificatif.manquePj = 1) tab\r\n where (nomagmo LIKE @p1 or username LIKE @p1 or referenceInterne LIKE @p1 or username LIKE @p1 or numero LIKE @p1 or username LIKE @p1 or objetrequete LIKE @p1 or numActiviteInterne LIKE @p1 or montantValide LIKE @p1 or username LIKE @p1 or montant LIKE @p1) ORDER BY idRequete ", idUtilisateur, "%" + word + "%").FirstOrDefault();
            int quotient = (int)result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }



        public void UpdateManquePj(int idJustif, Boolean value)
        {
            _context.Database.ExecuteSqlRaw("update justificatif set manquePj = @p0 where idJustif = @p1", value, idJustif);

        }

        public List<Justificatif> GetJustifsAreviser(int idUtilisateur)
        {
            var result = _context.Justificatif.FromSqlRaw("select count(justificatif.idjustif) value from justificatif where manquePj = 1 and idutilisateur = @p0", idUtilisateur).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        public List<Justificatif> GetJustifsAreviserByPage(int idUtilisateur, int page)
        {
            var result = _context.Justificatif.FromSqlRaw("select justificatif.* from justificatif where idutilisateur = @p0 and manquePj = 1 ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, page).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        public List<Justificatif> GetJustifsAreviserByPageAndWord(int idUtilisateur, string word, int page)
        {
            var result = _context.Justificatif.FromSqlRaw("select count(idjustif) value from (select justificatif.*,requete.referenceInterne,requete.objet objetrequete,requete.numactiviteinterne,requete.montantValide,utilisateur.username,agmo.nom nomagmo \r\n from justificatif  \r\njoin requete on requete.idrequete = justificatif.idrequete\r\njoin utilisateur on utilisateur.idUtilisateur = justificatif.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere justificatif.idUtilisateur = @p0 and justificatif.manquePj = 1) tab\r\n where (nomagmo LIKE @p1 or username LIKE @p1 or referenceInterne LIKE @p1 or username LIKE @p1 or numero LIKE @p1 or username LIKE @p1 or objetrequete LIKE @p1 or numActiviteInterne LIKE @p1 or montantValide LIKE @p1 or username LIKE @p1 or montant LIKE @p1) ORDER BY idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%" + word + "%", page).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }




        /*---------------------------------------------------------------------------*/
        public int GetNbJustifsRefuseesValidateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(justificatif.idjustif) value from\r\n(select tab.* from\r\n(select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif\r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif and justificatif.EtatValidation = 2 ) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin justificatif on justificatif.idJustif = tab3.idJustif", idUtilisateur).FirstOrDefault();
            int quotient = (int)result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }

        public int GetNombreJustifsRefuseesValidateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(justificatif.idjustif) value from\r\n(select tab.* from\r\n(select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif\r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif and justificatif.EtatValidation = 2 ) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin justificatif on justificatif.idJustif = tab3.idJustif", idUtilisateur).FirstOrDefault();
            return (int)result.Value;
           
        }

        public int GetNbJustifsRefuseesValidateurByWord(int idUtilisateur,string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idjustif) value from (select justificatif.*,requete.referenceInterne,requete.objet objetrequete,requete.numactiviteinterne,requete.montantValide montantValideRequete,utilisateur.username,agmo.nom nomagmo \r\n from\r\n(select tab.* from\r\n(select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif\r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif and justificatif.EtatValidation = 2 ) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin justificatif on justificatif.idJustif = tab3.idJustif\r\njoin requete on requete.idrequete = justificatif.idrequete\r\njoin utilisateur on utilisateur.idUtilisateur = justificatif.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) tab4\r\n where nomagmo LIKE @p1 or username LIKE @p1 or referenceInterne LIKE @p1 or username LIKE @p1 or numero LIKE @p1 or username LIKE @p1 or objetrequete LIKE @p1 or numActiviteInterne LIKE @p1 or montantValideRequete LIKE @p1 or username LIKE @p1 or montant LIKE @p1", idUtilisateur, "%"+word+"%").FirstOrDefault();
            int quotient = (int)result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }


        public List<Justificatif> GetJustifsRefuseesValidateur(int idUtilisateur)
        {
            var result = _context.Justificatif.FromSqlRaw("select justificatif.* from\r\n(select tab.* from\r\n(select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif\r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif and justificatif.EtatValidation = 2 ) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin justificatif on justificatif.idJustif = tab3.idJustif", idUtilisateur).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        public List<Justificatif> GetJustifsRefuseesValidateurByPage(int idUtilisateur,int page)
        {
            var result = _context.Justificatif.FromSqlRaw("select justificatif.* from\r\n(select tab.* from\r\n(select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif\r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif and justificatif.EtatValidation = 2 ) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin justificatif on justificatif.idJustif = tab3.idJustif ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur,page).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        public List<Justificatif> GetJustifsRefuseesValidateurByPageAndWord(int idUtilisateur,string word, int page)
        {
            var result = _context.Justificatif.FromSqlRaw("select * from (select justificatif.*,requete.referenceInterne,requete.objet objetrequete,requete.numactiviteinterne,requete.montantValide montantValideRequete,utilisateur.username,agmo.nom nomagmo \r\n from\r\n(select tab.* from\r\n(select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif\r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif and justificatif.EtatValidation = 2 ) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin justificatif on justificatif.idJustif = tab3.idJustif\r\njoin requete on requete.idrequete = justificatif.idrequete\r\njoin utilisateur on utilisateur.idUtilisateur = justificatif.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) tab4\r\n where nomagmo LIKE @p1 or username LIKE @p1 or referenceInterne LIKE @p1 or username LIKE @p1 or numero LIKE @p1 or username LIKE @p1 or objetrequete LIKE @p1 or numActiviteInterne LIKE @p1 or montantValideRequete LIKE @p1 or username LIKE @p1 or montant LIKE @p1 ORDER BY idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%"+word+"%", page).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        /*---------------------------*/

        public int GetNbJustifsRefuseesAdmin(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idjustif) value from justificatif \r\njoin requete on requete.idrequete = justificatif.idRequete\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idprojet and utilisateurProjet.idUtilisateur = @p0\r\nwhere justificatif.etatvalidation = 2", idUtilisateur).FirstOrDefault();
            int quotient = (int)result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }

        public int GetNombreJustifsRefuseesAdmin(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idjustif) value from justificatif \r\njoin requete on requete.idrequete = justificatif.idRequete\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idprojet and utilisateurProjet.idUtilisateur = @p0\r\nwhere justificatif.etatvalidation = 2", idUtilisateur).FirstOrDefault();
            return (int)result.Value;

        }

        public int GetNbJustifsRefuseesAdminByWord(int idUtilisateur, string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idjustif) value from (select justificatif.*,requete.referenceInterne,requete.objet objetrequete,requete.numactiviteinterne,requete.montantValide montantValideRequete,utilisateur.username,agmo.nom nomagmo \r\nfrom\r\njustificatif \r\njoin requete on requete.idrequete = justificatif.idRequete\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idprojet and utilisateurProjet.idUtilisateur = @p0\r\njoin utilisateur on utilisateur.idUtilisateur = justificatif.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere justificatif.etatvalidation = 2) tab4\r\nwhere nomagmo LIKE @p1 or username LIKE @p1 or referenceInterne LIKE @p1 or username LIKE @p1 or numero LIKE @p1 or username LIKE @p1 or objetrequete LIKE @p1 or numActiviteInterne LIKE @p1 or montantValideRequete LIKE @p1 or username LIKE @p1 or montant LIKE @p1", idUtilisateur, "%" + word + "%").FirstOrDefault();
            int quotient = (int)result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        }


        public List<Justificatif> GetJustifsRefuseesAdmin(int idUtilisateur)
        {
            var result = _context.Justificatif.FromSqlRaw("select justificatif.* from justificatif \r\njoin requete on requete.idrequete = justificatif.idRequete\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idprojet and utilisateurProjet.idUtilisateur = @p0\r\nwhere justificatif.etatvalidation = 2", idUtilisateur).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        public List<Justificatif> GetJustifsRefuseesAdminByPage(int idUtilisateur, int page)
        {
            var result = _context.Justificatif.FromSqlRaw("select justificatif.* from justificatif \r\njoin requete on requete.idrequete = justificatif.idRequete\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idprojet and utilisateurProjet.idUtilisateur = @p0\r\nwhere justificatif.etatvalidation = 2 ORDER BY idJustif OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, page).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

        public List<Justificatif> GetJustifsRefuseesAdminByPageAndWord(int idUtilisateur, string word, int page)
        {
            var result = _context.Justificatif.FromSqlRaw("select * from (select justificatif.*,requete.referenceInterne,requete.objet objetrequete,requete.numactiviteinterne,requete.montantValide montantValideRequete,utilisateur.username,agmo.nom nomagmo \r\nfrom\r\njustificatif \r\njoin requete on requete.idrequete = justificatif.idRequete\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idprojet and utilisateurProjet.idUtilisateur = @p0\r\njoin utilisateur on utilisateur.idUtilisateur = justificatif.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere justificatif.etatvalidation = 2) tab4\r\nwhere nomagmo LIKE @p1 or username LIKE @p1 or referenceInterne LIKE @p1 or username LIKE @p1 or numero LIKE @p1 or username LIKE @p1 or objetrequete LIKE @p1 or numActiviteInterne LIKE @p1 or montantValideRequete LIKE @p1 or username LIKE @p1 or montant LIKE @p1 ORDER BY idJustif OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%" + word + "%", page).Include(r => r.Utilisateur).Include(r => r.Requete).ToList();
            return result;
        }

    }
}
