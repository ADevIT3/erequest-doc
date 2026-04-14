using UCP_API.models;

namespace UCP_API.dto
{
    public class UtilisateurProjetsSites
    {
        public Utilisateur Utilisateur { get; set; }
        public List<int> Projets { get; set; }
        public List<int> Sites { get; set; }

        public List<string> MailsCC { get; set; }
    }
}