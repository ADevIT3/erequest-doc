using System.ComponentModel.DataAnnotations.Schema;


namespace UCP_API.Models
{
    [Table("RouteDistance")]

    public class RouteDistance
    {
        public int Id { get; set; }
        public string Depart { get; set; }
        public string Arrivee { get; set; }
        public int Distance { get; set; }
    }
}