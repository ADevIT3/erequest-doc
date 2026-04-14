using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using UCP_API.data;

namespace UCP_API.models
{
    [Table("utilisateur")]
    public class Utilisateur
    {
        [Key]
        [Column("idUtilisateur")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdUtilisateur { get; set; }

        [Column("username")]
        public string username { get; set; }

        [Column("password")]
        public string password { get; set; }
        [Column("PhoneNumber")]
        public string? phonenumber { get; set; }


        [Column("email")]
        public string email { get; set; }

        [Column("idrole")]
        public int idrole { get; set; }

        [Column("firstname")]
        public string? firstname { get; set; }

        [Column("lastname")]
        public string lastname { get; set; }

        [Column("fonction")]
        public string fonction { get; set; }

        [Column("creationDate")]
        public DateTime creationDate { get; set; }

        [Column("createdBy")]
        public int createdBy { get; set; }

        [Column("deletionDate")]
        public DateTime? deletionDate { get; set; }

        [Column("deletedBy")]
        public int? deletedBy { get; set; }

        [Column("storage")]
        public string storage { get; set; }

        [Column("isReceivedRequete")]
        public int isReceivedRequete { get; set; }

        public int idAgmo { get; set; }
        [ForeignKey("idAgmo")]
        public virtual Agmo Agmo { get; set; }

        public bool IsClotureur { get; set; }

        [Column("canDeleteAttachment")]
        public bool canDeleteAttachment { get; set; }


        [NotMapped]
        public ICollection<UtilisateurSite>? UtilisateurSites { get; set; } = new List<UtilisateurSite>();

        [NotMapped]
        public ICollection<UtilisateurProjet>? UtilisateurProjets { get; set; } = new List<UtilisateurProjet>();
        [NotMapped]
        public List<Site>? Sites { get; set; }

        public ICollection<UtilisateurCC>? UtilisateurCCs { get; set; } = new List<UtilisateurCC>();

        [NotMapped]
        public List<Projet>? Projets { get; set; }

        [ForeignKey("idrole")]
        public virtual Role? Role { get; set; }
        public Utilisateur()
        {
        }
    }
}