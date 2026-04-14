using Microsoft.EntityFrameworkCore;


namespace UCP_API.dto
{
    [Keyless]
    public class DashboardSuiviTraitementRequeteDto
    {
        public string Projet { get; set; }
        public string Site { get; set; }
        public string NumeroRequete { get; set; }
        public string ReferenceInterne { get; set; }
        public string Objet { get; set; }

        // Dictionnaire pour stocker les durées par numéro d'étape
        public Dictionary<int, double> DureesParEtape { get; set; } = new Dictionary<int, double>();
    }

    // Pour retourner les étapes du circuit
    public class CircuitEtapesDto
    {
        public int Numero { get; set; }
        public string Description { get; set; }
    }
}