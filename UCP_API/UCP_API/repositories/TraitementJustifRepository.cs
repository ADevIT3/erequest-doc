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
using static UCP_API.repositories.TraitementRequeteRepository;

namespace UCP_API.repositories
{
    public class TraitementJustifRepository
    {
        private readonly AppDbContext _context;
        private readonly Mailservice _mailService;
        private readonly UtilisateurRepository _UtilisateurRepository;

        public TraitementJustifRepository(AppDbContext context, Mailservice mailService, UtilisateurRepository utilisateurRepository)
        {
            _context = context;
            _mailService = mailService;
            _UtilisateurRepository = utilisateurRepository;
        }

        // accusé de réception (receveur de requête ) => change STATUT = 1
        public async Task<bool> ReceptionJustif(int idJustif, int currentUserId)
        {
            var justif = await _context.Justificatif.FirstOrDefaultAsync(a => a.IdJustif == idJustif);
            if (justif == null)
                return false;

            justif.EtatValidation = 1;
            await _context.SaveChangesAsync();

            var Refinterne = await ReferenceInterneJustif(idJustif, currentUserId);

            try
            {
                //To
                var isSender =  _UtilisateurRepository.GetUtilisateurById(justif.IdUtilisateur);
                var Tolist = new List<string>();
                var toEmail = isSender?.email;
                if (!string.IsNullOrWhiteSpace(toEmail))
                    Tolist = new List<string> { toEmail };

                //CC
                var isAccuseForCC =  _UtilisateurRepository.GetUtilisateurById(currentUserId);
                var CClist = new List<string?>();
                CClist = isAccuseForCC?.UtilisateurCCs?.Select(cc => cc.mailCC).Where(email => !string.IsNullOrWhiteSpace(email)).ToList() ?? new List<string?>();

                var montantFormat = justif.Montant?.ToString("N2", new CultureInfo("fr-FR")) ?? "0,00";

                //Message
                var message = justif.message;

                var mailBody = @$"
                    <div>
                        Madame, Monsieur, 
                        <br /><br />
                        Nous vous accusons réception par le présent mail que le justificatif que vous avez envoyé a bien été reçu.
                        <br /><br />

                        <b><u>Numéro du justificatif : </u></b> {justif.Numero} <br />
                        <b><u>Montant : </u></b> {montantFormat} <br />
                        <b><u>Message : </u></b> {message} <br /><br />
                        Vous serez tenu(e) informé(e) de l’avancement du traitement ainsi que de toute information complémentaire qui pourrait être requise.<br /><br />
                        Cordialement,
                    </div>
                ";

                try
                {
                    await _mailService.SendEmail("Gestion Justificatif - Accusé de réception", mailBody, Tolist, CClist);
                }
                catch (Exception ex)
                {

                }

            }
            catch (Exception ex) { }

            return true;
        }

        public async Task<bool> SendMailRevision(int idJustif, int currentUserId)
        {
            var justif = await _context.Justificatif.Include(j => j.Requete).FirstOrDefaultAsync(a => a.IdJustif == idJustif);
            if (justif == null)
                return false;


            try
            {
                //To
                var isSender = _UtilisateurRepository.GetUtilisateurById(justif.IdUtilisateur);
                var Tolist = new List<string>();
                var toEmail = isSender?.email;
                if (!string.IsNullOrWhiteSpace(toEmail))
                    Tolist = new List<string> { toEmail };

                //CC
                var isAccuseForCC = _UtilisateurRepository.GetUtilisateurById(currentUserId);
                var CClist = new List<string?>();
                CClist = isAccuseForCC?.UtilisateurCCs?.Select(cc => cc.mailCC).Where(email => !string.IsNullOrWhiteSpace(email)).ToList() ?? new List<string?>();

               

                //Message
                var message = justif.message;

                var mailBody = @$"
                    <div>
                        Madame, Monsieur, 
                        <br /><br />
                        Nous vous informons que le justificatif relatif à la requête portant la référence n° {justif.Requete.NumRequete} vous est renvoyé pour correction.
                        <br /><br />
                        
                        <b><u>Objet de la requête : </u></b> {justif.Requete.Objet} <br />
                        <b><u>Numéro de la requête : </u></b> {justif.Requete.NumRequete} <br />
                        
                      
                       
                    </div>
                ";

                try
                {
                    await _mailService.SendEmail("Gestion Justificatif - Révision de justificatif", mailBody, Tolist, CClist);
                }
                catch (Exception ex)
                {

                }

            }
            catch (Exception ex) { }

            return true;
        }

