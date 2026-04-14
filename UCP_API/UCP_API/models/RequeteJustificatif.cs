using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.models
{
    public class RequeteJustificatif
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdRequeteJustificatif { get; set; }
        public int IdRequete { get; set; }
        [ForeignKey("IdRequete")]
        public virtual Requete? Requete { get; set; }
        public string Src { get; set; }
        public DateTime DateCreation { get; set; }

        public RequeteJustificatif()
        {
        
        }
    }
}
