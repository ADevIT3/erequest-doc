using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using UCP_API.models;

namespace UCP_API.dto
{
    public class UtilisateurDTO
    {

        public int IdUtilisateur { get; set; }
        public string username { get; set; }

        public string password { get; set; }

        public string? phonenumber { get; set; }


        public string email { get; set; }

        public int idrole { get; set; }

        public string? firstname { get; set; }

        public string lastname { get; set; }

        public string fonction { get; set; }

        public string storage { get; set; }

        public int isReceivedRequete { get; set; }

        public int idAgmo { get; set; }

        public bool isClotureur { get; set; }

        public bool canDeleteAttachment { get; set; }

        public UtilisateurDTO()
        {

        }
    }
}