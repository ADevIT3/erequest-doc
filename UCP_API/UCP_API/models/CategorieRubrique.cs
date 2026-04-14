using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Reflection.Metadata;

namespace UCP_API.models
{
    public class CategorieRubrique
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdCategorieRubrique { get; set; }
        public string Nom { get; set; }
       
       [NotMapped]
        public List<CategorieRubriqueColonne>? CategorieRubriqueColonnes { get; set; }
        [NotMapped]
        public List<Rubrique>? Rubriques { get; set; }

        [NotMapped]
        public List<RequeteRubrique>? RequeteRubriques { get; set; }

        [NotMapped]
        public List<double?>? MontantJustifs { get; set; }

        [NotMapped]
        public double? Montant { get; set; }

        [NotMapped]
        public double? Reste { get; set; }


        public CategorieRubrique()
        {

        }

        public void CalculateReste()
        {
            double reste = 0;
            double totalMontantJustifs = 0;
            for (int i = 0; i < MontantJustifs.Count(); i++)
            {
                totalMontantJustifs = totalMontantJustifs + (double)MontantJustifs[i];
            }
            reste = (double) Montant - totalMontantJustifs;
            this.Reste = reste;
            Console.WriteLine(this.Montant);
        }
    }
}
