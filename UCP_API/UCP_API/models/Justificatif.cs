using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using UCP_API.dto;
using System.Text.Json.Serialization;

namespace UCP_API.models
{
    public class Justificatif
    {
        [Key]           
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdJustif { get; set; }
        //public int IdTypeRequete { get; set; }
        public int IdUtilisateur { get; set; }
        [ForeignKey("IdUtilisateur")]
        public virtual Utilisateur? Utilisateur { get; set; }
        public int IdRequete { get; set; }
        [ForeignKey("IdRequete")]
        public virtual Requete? Requete { get; set; }
        public string? Numero { get; set; }
        public DateTime CreationDate { get; set; }
        public int EtatValidation { get; set; }
        public string Objet { get; set; }
        public string? message { get; set; }
        public double? Montant { get; set; }
        public double? MontantValide { get; set; }
        public bool? ManquePj { get; set; }
        public string? CommentaireRevision { get; set; }

        [NotMapped]
        public List<JustifDetails>? JustifDetails { get; set; }

        [NotMapped]
        public CircuitEtapeCheckListDetailsDTO? CircuitEtapeCheckListDetailsDTO { get; set; }



        public ICollection<JustificatifAccuse?>? JustificatifAccuses { get; set; } = new List<JustificatifAccuse>();

        [NotMapped]
        public JustificatifAccuse? JustificatifAccuse { get; set; }
        public Justificatif()
        {

        }
    }
}
