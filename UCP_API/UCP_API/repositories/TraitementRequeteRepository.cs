using Azure.Core;
using Microsoft.AspNetCore.Components.Server.Circuits;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics;
using System.Globalization;
using System.Linq.Expressions;
using System.Net;
using System.Reflection;
using System.Reflection.Metadata;
using UCP_API.data;
using UCP_API.dto;
using UCP_API.models;
using UCP_API.utils;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory.Model;

namespace UCP_API.repositories
{
    public class TraitementRequeteRepository
    {
        private readonly AppDbContext _context;
        private readonly Mailservice _mailService;
        private readonly UtilisateurRepository _UtilisateurRepository;
        private readonly RequeteRubriqueRepository _RequeteRubriqueRepository;

        public TraitementRequeteRepository(AppDbContext context, Mailservice mailService, UtilisateurRepository utilisateurRepository, RequeteRubriqueRepository requeteRubriqueRepository)
        {
            _context = context;
            _mailService = mailService;
            _UtilisateurRepository = utilisateurRepository;
            _RequeteRubriqueRepository = requeteRubriqueRepository;
        }

        // accusé de réception (receveur de requête ) => change STATUT = 1
        public async Task<bool> ReceptionRequete(int idRequete, int currentUserId)
        {
            var requete = await _context.Requete.FirstOrDefaultAsync(a => a.IdRequete == idRequete);
            if (requete == null)
                return false;

            var Refinterne = await ReferenceInterneRequete(idRequete, currentUserId);
            requete.EtatValidation = 1;
            requete.ReferenceInterne = Refinterne;
            await _context.SaveChangesAsync();
            requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(requete.IdRequete);

            try
            {
                //To
                var isSender =  _UtilisateurRepository.GetUtilisateurById(requete.IdUtilisateur);
                var Tolist = new List<string>();
                var toEmail = isSender.email;
                if (!string.IsNullOrWhiteSpace(toEmail))
                    Tolist = new List<string> { toEmail };

                //CC
                var isAccuseForCC =  _UtilisateurRepository.GetUtilisateurById(currentUserId);
                var CClist = new List<string?>();
                CClist = isAccuseForCC?.UtilisateurCCs?.Select(cc => cc.mailCC).Where(email => !string.IsNullOrWhiteSpace(email)).ToList() ?? new List<string?>();

                var montantFormat = requete.Montant?.ToString("N2", new CultureInfo("fr-FR")) ?? "0,00";

                var mailBody = @$"
                    <div>
                        Madame, Monsieur, 
                        <br /><br />
                        Nous vous accusons réception par le présent mail que la demande de requête que vous avez envoyée a bien été reçu.
                        <br /><br />

                        <b><u>Objet de la requête : </u></b> {requete.Objet} <br />
                        <b><u>Numéro de la requête : </u></b> {requete.NumRequete} <br />
                         <b><u>AGMO: </u></b> {requete.Utilisateur.Agmo.nom} <br />
                        <b><u>Montant : </u></b> {montantFormat} <br />

                        <b><u>Message : </u></b> {""/*Message*/} <br /><br />
                        Vous serez tenu(e) informé(e) de l’avancement du traitement de votre demande ainsi que de toute information complémentaire qui pourrait être requise.<br /><br />
                        Cordialement,
                    </div>
                ";

                try
                {
                    await _mailService.SendEmail("Gestion Requête - Accusé de réception", mailBody, Tolist, CClist);
                }
                catch (Exception ex)
                {
                    Console.WriteLine("ERREUR ENVOI ACCUSE RECEPTION");
                    Console.WriteLine(ex.Message);
                }

            }
            catch (Exception ex) { }

            return true;
        }

        public async Task<bool> SendMailRevision(int idRequete, int currentUserId)
        {
            var requete = await _context.Requete.FirstOrDefaultAsync(a => a.IdRequete == idRequete);
            if (requete == null)
                return false;

            requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(requete.IdRequete);



            try
            {
                //To
                var isSender = _UtilisateurRepository.GetUtilisateurById(requete.IdUtilisateur);
                var Tolist = new List<string>();
                var toEmail = isSender.email;
                if (!string.IsNullOrWhiteSpace(toEmail))
                    Tolist = new List<string> { toEmail };

                //CC
                var isAccuseForCC = _UtilisateurRepository.GetUtilisateurById(currentUserId);
                var CClist = new List<string?>();
                CClist = isAccuseForCC?.UtilisateurCCs?.Select(cc => cc.mailCC).Where(email => !string.IsNullOrWhiteSpace(email)).ToList() ?? new List<string?>();

                var montantFormat = requete.Montant?.ToString("N2", new CultureInfo("fr-FR")) ?? "0,00";

                var mailBody = @$"
                    <div>
                        Madame, Monsieur, 
                        <br /><br />
                        Nous vous informons que la requête portant la référence n° {requete.NumRequete} vous est renvoyée pour correction.
                        <br /><br />

                        <b><u>Objet de la requête : </u></b> {requete.Objet} <br />
                        <b><u>Numéro de la requête : </u></b> {requete.NumRequete} <br />
                        <b><u>Commentaires (détails de la révision à apporter) : </u> {requete.CommentaireRevision} </b>  <br />
                        
                       
                    </div>
                ";

                try
                {
                    await _mailService.SendEmail("Gestion Requête - Révision de requête", mailBody, Tolist, CClist);
                }
                catch (Exception ex)
                {
                    Console.WriteLine("ERREUR ENVOI MAIL DE REVISION");
                    Console.WriteLine(ex.Message);
                }

            }
            catch (Exception ex) { }

            return true;
        }

        // reference interrrrrrrrrrne
        private async Task<int> GetLastRequeteNumberGlobal()
        {
            return await _context.RequeteAccuse
                .OrderByDescending(r => r.requeteNumero)
                .Select(r => (int?)r.requeteNumero)
                .FirstOrDefaultAsync() ?? 0;
        }

        // reference interrrrrrrrrrne
        public async Task<string> ReferenceInterneRequete(int idRequete, int currentUserId)
        {
            var requete = await _context.Requete.FirstOrDefaultAsync(a => a.IdRequete == idRequete);
            if (requete == null)
                return string.Empty;

            string requeteSite = await GetRequeteSiteCodeBySiteId(requete.IdSite);
            if (string.IsNullOrWhiteSpace(requeteSite))
                return string.Empty;

            int requeteAnnee = requete.DateExecution.Value.Year;

            int requeteNumero = await GetLastRequeteNumberGlobal() + 1;


            //string sdocumentserie = "0000" + requeteNumero.ToString();//Manao erreur ito ra + 9999
            string sdocumentserie = requeteNumero.ToString().PadLeft(4, '0');

            sdocumentserie = sdocumentserie.Substring(sdocumentserie.Length - 4);

            //string referenceinterne = $"{sdocumentserie}/{requeteAnnee.ToString().Substring(2, 2)}/{requeteSite}";
            string referenceinterne = $"{sdocumentserie}/{requeteAnnee.ToString().Substring(2, 2)}";

            var recepI = new RequeteAccuse
            {
                idRequete = idRequete,
                creationdate = DateTime.Now,
                createdby = currentUserId,
                requeteNumero = requeteNumero,
                requeteYear = requeteAnnee,
                requeteSite = requeteSite,
                referenceInterne = referenceinterne
            };

            _context.RequeteAccuse.Add(recepI);
            await _context.SaveChangesAsync();

            return referenceinterne;
        }

        public async Task<string> GetRequeteSiteCodeBySiteId(int idSite)
        {
            var site = await _context.Site.FirstOrDefaultAsync(s => s.idSite == idSite && s.deletiondate == null);
            return site?.code;
        }

        public async Task<int> GetRequeteNumberByRequeteId(string requeteSite, int requeteAnnee)
        {
            var maxRequeteNumero = await _context.RequeteAccuse.Where(r => /*r.requeteSite == requeteSite &&*/ r.requeteYear == requeteAnnee).MaxAsync(r => (int?)r.requeteNumero);

            return maxRequeteNumero ?? 0;
        }

