using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class HistoriqueValidationJustificatifPjRepository
    {
        private readonly AppDbContext _context;
        public HistoriqueValidationJustificatifPjRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all HistoriqueValidationJustificatifPj
        public List<HistoriqueValidationJustificatifPj> GetHistoriqueValidationJustificatifPjs()
        {
            return _context.HistoriqueValidationJustificatifPj.ToList();
        }

        public List<HistoriqueValidationJustificatifPj> GetHistoriqueValidationJustificatifPjsByRequete(int idjustif)
        {
            return _context.HistoriqueValidationJustificatifPj.FromSqlRaw(
                @"SELECT h.* FROM historiquevalidationjustificatifpj h
                  JOIN historiquevalidationjustificatif hvj ON h.idhistoriquevalidationjustificatif = hvj.idhistoriquevalidationjustificatif
                  WHERE hvj.idjustif = @p0 AND hvj.etatvalidation != 0",
                idjustif).ToList();
        }

        // Get HistoriqueValidationJustificatifPj by Id
        public HistoriqueValidationJustificatifPj GetHistoriqueValidationJustificatifPjById(int id)
        {
            return _context.HistoriqueValidationJustificatifPj.FirstOrDefault(t => t.IdHistoriqueValidationJustificatifPj == id);
        }

        // Add a new HistoriqueValidationJustificatifPj
        public void AddHistoriqueValidationJustificatifPj(HistoriqueValidationJustificatifPj HistoriqueValidationJustificatifPj)
        {
            _context.HistoriqueValidationJustificatifPj.Add(HistoriqueValidationJustificatifPj);
            _context.SaveChanges();
        }

        // Update a HistoriqueValidationJustificatifPj
        public void UpdateHistoriqueValidationJustificatifPj(HistoriqueValidationJustificatifPj HistoriqueValidationJustificatifPj)
        {
            _context.HistoriqueValidationJustificatifPj.Update(HistoriqueValidationJustificatifPj);
            _context.SaveChanges();
        }

        // Delete a HistoriqueValidationJustificatifPj (hard delete)
        public void DeleteHistoriqueValidationJustificatifPj(int id)
        {
            var HistoriqueValidationJustificatifPj = _context.HistoriqueValidationJustificatifPj.Find(id);
            if (HistoriqueValidationJustificatifPj != null)
            {
                _context.HistoriqueValidationJustificatifPj.Remove(HistoriqueValidationJustificatifPj);
                _context.SaveChanges();
            }
        }

        public List<HistoriqueValidationJustificatifPj> GetHistoriqueValidationJustificatifPjsByRequeteNotDeleted(int idjustif)
        {
            return _context.HistoriqueValidationJustificatifPj.FromSqlRaw(
                @"SELECT h.* FROM historiquevalidationjustificatifpj h
                  JOIN historiquevalidationjustificatif hvj ON h.idhistoriquevalidationjustificatif = hvj.idhistoriquevalidationjustificatif
                  WHERE hvj.idjustif = @p0 AND hvj.etatvalidation != 0 AND h.DateSuppression IS NULL",
                idjustif).ToList();
        }

        public List<HistoriqueValidationJustificatifPj> GetHistoriqueValidationJustificatifPjsByRequeteDeleted(int idjustif)
        {
            return _context.HistoriqueValidationJustificatifPj.FromSqlRaw(
                @"SELECT h.* FROM historiquevalidationjustificatifpj h
                  JOIN historiquevalidationjustificatif hvj ON h.idhistoriquevalidationjustificatif = hvj.idhistoriquevalidationjustificatif
                  WHERE hvj.idjustif = @p0 AND hvj.etatvalidation != 0 AND h.DateSuppression IS NOT NULL",
                idjustif).ToList();
        }

        // Soft delete (same as RequetePj)
        public void SoftDeleteHistoriqueValidationJustificatifPj(int id)
        {
            var entity = _context.HistoriqueValidationJustificatifPj.Find(id);
            if (entity != null)
            {
                entity.DateSuppression = DateTime.Now;
                _context.HistoriqueValidationJustificatifPj.Update(entity);
                _context.SaveChanges();
            }
        }

        // Alternative: Using ExecuteSqlRaw (like in RequetePj)
        public void SoftDeleteHistoriqueValidationJustificatifPjRaw(int id)
        {
            _context.Database.ExecuteSqlRaw(
                "UPDATE historiquevalidationjustificatifpj SET dateSuppression = @p0 WHERE idhistoriquevalidationjustificatifpj = @p1",
                DateTime.Now, id);
            _context.SaveChanges();
        }
    }
}