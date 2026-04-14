using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.models
{
    public class JustificatifDTO
    {
        [Key]           
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdJustif { get; set; }
        public int IdUtilisateur { get; set; }
        public int IdRequete { get; set; }
        public string Numero { get; set; }
        public DateTime? CreationDate { get; set; }
        public int EtatValidation { get; set; }
        public string Objet { get; set; }

        public List<JustifDetailsDTO> Details { get; set; }
        
        public JustificatifDTO()
        {

        }
    }
}