        public enum RequeteToCircuitResult
        {
            NotFound,
            NoStep,
            NoStepValidateur,
            Success
        }

        // Rattachement circuit - requête
        public async Task<RequeteToCircuitResult> RattRequeteToCircuit(int idRequete, int idCircuit, int currentUserId)
        {
            var Circuit = await _context.Circuit.FirstOrDefaultAsync(a => a.idCircuit == idCircuit && a.deletiondate == null);
            if (Circuit == null)
                return (RequeteToCircuitResult.NotFound);

            //test si aucune ETAPE pour le circuit
            var circuitEtapes = await _context.CircuitEtape.Where(ce => ce.idCircuit == idCircuit && ce.deletiondate == null).OrderBy(ce => ce.numero).ToListAsync();

            if (!circuitEtapes.Any())
                return RequeteToCircuitResult.NoStep;

            //test si aucun validateur par ETAPE
            foreach (var etape in circuitEtapes)
            {
                bool hasValidateur = await _context.CircuitEtapeValidateur.AnyAsync(cev => cev.idCircuitEtape == etape.idCircuitEtape && cev.deletiondate == null);

                if (!hasValidateur)
                    return RequeteToCircuitResult.NoStepValidateur;
            }

            //insertion pour validateurs et insertion pour checklist
            //insertion dans table circuitRequete
            var newCircuitRequete = new CircuitRequete
            {
                idCircuit = idCircuit,
                idRequete = idRequete
                //creationDate = DateTime.Now
            };

            _context.CircuitRequete.Add(newCircuitRequete);

            var FirstValidateur = new List<int>();

            var idFirstEtape = circuitEtapes.FirstOrDefault()?.idCircuitEtape;

            //Durée étape
            int dureeValidation = 0;

            foreach (var etape in circuitEtapes)
            {
                //insertion pour validateurs
                var validateurs = await _context.CircuitEtapeValidateur.Where(cev => cev.idCircuitEtape == etape.idCircuitEtape && cev.deletiondate == null).ToListAsync();

                foreach (var val in validateurs)
                {
                    _context.HistoriqueValidationRequete.Add(new HistoriqueValidationRequete
                    {
                        idRequete = idRequete,
                        idCircuitEtape = val.idCircuitEtape,
                        numero = val.numero,
                        etatValidation = 0,
                        idValidateur = val.idValidateur,
                        creationdate = DateTime.Now,
                        createdby = currentUserId,
                        isPotential = (val.idCircuitEtape == idFirstEtape),
                        isPassMarche = val.isPassMarche
                    });

                    //First validateur//
                    if ((val.idCircuitEtape == idFirstEtape))
                    {
                        FirstValidateur.Add(val.idValidateur);

                        if (dureeValidation == 0)
                        {
                            var isFirstEtape = await _context.CircuitEtape.FirstOrDefaultAsync(ce => ce.idCircuitEtape == idFirstEtape && ce.idCircuit == idCircuit && ce.deletiondate == null);
                            dureeValidation = isFirstEtape?.duree ?? 0;
                        }
                    }
                }

                //insertion pour checklist
                var checklists = await _context.CircuitEtapeCheckList.Where(cl => cl.idCircuitEtape == etape.idCircuitEtape && cl.deletiondate == null).ToListAsync();

                foreach (var cl in checklists)
                {
                    _context.HistoriqueValidationRequeteCheckList.Add(new HistoriqueValidationRequeteCheckList
                    {
                        idRequete = idRequete,
                        idCircuitEtape = cl.idCircuitEtape,
                        idCircuitEtapeCheckList = cl.idCircuitEtapeCheckList,
                        creationdate = DateTime.Now,
                        createdby = currentUserId
                    });
                }
            }

            await _context.SaveChangesAsync();

            var requete = await _context.Requete.FirstOrDefaultAsync(a => a.IdRequete == idRequete);
            requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(requete.IdRequete);
            //Refinterne
            var accuse = await _context.RequeteAccuse.FirstOrDefaultAsync(a => a.idRequete == idRequete);
            var Refinterne = accuse?.referenceInterne ?? "";

            //NOM AGMO
            var isSender =  _UtilisateurRepository.GetUtilisateurById(requete.IdUtilisateur);
            var AGMO = $"{isSender.lastname} {isSender.firstname}".Trim();

            //Notification First validateur
            try
            {
                //To
                var Tolist = new List<string>();
                if (FirstValidateur != null && FirstValidateur.Any())
                {
                    foreach (var validateurId in FirstValidateur)
                    {
                        var isFv = _UtilisateurRepository.GetUtilisateurById(validateurId);
                        var To = isFv.email;

                        Tolist.Add(To);
                    }
                }

                //CC
                var CClist = new List<string>();

                var montantFormat = requete.Montant.Value.ToString("N2", new CultureInfo("fr-FR"));

                var mailBody = @$"
                    <div>
                        Madame, Monsieur, 
                        <br /><br />
                        Nous vous confirmons par le présent mail qu'une requête émise par « {AGMO} » a été envoyé et est en attente de votre validation.
                        <br />
                        Selon vos procédures, vous disposez d’un délai de {dureeValidation} heures pour effectuer la validation.
                        <br /><br />

                        <b><u>Objet de la requête : </u></b> {requete.Objet} <br />
                        <b><u>Numéro de la requête : </u></b> {Refinterne} <br />
                        <b><u>AGMO: </u></b> {requete.Utilisateur.Agmo.nom} <br />
                        <b><u>Montant : </u></b> {montantFormat} <br />
                        <b><u>Message : </u></b> {""/*Message*/} <br /><br />
                        
                        <b>Cliquer </b><a href='{""/*lien*/}'>ICI</a><b> pour visualiser le formulaire</b> <br /><br />

                        Cordialement,
                    </div>
                ";

                try
                {
                    await _mailService.SendEmail("Gestion Requête - Rattachement requête à un circuit", mailBody, Tolist, CClist);
                }
                catch (Exception ex)
                {

                }
            }
            catch (Exception ex) { }

            return (RequeteToCircuitResult.Success);
        }

        public enum RequeteToCircuitDetachResult
        {
            NotFound,
            Success
        }

        public async Task<RequeteToCircuitDetachResult> DetachRequeteFromCircuit(int idRequete)
        {
            //delete dans table circuitRequete
            var liaison = await _context.CircuitRequete.FirstOrDefaultAsync(cr => cr.idRequete == idRequete);

            if (liaison == null)
                return RequeteToCircuitDetachResult.NotFound;

            var idCircuit = liaison.idCircuit;

            var etapes = await _context.CircuitEtape.Where(ce => ce.idCircuit == idCircuit && ce.deletiondate == null).Select(ce => ce.idCircuitEtape).ToListAsync();

            //delete historique de validation : HistoriqueValidationRequete
            var historiques = await _context.HistoriqueValidationRequete.Where(h => h.idRequete == idRequete && etapes.Contains(h.idCircuitEtape)).ToListAsync();

            _context.HistoriqueValidationRequete.RemoveRange(historiques);

            //delete checklist : HistoriqueValidationRequeteCheckList
            var historiquesCheckList = await _context.HistoriqueValidationRequeteCheckList.Where(h => h.idRequete == idRequete && etapes.Contains(h.idCircuitEtape)).ToListAsync();

            _context.HistoriqueValidationRequeteCheckList.RemoveRange(historiquesCheckList);

            _context.CircuitRequete.Remove(liaison);

            await _context.SaveChangesAsync();

            return RequeteToCircuitDetachResult.Success;
        }

        public enum ValidateRequeteResult
        {
            NotFoundHisto,
            NotFoundRequete,
            Success
        }

