namespace UCP_API.dto
{
    public class RedirectionRequeteDTO
    {
        public string commentaire { get; set; } = "";
        public int idCircuitEtapeActuelle { get; set; }
        public int idCircuitEtapeRedirection { get; set; }
    }
}