using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using UCP_API.dto;
using Azure.Core;
using System.Globalization;
using UCP_API.repositories;
using UCP_API.utils;
using System;
using CsvHelper;
using Microsoft.EntityFrameworkCore;

namespace UCP_API.models
{
    public class Requete
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdRequete { get; set; }
        public int? IdTypeRequete { get; set; }
        [NotMapped]
        public TypeRequete? TypeRequete { get; set; }
        public int IdUtilisateur { get; set; }
        [ForeignKey("IdUtilisateur")]
        public virtual Utilisateur Utilisateur { get; set; }
        public int IdSite { get; set; }
        public int IdProjet { get; set; }
        public string? CodeActiviteTom { get; set; }
        public string? IntituleActiviteTom { get; set; }
        public string NumRequete { get; set; }
        public string Lieu { get; set; }

        public string NumActiviteInterne { get; set; }
        public string IntituleActiviteInterne { get; set; }

        public int? EtatValidation { get; set; }

        [ForeignKey("IdProjet")]
        public virtual Projet Projet { get; set; }
        [ForeignKey("IdSite")]
        public virtual Site Site { get; set; }
        //public int IdCircuit { get; set; }
        //public int IdCircuitEtape { get; set; }
        //public int EtatValidation { get; set; }        


        public string? Copie_a { get; set; }

        public string? Compte_rendu { get; set; }
        public string? PourInformations { get; set; }
        public string Description { get; set; }
        public DateOnly? DateExecution { get; set; }
        public DateOnly? DateFinExecution { get; set; }
        [NotMapped]
        public DateOnly? DateFinEcheance { get; set; }

        public string? ReferenceInterne { get; set; }

        public double? Montant { get; set; }
        public double? MontantValide { get; set; }
        [NotMapped]
        public decimal Montant2 { get; set; }
        public bool? cloture { get; set; }
        public DateTime? cloturedate { get; set; }
        public int? clotureby { get; set; }
        public DateTime? creationdate { get; set; }
        public string? Objet { get; set; }
        [NotMapped]
        public List<RequeteAccuse>? RequeteAccuse { get; set; }

        [JsonIgnore]
        public virtual ICollection<RequeteJustificatif>? RequeteJustificatifs { get; set; } = new List<RequeteJustificatif>();
        [JsonIgnore]
        public ICollection<RequeteAccuse>? RequeteAccuses { get; set; } = new List<RequeteAccuse>();
        [JsonIgnore]
        public virtual ICollection<Justificatif>? Justificatifs { get; set; } = new List<Justificatif>();

        [NotMapped]
        public CircuitEtapeCheckListDetailsDTO? CircuitEtapeCheckListDetailsDTO { get; set; }

        [NotMapped]
        public bool? isExpired { get; set; }

        [NotMapped]
        public DateOnly? DateMinExec { get; set; }

        [NotMapped]
        public int NumeroEtapeActuelle { get; set; }

        [NotMapped]
        public string? TempsAttenteValidation { get; set; }

        [NotMapped]
        public int? DureeEtapeEnCours { get; set; }

        public bool? ManquePj { get; set; }
        public int? NbRappel { get; set; }
        public DateOnly? LastRappel { get; set; }
        public DateOnly? NextRappel { get; set; }

        public DateOnly? DateSoumission { get; set; }
        public int? NumBudget { get; set; }
        public string? CommentaireRevision { get; set; }
        public string? NumBr { get; set; }
        public int? Exercice { get; set; }

        public Requete()
        {

        }

        public void initiateDateFinEcheance()
        {
            // this.DateFinEcheance = this.DateFinExecution.Value.AddDays((int) this.TypeRequete.DelaiJustification);
            this.DateFinEcheance =Util.AddBusinessDays(this.DateFinExecution.Value, 15);
        }

        public async void alerter(Mailservice mailService)
        {
            //To
            initiateDateFinEcheance();

            Console.WriteLine(ReferenceInterne);
            Console.WriteLine(DateFinEcheance);
            Console.WriteLine(Objet);
            Console.WriteLine(Utilisateur.Agmo.nom);
            Console.WriteLine(Utilisateur.lastname);
            Console.WriteLine(Utilisateur.firstname);


            var Tolist = new List<string>();
            var toEmail = Utilisateur.email;
            if (!string.IsNullOrWhiteSpace(toEmail))
                Tolist = new List<string> { toEmail };

            //CC
            //var isAccuseForCC = _UtilisateurRepository.GetUtilisateurById(currentUserId);
            var CClist = new List<string?>();
            //CClist = isAccuseForCC?.UtilisateurCCs?.Select(cc => cc.mailCC).Where(email => !string.IsNullOrWhiteSpace(email)).ToList() ?? new List<string?>();

            var montantFormat = Montant?.ToString("N2", new CultureInfo("fr-FR")) ?? "0,00";

            var mailBody = @$"
                    <div>
                        Madame, Monsieur, 
                        <br /><br />
                        Nous nous permettons de revenir vers vous concernant la justification de votre requête, qui reste à ce jour en attente de régularisation.
                        Afin de clôturer correctement le dossier et d’assurer le suivi administratif, on vous remercie de bien vouloir nous transmettre les justificatifs nécessaires dans les meilleurs délais.
                        <br /><br />

                        <b><u>Objet de la requête : </u></b> {Objet} <br />
                        <b><u>Numéro de la requête : </u></b> {ReferenceInterne} <br />
                        <b><u>Montant : </u></b> {montantFormat} <br />
                        <b><u>Message : </u></b> {""/*Message*/} <br /><br />
                        <br /><br />
                        Cordialement,
                    </div>
                
            ";

            var newMailBody = @$"
                    <div>
                        Bonjour, 
                        <br /><br />
                        Nous vous informons par le présent mail que votre requête portant la référence n° {ReferenceInterne} arrivera à échéance le {DateFinEcheance}.
                        <br /><br />
                        Merci de régulariser la justification de cette requête dans le délai prévu afin de pouvoir soumettre une nouvelle demande.
                         <br /><br />

                        <b><u>Objet de la requête : </u></b> {Objet} <br />
                        <b><u>AGMO : </u></b> {Utilisateur.Agmo.nom} <br />
                        <b><u>Demandeur : </u></b> {Utilisateur.lastname} {Utilisateur.firstname} <br />
                        <b><u>Montant à justifier : </u></b> {montantFormat} <br /><br />
                        <br /><br />
                        Cordialement,
                    </div>
                
            ";

            try
            {
                await mailService.SendEmail("Gestion Requête - Rappel de justification", newMailBody, Tolist, CClist);

            }
            catch (Exception ex)
            {
                Console.WriteLine("ERREUR ENVOI ACCUSE RECEPTION");
                Console.WriteLine(ex.Message);
            }
        }

        

    }
            
}
        
  