        public async Task<CircuitEtape> checkNextEtape(int idrequete, int currentUserId, ValidationRequeteDTO validationnext)
        {
            var histovalid = await _context.HistoriqueValidationRequete.Where(h => h.idRequete == idrequete && h.idCircuitEtape == validationnext.idCircuitEtape && h.idValidateur == currentUserId && h.dateValidation == null).OrderBy(h => h.numero).FirstOrDefaultAsync();


            int idcircuitetape = histovalid.idCircuitEtape;
            var etapeActuelle = await _context.CircuitEtape.Where(e => e.idCircuitEtape == idcircuitetape && e.deletiondate == null).Select(e => new { e.numero, e.idCircuit }).FirstOrDefaultAsync();

            CircuitEtape? prochaineEtape = null;
            if (validationnext.ispmskyp == false)
            {
                prochaineEtape = await _context.CircuitEtape.Where(ce => ce.idCircuit == etapeActuelle.idCircuit && ce.numero == etapeActuelle.numero + 1 && ce.deletiondate == null).FirstOrDefaultAsync();
            }
            else
            {
                prochaineEtape = await _context.CircuitEtape.Where(ce => ce.idCircuit == etapeActuelle.idCircuit && ce.numero == etapeActuelle.numero + 2 && ce.deletiondate == null).FirstOrDefaultAsync();
            }

            //dernière etape
            return prochaineEtape;
        }

            public async Task<HistoriqueValidationRequete?> ValidateRequete(int idrequete, int currentUserId, ValidationRequeteDTO validationnext)
        {
            //var histovalid = await _context.HistoriqueValidationRequete.FirstOrDefaultAsync(h => h.idRequete == idrequete && h.idCircuitEtape == idcircuitetape && h.idValidateur == currentUserId);
            var histovalid = await _context.HistoriqueValidationRequete.Where(h => h.idRequete == idrequete && h.idCircuitEtape == validationnext.idCircuitEtape && h.idValidateur == currentUserId && h.dateValidation == null).OrderBy(h => h.numero).FirstOrDefaultAsync();

            if (histovalid == null)
                //return ValidateRequeteResult.NotFoundHisto;
                return null;

            int idcircuitetape = histovalid.idCircuitEtape;

            //REQUETE//
            var requete = await _context.Requete.FirstOrDefaultAsync(r => r.IdRequete == idrequete);
            if (requete == null)
                //return ValidateRequeteResult.NotFoundRequete;
                return null;

            requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(requete.IdRequete);

            //Refinterne
            var accuse = await _context.RequeteAccuse.FirstOrDefaultAsync(a => a.idRequete == idrequete);
            var Refinterne = accuse?.referenceInterne ?? "";

            //To
            var Tolist = new List<string>();

            //CC
            var CClist = new List<string>();

            //Durée validation
            var dureeValidation = 0;

            //numero etape
            var numeroEtapeNext = 0;

            //description etape
            var descriptionEtapeNext = "";

            //validateur
            var isValidateur = _UtilisateurRepository.GetUtilisateurById(currentUserId);

            var fonction = string.IsNullOrWhiteSpace(isValidateur.fonction) ? "Sans fonction" : isValidateur.fonction;
            var username = string.IsNullOrWhiteSpace(isValidateur.email) ? "" : " : " + isValidateur.username;
            var lastname = string.IsNullOrWhiteSpace(isValidateur.firstname) ? "" : " : " + isValidateur.lastname;
            var firstname = string.IsNullOrWhiteSpace(isValidateur.lastname) ? "" : " " + isValidateur.firstname;

            var validateur = fonction + username + lastname + firstname;

            //maj HistoriqueValidationRequete pour le validateur
            DateTime datevalidation = DateTime.Now;

            histovalid.commentaire = validationnext.commentaire;
            histovalid.dateValidation = datevalidation;
            histovalid.isValidator = true;

            //maj autre de même étape
            var autreshistovalid = await _context.HistoriqueValidationRequete.Where(h => h.idRequete == idrequete && h.idCircuitEtape == idcircuitetape && h.dateValidation == null && h.idValidateur != currentUserId).ToListAsync();
            if (autreshistovalid.Any())
            {
                foreach (var h in autreshistovalid)
                {
                    h.dateValidation = datevalidation;
                }
            }

            //Vérification si dernière ETAPE//
            // Recup numero et idCircuit de l'étape actuel
            var etapeActuelle = await _context.CircuitEtape.Where(e => e.idCircuitEtape == idcircuitetape && e.deletiondate == null).Select(e => new { e.numero, e.idCircuit }).FirstOrDefaultAsync();

            var prochaineEtape = await _context.CircuitEtape.Where(ce => ce.idCircuit == etapeActuelle.idCircuit && ce.numero == etapeActuelle.numero + 1 && ce.deletiondate == null).FirstOrDefaultAsync();

            //dernière etape
            if (prochaineEtape == null)
            {
                //maj HistoriqueValidationRequete pour le validateur
                histovalid.etatValidation = 5;

                //maj statut REQUETE
                requete.EtatValidation = 5;

                //maj checklist
                await UpdateChecklist(idrequete, idcircuitetape, validationnext.Checklist);

                await _context.SaveChangesAsync();

                //Notification fin de processus => AGMO et mail CC du receveur
                try
                {
                    //To
                    var isSender = _UtilisateurRepository.GetUtilisateurById(requete.IdUtilisateur);
                    var toEmail = isSender.email;
                    if (!string.IsNullOrWhiteSpace(toEmail))
                        Tolist = new List<string> { toEmail };

                    //CC
                    var isAccuseForutilisateurId = _context.RequeteAccuse.FirstOrDefault(ra => ra.idRequete == requete.IdRequete).createdby;
                    var isAccuseForCC = _UtilisateurRepository.GetUtilisateurById(isAccuseForutilisateurId);
                    CClist = isAccuseForCC?.UtilisateurCCs?.Select(cc => cc.mailCC).Where(email => !string.IsNullOrWhiteSpace(email)).ToList() ?? new List<string?>();

                    var montantFormat = requete.Montant.Value.ToString("N2", new CultureInfo("fr-FR"));

                    var mailBody = @$"
                        <div>
                            Madame, Monsieur, 
                            <br /><br />
                            Nous vous confirmons par le présent mail la validation finale de votre requête par « {validateur} ».
                            <br /><br />

                            <b><u>Objet de la requête : </u></b> {requete.Objet} <br />
                            <b><u>Numéro de la requête : </u></b> {requete.NumRequete} <br />
                            <b><u>Montant : </u></b> {montantFormat} <br />
                            <b><u>Message : </u></b> {""/*Message*/} <br /><br />

                            Cordialement,
                        </div>
                    ";



                    try
                    {
                        Console.WriteLine("EMAIL");
                        for (int i = 0; i < Tolist.Count(); i++)
                        {
                            Console.WriteLine(Tolist[i]);
                        }
                        await _mailService.SendEmail("Gestion Requête - Requête validée", mailBody, Tolist, CClist);
                    }
                    catch (Exception ex)
                    {

                    }
                }
                catch (Exception ex) { }

                //return ValidateRequeteResult.Success;
                return histovalid;
            }

            //etape suivante
            //maj HistoriqueValidationRequete pour le validateur
            histovalid.etatValidation = 4;

            //maj statut REQUETE
            requete.EtatValidation = 4;

            //maj checklist
            await UpdateChecklist(idrequete, idcircuitetape, validationnext.Checklist);

            //Skyp Passation marché ou non
            //Skyp == true = etape PassMarch à sauter
            if (validationnext.ispmskyp == true)
            {
                //maj etape E+1
                var etapePassMarcheSKYP = await _context.HistoriqueValidationRequete.Where(h => h.idRequete == idrequete && h.idCircuitEtape == prochaineEtape.idCircuitEtape && h.numero == prochaineEtape.numero && h.dateValidation == null).ToListAsync();
                if (etapePassMarcheSKYP.Any())
                {
                    foreach (var h in etapePassMarcheSKYP)
                    {
                        h.dateValidation = datevalidation;
                        h.isPassMarcheSkyp = true;
                    }
                }

                //maj etape E+2 = isPotental
                List<int> idValidateurNext = validationnext.idValidateurNext;
                var prochaineEtape2 = await _context.CircuitEtape.Where(ce => ce.idCircuit == prochaineEtape.idCircuit && ce.numero == prochaineEtape.numero + 1 && ce.deletiondate == null).FirstOrDefaultAsync();
                if(prochaineEtape2 != null)
                {
                    var validateursSuivants = await _context.HistoriqueValidationRequete.Where(h => h.idRequete == idrequete && h.idCircuitEtape == prochaineEtape2.idCircuitEtape && idValidateurNext.Contains(h.idValidateur.Value)).ToListAsync();

                    foreach (var v in validateursSuivants)
                    {
                        v.isPotential = true;
                    }

                    foreach (var validateurId in idValidateurNext)
                    {
                        var isFv = _UtilisateurRepository.GetUtilisateurById(validateurId);
                        var To = isFv.email;

                        Tolist.Add(To);
                    }

                    if (dureeValidation == 0)
                    {
                        dureeValidation = prochaineEtape2?.duree ?? 0;
                    }

                    numeroEtapeNext = prochaineEtape2.numero;
                    descriptionEtapeNext = prochaineEtape2.description;
                }
                else
                {
                    histovalid.etatValidation = 4;
                    requete.EtatValidation = 5;
                }
               
            }
            else
            {
                //maj etape E+1
                List<int> idValidateurNext = validationnext.idValidateurNext;
                var validateursSuivants = await _context.HistoriqueValidationRequete.Where(h => h.idRequete == idrequete && h.idCircuitEtape == prochaineEtape.idCircuitEtape && idValidateurNext.Contains(h.idValidateur.Value)).ToListAsync();

                foreach (var v in validateursSuivants)
                {
                    v.isPotential = true;
                }

                foreach (var validateurId in idValidateurNext)
                {
                    var isFv =  _UtilisateurRepository.GetUtilisateurById(validateurId);
                    var To = isFv.email;

                    Tolist.Add(To);
                }

                if (dureeValidation == 0)
                {
                    dureeValidation = prochaineEtape?.duree ?? 0;
                }

                numeroEtapeNext = prochaineEtape.numero;
                descriptionEtapeNext = prochaineEtape.description;
            }

            await _context.SaveChangesAsync();

            //Notification pour next validators
            try
            {
                //CC
                CClist = new List<string>();

                var montantFormat2 = requete.Montant.Value.ToString("N2", new CultureInfo("fr-FR"));

                var mailBody2 = @$"
                    <div>
                        Madame, Monsieur, 
                        <br /><br />
                        Nous vous confirmons par le présent mail qu'une requête a été validé par « {validateur} » et est désormais en attente de votre validation.
                        <br />
                        Selon vos procédures, vous disposez d’un délai de {dureeValidation} heures pour effectuer la validation.
                        <br /><br />

                        <b><u>Objet de la requête : </u></b> {requete.Objet} <br />
                        <b><u>Numéro de la requête : </u></b> {requete.NumRequete} <br />
                        <b><u>Montant : </u></b> {montantFormat2} <br />
                        <b><u>Message : </u></b> {""/*Message*/} <br /><br />
                        <b><u>Commentaire : </u></b> {validationnext.commentaire} <br /><br />
                        
                        <b>Cliquer </b><a href='{""/*lien*/}'>ICI</a><b> pour visualiser le formulaire</b> <br /><br />

                        Cordialement,
                    </div>
                ";

                try
                {
                    await _mailService.SendEmail("Gestion Requête - Requête en attente validation", mailBody2, Tolist, CClist);
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.Message);
                }
            }
            catch (Exception ex) { Console.WriteLine(ex.Message); }

