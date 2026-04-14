using Microsoft.EntityFrameworkCore;

namespace UCP_API.dto
{
    [Keyless]
    public class DashboardMontantDTO
    {
        public string Projet { get; set; }
        public string Site { get; set; }
        public string NumeroRequete { get; set; }
        public string Objet { get; set; }
        public string AGMO { get; set; }

        public decimal MontantInitial { get; set; }
        public decimal MontantValide { get; set; }
    }
}