        // reference interrrrrrrrrrne
        public async Task<string> ReferenceInterneJustif(int idJustif, int currentUserId)
        {
            var justif = await _context.Justificatif.FirstOrDefaultAsync(a => a.IdJustif == idJustif);
            if (justif == null)
                return string.Empty;

            //GET requete car SITE REQUETE = SITE JUSTIF
            int idrequete = justif.IdRequete;
            var requete = await _context.Requete.FirstOrDefaultAsync(a => a.IdRequete == idrequete);
            if (requete == null)
                return string.Empty;

            string requeteSite = await GetRequeteSiteCodeBySiteId(requete.IdSite);
            if (string.IsNullOrWhiteSpace(requeteSite))
                return string.Empty;

            int justifAnnee = justif.CreationDate.Year;

            int justifNumero = await GetJustifNumberByJustifId(requeteSite, justifAnnee) + 1;

            //string sdocumentserie = "0000" + justifNumero.ToString();//Manao erreur ito ra + 9999
            string sdocumentserie = justifNumero.ToString().PadLeft(6, '0');

            sdocumentserie = sdocumentserie.Substring(sdocumentserie.Length - 6);

            string referenceinterne = $"{"JUS"}/{justifAnnee.ToString().Substring(2, 2)}/{requeteSite}/{sdocumentserie}";

            var recepI = new JustificatifAccuse
            {
                idJustif = idJustif,
                creationdate = DateTime.Now,
                createdby = currentUserId,
                justifNumero = justifNumero,
                justifYear = justifAnnee,
                justifSite = requeteSite,
                referenceInterne = referenceinterne
            };

            _context.JustificatifAccuse.Add(recepI);
            await _context.SaveChangesAsync();

            return referenceinterne;
        }

        public async Task<string> GetRequeteSiteCodeBySiteId(int idSite)
        {
            var site = await _context.Site.FirstOrDefaultAsync(s => s.idSite == idSite && s.deletiondate == null);
            return site?.code;
        }

        public async Task<int> GetJustifNumberByJustifId(string requeteSite, int justifAnnee)
        {
            var maxJustifNumero = await _context.JustificatifAccuse.Where(r => r.justifSite == requeteSite && r.justifYear == justifAnnee).MaxAsync(r => (int?)r.justifNumero);

            return maxJustifNumero ?? 0;
        }

        public enum JustifToCircuitResult
        {
            NotFound,
            NoStep,
            NoStepValidateur,
            Success
        }

        // Rattachement circuit - requête
        public async Task<JustifToCircuitResult> RattJustifToCircuit(int idJustif, int idCircuit, int currentUserId)
        {
            var Circuit = await _context.Circuit.FirstOrDefaultAsync(a => a.idCircuit == idCircuit && a.deletiondate == null);
            if (Circuit == null)
                return (JustifToCircuitResult.NotFound);

            //test si aucune ETAPE pour le circuit
            var circuitEtapes = await _context.CircuitEtape.Where(ce => ce.idCircuit == idCircuit && ce.deletiondate == null).OrderBy(ce => ce.numero).ToListAsync();

            if (!circuitEtapes.Any())
                return JustifToCircuitResult.NoStep;

            //test si aucun validateur par ETAPE
            foreach (var etape in circuitEtapes)
            {
                bool hasValidateur = await _context.CircuitEtapeValidateur.AnyAsync(cev => cev.idCircuitEtape == etape.idCircuitEtape && cev.deletiondate == null);

                if (!hasValidateur)
                    return JustifToCircuitResult.NoStepValidateur;
            }

            //insertion pour validateurs et insertion pour checklist
            //insertion dans table circuitRequete
            var newCircuitJustif = new CircuitJustificatif
            {
                idCircuit = idCircuit,
                idJustif = idJustif
            };

            _context.CircuitJustificatif.Add(newCircuitJustif);

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
                    _context.HistoriqueValidationJustificatif.Add(new HistoriqueValidationJustificatif
                    {
                        idJustif = idJustif,
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
                    _context.HistoriqueValidationJustificatifCheckList.Add(new HistoriqueValidationJustificatifCheckList
                    {
                        idJustif = idJustif,
                        idCircuitEtape = cl.idCircuitEtape,
                        idCircuitEtapeCheckList = cl.idCircuitEtapeCheckList,
                        creationdate = DateTime.Now,
                        createdby = currentUserId
                    });
                }
            }

            await _context.SaveChangesAsync();

            var justif = await _context.Justificatif.FirstOrDefaultAsync(a => a.IdJustif == idJustif);

            //Refinterne
            var accuse = await _context.JustificatifAccuse.FirstOrDefaultAsync(a => a.idJustif == idJustif);
            var Refinterne = accuse?.referenceInterne ?? "";

            //NOM AGMO
            var isSender =  _UtilisateurRepository.GetUtilisateurById(justif.IdUtilisateur);
            var AGMO = $"{isSender?.lastname} {isSender?.firstname}".Trim();

            //Notification First validateur
            try
            {
                //To
                var Tolist = new List<string>();
                if (FirstValidateur != null && FirstValidateur.Any())
                {
                    foreach (var validateurId in FirstValidateur)
                    {
                        var isFv =  _UtilisateurRepository.GetUtilisateurById(validateurId);
                        var To = isFv.email;

                        Tolist.Add(To);
                    }
                }

                //CC
                var CClist = new List<string>();

                var montantFormat = justif.Montant.Value.ToString("N2", new CultureInfo("fr-FR"));

                //Message
                var message = justif.message;

                var mailBody = @$"
                    <div>
                        Madame, Monsieur, 
                        <br /><br />
                        Nous vous confirmons par le présent mail qu'un justificatif émis par « {AGMO} » a été envoyé et est en attente de votre validation.
                        <br />
                        Selon vos procédures, vous disposez d’un délai de {dureeValidation} heures pour effectuer la validation.
                        <br /><br />

                        <b><u>Numéro du justificatif : </u></b> {justif.Numero} <br />
                        <b><u>Montant : </u></b> {montantFormat} <br />
                        <b><u>Message : </u></b> {message} <br /><br />
                        
                        <b>Cliquer </b><a href='{""/*lien*/}'>ICI</a><b> pour visualiser le formulaire</b> <br /><br />

                        Cordialement,
                    </div>
                ";

                try
                {
                    await _mailService.SendEmail("Gestion Justificatif - Rattachement justificatif à un circuit", mailBody, Tolist, CClist);
                }
                catch (Exception ex)
                {

                }
            }
            catch (Exception ex) { }

            return (JustifToCircuitResult.Success);
        }

