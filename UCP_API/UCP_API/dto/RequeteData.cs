using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.dto
{
    public class RequeteData
    {
        public int IdUtilisateur { get; set; }
        public int IdProjet { get; set; }
        public int IdSite { get; set; }
        public int IdTypeRequete { get; set; }
        //public int IdCircuit { get; set; }
        //public int IdCircuitEtape { get; set; }
        //public int EtatValidation { get; set; }        
        //public string ActiviteTom { get; set; }
        public string Description { get; set; }
        public string NumRequete { get; set; }
        public string Objet { get; set; }
        public string NumActiviteInterne { get; set; }
        public string IntituleActiviteInterne { get; set; }
        public string Lieu { get; set; }

        public string? Copie_a { get; set; }

        public string? Compte_rendu { get; set; }
        public string? PourInformations { get; set; }

        public DateOnly? DateExecution { get; set; }

        public DateOnly? DateFinExecution { get; set; }
        public DateOnly? DateSoumission { get; set; }
        public RequeteRubriqueDTO[] RequeteRubriques { get; set; }
        public RequeteData()
        {

        }
    }
}
