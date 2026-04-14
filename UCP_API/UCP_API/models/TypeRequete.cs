using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UCP_API.models
{
    public class TypeRequete
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdTypeRequete { get; set; }
        public string Nom { get; set; }
        public int? DelaiJustification { get; set; }
        public string ModeJustification { get; set; } // "Unique" ou "Multiple"

        public TypeRequete()
        {

        }
    }
}