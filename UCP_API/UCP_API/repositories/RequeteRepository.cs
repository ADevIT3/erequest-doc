using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.dto;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class RequeteRepository
    {
        private readonly AppDbContext _context;
        public RequeteRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all Requete
        public List<Requete> GetRequetes()
        {
            return _context.Requete.Include(r => r.Projet).Include(r => r.Site).ToList();
        }

        // Get Requete by Id
        public Requete GetRequeteById(int id)
        {
            return _context.Requete.FirstOrDefault(r => r.IdRequete == id);
        }

        // Get Requete by Id
        public Requete GetRequeteByIdCustom(int id)
        {
            return _context.Requete.FromSqlRaw("select * from requete where idRequete = @p0", id).Include(r => r.Utilisateur).ToList()[0];
        }

        
        public DateTime GetLastValidationDate(int id)
        {
            DateTimeResult result = _context.Set<DateTimeResult>().FromSqlRaw("select max(dateValidation) value from historiquevalidationrequete where idrequete = @p0", id).FirstOrDefault();
            Console.WriteLine("dateeeeeeeee1");
            Console.WriteLine(result.Value);
            if (result.Value == null)
            {
                result = _context.Set<DateTimeResult>().FromSqlRaw("select min(creationDate) value from historiquevalidationrequete where idrequete = @p0", id).FirstOrDefault();
                Console.WriteLine("dateeeeeeeee2");
                Console.WriteLine(result.Value);
            }
            Console.WriteLine("dateeeeeeeee3");
            Console.WriteLine(result.Value);

            return (DateTime) result.Value;
         
        }




        // Add a new Requete
        public void AddRequete(Requete Requete)
        {
            _context.Requete.Add(Requete);
            _context.SaveChanges();
        }

        // Update a Requete
        public void UpdateRequete(Requete Requete)
        {
            _context.Requete.Update(Requete);
            _context.SaveChanges();
        }

        // Delete a Requete
        public void DeleteRequete(int id)
        {
            var Requete = _context.Requete.Find(id);
            if (Requete != null)
            {
                _context.Requete.Remove(Requete);
                _context.SaveChanges();
            }
        }
        public List<Requete> GetRequetesByUtilisateur(int idUtilisateur)
        {
            var result = _context.Requete.FromSqlRaw("select requete.* from requete where idUtilisateur = @p0", idUtilisateur).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public void UpdateManquePj(int idRequete, Boolean value)
        {
            _context.Database.ExecuteSqlRaw("update requete set manquePj = @p0 where idrequete = @p1",value, idRequete);
            
        }

        public void UpdateCommentaireRevision(int idRequete, string commentaire)
        {
            _context.Database.ExecuteSqlRaw("update requete set commentaireRevision = @p0 where idrequete = @p1", commentaire, idRequete);

        }

        public void UpdateNumBr(int idRequete, string numBr)
        {
            _context.Database.ExecuteSqlRaw("update requete set numBr = @p0 where idrequete = @p1", numBr, idRequete);

        }


        public int GetNbRequetesManquePjByUtilisateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from requete where idUtilisateur = @p0 and manquePj = 1 ", idUtilisateur).FirstOrDefault();

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

        public int GetNombreRequetesManquePjByUtilisateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from requete where idUtilisateur = @p0 and manquePj = 1 ", idUtilisateur).FirstOrDefault();

            return (int)result.Value;
            
        }

        public int GetNbRequetesManquePjByUtilisateurAndWord(int idUtilisateur, string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from (select requete.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from requete \r\njoin site on site.idsite = requete.idsite\r\njoin projet on projet.idprojet = requete.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = requete.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere requete.idUtilisateur = @p0 and manquePj = 1 \r\n)tab\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1 \r\n", idUtilisateur, "%" + word + "%").FirstOrDefault();

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

        public List<Requete> GetRequetesManquePjByPage(int idUtilisateur,int page)
        {
            var result = _context.Requete.FromSqlRaw("select * from requete where idUtilisateur = @p0 and manquePj = 1 ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur,page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesManquePjByPageAndWord(int idUtilisateur, int page, string word)
        {
            var result = _context.Requete.FromSqlRaw("select * from (select requete.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from requete \r\njoin site on site.idsite = requete.idsite\r\njoin projet on projet.idprojet = requete.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = requete.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere requete.idUtilisateur = @p0 and manquePj = 1 \r\n)tab\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1 ORDER BY idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%" + word + "%", page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }


        /*-------------------- initiées*/
        public List<Requete> GetRequetesInitieesByUtilisateur(int idUtilisateur)
        {
            var result = _context.Requete.FromSqlRaw("select requete.*,COALESCE(requetejustificatif.idrequetejustificatif,0) idrequetejustificatif from requete left join requetejustificatif on requete.idrequete = requetejustificatif.idrequete where idrequetejustificatif is null and idUtilisateur = @p0 ", idUtilisateur).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public int GetNombreRequetesInitieesByUtilisateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from (select requete.idrequete,COALESCE(requetejustificatif.idrequetejustificatif,0) idrequetejustificatif from requete left join requetejustificatif on requete.idrequete = requetejustificatif.idrequete where idrequetejustificatif is null and idUtilisateur = @p0 ) tab", idUtilisateur).FirstOrDefault();

            return (int)result.Value;

        }

        public int GetNbRequetesInitieesByUtilisateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from (select requete.idrequete,COALESCE(requetejustificatif.idrequetejustificatif,0) idrequetejustificatif from requete left join requetejustificatif on requete.idrequete = requetejustificatif.idrequete where idrequetejustificatif is null and idUtilisateur = @p0 ) tab", idUtilisateur).FirstOrDefault();

            int quotient = (int) result.Value / 10;
            if (result.Value - 10 * quotient > 0)
            {
                return quotient + 1;
            }
            else
            {
                return quotient;
            }
        
        }

        public int GetNbRequetesInitieesByUtilisateurAndWord(int idUtilisateur,string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from\r\n(select requete.*,COALESCE(requetejustificatif.idrequetejustificatif,0) idrequetejustificatif,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from requete \r\nleft join requetejustificatif on requete.idrequete = requetejustificatif.idrequete \r\njoin site on site.idsite = requete.idsite\r\njoin projet on projet.idprojet = requete.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = requete.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere idrequetejustificatif is null and requete.idUtilisateur = @p0) tab \r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1 \r\n", idUtilisateur, "%"+word+"%").FirstOrDefault();

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
        public List<Requete> GetRequetesInitieesByUtilisateurAndPage(int idUtilisateur,int page)
        {
            var result = _context.Requete.FromSqlRaw("select requete.*,COALESCE(requetejustificatif.idrequetejustificatif,0) idrequetejustificatif from requete left join requetejustificatif on requete.idrequete = requetejustificatif.idrequete where idrequetejustificatif is null and idUtilisateur = @p0 ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur,page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesInitieesByUtilisateurAndPageAndWord(int idUtilisateur, string word, int page)
        {
            var result = _context.Requete.FromSqlRaw("select * from\r\n(select requete.*,COALESCE(requetejustificatif.idrequetejustificatif,0) idrequetejustificatif,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from requete \r\nleft join requetejustificatif on requete.idrequete = requetejustificatif.idrequete \r\njoin site on site.idsite = requete.idsite\r\njoin projet on projet.idprojet = requete.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = requete.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere idrequetejustificatif is null and requete.idUtilisateur = @p0) tab \r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1 \r\nORDER BY idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur,"%"+word+"%", page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }
        /*--------------------*/
        public List<Requete> GetRequetesValideesMinisteresByUtilisateur(int idUtilisateur)
        {
            var result = _context.Requete.FromSqlRaw("select distinct requete.* from requetejustificatif join requete on requete.idrequete = requetejustificatif.idrequete where idUtilisateur = @p0 ", idUtilisateur).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public int GetNombreRequetesValideesMinisteresByUtilisateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count (idrequete) value from (select distinct requete.* from requetejustificatif join requete on requete.idrequete = requetejustificatif.idrequete where idUtilisateur = @p0) tab ", idUtilisateur).FirstOrDefault();
            return (int)result.Value;
           
        }

        public int GetNbRequetesValideesMinisteresByUtilisateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count (idrequete) value from (select distinct requete.* from requetejustificatif join requete on requete.idrequete = requetejustificatif.idrequete where idUtilisateur = @p0) tab ", idUtilisateur).FirstOrDefault();
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

        public int GetNbRequetesValideesMinisteresByUtilisateurAndWord(int idUtilisateur,string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from (select tab.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from \r\n(select distinct requete.* from requetejustificatif join requete on requete.idrequete = requetejustificatif.idrequete where idUtilisateur = @p0) tab\r\njoin site on site.idsite = tab.idsite\r\njoin projet on projet.idprojet = tab.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = tab.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) tab1\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1  ", idUtilisateur,"%"+word+"%").FirstOrDefault();
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

        public List<Requete> GetRequetesValideesMinisteresByUtilisateurAndPage(int idUtilisateur,int page)
        {
            var result = _context.Requete.FromSqlRaw("select distinct requete.* from requetejustificatif join requete on requete.idrequete = requetejustificatif.idrequete where idUtilisateur = @p0 ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur,page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesValideesMinisteresByUtilisateurAndPageAndWord(int idUtilisateur,string word, int page)
        {
            var result = _context.Requete.FromSqlRaw(" select * from (select tab.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from \r\n(select distinct requete.* from requetejustificatif join requete on requete.idrequete = requetejustificatif.idrequete where idUtilisateur = @p0) tab\r\njoin site on site.idsite = tab.idsite\r\njoin projet on projet.idprojet = tab.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = tab.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) tab1\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1 ORDER BY idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%" + word + "%", page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }
        /*---------------------*/

        public int GetNbRequetesOfValidateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from (select tab2.*, coalesce(circuitrequete.idcircuitrequete,0) existence from (select distinct tab1.* from (select tab.* from (select requete.* from requetejustificatif join requete on requete.idrequete = requetejustificatif.idrequete) tab join utilisateursite on utilisateursite.idsite = tab.idsite where utilisateursite.idutilisateur = @p0) tab1 join utilisateurprojet on utilisateurprojet.idprojet = tab1.idprojet where utilisateurprojet.idutilisateur = @p1) tab2 left join circuitrequete on tab2.idrequete = circuitrequete.idrequete) tab3 where existence = 0", idUtilisateur,idUtilisateur).FirstOrDefault();
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

        public int GetNombreRequetesOfValidateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from (select tab2.*, coalesce(circuitrequete.idcircuitrequete,0) existence from (select distinct tab1.* from (select tab.* from (select requete.* from requetejustificatif join requete on requete.idrequete = requetejustificatif.idrequete) tab join utilisateursite on utilisateursite.idsite = tab.idsite where utilisateursite.idutilisateur = @p0) tab1 join utilisateurprojet on utilisateurprojet.idprojet = tab1.idprojet where utilisateurprojet.idutilisateur = @p1) tab2 left join circuitrequete on tab2.idrequete = circuitrequete.idrequete) tab3 where existence = 0", idUtilisateur, idUtilisateur).FirstOrDefault();
            return (int)result.Value;           
        }

        public int GetNbRequetesOfValidateurByWord(int idUtilisateur,string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from\r\n(select tab3.*, site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from \r\n(select tab2.*, coalesce(circuitrequete.idcircuitrequete,0) existence from \r\n(select distinct tab1.* from (select tab.* from (select requete.* from requetejustificatif \r\njoin requete on requete.idrequete = requetejustificatif.idrequete) tab \r\njoin utilisateursite on utilisateursite.idsite = tab.idsite where utilisateursite.idutilisateur = @p0) tab1\r\njoin utilisateurprojet on utilisateurprojet.idprojet = tab1.idprojet where utilisateurprojet.idutilisateur = @p0) tab2 \r\nleft join circuitrequete on tab2.idrequete = circuitrequete.idrequete) tab3\r\njoin site on site.idsite = tab3.idsite\r\njoin projet on projet.idprojet = tab3.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = tab3.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere existence = 0) tab4\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1 ", idUtilisateur, "%" + word + "%").FirstOrDefault();
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

        public List<Requete> GetRequetesOfValidateur(int idUtilisateur)
        {
            var result = _context.Requete.FromSqlRaw("select * from (select tab2.*, coalesce(circuitrequete.idcircuitrequete,0) existence from (select distinct tab1.* from (select tab.* from (select requete.* from requetejustificatif join requete on requete.idrequete = requetejustificatif.idrequete) tab join utilisateursite on utilisateursite.idsite = tab.idsite where utilisateursite.idutilisateur = @p0) tab1 join utilisateurprojet on utilisateurprojet.idprojet = tab1.idprojet where utilisateurprojet.idutilisateur = @p1) tab2 left join circuitrequete on tab2.idrequete = circuitrequete.idrequete) tab3 where existence = 0", idUtilisateur,idUtilisateur).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesOfValidateurByPage(int idUtilisateur,int page)
        {
            var result = _context.Requete.FromSqlRaw("select * from (select tab2.*, coalesce(circuitrequete.idcircuitrequete,0) existence from (select distinct tab1.* from (select tab.* from (select requete.* from requetejustificatif join requete on requete.idrequete = requetejustificatif.idrequete) tab join utilisateursite on utilisateursite.idsite = tab.idsite where utilisateursite.idutilisateur = @p0) tab1 join utilisateurprojet on utilisateurprojet.idprojet = tab1.idprojet where utilisateurprojet.idutilisateur = @p1) tab2 left join circuitrequete on tab2.idrequete = circuitrequete.idrequete) tab3 where existence = 0 ORDER BY idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, idUtilisateur,page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesOfValidateurByPageAndWord(int idUtilisateur,string word, int page)
        {
            var result = _context.Requete.FromSqlRaw(" select * from\r\n(select tab3.*, site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from \r\n(select tab2.*, coalesce(circuitrequete.idcircuitrequete,0) existence from \r\n(select distinct tab1.* from (select tab.* from (select requete.* from requetejustificatif \r\njoin requete on requete.idrequete = requetejustificatif.idrequete) tab \r\njoin utilisateursite on utilisateursite.idsite = tab.idsite where utilisateursite.idutilisateur = @p0) tab1\r\njoin utilisateurprojet on utilisateurprojet.idprojet = tab1.idprojet where utilisateurprojet.idutilisateur = @p0) tab2 \r\nleft join circuitrequete on tab2.idrequete = circuitrequete.idrequete) tab3\r\njoin site on site.idsite = tab3.idsite\r\njoin projet on projet.idprojet = tab3.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = tab3.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere existence = 0) tab4\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1 ORDER BY idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%" + word + "%", page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }
        /*------------------------------*/
        public List<Requete> GetRequetesEnCours(int idUtilisateur)
        {
            var result = _context.Requete.FromSqlRaw("select requete.* from (select distinct(circuitrequete.idrequete) from historiquevalidationrequete join circuitrequete on historiquevalidationrequete.idrequete = circuitrequete.idrequete where dateValidation is null ) tab join requete on tab.idrequete = requete.idrequete where (requete.etatvalidation = 1 or requete.etatvalidation = 4) and requete.idutilisateur = @p0", idUtilisateur).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public int GetNombreRequetesEnCours(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(tab.idrequete) value from (select distinct(circuitrequete.idrequete) from historiquevalidationrequete join circuitrequete on historiquevalidationrequete.idrequete = circuitrequete.idrequete where dateValidation is null ) tab join requete on tab.idrequete = requete.idrequete where ( requete.etatvalidation = 1 or requete.etatvalidation = 4) and requete.idutilisateur = @p0 ", idUtilisateur).FirstOrDefault();
            return (int)result.Value;
           
        }

        public int GetNbRequetesEnCours(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(tab.idrequete) value from (select distinct(circuitrequete.idrequete) from historiquevalidationrequete join circuitrequete on historiquevalidationrequete.idrequete = circuitrequete.idrequete where dateValidation is null ) tab join requete on tab.idrequete = requete.idrequete where (requete.etatvalidation = 1 or requete.etatvalidation = 4) and requete.idutilisateur = @p0 ", idUtilisateur).FirstOrDefault();
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

        public int GetNbRequetesEnCoursByWord(int idUtilisateur, string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from (select tab1.* , site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from (select requete.* from (select distinct(circuitrequete.idrequete) from historiquevalidationrequete join circuitrequete on historiquevalidationrequete.idrequete = circuitrequete.idrequete where dateValidation is null ) tab \r\njoin requete on tab.idrequete = requete.idrequete\r\nwhere ( requete.etatvalidation = 1 or requete.etatvalidation = 4 ) and requete.idutilisateur = @p0 )tab1\r\njoin site on site.idsite = tab1.idsite\r\njoin projet on projet.idprojet = tab1.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = tab1.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) tab2\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1 \r\n", idUtilisateur, "%" + word + "%").FirstOrDefault();
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

        public List<Requete> GetRequetesEnCoursByPage(int idUtilisateur,int page)
        {
            var result = _context.Requete.FromSqlRaw("select requete.* from (select distinct(circuitrequete.idrequete) from historiquevalidationrequete join circuitrequete on historiquevalidationrequete.idrequete = circuitrequete.idrequete where dateValidation is null ) tab join requete on tab.idrequete = requete.idrequete where (requete.etatvalidation = 1 or requete.etatvalidation = 4) and requete.idutilisateur = @p0 ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur,page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesEnCoursByPageAndWord(int idUtilisateur, string word, int page)
        {
            var result = _context.Requete.FromSqlRaw("select * from \r\n(select tab1.* , site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from \r\n(select requete.*,tab_util.etape_actuelle from \r\n(select distinct(circuitrequete.idrequete) from historiquevalidationrequete \r\njoin circuitrequete on historiquevalidationrequete.idrequete = circuitrequete.idrequete where dateValidation is null ) tab \r\njoin (\t\r\n\tselect distinct idrequete,etape_actuelle from \r\n\t(select *,MAX(rank2) OVER (PARTITION BY idrequete) etape_actuelle from\r\n\t(select idrequete,idcircuitetape,idvalidateur,dense_rank() over (partition by idrequete order by idcircuitetape) as rank2 from \r\n\t(select historiquevalidationrequete.*, row_number() over (partition by idrequete,idcircuitetape order by etatValidation desc) as rank \r\n\tfrom historiquevalidationrequete  ) tab2 \r\n\twhere datevalidation is null) tab3) tab4 \r\n\twhere rank2 = etape_actuelle \r\n)tab_util on tab.idrequete = tab_util.idRequete\r\njoin requete on tab.idrequete = requete.idrequete\r\nwhere (requete.etatvalidation = 1 or requete.etatvalidation = 4) and requete.idutilisateur = @p0 )tab1\r\njoin site on site.idsite = tab1.idsite\r\njoin projet on projet.idprojet = tab1.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = tab1.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) tab2\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1 ORDER BY etape_actuelle,idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%" + word + "%", page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public double? GetMontantValideRequetesEnCours(string codeActiTomPro)
        {
            FloatResult result = _context.Set<FloatResult>().FromSqlRaw("select sum(tab1.montantValide) value from \r\n(select requete.* from (select distinct(circuitrequete.idrequete) from historiquevalidationrequete \r\njoin circuitrequete on historiquevalidationrequete.idrequete = circuitrequete.idrequete where dateValidation is null ) tab \r\njoin requete on tab.idrequete = requete.idrequete\r\nwhere ( requete.etatvalidation = 1 or requete.etatvalidation = 4 ) and codeActiviteTom = @p0) tab1", codeActiTomPro).FirstOrDefault();
            if(result.Value == null)
            {
                return 0;
            }
            else
            {
                return result.Value;
            }
            
        }

        /*------------------------*/

        public int GetNbRequetesPourValidation(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(tab5.idrequete) value from\r\n( select * from (select *,MAX(rank2) OVER (PARTITION BY idrequete) etape_actuelle from\r\n(select idrequete,idcircuitetape,idvalidateur,dense_rank() over (partition by idrequete order by idcircuitetape) as rank2 from \r\n(select historiquevalidationrequete.*, row_number() over (partition by idrequete,idcircuitetape order by etatValidation desc) as rank from historiquevalidationrequete  ) tab2\r\nwhere isPotential = 1 and datevalidation is null) tab3) tab4 where rank2 = etape_actuelle and tab4.idvalidateur = @p0 ) tab5\r\njoin requete on tab5.idrequete = requete.idrequete and requete.manquePj = 0", idUtilisateur).FirstOrDefault();
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

        public int GetNombrebRequetesPourValidation(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(tab5.idrequete) value from\r\n( select * from (select *,MAX(rank2) OVER (PARTITION BY idrequete) etape_actuelle from\r\n(select idrequete,idcircuitetape,idvalidateur,dense_rank() over (partition by idrequete order by idcircuitetape) as rank2 from \r\n(select historiquevalidationrequete.*, row_number() over (partition by idrequete,idcircuitetape order by etatValidation desc) as rank from historiquevalidationrequete  ) tab2\r\nwhere isPotential = 1 and datevalidation is null) tab3) tab4 where rank2 = etape_actuelle and tab4.idvalidateur = @p0 ) tab5\r\njoin requete on tab5.idrequete = requete.idrequete and requete.manquePj = 0", idUtilisateur).FirstOrDefault();
            return (int)result.Value ;
           
        }


        public int GetNbRequetesPourValidationByWord(int idUtilisateur, string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from (select requete.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from \r\n( select * from \r\n(select *,MAX(rank2) OVER (PARTITION BY idrequete) etape_actuelle from\r\n(select idrequete,idcircuitetape,idvalidateur,dense_rank() over (partition by idrequete order by idcircuitetape) as rank2 from \r\n(select historiquevalidationrequete.*, row_number() over (partition by idrequete,idcircuitetape order by etatValidation desc) as rank from historiquevalidationrequete  ) tab2 \r\nwhere isPotential = 1 and datevalidation is null) tab3) tab4 where rank2 = etape_actuelle and tab4.idvalidateur = @p0 ) tab5 \r\njoin requete on tab5.idrequete = requete.idrequete and requete.manquePj = 0\r\njoin site on site.idsite = requete.idsite\r\njoin projet on projet.idprojet = requete.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = requete.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) tab6\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1", idUtilisateur, "%" + word + "%").FirstOrDefault();
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




        public List<Requete> GetRequetesPourValidation(int idUtilisateur)//idvalidateur
        {
            var result = _context.Requete.FromSqlRaw("select requete.* from\r\n( select * from (select *,MAX(rank2) OVER (PARTITION BY idrequete) etape_actuelle from\r\n(select idrequete,idcircuitetape,idvalidateur,dense_rank() over (partition by idrequete order by idcircuitetape) as rank2 from \r\n(select historiquevalidationrequete.*, row_number() over (partition by idrequete,idcircuitetape order by etatValidation desc) as rank from historiquevalidationrequete  ) tab2\r\nwhere isPotential = 1 and datevalidation is null) tab3) tab4 where rank2 = etape_actuelle and tab4.idvalidateur = @p0 ) tab5\r\njoin requete on tab5.idrequete = requete.idrequete and requete.manquePj = 0", idUtilisateur).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesPourValidationByPage(int idUtilisateur,int page)//idvalidateur
        {
            var result = _context.Requete.FromSqlRaw("select requete.* from\r\n( select * from (select *,MAX(rank2) OVER (PARTITION BY idrequete) etape_actuelle from\r\n(select idrequete,idcircuitetape,idvalidateur,dense_rank() over (partition by idrequete order by idcircuitetape) as rank2 from \r\n(select historiquevalidationrequete.*, row_number() over (partition by idrequete,idcircuitetape order by etatValidation desc) as rank from historiquevalidationrequete  ) tab2\r\nwhere isPotential = 1 and datevalidation is null) tab3) tab4 where rank2 = etape_actuelle and tab4.idvalidateur = @p0 ) tab5\r\njoin requete on tab5.idrequete = requete.idrequete and requete.manquePj = 0 ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur,page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesPourValidationByPageAndWord(int idUtilisateur,string word, int page)//idvalidateur
        {
            var result = _context.Requete.FromSqlRaw("select * from \r\n(select requete.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo,etape_actuelle from \r\n( select * from \r\n(select *,MAX(rank2) OVER (PARTITION BY idrequete) etape_actuelle from\r\n(select idrequete,idcircuitetape,idvalidateur,dense_rank() over (partition by idrequete order by idcircuitetape) as rank2 from \r\n(select historiquevalidationrequete.*, row_number() over (partition by idrequete,idcircuitetape order by etatValidation desc) as rank from historiquevalidationrequete  ) tab2 \r\nwhere isPotential = 1 and datevalidation is null) tab3) tab4 where rank2 = etape_actuelle and tab4.idvalidateur = @p0 ) tab5 \r\njoin requete on tab5.idrequete = requete.idrequete and requete.manquePj = 0\r\njoin site on site.idsite = requete.idsite\r\njoin projet on projet.idprojet = requete.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = requete.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo ) tab6\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1 ORDER BY etape_actuelle,idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%" + word + "%", page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }
        /*--------------*/

        public int GetNbRequetesEnCoursCircuitValidateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(tab3.idrequete) value from\r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.EtatValidation != 5 and requete.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0 ) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin requete on requete.idrequete = tab3.idrequete", idUtilisateur).FirstOrDefault();
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

        public int GetNombreRequetesEnCoursCircuitValidateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(tab3.idrequete) value from\r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.EtatValidation != 5 and requete.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0 ) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin requete on requete.idrequete = tab3.idrequete", idUtilisateur).FirstOrDefault();
            return (int)result.Value;
           
        }

        public int GetNbRequetesEnCoursCircuitValidateurByWord(int idUtilisateur,string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from (select requete.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from \r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.EtatValidation != 5 and requete.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0 ) tab2 on tab.idCircuit = tab2.idCircuit) tab3 \r\njoin requete on requete.idrequete = tab3.idrequete\r\njoin site on site.idsite = requete.idsite\r\njoin projet on projet.idprojet = requete.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = requete.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) tab4\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1 ", idUtilisateur, "%" + word + "%").FirstOrDefault();
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

        public List<Requete> GetRequetesEnCoursCircuitValidateur(int idUtilisateur)//idvalidateur
        {
            var result = _context.Requete.FromSqlRaw("select requete.* from\r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.EtatValidation != 5 and requete.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0 ) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin requete on requete.idrequete = tab3.idrequete", idUtilisateur).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesEnCoursCircuitValidateurByPage(int idUtilisateur,int page)//idvalidateur
        {
            var result = _context.Requete.FromSqlRaw("select requete.* from\r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.EtatValidation != 5 and requete.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0 ) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin requete on requete.idrequete = tab3.idrequete ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur,page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesEnCoursCircuitValidateurByPageAndWord(int idUtilisateur,string word, int page)//idvalidateur
        {
            var result = _context.Requete.FromSqlRaw("select * from \r\n(select requete.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo,tab_util.etape_actuelle from \r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.EtatValidation != 5 and requete.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0 ) tab2 on tab.idCircuit = tab2.idCircuit) tab3 \r\njoin requete on requete.idrequete = tab3.idrequete\r\njoin (\t\r\n\tselect distinct idrequete,etape_actuelle from \r\n\t(select *,MAX(rank2) OVER (PARTITION BY idrequete) etape_actuelle from\r\n\t(select idrequete,idcircuitetape,idvalidateur,dense_rank() over (partition by idrequete order by idcircuitetape) as rank2 from \r\n\t(select historiquevalidationrequete.*, row_number() over (partition by idrequete,idcircuitetape order by etatValidation desc) as rank \r\n\tfrom historiquevalidationrequete  ) tab2 \r\n\twhere datevalidation is null) tab3) tab4 \r\n\twhere rank2 = etape_actuelle and idValidateur = @p0\r\n)tab_util on requete.idrequete = tab_util.idRequete\r\njoin site on site.idsite = requete.idsite\r\njoin projet on projet.idprojet = requete.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = requete.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) tab4\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1  ORDER BY etape_actuelle,idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%" + word + "%", page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }
        /*--------------*/

        public int GetNbRequetesEnCoursCircuitAdmin(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select  count(requete.idrequete) value from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.EtatValidation != 5 and requete.EtatValidation != 2\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0", idUtilisateur).FirstOrDefault();
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

        public int GetNombreRequetesEnCoursCircuitAdmin(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select  count(requete.idrequete) value from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.EtatValidation != 5 and requete.EtatValidation != 2\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0", idUtilisateur).FirstOrDefault();
            return (int)result.Value;

        }

        public int GetNbRequetesEnCoursCircuitAdminByWord(int idUtilisateur, string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw(" select count(idrequete) value from (select requete.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.EtatValidation != 5 and requete.EtatValidation != 2\r\njoin site on site.idsite = requete.idsite\r\njoin projet on projet.idprojet = requete.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = requete.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\njoin utilisateurprojet on utilisateurProjet.idprojet = requete.idprojet and utilisateurprojet.idutilisateur = @p0\r\n) tab4\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or montantValide LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1 ", idUtilisateur, "%" + word + "%").FirstOrDefault();
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

        public List<Requete> GetRequetesEnCoursCircuitAdmin(int idUtilisateur)//idvalidateur
        {
            var result = _context.Requete.FromSqlRaw("select requete.* from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.EtatValidation != 5 and requete.EtatValidation != 2\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0", idUtilisateur).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesEnCoursCircuitAdminByPage(int idUtilisateur, int page)//idvalidateur
        {
            var result = _context.Requete.FromSqlRaw("select requete.* from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.EtatValidation != 5 and requete.EtatValidation != 2\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0 ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesEnCoursCircuitAdminByPageAndWord(int idUtilisateur, string word, int page)//idvalidateur
        {
            var result = _context.Requete.FromSqlRaw("select * from \r\n(select requete.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo,tab_util.etape_actuelle from \r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.EtatValidation != 5 and requete.EtatValidation != 2) tab\r\n) tab3 \r\njoin requete on requete.idrequete = tab3.idrequete\r\njoin (\r\nselect distinct idrequete,etape_actuelle from \r\n(select *,MAX(rank2) OVER (PARTITION BY idrequete) etape_actuelle from\r\n(select idrequete,idcircuitetape,idvalidateur,dense_rank() over (partition by idrequete order by idcircuitetape) as rank2 from \r\n(select historiquevalidationrequete.*, row_number() over (partition by idrequete,idcircuitetape order by etatValidation desc) as rank \r\nfrom historiquevalidationrequete  ) tab2 \r\nwhere datevalidation is null) tab3) tab4 \r\nwhere rank2 = etape_actuelle\r\n)tab_util on requete.idrequete = tab_util.idRequete\r\njoin site on site.idsite = requete.idsite\r\njoin projet on projet.idprojet = requete.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = requete.idutilisateur\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) tab4\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant  LIKE @p1 or montantValide LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1  ORDER BY etape_actuelle,idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%" + word + "%", page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        /*--------------*/
        public int GetNbRequetesAjustifier(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(tab1.idrequete) value from (select tab.*,coalesce(no_need_justificatif.idrequete,0) noNeedJustificatif from (select tab_a_justifier2.* from\r\n(select * from (select requete.*,coalesce(justif_valide.idJustif,0) justif from requete\r\nleft join (select justificatif.idJustif,justificatif.idrequete from justificatif where etatValidation != 2) justif_valide on requete.idRequete = justif_valide.idRequete\r\nwhere requete.etatvalidation = 5) tab_a_justifier\r\nwhere justif = 0) tab_a_justifier2 \r\nwhere etatvalidation = 5 and cloturedate is null and tab_a_justifier2.idutilisateur = @p0 ) tab\r\nleft join (select distinct requeterubrique.idrequete from requeterubrique \r\njoin typerubrique on requeterubrique.idtyperubrique = typerubrique.idtyperubrique and typerubrique.needJustificatif = 0) no_need_justificatif on tab.idRequete = no_need_justificatif.idrequete) tab1\r\nwhere noNeedJustificatif = 0", idUtilisateur).FirstOrDefault();
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

        public int GetNombreRequetesAjustifier(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(tab1.idrequete) value from (select tab.*,coalesce(no_need_justificatif.idrequete,0) noNeedJustificatif from (select tab_a_justifier2.* from\r\n(select * from (select requete.*,coalesce(justif_valide.idJustif,0) justif from requete\r\nleft join (select justificatif.idJustif,justificatif.idrequete from justificatif where etatValidation != 2) justif_valide on requete.idRequete = justif_valide.idRequete\r\nwhere requete.etatvalidation = 5) tab_a_justifier\r\nwhere justif = 0) tab_a_justifier2 \r\nwhere etatvalidation = 5 and cloturedate is null and tab_a_justifier2.idutilisateur = @p0 ) tab\r\nleft join (select distinct requeterubrique.idrequete from requeterubrique \r\njoin typerubrique on requeterubrique.idtyperubrique = typerubrique.idtyperubrique and typerubrique.needJustificatif = 0) no_need_justificatif on tab.idRequete = no_need_justificatif.idrequete) tab1\r\nwhere noNeedJustificatif = 0", idUtilisateur).FirstOrDefault();
            return (int)result.Value ;
            
        }

        public int GetNbRequetesAjustifierByWord(int idUtilisateur, string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(tab2.idrequete) value from \r\n(select tab1.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from (select tab.*,coalesce(no_need_justificatif.idrequete,0) noNeedJustificatif from (select tab_a_justifier2.* from\r\n(select * from (select requete.*,coalesce(justif_valide.idJustif,0) justif from requete\r\nleft join (select justificatif.idJustif,justificatif.idrequete from justificatif where etatValidation != 2) justif_valide on requete.idRequete = justif_valide.idRequete\r\nwhere requete.etatvalidation = 5) tab_a_justifier\r\nwhere justif = 0) tab_a_justifier2 \r\nwhere etatvalidation = 5 and cloturedate is null and tab_a_justifier2.idutilisateur = @p0 ) tab\r\nleft join (select distinct requeterubrique.idrequete from requeterubrique \r\njoin typerubrique on requeterubrique.idtyperubrique = typerubrique.idtyperubrique and typerubrique.needJustificatif = 0) no_need_justificatif on tab.idRequete = no_need_justificatif.idrequete) tab1\r\njoin site on site.idsite = tab1.idsite\r\njoin projet on projet.idprojet = tab1.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = tab1.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere noNeedJustificatif = 0 ) tab2\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1", idUtilisateur, "%" + word + "%").FirstOrDefault();
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

        

        public List<Requete> GetRequetesAjustifier(int idUtilisateur)//idvalidateur
        {
            var result = _context.Requete.FromSqlRaw("select tab1.* from (select tab.*,coalesce(no_need_justificatif.idrequete,0) noNeedJustificatif from (select tab_a_justifier2.* from\r\n(select * from (select requete.*,coalesce(justif_valide.idJustif,0) justif from requete\r\nleft join (select justificatif.idJustif,justificatif.idrequete from justificatif where etatValidation != 2) justif_valide on requete.idRequete = justif_valide.idRequete\r\nwhere requete.etatvalidation = 5) tab_a_justifier\r\nwhere justif = 0) tab_a_justifier2 \r\nwhere etatvalidation = 5 and cloturedate is null and tab_a_justifier2.idutilisateur = @p0 ) tab\r\nleft join (select distinct requeterubrique.idrequete from requeterubrique \r\njoin typerubrique on requeterubrique.idtyperubrique = typerubrique.idtyperubrique and typerubrique.needJustificatif = 0) no_need_justificatif on tab.idRequete = no_need_justificatif.idrequete) tab1\r\nwhere noNeedJustificatif = 0", idUtilisateur).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesAjustifierByPage(int idUtilisateur,int page)//idvalidateur
        {
            var result = _context.Requete.FromSqlRaw("select tab1.* from (select tab.*,coalesce(no_need_justificatif.idrequete,0) noNeedJustificatif from (select tab_a_justifier2.* from\r\n(select * from (select requete.*,coalesce(justif_valide.idJustif,0) justif from requete\r\nleft join (select justificatif.idJustif,justificatif.idrequete from justificatif where etatValidation != 2) justif_valide on requete.idRequete = justif_valide.idRequete\r\nwhere requete.etatvalidation = 5) tab_a_justifier\r\nwhere justif = 0) tab_a_justifier2 \r\nwhere etatvalidation = 5 and cloturedate is null and tab_a_justifier2.idutilisateur = @p0 ) tab\r\nleft join (select distinct requeterubrique.idrequete from requeterubrique \r\njoin typerubrique on requeterubrique.idtyperubrique = typerubrique.idtyperubrique and typerubrique.needJustificatif = 0) no_need_justificatif on tab.idRequete = no_need_justificatif.idrequete) tab1\r\nwhere noNeedJustificatif = 0 \r\nORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur,page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesAjustifierByPageAndWord(int idUtilisateur,string word, int page)//idvalidateur
        {
            var result = _context.Requete.FromSqlRaw("select tab2.*  from \r\n(select tab1.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from (select tab.*,coalesce(no_need_justificatif.idrequete,0) noNeedJustificatif from (select tab_a_justifier2.* from\r\n(select * from (select requete.*,coalesce(justif_valide.idJustif,0) justif from requete\r\nleft join (select justificatif.idJustif,justificatif.idrequete from justificatif where etatValidation != 2) justif_valide on requete.idRequete = justif_valide.idRequete\r\nwhere requete.etatvalidation = 5) tab_a_justifier\r\nwhere justif = 0) tab_a_justifier2 \r\nwhere etatvalidation = 5 and cloturedate is null and tab_a_justifier2.idutilisateur = @p0 ) tab\r\nleft join (select distinct requeterubrique.idrequete from requeterubrique \r\njoin typerubrique on requeterubrique.idtyperubrique = typerubrique.idtyperubrique and typerubrique.needJustificatif = 0) no_need_justificatif on tab.idRequete = no_need_justificatif.idrequete) tab1\r\njoin site on site.idsite = tab1.idsite\r\njoin projet on projet.idprojet = tab1.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = tab1.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere noNeedJustificatif = 0 ) tab2\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1 \r\nORDER BY idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%" + word + "%", page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

      
        /*--------------*/

        public int GetNbRequetesValidesValidateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(tab3.idrequete) value from\r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete  and requete.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0 ) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin requete on requete.idrequete = tab3.idrequete and requete.etatValidation = 5", idUtilisateur).FirstOrDefault();
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

        public int GetNombreRequetesValidesValidateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(tab3.idrequete) value from\r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete  and requete.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0 ) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin requete on requete.idrequete = tab3.idrequete and requete.etatValidation = 5", idUtilisateur).FirstOrDefault();
            return (int)result.Value ;
            
        }

        public int GetNbRequetesValidesValidateurByWord(int idUtilisateur,string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from (select requete.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from\r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete  and requete.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0  ) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin requete on requete.idrequete = tab3.idrequete and requete.etatValidation = 5\r\njoin site on site.idsite = requete.idsite\r\njoin projet on projet.idprojet = requete.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = requete.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) tab4\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1 ", idUtilisateur, "%" + word + "%").FirstOrDefault();
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

        public List<Requete> GetRequetesValidesValidateur(int idUtilisateur)//idvalidateur
        {
            var result = _context.Requete.FromSqlRaw("select requete.* from\r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete  and requete.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0 ) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin requete on requete.idrequete = tab3.idrequete and requete.etatValidation = 5", idUtilisateur).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesValidesValidateurByPage(int idUtilisateur, int page)//idvalidateur
        {
            var result = _context.Requete.FromSqlRaw("select requete.* from\r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0 ) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin requete on requete.idrequete = tab3.idrequete and requete.etatValidation = 5 ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesValidesValidateurByPageAndWord(int idUtilisateur,string word, int page)//idvalidateur
        {
            var result = _context.Requete.FromSqlRaw("select * from (select requete.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from\r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete  and requete.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0  ) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin requete on requete.idrequete = tab3.idrequete and requete.etatValidation = 5\r\njoin site on site.idsite = requete.idsite\r\njoin projet on projet.idprojet = requete.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = requete.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) tab4\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1 ORDER BY idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%" + word + "%", page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }
        /*--------------*/

        public int GetNbRequetesValidesAdmin(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(requete.idrequete) value from requete \r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\nwhere etatvalidation = 5 and cloturedate is null", idUtilisateur).FirstOrDefault();
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

        public int GetNombreRequetesValidesAdmin(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(requete.idrequete) value from requete \r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\nwhere etatvalidation = 5 and cloturedate is null", idUtilisateur).FirstOrDefault();
            return (int)result.Value;

        }

        public int GetNbRequetesValidesAdminByWord(int idUtilisateur, string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from\r\n(select requete.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from requete \r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\njoin site on site.idsite = requete.idsite\r\njoin projet on projet.idprojet = requete.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = requete.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere etatvalidation = 5 and cloturedate is null) tab\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1", idUtilisateur, "%" + word + "%").FirstOrDefault();
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

        public List<Requete> GetRequetesValidesAdmin(int idUtilisateur)//idvalidateur
        {
            var result = _context.Requete.FromSqlRaw("select requete.* from requete \r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\nwhere etatvalidation = 5 and cloturedate is null", idUtilisateur).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesValidesAdminByPage(int idUtilisateur, int page)//idvalidateur
        {
            var result = _context.Requete.FromSqlRaw(" select requete.* from requete \r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\nwhere etatvalidation = 5 and cloturedate is null ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesValidesAdminByPageAndWord(int idUtilisateur, string word, int page)//idvalidateur
        {
            var result = _context.Requete.FromSqlRaw("select * from (select requete.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from\r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete  and requete.EtatValidation != 2) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0  ) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin requete on requete.idrequete = tab3.idrequete and requete.etatValidation = 5\r\njoin site on site.idsite = requete.idsite\r\njoin projet on projet.idprojet = requete.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = requete.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) tab4\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1  ORDER BY idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%" + word + "%", page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        /*--------------*/
        public double? GetMontantTotal(int idRequete)
        {
            var result = _context.Set<FloatResult>().FromSqlRaw(@"
        select SUM(TRY_CAST (valeur as float)) value from requeterubrique join categorierubriquecolonne on requeterubrique.idcategorierubriquecolonne = categorierubriquecolonne.idcategorierubriquecolonne where categorierubriquecolonne.nom = 'Total' and idRequete = @p0
    ", idRequete).FirstOrDefault();

            return result?.Value != null ? (double?)result.Value : null;
        }
        /*--------------*/
        public int CheckDroiDemandeRequete(int idAgmo)
        {
            var result = _context.Set<IntResult>().FromSqlRaw(
        "select count(idrequete) value from (select tab.idrequete,coalesce(justificatif.idjustif,0) idjustif from (select requete.idrequete,utilisateur.idagmo from requete join utilisateur on utilisateur.idutilisateur = requete.idutilisateur where EtatValidation = 5 and utilisateur.idagmo = @p0 AND DATEADD(DAY,15 + (2 * ((15 + DATEPART(WEEKDAY, requete.datefinexecution) - 1) / 5)),requete.datefinexecution) <= CAST(GETDATE() AS DATE)) tab left join justificatif on tab.idrequete = justificatif.idrequete ) tab1 where idjustif = 0"

    , idAgmo).FirstOrDefault();

            return (int) result?.Value ;
        }

        /*--------------*/
        public int GetNbRequetesACloturees(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from \r\n(select requete.* from (select distinct idrequete from \r\n(select tab.* from (select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif \r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif and justificatif.EtatValidation = 5 ) tab\r\njoin (select distinct circuitetape.idcircuit from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 \r\non tab.idCircuit = tab2.idCircuit) tab3 join justificatif on justificatif.idJustif = tab3.idJustif) tab4 \r\njoin requete on tab4.idrequete = requete.idrequete where requete.cloturedate is null\r\nUNION\r\nselect tab9.* from (select requete.* from\r\n(select distinct requeterubrique.idrequete from requeterubrique \r\njoin typerubrique on requeterubrique.idtyperubrique = typerubrique.idtyperubrique and typerubrique.needJustificatif = 0) tab6\r\njoin requete on requete.idrequete = tab6.idrequete where etatValidation = 5) tab9\r\njoin\r\n(select circuitrequete.idrequete from\r\n(select distinct circuitetape.idcircuit from circuitEtapeValidateur  \r\njoin circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p1) tab7\r\njoin circuitrequete on circuitrequete.idcircuit = tab7.idcircuit) tab8\r\non tab9.idrequete = tab8.idrequete) a_cloturer\r\n\r\n", idUtilisateur,idUtilisateur).FirstOrDefault();
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

        public int GetNombreRequetesACloturees(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from \r\n(select requete.* from (select distinct idrequete from \r\n(select tab.* from (select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif \r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif and justificatif.EtatValidation = 5 ) tab\r\njoin (select distinct circuitetape.idcircuit from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 \r\non tab.idCircuit = tab2.idCircuit) tab3 join justificatif on justificatif.idJustif = tab3.idJustif) tab4 \r\njoin requete on tab4.idrequete = requete.idrequete where requete.cloturedate is null\r\nUNION\r\nselect tab9.* from (select requete.* from\r\n(select distinct requeterubrique.idrequete from requeterubrique \r\njoin typerubrique on requeterubrique.idtyperubrique = typerubrique.idtyperubrique and typerubrique.needJustificatif = 0) tab6\r\njoin requete on requete.idrequete = tab6.idrequete where etatValidation = 5) tab9\r\njoin\r\n(select circuitrequete.idrequete from\r\n(select distinct circuitetape.idcircuit from circuitEtapeValidateur  \r\njoin circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p1) tab7\r\njoin circuitrequete on circuitrequete.idcircuit = tab7.idcircuit) tab8\r\non tab9.idrequete = tab8.idrequete) a_cloturer\r\n", idUtilisateur,idUtilisateur).FirstOrDefault();
            return (int)result.Value;
            
        }

        public int GetNbRequetesAClotureesByWord(int idUtilisateur,string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from (select a_cloturer.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from \r\n(select requete.* from (select distinct idrequete from \r\n(select tab.* from (select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif \r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif and justificatif.EtatValidation = 5 ) tab\r\njoin (select distinct circuitetape.idcircuit from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 \r\non tab.idCircuit = tab2.idCircuit) tab3 join justificatif on justificatif.idJustif = tab3.idJustif) tab4 \r\njoin requete on tab4.idrequete = requete.idrequete where requete.cloturedate is null\r\nUNION\r\nselect tab9.* from (select requete.* from\r\n(select distinct requeterubrique.idrequete from requeterubrique \r\njoin typerubrique on requeterubrique.idtyperubrique = typerubrique.idtyperubrique and typerubrique.needJustificatif = 0) tab6\r\njoin requete on requete.idrequete = tab6.idrequete where etatValidation = 5) tab9\r\njoin\r\n(select circuitrequete.idrequete from\r\n(select distinct circuitetape.idcircuit from circuitEtapeValidateur  \r\njoin circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p1) tab7\r\njoin circuitrequete on circuitrequete.idcircuit = tab7.idcircuit) tab8\r\non tab9.idrequete = tab8.idrequete) a_cloturer\r\njoin site on site.idsite = a_cloturer.idsite\r\njoin projet on projet.idprojet = a_cloturer.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = a_cloturer.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) a_justifier_recherche\r\nwhere nomprojet LIKE @p2 or nomsite LIKE @p2 or referenceInterne LIKE @p2 or objet LIKE @p2 or numRequete LIKE @p2 or nomagmo LIKE @p2 or montant LIKE @p2 or dateExecution LIKE @p2 or dateFinExecution LIKE @p2\r\n ", idUtilisateur, idUtilisateur, "%" + word + "%").FirstOrDefault();
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

        public List<Requete> GetRequetesAcloturer(int idUtilisateur)//idvalidateur
        {
            var result = _context.Requete.FromSqlRaw("select * from \r\n(select requete.* from (select distinct idrequete from \r\n(select tab.* from (select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif \r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif and justificatif.EtatValidation = 5 ) tab\r\njoin (select distinct circuitetape.idcircuit from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 \r\non tab.idCircuit = tab2.idCircuit) tab3 join justificatif on justificatif.idJustif = tab3.idJustif) tab4 \r\njoin requete on tab4.idrequete = requete.idrequete where requete.cloturedate is null\r\nUNION\r\nselect tab9.* from (select requete.* from\r\n(select distinct requeterubrique.idrequete from requeterubrique \r\njoin typerubrique on requeterubrique.idtyperubrique = typerubrique.idtyperubrique and typerubrique.needJustificatif = 0) tab6\r\njoin requete on requete.idrequete = tab6.idrequete where etatValidation = 5) tab9\r\njoin\r\n(select circuitrequete.idrequete from\r\n(select distinct circuitetape.idcircuit from circuitEtapeValidateur  \r\njoin circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p1) tab7\r\njoin circuitrequete on circuitrequete.idcircuit = tab7.idcircuit) tab8\r\non tab9.idrequete = tab8.idrequete) a_cloturer\r\n\r\n", idUtilisateur,idUtilisateur).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesAcloturerByPage(int idUtilisateur,int page)//idvalidateur
        {
            var result = _context.Requete.FromSqlRaw("select * from \r\n(select requete.* from (select distinct idrequete from \r\n(select tab.* from (select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif \r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif and justificatif.EtatValidation = 5 ) tab\r\njoin (select distinct circuitetape.idcircuit from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 \r\non tab.idCircuit = tab2.idCircuit) tab3 join justificatif on justificatif.idJustif = tab3.idJustif) tab4 \r\njoin requete on tab4.idrequete = requete.idrequete where requete.cloturedate is null\r\nUNION\r\nselect tab9.* from (select requete.* from\r\n(select distinct requeterubrique.idrequete from requeterubrique \r\njoin typerubrique on requeterubrique.idtyperubrique = typerubrique.idtyperubrique and typerubrique.needJustificatif = 0) tab6\r\njoin requete on requete.idrequete = tab6.idrequete where etatValidation = 5) tab9\r\njoin\r\n(select circuitrequete.idrequete from\r\n(select distinct circuitetape.idcircuit from circuitEtapeValidateur  \r\njoin circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p1) tab7\r\njoin circuitrequete on circuitrequete.idcircuit = tab7.idcircuit) tab8\r\non tab9.idrequete = tab8.idrequete) a_cloturer\r\n\r\n ORDER BY idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur,idUtilisateur,page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesAcloturerByPageAndWord(int idUtilisateur,string word, int page)//idvalidateur
        {
            var result = _context.Requete.FromSqlRaw("select count(idrequete) value from (select a_cloturer.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from \r\n(select requete.* from (select distinct idrequete from \r\n(select tab.* from (select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif \r\njoin justificatif on justificatif.idJustif = circuitjustificatif.idJustif and justificatif.EtatValidation = 5 ) tab\r\njoin (select distinct circuitetape.idcircuit from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 \r\non tab.idCircuit = tab2.idCircuit) tab3 join justificatif on justificatif.idJustif = tab3.idJustif) tab4 \r\njoin requete on tab4.idrequete = requete.idrequete where requete.cloturedate is null\r\nUNION\r\nselect tab9.* from (select requete.* from\r\n(select distinct requeterubrique.idrequete from requeterubrique \r\njoin typerubrique on requeterubrique.idtyperubrique = typerubrique.idtyperubrique and typerubrique.needJustificatif = 0) tab6\r\njoin requete on requete.idrequete = tab6.idrequete where etatValidation = 5) tab9\r\njoin\r\n(select circuitrequete.idrequete from\r\n(select distinct circuitetape.idcircuit from circuitEtapeValidateur  \r\njoin circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p1) tab7\r\njoin circuitrequete on circuitrequete.idcircuit = tab7.idcircuit) tab8\r\non tab9.idrequete = tab8.idrequete) a_cloturer\r\njoin site on site.idsite = a_cloturer.idsite\r\njoin projet on projet.idprojet = a_cloturer.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = a_cloturer.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) a_justifier_recherche\r\nwhere nomprojet LIKE @p2 or nomsite LIKE @p2 or referenceInterne LIKE @p2 or objet LIKE @p2 or numRequete LIKE @p2 or nomagmo LIKE @p2 or montant LIKE @p2 or dateExecution LIKE @p2 or dateFinExecution LIKE @p2\r\n  ORDER BY idRequete OFFSET (@p3 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur,idUtilisateur, "%" + word + "%", page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }
        /*--------------*/

        public int GetNbRequetesAClotureesAdmin(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from \r\n(select distinct requete.* from requete\r\njoin justificatif on justificatif.idrequete = requete.idrequete and justificatif.EtatValidation = 5\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\nwhere requete.cloturedate is null\r\nUNION\r\nselect tab9.* from (select requete.* from\r\n(select distinct requeterubrique.idrequete from requeterubrique \r\njoin typerubrique on requeterubrique.idtyperubrique = typerubrique.idtyperubrique and typerubrique.needJustificatif = 0) tab6\r\njoin requete on requete.idrequete = tab6.idrequete\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p1\r\nwhere etatValidation = 5 and cloturedate is null\r\n) tab9\r\n) a_cloturer", idUtilisateur, idUtilisateur).FirstOrDefault();
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

        public int GetNombreRequetesAClotureesAdmin(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from \r\n(select distinct requete.* from requete\r\njoin justificatif on justificatif.idrequete = requete.idrequete and justificatif.EtatValidation = 5\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\nwhere requete.cloturedate is null\r\nUNION\r\nselect tab9.* from (select requete.* from\r\n(select distinct requeterubrique.idrequete from requeterubrique \r\njoin typerubrique on requeterubrique.idtyperubrique = typerubrique.idtyperubrique and typerubrique.needJustificatif = 0) tab6\r\njoin requete on requete.idrequete = tab6.idrequete\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p1\r\nwhere etatValidation = 5 and cloturedate is null\r\n) tab9\r\n) a_cloturer", idUtilisateur, idUtilisateur).FirstOrDefault();
            return (int)result.Value;

        }

        public int GetNbRequetesAClotureesAdminByWord(int idUtilisateur, string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from (select a_cloturer.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from \r\n(select distinct requete.* from requete\r\njoin justificatif on justificatif.idrequete = requete.idrequete and justificatif.EtatValidation = 5\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\nwhere requete.cloturedate is null\r\nUNION\r\nselect tab9.* from (select requete.* from\r\n(select distinct requeterubrique.idrequete from requeterubrique \r\njoin typerubrique on requeterubrique.idtyperubrique = typerubrique.idtyperubrique and typerubrique.needJustificatif = 0) tab6\r\njoin requete on requete.idrequete = tab6.idrequete\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p1\r\nwhere etatValidation = 5 and cloturedate is null\r\n) tab9\r\n) a_cloturer\r\njoin site on site.idsite = a_cloturer.idsite\r\njoin projet on projet.idprojet = a_cloturer.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = a_cloturer.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) a_justifier_recherche\r\nwhere nomprojet LIKE @p2 or nomsite LIKE @p2 or referenceInterne LIKE @p2 or objet LIKE @p2 or numRequete LIKE @p2 or nomagmo LIKE @p2 or montant LIKE @p2 or dateExecution LIKE @p2 or dateFinExecution LIKE @p2", idUtilisateur, idUtilisateur, "%" + word + "%").FirstOrDefault();
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

        public List<Requete> GetRequetesAcloturerAdmin(int idUtilisateur)//idvalidateur
        {
            var result = _context.Requete.FromSqlRaw("select requete.* from \r\n(select distinct requete.* from requete\r\njoin justificatif on justificatif.idrequete = requete.idrequete and justificatif.EtatValidation = 5\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\nwhere requete.cloturedate is null\r\nUNION\r\nselect tab9.* from (select requete.* from\r\n(select distinct requeterubrique.idrequete from requeterubrique \r\njoin typerubrique on requeterubrique.idtyperubrique = typerubrique.idtyperubrique and typerubrique.needJustificatif = 0) tab6\r\njoin requete on requete.idrequete = tab6.idrequete\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p1\r\nwhere etatValidation = 5 and cloturedate is null\r\n) tab9\r\n) a_cloturer", idUtilisateur, idUtilisateur).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesAcloturerAdminByPage(int idUtilisateur, int page)//idvalidateur
        {
            var result = _context.Requete.FromSqlRaw("select * from \r\n(select distinct requete.* from requete\r\njoin justificatif on justificatif.idrequete = requete.idrequete and justificatif.EtatValidation = 5\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\nwhere requete.cloturedate is null\r\nUNION\r\nselect tab9.* from (select requete.* from\r\n(select distinct requeterubrique.idrequete from requeterubrique \r\njoin typerubrique on requeterubrique.idtyperubrique = typerubrique.idtyperubrique and typerubrique.needJustificatif = 0) tab6\r\njoin requete on requete.idrequete = tab6.idrequete\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p1\r\nwhere etatValidation = 5 and cloturedate is null\r\n) tab9\r\n) a_cloturer ORDER BY idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, idUtilisateur, page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesAcloturerAdminByPageAndWord(int idUtilisateur, string word, int page)//idvalidateur
        {
            var result = _context.Requete.FromSqlRaw("select * from (select a_cloturer.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from \r\n(select distinct requete.* from requete\r\njoin justificatif on justificatif.idrequete = requete.idrequete and justificatif.EtatValidation = 5\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\nwhere requete.cloturedate is null\r\nUNION\r\nselect tab9.* from (select requete.* from\r\n(select distinct requeterubrique.idrequete from requeterubrique \r\njoin typerubrique on requeterubrique.idtyperubrique = typerubrique.idtyperubrique and typerubrique.needJustificatif = 0) tab6\r\njoin requete on requete.idrequete = tab6.idrequete\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p1\r\nwhere etatValidation = 5 and cloturedate is null\r\n) tab9\r\n) a_cloturer\r\njoin site on site.idsite = a_cloturer.idsite\r\njoin projet on projet.idprojet = a_cloturer.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = a_cloturer.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) a_justifier_recherche\r\nwhere nomprojet LIKE @p2 or nomsite LIKE @p2 or referenceInterne LIKE @p2 or objet LIKE @p2 or numRequete LIKE @p2 or nomagmo LIKE @p2 or montant LIKE @p2 or dateExecution LIKE @p2 or dateFinExecution LIKE @p2 ORDER BY idRequete OFFSET (@p3 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, idUtilisateur, "%" + word + "%", page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        /*--------------*/
        public int GetNbRequetesCloturees(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from requete where cloturedate is not null and requete.idUtilisateur = @p0", idUtilisateur).FirstOrDefault();
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

        public int GetNombreRequetesCloturees(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from requete where cloturedate is not null and requete.idUtilisateur = @p0", idUtilisateur).FirstOrDefault();
            return (int)result.Value;
            
        }

        public int GetNbRequetesClotureesByWord(int idUtilisateur, string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from (select requete.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from requete \r\njoin site on site.idsite = requete.idsite\r\njoin projet on projet.idprojet = requete.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = requete.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere cloturedate is not null and requete.idUtilisateur = @p0) tab\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1 ", idUtilisateur, "%" + word + "%").FirstOrDefault();
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

        public List<Requete> GetRequetescloturees(int idUtilisateur)
        {
            var result = _context.Requete.FromSqlRaw("select * from requete where cloturedate is not null and idUtilisateur = @p0", idUtilisateur).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesclotureesByPage(int idUtilisateur,int page)
        {
            var result = _context.Requete.FromSqlRaw("select * from requete where cloturedate is not null and idUtilisateur = @p0 ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur,page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesclotureesByPageAndWord(int idUtilisateur,string word, int page)
        {
            var result = _context.Requete.FromSqlRaw("select * from (select requete.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from requete \r\njoin site on site.idsite = requete.idsite\r\njoin projet on projet.idprojet = requete.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = requete.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere cloturedate is not null and requete.idUtilisateur = @p0) tab\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1 ORDER BY idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%" + word + "%", page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }


        /*--------------*/
        public int GetNbRequetesRefusees(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select * from requete where etatValidation = 2 and idUtilisateur = @p0", idUtilisateur).FirstOrDefault();
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

        public List<Requete> GetRequetesRefusees(int idUtilisateur)
        {
            var result = _context.Requete.FromSqlRaw("select * from requete where etatValidation = 2 and idUtilisateur = @p0", idUtilisateur).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public int GetNbRequetesRefuseesByWord(int idUtilisateur, string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from\r\n(select tab3.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from\r\n(select * from requete where EtatValidation = 2 and idUtilisateur = @p0) tab3\r\njoin site on site.idsite = tab3.idsite\r\njoin projet on projet.idprojet = tab3.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = tab3.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) tab4\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1", idUtilisateur, "%" + word + "%").FirstOrDefault();
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

        public List<Requete> GetRequetesRefuseesByPage(int idUtilisateur, int page)
        {
            var result = _context.Requete.FromSqlRaw("select * from requete where idutilisateur = @p0 and etatvalidation = 2 ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesRefuseesByPageAndWord(int idUtilisateur, string word,int page)
        {
            var result =  _context.Requete.FromSqlRaw("select count(idrequete) value from\r\n(select tab3.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from\r\n(select * from requete where EtatValidation = 2 and idUtilisateur = @p0) tab3\r\njoin site on site.idsite = tab3.idsite\r\njoin projet on projet.idprojet = tab3.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = tab3.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) tab4\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1 ORDER BY idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%" + word + "%",page).ToList();
            return result;
        }


        /*--------------*/
        public int GetNbRequetesRefuseesValidateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(tab3.idrequete) value from\r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.EtatValidation = 2 ) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin requete on requete.idrequete = tab3.idrequete", idUtilisateur).FirstOrDefault();
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

        public int GetNombreRequetesRefuseesValidateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(tab3.idrequete) value from\r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.EtatValidation = 2 ) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin requete on requete.idrequete = tab3.idrequete", idUtilisateur).FirstOrDefault();
            return (int)result.Value;
            
        }

        public int GetNbRequetesRefuseesValidateurByWord(int idUtilisateur, string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from\r\n(select requete.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from\r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.EtatValidation = 2 ) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin requete on requete.idrequete = tab3.idrequete\r\njoin site on site.idsite = requete.idsite\r\njoin projet on projet.idprojet = requete.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = requete.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) tab4\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1 ", idUtilisateur, "%" + word ).FirstOrDefault();
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


        public List<Requete> GetRequetesRefuseesValidateur(int idUtilisateur)
        {
            var result = _context.Requete.FromSqlRaw("select requete.* from\r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.EtatValidation = 2 ) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin requete on requete.idrequete = tab3.idrequete", idUtilisateur).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesRefuseesValidateurByPage(int idUtilisateur, int page)
        {
            var result = _context.Requete.FromSqlRaw("select requete.* from\r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.EtatValidation = 2 ) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin requete on requete.idrequete = tab3.idrequete ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur,page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesRefuseesValidateurByPageAndWord(int idUtilisateur,string word, int page)
        {
            var result = _context.Requete.FromSqlRaw("select * from\r\n(select requete.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from\r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.EtatValidation = 2 ) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin requete on requete.idrequete = tab3.idrequete\r\njoin site on site.idsite = requete.idsite\r\njoin projet on projet.idprojet = requete.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = requete.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) tab4\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1  ORDER BY idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%" + word + "%", page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }
        /*--------------*/
        public int GetNbRequetesRefuseesAdmin(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(requete.idrequete) value from requete \r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\nwhere requete.EtatValidation = 2", idUtilisateur).FirstOrDefault();
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

        public int GetNombreRequetesRefuseesAdmin(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(requete.idrequete) value from requete \r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\nwhere requete.EtatValidation = 2", idUtilisateur).FirstOrDefault();
            return (int)result.Value;

        }

        public int GetNbRequetesRefuseesAdminByWord(int idUtilisateur, string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from (\r\nselect requete.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from requete \r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\njoin site on site.idsite = requete.idsite join projet on projet.idprojet = requete.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = requete.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere requete.EtatValidation = 2) tab\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1 ", idUtilisateur, "%" + word + "%").FirstOrDefault();
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


        public List<Requete> GetRequetesRefuseesAdmin(int idUtilisateur)
        {
            var result = _context.Requete.FromSqlRaw("select requete.* from requete \r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\nwhere requete.EtatValidation = 2", idUtilisateur).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesRefuseesAdminByPage(int idUtilisateur, int page)
        {
            var result = _context.Requete.FromSqlRaw("select requete.* from requete \r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\nwhere requete.EtatValidation = 2 ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesRefuseesAdminByPageAndWord(int idUtilisateur, string word, int page)
        {
            var result = _context.Requete.FromSqlRaw("select * from (\r\nselect requete.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from requete \r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\njoin site on site.idsite = requete.idsite join projet on projet.idprojet = requete.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = requete.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere requete.EtatValidation = 2) tab\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1   ORDER BY idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%" + word + "%", page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }
        /*--------------*/
        public int GetNbRequetesClotureesValidateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(requete.idrequete) value from\r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.cloturedate is not null ) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin requete on requete.idrequete = tab3.idrequete", idUtilisateur).FirstOrDefault();
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

        public int GetNombreRequetesClotureesValidateur(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(requete.idrequete) value from\r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.cloturedate is not null ) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin requete on requete.idrequete = tab3.idrequete", idUtilisateur).FirstOrDefault();
            return (int)result.Value;
            
        }

        public int GetNbRequetesClotureesValidateurByWord(int idUtilisateur, string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from (select requete.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from\r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.cloturedate is not null ) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin requete on requete.idrequete = tab3.idrequete\r\njoin site on site.idsite = requete.idsite\r\njoin projet on projet.idprojet = requete.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = requete.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) tab4\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1", idUtilisateur, "%" + word + "%").FirstOrDefault();
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

        public List<Requete> GetRequetesClotureesValidateur(int idUtilisateur)
        {
            var result = _context.Requete.FromSqlRaw("select requete.* from\r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.cloturedate is not null ) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin requete on requete.idrequete = tab3.idrequete", idUtilisateur).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesClotureesValidateurByPage(int idUtilisateur,int page)
        {
            var result = _context.Requete.FromSqlRaw("select requete.* from\r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.cloturedate is not null ) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin requete on requete.idrequete = tab3.idrequete ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur,page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesClotureesValidateurByPageAndWord(int idUtilisateur,string word, int page)
        {
            var result = _context.Requete.FromSqlRaw("select * from (select requete.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from\r\n(select tab.* from\r\n(select  circuitrequete.*,requete.EtatValidation from circuitrequete\r\njoin requete on requete.idRequete = circuitrequete.idRequete and requete.cloturedate is not null ) tab\r\njoin (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3\r\njoin requete on requete.idrequete = tab3.idrequete\r\njoin site on site.idsite = requete.idsite\r\njoin projet on projet.idprojet = requete.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = requete.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo) tab4\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1 ORDER BY idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%" + word + "%", page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }
        /*--------------*/

        public int GetNbRequetesClotureesAdmin(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from requete \r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\nwhere cloturedate is not null", idUtilisateur).FirstOrDefault();
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

        public int GetNombreRequetesClotureesAdmin(int idUtilisateur)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from requete \r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\nwhere cloturedate is not null", idUtilisateur).FirstOrDefault();
            return (int)result.Value;

        }

        public int GetNbRequetesClotureesAdminByWord(int idUtilisateur, string word)
        {
            IntResult result = _context.Set<IntResult>().FromSqlRaw("select count(idrequete) value from (select requete.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from requete\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\njoin site on site.idsite = requete.idsite\r\njoin projet on projet.idprojet = requete.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = requete.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere cloturedate is not null) tab\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1", idUtilisateur, "%" + word + "%").FirstOrDefault();
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

        public List<Requete> GetRequetesClotureesAdmin(int idUtilisateur)
        {
            var result = _context.Requete.FromSqlRaw("select * from requete \r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\nwhere cloturedate is not null", idUtilisateur).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesClotureesAdminByPage(int idUtilisateur, int page)
        {
            var result = _context.Requete.FromSqlRaw("select requete.* from requete \r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\nwhere cloturedate is not null ORDER BY idRequete OFFSET (@p1 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        public List<Requete> GetRequetesClotureesAdminByPageAndWord(int idUtilisateur, string word, int page)
        {
            var result = _context.Requete.FromSqlRaw("select * from (select requete.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from requete\r\njoin utilisateurProjet on utilisateurProjet.idProjet = requete.idProjet and utilisateurProjet.idUtilisateur = @p0\r\njoin site on site.idsite = requete.idsite\r\njoin projet on projet.idprojet = requete.idprojet\r\njoin utilisateur on utilisateur.idUtilisateur = requete.idutilisateur\r\njoin agmo on agmo.idagmo = utilisateur.idagmo\r\nwhere cloturedate is not null) tab\r\nwhere nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1 ORDER BY idRequete OFFSET (@p2 - 1) * 10 ROWS FETCH NEXT 10 ROWS ONLY", idUtilisateur, "%" + word + "%", page).Include(r => r.Projet).Include(r => r.Site).ToList();
            return result;
        }

        /*--------------*/
        public List<Requete> GetRequetesAalerter()
        {
            var result = _context.Requete.FromSqlRaw("select tab3.* from\r\n(select tab2.* from\r\n(select tab1.* from\r\n(select tab.*, COALESCE(idJustif,0) justif from \r\n(select * from requete where EtatValidation = 4 ) tab\r\nleft join justificatif on tab.idrequete = justificatif.idrequete) tab1\r\nwhere justif = 0) tab2 where datefinexecution < CAST(GETDATE() AS DATE)) tab3\r\nWHERE DATEDIFF(DAY, dateFinExecution, GETDATE()) between 15 and 30").Include(r => r.Utilisateur).ThenInclude(u => u.Agmo).AsNoTracking().ToList();
            return result;
        }

        public List<Requete> GetRequetesAalerterApresEcheance()
        {
            var result = _context.Requete.FromSqlRaw("select tab3.* from\r\n(select tab2.* from\r\n(select tab1.* from\r\n(select tab.*, COALESCE(idJustif,0) justif from \r\n(select * from requete where EtatValidation = 5 ) tab\r\nleft join justificatif on tab.idrequete = justificatif.idrequete) tab1\r\nwhere justif = 0) tab2 where datefinexecution < CAST(GETDATE() AS DATE)) tab3\r\nWHERE DATEDIFF(DAY, dateFinExecution, GETDATE()) >= 30").Include(r => r.Utilisateur).ThenInclude(u => u.Agmo).AsNoTracking().ToList();
            return result;
        }
        /*--------------*/
        public int GetEtapeActuelleForValidation(int idRequete)
        {
            var result = _context.Set<IntResult>().FromSqlRaw(@"
        select circuitetape.numero value from
(select tab1.*,row_number() over (partition by idrequete order by idcircuitetape) as rank2 from 
(select * from (select historiquevalidationrequete.* ,  row_number() over (partition by idrequete,idcircuitetape order by etatValidation desc) as rank from historiquevalidationrequete where idrequete = @p0  ) tab
where rank = 1) tab1 where etatvalidation = 0 and dateValidation is null) tab2
join circuitetape on circuitetape.idcircuitetape = tab2.idcircuitetape where rank2 = 1
    ", idRequete).FirstOrDefault();

            return (int)result.Value;
        }
        /*--------------*/
        public List<object> GetRequetesWithNames()
        {
            return _context.Requete
                //.Include(r => r.Activite)
                .Include(r => r.Projet)
                .Include(r => r.Utilisateur)
                .Select(r => new {
                    r.IdRequete,
                    r.IdUtilisateur,
                    UtilisateurNom = r.Utilisateur.firstname + " " + r.Utilisateur.lastname,
                    r.IdProjet,
                    ProjetNom = r.Projet.nom,
                    //r.IdActivite,
                    //ActiviteCode = r.Activite.code,
                    //ActiviteNom = r.Activite.nom,
                    r.Description,
                    r.DateExecution,
                    r.Montant
                })
                .ToList<object>();
        }

        //Verify if a Requete exists by its NumRequete
        public bool ExistsByNumRequete(string numRequete)
        {
            return _context.Requete.Any(r => r.NumRequete == numRequete);
        }
    }
}