            //Notification pour AGMO
            try
            {
                //To
                var isSender2 = _UtilisateurRepository.GetUtilisateurById(requete.IdUtilisateur);
                var toEmail2 = isSender2.email;
                if (!string.IsNullOrWhiteSpace(toEmail2))
                    Tolist = new List<string> { toEmail2 };

                //CC
                CClist = new List<string>();

                var montantFormat3 = requete.Montant.Value.ToString("N2", new CultureInfo("fr-FR"));

                var mailBody3 = @$"
                    <div>
                        Madame, Monsieur, 
                        <br /><br />
                        Nous vous confirmons par le présent mail que votre requête mentionnée ci-dessous, est en attente de validation à « l'étape n°{numeroEtapeNext} : {descriptionEtapeNext} ».
                        <br /><br />

                        <b><u>Objet de la requête : </u></b> {requete.Objet} <br />
                        <b><u>Numéro de la requête : </u></b> {requete.NumRequete} <br />
                        <b><u>Montant : </u></b> {montantFormat3} <br /><br />

                        Vous serez tenu(e) informé(e) de l’avancement du traitement de votre demande ainsi que de toute information complémentaire qui pourrait être requise.<br /><br />

                        Cordialement,
                    </div>
                ";

                try
                {
                    //await _mailService.SendEmail("Gestion Requête - Requête validée (étape)", mailBody3, Tolist, CClist);
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.Message);
                }
            }
            catch (Exception ex) { Console.WriteLine(ex.Message); }