        public enum JustifToCircuitDetachResult
        {
            NotFound,
            Success
        }

        public async Task<JustifToCircuitDetachResult> DetachJustifFromCircuit(int idJustif)
        {
            //delete dans table circuitRequete
            var liaison = await _context.CircuitJustificatif.FirstOrDefaultAsync(cr => cr.idJustif == idJustif);

            if (liaison == null)
                return JustifToCircuitDetachResult.NotFound;

            var idCircuit = liaison.idCircuit;

            var etapes = await _context.CircuitEtape.Where(ce => ce.idCircuit == idCircuit && ce.deletiondate == null).Select(ce => ce.idCircuitEtape).ToListAsync();

            //delete historique de validation : HistoriqueValidationRequete
            var historiques = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == idJustif && etapes.Contains(h.idCircuitEtape)).ToListAsync();

            _context.HistoriqueValidationJustificatif.RemoveRange(historiques);

            //delete checklist : HistoriqueValidationRequeteCheckList
            var historiquesCheckList = await _context.HistoriqueValidationJustificatifCheckList.Where(h => h.idJustif == idJustif && etapes.Contains(h.idCircuitEtape)).ToListAsync();

            _context.HistoriqueValidationJustificatifCheckList.RemoveRange(historiquesCheckList);

            _context.CircuitJustificatif.Remove(liaison);

            await _context.SaveChangesAsync();

            return JustifToCircuitDetachResult.Success;
        }

        public enum ValidateJustifeResult
        {
            NotFoundHisto,
            NotFoundRequete,
            Success
        }

        public async Task<HistoriqueValidationJustificatif?> ValidateJustif(int idjustif, int currentUserId, ValidationJustifDTO validationnext)
        {
            //var histovalid = await _context.HistoriqueValidationJustificatif.FirstOrDefaultAsync(h => h.idJustif == idjustif && h.idCircuitEtape == idcircuitetape && h.idValidateur == currentUserId);
            var histovalid = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == idjustif && h.idCircuitEtape == validationnext.idCircuitEtape && h.idValidateur == currentUserId && h.dateValidation == null).OrderBy(h => h.numero).FirstOrDefaultAsync();

            if (histovalid == null)
                //return ValidateJustifeResult.NotFoundHisto;
                return null;

            int idcircuitetape = histovalid.idCircuitEtape;

            //JUSTIF//
            var justif = await _context.Justificatif.FirstOrDefaultAsync(r => r.IdJustif == idjustif);
            if (justif == null)
                //return ValidateJustifeResult.NotFoundRequete;
                return null;

            //Refinterne
            var accuse = await _context.JustificatifAccuse.FirstOrDefaultAsync(a => a.idJustif == idjustif);
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
            var isValidateur =  _UtilisateurRepository.GetUtilisateurById(currentUserId);

            var fonction = string.IsNullOrWhiteSpace(isValidateur.fonction) ? "Sans fonction" : isValidateur.fonction;
            var email = string.IsNullOrWhiteSpace(isValidateur.email) ? "" : " : " + isValidateur.email;
            var firstname = string.IsNullOrWhiteSpace(isValidateur.firstname) ? "" : " : " + isValidateur.firstname;
            var lastname = string.IsNullOrWhiteSpace(isValidateur.lastname) ? "" : " " + isValidateur.lastname;

            var validateur = fonction + email + firstname + lastname;

            //maj HistoriqueValidationJustificatif pour le validateur
            DateTime datevalidation = DateTime.Now;

            histovalid.commentaire = validationnext.commentaire;
            histovalid.dateValidation = datevalidation;
            histovalid.isValidator = true;

