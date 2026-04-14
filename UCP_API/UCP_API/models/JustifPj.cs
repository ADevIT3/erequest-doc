using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.models
{
    public class JustifPj
    {
        [Key]           
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdJustifPj { get; set; }
     
        public int IdJustif { get; set; }
        [ForeignKey("IdJustif")]
        public virtual Justificatif Justificatif { get; set; }
       
        public string Src { get; set; }

        public DateTime DateCreation { get; set; }

        public JustifPj()
        {

        }
    }
}
