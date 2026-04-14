using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class HistoriqueValidationRequetePjRepository
    {
        private readonly AppDbContext _context;
        public HistoriqueValidationRequetePjRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all HistoriqueValidationRequetePj
        public List<HistoriqueValidationRequetePj> GetHistoriqueValidationRequetePjs()
        {
            return _context.HistoriqueValidationRequetePj.ToList();
        }

        public List<HistoriqueValidationRequetePj> GetHistoriqueValidationRequetePjsByRequete(int id_requete)
        {
            return _context.HistoriqueValidationRequetePj.FromSqlRaw("select historiquevalidationrequetepj.* from historiquevalidationrequetepj\r\njoin (select * from historiquevalidationrequete where idrequete = @p0 and etatvalidation !=0) tab \r\non historiquevalidationrequetepj.idhistoriquevalidationrequete = tab.idhistoriquevalidationrequete", id_requete).ToList();
        }

        // Get HistoriqueValidationRequetePj by Id
        public HistoriqueValidationRequetePj GetHistoriqueValidationRequetePjById(int id)
        {
            return _context.HistoriqueValidationRequetePj.FirstOrDefault(t => t.IdHistoriqueValidationRequetePj == id);
        }

        // Add a new HistoriqueValidationRequetePj
        public void AddHistoriqueValidationRequetePj(HistoriqueValidationRequetePj HistoriqueValidationRequetePj)
        {
            _context.HistoriqueValidationRequetePj.Add(HistoriqueValidationRequetePj);
            _context.SaveChanges();
        }

        // Update a HistoriqueValidationRequetePj
        public void UpdateHistoriqueValidationRequetePj(HistoriqueValidationRequetePj HistoriqueValidationRequetePj)
        {
            _context.HistoriqueValidationRequetePj.Update(HistoriqueValidationRequetePj);
            _context.SaveChanges();
        }

        // Delete a HistoriqueValidationRequetePj
        public void DeleteHistoriqueValidationRequetePj(int id)
        {
            var HistoriqueValidationRequetePj = _context.HistoriqueValidationRequetePj.Find(id);
            if (HistoriqueValidationRequetePj != null)
            {
                _context.HistoriqueValidationRequetePj.Remove(HistoriqueValidationRequetePj);
                _context.SaveChanges();
            }
        }

        public List<HistoriqueValidationRequetePj> GetHistoriqueValidationRequetePjsByRequeteNotDeleted(int id_requete)
        {
            return _context.HistoriqueValidationRequetePj.FromSqlRaw("select historiquevalidationrequetepj.* from historiquevalidationrequetepj\r\njoin (select * from historiquevalidationrequete where idrequete = @p0 and etatvalidation !=0) tab \r\non historiquevalidationrequetepj.idhistoriquevalidationrequete = tab.idhistoriquevalidationrequete where historiquevalidationrequetepj.DateSuppression is null", id_requete).ToList();
        }

        public List<HistoriqueValidationRequetePj> GetHistoriqueValidationRequetePjsByRequeteDeleted(int id_requete)
        {
            return _context.HistoriqueValidationRequetePj.FromSqlRaw("select historiquevalidationrequetepj.* from historiquevalidationrequetepj\r\njoin (select * from historiquevalidationrequete where idrequete = @p0 and etatvalidation !=0) tab \r\non historiquevalidationrequetepj.idhistoriquevalidationrequete = tab.idhistoriquevalidationrequete where historiquevalidationrequetepj.DateSuppression is not null", id_requete).ToList();
        }

        public void SoftDeleteHistoriqueValidationRequetePj(int id)
        {
            _context.Database.ExecuteSqlRaw("update historiquevalidationrequetepj set dateSuppression = @p0 where idhistoriquevalidationrequetepj = @p1", DateTime.Now, id);
            _context.SaveChanges();
        }
    }
}
