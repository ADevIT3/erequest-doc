using Microsoft.EntityFrameworkCore;

namespace UCP_API.dto
{
    [Keyless]
    public class DashboardRetardDTO
    {

        public string Projet { get; set; }
        public string Site { get; set; }
        public string NumeroRequete { get; set; }
        public string Objet { get; set; }
        public string AGMO { get; set; }

        public int DureeTotaleCircuit { get; set; }  // correspond à SUM(e.duree)
        public int RetardHeures { get; set; }       // Retard en heures
        public int A_risque { get; set; }

    }
}