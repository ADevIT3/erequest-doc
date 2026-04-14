using Azure.Core;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Linq;
using UCP_API.data;
using UCP_API.dto;
using UCP_API.models;
using UCP_API.utils;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace UCP_API.repositories
{
    public class BordRepository
    {
        private readonly AppDbContext _context;
        private readonly UtilisateurRepository _UtilisateurRepository;
        private readonly ProjetRepository _ProjetRepository;
        private readonly SiteRepository _SiteRepository;

        public BordRepository(AppDbContext context, UtilisateurRepository utilisateurRepository, ProjetRepository projetRepository, SiteRepository siteRepository)
        {
            _context = context;
            _UtilisateurRepository = utilisateurRepository;
            _ProjetRepository = projetRepository;
            _SiteRepository = siteRepository;
        }

        private static string GetStatutLibelleRequete(int? statut, bool? cloture)
        {
            return (statut, cloture) switch
            {
                (0, false) or (0, null) or (null, null) => "Initiée",
                (1, null) => "Envoyée",
                (1, null) or (4, null) => "En cours",
                (2, _) => "Refusée",
                (5, false) or (5, null) => "Validée",
                (5, true) => "Clôturée",
                _ => ""
            };
        }

        // Tdb1 : REQUETE : Situation global des requêtes
        // filtres.statut => NULL si tous, Initie = 0, Envoye = 1, EnCours = 2, Refuse = 3, Valide = 4, Cloture = 5
        // filtres.statut => NULL si tous, 0:initié (statut=0 et non dans requeteJustificatif), 1:envoyé (statut=0 et dans requeteJustificatif), 2:encours (status=1 et 4), 3:refusé (status=2), 4:validé(status=5), 5:cloturé (colonne cloture=true)
        public async Task<List<Tdb1RequeteDTO>> Tdb1Requete(FiltresDTO filtres)
        {
            var query = _context.Requete.Include(r => r.Utilisateur).ThenInclude(u => u.Agmo).AsQueryable();

            // projet
            if (filtres.idprojets?.Any() == true)
                query = query.Where(r => filtres.idprojets.Contains(r.IdProjet));

            // site
            if (filtres.idsites?.Any() == true)
                query = query.Where(r => filtres.idsites.Contains(r.IdSite));

            // AGMO
            if (filtres.idagmos?.Any() == true)
                query = query.Where(r => r.Utilisateur != null && filtres.idagmos.Contains(r.Utilisateur.idAgmo));

            // date du et au
            if (filtres.datedu.HasValue && filtres.dateau.HasValue)
                query = query.Where(r => r.creationdate >= filtres.datedu.Value && r.creationdate <= filtres.dateau.Value);

            // statut
            if (filtres.statut.HasValue)
            {
                var statutFiltre = (RequeteStatutFiltre)filtres.statut.Value;
                query = query.Where(statutFiltre.GetFiltre());
            }

            if (!query.Any())
                return new List<Tdb1RequeteDTO>();

            var requetes = await query.OrderBy(r => r.creationdate).ToListAsync();

            var idProjets = requetes.Select(r => r.IdProjet).Distinct().ToList();
            var IdSites = requetes.Select(r => r.IdSite).Distinct().ToList();

            var projets = await _context.Projet.Where(p => idProjets.Contains(p.idProjet) && p.deletionDate == null).ToDictionaryAsync(p => p.idProjet);
            var sites = await _context.Site.Where(s => IdSites.Contains(s.idSite) && s.deletiondate == null).ToDictionaryAsync(s => s.idSite);

            int JourDelais = 0;
            var idTypeRequete = requetes.First().IdTypeRequete;
            var typeRequete = await _context.TypeRequete.FirstOrDefaultAsync(tr => tr.IdTypeRequete == idTypeRequete);
            if (typeRequete != null)
                JourDelais = typeRequete.DelaiJustification ?? 0;

            // Mappage
            var result = requetes.Select(r => new Tdb1RequeteDTO
            {
                ProjetName = projets.TryGetValue(r.IdProjet, out var projet) ? projet.nom : "",
                SiteName = sites.TryGetValue(r.IdSite, out var site) ? $"{site.code} - {site.nom}" : "",
                Numero = r.NumRequete ?? "",
                Objet = "Requête de financement de l'activité " + (r.CodeActiviteTom ?? "") + " " + (r.IntituleActiviteTom ?? ""),
                DateSoumission = DateOnly.FromDateTime((DateTime)r.creationdate).ToString("dd/MM/yyyy"),
                //Demandeur = r.Utilisateur != null
                //    ? $"{(string.IsNullOrWhiteSpace(r.Utilisateur.fonction) ? "Sans fonction" : r.Utilisateur.fonction)}"
                //      + $"{(string.IsNullOrWhiteSpace(r.Utilisateur.email) ? "" : " : " + r.Utilisateur.email)}"
                //      + $"{(string.IsNullOrWhiteSpace(r.Utilisateur.firstname) ? "" : " : " + r.Utilisateur.firstname)}"
                //      + $"{(string.IsNullOrWhiteSpace(r.Utilisateur.lastname) ? "" : " " + r.Utilisateur.lastname)}"
                //    : "",
                Demandeur = r.Utilisateur?.Agmo?.nom ?? "",
                Montant = r.Montant.HasValue ? r.Montant.Value.ToString("N2") : "0",
                Statut = GetStatutLibelleRequete((int)r.EtatValidation, r.cloture),
                DateFinExecution = r.DateFinExecution?.ToString("dd/MM/yyyy") ?? "",
                DateFinEcheance = r.DateFinExecution?.AddDays(JourDelais).ToString("dd/MM/yyyy") ?? ""
            }).ToList();

            return result;
        }

        private static string GetStatutLibelleJustificatif(int statut, bool? cloture)
        {
            return (statut, cloture) switch
            {
                (0, _) => "Envoyé",
                (1, _) or (4, _) => "En cours",
                (2, _) => "Refusé",
                (5, false) or (5, null) => "Validé",
                (5, true) => "Clôturé",
                _ => ""
            };
        }

        private static int GetStatutCode(int statut, bool? cloture)
        {
            return (statut, cloture) switch
            {
                (0, _) => 0, // Envoye
                (1, _) or (4, _) => 1, // En cours
                (2, _) => 2, // Refuse
                (5, false) or (5, null) => 3, // Valide
                (5, true) => 4, // cloture
                _ => -1
            };
        }

        // Tdb2 : JUSTIF : Situation global des justificatifs
        // filtres.statut => NULL si tous, Envoye = 0 , EnCours = 1, Refuse = 2, Valide = 3, Cloture = 4
        // filtres.statut => NULL si tous, 0:envoyé (statut=0), 1:encours (status=1 et 4), 2:refusé (status=2), 3:validé(status=5), 4:cloturé (colonne cloture=true dans requête)
        public async Task<List<Tdb2JustifDTO>> Tdb2Justificatif(FiltresDTO filtres)
        {
            var query = _context.Justificatif.Include(r => r.Utilisateur).ThenInclude(u => u.Agmo).Include(j => j.Requete).AsQueryable();

            // projet
            if (filtres.idprojets?.Any() == true)
                query = query.Where(j => j.Requete != null && filtres.idprojets.Contains(j.Requete.IdProjet));

            // site
            if (filtres.idsites?.Any() == true)
                query = query.Where(j => j.Requete != null && filtres.idsites.Contains(j.Requete.IdSite));

            // AGMO
            if (filtres.idagmos?.Any() == true)
                query = query.Where(j => j.Utilisateur != null && filtres.idagmos.Contains(j.Utilisateur.idAgmo));

            // date du et au
            if (filtres.datedu.HasValue && filtres.dateau.HasValue)
                query = query.Where(r => r.CreationDate >= filtres.datedu.Value && r.CreationDate <= filtres.dateau.Value);

            if (!query.Any())
                return new List<Tdb2JustifDTO>();

            // filtre 1
            var firstFiltre = await query.OrderBy(j => j.CreationDate)
            .Select(j => new
            {
                j.Numero,
                j.Objet,
                j.CreationDate,
                j.Montant,
                j.EtatValidation,
                j.Utilisateur,
                idProjet = j.Requete.IdProjet,
                IdSite = j.Requete.IdSite,
                Cloture = j.Requete != null ? j.Requete.cloture : null,
                NumRequete = j.Requete.NumRequete,
                DateFinExecution = j.Requete != null ? j.Requete.DateFinExecution : null
            })
            .ToListAsync();

            // statut
            if (filtres.statut.HasValue)
            {
                var statutFiltre = filtres.statut.Value;
                firstFiltre = firstFiltre.Where(j => GetStatutCode(j.EtatValidation, j.Cloture) == statutFiltre).ToList();
            }

            var idProjets = firstFiltre.Select(j => j.idProjet).Distinct().ToList();
            var IdSites = firstFiltre.Select(j => j.IdSite).Distinct().ToList();

            var projets = await _context.Projet
                .Where(p => idProjets.Contains(p.idProjet) && p.deletionDate == null)
                .ToDictionaryAsync(p => p.idProjet);

            var sites = await _context.Site
                .Where(s => IdSites.Contains(s.idSite) && s.deletiondate == null)
                .ToDictionaryAsync(s => s.idSite);

            int JourDelais = 0;
            var idTypeRequete = query.First().Requete.IdTypeRequete;
            var typeRequete = await _context.TypeRequete.FirstOrDefaultAsync(tr => tr.IdTypeRequete == idTypeRequete);
            if (typeRequete != null)
                JourDelais = typeRequete.DelaiJustification ?? 0;

            var result = firstFiltre.Select(j => new Tdb2JustifDTO
            {
                ProjetName = projets.TryGetValue(j.idProjet, out var projet) ? projet.nom : "",
                SiteName = sites.TryGetValue(j.IdSite, out var site) ? $"{site.code} - {site.nom}" : "",
                NumeroJustif = j.Numero ?? "",
                NumeroRequete = j.NumRequete ?? "",
                Objet = j.Objet ?? "",
                DateSaisie = j.CreationDate.ToString("dd/MM/yyyy"),
                //Demandeur = j.Utilisateur != null
                //    ? $"{(string.IsNullOrWhiteSpace(j.Utilisateur.fonction) ? "Sans fonction" : j.Utilisateur.fonction)}"
                //        + $"{(string.IsNullOrWhiteSpace(j.Utilisateur.email) ? "" : " : " + j.Utilisateur.email)}"
                //        + $"{(string.IsNullOrWhiteSpace(j.Utilisateur.firstname) ? "" : " : " + j.Utilisateur.firstname)}"
                //        + $"{(string.IsNullOrWhiteSpace(j.Utilisateur.lastname) ? "" : " " + j.Utilisateur.lastname)}"
                //    : "",
                Demandeur = j.Utilisateur?.Agmo?.nom ?? "",
                Montant = j.Montant.HasValue ? j.Montant.Value.ToString("N2") : "0",
                Statut = GetStatutLibelleJustificatif(j.EtatValidation, j.Cloture),
                DateFinExecution = j.DateFinExecution?.ToString("dd/MM/yyyy") ?? "",
                DateFinEcheance = j.DateFinExecution?.AddDays(JourDelais).ToString("dd/MM/yyyy") ?? ""
            }).ToList();

            return result;
        }

        private string GetRetardString(DateTime? dateFinExecution, DateTime? DateNow)
        {
            if (!dateFinExecution.HasValue)
                return "";

            var difference = (DateNow.Value - dateFinExecution.Value).Days;

            return difference > 0 ? difference.ToString() : "";
        }

        // Tdb3 : REQUETE : Suivi des requêtes : Suivre l?état d?avancement et les retards potentiels dans le traitement des requêtes
        public async Task<List<Tdb3RequeteDTO>> Tdb3Requete(FiltresDTO filtres)
        {
            var query = _context.Requete.Include(r => r.RequeteAccuses).Include(r => r.Justificatifs).Include(r => r.Utilisateur).ThenInclude(u => u.Agmo).AsQueryable();

            // etat == 5
            query = query.Where(r => r.EtatValidation == 5);

            // projet
            if (filtres.idprojets?.Any() == true)
                query = query.Where(r => filtres.idprojets.Contains(r.IdProjet));

            // site
            if (filtres.idsites?.Any() == true)
                query = query.Where(r => filtres.idsites.Contains(r.IdSite));

            // AGMO
            if (filtres.idagmos?.Any() == true)
                query = query.Where(r => r.Utilisateur != null && filtres.idagmos.Contains(r.Utilisateur.idAgmo));

            // date du et au
            if (filtres.datedu.HasValue && filtres.dateau.HasValue)
                query = query.Where(r => r.creationdate >= filtres.datedu.Value && r.creationdate <= filtres.dateau.Value);

            if (!query.Any())
                return new List<Tdb3RequeteDTO>();

            int JourDelais = 0;
            var idTypeRequete = query.First().IdTypeRequete;
            var typeRequete = await _context.TypeRequete.FirstOrDefaultAsync(tr => tr.IdTypeRequete == idTypeRequete);
            if (typeRequete != null)
                JourDelais = typeRequete.DelaiJustification ?? 0;

            var firstFiltre = await query.OrderByDescending(r => r.creationdate)
            .Select(r => new
            {
                r.IdProjet,
                r.IdSite,
                Utilisateur = r.Utilisateur,
                r.NumRequete,
                RefInterne = r.RequeteAccuses.Select(ra => ra.referenceInterne).FirstOrDefault(),
                r.creationdate,
                r.DateFinExecution,
                r.CodeActiviteTom,
                r.IntituleActiviteTom,
                r.Montant,
                Justificatifs = r.Justificatifs.ToList(),
                Justifie = r.Justificatifs.Sum(j => j.Montant ?? 0)
            })
            .ToListAsync();

            var result = firstFiltre.Select(r => new Tdb3RequeteDTO
            {
                ProjetName = _context.Projet.Where(p => p.idProjet == r.IdProjet).Select(p => p.nom).FirstOrDefault() ?? "",
                SiteName = _context.Site.Where(s => s.idSite == r.IdSite).Select(s => s.nom).FirstOrDefault() ?? "",
                //Agmo = r.Utilisateur != null
                //? $"{(string.IsNullOrWhiteSpace(r.Utilisateur.fonction) ? "Sans fonction" : r.Utilisateur.fonction)}"
                //    + $"{(string.IsNullOrWhiteSpace(r.Utilisateur.email) ? "" : " : " + r.Utilisateur.email)}"
                //    + $"{(string.IsNullOrWhiteSpace(r.Utilisateur.firstname) ? "" : " : " + r.Utilisateur.firstname)}"
                //    + $"{(string.IsNullOrWhiteSpace(r.Utilisateur.lastname) ? "" : " " + r.Utilisateur.lastname)}"
                //: "",
                Agmo = r.Utilisateur?.Agmo?.nom ?? "",
                Numero = r.NumRequete ?? "",
                RefInterne = r.RefInterne ?? "",
                DateSoumission = DateOnly.FromDateTime((DateTime)r.creationdate).ToString("dd/MM/yyyy"),
                DateFinExecution = r.DateFinExecution?.ToString("dd/MM/yyyy") ?? "",
                DateFinEcheance = r.DateFinExecution?.AddDays(JourDelais).ToString("dd/MM/yyyy") ?? "",
                Retard = (((r.Montant ?? 0) - r.Justificatifs.Sum(j => j.Montant ?? 0)) > 0) ? GetRetardString(r.DateFinExecution?.AddDays(JourDelais).ToDateTime(TimeOnly.MinValue), DateTime.Now) : GetRetardString(r.DateFinExecution?.AddDays(JourDelais).ToDateTime(TimeOnly.MinValue), r.Justificatifs.OrderByDescending(a => a.CreationDate).FirstOrDefault().CreationDate),
                Objet = "Requête de financement de l'activité " + (r.CodeActiviteTom ?? "") + " : " + (r.IntituleActiviteTom ?? ""),
                Montant = (r.Montant ?? 0).ToString("N2"),
                Justifie = r.Justificatifs.Sum(j => j.Montant ?? 0).ToString("N2"),
                Reste = ((r.Montant ?? 0) - r.Justificatifs.Sum(j => j.Montant ?? 0)).ToString("N2")
            }).ToList();

            return result;
        }

        // Tdb5 : REQUETE : Liste des requêtes non justifiées : izay requête mbola misy reste à justifier rehetra dia mipoitra ato
        public async Task<List<Tdb5RequeteDTO>> Tdb5Requete(FiltresDTO filtres)
        {
            var query = _context.Requete
                .Include(r => r.RequeteAccuses)
                .Include(r => r.Justificatifs)
                .Include(r => r.Utilisateur).ThenInclude(u => u.Agmo)
                .AsQueryable();

            // Filtrage selon les paramètres
            if (filtres.idprojets?.Any() == true)
                query = query.Where(r => filtres.idprojets.Contains(r.IdProjet));

            if (filtres.idsites?.Any() == true)
                query = query.Where(r => filtres.idsites.Contains(r.IdSite));

            if (filtres.idagmos?.Any() == true)
                query = query.Where(r => r.Utilisateur != null && filtres.idagmos.Contains(r.Utilisateur.idAgmo));

            if (filtres.datedu.HasValue && filtres.dateau.HasValue)
                query = query.Where(r => r.creationdate >= filtres.datedu.Value &&
                                         r.creationdate <= filtres.dateau.Value);

            if (!query.Any())
                return new List<Tdb5RequeteDTO>();

            // Récupérer délai justification
            int jourDelai = 0;
            var idTypeRequete = query.First().IdTypeRequete;
            var typeReq = await _context.TypeRequete.FirstOrDefaultAsync(t => t.IdTypeRequete == idTypeRequete);
            if (typeReq != null)
                jourDelai = typeReq.DelaiJustification ?? 0;

            var data = await query
                .OrderByDescending(r => r.creationdate)
                .Select(r => new
                {
                    r.IdProjet,
                    r.IdSite,
                    Utilisateur = r.Utilisateur,
                    r.NumRequete,
                    RefInterne = r.RequeteAccuses.Select(ra => ra.referenceInterne).FirstOrDefault(),
                    r.DateFinExecution,
                    r.CodeActiviteTom,
                    r.IntituleActiviteTom,
                    Montant = r.Montant ?? 0,
                    TotalJustifie = r.Justificatifs.Sum(j => j.Montant ?? 0),
                    Etat = r.EtatValidation
                })
                .ToListAsync();

            var result = new List<Tdb5RequeteDTO>();

            foreach (var r in data)
            {
                var reste = r.Montant - r.TotalJustifie;

                if (reste <= 0)
                    continue;

                DateTime? dateFinExec = r.DateFinExecution?.ToDateTime(TimeOnly.MinValue);
                DateTime? dateEcheance = dateFinExec?.AddDays(jourDelai);

                int joursRestants = 0;
                int joursRetard = 0;
                bool enRetard = false;
                bool aRisque = false;

                string statutAffichage = "";
                string aRisqueStr = "";
                string enRetardStr = "";

                if (dateEcheance.HasValue)
                {
                    joursRestants = (dateEcheance.Value.Date - DateTime.Now.Date).Days;
                    joursRetard = (DateTime.Now.Date - dateEcheance.Value.Date).Days;

                    enRetard = joursRetard > 0;
                    aRisque = !enRetard && joursRestants <= 10 && joursRestants > 0;

                    if (enRetard)
                    {
                        statutAffichage = "En retard";
                        enRetardStr = joursRetard.ToString();
                    }
                    else if (aRisque)
                    {
                        statutAffichage = "À risque";
                        aRisqueStr = joursRestants.ToString();
                    }
                }

                // ? NE GARDER QUE À RISQUE OU EN RETARD
                if (!enRetard && !aRisque)
                    continue;

                result.Add(new Tdb5RequeteDTO
                {
                    ProjetName = _context.Projet.Where(p => p.idProjet == r.IdProjet).Select(p => p.nom).FirstOrDefault() ?? "",
                    SiteName = _context.Site.Where(s => s.idSite == r.IdSite).Select(s => s.nom).FirstOrDefault() ?? "",
                    Numero = r.NumRequete ?? "",
                    RefInterne = r.RefInterne ?? "",
                    Objet = "Requête de financement de l'activité " + (r.CodeActiviteTom ?? "") + " : " + (r.IntituleActiviteTom ?? ""),
                    DateFinExecution = dateFinExec?.ToString("dd/MM/yyyy") ?? "",
                    DateFinEcheance = dateEcheance?.ToString("dd/MM/yyyy") ?? "",
                    Statut = statutAffichage,
                    ARisque = aRisqueStr,
                    EnRetard = enRetardStr
                });
            }


            return result;
        }



        private string ConvertToHeureMinute(double totalHours)
        {
            var ts = TimeSpan.FromHours(totalHours);
            return $"{(int)ts.TotalHours:D2}:{ts.Minutes:D2}";
        }

        // Filtre : REQUETE : Liste numéro requête
        public async Task<List<string?>> ListeNumeroRequete(FiltresDTO filtres)
        {
            var query = _context.Requete.AsQueryable();

            // projet
            if (filtres.idprojets?.Any() == true)
                query = query.Where(r => filtres.idprojets.Contains(r.IdProjet));

            // site
            if (filtres.idsites?.Any() == true)
                query = query.Where(r => filtres.idsites.Contains(r.IdSite));

            // AGMO
            if (filtres.idagmos?.Any() == true)
                query = query.Where(r => r.Utilisateur != null && filtres.idagmos.Contains(r.Utilisateur.idAgmo));

            var result = await query.OrderBy(r => r.creationdate).Select(r => r.NumRequete).ToListAsync();

            return result;
        }

        // Filtre : REQUETE : Liste référence interne requête
        public async Task<List<string?>> ListeRefInterneRequete(FiltresDTO filtres)
        {
            var query = from ra in _context.RequeteAccuse
                        join r in _context.Requete on ra.idRequete equals r.IdRequete
                        select new { ra, r };

            // projet
            if (filtres.idprojets?.Any() == true)
                query = query.Where(x => filtres.idprojets.Contains(x.r.IdProjet));

            // site
            if (filtres.idsites?.Any() == true)
                query = query.Where(x => filtres.idsites.Contains(x.r.IdSite));

            // AGMO
            if (filtres.idagmos?.Any() == true)
                query = query.Where(x => x.r.Utilisateur != null && filtres.idagmos.Contains(x.r.Utilisateur.idAgmo));

            var result = await query.OrderBy(x => x.ra.creationdate).Select(x => x.ra.referenceInterne).ToListAsync();

            return result;
        }

        // Tdb6 : REQUETE : Suivi de délai de traitement des requêtes 
        public async Task<List<Tdb6RequeteDTO>> Tdb6Requete(FiltresDTO filtres)
        {
            IQueryable<Requete> requeteAll = _context.Requete;

            // projet
            if (filtres.idprojets?.Any() == true)
                requeteAll = requeteAll.Where(x => filtres.idprojets.Contains(x.IdProjet));

            // site
            if (filtres.idsites?.Any() == true)
                requeteAll = requeteAll.Where(x => filtres.idsites.Contains(x.IdSite));

            // AGMO
            if (filtres.idagmos?.Any() == true)
                requeteAll = requeteAll.Where(r => r.Utilisateur != null && filtres.idagmos.Contains(r.Utilisateur.idAgmo));

            Requete? requete = null;
            // numero requete
            if (!string.IsNullOrEmpty(filtres.numero))
            {
                requete = await requeteAll.FirstOrDefaultAsync(r => r.NumRequete == filtres.numero);
            }
            // ref interne requete
            else if (!string.IsNullOrEmpty(filtres.refinterne))
            {
                requete = await requeteAll.FirstOrDefaultAsync(r => r.RequeteAccuses.Any(ra => ra.referenceInterne == filtres.refinterne));
            }

            if (requete == null)
                return new List<Tdb6RequeteDTO>();

            var requeteId = requete.IdRequete;

            var allHistos = await _context.HistoriqueValidationRequete.Where(h => h.idRequete == requeteId).ToListAsync();

            var firstFiltre = await (
                from h in _context.HistoriqueValidationRequete
                join ce in _context.CircuitEtape on h.idCircuitEtape equals ce.idCircuitEtape
                where h.idRequete == requeteId && ce.deletiondate == null
                orderby ce.numero
                select new
                {
                    ce.numero,
                    ce.description,
                    ce.duree,
                    h.idRequete,
                    h.isPassMarcheSkyp,
                    h.creationdate,
                    h.dateValidation,
                    h.idCircuitEtape
                    //Validateur = user != null ? $"{user.fonction ?? "Sans fonction"}" + $"{(string.IsNullOrWhiteSpace(user.email) ? "" : " : " + user.email)}" + $"{(string.IsNullOrWhiteSpace(user.firstname) ? "" : " : " + user.firstname)}" + $"{(string.IsNullOrWhiteSpace(user.lastname) ? "" : " " + user.lastname)}" : ""
                }
            ).ToListAsync();

            firstFiltre = firstFiltre.DistinctBy(x => x.numero).OrderBy(x => x.numero).ToList();

            var result = new List<Tdb6RequeteDTO>();

            if (firstFiltre == null)
                return result;

            double totalPrevu = 0;
            double totalReel = 0;
            double totalRetard = 0;
            double totalAvance = 0;

            var minNumero = firstFiltre.Min(x => x.numero);

            DateTime? prevDateValidation = null;

            var projet = _ProjetRepository.GetProjetById(requete.IdProjet);
            var site = _SiteRepository.GetSiteById(requete.IdSite);

            foreach (var item in firstFiltre)
            {
                string DateValidationReel = "";

                double dureePrevue = item.duree;

                DateTime dateValidation = DateTime.Now;
                double dureeReelle = 0;

                double retard = 0;
                double avance = 0;

                var validateur = "";

                totalPrevu += dureePrevue;

                if (item.numero == minNumero)
                {
                    DateTime DateCreationCircuit = item.creationdate;

                    if (item.dateValidation.HasValue)
                    {
                        dateValidation = item.dateValidation.Value;

                        var histo = allHistos.FirstOrDefault(h => h.idCircuitEtape == item.idCircuitEtape && h.numero == item.numero);

                        if (histo?.idValidateur != null)
                        {
                            var utilisateur = _UtilisateurRepository.GetUtilisateurById(histo.idValidateur.Value);
                            if (utilisateur != null)
                            {
                                validateur =
                                    $"{utilisateur.fonction ?? "Sans fonction"}" +
                                    $"{(string.IsNullOrWhiteSpace(utilisateur.email) ? "" : " : " + utilisateur.email)}" +
                                    $"{(string.IsNullOrWhiteSpace(utilisateur.firstname) ? "" : " : " + utilisateur.firstname)}" +
                                    $"{(string.IsNullOrWhiteSpace(utilisateur.lastname) ? "" : " " + utilisateur.lastname)}";
                            }
                        }

                        dureeReelle = (dateValidation - DateCreationCircuit).TotalHours;

                        DateValidationReel = item.dateValidation.Value.ToString();
                    }
                    else
                    {
                        dureeReelle = (DateTime.Now - DateCreationCircuit).TotalHours;
                    }

                    if (dureeReelle > dureePrevue)
                        retard = dureeReelle - dureePrevue;
                    else
                        avance = dureePrevue - dureeReelle;

                    totalReel += dureeReelle;
                    totalRetard += retard;
                    totalAvance += avance;

                    prevDateValidation = item.dateValidation ?? DateTime.Now;
                }
                else
                {
                    if (prevDateValidation.HasValue)
                    {
                        if (item.dateValidation.HasValue)
                        {
                            dateValidation = item.dateValidation.Value;

                            var histo = allHistos.FirstOrDefault(h => h.idCircuitEtape == item.idCircuitEtape && h.numero == item.numero);

                            if (histo?.isPassMarcheSkyp == true)
                            {
                                dureeReelle = 0;
                                retard = 0;
                                avance = 0;
                                validateur = "Sans passation de marché";
                            }
                            else
                            {
                                dureeReelle = (dateValidation - prevDateValidation.Value).TotalHours;

                                if (dureeReelle > dureePrevue)
                                    retard = dureeReelle - dureePrevue;
                                else
                                    avance = dureePrevue - dureeReelle;

                                if (histo?.idValidateur != null)
                                {
                                    var utilisateur = _UtilisateurRepository.GetUtilisateurById(histo.idValidateur.Value);
                                    if (utilisateur != null)
                                    {
                                        validateur =
                                            $"{utilisateur.fonction ?? "Sans fonction"}" +
                                            $"{(string.IsNullOrWhiteSpace(utilisateur.email) ? "" : " : " + utilisateur.email)}" +
                                            $"{(string.IsNullOrWhiteSpace(utilisateur.firstname) ? "" : " : " + utilisateur.firstname)}" +
                                            $"{(string.IsNullOrWhiteSpace(utilisateur.lastname) ? "" : " " + utilisateur.lastname)}";
                                    }
                                }
                            }

                            totalReel += dureeReelle;
                            totalRetard += retard;
                            totalAvance += avance;

                            prevDateValidation = dateValidation;

                            DateValidationReel = item.dateValidation.Value.ToString();
                        }
                        else
                        {
                            dateValidation = DateTime.Now;

                            dureeReelle = (dateValidation - prevDateValidation.Value).TotalHours;

                            if (dureeReelle > dureePrevue)
                                retard = dureeReelle - dureePrevue;
                            else
                                avance = dureePrevue - dureeReelle;

                            totalReel += dureeReelle;
                            totalRetard += retard;
                            totalAvance += avance;

                            prevDateValidation = DateTime.Now;
                        }
                    }
                    else
                    {
                        dureeReelle = 0;
                        retard = 0;
                        avance = 0;

                        var histo = allHistos.FirstOrDefault(h => h.idCircuitEtape == item.idCircuitEtape && h.numero == item.numero);
                        if (histo?.isPassMarcheSkyp == true)
                            validateur = "Sans passation de marché";
                    }
                }

                result.Add(new Tdb6RequeteDTO
                {
                    ProjetName = projet?.nom ?? "",
                    SiteName = site != null ? $"{site.code} - {site.nom}" : "",
                    NumeroEtape = item.numero.ToString(),
                    IntituleEtape = item.description,
                    Validateur = validateur,
                    DureePrevue = ConvertToHeureMinute(dureePrevue),
                    DureeReelle = ConvertToHeureMinute(dureeReelle),
                    Retard = ConvertToHeureMinute(retard),
                    Avance = ConvertToHeureMinute(avance),
                    DateValidation = DateValidationReel
                });
            }

            var NumeroEtape = "Total";
            var TotalDureePrevue = totalPrevu;
            var TotalDureeReelle = totalReel;
            var TotalRetardAvance = totalPrevu - totalReel;

            var IntituleTotalRetardAvance = TotalRetardAvance < 0 ? "Retard" : "Avance";

            // Total
            result.Add(new Tdb6RequeteDTO
            {
                NumeroEtape = NumeroEtape,
                TotalDureePrevue = ConvertToHeureMinute(TotalDureePrevue),
                TotalDureeReelle = ConvertToHeureMinute(TotalDureeReelle),
                TotalRetardAvance = ConvertToHeureMinute(Math.Abs(TotalRetardAvance)),
                IntituleTotalRetardAvance = IntituleTotalRetardAvance
            });

            return result;
        }

        // Filtre : JUSTIF : Liste numéro justificatif à partie numéro ou référence interne REQUETE
        public async Task<List<string?>> ListeNumeroJustificatif(FiltresDTO filtres)
        {
            var query = _context.Justificatif.Include(j => j.Requete).ThenInclude(r => r.RequeteAccuses).AsQueryable();

            // projet
            if (filtres.idprojets?.Any() == true)
                query = query.Where(j => j.Requete != null && filtres.idprojets.Contains(j.Requete.IdProjet));

            // site
            if (filtres.idsites?.Any() == true)
                query = query.Where(j => j.Requete != null && filtres.idsites.Contains(j.Requete.IdSite));

            // AGMO
            if (filtres.idagmos?.Any() == true)
                query = query.Where(j => j.Utilisateur != null && filtres.idagmos.Contains(j.Utilisateur.idAgmo));

            // numero requete
            if (!string.IsNullOrEmpty(filtres.numero))
                query = query.Where(j => j.Requete != null && j.Requete.NumRequete == filtres.numero);

            // ref interne requete
            if (!string.IsNullOrEmpty(filtres.refinterne))
                query = query.Where(j =>
                    j.Requete != null &&
                    j.Requete.RequeteAccuses.Any(ra => ra.referenceInterne == filtres.refinterne)
                );

            var result = await query.OrderBy(j => j.CreationDate).Select(j => j.Numero).ToListAsync();

            return result;
        }

        // Filtre : JUSTIF : Liste référence interne justificatif à partie numéro ou référence interne REQUETE
        public async Task<List<string?>> ListeRefInterneJustificatif(FiltresDTO filtres)
        {
            var query = from ja in _context.JustificatifAccuse
                        join j in _context.Justificatif.Include(j => j.Requete).ThenInclude(r => r.RequeteAccuses) on ja.idJustif equals j.IdJustif
                        select new { ja, j };

            // projet
            if (filtres.idprojets?.Any() == true)
                query = query.Where(ju => ju.j.Requete != null && filtres.idprojets.Contains(ju.j.Requete.IdProjet));

            // site
            if (filtres.idsites?.Any() == true)
                query = query.Where(ju => ju.j.Requete != null && filtres.idsites.Contains(ju.j.Requete.IdSite));

            // AGMO
            if (filtres.idagmos?.Any() == true)
                query = query.Where(ju => ju.j.Utilisateur != null && filtres.idagmos.Contains(ju.j.Utilisateur.idAgmo));

            // numero requete
            if (!string.IsNullOrEmpty(filtres.numero))
                query = query.Where(ju => ju.j.Requete != null && ju.j.Requete.NumRequete == filtres.numero);

            // ref interne requete
            if (!string.IsNullOrEmpty(filtres.refinterne))
                query = query.Where(ju => ju.j.Requete != null && ju.j.Requete.RequeteAccuses.Any(ra => ra.referenceInterne == filtres.refinterne));

            var result = await query.OrderBy(ju => ju.ja.creationdate).Select(ju => ju.ja.referenceInterne).ToListAsync();

            return result;
        }

        // Tdb7 : JUSTIF : Suivi de délai de traitement des justificatifs 
        public async Task<List<Tdb7JustifDTO>> Tdb7Justificatif(FiltresDTO filtres)
        {
            IQueryable<Justificatif> justifQuery = _context.Justificatif.Include(j => j.Requete);

            // projet
            if (filtres.idprojets?.Any() == true)
                justifQuery = justifQuery.Where(j => j.Requete != null && filtres.idprojets.Contains(j.Requete.IdProjet));

            // site
            if (filtres.idsites?.Any() == true)
                justifQuery = justifQuery.Where(j => j.Requete != null && filtres.idsites.Contains(j.Requete.IdSite));

            // AGMO
            if (filtres.idagmos?.Any() == true)
                justifQuery = justifQuery.Where(j => j.Requete.Utilisateur != null && filtres.idagmos.Contains(j.Requete.Utilisateur.idAgmo));

            Justificatif? justif = null;
            // numero justif
            if (!string.IsNullOrEmpty(filtres.numero))
            {
                justif = await justifQuery.FirstOrDefaultAsync(r => r.Numero == filtres.numero);
            }
            // ref interne justif
            else if (!string.IsNullOrEmpty(filtres.refinterne))
            {
                justif = await justifQuery.FirstOrDefaultAsync(r => r.JustificatifAccuses.Any(ra => ra.referenceInterne == filtres.refinterne));
            }

            if (justif == null)
                return new List<Tdb7JustifDTO>();

            var justifId = justif.IdJustif;

            var allHistos = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == justifId).ToListAsync();

            var firstFiltre = await (
                from h in _context.HistoriqueValidationJustificatif
                join ce in _context.CircuitEtape on h.idCircuitEtape equals ce.idCircuitEtape
                where h.idJustif == justifId && ce.deletiondate == null
                orderby ce.numero
                select new
                {
                    ce.numero,
                    ce.description,
                    ce.duree,
                    h.idJustif,
                    h.isPassMarcheSkyp,
                    h.creationdate,
                    h.dateValidation,
                    h.idCircuitEtape
                    //Validateur = user != null ? $"{user.fonction ?? "Sans fonction"}" + $"{(string.IsNullOrWhiteSpace(user.email) ? "" : " : " + user.email)}" + $"{(string.IsNullOrWhiteSpace(user.firstname) ? "" : " : " + user.firstname)}" + $"{(string.IsNullOrWhiteSpace(user.lastname) ? "" : " " + user.lastname)}" : ""
                }
            ).ToListAsync();

            firstFiltre = firstFiltre.DistinctBy(x => x.numero).OrderBy(x => x.numero).ToList();

            var result = new List<Tdb7JustifDTO>();

            if (firstFiltre == null)
                return result;

            double totalPrevu = 0;
            double totalReel = 0;
            double totalRetard = 0;
            double totalAvance = 0;

            var minNumero = firstFiltre.Min(x => x.numero);

            DateTime? prevDateValidation = null;

            // Get requête
            var requete = await _context.Requete.FirstOrDefaultAsync(r => r.IdRequete == justif.IdRequete);

            var projet = _ProjetRepository.GetProjetById(requete.IdProjet);
            var site = _SiteRepository.GetSiteById(requete.IdSite);

            foreach (var item in firstFiltre)
            {
                string DateValidationReel = "";

                double dureePrevue = item.duree;

                DateTime dateValidation = DateTime.Now;
                double dureeReelle = 0;

                double retard = 0;
                double avance = 0;

                var validateur = "";

                totalPrevu += dureePrevue;

                if (item.numero == minNumero)
                {
                    DateTime DateCreationCircuit = item.creationdate;

                    if (item.dateValidation.HasValue)
                    {
                        dateValidation = item.dateValidation.Value;

                        var histo = allHistos.FirstOrDefault(h => h.idCircuitEtape == item.idCircuitEtape && h.numero == item.numero);

                        if (histo?.idValidateur != null)
                        {
                            var utilisateur = _UtilisateurRepository.GetUtilisateurById(histo.idValidateur.Value);
                            if (utilisateur != null)
                            {
                                validateur =
                                    $"{utilisateur.fonction ?? "Sans fonction"}" +
                                    $"{(string.IsNullOrWhiteSpace(utilisateur.email) ? "" : " : " + utilisateur.email)}" +
                                    $"{(string.IsNullOrWhiteSpace(utilisateur.firstname) ? "" : " : " + utilisateur.firstname)}" +
                                    $"{(string.IsNullOrWhiteSpace(utilisateur.lastname) ? "" : " " + utilisateur.lastname)}";
                            }
                        }

                        dureeReelle = (dateValidation - DateCreationCircuit).TotalHours;

                        DateValidationReel = item.dateValidation.Value.ToString();
                    }
                    else
                    {
                        dureeReelle = (DateTime.Now - DateCreationCircuit).TotalHours;
                    }

                    if (dureeReelle > dureePrevue)
                        retard = dureeReelle - dureePrevue;
                    else
                        avance = dureePrevue - dureeReelle;

                    totalReel += dureeReelle;
                    totalRetard += retard;
                    totalAvance += avance;

                    prevDateValidation = item.dateValidation ?? DateTime.Now;
                }
                else
                {
                    if (prevDateValidation.HasValue)
                    {
                        if (item.dateValidation.HasValue)
                        {
                            dateValidation = item.dateValidation.Value;

                            var histo = allHistos.FirstOrDefault(h => h.idCircuitEtape == item.idCircuitEtape && h.numero == item.numero);

                            if (histo?.isPassMarcheSkyp == true)
                            {
                                dureeReelle = 0;
                                retard = 0;
                                avance = 0;
                                validateur = "Sans passation de marché";
                            }
                            else
                            {
                                dureeReelle = (dateValidation - prevDateValidation.Value).TotalHours;

                                if (dureeReelle > dureePrevue)
                                    retard = dureeReelle - dureePrevue;
                                else
                                    avance = dureePrevue - dureeReelle;

                                if (histo?.idValidateur != null)
                                {
                                    var utilisateur = _UtilisateurRepository.GetUtilisateurById(histo.idValidateur.Value);
                                    if (utilisateur != null)
                                    {
                                        validateur =
                                            $"{utilisateur.fonction ?? "Sans fonction"}" +
                                            $"{(string.IsNullOrWhiteSpace(utilisateur.email) ? "" : " : " + utilisateur.email)}" +
                                            $"{(string.IsNullOrWhiteSpace(utilisateur.firstname) ? "" : " : " + utilisateur.firstname)}" +
                                            $"{(string.IsNullOrWhiteSpace(utilisateur.lastname) ? "" : " " + utilisateur.lastname)}";
                                    }
                                }
                            }

                            totalReel += dureeReelle;
                            totalRetard += retard;
                            totalAvance += avance;

                            prevDateValidation = dateValidation;

                            DateValidationReel = item.dateValidation.Value.ToString();
                        }
                        else
                        {
                            dateValidation = DateTime.Now;

                            dureeReelle = (dateValidation - prevDateValidation.Value).TotalHours;

                            if (dureeReelle > dureePrevue)
                                retard = dureeReelle - dureePrevue;
                            else
                                avance = dureePrevue - dureeReelle;

                            totalReel += dureeReelle;
                            totalRetard += retard;
                            totalAvance += avance;

                            prevDateValidation = DateTime.Now;
                        }
                    }
                    else
                    {
                        dureeReelle = 0;
                        retard = 0;
                        avance = 0;

                        var histo = allHistos.FirstOrDefault(h => h.idCircuitEtape == item.idCircuitEtape && h.numero == item.numero);
                        if (histo?.isPassMarcheSkyp == true)
                            validateur = "Sans passation de marché";
                    }
                }

                result.Add(new Tdb7JustifDTO
                {
                    ProjetName = projet?.nom ?? "",
                    SiteName = site != null ? $"{site.code} - {site.nom}" : "",
                    NumeroEtape = item.numero.ToString(),
                    IntituleEtape = item.description,
                    Validateur = validateur,
                    DureePrevue = ConvertToHeureMinute(dureePrevue),
                    DureeReelle = ConvertToHeureMinute(dureeReelle),
                    Retard = ConvertToHeureMinute(retard),
                    Avance = ConvertToHeureMinute(avance),
                    DateValidation = DateValidationReel
                });
            }

            var NumeroEtape = "Total";
            var TotalDureePrevue = totalPrevu;
            var TotalDureeReelle = totalReel;
            var TotalRetardAvance = totalPrevu - totalReel;

            var IntituleTotalRetardAvance = TotalRetardAvance < 0 ? "Retard" : "Avance";

            // Total
            result.Add(new Tdb7JustifDTO
            {
                NumeroEtape = NumeroEtape,
                TotalDureePrevue = ConvertToHeureMinute(TotalDureePrevue),
                TotalDureeReelle = ConvertToHeureMinute(TotalDureeReelle),
                TotalRetardAvance = ConvertToHeureMinute(Math.Abs(TotalRetardAvance)),
                IntituleTotalRetardAvance = IntituleTotalRetardAvance
            });

            return result;
        }

        // Tdb8 : REQUETE : Liste des requêtes refusées
        public async Task<List<Tdb8RequeteDTO>> Tdb8Requete(FiltresDTO filtres)
        {
            var lastRefusList = await _context.HistoriqueValidationRequete.Where(h => h.etatValidation == 2 && h.isValidator == true).OrderBy(h => h.dateValidation).ToListAsync();

            var lastRefusDict = lastRefusList.GroupBy(h => h.idRequete).Select(g => g.First()).ToDictionary(h => h.idRequete);

            var requetesQuery = _context.Requete.Include(r => r.Utilisateur).ThenInclude(u => u.Agmo).AsQueryable();

            requetesQuery = requetesQuery.Where(r => r.EtatValidation == 2);

            // projet
            if (filtres.idprojets?.Any() == true)
                requetesQuery = requetesQuery.Where(r => filtres.idprojets.Contains(r.IdProjet));

            // site
            if (filtres.idsites?.Any() == true)
                requetesQuery = requetesQuery.Where(r => filtres.idsites.Contains(r.IdSite));

            // AGMO
            if (filtres.idagmos?.Any() == true)
                requetesQuery = requetesQuery.Where(r => r.Utilisateur != null && filtres.idagmos.Contains(r.Utilisateur.idAgmo));

            var requetes = await (
                from r in requetesQuery
                join ra in _context.RequeteAccuse on r.IdRequete equals ra.idRequete into raJoin
                from ra in raJoin.DefaultIfEmpty()
                select new { Requete = r, Accuse = ra }
            ).ToListAsync();

            if (!requetes.Any())
                return new List<Tdb8RequeteDTO>();

            var result = new List<Tdb8RequeteDTO>();

            foreach (var item in requetes)
            {
                var r = item.Requete;
                var ra = item.Accuse;

                lastRefusDict.TryGetValue(r.IdRequete, out var hv);

                if ((filtres.datedu.HasValue && (hv == null || hv.dateValidation < filtres.datedu)) ||
                    (filtres.dateau.HasValue && (hv == null || hv.dateValidation > filtres.dateau)))
                    continue;

                var ce = hv != null ? await _context.CircuitEtape.FirstOrDefaultAsync(x => x.idCircuitEtape == hv.idCircuitEtape) : null;

                var u = hv != null ? await _context.Utilisateur.FirstOrDefaultAsync(x => x.IdUtilisateur == hv.idValidateur) : null;

                var agmo = r.Utilisateur?.Agmo?.nom ?? "";

                var projet = _ProjetRepository.GetProjetById(r.IdProjet);
                var site = _SiteRepository.GetSiteById(r.IdSite);

                result.Add(new Tdb8RequeteDTO
                {
                    ProjetName = projet != null ? projet.nom : "",
                    SiteName = site != null ? $"{site.code} - {site.nom}" : "",
                    Numero = r.NumRequete,
                    Objet = "Requête de financement de l'activité " + (r.CodeActiviteTom ?? "") + " " + (r.IntituleActiviteTom ?? ""),
                    RefInterne = ra?.referenceInterne ?? "",
                    Etape = ce?.description ?? "",
                    Commentaire = hv?.commentaire ?? "",
                    DateRefus = hv?.dateValidation?.ToString("dd/MM/yyyy") ?? "",
                    Validateur = u != null ? $"{u.fonction ?? "Sans fonction"}" + $"{(string.IsNullOrWhiteSpace(u.email) ? "" : " : " + u.email)}" + $"{(string.IsNullOrWhiteSpace(u.firstname) ? "" : " : " + u.firstname)}" + $"{(string.IsNullOrWhiteSpace(u.lastname) ? "" : " " + u.lastname)}" : "",
                    Agmo = agmo
                });
            }

            return result;
        }

        // Tdb9 : JUSTIF : Liste des justificatifs refusées
        public async Task<List<Tdb9JustifDTO>> Tdb9Justificatif(FiltresDTO filtres)
        {
            var lastRefusList = await _context.HistoriqueValidationJustificatif.Where(h => h.etatValidation == 2 && h.isValidator == true).OrderBy(h => h.dateValidation).ToListAsync();

            var lastRefusDict = lastRefusList.GroupBy(h => h.idJustif).Select(g => g.First()).ToDictionary(h => h.idJustif);

            var justificatifsQuery = _context.Justificatif.Include(r => r.Utilisateur).ThenInclude(u => u.Agmo).AsQueryable();

            justificatifsQuery = justificatifsQuery.Where(j => j.EtatValidation == 2);

            // projet
            if (filtres.idprojets?.Any() == true)
                justificatifsQuery = justificatifsQuery.Where(j => _context.Requete.Any(r => r.IdRequete == j.IdRequete && filtres.idprojets.Contains(r.IdProjet)));

            // site
            if (filtres.idsites?.Any() == true)
                justificatifsQuery = justificatifsQuery.Where(j => _context.Requete.Any(r => r.IdRequete == j.IdRequete && filtres.idsites.Contains(r.IdSite)));

            // AGMO
            if (filtres.idagmos?.Any() == true)
                justificatifsQuery = justificatifsQuery.Where(j => _context.Utilisateur.Any(u => u.IdUtilisateur == j.IdUtilisateur && filtres.idagmos.Contains(u.idAgmo)));

            var justificatifs = await (
                from j in justificatifsQuery
                join ja in _context.JustificatifAccuse on j.IdJustif equals ja.idJustif into jaJointure
                from ja in jaJointure.DefaultIfEmpty()
                select new { Justif = j, Accuse = ja }
            ).OrderBy(a => a.Accuse.referenceInterne).ToListAsync();

            if (!justificatifs.Any())
                return new List<Tdb9JustifDTO>();

            var result = new List<Tdb9JustifDTO>();

            foreach (var item in justificatifs)
            {
                var j = item.Justif;
                var ja = item.Accuse;

                lastRefusDict.TryGetValue(j.IdJustif, out var hv);

                if ((filtres.datedu.HasValue && (hv == null || hv.dateValidation < filtres.datedu)) ||
                    (filtres.dateau.HasValue && (hv == null || hv.dateValidation > filtres.dateau)))
                    continue;

                var ce = hv != null ? await _context.CircuitEtape.FirstOrDefaultAsync(x => x.idCircuitEtape == hv.idCircuitEtape) : null;

                var u = hv != null ? await _context.Utilisateur.FirstOrDefaultAsync(x => x.IdUtilisateur == hv.idValidateur) : null;

                var agmo = j.Utilisateur?.Agmo?.nom ?? "";

                // Get requête
                var requete = await _context.Requete.FirstOrDefaultAsync(r => r.IdRequete == j.IdRequete);

                //Refinterne
                var accuse = await _context.RequeteAccuse.FirstOrDefaultAsync(a => a.idRequete == requete.IdRequete);
                var Refinterne = accuse?.referenceInterne ?? "";

                var projet = _ProjetRepository.GetProjetById(requete.IdProjet);
                var site = _SiteRepository.GetSiteById(requete.IdSite);

                result.Add(new Tdb9JustifDTO
                {
                    ProjetName = projet?.nom ?? "",
                    SiteName = site != null ? $"{site.code} - {site.nom}" : "",
                    NumeroJustif = j.Numero,
                    Objet = j.Objet ?? "",
                    RefInterne = ja?.referenceInterne ?? "",
                    Etape = ce?.description ?? "",
                    Commentaire = hv?.commentaire ?? "",
                    DateRefus = hv?.dateValidation?.ToString("dd/MM/yyyy") ?? "",
                    Validateur = u != null ? $"{u.fonction ?? "Sans fonction"}" + $"{(string.IsNullOrWhiteSpace(u.email) ? "" : " : " + u.email)}" + $"{(string.IsNullOrWhiteSpace(u.firstname) ? "" : " : " + u.firstname)}" + $"{(string.IsNullOrWhiteSpace(u.lastname) ? "" : " " + u.lastname)}" : "",
                    RefInterneRequete = Refinterne,
                    NumeroRequete = requete.NumRequete,
                    Agmo = agmo
                });
            }

            return result;
        }

        private string GeRestDateString(DateTime? dateFinExecution, DateTime? DateNow)
        {
            if (!dateFinExecution.HasValue)
                return "";

            var difference = (dateFinExecution.Value.Date - DateNow.Value.Date).Days + 1;

            return difference > 0 ? difference.ToString() : "";
        }

        // Tdb10 : REQUETE : Alertes et échéances à venir : Anticiper les échéances critiques et alerter les responsables. Mise en évidence des requêtes à échéance < 5 jours
        public async Task<List<Tdb10RequeteDTO>> Tdb10Requete(FiltresDTO filtres)
        {
            var query = _context.Requete.Include(r => r.RequeteAccuses).Include(r => r.Justificatifs).Include(r => r.Utilisateur).ThenInclude(u => u.Agmo).AsQueryable();

            // etat == 5
            query = query.Where(r => r.EtatValidation == 5);

            // projet
            if (filtres.idprojets?.Any() == true)
                query = query.Where(r => filtres.idprojets.Contains(r.IdProjet));

            // site
            if (filtres.idsites?.Any() == true)
                query = query.Where(r => filtres.idsites.Contains(r.IdSite));

            // AGMO
            if (filtres.idagmos?.Any() == true)
                query = query.Where(r => r.Utilisateur != null && filtres.idagmos.Contains(r.Utilisateur.idAgmo));

            // date du et au
            if (filtres.datedu.HasValue && filtres.dateau.HasValue)
                query = query.Where(r => r.creationdate >= filtres.datedu.Value && r.creationdate <= filtres.dateau.Value);

            if (!await query.AnyAsync())
                return new List<Tdb10RequeteDTO>();

            int JourDelais = 0;
            var idTypeRequete = query.First().IdTypeRequete;
            var typeRequete = await _context.TypeRequete.FirstOrDefaultAsync(tr => tr.IdTypeRequete == idTypeRequete);
            if (typeRequete != null)
                JourDelais = typeRequete.DelaiJustification ?? 0;

            var firstFiltre = await query.OrderByDescending(r => r.creationdate)
            .Select(r => new
            {
                r.IdProjet,
                r.IdSite,
                Utilisateur = r.Utilisateur,
                r.NumRequete,
                RefInterne = r.RequeteAccuses.Select(ra => ra.referenceInterne).FirstOrDefault(),
                r.creationdate,
                r.DateFinExecution,
                r.CodeActiviteTom,
                r.IntituleActiviteTom,
                r.Montant, // mila ovaina anle Mvalidé
                Justificatifs = r.Justificatifs.ToList(),
                Justifie = r.Justificatifs.Sum(j => j.Montant ?? 0)
            }).Where(r => (r.Montant ?? 0) - r.Justifie > 0).OrderByDescending(r => r.creationdate).ToListAsync();

            // Anticiper les échéances critiques et alerter les responsables. Mise en évidence des requêtes à échéance < 5 jours
            var alertes = firstFiltre
                .Where(r =>
                    r.DateFinExecution.HasValue &&
                    ((DateOnly)r.DateFinExecution).AddDays(JourDelais) >= DateOnly.FromDateTime(DateTime.Now) &&
                    ((DateOnly)r.DateFinExecution).AddDays(JourDelais) < DateOnly.FromDateTime(DateTime.Now).AddDays(5)
                ).ToList();

            var result = alertes.Select(r => new Tdb10RequeteDTO
            {
                ProjetName = _context.Projet.Where(p => p.idProjet == r.IdProjet).Select(p => p.nom).FirstOrDefault() ?? "",
                SiteName = _context.Site.Where(s => s.idSite == r.IdSite).Select(s => s.nom).FirstOrDefault() ?? "",
                Agmo = r.Utilisateur?.Agmo?.nom ?? "",
                Demandeur = r.Utilisateur != null
                ? $"{(string.IsNullOrWhiteSpace(r.Utilisateur.fonction) ? "Sans fonction" : r.Utilisateur.fonction)}"
                    + $"{(string.IsNullOrWhiteSpace(r.Utilisateur.email) ? "" : " : " + r.Utilisateur.email)}"
                    + $"{(string.IsNullOrWhiteSpace(r.Utilisateur.firstname) ? "" : " : " + r.Utilisateur.firstname)}"
                    + $"{(string.IsNullOrWhiteSpace(r.Utilisateur.lastname) ? "" : " " + r.Utilisateur.lastname)}"
                : "",
                Numero = r.NumRequete ?? "",
                RefInterne = r.RefInterne ?? "",
                Objet = "Requête de financement de l'activité " + (r.CodeActiviteTom ?? "") + " " + (r.IntituleActiviteTom ?? ""),
                DateFinExecution = r.DateFinExecution?.ToString("dd/MM/yyyy") ?? "",
                DateFinEcheance = r.DateFinExecution?.AddDays(JourDelais).ToString("dd/MM/yyyy") ?? "",
                ResteJour = GeRestDateString(r.DateFinExecution?.AddDays(JourDelais).ToDateTime(TimeOnly.MinValue), DateTime.Now),
                ResteMontant = ((r.Montant ?? 0) - r.Justificatifs.Sum(j => j.Montant ?? 0)).ToString("N2")
            }).ToList();

            return result;
        }

        // Tdb11 : REQUETE : Statistiques générales (nombre)
        public async Task<List<Tdb11RequeteDTO>> Tdb11Requete(FiltresDTO filtres)
        {
            var query = _context.Requete.Include(r => r.Utilisateur).ThenInclude(u => u.Agmo).AsQueryable();

            // projet
            if (filtres.idprojets?.Any() == true)
                query = query.Where(r => filtres.idprojets.Contains(r.IdProjet));

            // site
            if (filtres.idsites?.Any() == true)
                query = query.Where(r => filtres.idsites.Contains(r.IdSite));

            // AGMO
            if (filtres.idagmos?.Any() == true)
                query = query.Where(r => r.Utilisateur != null && filtres.idagmos.Contains(r.Utilisateur.idAgmo));

            var requetes = await query.ToListAsync();

            if (!requetes.Any())
                return new List<Tdb11RequeteDTO>();

            var resultRegroupe = requetes.GroupBy(r => r.IdUtilisateur)
                .Select(g =>
                {
                    var u = g.FirstOrDefault()?.Utilisateur;
                    var agmoNom = u?.Agmo?.nom ?? "";
                    //var agmoNom = u != null ? $"{u.fonction ?? "Sans fonction"}" + $"{(string.IsNullOrWhiteSpace(u.email) ? "" : " : " + u.email)}" + $"{(string.IsNullOrWhiteSpace(u.firstname) ? "" : " : " + u.firstname)}" + $"{(string.IsNullOrWhiteSpace(u.lastname) ? "" : " " + u.lastname)}" : "";

                    int initiees = 0, envoyees = 0, encours = 0, validees = 0, refusees = 0, cloturees = 0;

                    foreach (var r in g)
                    {
                        if (r.EtatValidation == 0)
                        {
                            if (r.cloture == true)
                                envoyees++;
                            else
                                initiees++;
                        }
                        else if (r.EtatValidation == 1 || r.EtatValidation == 4)
                        {
                            encours++;
                        }
                        else if (r.EtatValidation == 2)
                        {
                            refusees++;
                        }
                        else if (r.EtatValidation == 5)
                        {
                            if (r.cloture == true)
                                cloturees++;
                            else
                                validees++;
                        }
                    }

                    var projet = _ProjetRepository.GetProjetById(g.FirstOrDefault().IdProjet);
                    var site = _SiteRepository.GetSiteById(g.FirstOrDefault().IdSite);

                    return new Tdb11RequeteDTO
                    {
                        ProjetName = projet?.nom ?? "",
                        SiteName = site != null ? $"{site.code} - {site.nom}" : "",
                        Agmo = agmoNom,
                        Initie = initiees,
                        Envoye = envoyees,
                        EnCours = encours,
                        Valide = validees,
                        Refuse = refusees,
                        Cloture = cloturees,
                        Total = initiees + envoyees + encours + validees + refusees + cloturees // Total par ligne (colonne farany)
                    };
                })
                .ToList();

            // Total par colonne (ligne farany)
            var totalRow = new Tdb11RequeteDTO
            {
                Agmo = "Total",
                Initie = resultRegroupe.Sum(x => x.Initie),
                Envoye = resultRegroupe.Sum(x => x.Envoye),
                EnCours = resultRegroupe.Sum(x => x.EnCours),
                Valide = resultRegroupe.Sum(x => x.Valide),
                Refuse = resultRegroupe.Sum(x => x.Refuse),
                Cloture = resultRegroupe.Sum(x => x.Cloture),
                Total = resultRegroupe.Sum(x => x.Total)
            };

            resultRegroupe.Add(totalRow);

            return resultRegroupe;
        }

        // Tdb12 : JUSTIF : Statistiques générales (nombre)
        public async Task<List<Tdb12JustifDTO>> Tdb12Justificatif(FiltresDTO filtres)
        {
            var query = _context.Justificatif.Include(r => r.Utilisateur).ThenInclude(u => u.Agmo).Include(j => j.Requete).AsQueryable();

            // projet
            if (filtres.idprojets?.Any() == true)
                query = query.Where(j => j.Requete != null && filtres.idprojets.Contains(j.Requete.IdProjet));

            // site
            if (filtres.idsites?.Any() == true)
                query = query.Where(j => j.Requete != null && filtres.idsites.Contains(j.Requete.IdSite));

            // AGMO
            if (filtres.idagmos?.Any() == true)
                query = query.Where(j => j.Utilisateur != null && filtres.idagmos.Contains(j.Utilisateur.idAgmo));

            var justificatifs = await query.ToListAsync();

            if (!justificatifs.Any())
                return new List<Tdb12JustifDTO>();

            var resultRegroupe = justificatifs.GroupBy(j => j.IdUtilisateur)
            .Select(g =>
            {
                var u = g.FirstOrDefault()?.Utilisateur;
                var agmoNom = u?.Agmo?.nom ?? "";
                //var agmoNom = u != null ? $"{u.fonction ?? "Sans fonction"}" + $"{(string.IsNullOrWhiteSpace(u.email) ? "" : " : " + u.email)}" + $"{(string.IsNullOrWhiteSpace(u.firstname) ? "" : " : " + u.firstname)}" + $"{(string.IsNullOrWhiteSpace(u.lastname) ? "" : " " + u.lastname)}" : "";

                int envoyes = 0, encours = 0, refuses = 0, valides = 0, clotures = 0;

                foreach (var j in g)
                {
                    int statut = j.EtatValidation;
                    bool? cloture = j.Requete?.cloture;

                    if (statut == 0)
                        envoyes++;
                    else if (statut == 1 || statut == 4)
                        encours++;
                    else if (statut == 2)
                        refuses++;
                    else if (statut == 5 && (cloture == false || cloture == null))
                        valides++;
                    else if (statut == 5 && cloture == true)
                        clotures++;
                }

                var projet = _ProjetRepository.GetProjetById(g.FirstOrDefault().Requete.IdProjet);
                var site = _SiteRepository.GetSiteById(g.FirstOrDefault().Requete.IdSite);

                return new Tdb12JustifDTO
                {
                    ProjetName = projet?.nom ?? "",
                    SiteName = site != null ? $"{site.code} - {site.nom}" : "",
                    Agmo = agmoNom,
                    Envoye = envoyes,
                    EnCours = encours,
                    Refuse = refuses,
                    Valide = valides,
                    Cloture = clotures
                    // Ny Total par ligne (colonne farany) : efa automatique anaty DTO : Tdb8JustifDTO => public int Total => Envoye + EnCours + Refuse + Valide + Cloture;
                };
            })
            .ToList();

            // Ligne total par colonne (ligne farany)
            var totalRow = new Tdb12JustifDTO
            {
                Agmo = "Total",
                Envoye = resultRegroupe.Sum(x => x.Envoye),
                EnCours = resultRegroupe.Sum(x => x.EnCours),
                Refuse = resultRegroupe.Sum(x => x.Refuse),
                Valide = resultRegroupe.Sum(x => x.Valide),
                Cloture = resultRegroupe.Sum(x => x.Cloture)
                // Ny Total par ligne (colonne farany) : efa automatique anaty DTO : Tdb8JustifDTO => public int Total => Envoye + EnCours + Refuse + Valide + Cloture;
            };

            resultRegroupe.Add(totalRow);

            return resultRegroupe;
        }

        // Tdb13 : REQUETE et/ou JUSTIF : Liste des requetes et/ou justificatifs refusés
        public async Task<List<Tdb13RequeteJustifDTO>> Tdb13RequeteJustificatif(FiltresDTO filtres)
        {
            var result = new List<Tdb13RequeteJustifDTO>();

            bool FiltreRequetes = false;
            bool FiltreJustificatifs = false;

            if (string.IsNullOrEmpty(filtres.etattrj))
            {
                FiltreRequetes = true;
                FiltreJustificatifs = true;
            }
            else
            {
                FiltreRequetes = filtres.etattrj.Equals("requetes", StringComparison.OrdinalIgnoreCase);
                FiltreJustificatifs = filtres.etattrj.Equals("justificatifs", StringComparison.OrdinalIgnoreCase);
            }

            // REQUETES
            if (FiltreRequetes)
            {
                var lastRefusListReq = await _context.HistoriqueValidationRequete.Where(h => h.etatValidation == 2 && h.isValidator == true).OrderBy(h => h.dateValidation).ToListAsync();

                var lastRefusDictReq = lastRefusListReq.GroupBy(h => h.idRequete).Select(g => g.First()).ToDictionary(h => h.idRequete);

                var requetesQuery = _context.Requete.Include(r => r.Utilisateur).ThenInclude(u => u.Agmo).Where(r => r.EtatValidation == 2).AsQueryable();

                // projet
                if (filtres.idprojets?.Any() == true)
                    requetesQuery = requetesQuery.Where(r => filtres.idprojets.Contains(r.IdProjet));

                // site
                if (filtres.idsites?.Any() == true)
                    requetesQuery = requetesQuery.Where(r => filtres.idsites.Contains(r.IdSite));

                // AGMO
                if (filtres.idagmos?.Any() == true)
                    requetesQuery = requetesQuery.Where(r => r.Utilisateur != null && filtres.idagmos.Contains(r.Utilisateur.idAgmo));

                var requetes = await (
                    from r in requetesQuery
                    join ra in _context.RequeteAccuse on r.IdRequete equals ra.idRequete into raJoin
                    from ra in raJoin.DefaultIfEmpty()
                    select new { Requete = r, Accuse = ra }
                ).ToListAsync();

                foreach (var item in requetes)
                {
                    lastRefusDictReq.TryGetValue(item.Requete.IdRequete, out var hv);

                    if ((filtres.datedu.HasValue && (hv == null || hv.dateValidation < filtres.datedu)) ||
                        (filtres.dateau.HasValue && (hv == null || hv.dateValidation > filtres.dateau)))
                        continue;

                    var ce = hv != null ? await _context.CircuitEtape.FirstOrDefaultAsync(x => x.idCircuitEtape == hv.idCircuitEtape) : null;
                    var u = hv != null ? await _context.Utilisateur.FirstOrDefaultAsync(x => x.IdUtilisateur == hv.idValidateur) : null;

                    var projet = _ProjetRepository.GetProjetById(item.Requete.IdProjet);
                    var site = _SiteRepository.GetSiteById(item.Requete.IdSite);

                    var utilisateur = item.Requete.Utilisateur;
                    var demandeur = u != null ? $"{utilisateur.fonction ?? "Sans fonction"}" + $"{(string.IsNullOrWhiteSpace(utilisateur.email) ? "" : " : " + utilisateur.email)}" + $"{(string.IsNullOrWhiteSpace(utilisateur.firstname) ? "" : " : " + utilisateur.firstname)}" + $"{(string.IsNullOrWhiteSpace(utilisateur.lastname) ? "" : " " + utilisateur.lastname)}" : "";

                    result.Add(new Tdb13RequeteJustifDTO
                    {
                        ProjetName = projet?.nom ?? "",
                        SiteName = site != null ? $"{site.code} - {site.nom}" : "",
                        Agmo = item.Requete.Utilisateur?.Agmo?.nom ?? "",
                        Demandeur = demandeur,
                        Numero = item.Requete.NumRequete,
                        Objet = "Requête de financement de l'activité " + (item.Requete.CodeActiviteTom ?? "") + " " + (item.Requete.IntituleActiviteTom ?? ""),
                        RefInterne = item.Accuse?.referenceInterne ?? "",
                        Etape = ce?.description ?? "",
                        Validateur = u != null
                            ? $"{u.fonction ?? "Sans fonction"}" +
                              $"{(string.IsNullOrWhiteSpace(u.email) ? "" : " : " + u.email)}" +
                              $"{(string.IsNullOrWhiteSpace(u.firstname) ? "" : " : " + u.firstname)}" +
                              $"{(string.IsNullOrWhiteSpace(u.lastname) ? "" : " " + u.lastname)}"
                            : "",
                        Commentaire = hv?.commentaire ?? "",
                        DateRefus = hv?.dateValidation?.ToString("dd/MM/yyyy") ?? ""
                    });
                }
            }

            // JUSTIFICATIFS
            if (FiltreJustificatifs)
            {
                var lastRefusListJustif = await _context.HistoriqueValidationJustificatif.Where(h => h.etatValidation == 2 && h.isValidator == true).OrderBy(h => h.dateValidation).ToListAsync();

                var lastRefusDictJustif = lastRefusListJustif.GroupBy(h => h.idJustif).Select(g => g.First()).ToDictionary(h => h.idJustif);

                var justifsQuery = _context.Justificatif.Include(j => j.Utilisateur).ThenInclude(u => u.Agmo).Where(j => j.EtatValidation == 2).AsQueryable();

                // projet
                if (filtres.idprojets?.Any() == true)
                    justifsQuery = justifsQuery.Where(j => _context.Requete.Any(r => r.IdRequete == j.IdRequete && filtres.idprojets.Contains(r.IdProjet)));

                // site
                if (filtres.idsites?.Any() == true)
                    justifsQuery = justifsQuery.Where(j => _context.Requete.Any(r => r.IdRequete == j.IdRequete && filtres.idsites.Contains(r.IdSite)));

                // AGMO
                if (filtres.idagmos?.Any() == true)
                    justifsQuery = justifsQuery.Where(j => _context.Utilisateur.Any(u => u.IdUtilisateur == j.IdUtilisateur && filtres.idagmos.Contains(u.idAgmo)));

                var justifs = await (
                    from j in justifsQuery
                    join ja in _context.JustificatifAccuse on j.IdJustif equals ja.idJustif into jaJoin
                    from ja in jaJoin.DefaultIfEmpty()
                    select new { Justif = j, Accuse = ja }
                ).ToListAsync();

                foreach (var item in justifs)
                {
                    lastRefusDictJustif.TryGetValue(item.Justif.IdJustif, out var hv);

                    if ((filtres.datedu.HasValue && (hv == null || hv.dateValidation < filtres.datedu)) ||
                        (filtres.dateau.HasValue && (hv == null || hv.dateValidation > filtres.dateau)))
                        continue;

                    var ce = hv != null ? await _context.CircuitEtape.FirstOrDefaultAsync(x => x.idCircuitEtape == hv.idCircuitEtape) : null;
                    var u = hv != null ? await _context.Utilisateur.FirstOrDefaultAsync(x => x.IdUtilisateur == hv.idValidateur) : null;

                    var requete = await _context.Requete.FirstOrDefaultAsync(r => r.IdRequete == item.Justif.IdRequete);
                    var accuseReq = await _context.RequeteAccuse.FirstOrDefaultAsync(a => a.idRequete == requete.IdRequete);

                    var projet = _ProjetRepository.GetProjetById(requete.IdProjet);
                    var site = _SiteRepository.GetSiteById(requete.IdSite);

                    var utilisateur = item.Justif.Utilisateur;
                    var demandeur = u != null ? $"{utilisateur.fonction ?? "Sans fonction"}" + $"{(string.IsNullOrWhiteSpace(utilisateur.email) ? "" : " : " + utilisateur.email)}" + $"{(string.IsNullOrWhiteSpace(utilisateur.firstname) ? "" : " : " + utilisateur.firstname)}" + $"{(string.IsNullOrWhiteSpace(utilisateur.lastname) ? "" : " " + utilisateur.lastname)}" : "";

                    result.Add(new Tdb13RequeteJustifDTO
                    {
                        ProjetName = projet?.nom ?? "",
                        SiteName = site != null ? $"{site.code} - {site.nom}" : "",
                        Agmo = item.Justif.Utilisateur?.Agmo?.nom ?? "",
                        Demandeur = demandeur,
                        Numero = item.Justif.Numero,
                        Objet = item.Justif.Objet ?? "",
                        RefInterne = item.Accuse?.referenceInterne ?? "",
                        Etape = ce?.description ?? "",
                        Validateur = u != null
                            ? $"{u.fonction ?? "Sans fonction"}" +
                              $"{(string.IsNullOrWhiteSpace(u.email) ? "" : " : " + u.email)}" +
                              $"{(string.IsNullOrWhiteSpace(u.firstname) ? "" : " : " + u.firstname)}" +
                              $"{(string.IsNullOrWhiteSpace(u.lastname) ? "" : " " + u.lastname)}"
                            : "",
                        Commentaire = hv?.commentaire ?? "",
                        DateRefus = hv?.dateValidation?.ToString("dd/MM/yyyy") ?? ""
                    });
                }
            }

            return result;
        }

        /*public async Task<List<Tdb14RequeteJustifDTO>> Tdb14RequeteJustificatif(FiltresDTO filtres)
        {
            var result = new List<Tdb14RequeteJustifDTO>();

            bool FiltreRequetes = false;
            bool FiltreJustificatifs = false;
            bool FiltreTous = false;

            if (string.IsNullOrEmpty(filtres.etattrj))
            {
                FiltreTous = true;
            }
            else
            {
                FiltreRequetes = filtres.etattrj.Equals("requetes", StringComparison.OrdinalIgnoreCase);
                FiltreJustificatifs = filtres.etattrj.Equals("justificatifs", StringComparison.OrdinalIgnoreCase);
            }

            // REQUETES
            if (FiltreRequetes)
            {
                var query = _context.Requete.Include(r => r.Utilisateur).ThenInclude(u => u.Agmo).AsQueryable();

                // projet
                if (filtres.idprojets?.Any() == true)
                    query = query.Where(r => filtres.idprojets.Contains(r.IdProjet));

                // site
                if (filtres.idsites?.Any() == true)
                    query = query.Where(r => filtres.idsites.Contains(r.IdSite));

                // AGMO
                if (filtres.idagmos?.Any() == true)
                    query = query.Where(r => r.Utilisateur != null  && filtres.idagmos.Contains(r.Utilisateur.idAgmo));

                // date du et au
                if (filtres.datedu.HasValue && filtres.dateau.HasValue)
                    query = query.Where(r => r.creationdate >= filtres.datedu.Value && r.creationdate <= filtres.dateau.Value);

                // statut
                if (filtres.statut.HasValue)
                {
                    var statutFiltre = (RequeteStatutFiltre)filtres.statut.Value;
                    query = query.Where(statutFiltre.GetFiltre());
                }

                if (!query.Any())
                    return new List<Tdb14RequeteJustifDTO>();

                var requetes = await query.OrderBy(r => r.creationdate).ToListAsync();

                var idProjets = requetes.Select(r => r.IdProjet).Distinct().ToList();
                var IdSites = requetes.Select(r => r.IdSite).Distinct().ToList();

                var projets = await _context.Projet.Where(p => idProjets.Contains(p.idProjet) && p.deletionDate == null).ToDictionaryAsync(p => p.idProjet);
                var sites = await _context.Site.Where(s => IdSites.Contains(s.idSite) && s.deletiondate == null).ToDictionaryAsync(s => s.idSite);

                int JourDelais = 0;
                var idTypeRequete = requetes.First().IdTypeRequete;
                var typeRequete = await _context.TypeRequete.FirstOrDefaultAsync(tr => tr.IdTypeRequete == idTypeRequete);
                if (typeRequete != null)
                    JourDelais = typeRequete.DelaiJustification ?? 0;

                // Mappage
                result = requetes.Select(r => new Tdb14RequeteJustifDTO
                {
                    ProjetName = projets.TryGetValue(r.IdProjet, out var projet) ? projet.nom : "",
                    SiteName = sites.TryGetValue(r.IdSite, out var site) ? $"{site.code} - {site.nom}" : "",
                    NumeroRequete = r.NumRequete ?? "",
                    Objet = "Requête de financement de l'activité " + (r.CodeActiviteTom ?? "") + " " + (r.IntituleActiviteTom ?? ""),
                    Agmo = r.Utilisateur?.Agmo?.nom ?? "",
                    Demandeur = r.Utilisateur != null
                        ? $"{(string.IsNullOrWhiteSpace(r.Utilisateur.fonction) ? "Sans fonction" : r.Utilisateur.fonction)}"
                          + $"{(string.IsNullOrWhiteSpace(r.Utilisateur.email) ? "" : " : " + r.Utilisateur.email)}"
                          + $"{(string.IsNullOrWhiteSpace(r.Utilisateur.firstname) ? "" : " : " + r.Utilisateur.firstname)}"
                          + $"{(string.IsNullOrWhiteSpace(r.Utilisateur.lastname) ? "" : " " + r.Utilisateur.lastname)}"
                        : "",
                    MontantRequeteValide = r.MontantValide.HasValue ? r.MontantValide.Value.ToString("N2") : "0", // montant validé requête
                    Statut = GetStatutLibelleRequete((int) r.EtatValidation, r.cloture),
                    DateFinExecution = r.DateFinExecution?.ToString("dd/MM/yyyy") ?? "",
                    DateFinEcheance = r.DateFinExecution?.AddDays(JourDelais).ToString("dd/MM/yyyy") ?? ""
                }).ToList();
            }

            // JUSTIFICATIFS
            if (FiltreJustificatifs)
            {
                var query = _context.Justificatif.Include(r => r.Utilisateur).ThenInclude(u => u.Agmo).Include(j => j.Requete).AsQueryable();

                // projet
                if (filtres.idprojets?.Any() == true)
                    query = query.Where(j => j.Requete != null && filtres.idprojets.Contains(j.Requete.IdProjet));

                // site
                if (filtres.idsites?.Any() == true)
                    query = query.Where(j => j.Requete != null && filtres.idsites.Contains(j.Requete.IdSite));

                // AGMO
                if (filtres.idagmos?.Any() == true)
                    query = query.Where(j => j.Utilisateur != null  && filtres.idagmos.Contains(j.Utilisateur.idAgmo));

                // date du et au
                if (filtres.datedu.HasValue && filtres.dateau.HasValue)
                    query = query.Where(r => r.CreationDate >= filtres.datedu.Value && r.CreationDate <= filtres.dateau.Value);

                if (!query.Any())
                    return new List<Tdb14RequeteJustifDTO>();

                // filtre 1
                var firstFiltre = await query.OrderBy(j => j.CreationDate)
                .Select(j => new
                {
                    j.Numero,
                    j.Objet,
                    j.CreationDate,
                    j.Montant,
                    j.EtatValidation,
                    j.Utilisateur,
                    idProjet = j.Requete.IdProjet,
                    IdSite = j.Requete.IdSite,
                    Cloture = j.Requete != null ? j.Requete.cloture : null,
                    NumRequete = j.Requete.NumRequete,
                    DateFinExecution = j.Requete != null ? j.Requete.DateFinExecution : null,
                    MontantRequeteValide = j.Requete.MontantValide // montant validé requête
                })
                .ToListAsync();

                // statut
                if (filtres.statut.HasValue)
                {
                    var statutFiltre = filtres.statut.Value;
                    firstFiltre = firstFiltre.Where(j => GetStatutCode(j.EtatValidation, j.Cloture) == statutFiltre).ToList();
                }

                var idProjets = firstFiltre.Select(j => j.idProjet).Distinct().ToList();
                var IdSites = firstFiltre.Select(j => j.IdSite).Distinct().ToList();

                var projets = await _context.Projet
                    .Where(p => idProjets.Contains(p.idProjet) && p.deletionDate == null)
                    .ToDictionaryAsync(p => p.idProjet);

                var sites = await _context.Site
                    .Where(s => IdSites.Contains(s.idSite) && s.deletiondate == null)
                    .ToDictionaryAsync(s => s.idSite);

                int JourDelais = 0;
                var idTypeRequete = query.First().Requete.IdTypeRequete;
                var typeRequete = await _context.TypeRequete.FirstOrDefaultAsync(tr => tr.IdTypeRequete == idTypeRequete);
                if (typeRequete != null)
                    JourDelais = typeRequete.DelaiJustification ?? 0;

                result = firstFiltre.Select(j => new Tdb14RequeteJustifDTO
                {
                    ProjetName = projets.TryGetValue(j.idProjet, out var projet) ? projet.nom : "",
                    SiteName = sites.TryGetValue(j.IdSite, out var site) ? $"{site.code} - {site.nom}" : "",
                    NumeroRequete = j.NumRequete ?? "",
                    Objet = j.Objet ?? "",
                    Agmo = j.Utilisateur?.Agmo?.nom ?? "",
                    Demandeur = j.Utilisateur != null
                        ? $"{(string.IsNullOrWhiteSpace(j.Utilisateur.fonction) ? "Sans fonction" : j.Utilisateur.fonction)}"
                            + $"{(string.IsNullOrWhiteSpace(j.Utilisateur.email) ? "" : " : " + j.Utilisateur.email)}"
                            + $"{(string.IsNullOrWhiteSpace(j.Utilisateur.firstname) ? "" : " : " + j.Utilisateur.firstname)}"
                            + $"{(string.IsNullOrWhiteSpace(j.Utilisateur.lastname) ? "" : " " + j.Utilisateur.lastname)}"
                        : "",
                    NumeroJustif = j.Numero ?? "",
                    MontantRequeteValide = j.MontantRequeteValide.HasValue ? j.MontantRequeteValide.Value.ToString("N2") : "0",
                    MontantJustif = j.Montant.HasValue ? j.Montant.Value.ToString("N2") : "0",
                    Statut = GetStatutLibelleJustificatif(j.EtatValidation, j.Cloture),
                    DateFinExecution = j.DateFinExecution?.ToString("dd/MM/yyyy") ?? "",
                    DateFinEcheance = j.DateFinExecution?.AddDays(JourDelais).ToString("dd/MM/yyyy") ?? ""
                }).ToList();
            }

            // TOUS
            if (FiltreTous)
            {
                var query = _context.Requete.Include(r => r.RequeteAccuses).Include(r => r.Justificatifs).Include(r => r.Utilisateur).ThenInclude(u => u.Agmo).AsQueryable();

                // etat == 5
                //query = query.Where(r => r.EtatValidation == 5);

                // projet
                if (filtres.idprojets?.Any() == true)
                    query = query.Where(r => filtres.idprojets.Contains(r.IdProjet));

                // site
                if (filtres.idsites?.Any() == true)
                    query = query.Where(r => filtres.idsites.Contains(r.IdSite));

                // AGMO
                if (filtres.idagmos?.Any() == true)
                    query = query.Where(r => r.Utilisateur != null  && filtres.idagmos.Contains(r.Utilisateur.idAgmo));

                // date du et au
                if (filtres.datedu.HasValue && filtres.dateau.HasValue)
                    query = query.Where(r => r.creationdate >= filtres.datedu.Value && r.creationdate <= filtres.dateau.Value);

                if (!query.Any())
                    return new List<Tdb14RequeteJustifDTO>();

                int JourDelais = 0;
                var idTypeRequete = query.First().IdTypeRequete;
                var typeRequete = await _context.TypeRequete.FirstOrDefaultAsync(tr => tr.IdTypeRequete == idTypeRequete);
                if (typeRequete != null)
                    JourDelais = typeRequete.DelaiJustification ?? 0;

                var firstFiltre = await query.OrderByDescending(r => r.creationdate)
                .Select(r => new
                {
                    r.IdProjet,
                    r.IdSite,
                    Utilisateur = r.Utilisateur,
                    r.NumRequete,
                    r.creationdate,
                    r.DateFinExecution,
                    r.CodeActiviteTom,
                    r.IntituleActiviteTom,
                    r.MontantValide, // montant validé requête
                    Justificatifs = r.Justificatifs.ToList(),
                    Justifie = r.Justificatifs.Sum(j => j.Montant ?? 0)
                })
                .ToListAsync();

                result = firstFiltre.Select(r => new Tdb14RequeteJustifDTO
                {
                    ProjetName = _context.Projet.Where(p => p.idProjet == r.IdProjet).Select(p => p.nom).FirstOrDefault() ?? "",
                    SiteName = _context.Site.Where(s => s.idSite == r.IdSite).Select(s => s.nom).FirstOrDefault() ?? "",
                    NumeroRequete = r.NumRequete ?? "",
                    Objet = "Requête de financement de l'activité " + (r.CodeActiviteTom ?? "") + " : " + (r.IntituleActiviteTom ?? ""),
                    Agmo = r.Utilisateur?.Agmo?.nom ?? "",
                    Demandeur = r.Utilisateur != null
                    ? $"{(string.IsNullOrWhiteSpace(r.Utilisateur.fonction) ? "Sans fonction" : r.Utilisateur.fonction)}"
                        + $"{(string.IsNullOrWhiteSpace(r.Utilisateur.email) ? "" : " : " + r.Utilisateur.email)}"
                        + $"{(string.IsNullOrWhiteSpace(r.Utilisateur.firstname) ? "" : " : " + r.Utilisateur.firstname)}"
                        + $"{(string.IsNullOrWhiteSpace(r.Utilisateur.lastname) ? "" : " " + r.Utilisateur.lastname)}"
                    : "",
                    MontantRequeteValide = (r.MontantValide ?? 0).ToString("N2"),
                    MontantJustif = r.Justificatifs.Sum(j => j.Montant ?? 0).ToString("N2"),
                    MontantReste = ((((decimal?)r.MontantValide) ?? 0) - r.Justificatifs.Sum(j => (decimal?)j.Montant ?? 0)).ToString("N2"),
                    DateFinExecution = r.DateFinExecution?.ToString("dd/MM/yyyy") ?? "",
                    DateFinEcheance = r.DateFinExecution?.AddDays(JourDelais).ToString("dd/MM/yyyy") ?? "",
                    Retard = ((((decimal?)r.MontantValide ?? 0) - r.Justificatifs.Sum(j => (decimal?) j.Montant ?? 0)) > 0) ? GetRetardString(r.DateFinExecution?.AddDays(JourDelais).ToDateTime(TimeOnly.MinValue), DateTime.Now) : GetRetardString(r.DateFinExecution?.AddDays(JourDelais).ToDateTime(TimeOnly.MinValue), r.Justificatifs.OrderByDescending(a => a.CreationDate).FirstOrDefault().CreationDate)
                }).ToList();
            }

            return result;
        }*/

        public async Task<List<Tdb14RequeteJustifDTO>> Tdb14RequeteJustificatif(FiltresDTO filtres)
        {
            var result = new List<Tdb14RequeteJustifDTO>();

            bool FiltreRequetes = false;
            bool FiltreJustificatifs = false;
            bool FiltreTous = false;

            if (string.IsNullOrEmpty(filtres.etattrj))
            {
                FiltreTous = true;
            }
            else
            {
                FiltreRequetes = filtres.etattrj.Equals("requetes", StringComparison.OrdinalIgnoreCase);
                FiltreJustificatifs = filtres.etattrj.Equals("justificatifs", StringComparison.OrdinalIgnoreCase);
            }

            // REQUETES
            if (FiltreRequetes)
            {
                var query = _context.Requete.Include(r => r.Utilisateur).ThenInclude(u => u.Agmo).AsQueryable();

                // projet
                if (filtres.idprojets?.Any() == true)
                    query = query.Where(r => filtres.idprojets.Contains(r.IdProjet));

                // site
                if (filtres.idsites?.Any() == true)
                    query = query.Where(r => filtres.idsites.Contains(r.IdSite));

                // AGMO
                if (filtres.idagmos?.Any() == true)
                    query = query.Where(r => r.Utilisateur != null && filtres.idagmos.Contains(r.Utilisateur.idAgmo));

                // date du et au
                if (filtres.datedu.HasValue && filtres.dateau.HasValue)
                    query = query.Where(r => r.creationdate >= filtres.datedu.Value && r.creationdate <= filtres.dateau.Value);

                // statut
                if (filtres.statut.HasValue)
                {
                    var statutFiltre = (RequeteStatutFiltre)filtres.statut.Value;
                    query = query.Where(statutFiltre.GetFiltre());
                }

                if (!query.Any())
                    return new List<Tdb14RequeteJustifDTO>();

                var requetes = await query.OrderBy(r => r.creationdate).ToListAsync();

                var idProjets = requetes.Select(r => r.IdProjet).Distinct().ToList();
                var idSites = requetes.Select(r => r.IdSite).Distinct().ToList();

                var projets = await _context.Projet.Where(p => idProjets.Contains(p.idProjet) && p.deletionDate == null).ToDictionaryAsync(p => p.idProjet);
                var sites = await _context.Site.Where(s => idSites.Contains(s.idSite) && s.deletiondate == null).ToDictionaryAsync(s => s.idSite);

                int JourDelais = 0;
                var idTypeRequete = requetes.First().IdTypeRequete;
                var typeRequete = await _context.TypeRequete.FirstOrDefaultAsync(tr => tr.IdTypeRequete == idTypeRequete);
                if (typeRequete != null)
                    JourDelais = typeRequete.DelaiJustification ?? 0;

                // Mappage
                result = requetes.Select(r => new Tdb14RequeteJustifDTO
                {
                    ProjetName = projets.TryGetValue(r.IdProjet, out var projet) ? projet.nom : "",
                    SiteName = sites.TryGetValue(r.IdSite, out var site) ? $"{site.code} - {site.nom}" : "",
                    NumeroRequete = r.NumRequete ?? "",
                    Objet = "Requête de financement de l'activité " + (r.CodeActiviteTom ?? "") + " " + (r.IntituleActiviteTom ?? ""),
                    Agmo = r.Utilisateur?.Agmo?.nom ?? "",
                    Demandeur = r.Utilisateur != null
                        ? $"{(string.IsNullOrWhiteSpace(r.Utilisateur.fonction) ? "Sans fonction" : r.Utilisateur.fonction)}"
                          + $"{(string.IsNullOrWhiteSpace(r.Utilisateur.email) ? "" : " : " + r.Utilisateur.email)}"
                          + $"{(string.IsNullOrWhiteSpace(r.Utilisateur.firstname) ? "" : " : " + r.Utilisateur.firstname)}"
                          + $"{(string.IsNullOrWhiteSpace(r.Utilisateur.lastname) ? "" : " " + r.Utilisateur.lastname)}"
                        : "",
                    MontantRequeteValide = r.MontantValide.HasValue ? r.MontantValide.Value.ToString("N2") : "0", // montant validé requête
                    Statut = GetStatutLibelleRequete(r.EtatValidation, r.cloture),
                    DateFinExecution = r.DateFinExecution?.ToString("dd/MM/yyyy") ?? "",
                    DateFinEcheance = r.DateFinExecution?.AddDays(JourDelais).ToString("dd/MM/yyyy") ?? ""
                }).ToList();
            }

            // JUSTIFICATIFS
            if (FiltreJustificatifs)
            {
                var query = _context.Justificatif.Include(r => r.Utilisateur).ThenInclude(u => u.Agmo).Include(j => j.Requete).AsQueryable();

                // projet
                if (filtres.idprojets?.Any() == true)
                    query = query.Where(j => j.Requete != null && filtres.idprojets.Contains(j.Requete.IdProjet));

                // site
                if (filtres.idsites?.Any() == true)
                    query = query.Where(j => j.Requete != null && filtres.idsites.Contains(j.Requete.IdSite));

                // AGMO
                if (filtres.idagmos?.Any() == true)
                    query = query.Where(j => j.Utilisateur != null && filtres.idagmos.Contains(j.Utilisateur.idAgmo));

                // date du et au
                if (filtres.datedu.HasValue && filtres.dateau.HasValue)
                    query = query.Where(r => r.CreationDate >= filtres.datedu.Value && r.CreationDate <= filtres.dateau.Value);

                if (!query.Any())
                    return new List<Tdb14RequeteJustifDTO>();

                // filtre 1
                var firstFiltre = await query.OrderBy(j => j.CreationDate)
                .Select(j => new
                {
                    j.Numero,
                    j.Objet,
                    j.CreationDate,
                    j.Montant,
                    j.EtatValidation,
                    j.Utilisateur,
                    idProjet = j.Requete.IdProjet,
                    idSite = j.Requete.IdSite,
                    Cloture = j.Requete != null ? j.Requete.cloture : null,
                    NumRequete = j.Requete.NumRequete,
                    DateFinExecution = j.Requete != null ? j.Requete.DateFinExecution : null,
                    MontantRequeteValide = j.Requete.MontantValide // montant validé requête
                })
                .ToListAsync();

                // statut
                if (filtres.statut.HasValue)
                {
                    var statutFiltre = filtres.statut.Value;
                    firstFiltre = firstFiltre.Where(j => GetStatutCode(j.EtatValidation, j.Cloture) == statutFiltre).ToList();
                }

                var idProjets = firstFiltre.Select(j => j.idProjet).Distinct().ToList();
                var idSites = firstFiltre.Select(j => j.idSite).Distinct().ToList();

                var projets = await _context.Projet
                    .Where(p => idProjets.Contains(p.idProjet) && p.deletionDate == null)
                    .ToDictionaryAsync(p => p.idProjet);

                var sites = await _context.Site
                    .Where(s => idSites.Contains(s.idSite) && s.deletiondate == null)
                    .ToDictionaryAsync(s => s.idSite);

                int JourDelais = 0;
                var idTypeRequete = query.First().Requete.IdTypeRequete;
                var typeRequete = await _context.TypeRequete.FirstOrDefaultAsync(tr => tr.IdTypeRequete == idTypeRequete);
                if (typeRequete != null)
                    JourDelais = typeRequete.DelaiJustification ?? 0;

                result = firstFiltre.Select(j => new Tdb14RequeteJustifDTO
                {
                    ProjetName = projets.TryGetValue(j.idProjet, out var projet) ? projet.nom : "",
                    SiteName = sites.TryGetValue(j.idSite, out var site) ? $"{site.code} - {site.nom}" : "",
                    NumeroRequete = j.NumRequete ?? "",
                    Objet = j.Objet ?? "",
                    Agmo = j.Utilisateur?.Agmo?.nom ?? "",
                    Demandeur = j.Utilisateur != null
                        ? $"{(string.IsNullOrWhiteSpace(j.Utilisateur.fonction) ? "Sans fonction" : j.Utilisateur.fonction)}"
                            + $"{(string.IsNullOrWhiteSpace(j.Utilisateur.email) ? "" : " : " + j.Utilisateur.email)}"
                            + $"{(string.IsNullOrWhiteSpace(j.Utilisateur.firstname) ? "" : " : " + j.Utilisateur.firstname)}"
                            + $"{(string.IsNullOrWhiteSpace(j.Utilisateur.lastname) ? "" : " " + j.Utilisateur.lastname)}"
                        : "",
                    NumeroJustif = j.Numero ?? "",
                    MontantRequeteValide = j.MontantRequeteValide.HasValue ? j.MontantRequeteValide.Value.ToString("N2") : "0",
                    MontantJustif = j.Montant.HasValue ? j.Montant.Value.ToString("N2") : "0",
                    Statut = GetStatutLibelleJustificatif(j.EtatValidation, j.Cloture),
                    DateFinExecution = j.DateFinExecution?.ToString("dd/MM/yyyy") ?? "",
                    DateFinEcheance = j.DateFinExecution?.AddDays(JourDelais).ToString("dd/MM/yyyy") ?? ""
                }).ToList();
            }


            if (FiltreTous)
            {
                Console.WriteLine("TOUSSSS");
                var query = _context.Requete
                    .Include(r => r.RequeteAccuses)
                    .Include(r => r.Justificatifs)
                    .Include(r => r.Utilisateur)
                        .ThenInclude(u => u.Agmo)
                    .AsQueryable();

                // Filtrage
                if (filtres.idprojets?.Any() == true)
                    query = query.Where(r => filtres.idprojets.Contains(r.IdProjet));

                if (filtres.idsites?.Any() == true)
                    query = query.Where(r => filtres.idsites.Contains(r.IdSite));

                if (filtres.idagmos?.Any() == true)
                    query = query.Where(r => r.Utilisateur != null && filtres.idagmos.Contains(r.Utilisateur.idAgmo));

                if (filtres.datedu.HasValue && filtres.dateau.HasValue)
                    query = query.Where(r => r.creationdate >= filtres.datedu.Value && r.creationdate <= filtres.dateau.Value);

                if (!query.Any())
                    return new List<Tdb14RequeteJustifDTO>();

                // Sécurisation FirstOrDefault()
                int JourDelais = 0;
                var firstRequete = await query.FirstOrDefaultAsync();
                if (firstRequete != null)
                {
                    var typeRequete = await _context.TypeRequete
                        .FirstOrDefaultAsync(tr => tr.IdTypeRequete == firstRequete.IdTypeRequete);
                    if (typeRequete != null)
                        JourDelais = typeRequete.DelaiJustification ?? 0;
                }

                var firstFiltre = await query
                    .OrderByDescending(r => r.creationdate)
                    .Select(r => new
                    {
                        r.IdProjet,
                        r.IdSite,
                        Utilisateur = r.Utilisateur,
                        r.NumRequete,
                        r.creationdate,
                        r.DateFinExecution,
                        r.CodeActiviteTom,
                        r.IntituleActiviteTom,
                        r.MontantValide, // montant validé requête
                        Justificatifs = r.Justificatifs.ToList(),
                        Justifie = r.Justificatifs.Sum(j => j.Montant ?? 0),
                        r.EtatValidation,
                        r.cloture
                    })
                    .ToListAsync();

                result = firstFiltre.Select(r =>
                {
                    var projetNom = _context.Projet
                        .Where(p => p.idProjet == r.IdProjet)
                        .Select(p => p.nom)
                        .FirstOrDefault() ?? "";

                    var siteNom = _context.Site
                        .Where(s => s.idSite == r.IdSite)
                        .Select(s => s.nom)
                        .FirstOrDefault() ?? "";

                    var dernierJustifDate = r.Justificatifs?
                        .OrderByDescending(a => a.CreationDate)
                        .FirstOrDefault()
                        ?.CreationDate;

                    return new Tdb14RequeteJustifDTO
                    {
                        ProjetName = projetNom,
                        SiteName = siteNom,
                        NumeroRequete = r.NumRequete ?? "",
                        Objet = "Requête de financement de l'activité " + (r.CodeActiviteTom ?? "") + " : " + (r.IntituleActiviteTom ?? ""),
                        Agmo = r.Utilisateur?.Agmo?.nom ?? "",
                        Demandeur = r.Utilisateur != null
                            ? $"{(string.IsNullOrWhiteSpace(r.Utilisateur.fonction) ? "Sans fonction" : r.Utilisateur.fonction)}"
                                + $"{(string.IsNullOrWhiteSpace(r.Utilisateur.email) ? "" : " : " + r.Utilisateur.email)}"
                                + $"{(string.IsNullOrWhiteSpace(r.Utilisateur.firstname) ? "" : " : " + r.Utilisateur.firstname)}"
                                + $"{(string.IsNullOrWhiteSpace(r.Utilisateur.lastname) ? "" : " " + r.Utilisateur.lastname)}"
                            : "",
                        MontantRequeteValide = (r.MontantValide ?? 0).ToString("N2"),
                        MontantJustif = r.Justificatifs?.Sum(j => j.Montant ?? 0).ToString("N2") ?? "0",
                        //     MontantReste = ((( (decimal?)r.MontantValide) ?? 0) - (r.Justificatifs?.Sum(j => j.Montant ?? 0) ?? 0))).ToString("N2"),
                        MontantReste = ((((decimal?)r.MontantValide) ?? 0) - (r.Justificatifs?.Sum(j => (decimal?)j.Montant ?? 0) ?? 0)).ToString("N2"),
                        DateFinExecution = r.DateFinExecution?.ToString("dd/MM/yyyy") ?? "",
                        DateFinEcheance = r.DateFinExecution?.AddDays(JourDelais).ToString("dd/MM/yyyy") ?? "",
                        Statut = GetStatutLibelleRequete(r.EtatValidation, r.cloture),
                        Retard = ((((decimal?)r.MontantValide ?? 0) - (r.Justificatifs?.Sum(j => (decimal?)j.Montant ?? 0) ?? 0)) > 0)
                                ? GetRetardString(r.DateFinExecution?.AddDays(JourDelais).ToDateTime(TimeOnly.MinValue), DateTime.Now)
                                : GetRetardString(r.DateFinExecution?.AddDays(JourDelais).ToDateTime(TimeOnly.MinValue), dernierJustifDate ?? DateTime.Now)
                    };

                }).ToList();
            }


            return result;
        }

        public async Task<List<Tdb15RequeteJustifDTO>> Tdb15RequeteJustificatif(FiltresDTO filtres)
        {
            var result = new List<Tdb15RequeteJustifDTO>();

            bool FiltreRequetes = false;
            bool FiltreJustificatifs = false;

            if (string.IsNullOrEmpty(filtres.etattrj))
            {
                FiltreRequetes = true;
                FiltreJustificatifs = true;
            }
            else
            {
                FiltreRequetes = filtres.etattrj.Equals("requetes", StringComparison.OrdinalIgnoreCase);
                FiltreJustificatifs = filtres.etattrj.Equals("justificatifs", StringComparison.OrdinalIgnoreCase);
            }

            // REQUETES
            if (FiltreRequetes)
            {
                IQueryable<Requete> requeteAll = _context.Requete;

                // projet
                if (filtres.idprojets?.Any() == true)
                    requeteAll = requeteAll.Where(x => filtres.idprojets.Contains(x.IdProjet));

                // site
                if (filtres.idsites?.Any() == true)
                    requeteAll = requeteAll.Where(x => filtres.idsites.Contains(x.IdSite));

                // AGMO
                if (filtres.idagmos?.Any() == true)
                    requeteAll = requeteAll.Where(r => r.Utilisateur != null && filtres.idagmos.Contains(r.Utilisateur.idAgmo));

                Requete? requete = null;
                // numero requete
                if (!string.IsNullOrEmpty(filtres.numero))
                {
                    requete = await requeteAll.FirstOrDefaultAsync(r => r.NumRequete == filtres.numero);
                }
                // ref interne requete
                else if (!string.IsNullOrEmpty(filtres.refinterne))
                {
                    requete = await requeteAll.FirstOrDefaultAsync(r => r.RequeteAccuses.Any(ra => ra.referenceInterne == filtres.refinterne));
                }

                if (requete == null)
                    return new List<Tdb15RequeteJustifDTO>();

                var requeteId = requete.IdRequete;

                var allHistos = await _context.HistoriqueValidationRequete.Where(h => h.idRequete == requeteId).ToListAsync();

                var firstFiltre = await (
                    from h in _context.HistoriqueValidationRequete
                    join ce in _context.CircuitEtape on h.idCircuitEtape equals ce.idCircuitEtape
                    where h.idRequete == requeteId && ce.deletiondate == null
                    orderby ce.numero
                    select new
                    {
                        ce.numero,
                        ce.description,
                        ce.duree,
                        h.idRequete,
                        h.isPassMarcheSkyp,
                        h.creationdate,
                        h.dateValidation,
                        h.idCircuitEtape
                        //Validateur = user != null ? $"{user.fonction ?? "Sans fonction"}" + $"{(string.IsNullOrWhiteSpace(user.email) ? "" : " : " + user.email)}" + $"{(string.IsNullOrWhiteSpace(user.firstname) ? "" : " : " + user.firstname)}" + $"{(string.IsNullOrWhiteSpace(user.lastname) ? "" : " " + user.lastname)}" : ""
                    }
                ).ToListAsync();

                firstFiltre = firstFiltre.DistinctBy(x => x.numero).OrderBy(x => x.numero).ToList();

                result = new List<Tdb15RequeteJustifDTO>();

                if (firstFiltre == null)
                    return result;

                double totalPrevu = 0;
                double totalReel = 0;
                double totalRetard = 0;
                double totalAvance = 0;

                var minNumero = firstFiltre.Min(x => x.numero);

                DateTime? prevDateValidation = null;

                var projet = _ProjetRepository.GetProjetById(requete.IdProjet);
                var site = _SiteRepository.GetSiteById(requete.IdSite);

                foreach (var item in firstFiltre)
                {
                    string DateValidationReel = "";

                    double dureePrevue = item.duree;

                    DateTime dateValidation = DateTime.Now;
                    double dureeReelle = 0;

                    double retard = 0;
                    double avance = 0;

                    var validateur = "";

                    totalPrevu += dureePrevue;

                    if (item.numero == minNumero)
                    {
                        DateTime DateCreationCircuit = item.creationdate;

                        if (item.dateValidation.HasValue)
                        {
                            dateValidation = item.dateValidation.Value;

                            var histo = allHistos.FirstOrDefault(h => h.idCircuitEtape == item.idCircuitEtape && h.numero == item.numero);

                            if (histo?.idValidateur != null)
                            {
                                var utilisateur = _UtilisateurRepository.GetUtilisateurById(histo.idValidateur.Value);
                                if (utilisateur != null)
                                {
                                    validateur =
                                        $"{utilisateur.fonction ?? "Sans fonction"}" +
                                        $"{(string.IsNullOrWhiteSpace(utilisateur.email) ? "" : " : " + utilisateur.email)}" +
                                        $"{(string.IsNullOrWhiteSpace(utilisateur.firstname) ? "" : " : " + utilisateur.firstname)}" +
                                        $"{(string.IsNullOrWhiteSpace(utilisateur.lastname) ? "" : " " + utilisateur.lastname)}";
                                }
                            }

                            dureeReelle = (dateValidation - DateCreationCircuit).TotalHours;

                            DateValidationReel = item.dateValidation.Value.ToString();
                        }
                        else
                        {
                            dureeReelle = (DateTime.Now - DateCreationCircuit).TotalHours;
                        }

                        if (dureeReelle > dureePrevue)
                            retard = dureeReelle - dureePrevue;
                        else
                            avance = dureePrevue - dureeReelle;

                        totalReel += dureeReelle;
                        totalRetard += retard;
                        totalAvance += avance;

                        prevDateValidation = item.dateValidation ?? DateTime.Now;
                    }
                    else
                    {
                        if (prevDateValidation.HasValue)
                        {
                            if (item.dateValidation.HasValue)
                            {
                                dateValidation = item.dateValidation.Value;

                                var histo = allHistos.FirstOrDefault(h => h.idCircuitEtape == item.idCircuitEtape && h.numero == item.numero);

                                if (histo?.isPassMarcheSkyp == true)
                                {
                                    dureeReelle = 0;
                                    retard = 0;
                                    avance = 0;
                                    validateur = "Sans passation de marché";
                                }
                                else
                                {
                                    dureeReelle = (dateValidation - prevDateValidation.Value).TotalHours;

                                    if (dureeReelle > dureePrevue)
                                        retard = dureeReelle - dureePrevue;
                                    else
                                        avance = dureePrevue - dureeReelle;

                                    if (histo?.idValidateur != null)
                                    {
                                        var utilisateur = _UtilisateurRepository.GetUtilisateurById(histo.idValidateur.Value);
                                        if (utilisateur != null)
                                        {
                                            validateur =
                                                $"{utilisateur.fonction ?? "Sans fonction"}" +
                                                $"{(string.IsNullOrWhiteSpace(utilisateur.email) ? "" : " : " + utilisateur.email)}" +
                                                $"{(string.IsNullOrWhiteSpace(utilisateur.firstname) ? "" : " : " + utilisateur.firstname)}" +
                                                $"{(string.IsNullOrWhiteSpace(utilisateur.lastname) ? "" : " " + utilisateur.lastname)}";
                                        }
                                    }
                                }

                                totalReel += dureeReelle;
                                totalRetard += retard;
                                totalAvance += avance;

                                prevDateValidation = dateValidation;

                                DateValidationReel = item.dateValidation.Value.ToString();
                            }
                            else
                            {
                                dateValidation = DateTime.Now;

                                dureeReelle = (dateValidation - prevDateValidation.Value).TotalHours;

                                if (dureeReelle > dureePrevue)
                                    retard = dureeReelle - dureePrevue;
                                else
                                    avance = dureePrevue - dureeReelle;

                                totalReel += dureeReelle;
                                totalRetard += retard;
                                totalAvance += avance;

                                prevDateValidation = DateTime.Now;
                            }
                        }
                        else
                        {
                            dureeReelle = 0;
                            retard = 0;
                            avance = 0;

                            var histo = allHistos.FirstOrDefault(h => h.idCircuitEtape == item.idCircuitEtape && h.numero == item.numero);
                            if (histo?.isPassMarcheSkyp == true)
                                validateur = "Sans passation de marché";
                        }
                    }

                    result.Add(new Tdb15RequeteJustifDTO
                    {
                        ProjetName = projet?.nom ?? "",
                        SiteName = site != null ? $"{site.code} - {site.nom}" : "",
                        NumeroEtape = item.numero.ToString(),
                        IntituleEtape = item.description,
                        Validateur = validateur,
                        DureePrevue = ConvertToHeureMinute(dureePrevue),
                        DureeReelle = ConvertToHeureMinute(dureeReelle),
                        Retard = ConvertToHeureMinute(retard),
                        Avance = ConvertToHeureMinute(avance),
                        DateValidation = DateValidationReel
                    });
                }

                var NumeroEtape = "Total";
                var TotalDureePrevue = totalPrevu;
                var TotalDureeReelle = totalReel;
                var TotalRetardAvance = totalPrevu - totalReel;

                var IntituleTotalRetardAvance = TotalRetardAvance < 0 ? "Retard" : "Avance";

                // Total
                result.Add(new Tdb15RequeteJustifDTO
                {
                    NumeroEtape = NumeroEtape,
                    TotalDureePrevue = ConvertToHeureMinute(TotalDureePrevue),
                    TotalDureeReelle = ConvertToHeureMinute(TotalDureeReelle),
                    TotalRetardAvance = ConvertToHeureMinute(Math.Abs(TotalRetardAvance)),
                    IntituleTotalRetardAvance = IntituleTotalRetardAvance
                });
            }

            // JUSTIFICATIFS
            if (FiltreJustificatifs)
            {
                IQueryable<Justificatif> justifQuery = _context.Justificatif.Include(j => j.Requete);

                // projet
                if (filtres.idprojets?.Any() == true)
                    justifQuery = justifQuery.Where(j => j.Requete != null && filtres.idprojets.Contains(j.Requete.IdProjet));

                // site
                if (filtres.idsites?.Any() == true)
                    justifQuery = justifQuery.Where(j => j.Requete != null && filtres.idsites.Contains(j.Requete.IdSite));

                // AGMO
                if (filtres.idagmos?.Any() == true)
                    justifQuery = justifQuery.Where(j => j.Requete.Utilisateur != null && filtres.idagmos.Contains(j.Requete.Utilisateur.idAgmo));

                Justificatif? justif = null;
                // numero justif
                if (!string.IsNullOrEmpty(filtres.numero))
                {
                    justif = await justifQuery.FirstOrDefaultAsync(r => r.Numero == filtres.numero);
                }
                // ref interne justif
                else if (!string.IsNullOrEmpty(filtres.refinterne))
                {
                    justif = await justifQuery.FirstOrDefaultAsync(r => r.JustificatifAccuses.Any(ra => ra.referenceInterne == filtres.refinterne));
                }

                if (justif == null)
                    return new List<Tdb15RequeteJustifDTO>();

                var justifId = justif.IdJustif;

                var allHistos = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == justifId).ToListAsync();

                var firstFiltre = await (
                    from h in _context.HistoriqueValidationJustificatif
                    join ce in _context.CircuitEtape on h.idCircuitEtape equals ce.idCircuitEtape
                    where h.idJustif == justifId && ce.deletiondate == null
                    orderby ce.numero
                    select new
                    {
                        ce.numero,
                        ce.description,
                        ce.duree,
                        h.idJustif,
                        h.isPassMarcheSkyp,
                        h.creationdate,
                        h.dateValidation,
                        h.idCircuitEtape
                        //Validateur = user != null ? $"{user.fonction ?? "Sans fonction"}" + $"{(string.IsNullOrWhiteSpace(user.email) ? "" : " : " + user.email)}" + $"{(string.IsNullOrWhiteSpace(user.firstname) ? "" : " : " + user.firstname)}" + $"{(string.IsNullOrWhiteSpace(user.lastname) ? "" : " " + user.lastname)}" : ""
                    }
                ).ToListAsync();

                firstFiltre = firstFiltre.DistinctBy(x => x.numero).OrderBy(x => x.numero).ToList();

                result = new List<Tdb15RequeteJustifDTO>();

                if (firstFiltre == null)
                    return result;

                double totalPrevu = 0;
                double totalReel = 0;
                double totalRetard = 0;
                double totalAvance = 0;

                var minNumero = firstFiltre.Min(x => x.numero);

                DateTime? prevDateValidation = null;

                // Get requête
                var requete = await _context.Requete.FirstOrDefaultAsync(r => r.IdRequete == justif.IdRequete);

                var projet = _ProjetRepository.GetProjetById(requete.IdProjet);
                var site = _SiteRepository.GetSiteById(requete.IdSite);

                foreach (var item in firstFiltre)
                {
                    string DateValidationReel = "";

                    double dureePrevue = item.duree;

                    DateTime dateValidation = DateTime.Now;
                    double dureeReelle = 0;

                    double retard = 0;
                    double avance = 0;

                    var validateur = "";

                    totalPrevu += dureePrevue;

                    if (item.numero == minNumero)
                    {
                        DateTime DateCreationCircuit = item.creationdate;

                        if (item.dateValidation.HasValue)
                        {
                            dateValidation = item.dateValidation.Value;

                            var histo = allHistos.FirstOrDefault(h => h.idCircuitEtape == item.idCircuitEtape && h.numero == item.numero);

                            if (histo?.idValidateur != null)
                            {
                                var utilisateur = _UtilisateurRepository.GetUtilisateurById(histo.idValidateur.Value);
                                if (utilisateur != null)
                                {
                                    validateur =
                                        $"{utilisateur.fonction ?? "Sans fonction"}" +
                                        $"{(string.IsNullOrWhiteSpace(utilisateur.email) ? "" : " : " + utilisateur.email)}" +
                                        $"{(string.IsNullOrWhiteSpace(utilisateur.firstname) ? "" : " : " + utilisateur.firstname)}" +
                                        $"{(string.IsNullOrWhiteSpace(utilisateur.lastname) ? "" : " " + utilisateur.lastname)}";
                                }
                            }

                            dureeReelle = (dateValidation - DateCreationCircuit).TotalHours;

                            DateValidationReel = item.dateValidation.Value.ToString();
                        }
                        else
                        {
                            dureeReelle = (DateTime.Now - DateCreationCircuit).TotalHours;
                        }

                        if (dureeReelle > dureePrevue)
                            retard = dureeReelle - dureePrevue;
                        else
                            avance = dureePrevue - dureeReelle;

                        totalReel += dureeReelle;
                        totalRetard += retard;
                        totalAvance += avance;

                        prevDateValidation = item.dateValidation ?? DateTime.Now;
                    }
                    else
                    {
                        if (prevDateValidation.HasValue)
                        {
                            if (item.dateValidation.HasValue)
                            {
                                dateValidation = item.dateValidation.Value;

                                var histo = allHistos.FirstOrDefault(h => h.idCircuitEtape == item.idCircuitEtape && h.numero == item.numero);

                                if (histo?.isPassMarcheSkyp == true)
                                {
                                    dureeReelle = 0;
                                    retard = 0;
                                    avance = 0;
                                    validateur = "Sans passation de marché";
                                }
                                else
                                {
                                    dureeReelle = (dateValidation - prevDateValidation.Value).TotalHours;

                                    if (dureeReelle > dureePrevue)
                                        retard = dureeReelle - dureePrevue;
                                    else
                                        avance = dureePrevue - dureeReelle;

                                    if (histo?.idValidateur != null)
                                    {
                                        var utilisateur = _UtilisateurRepository.GetUtilisateurById(histo.idValidateur.Value);
                                        if (utilisateur != null)
                                        {
                                            validateur =
                                                $"{utilisateur.fonction ?? "Sans fonction"}" +
                                                $"{(string.IsNullOrWhiteSpace(utilisateur.email) ? "" : " : " + utilisateur.email)}" +
                                                $"{(string.IsNullOrWhiteSpace(utilisateur.firstname) ? "" : " : " + utilisateur.firstname)}" +
                                                $"{(string.IsNullOrWhiteSpace(utilisateur.lastname) ? "" : " " + utilisateur.lastname)}";
                                        }
                                    }
                                }

                                totalReel += dureeReelle;
                                totalRetard += retard;
                                totalAvance += avance;

                                prevDateValidation = dateValidation;

                                DateValidationReel = item.dateValidation.Value.ToString();
                            }
                            else
                            {
                                dateValidation = DateTime.Now;

                                dureeReelle = (dateValidation - prevDateValidation.Value).TotalHours;

                                if (dureeReelle > dureePrevue)
                                    retard = dureeReelle - dureePrevue;
                                else
                                    avance = dureePrevue - dureeReelle;

                                totalReel += dureeReelle;
                                totalRetard += retard;
                                totalAvance += avance;

                                prevDateValidation = DateTime.Now;
                            }
                        }
                        else
                        {
                            dureeReelle = 0;
                            retard = 0;
                            avance = 0;

                            var histo = allHistos.FirstOrDefault(h => h.idCircuitEtape == item.idCircuitEtape && h.numero == item.numero);
                            if (histo?.isPassMarcheSkyp == true)
                                validateur = "Sans passation de marché";
                        }
                    }

                    result.Add(new Tdb15RequeteJustifDTO
                    {
                        ProjetName = projet?.nom ?? "",
                        SiteName = site != null ? $"{site.code} - {site.nom}" : "",
                        NumeroEtape = item.numero.ToString(),
                        IntituleEtape = item.description,
                        Validateur = validateur,
                        DureePrevue = ConvertToHeureMinute(dureePrevue),
                        DureeReelle = ConvertToHeureMinute(dureeReelle),
                        Retard = ConvertToHeureMinute(retard),
                        Avance = ConvertToHeureMinute(avance),
                        DateValidation = DateValidationReel
                    });
                }

                var NumeroEtape = "Total";
                var TotalDureePrevue = totalPrevu;
                var TotalDureeReelle = totalReel;
                var TotalRetardAvance = totalPrevu - totalReel;

                var IntituleTotalRetardAvance = TotalRetardAvance < 0 ? "Retard" : "Avance";

                // Total
                result.Add(new Tdb15RequeteJustifDTO
                {
                    NumeroEtape = NumeroEtape,
                    TotalDureePrevue = ConvertToHeureMinute(TotalDureePrevue),
                    TotalDureeReelle = ConvertToHeureMinute(TotalDureeReelle),
                    TotalRetardAvance = ConvertToHeureMinute(Math.Abs(TotalRetardAvance)),
                    IntituleTotalRetardAvance = IntituleTotalRetardAvance
                });
            }

            return result;
        }


        public async Task<List<Tdb16RequeteJustifDTO>> Tdb16RequeteJustificatif(FiltresDTO filtres)
        {
            var result = new List<Tdb16RequeteJustifDTO>();

            bool FiltreRequetes = filtres.etattrj.Equals("requetes", StringComparison.OrdinalIgnoreCase);
            bool FiltreJustificatifs = filtres.etattrj.Equals("justificatifs", StringComparison.OrdinalIgnoreCase);

            //Circuit
            var circuitEtapes = await _context.CircuitEtape.Where(ce => ce.deletiondate == null && ce.Circuit.idCircuit == filtres.circuit).OrderBy(ce => ce.numero).ToListAsync();

            if (!circuitEtapes.Any())
                return result;

            //Total globale
            int totalGlobalRetard = 0;

            //Projet
            var idProjet = filtres.idprojets.FirstOrDefault();
            var projets = _context.Projet.FirstOrDefault(p => p.idProjet == idProjet && p.deletionDate == null)?.nom;


            foreach (var etape in circuitEtapes)
            {
                int nbRetards = 0;

                var validateursIds = await (
                    from u in _context.CircuitEtapeValidateur
                    where u.idCircuitEtape == etape.idCircuitEtape && u.deletiondate == null && u.numero == etape.numero
                    select u.idValidateur
                ).Distinct().ToListAsync();

                var validateursStringList = new List<string>();

                foreach (var idVal in validateursIds)
                {
                    var utilisateur = _UtilisateurRepository.GetUtilisateurById(idVal);
                    if (utilisateur != null)
                    {
                        string validateur =
                            $"{(utilisateur.fonction ?? "Sans fonction")}" +
                            $"{(string.IsNullOrWhiteSpace(utilisateur.email) ? "" : " : " + utilisateur.email)}" +
                            $"{(string.IsNullOrWhiteSpace(utilisateur.firstname) ? "" : " : " + utilisateur.firstname)}" +
                            $"{(string.IsNullOrWhiteSpace(utilisateur.lastname) ? "" : " " + utilisateur.lastname)}";

                        validateursStringList.Add(validateur);
                    }
                }

                int retard = 0;
                if (FiltreRequetes)
                {
                    IQueryable<Requete> requeteAll = _context.Requete;

                    // projet
                    if (filtres.idprojets?.Any() == true)
                        requeteAll = requeteAll.Where(x => filtres.idprojets.Contains(x.IdProjet));

                    // date du et au
                    if (filtres.datedu.HasValue && filtres.dateau.HasValue)
                        requeteAll = requeteAll.Where(r => r.creationdate >= filtres.datedu.Value && r.creationdate <= filtres.dateau.Value);

                    if (!requeteAll.Any())
                        return result;

                    //Historique par étape
                    var requeteIds = requeteAll.Select(r => r.IdRequete).ToList();

                    var data = await (
                        from h in _context.HistoriqueValidationRequete
                        join r in _context.Requete on h.idRequete equals r.IdRequete
                        where h.idCircuitEtape == etape.idCircuitEtape
                              && requeteIds.Contains(h.idRequete)
                        group new { h, r } by h.idRequete into g
                        select new
                        {
                            IdRequete = g.Key,
                            CreationDate = g.Max(x => x.h.creationdate),
                            LastValidation = g.Max(x => x.h.dateValidation)
                        }
                    ).ToListAsync();

                    //Traitement en mémoire
                    nbRetards = data.Count(d =>
                    {
                        var prevValidation = _context.HistoriqueValidationRequete
                            .Where(prev => prev.idRequete == d.IdRequete
                                           && prev.numero == (etape.numero - 1)
                                           && prev.dateValidation != null)
                            .OrderByDescending(prev => prev.dateValidation)
                            .Select(prev => prev.dateValidation)
                            .FirstOrDefault();

                        var refDate = (etape.numero == 1 ? d.CreationDate : prevValidation);
                        if (refDate == null) return false;

                        var lastValidation = d.LastValidation;
                        var temps = lastValidation == null
                            ? (int)(DateTime.Now - refDate.Value).TotalHours
                            : (int)(lastValidation.Value - refDate.Value).TotalHours;

                        return temps > etape.duree;
                    });
                }
                else if (FiltreJustificatifs)
                {
                    IQueryable<Justificatif> justifAll = _context.Justificatif;

                    // projet
                    if (filtres.idprojets?.Any() == true)
                        justifAll = justifAll.Where(j => j.Requete != null && filtres.idprojets.Contains(j.Requete.IdProjet));

                    // date du et au
                    if (filtres.datedu.HasValue && filtres.dateau.HasValue)
                        justifAll = justifAll.Where(r => r.CreationDate >= filtres.datedu.Value && r.CreationDate <= filtres.dateau.Value);

                    if (!justifAll.Any())
                        return result;

                    //Historique par étape
                    var justifIds = justifAll.Select(r => r.IdJustif).ToList();

                    var data = await (
                        from h in _context.HistoriqueValidationJustificatif
                        join r in _context.Justificatif on h.idJustif equals r.IdJustif
                        where h.idCircuitEtape == etape.idCircuitEtape
                              && justifIds.Contains(h.idJustif)
                        group new { h, r } by h.idJustif into g
                        select new
                        {
                            IdJustif = g.Key,
                            CreationDate = g.Max(x => x.h.creationdate),
                            LastValidation = g.Max(x => x.h.dateValidation)
                        }
                    ).ToListAsync();

                    //Traitement en mémoire
                    nbRetards = data.Count(d =>
                    {
                        var prevValidation = _context.HistoriqueValidationJustificatif
                            .Where(prev => prev.idJustif == d.IdJustif
                                           && prev.numero == (etape.numero - 1)
                                           && prev.dateValidation != null)
                            .OrderByDescending(prev => prev.dateValidation)
                            .Select(prev => prev.dateValidation)
                            .FirstOrDefault();

                        var refDate = (etape.numero == 1 ? d.CreationDate : prevValidation);
                        if (refDate == null) return false;

                        var lastValidation = d.LastValidation;
                        var temps = lastValidation == null
                            ? (int)(DateTime.Now - refDate.Value).TotalHours
                            : (int)(lastValidation.Value - refDate.Value).TotalHours;

                        return temps > etape.duree;
                    });
                }

                totalGlobalRetard += nbRetards;

                result.Add(new Tdb16RequeteJustifDTO
                {
                    ProjetName = projets,
                    NumeroEtape = etape.numero.ToString(),
                    IntituleEtape = etape.description,
                    Validateur = validateursStringList,
                    DureePrevue = etape.duree.ToString(),
                    Retard = nbRetards,
                    RetardTotal = retard
                });
            }

            // Ligne TOTAL
            result.Add(new Tdb16RequeteJustifDTO
            {
                IntituleEtape = "Total",
                RetardTotal = totalGlobalRetard
            });

            return result;
        }

    }
}