            //maj autre de même étape
            var autreshistovalidNotLast = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == idjustif && h.idCircuitEtape == idcircuitetape && h.dateValidation == null && h.idValidateur != currentUserId).ToListAsync();
            if (autreshistovalidNotLast.Any())
            {
                foreach (var h in autreshistovalidNotLast)
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
                //maj HistoriqueValidationJustificatif pour le validateur
                histovalid.etatValidation = 5;

                //maj statut JUSTIF
                justif.EtatValidation = 5;

                //maj autre de même étape
                var autreshistovalidLast = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == idjustif && h.idCircuitEtape == idcircuitetape && h.dateValidation == null && h.idValidateur != currentUserId).ToListAsync();
                if (autreshistovalidLast.Any())
                {
                    foreach (var h in autreshistovalidLast)
                    {
                        h.dateValidation = datevalidation;
                        h.etatValidation = 5;
                    }
                }

                //maj checklist
                await UpdateChecklist(idjustif, idcircuitetape, validationnext.Checklist);

                await _context.SaveChangesAsync();

                //Notification fin de processus => AGMO et mail CC du receveur
                try
                {
                    //To
                    var isSender =  _UtilisateurRepository.GetUtilisateurById(justif.IdUtilisateur);
                    var toEmail = isSender?.email;
                    if (!string.IsNullOrWhiteSpace(toEmail))
                        Tolist = new List<string> { toEmail };

                    //CC
                    var isAccuseForutilisateurId = _context.JustificatifAccuse.FirstOrDefault(ra => ra.idJustif == justif.IdJustif).createdby;
                    var isAccuseForCC =  _UtilisateurRepository.GetUtilisateurById(isAccuseForutilisateurId);
                    CClist = isAccuseForCC?.UtilisateurCCs?.Select(cc => cc.mailCC).Where(email => !string.IsNullOrWhiteSpace(email)).ToList() ?? new List<string?>();

                    var montantFormat = justif.Montant.Value.ToString("N2", new CultureInfo("fr-FR"));

                    //Message
                    var message = justif.message;

                    var mailBody = @$"
                        <div>
                            Madame, Monsieur, 
                            <br /><br />
                            Nous vous confirmons par le présent mail la validation finale de votre justificatif par « {validateur} ».
                            <br /><br />

                            <b><u>Numéro du justificatif : </u></b> {justif.Numero} <br />
                            <b><u>Montant : </u></b> {montantFormat} <br />
                            <b><u>Message : </u></b> {message} <br /><br />

                            Cordialement,
                        </div>
                    ";

                    try
                    {
                        await _mailService.SendEmail("Gestion Justificatif - Justificatif validé", mailBody, Tolist, CClist);
                    }
                    catch (Exception ex)
                    {

                    }
                }
                catch (Exception ex) { }

                //return ValidateJustifeResult.Success;
                return histovalid;
            }

            //etape suivante
            //maj HistoriqueValidationJustificatif pour le validateur
            histovalid.etatValidation = 4;

            //maj statut JUSTIF
            justif.EtatValidation = 4;

            

            //maj checklist
            await UpdateChecklist(idjustif, idcircuitetape, validationnext.Checklist);

            //Skyp Passation marché ou non
            //Skyp == true = etape PassMarch à sauter
            if (validationnext.ispmskyp == true)
            {
                //maj etape E+1
                var etapePassMarcheSKYP = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == idjustif && h.idCircuitEtape == prochaineEtape.idCircuitEtape && h.numero == prochaineEtape.numero && h.dateValidation == null).ToListAsync();
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
                if (prochaineEtape2 != null)
                {
                    var validateursSuivants = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == idjustif && h.idCircuitEtape == prochaineEtape2.idCircuitEtape && idValidateurNext.Contains(h.idValidateur.Value) && h.dateValidation == null).ToListAsync();

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
                    justif.EtatValidation = 5;
                }
            }
            else
            {
                //maj etape E+1
                List<int> idValidateurNext = validationnext.idValidateurNext;
                var validateursSuivants = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == idjustif && h.idCircuitEtape == prochaineEtape.idCircuitEtape && idValidateurNext.Contains(h.idValidateur.Value) && h.dateValidation == null).ToListAsync();

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

                var montantFormat = justif.Montant.Value.ToString("N2", new CultureInfo("fr-FR"));

                //Message
                var message = justif.message;


                var mailBody = @$"
                    <div>
                        Madame, Monsieur, 
                        <br /><br />
                        Nous vous confirmons par le présent mail qu'un justificatif a été validé par « {validateur} » et est désormais en attente de votre validation.
                        <br />
                        Selon vos procédures, vous disposez d’un délai de {dureeValidation} heures pour effectuer la validation.
                        <br /><br />

                        <b><u>Numéro du justificatif : </u></b> {Refinterne} <br />
                        <b><u>Montant : </u></b> {montantFormat} <br />
                        <b><u>Message : </u></b> {message} <br /><br />
                        <b><u>Commentaire : </u></b> {validationnext.commentaire} <br /><br />
                        
                        <b>Cliquer </b><a href='{""/*lien*/}'>ICI</a><b> pour visualiser le formulaire</b> <br /><br />

                        Cordialement,
                    </div>
                ";

                try
                {
                    await _mailService.SendEmail("Gestion Justificatif - Justificatif en attente validation", mailBody, Tolist, CClist);
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
                var isSender = _UtilisateurRepository.GetUtilisateurById(justif.IdUtilisateur);
                var toEmail = isSender?.email;
                if (!string.IsNullOrWhiteSpace(toEmail))
                    Tolist = new List<string> { toEmail };

                //CC
                CClist = new List<string>();

                var montantFormat = justif.Montant.Value.ToString("N2", new CultureInfo("fr-FR"));

                var mailBody = @$"
                    <div>
                        Madame, Monsieur, 
                        <br /><br />
                        Nous vous confirmons par le présent mail que votre justificatif mentionné ci-dessous, est en attente de validation à « l'étape n°{numeroEtapeNext} : {descriptionEtapeNext} ».
                        <br /><br />

                        <b><u>Numéro du justificatife : </u></b> {Refinterne} <br />
                        <b><u>Montant : </u></b> {montantFormat} <br /><br />

                        Vous serez tenu(e) informé(e) de l’avancement du traitement ainsi que de toute information complémentaire qui pourrait être requise.<br /><br />

                        Cordialement,
                    </div>
                ";

                try
                {
                    await _mailService.SendEmail("Gestion Justificatif - Justificatif validé (étape)", mailBody, Tolist, CClist);
                }
                catch (Exception ex)
                {

                }
            }
            catch (Exception ex) { }

            //eturn ValidateJustifeResult.Success;
            return histovalid;
        }

        private async Task UpdateChecklist(int idJustif, int idCircuitEtape, List<ValidationJustifChecklistReponseDTO> checklist)
        {
            var idsChecklist = checklist.Select(c => c.idCircuitEtapeCheckList).ToList();

            var lignes = await _context.HistoriqueValidationJustificatifCheckList
                .Where(h => h.idJustif == idJustif && h.idCircuitEtape == idCircuitEtape && idsChecklist.Contains(h.idCircuitEtapeCheckList))
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

        public async Task<bool> ValidateMultipleJustif(List<int> idjustif, int currentUserId)
        {
            try
            {
                var tasks = idjustif.Select(id => ValidateSingleJustif(id, currentUserId));
                await Task.WhenAll(tasks);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task ValidateSingleJustif(int idjustif, int currentUserId)
        {
            try
            {
                var histovalid = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == idjustif && h.idValidateur == currentUserId && h.dateValidation == null).OrderBy(h => h.numero).FirstOrDefaultAsync();

                int idcircuitetape = histovalid.idCircuitEtape;

                //JUSTIF//
                var justif = await _context.Justificatif.FirstOrDefaultAsync(r => r.IdJustif == idjustif);

                //Refinterne
                var accuse = await _context.JustificatifAccuse.FirstOrDefaultAsync(a => a.idJustif == idjustif);
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

                //maj HistoriqueValidationJustificatif pour le validateur
                DateTime datevalidation = DateTime.Now;

                histovalid.commentaire = "";
                histovalid.dateValidation = datevalidation;
                histovalid.isValidator = true;

                //Vérification si dernière ETAPE//
                // Recup numero et idCircuit de l'étape actuel
                var etapeActuelle = await _context.CircuitEtape.Where(e => e.idCircuitEtape == idcircuitetape && e.deletiondate == null).Select(e => new { e.numero, e.idCircuit }).FirstOrDefaultAsync();

                var prochaineEtape = await _context.CircuitEtape.Where(ce => ce.idCircuit == etapeActuelle.idCircuit && ce.numero == etapeActuelle.numero + 1 && ce.deletiondate == null).FirstOrDefaultAsync();

                //dernière etape
                if (prochaineEtape == null)
                {
                    //maj HistoriqueValidationJustificatif pour le validateur
                    histovalid.etatValidation = 5;

                    //maj statut REQUETE
                    justif.EtatValidation = 5;

                    //maj autre de même étape
                    var autreshistovalidLast = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == idjustif && h.idCircuitEtape == idcircuitetape && h.dateValidation == null && h.idValidateur != currentUserId).ToListAsync();
                    if (autreshistovalidLast.Any())
                    {
                        foreach (var h in autreshistovalidLast)
                        {
                            h.dateValidation = datevalidation;
                            h.etatValidation = 5;
                        }
                    }

                    await _context.SaveChangesAsync();

                    //Notification fin de processus => AGMO et mail CC du receveur
                    try
                    {
                        //To
                        var isSender =  _UtilisateurRepository.GetUtilisateurById(justif.IdUtilisateur);
                        var toEmail = isSender?.email;
                        if (!string.IsNullOrWhiteSpace(toEmail))
                            Tolist = new List<string> { toEmail };

                        //CC
                        var isAccuseForutilisateurId = _context.JustificatifAccuse.FirstOrDefault(ra => ra.idJustif == justif.IdJustif).createdby;
                        var isAccuseForCC =  _UtilisateurRepository.GetUtilisateurById(isAccuseForutilisateurId);
                        CClist = isAccuseForCC?.UtilisateurCCs?.Select(cc => cc.mailCC).Where(email => !string.IsNullOrWhiteSpace(email)).ToList() ?? new List<string?>();

                        var montantFormat = justif.Montant.Value.ToString("N2", new CultureInfo("fr-FR"));

                        //Message
                        var message = justif.message;

                        var mailBody = @$"
                                <div>
                                    Madame, Monsieur, 
                                    <br /><br />
                                    Nous vous confirmons par le présent mail la validation finale de votre justificatif par « {validateur} ».
                                    <br /><br />

                                    <b><u>Numéro du justificatif : </u></b> {Refinterne} <br />
                                    <b><u>Montant : </u></b> {montantFormat} <br />
                                    <b><u>Message : </u></b> {message} <br /><br />

                                    Cordialement,
                                </div>
                            ";

                        try
                        {
                            await _mailService.SendEmail("Gestion Justificatif - Justificatif validé", mailBody, Tolist, CClist);
                        }
                        catch (Exception ex)
                        {

                        }
                    }
                    catch (Exception ex) { }
                }

                //etape suivante
                //maj HistoriqueValidationJustificatif pour le validateur
                histovalid.etatValidation = 4;

                //maj statut JUSTIF
                justif.EtatValidation = 4;

                //maj autre de même étape
                var autreshistovalidNotLast = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == idjustif && h.idCircuitEtape == idcircuitetape && h.dateValidation == null && h.idValidateur != currentUserId).ToListAsync();
                if (autreshistovalidNotLast.Any())
                {
                    foreach (var h in autreshistovalidNotLast)
                    {
                        h.dateValidation = datevalidation;
                        h.etatValidation = 4;
                    }
                }

                int dureeValidation = 0;

                //maj etape E+1
                var validateursSuivants = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == idjustif && h.idCircuitEtape == prochaineEtape.idCircuitEtape).ToListAsync();

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

                    var montantFormat = justif.Montant.Value.ToString("N2", new CultureInfo("fr-FR"));

                    //Message
                    var message = justif.message;

                    var mailBody = @$"
                            <div>
                                Madame, Monsieur, 
                                <br /><br />
                                Nous vous confirmons par le présent mail qu'un justificatif a été validé par « {validateur} » et est désormais en attente de votre validation.
                                <br />
                                Selon vos procédures, vous disposez d’un délai de {dureeValidation} heures pour effectuer la validation.
                                <br /><br />

                                <b><u>Numéro du justificatif : </u></b> {Refinterne} <br />
                                <b><u>Montant : </u></b> {montantFormat} <br />
                                <b><u>Message : </u></b> {message} <br /><br />
                                <b><u>Commentaire : </u></b> {""} <br /><br />

                                Vous serez tenu(e) informé(e) de l’avancement du traitement ainsi que de toute information complémentaire qui pourrait être requise.<br /><br />
                        
                                <b>Cliquer </b><a href='{""/*lien*/}'>ICI</a><b> pour visualiser le formulaire</b> <br /><br />

                                Cordialement,
                            </div>
                        ";

                    try
                    {
                        await _mailService.SendEmail("Gestion Justificatif - Justificatif en attente validation", mailBody, Tolist, CClist);
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
                    var isSender =  _UtilisateurRepository.GetUtilisateurById(justif.IdUtilisateur);
                    var toEmail = isSender?.email;
                    if (!string.IsNullOrWhiteSpace(toEmail))
                        Tolist = new List<string> { toEmail };

                    //CC
                    CClist = new List<string>();

                    var montantFormat = justif.Montant.Value.ToString("N2", new CultureInfo("fr-FR"));

                    var mailBody = @$"
                            <div>
                                Madame, Monsieur, 
                                <br /><br />
                                Nous vous confirmons par le présent mail que votre justificatif mentionné ci-dessous, est en attente de validation à « l'étape n°{numeroEtapeNext} : {descriptionEtapeNext} ».
                                <br /><br />

                                <b><u>Numéro du justificatif : </u></b> {Refinterne} <br />
                                <b><u>Montant : </u></b> {montantFormat} <br /><br />

                                Vous serez tenu(e) informé(e) de l’avancement du traitement ainsi que de toute information complémentaire qui pourrait être requise.<br /><br />

                                Cordialement,
                            </div>
                        ";

                    try
                    {
                        await _mailService.SendEmail("Gestion Justificatif - Justificatif validé (étape)", mailBody, Tolist, CClist);
                    }
                    catch (Exception ex)
                    {

                    }
                }
                catch (Exception ex) { }
            }
            catch { }
        }

        public enum RefusJustifResult
        {
            NotFoundHisto,
            NotFoundRequete,
            Success
        }

        public async Task<RefusJustifResult> RefusJustif(int idjustif, int currentUserId, RefusJustifDTO refus)
        {
            //var histovalid = await _context.HistoriqueValidationJustificatif.FirstOrDefaultAsync(h => h.idJustif == idjustif && h.idCircuitEtape == idcircuitetape && h.idValidateur == currentUserId);
            var histovalid = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == idjustif && h.idCircuitEtape == refus.idCircuitEtape && h.idValidateur == currentUserId && h.dateValidation == null).OrderBy(h => h.numero).FirstOrDefaultAsync();

            if (histovalid == null)
                return RefusJustifResult.NotFoundHisto;

            int idcircuitetape = histovalid.idCircuitEtape;

            //JUSTIF//
            var justif = await _context.Justificatif.FirstOrDefaultAsync(r => r.IdJustif == idjustif);
            if (justif == null)
                return RefusJustifResult.NotFoundRequete;

            //Refinterne
            var accuse = await _context.JustificatifAccuse.FirstOrDefaultAsync(a => a.idJustif == idjustif);
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

            var validateur = fonction + email + firstname + lastname;

            //maj HistoriqueValidationJustificatif pour le validateur
            DateTime daterefus = DateTime.Now;

            histovalid.commentaire = refus.commentaire;
            histovalid.dateValidation = daterefus;
            histovalid.isValidator = true;
            histovalid.etatValidation = 2;

            //maj statut JUSTIF
            justif.EtatValidation = 2;

            //maj autre de même étape
            var autreshistovalid = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == idjustif && h.idCircuitEtape == idcircuitetape && h.dateValidation == null && h.idValidateur != currentUserId).ToListAsync();
            if (autreshistovalid.Any())
            {
                foreach (var h in autreshistovalid)
                {
                    h.dateValidation = daterefus;
                    h.etatValidation = 2;
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
                var isSender =  _UtilisateurRepository.GetUtilisateurById(justif.IdUtilisateur);
                var toEmail = isSender?.email;
                if (!string.IsNullOrWhiteSpace(toEmail))
                    Tolist = new List<string> { toEmail };

                //CC
                var isAccuseForutilisateurId = _context.JustificatifAccuse.FirstOrDefault(ra => ra.idJustif == justif.IdJustif).createdby;
                var isAccuseForCC =  _UtilisateurRepository.GetUtilisateurById(isAccuseForutilisateurId);
                CClist = isAccuseForCC?.UtilisateurCCs?.Select(cc => cc.mailCC).Where(email => !string.IsNullOrWhiteSpace(email)).ToList() ?? new List<string?>();

                //CC aussi : validateurs précédents
                var validateursPrecedents = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == idjustif && h.isValidator == true && h.numero < histovalid.numero).Select(h => h.idValidateur).Distinct().ToListAsync();
                foreach (var idValidateur in validateursPrecedents)
                {
                    var utilisateur =  _UtilisateurRepository.GetUtilisateurById(idValidateur.Value);
                    var toEmailV = utilisateur?.email;

                    if (!string.IsNullOrWhiteSpace(toEmailV))
                    {
                        CClist.Add(toEmailV);
                    }
                }

                var montantFormat = justif.Montant.Value.ToString("N2", new CultureInfo("fr-FR"));

                //Message
                var message = justif.message;

                var mailBody = @$"
                    <div>
                        Madame, Monsieur, 
                        <br /><br />
                        Nous vous confirmons par le présent mail que votre justificatif mentionné ci-dessous a été refusé à « l'étape n°{numeroEtape} : {descriptionEtape} » par « {validateur} ».
                        <br />
                        Pour toute information complémentaire relative à ce refus, nous vous invitons à prendre contact directement avec le validateur mentionné ci-dessus.
                        <br /><br />

                        <b><u>Numéro du justificatif : </u></b> {justif.Numero} <br />
                        <b><u>Montant : </u></b> {montantFormat} <br />
                        <b><u>Message : </u></b> {message} <br /><br />
                        <b><u>Commentaire : </u></b> {refus.commentaire} <br /><br />
                        
                        <b>Cliquer </b><a href='{""/*lien*/}'>ICI</a><b> pour visualiser le formulaire</b> <br /><br />

                        Cordialement,
                    </div>
                ";

                try
                {
                    await _mailService.SendEmail("Gestion Justificatif - Justificatif refusé", mailBody, Tolist, CClist);
                }
                catch (Exception ex)
                {

                }
            }
            catch (Exception ex) { }

            return RefusJustifResult.Success;
        }

        public enum RedirectionJustifResult
        {
            NotFoundHisto,
            NotFoundRequete,
            NotFoundStepActuelle,
            NotFoundStepNext,
            InvalidRedirection,
            Success
        }

        public async Task<RedirectionJustifResult> RedirectionJustif(int idjustif, int currentUserId, RedirectionJustifDTO redirection)
        {
            //JUSTIF//
            var justif = await _context.Justificatif.FirstOrDefaultAsync(r => r.IdJustif == idjustif);
            if (justif == null)
                return RedirectionJustifResult.NotFoundRequete;

            //Etape actuel
            var etapeActuelle = await _context.CircuitEtape.FirstOrDefaultAsync(ce => ce.idCircuitEtape == redirection.idCircuitEtapeActuelle && ce.deletiondate == null);
            if (etapeActuelle == null)
                return RedirectionJustifResult.NotFoundStepActuelle;

            //Etape de redirection
            var etapeRedirection = await _context.CircuitEtape.FirstOrDefaultAsync(ce => ce.idCircuitEtape == redirection.idCircuitEtapeRedirection && ce.deletiondate == null);
            if (etapeRedirection == null)
                return RedirectionJustifResult.NotFoundStepNext;

            //verification qu'on fait un retour (redirection)
            if (etapeRedirection.numero >= etapeActuelle.numero)
                return RedirectionJustifResult.InvalidRedirection;

            //Liste des étape entre etapeActuelle et etapeRedirection
            var etapesAReinitialiser = await _context.CircuitEtape.Where(e => e.idCircuit == etapeActuelle.idCircuit && e.numero > etapeRedirection.numero && e.numero <= etapeActuelle.numero && e.deletiondate == null).ToListAsync();

            foreach (var etape in etapesAReinitialiser)
            {
                //Réinitialisation validation déjà faite
                var historiques = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == idjustif && h.idCircuitEtape == etape.idCircuitEtape)
                    .ToListAsync();

                foreach (var h in historiques)
                {
                   
                    h.dateValidation = null;
                    h.commentaire = null;
                    h.isValidator = null;
                    h.isPotential = false;
                    
                }

                //Réinitialisation checklist
                var historiquesCheckList = await _context.HistoriqueValidationJustificatifCheckList.Where(h => h.idJustif == idjustif && h.idCircuitEtape == etape.idCircuitEtape)
                    .ToListAsync();

                foreach (var h in historiquesCheckList)
                {
                    h.oui = null;
                    h.non = null;
                    h.nonapplicable = null;
                }
            }

            //etape de redirection
            var histosRedirection = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == idjustif && h.idCircuitEtape == etapeRedirection.idCircuitEtape).ToListAsync();

            foreach (var h in histosRedirection)
            {
                h.commentaire = null;
                h.dateValidation = null;
                h.isValidator = null;
            }

            //Ajout historique de redirection
            var newHistoRedirection = new HistoriqueValidationJustificatifRedirection
            {
                idfrom = etapeActuelle.idCircuitEtape,
                idto = etapeRedirection.idCircuitEtape,
                idJustif = idjustif,
                commentaire = redirection.commentaire,
                creationdate = DateTime.Now,
                isValidator = currentUserId
            };

            _context.HistoriqueValidationJustificatifRedirection.Add(newHistoRedirection);

            await _context.SaveChangesAsync();

            //Refinterne
            var accuse = await _context.JustificatifAccuse.FirstOrDefaultAsync(a => a.idJustif == idjustif);
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
                var validateurRedirection = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == idjustif && h.idCircuitEtape == etapeRedirection.idCircuitEtape && h.isPotential == true).Select(h => h.idValidateur).Distinct().ToListAsync();
                foreach (var idValidateur in validateurRedirection)
                {
                    var utilisateur =  _UtilisateurRepository.GetUtilisateurById(idValidateur.Value);
                    var toEmailV = utilisateur?.email;

                    if (!string.IsNullOrWhiteSpace(toEmailV))
                    {
                        Tolist.Add(toEmailV);
                    }
                }

                //CC

                var montantFormat = justif.Montant.Value.ToString("N2", new CultureInfo("fr-FR"));

                //Message
                var message = justif.message;

                var mailBody = @$"
                    <div>
                        Madame, Monsieur, 
                        <br /><br />
                        Nous vous confirmons par le présent mail qu'un justificatif a été redirigé de « l'étape n°{numeroEtape} : {descriptionEtape} » par « {validateur} » vers « l'étape n°{numeroEtapeRED} : {descriptionEtapeRED} ». 
                        Il est désormais en attente de votre validation.
                        <br />
                        Selon vos procédures, vous disposez d’un délai de {dureeValidation} heures pour effectuer la validation.
                        <br /><br />

                        <b><u>Numéro du justificatif : </u></b> {justif.Numero} <br />
                        <b><u>Montant : </u></b> {montantFormat} <br />

                        <b><u>Message : </u></b> {message} <br /><br />
                        <b><u>Commentaire : </u></b> {redirection.commentaire} <br /><br />
                        
                        <b>Cliquer </b><a href='{""/*lien*/}'>ICI</a><b> pour visualiser le formulaire</b> <br /><br />
                    
                        Cordialement,
                    </div>
                ";

                try
                {
                    await _mailService.SendEmail("Gestion Justificatif - Justificatif redirigé", mailBody, Tolist, CClist);
                }
                catch (Exception ex)
                {

                }
            }
            catch (Exception ex) { }

            return RedirectionJustifResult.Success;
        }

        public async Task<List<HistoValidationDTO>> GetValidationHistoryDetails(int idjustif)
        {
            var allEtapes = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == idjustif /*&& (h.etatValidation == 4 || h.etatValidation == 5)*/).OrderBy(h => h.numero).ToListAsync();

            // Faire le distinct en mémoire
            var etapesDistinctes = allEtapes.GroupBy(h => new { h.idCircuitEtape, h.numero }).Select(g => g.First()).OrderBy(h => h.numero).ToList();

            var result = new List<HistoValidationDTO>();

            foreach (var etape in etapesDistinctes)
            {
                // Étape
                string stepName = $"Étape {etape.numero}";

                // Utilisateurs validateurs
                var validateurs = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == idjustif && h.idCircuitEtape == etape.idCircuitEtape)
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
                var validation = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == idjustif && h.idCircuitEtape == etape.idCircuitEtape && h.isValidator == true && h.dateValidation != null)
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
                var historiques = await _context.HistoriqueValidationJustificatifCheckList.Where(c => c.idJustif == idjustif && c.idCircuitEtape == etape.idCircuitEtape).ToListAsync();

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

        public async Task<List<HistoCanceledDTO>> GetCanceledHistoryDetails(int idjustif)
        {
            var res = new List<HistoCanceledDTO>();

            var justif = await _context.Justificatif.FirstOrDefaultAsync(r => r.IdJustif == idjustif);

            if (justif != null && justif.EtatValidation == 2)
            {
                var refus = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == idjustif && h.isValidator == true && h.dateValidation != null && h.etatValidation == 2).OrderBy(h => h.dateValidation)
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

        public async Task<List<HistoRedirectedDTO>> GetRedirectionHistoryDetails(int idjustif)
        {
            var res = await _context.HistoriqueValidationJustificatifRedirection.Where(r => r.idJustif == idjustif).OrderBy(r => r.creationdate)
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

                var isValidator = await _context.HistoriqueValidationJustificatif.FirstOrDefaultAsync(h => h.idCircuitEtape == etapeFrom.idCircuitEtape && h.idJustif == idjustif && h.numero == etapeFrom.numero && h.idValidateur == r.isValidator);
                var utilisateur =  _UtilisateurRepository.GetUtilisateurById(isValidator.idValidateur.Value);
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

        public async Task<CircuitEtape> checkNextEtape(int idjustif, int currentUserId, ValidationJustifDTO validationnext)
        {
            var histovalid = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == idjustif && h.idCircuitEtape == validationnext.idCircuitEtape && h.idValidateur == currentUserId && h.dateValidation == null).OrderBy(h => h.numero).FirstOrDefaultAsync();


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
    }
}