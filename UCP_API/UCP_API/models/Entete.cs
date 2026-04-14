using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using UCP_API.data;

namespace UCP_API.models
{

    public class Entete
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int idEntete { get; set; }
        public int idUtilisateurAGMO { get; set; }
        public string? firstn { get; set; }
        public string? seconden { get; set; }
        public string? thirdn { get; set; }
        public string? fourthn { get; set; }
        public string? fifthn { get; set; }
        public DateTime? creationdate { get; set; }
        public int createdby { get; set; }

        public Entete()
        {

        }
    }
}