            //return ValidateRequeteResult.Success;
            return histovalid;
        }

        public async void NotifierCloturation(Requete r)
        {
            //To
            r.initiateDateFinEcheance();

            /*Console.WriteLine(ReferenceInterne);
            Console.WriteLine(DateFinEcheance);
            Console.WriteLine(Objet);
            Console.WriteLine(Utilisateur.Agmo.nom);
            Console.WriteLine(Utilisateur.lastname);
            Console.WriteLine(Utilisateur.firstname);*/


            var Tolist = new List<string>();
            var toEmail = r.Utilisateur.email;
            if (!string.IsNullOrWhiteSpace(toEmail))
                Tolist = new List<string> { toEmail };

            //CC
            var isAccuseForCC = _UtilisateurRepository.GetUtilisateurById(r.IdUtilisateur);
            var CClist = new List<string?>();
            CClist = isAccuseForCC?.UtilisateurCCs?.Select(cc => cc.mailCC).Where(email => !string.IsNullOrWhiteSpace(email)).ToList() ?? new List<string?>();

            var montantFormat = r.Montant?.ToString("N2", new CultureInfo("fr-FR")) ?? "0,00";

            

            var newMailBody = @$"
                    <div>
                        Madame, Monsieur,
                        <br /><br />
                        Nous vous confirmons par le présent mail que votre requête portant la référence n° {r.ReferenceInterne} a été cloturée.
                         <br /><br />

                        <b><u>Objet de la requête : </u></b> {r.Objet} <br />                     
                        <b><u>Numéro : </u></b> {r.NumRequete}<br />
                        <b><u>Montant validé : </u></b> {montantFormat} <br /><br />
                        <br /><br />
                        Cordialement,
                    </div>
                
            ";

            try
            {
                await _mailService.SendEmail("Gestion Requête - Requête cloturée", newMailBody, Tolist, CClist);

            }
            catch (Exception ex)
            {
                Console.WriteLine("ERREUR ENVOI DE LA NOTIFICATION DE CLOTURATION");
                Console.WriteLine(ex.Message);
            }
        }

        private async Task UpdateChecklist(int idRequete, int idCircuitEtape, List<ValidationRequeteChecklistReponseDTO> checklist)
        {
            var idsChecklist = checklist.Select(c => c.idCircuitEtapeCheckList).ToList();

            var lignes = await _context.HistoriqueValidationRequeteCheckList
                .Where(h => h.idRequete == idRequete && h.idCircuitEtape == idCircuitEtape && idsChecklist.Contains(h.idCircuitEtapeCheckList))
                .ToListAsync();

            foreach (var ligne in lignes)
            {
                var check = checklist.FirstOrDefault(c => c.idCircuitEtapeCheckList == ligne.idCircuitEtapeCheckList);
                if (check != null)
                {
                    ligne.oui = check.oui;
                    ligne.non = check.non;
                    ligne.nonapplicable = check.nonapplicable;
                }
            }

            await _context.SaveChangesAsync();
        }

        public async Task<bool> ValidateMultipleRequete(List<int> idrequete, int currentUserId)
        {
            try
            {
                var tasks = idrequete.Select(id => ValidateSingleRequete(id, currentUserId));
                await Task.WhenAll(tasks);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task ValidateSingleRequete(int idrequete, int currentUserId)
        {
            try
            {
                var histovalid = await _context.HistoriqueValidationRequete.Where(h => h.idRequete == idrequete && h.idValidateur == currentUserId && h.dateValidation == null).OrderBy(h => h.numero).FirstOrDefaultAsync();

                int idcircuitetape = histovalid.idCircuitEtape;

                //REQUETE//
                var requete = await _context.Requete.FirstOrDefaultAsync(r => r.IdRequete == idrequete);

                //Refinterne
                var accuse = await _context.RequeteAccuse.FirstOrDefaultAsync(a => a.idRequete == idrequete);
                var Refinterne = accuse?.referenceInterne ?? "";

                //To
                var Tolist = new List<string>();

                //CC
                var CClist = new List<string>();

                //validateur
                var isValidateur =  _UtilisateurRepository.GetUtilisateurById(currentUserId);

                var fonction = string.IsNullOrWhiteSpace(isValidateur.fonction) ? "Sans fonction" : isValidateur.fonction;
                var email = string.IsNullOrWhiteSpace(isValidateur.email) ? "" : " : " + isValidateur.email;
                var firstname = string.IsNullOrWhiteSpace(isValidateur.firstname) ? "" : " : " + isValidateur.firstname;
                var lastname = string.IsNullOrWhiteSpace(isValidateur.lastname) ? "" : " " + isValidateur.lastname;

                var validateur = fonction + email + firstname + lastname;

                //maj HistoriqueValidationRequete pour le validateur
                DateTime datevalidation = DateTime.Now;

                histovalid.commentaire = "";
                histovalid.dateValidation = datevalidation;
                histovalid.isValidator = true;

                //maj autre de même étape
                var autreshistovalid = await _context.HistoriqueValidationRequete.Where(h => h.idRequete == idrequete && h.idCircuitEtape == idcircuitetape && h.dateValidation == null && h.idValidateur != currentUserId).ToListAsync();
                if (autreshistovalid.Any())
                {
                    foreach (var h in autreshistovalid)
                    {
                        h.dateValidation = datevalidation;
                    }
                }

                //Vérification si dernière ETAPE//
                // Recup numero et idCircuit de l'étape actuel
                var etapeActuelle = await _context.CircuitEtape.Where(e => e.idCircuitEtape == idcircuitetape && e.deletiondate == null).Select(e => new { e.numero, e.idCircuit }).FirstOrDefaultAsync();

                var prochaineEtape = await _context.CircuitEtape.Where(ce => ce.idCircuit == etapeActuelle.idCircuit && ce.numero == etapeActuelle.numero + 1 && ce.deletiondate == null).FirstOrDefaultAsync();

                //dernière etape
                if (prochaineEtape == null)
                {
                    //maj HistoriqueValidationRequete pour le validateur
                    histovalid.etatValidation = 5;

                    //maj statut REQUETE
                    requete.EtatValidation = 5;

                    await _context.SaveChangesAsync();

                    //Notification fin de processus => AGMO et mail CC du receveur
                    try
                    {
                        //To
                        var isSender =  _UtilisateurRepository.GetUtilisateurById(requete.IdUtilisateur);
                        var toEmail = isSender.email;
                        if (!string.IsNullOrWhiteSpace(toEmail))
                            Tolist = new List<string> { toEmail };

                        //CC
                        var isAccuseForutilisateurId = _context.RequeteAccuse.FirstOrDefault(ra => ra.idRequete == requete.IdRequete).createdby;
                        var isAccuseForCC = _UtilisateurRepository.GetUtilisateurById(isAccuseForutilisateurId);
                        CClist = isAccuseForCC?.UtilisateurCCs?.Select(cc => cc.mailCC).Where(email => !string.IsNullOrWhiteSpace(email)).ToList() ?? new List<string?>();

                        var montantFormat = requete.Montant.Value.ToString("N2", new CultureInfo("fr-FR"));

                        var mailBody = @$"
                                <div>
                                    Madame, Monsieur, 
                                    <br /><br />
                                    Nous vous confirmons par le présent mail la validation finale de votre requête par « {validateur} ».
                                    <br /><br />

                                    <b><u>Objet de la requête : </u></b> {requete.Objet} <br />
                                    <b><u>Numéro de la requête : </u></b> {Refinterne} <br />
                                    <b><u>AGMO: </u></b> {requete.Utilisateur.Agmo.nom} <br />
                                    <b><u>Montant : </u></b> {montantFormat} <br />
                                    <b><u>Message : </u></b> {""/*Message*/} <br /><br />

                                    Cordialement,
                                </div>
                            ";

                        try
                        {
                            //await _mailService.SendEmail("Gestion Requête - Requête validée", mailBody, Tolist, CClist);
                        }
                        catch (Exception ex)
                        {

                        }
                    }
                    catch (Exception ex) { }
                }

                //etape suivante
                //maj HistoriqueValidationRequete pour le validateur
                histovalid.etatValidation = 4;

                //maj statut REQUETE
                requete.EtatValidation = 4;

                int dureeValidation = 0;

                //maj etape E+1
                var validateursSuivants = await _context.HistoriqueValidationRequete.Where(h => h.idRequete == idrequete && h.idCircuitEtape == prochaineEtape.idCircuitEtape).ToListAsync();

                foreach (var v in validateursSuivants)
                {
                    v.isPotential = true;
                }

                foreach (var validateurId in validateursSuivants)
                {
                    var isFv =  _UtilisateurRepository.GetUtilisateurById(validateurId.idValidateur.Value);
                    var To = isFv.email;

                    Tolist.Add(To);
                }

                if (dureeValidation == 0)
                {
                    dureeValidation = prochaineEtape?.duree ?? 0;
                }

                var numeroEtapeNext = prochaineEtape.numero;
                var descriptionEtapeNext = prochaineEtape.description;

                await _context.SaveChangesAsync();

                //Notification pour next validators
                try
                {
                    //CC
                    CClist = new List<string>();

                    var montantFormat = requete.Montant.Value.ToString("N2", new CultureInfo("fr-FR"));

                    var mailBody = @$"
                            <div>
                                Madame, Monsieur, 
                                <br /><br />
                                Nous vous confirmons par le présent mail qu'une requête a été validé par « {validateur} » et est désormais en attente de votre validation.
                                <br />
                                Selon vos procédures, vous disposez d’un délai de {dureeValidation} heures pour effectuer la validation.
                                <br /><br />

                                <b><u>Numéro de la requête : </u></b> {Refinterne} <br />
                                <b><u>Montant : </u></b> {montantFormat} <br />
                                <b><u>Message : </u></b> {""/*Message*/} <br /><br />
                                <b><u>Commentaire : </u></b> {""} <br /><br />

                                Vous serez tenu(e) informé(e) de l’avancement du traitement de votre demande ainsi que de toute information complémentaire qui pourrait être requise.<br /><br />
                        
                                <b>Cliquer </b><a href='{""/*lien*/}'>ICI</a><b> pour visualiser le formulaire</b> <br /><br />

                                Cordialement,
                            </div>
                        ";

                    try
                    {
                        //await _mailService.SendEmail("Gestion Requête - Requête en attente validation", mailBody, Tolist, CClist);
                    }
                    catch (Exception ex)
                    {

                    }
                }
                catch (Exception ex) { }

                //Notification pour AGMO
                try
                {
                    //To
                    var isSender =  _UtilisateurRepository.GetUtilisateurById(requete.IdUtilisateur);
                    var toEmail = isSender.email;
                    if (!string.IsNullOrWhiteSpace(toEmail))
                        Tolist = new List<string> { toEmail };

                    //CC
                    CClist = new List<string>();

                    var montantFormat = requete.Montant.Value.ToString("N2", new CultureInfo("fr-FR"));

                    var mailBody = @$"
                            <div>
                                Madame, Monsieur, 
                                <br /><br />
                                Nous vous confirmons par le présent mail que votre requête mentionnée ci-dessous, est en attente de validation à « l'étape n°{numeroEtapeNext} : {descriptionEtapeNext} ».
                                <br /><br />

                                <b><u>Objet de la requête : </u></b> {""/*OBJET*/} <br />
                                <b><u>Numéro de la requête : </u></b> {Refinterne} <br />
                                <b><u>Montant : </u></b> {montantFormat} <br /><br />

                                Vous serez tenu(e) informé(e) de l’avancement du traitement de votre demande ainsi que de toute information complémentaire qui pourrait être requise.<br /><br />

                                Cordialement,
                            </div>
                        ";

                    try
                    {
                        //await _mailService.SendEmail("Gestion Requête - Requête validée (étape)", mailBody, Tolist, CClist);
                    }
                    catch (Exception ex)
                    {

                    }
                }
                catch (Exception ex) { }
            }
            catch { }
        }

        public enum RefusRequeteResult
        {
            NotFoundHisto,
            NotFoundRequete,
            Success,
            NotFoundAccuse
        }

        public async Task<RefusRequeteResult> RefusRequete(int idrequete, int currentUserId, RefusRequeteDTO refus)
        {
            //var histovalid = await _context.HistoriqueValidationRequete.FirstOrDefaultAsync(h => h.idRequete == idrequete && h.idCircuitEtape == idcircuitetape && h.idValidateur == currentUserId);
            var histovalid = await _context.HistoriqueValidationRequete.Where(h => h.idRequete == idrequete && h.idCircuitEtape == refus.idCircuitEtape && h.idValidateur == currentUserId && h.dateValidation == null).OrderBy(h => h.numero).FirstOrDefaultAsync();

            if (histovalid == null)
                return RefusRequeteResult.NotFoundHisto;

            int idcircuitetape = histovalid.idCircuitEtape;

            //REQUETE//
            var requete = await _context.Requete.Include(r => r.Projet).FirstOrDefaultAsync(r => r.IdRequete == idrequete);
            if (requete == null)
                return RefusRequeteResult.NotFoundRequete;

            requete.Montant = _RequeteRubriqueRepository.GetSommeRequeteRubriquesByRequete(requete.IdRequete);

            //Refinterne
            var accuse = await _context.RequeteAccuse.FirstOrDefaultAsync(a => a.idRequete == idrequete);
            var Refinterne = accuse?.referenceInterne ?? "";

            //To
            var Tolist = new List<string>();

            //CC
            var CClist = new List<string>();

            //numero etape
            var numeroEtape = 0;

            //description etape
            var descriptionEtape = "";

            //validateur
            var isValidateur =  _UtilisateurRepository.GetUtilisateurById(currentUserId);

            var fonction = string.IsNullOrWhiteSpace(isValidateur.fonction) ? "Sans fonction" : isValidateur.fonction;
            var email = string.IsNullOrWhiteSpace(isValidateur.email) ? "" : " : " + isValidateur.email;
            var firstname = string.IsNullOrWhiteSpace(isValidateur.firstname) ? "" : " : " + isValidateur.firstname;
            var lastname = string.IsNullOrWhiteSpace(isValidateur.lastname) ? "" : " " + isValidateur.lastname;
            var projetname = string.IsNullOrWhiteSpace(requete.Projet.nom) ? "" : " : " + requete.Projet.nom;

            var validateur = fonction + projetname + firstname + lastname;

            //maj HistoriqueValidationRequete pour le validateur
            DateTime daterefus = DateTime.Now;

            histovalid.commentaire = refus.commentaire;
            histovalid.dateValidation = daterefus;
            histovalid.isValidator = true;
            histovalid.etatValidation = 2;

            //maj statut REQUETE
            requete.EtatValidation = 2;

            //maj autre de même étape
            var autreshistovalid = await _context.HistoriqueValidationRequete.Where(h => h.idRequete == idrequete && h.idCircuitEtape == idcircuitetape && h.dateValidation == null && h.idValidateur != currentUserId).ToListAsync();
            if (autreshistovalid.Any())
            {
                foreach (var h in autreshistovalid)
                {
                    h.dateValidation = daterefus;
                }
            }

            // Recup numero et idCircuit de l'étape actuel
            var etapeActuelle = await _context.CircuitEtape.Where(e => e.idCircuitEtape == idcircuitetape && e.deletiondate == null).Select(e => new { e.numero, e.idCircuit, e.description }).FirstOrDefaultAsync();

            numeroEtape = etapeActuelle.numero;
            descriptionEtape = etapeActuelle.description;

            await _context.SaveChangesAsync();

            //Notification pour AGMO et CC et validateurs précédents
            try
            {
                //To
                var isSender =  _UtilisateurRepository.GetUtilisateurById(requete.IdUtilisateur);
                var toEmail = isSender.email;
                if (!string.IsNullOrWhiteSpace(toEmail))
                    Tolist = new List<string> { toEmail };

                //CC
                var isAccuseForutilisateurId = _context.RequeteAccuse.FirstOrDefault(ra => ra.idRequete == requete.IdRequete);
                if (isAccuseForutilisateurId == null)
                {
                    return RefusRequeteResult.NotFoundAccuse;
                }
                var isAccuseForCC =  _UtilisateurRepository.GetUtilisateurById(isAccuseForutilisateurId.createdby);
                
                CClist = isAccuseForCC?.UtilisateurCCs?.Select(cc => cc.mailCC).Where(email => !string.IsNullOrWhiteSpace(email)).ToList() ?? new List<string?>();

                //CC aussi : validateurs précédents
                var validateursPrecedents = await _context.HistoriqueValidationRequete.Where(h => h.idRequete == idrequete && h.isValidator == true && h.numero < histovalid.numero).Select(h => h.idValidateur).Distinct().ToListAsync();
                foreach (var idValidateur in validateursPrecedents)
                {
                    var utilisateur =  _UtilisateurRepository.GetUtilisateurById(idValidateur.Value);
                    var toEmailV = utilisateur.email;

                    if (!string.IsNullOrWhiteSpace(toEmailV))
                    {
                        CClist.Add(toEmailV);
                    }
                }

                var montantFormat = requete.Montant.Value.ToString("N2", new CultureInfo("fr-FR"));

                var mailBody = @$"
                    <div>
                        Madame, Monsieur, 
                        <br /><br />
                        Nous vous confirmons par le présent mail que votre requête mentionnée ci-dessous a été refusée à « l'étape n°{numeroEtape} : {descriptionEtape} » par « {validateur} ».
                        <br />
                        Pour toute information complémentaire relative à ce refus, nous vous invitons à prendre contact directement avec le validateur mentionné ci-dessus.
                        <br /><br />

                        <b><u>Objet de la requête : </u></b> {requete.Objet} <br />
                        <b><u>Numéro de la requête : </u></b> {Refinterne} <br />
                        <b><u>Montant : </u></b> {montantFormat} <br />
                        <b><u>Message : </u></b> {""/*Message*/} <br /><br />
                        <b><u>Commentaire : </u></b> {refus.commentaire} <br /><br />
                        
                        <b>Cliquer </b><a href='{""/*lien*/}'>ICI</a><b> pour visualiser le formulaire</b> <br /><br />

                        Cordialement,
                    </div>
                ";

                try
                {
                    await _mailService.SendEmail("Gestion Requête - Requête refusée", mailBody, Tolist, CClist);
                }
                catch (Exception ex)
                {

                }
            }
            catch (Exception ex) { }

            return RefusRequeteResult.Success;
        }

        public enum RedirectionRequeteResult
        {
            NotFoundHisto,
            NotFoundRequete,
            NotFoundStepActuelle,
            NotFoundStepNext,
            InvalidRedirection,
            Success
        }

        public async Task<RedirectionRequeteResult> RedirectionRequete(int idrequete, int currentUserId, RedirectionRequeteDTO redirection)
        {
            //REQUETE//
            var requete = await _context.Requete.FirstOrDefaultAsync(r => r.IdRequete == idrequete);
            if (requete == null)
                return RedirectionRequeteResult.NotFoundRequete;

            //Etape actuel
            var etapeActuelle = await _context.CircuitEtape.FirstOrDefaultAsync(ce => ce.idCircuitEtape == redirection.idCircuitEtapeActuelle && ce.deletiondate == null);
            if (etapeActuelle == null)
                return RedirectionRequeteResult.NotFoundStepActuelle;

            //Etape de redirection
            var etapeRedirection = await _context.CircuitEtape.FirstOrDefaultAsync(ce => ce.idCircuitEtape == redirection.idCircuitEtapeRedirection && ce.deletiondate == null);
            if (etapeRedirection == null)
                return RedirectionRequeteResult.NotFoundStepNext;

            //verification qu'on fait un retour (redirection)
            if (etapeRedirection.numero >= etapeActuelle.numero)
                return RedirectionRequeteResult.InvalidRedirection;

            //Liste des étape entre etapeActuelle et etapeRedirection
            var etapesAReinitialiser = await _context.CircuitEtape.Where(e => e.idCircuit == etapeActuelle.idCircuit && e.numero > etapeRedirection.numero && e.numero <= etapeActuelle.numero && e.deletiondate == null).ToListAsync();

            foreach (var etape in etapesAReinitialiser)
            {
                //Réinitialisation validation déjà faite
                var historiques = await _context.HistoriqueValidationRequete.Where(h => h.idRequete == idrequete && h.idCircuitEtape == etape.idCircuitEtape)
                    .ToListAsync();

                foreach (var h in historiques)
                {
                    h.dateValidation = null;
                    h.commentaire = null;
                    h.isValidator = null;
                    h.isPotential = false;
                }

                //Réinitialisation checklist
                var historiquesCheckList = await _context.HistoriqueValidationRequeteCheckList.Where(h => h.idRequete == idrequete && h.idCircuitEtape == etape.idCircuitEtape)
                    .ToListAsync();

                foreach (var h in historiquesCheckList)
                {
                    h.oui = null;
                    h.non = null;
                    h.nonapplicable = null;
                }
            }

            //etape de redirection
            var histosRedirection = await _context.HistoriqueValidationRequete.Where(h => h.idRequete == idrequete && h.idCircuitEtape == etapeRedirection.idCircuitEtape).ToListAsync();

            foreach (var h in histosRedirection)
            {
                h.commentaire = null;
                h.dateValidation = null;
                h.isValidator = null;
            }

            //Ajout historique de redirection
            var newHistoRedirection = new HistoriqueValidationRequeteRedirection
            {
                idfrom = etapeActuelle.idCircuitEtape,
                idto = etapeRedirection.idCircuitEtape,
                idRequete = idrequete,
                commentaire = redirection.commentaire,
                creationdate = DateTime.Now,
                isValidator = currentUserId
            };
            Console.WriteLine("HHHHHHHHHHHHHHHH");
            Console.WriteLine(currentUserId);
            _context.HistoriqueValidationRequeteRedirection.Add(newHistoRedirection);

            await _context.SaveChangesAsync();

            _context.Database.ExecuteSqlRaw("update historiquevalidationrequete set etatvalidation = 0 where idrequete = @p0 and idcircuitetape = @p1", idrequete, etapeRedirection.idCircuitEtape);
            _context.Database.ExecuteSqlRaw("update historiquevalidationrequetechecklist set oui = null where idrequete = @p0 and idcircuitetape = @p1", idrequete, etapeRedirection.idCircuitEtape);
            _context.Database.ExecuteSqlRaw("update historiquevalidationrequetechecklist set non = null where idrequete = @p0 and idcircuitetape = @p1", idrequete, etapeRedirection.idCircuitEtape);
            //Refinterne
            var accuse = await _context.RequeteAccuse.FirstOrDefaultAsync(a => a.idRequete == idrequete);
            var Refinterne = accuse?.referenceInterne ?? "";

            //To
            var Tolist = new List<string>();

            //CC
            var CClist = new List<string>();

            //numero etape
            var numeroEtape = 0;
            var numeroEtapeRED = 0;

            //description etape
            var descriptionEtape = "";
            var descriptionEtapeRED = "";

            //validateur
            var isValidateur =  _UtilisateurRepository.GetUtilisateurById(currentUserId);

            var fonction = string.IsNullOrWhiteSpace(isValidateur.fonction) ? "Sans fonction" : isValidateur.fonction;
            var email = string.IsNullOrWhiteSpace(isValidateur.email) ? "" : " : " + isValidateur.email;
            var firstname = string.IsNullOrWhiteSpace(isValidateur.firstname) ? "" : " : " + isValidateur.firstname;
            var lastname = string.IsNullOrWhiteSpace(isValidateur.lastname) ? "" : " " + isValidateur.lastname;

            var validateur = fonction + email + firstname + lastname;

            numeroEtape = etapeActuelle.numero;
            descriptionEtape = etapeActuelle.description;

            numeroEtapeRED = etapeRedirection.numero;
            descriptionEtapeRED = etapeRedirection.description;

            var dureeValidation = 0;
            if (dureeValidation == 0)
            {
                dureeValidation = etapeRedirection?.duree ?? 0;
            }

            //Notification validateurs ISPOTENTIAL REDIRECTION
            try
            {
                //To
                var validateurRedirection = await _context.HistoriqueValidationRequete.Where(h => h.idRequete == idrequete && h.idCircuitEtape == etapeRedirection.idCircuitEtape && h.isPotential == true).Select(h => h.idValidateur).Distinct().ToListAsync();
                foreach (var idValidateur in validateurRedirection)
                {
                    var utilisateur =  _UtilisateurRepository.GetUtilisateurById(idValidateur.Value);
                    var toEmailV = utilisateur.email;

                    if (!string.IsNullOrWhiteSpace(toEmailV))
                    {
                        Tolist.Add(toEmailV);
                    }
                }

                //CC

                var montantFormat = requete.Montant.Value.ToString("N2", new CultureInfo("fr-FR"));

                var mailBody = @$"
                    <div>
                        Madame, Monsieur, 
                        <br /><br />
                        Nous vous confirmons par le présent mail qu'une requête a été redirigée de « l'étape n°{numeroEtape} : {descriptionEtape} » par « {validateur} » vers « l'étape n°{numeroEtapeRED} : {descriptionEtapeRED} ». 
                        Elle est désormais en attente de votre validation.
                        <br />
                        Selon vos procédures, vous disposez d’un délai de {dureeValidation} heures pour effectuer la validation.
                        <br /><br />

                        <b><u>Objet de la requête : </u></b> {requete.Objet} <br />
                        <b><u>Numéro de la requête : </u></b> {requete.NumRequete} <br />
                        <b><u>Montant : </u></b> {montantFormat} <br />

                        <b><u>Message : </u></b> {""/*Message*/} <br /><br />
                        <b><u>Commentaire : </u></b> {redirection.commentaire} <br /><br />
                        
                        <b>Cliquer </b><a href='{""/*lien*/}'>ICI</a><b> pour visualiser le formulaire</b> <br /><br />

                        Cordialement,
                    </div>
                ";

                try
                {
                    //await _mailService.SendEmail("Gestion Requête - Requête redirigée", mailBody, Tolist, CClist);
                }
                catch (Exception ex)
                {

                }
            }
            catch (Exception ex) { }

            return RedirectionRequeteResult.Success;
        }

        public async Task<List<HistoValidationDTO>> GetValidationHistoryDetails(int idRequete)
        {
            var allEtapes = await _context.HistoriqueValidationRequete.Where(h => h.idRequete == idRequete /*&& (h.etatValidation == 4 || h.etatValidation == 5)*/).OrderBy(h => h.numero).ToListAsync();

            // Faire le distinct en mémoire
            var etapesDistinctes = allEtapes.GroupBy(h => new { h.idCircuitEtape, h.numero }).Select(g => g.First()).OrderBy(h => h.numero).ToList();

            var result = new List<HistoValidationDTO>();

            foreach (var etape in etapesDistinctes)
            {
                // Étape
                CircuitEtape e = _context.CircuitEtape.Where(c => c.idCircuitEtape == etape.idCircuitEtape).FirstOrDefault();
                string stepName = $"Étape {etape.numero} : {e.description}";

                // Utilisateurs validateurs
                var validateurs = await _context.HistoriqueValidationRequete.Where(h => h.idRequete == idRequete && h.idCircuitEtape == etape.idCircuitEtape)
                    .Join(_context.Utilisateur,
                        h => h.idValidateur,
                        u => u.IdUtilisateur,
                        (h, u) => new
                        {
                            u.username,
                            u.lastname,
                            u.firstname,
                            u.fonction,
                            u.email,
                            h.isPotential
                        }).ToListAsync();

                var listeUserValidator = string.Join("", validateurs.Select(v => $"<li>{(string.IsNullOrEmpty(v.fonction) ? "Sans fonction" : v.fonction)} : {v.email} : {v.firstname} {v.lastname}</li>"));

                var listeUserValidatorPO = string.Join("", validateurs.Where(v => v.isPotential == true).Select(v => $"<li>{(string.IsNullOrEmpty(v.fonction) ? "Sans fonction" : v.fonction)} : {v.email} : {v.firstname} {v.lastname}</li>"));

                // Commentaire, date, validateur
                var validation = await _context.HistoriqueValidationRequete.Where(h => h.idRequete == idRequete && h.idCircuitEtape == etape.idCircuitEtape && h.isValidator == true && h.dateValidation != null)
                    .Join(_context.Utilisateur,
                        h => h.idValidateur,
                        u => u.IdUtilisateur,
                        (h, u) => new
                        {
                            h.dateValidation,
                            h.commentaire,
                            u.username,
                            u.lastname,
                            u.firstname,
                            u.fonction,
                            u.email
                        }).FirstOrDefaultAsync();

                string stepValidator = validation != null ? $"{(string.IsNullOrEmpty(validation.fonction) ? "Sans fonction" : validation.fonction)} : {validation.email} : {validation.firstname} {validation.lastname}" : "";

                string stepDate = validation?.dateValidation?.ToString("dd-MM-yyyy HH:mm") ?? "";
                string commentaire = validation?.commentaire ?? "";

                // Checklist
                var historiques = await _context.HistoriqueValidationRequeteCheckList.Where(c => c.idRequete == idRequete && c.idCircuitEtape == etape.idCircuitEtape).ToListAsync();

                var libelles = await _context.CircuitEtapeCheckList.Where(l => l.idCircuitEtape == etape.idCircuitEtape).ToListAsync();

                string listechk = "";
                foreach (var libelle in libelles)
                {
                    var historique = historiques.FirstOrDefault(h => h.idCircuitEtape == libelle.idCircuitEtape && h.idCircuitEtapeCheckList == libelle.idCircuitEtapeCheckList);

                    string etat = "Non renseigné";

                    if (historique != null)
                    {
                        if (historique.nonapplicable == true)
                            etat = "Non applicable";
                        else if (historique.oui == true)
                            etat = "Oui";
                        else if (historique.non == true)
                            etat = "Non";
                    }

                    listechk += $"<li>{libelle.libelle} : {etat}</li>";
                }

                result.Add(new HistoValidationDTO
                {
                    IntituleEtape = stepName,
                    Validateur = stepValidator,
                    DateValidation = stepDate,
                    Commentaire = commentaire,
                    ListValidateur = listeUserValidator,
                    ListValidateurPo = listeUserValidatorPO,
                    ListeCheckList = listechk
                });
            }

            return result;
        }

        public async Task<List<HistoCanceledDTO>> GetCanceledHistoryDetails(int idRequete)
        {
            var res = new List<HistoCanceledDTO>();

            var requete = await _context.Requete.FirstOrDefaultAsync(r => r.IdRequete == idRequete);

            if (requete != null && requete.EtatValidation == 2)
            {
                var refus = await _context.HistoriqueValidationRequete.Where(h => h.idRequete == idRequete && h.isValidator == true && h.dateValidation != null && h.etatValidation == 2).OrderBy(h => h.dateValidation)
                .Select(h => new
                {
                    h.commentaire,
                    h.dateValidation,
                    h.idValidateur,
                    h.numero,
                    h.idCircuitEtape,
                    Validateur = h.idValidateur
                }).FirstOrDefaultAsync();

                if (refus != null)
                {
                    var utilisateur =  _UtilisateurRepository.GetUtilisateurById(refus.Validateur.Value);
                    string stepValidator = utilisateur != null ? $"{(string.IsNullOrEmpty(utilisateur.fonction) ? "Sans fonction" : utilisateur.fonction)} : {utilisateur.email} : {utilisateur.firstname} {utilisateur.lastname}" : "";

                    string dateRefus = refus.dateValidation?.ToString("dd-MM-yyyy HH:mm") ?? "";

                    var etapeRefus = await _context.CircuitEtape.FirstOrDefaultAsync(ce => ce.idCircuitEtape == refus.idCircuitEtape && ce.deletiondate == null);
                    string stepNameRefus = etapeRefus != null ? $"Etape n°{etapeRefus.numero} : {etapeRefus.description}" : "";

                    string comment = refus.commentaire ?? "";

                    res.Add(new HistoCanceledDTO
                    {
                        IntituleEtape = stepNameRefus,
                        DateRefus = dateRefus,
                        Commentaire = comment,
                        Validateur = stepValidator
                    });
                }
            }

            return res;
        }

        public async Task<List<HistoRedirectedDTO>> GetRedirectionHistoryDetails(int idRequete)
        {
            var res = await _context.HistoriqueValidationRequeteRedirection.Where(r => r.idRequete == idRequete).OrderBy(r => r.creationdate)
                .Select(r => new
                {
                    r.creationdate,
                    r.commentaire,
                    r.idfrom,
                    r.idto,
                    r.isValidator
                }).ToListAsync();

            var result = new List<HistoRedirectedDTO>();

            foreach (var r in res)
            {
                var etapeFrom = await _context.CircuitEtape.FirstOrDefaultAsync(e => e.idCircuitEtape == r.idfrom);

                var etapeTo = await _context.CircuitEtape.FirstOrDefaultAsync(e => e.idCircuitEtape == r.idto);

                var isValidator = await _context.HistoriqueValidationRequete.FirstOrDefaultAsync(h => h.idCircuitEtape == etapeFrom.idCircuitEtape && h.idRequete == idRequete && h.numero == etapeFrom.numero && h.idValidateur == r.isValidator);
                var utilisateur = _UtilisateurRepository.GetUtilisateurById(isValidator.idValidateur.Value);
                string stepValidator = utilisateur != null ? $"{(string.IsNullOrEmpty(utilisateur.fonction) ? "Sans fonction" : utilisateur.fonction)} : {utilisateur.email} : {utilisateur.firstname} {utilisateur.lastname}" : "";

                result.Add(new HistoRedirectedDTO
                {
                    DateRedirection = r.creationdate.ToString("dd-MM-yyyy HH:mm"),
                    Commentaire = r.commentaire ?? "",
                    IntituleEtapeFrom = $"Etape n°{etapeFrom?.numero} : {etapeFrom?.description ?? "?"}",
                    IntituleEtapeTo = $"Etape n°{etapeTo?.numero} : {etapeTo?.description ?? "?"}",
                    Validateur = stepValidator
                });
            }

            return result;
        }
    }
}