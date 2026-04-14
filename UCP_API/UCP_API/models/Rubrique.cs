using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.models
{
    public class Rubrique
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdRubrique { get; set; }
        public string Nom { get; set; }

        //pour obtenir les détails de requete
        [NotMapped]
        public List<RequeteRubrique>? RequeteRubriques { get; set; }

        [NotMapped]
        public double? Montant { get; set; }


        //justificatifs (requete,categorie)
        [NotMapped]
        public List<double?>? MontantJustifs { get; set; }
        //reste justificatif
        [NotMapped]
        public double? Reste { get; set; }

        public Rubrique()
        {

        }

        public void CalculateReste()
        {
            double reste = 0;
            double totalMontantJustifs = 0;
            for(int i = 0; i < MontantJustifs.Count(); i++)
            {
                totalMontantJustifs = totalMontantJustifs + (double) MontantJustifs[i];
            }
            reste = (double) Montant - totalMontantJustifs;
            this.Reste = reste;
            Console.WriteLine(this.Montant);
        }
    }
}
