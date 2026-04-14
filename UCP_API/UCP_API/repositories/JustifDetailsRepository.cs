using Microsoft.EntityFrameworkCore;
using UCP_API.data;
using UCP_API.dto;
using UCP_API.models;

namespace UCP_API.repositories
{
    public class JustifDetailsRepository
    {
        private readonly AppDbContext _context;
        public JustifDetailsRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all JustifDetails
        public List<JustifDetails> GetJustifDetailss()
        {
            return _context.JustifDetails.ToList();
        }

       /* public List<double?> GetJustifDetailsByRequeteAndRubriqueAndCategorie(int idRequete, int idRubrique, int idCategorie)
        {
            var result = _context.Set<FloatResult>().FromSqlRaw(@"
        select sum(justifdetails.montant) value from justifdetails join  justificatif on justifdetails.idjustif = justificatif.idjustif where idRequete = @p0 and idRubrique = @p1 and idCategorieRubrique = @p2 group by justifdetails.idjustif
    ", idRequete, idRubrique, idCategorie).ToList();
            List<double?> montants = new List<double?>();
            for(int i = 0; i < result.Count(); i++)
            {
                montants.Add(result[i].Value);
                Console.WriteLine(result[i].Value);
            }
            return montants;
        }*/

        public List<double?> GetJustifDetailsByRequeteAndCategorie(int idRequete,int idCategorie)
        {
            var result = _context.Set<FloatResult>().FromSqlRaw(@"
        select sum(justifdetails.montant) value from justifdetails join  justificatif on justifdetails.idjustif = justificatif.idjustif where idRequete = @p0 and idCategorieRubrique = @p1 group by justifdetails.idjustif
    ", idRequete, idCategorie).ToList();
            List<double?> montants = new List<double?>();
            for (int i = 0; i < result.Count(); i++)
            {
                montants.Add(result[i].Value);
                Console.WriteLine(result[i].Value);
            }
            return montants;
        }

        // Get JustifDetails by Id
        public JustifDetails GetJustifDetailsById(int id)
        {
            return _context.JustifDetails.FirstOrDefault(t => t.IdJustifDetails == id);
        }

        // Get JustifDetails by Id
        public List<JustifDetails> GetJustifDetailsByIdJustificatif(int id)
        {
            return _context.JustifDetails.FromSqlRaw("select * from justifDetails where idJustif = @p0",id).Include(d => d.CategorieRubrique).ToList();
        }


        // Add a new JustifDetails
        public void AddJustifDetails(JustifDetails JustifDetails)
        {
            _context.JustifDetails.Add(JustifDetails);
            _context.SaveChanges();
        }

        // Update a JustifDetails
        public void UpdateJustifDetails(JustifDetails JustifDetails)
        {
            _context.JustifDetails.Update(JustifDetails);
            _context.SaveChanges();
        }

        // Delete a JustifDetails
        public void DeleteJustifDetails(int id)
        {
            var JustifDetails = _context.JustifDetails.Find(id);
            if (JustifDetails != null)
            {
                _context.JustifDetails.Remove(JustifDetails);
                _context.SaveChanges();
            }
        }

    }
}
