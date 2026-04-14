using Microsoft.AspNetCore.Components.Server.Circuits;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using UCP_API.data;
using UCP_API.dto;
using UCP_API.models;
using Circuit = UCP_API.models.Circuit;

namespace UCP_API.repositories
{
    public class CircuitRepository
    {
        private readonly AppDbContext _context;
        public CircuitRepository(AppDbContext context)
        {
            _context = context;
        }

        // Get all Circuit
        public async Task<List<CircuitProjetsSites>> GetCircuits()
        {
            //var circuits = await _context.Circuit.Where(a => a.deletiondate == null).Include(a => a.CircuitProjets).Include(a => a.CircuitSites).ToListAsync();
            var circuits = await _context.Circuit.Where(a => a.deletiondate == null).Include(a => a.CircuitProjets).ThenInclude(cp => cp.Projet).Include(a => a.CircuitSites).ThenInclude(cs => cs.Site).ToListAsync();
            Console.WriteLine("data=" + circuits.Count);
            var resultCircuits = new List<CircuitProjetsSites>();

            foreach (var circuit in circuits)
            {
                var projets = circuit.CircuitProjets
                                     .Select(cp => new ProjetDTO { id = cp.idProjet, nom = cp.Projet.nom })
                                     .ToList();

                var sites = circuit.CircuitSites
                                   .Select(cs => new SiteDTO { id = cs.idSite, code = cs.Site.code, nom = cs.Site.nom })
                                   .ToList();

                var etapes = await _context.CircuitEtape
                                            .Where(ce => ce.idCircuit == circuit.idCircuit && ce.deletiondate == null)
                                            .Include(a => a.CircuitEtapeCheckLists)
                                            .Include(a => a.CircuitEtapeValidateurs)
                                            .OrderBy(ce => ce.numero)
                                            .ToListAsync();

                string etapesString = string.Join(",", etapes.Select(ce => $"Etape {ce.numero} : {ce.description} : {ce.duree} heures"));

                int dureeTotale = etapes.Sum(ce => ce.duree);

                resultCircuits.Add(new CircuitProjetsSites
                {
                    Circuit = circuit,
                    Projets = projets,
                    Sites = sites,
                    Etapes = etapesString,
                    DureeTotale = dureeTotale.ToString() + " heures"
                });
            }

            return resultCircuits;
        }

        public void SoftDeletedCircuitData(int idCircuit)//idvalidateur
        {
            _context.Database.ExecuteSqlRaw("update circuitetape set deletiondate = @p0 where idcircuit = @p1",DateTime.Now,idCircuit);
            _context.Database.ExecuteSqlRaw("update circuitetapevalidateur set deletiondate = @p0 where idcircuitetape IN (select idcircuitetape from circuitetape where idcircuit = @p1)", DateTime.Now, idCircuit);
            _context.Database.ExecuteSqlRaw("update circuitetapechecklist set deletiondate = @p0 where idcircuitetape IN (select idcircuitetape from circuitetape where idcircuit = @p1)", DateTime.Now, idCircuit);
        }

        public async Task<Circuit?> ReAddCircuitData(CreateCircuitDTO Circuit, int currentUserId)
        {
         

            var circuit = new Circuit
            {
                intitule = Circuit.Libelle,
                creationdate = DateTime.Now,
                createdby = currentUserId,
                CircuitProjets = Circuit.Projets.Select(p => new CircuitProjet { idProjet = p }).ToList(),
                CircuitSites = Circuit.Sites.Select(s => new CircuitSite { idSite = s }).ToList(),
                isdisabled = false
            };

            _context.Circuit.Add(circuit);
            await _context.SaveChangesAsync();

            var etapes = new List<CircuitEtape>();

            foreach (var etapeDto in Circuit.Etapes)
            {
                var etape = new CircuitEtape
                {
                    idCircuit = circuit.idCircuit,
                    numero = etapeDto.Numero,
                    description = etapeDto.Description,
                    duree = etapeDto.Duree,
                    isPassMarche = etapeDto.isPassMarche,
                    creationdate = DateTime.Now,
                    createdby = currentUserId,
                    isModifiable = etapeDto.isModifiable,
                    isRefusable = etapeDto.isRefusable,
                    checkBudget = etapeDto.checkBudget
                };

                etapes.Add(etape);
            }

            _context.CircuitEtape.AddRange(etapes);
            await _context.SaveChangesAsync();

            var validateurs = new List<CircuitEtapeValidateur>();
            var checklists = new List<CircuitEtapeCheckList>();

            for (int i = 0; i < Circuit.Etapes.Count; i++)
            {
                var etapeDto = Circuit.Etapes[i];
                var etape = etapes[i];

                validateurs.AddRange(etapeDto.Validateurs.Select(id => new CircuitEtapeValidateur
                {
                    idCircuitEtape = etape.idCircuitEtape,
                    numero = etape.numero,
                    idValidateur = id,
                    creationdate = DateTime.Now,
                    createdby = currentUserId,
                    //isPassMarche = etape.isPassMarche
                }));

                checklists.AddRange((etapeDto.CheckList ?? new List<CheckListItemDTO>()).Select(c => new CircuitEtapeCheckList
                {
                    idCircuitEtape = etape.idCircuitEtape,
                    code = c.Code,
                    libelle = c.Libelle,
                    creationdate = DateTime.Now,
                    createdby = currentUserId
                }));
            }

            _context.CircuitEtapeValidateur.AddRange(validateurs);
            _context.CircuitEtapeCheckList.AddRange(checklists);

            await _context.SaveChangesAsync();

            return circuit;
        }



        //public async Task<List<CircuitProjetsSites>> GetCircuits()
        //{
        //    return await _context.Circuit.Where(a => a.deletionDate == null).Include(a => a.CircuitProjets).Include(a => a.CircuitSites).Select(a => new CircuitProjetsSites
        //    {
        //        Circuit = a,
        //        Projets = a.CircuitProjets.Select(up => up.IdProjet).ToList(),
        //        Sites = a.CircuitSites.Select(us => us.IdSite).ToList()
        //    }).ToListAsync();
        //}

        // Get all Circuit même projet et site qu'utilisateur connecté
        public async Task<List<CircuitProjetsSites>> GetCircuitsByCurrentUserProjetSite(int currentUserId)
        {
            var userProjetIds = await _context.UtilisateurProjet
                                            .Where(up => up.IdUtilisateur == currentUserId)
                                            .Select(up => up.IdProjet)
                                            .ToListAsync();

            Console.WriteLine("debut");
            for (int i = 0; i < userProjetIds.Count(); i++)
            {
                Console.WriteLine(userProjetIds[i]);
            }
            Console.WriteLine("stop");

            /*var userSiteIds = await _context.UtilisateurSite
                                            .Where(us => us.IdUtilisateur == currentUserId)
                                            .Select(us => us.IdSite)
                                            .ToListAsync();*/

            //var circuits = await _context.Circuit
            //                    .Where(c =>
            //                        c.deletiondate == null &&
            //                        c.CircuitProjets.Any(cp => userProjetIds.Contains(cp.idProjet)) &&
            //                        c.CircuitSites.Any(cs => userSiteIds.Contains(cs.idSite))
            //                    )
            //                    .ToListAsync();

            var circuits = await _context.Circuit.Where(c => c.deletiondate == null && c.isdisabled == false && c.CircuitProjets.Any(cp => userProjetIds.Contains(cp.idProjet)) /*&& c.CircuitSites.Any(cs => userSiteIds.Contains(cs.idSite))*/)
                                                .Include(c => c.CircuitProjets).ThenInclude(cp => cp.Projet)
                                                //.Include(c => c.CircuitSites).ThenInclude(cs => cs.Site)
                                                .ToListAsync();
            Console.WriteLine("debutC");
            for (int i = 0; i < circuits.Count(); i++)
            {
                Console.WriteLine(circuits[i].idCircuit);
            }
            Console.WriteLine("stopC");
            var resultCircuits = new List<CircuitProjetsSites>();

            foreach (var circuit in circuits)
            {
                var projets = await _context.CircuitProjet
                                        .Where(cp => cp.idCircuit == circuit.idCircuit)
                                        .Select(cp => new ProjetDTO { id = cp.idProjet, nom = cp.Projet.nom })
                                        .ToListAsync();

                var sites = await _context.CircuitSite
                                        .Where(cs => cs.idCircuit == circuit.idCircuit)
                                        .Select(cs => new SiteDTO { id = cs.idSite, code = cs.Site.code, nom = cs.Site.nom })
                                        .ToListAsync();

                var etapes = await _context.CircuitEtape
                                        .Where(ce => ce.idCircuit == circuit.idCircuit && ce.deletiondate == null)
                                        .Include(a => a.CircuitEtapeCheckLists)
                                        .Include(a => a.CircuitEtapeValidateurs)
                                        .OrderBy(ce => ce.numero)
                                        .ToListAsync();

                string etapesString = string.Join(",", etapes.Select(ce => $"Etape {ce.numero} : {ce.description} : {ce.duree} heures"));

                int dureeTotale = etapes.Sum(ce => ce.duree);

                resultCircuits.Add(new CircuitProjetsSites
                {
                    Circuit = circuit,
                    Projets = projets,
                    Sites = sites,
                    Etapes = etapesString,
                    DureeTotale = dureeTotale.ToString() + " heures"
                });
            }

            return resultCircuits;
        }

        // Get Circuit by Id
        public async Task<CircuitDetailsDTO?> GetCircuitById(int idCircuit)
        {
            var circuit = await _context.Circuit
                                    .Where(a => a.idCircuit == idCircuit && a.deletiondate == null)
                                    .Include(a => a.CircuitProjets)
                                    .Include(a => a.CircuitSites)
                                    .FirstOrDefaultAsync();

            if (circuit == null)
                return null;

            var projets = circuit.CircuitProjets.Select(cp => cp.idProjet).ToList() ?? new List<int>();
            var sites = circuit.CircuitSites.Select(cs => cs.idSite).ToList() ?? new List<int>();

            var etapes = await _context.CircuitEtape
                                    .Where(ce => ce.idCircuit == circuit.idCircuit && ce.deletiondate == null)
                                    .OrderBy(ce => ce.numero)
                                    .ToListAsync();

            var etapeIds = etapes.Select(e => e.idCircuitEtape).ToList();

            var validateurs = await _context.CircuitEtapeValidateur
                                        .Where(v => etapeIds.Contains(v.idCircuitEtape) && v.deletiondate == null)
                                        .ToListAsync();

            var checklists = await _context.CircuitEtapeCheckList
                                        .Where(v => etapeIds.Contains(v.idCircuitEtape) && v.deletiondate == null)
                                        .ToListAsync();

            var etapesDto = etapes.Select(e => new CircuitEtapeDTO
            {
                Id = e.idCircuitEtape,
                Numero = e.numero,
                Description = e.description,
                Duree = e.duree,
                Validateurs = validateurs
                    .Where(v => v.idCircuitEtape == e.idCircuitEtape)
                    .Select(v => v.idValidateur)
                    .ToList(),
                CheckList = checklists
                    .Where(v => v.idCircuitEtape == e.idCircuitEtape)
                    .Select(v => v.idCircuitEtapeCheckList)
                    .ToList(),
                isModifiable = e.isModifiable,
                isPassMarche = e.isPassMarche,
                isRefusable = e.isRefusable,
                checkBudget = e.checkBudget

            }).ToList();

            int dureeTotale = etapes.Sum(e => e.duree);

            //var isCircuitUsed = await _context.circuitRequete.AnyAsync(a => a.idCircuit == idCircuit);
            var isCircuitUsed = false;
            return new CircuitDetailsDTO
            {
                Circuit = circuit,
                Projets = projets,
                Sites = sites,
                Etapes = etapesDto,
                DureeTotale = $"{dureeTotale} heures",
                isUsed = isCircuitUsed
            };
        }

        public async Task<CircuitDetailsDTOV2?> GetCircuitByIdV2(int idCircuit)
        {
            var circuit = await _context.Circuit
                                    .Where(a => a.idCircuit == idCircuit && a.deletiondate == null)
                                    .Include(a => a.CircuitProjets)
                                    .Include(a => a.CircuitSites)
                                    .FirstOrDefaultAsync();

            if (circuit == null)
                return null;

            var projets = circuit.CircuitProjets.Select(cp => cp.idProjet).ToList() ?? new List<int>();
            var sites = circuit.CircuitSites.Select(cs => cs.idSite).ToList() ?? new List<int>();

            var etapes = await _context.CircuitEtape
                                    .Where(ce => ce.idCircuit == circuit.idCircuit && ce.deletiondate == null)
                                    .OrderBy(ce => ce.numero)
                                    .ToListAsync();

            var etapeIds = etapes.Select(e => e.idCircuitEtape).ToList();

            var validateurs = await _context.CircuitEtapeValidateur
                                        .Where(v => etapeIds.Contains(v.idCircuitEtape) && v.deletiondate == null)
                                        .ToListAsync();

            var checklists = await _context.CircuitEtapeCheckList
                                        .Where(v => etapeIds.Contains(v.idCircuitEtape) && v.deletiondate == null)
                                        .ToListAsync();

        

            var etapesDto = etapes.Select(e => new CircuitEtapeDTOV2
            {
                Id = e.idCircuitEtape,
                Numero = e.numero,
                Description = e.description,
                Duree = e.duree,
                Validateurs = validateurs
                    .Where(v => v.idCircuitEtape == e.idCircuitEtape)
                    .Select(v => v.idValidateur)
                    .ToList(),
                CheckList = checklists
    .Where(v => v.idCircuitEtape == e.idCircuitEtape)
    .Select(v => new CheckListItemDTO
    {
        Code = v.code,
        Libelle = v.libelle
        // map needed properties
    })
    .ToList(),
                isModifiable = e.isModifiable,
                isPassMarche = e.isPassMarche,
                isRefusable = e.isRefusable,
                checkBudget = e.checkBudget

            }).ToList();

            int dureeTotale = etapes.Sum(e => e.duree);

            //var isCircuitUsed = await _context.circuitRequete.AnyAsync(a => a.idCircuit == idCircuit);
            var isCircuitUsed = false;
            return new CircuitDetailsDTOV2
            {
                Circuit = circuit,
                Projets = projets,
                Sites = sites,
                Etapes = etapesDto,
                DureeTotale = $"{dureeTotale} heures",
                isUsed = isCircuitUsed
            };
        }

        // Delete a Circuit
        public async Task<(bool Success, string? ErrorMessage)> DeleteCircuit(int idCircuit, int currentUserId)
        {
            //var isCircuitUsed = await _context.CircuitRequete.AnyAsync(a => a.idCircuit == idCircuit);
            var isCircuitUsed = false; 
            if (isCircuitUsed)
            {
                return (false, "Le circuit est en cours d'utilisation!"); //On ne peut pas supprimer le circuit car en cours d'utilisation
            }

            var Circuit = await _context.Circuit.FirstOrDefaultAsync(a => a.idCircuit == idCircuit && a.deletiondate == null);
            if (Circuit == null)
                return (false, "Circuit non trouvé!");

            var nowdel = DateTime.Now;

            Circuit.deletiondate = nowdel;
            Circuit.deletedby = currentUserId;

            //circuit - projets
            var circuitProjets = _context.CircuitProjet.Where(a => a.idCircuit == idCircuit);
            _context.CircuitProjet.RemoveRange(circuitProjets);

            //circuit - sites
            var circuitSites = _context.CircuitSite.Where(a => a.idCircuit == idCircuit);
            _context.CircuitSite.RemoveRange(circuitSites);

            //CircuitEtape
            var etapes = await _context.CircuitEtape
                                    .Where(e => e.idCircuit == idCircuit && e.deletiondate == null)
                                    .ToListAsync();

            foreach (var etape in etapes)
            {
                etape.deletiondate = nowdel;
                etape.deletedby = currentUserId;
            }

            //Validateur et CheckList
            var etapeIds = etapes.Select(e => e.idCircuitEtape).ToList();

            var validateurs = await _context.CircuitEtapeValidateur
                                        .Where(v => etapeIds.Contains(v.idCircuitEtape) && v.deletiondate == null)
                                        .ToListAsync();

            var checklists = await _context.CircuitEtapeCheckList
                                        .Where(v => etapeIds.Contains(v.idCircuitEtape) && v.deletiondate == null)
                                        .ToListAsync();

            foreach (var validateur in validateurs)
            {
                validateur.deletiondate = nowdel;
                validateur.deletedby = currentUserId;
            }

            foreach (var checklist in checklists)
            {
                checklist.deletiondate = nowdel;
                checklist.deletedby = currentUserId;
            }

            await _context.SaveChangesAsync();
            return (true, null);
        }
        
        public class DisableCircuitResult
        {
            public bool Success { get; set; }
            public bool IsDisabled { get; set; }
            public string? ErrorMessage { get; set; }
        }

        // Disable circuit
        public async Task<DisableCircuitResult> DisableCircuit(int idCircuit)
        {
            var Circuit = await _context.Circuit.FirstOrDefaultAsync(a => a.idCircuit == idCircuit && a.deletiondate == null);
            if (Circuit == null)
            {
                return new DisableCircuitResult
                {
                    Success = false,
                    ErrorMessage = "Circuit non trouvé!"
                };
            }

            Circuit.isdisabled = !Circuit.isdisabled;
            await _context.SaveChangesAsync();

            return new DisableCircuitResult
            {
                Success = true,
                IsDisabled = Circuit.isdisabled ?? false
            };
        }

        // Add a new Circuit
        public async Task<Circuit?> AddCircuit(CreateCircuitDTO Circuit, int currentUserId)
        {
            bool exists = await _context.Circuit
                                     .AnyAsync(c => c.intitule.ToLower() == Circuit.Libelle.ToLower() && c.deletiondate == null);

            if (exists)
                return null;

            var circuit = new Circuit
            {
                intitule = Circuit.Libelle,
                creationdate = DateTime.Now,
                createdby = currentUserId,
                CircuitProjets = Circuit.Projets.Select(p => new CircuitProjet { idProjet = p }).ToList(),
                CircuitSites = Circuit.Sites.Select(s => new CircuitSite { idSite = s }).ToList(),
                isdisabled = false
            };

            _context.Circuit.Add(circuit);
            await _context.SaveChangesAsync();

            var etapes = new List<CircuitEtape>();

            foreach (var etapeDto in Circuit.Etapes)
            {
                var etape = new CircuitEtape
                {
                    idCircuit = circuit.idCircuit,
                    numero = etapeDto.Numero,
                    description = etapeDto.Description,
                    duree = etapeDto.Duree,
                    isPassMarche = etapeDto.isPassMarche,
                    creationdate = DateTime.Now,
                    createdby = currentUserId,
                    isModifiable = etapeDto.isModifiable,
                    isRefusable = etapeDto.isRefusable,
                    checkBudget = etapeDto.checkBudget
                };

                etapes.Add(etape);
            }

            _context.CircuitEtape.AddRange(etapes);
            await _context.SaveChangesAsync();

            var validateurs = new List<CircuitEtapeValidateur>();
            var checklists = new List<CircuitEtapeCheckList>();

            for (int i = 0; i < Circuit.Etapes.Count; i++)
            {
                var etapeDto = Circuit.Etapes[i];
                var etape = etapes[i];

                validateurs.AddRange(etapeDto.Validateurs.Select(id => new CircuitEtapeValidateur
                {
                    idCircuitEtape = etape.idCircuitEtape,
                    numero = etape.numero,
                    idValidateur = id,
                    creationdate = DateTime.Now,
                    createdby = currentUserId,
                    //isPassMarche = etape.isPassMarche
                }));

                checklists.AddRange((etapeDto.CheckList ?? new List<CheckListItemDTO>()).Select(c => new CircuitEtapeCheckList
                {
                    idCircuitEtape = etape.idCircuitEtape,
                    code = c.Code,
                    libelle = c.Libelle,
                    creationdate = DateTime.Now,
                    createdby = currentUserId
                }));
            }

            _context.CircuitEtapeValidateur.AddRange(validateurs);
            _context.CircuitEtapeCheckList.AddRange(checklists);

            await _context.SaveChangesAsync();

            return circuit;
        }

        public enum UpdateCircuitResult
        {
            NotFound,
            DuplicateLibelle,
            Updated,
            UpdatedValiCheck
        }

        //update historiquevalidationrequete pour update de circuit
        public void addValidateurToHistoriqueValidation(int idCircuitEtape,List<CircuitEtapeValidateur> newValidateurs)
        {
            Console.WriteLine(newValidateurs.Count());
            for(int i= 0; i < newValidateurs.Count(); i++)
            {
                Console.WriteLine("ADDED");
                _context.Database.ExecuteSqlRaw("WITH cte AS (\r\n    SELECT *,\r\n           ROW_NUMBER() OVER (\r\n               PARTITION BY idrequete,idcircuitetape\r\n               ORDER BY creationdate ASC\r\n           ) AS rn\r\n    FROM historiqueValidationRequete \r\n    where idCircuitEtape = "+idCircuitEtape+"\r\n)\r\nINSERT INTO historiqueValidationRequete(\r\nidrequete, \r\nidcircuitetape, \r\netatvalidation,\r\ncommentaire,\r\ndatevalidation,\r\nidvalidateur,\r\nisPotential,\r\nisValidator,\r\ncreationdate,\r\ncreatedby,\r\nisPassMarche,\r\nnumero,\r\nisPassMarcheSkyp\r\n)\r\nSELECT\r\nidrequete, \r\nidcircuitetape, \r\netatvalidation,\r\ncommentaire,\r\ndatevalidation,\r\n" + newValidateurs[i].idValidateur +" as idvalidateur,\r\n0 as isPotential,\r\nnull as isValidator,\r\nGETDATE() AS creationdate,\r\ncreatedby,\r\nisPassMarche,\r\nnumero,\r\nisPassMarcheSkyp\r\nFROM cte\r\nWHERE rn = 1;");

            }
        }

        //update historiquevalidationjustif pour update de circuit
        public void addValidateurToHistoriqueValidationJustif(int idCircuitEtape, List<CircuitEtapeValidateur> newValidateurs)
        {
            Console.WriteLine(newValidateurs.Count());
            for (int i = 0; i < newValidateurs.Count(); i++)
            {
                Console.WriteLine("ADDED");
                _context.Database.ExecuteSqlRaw("WITH cte AS (\r\n    SELECT *,\r\n           ROW_NUMBER() OVER (\r\n               PARTITION BY idjustif,idcircuitetape\r\n               ORDER BY creationdate ASC\r\n           ) AS rn\r\n    FROM HistoriqueValidationJustificatif \r\n    where idCircuitEtape = " + idCircuitEtape + "\r\n)\r\nINSERT INTO HistoriqueValidationJustificatif(\r\nidjustif, \r\nidcircuitetape, \r\netatvalidation,\r\ncommentaire,\r\ndatevalidation,\r\nidvalidateur,\r\nisPotential,\r\nisValidator,\r\ncreationdate,\r\ncreatedby,\r\nisPassMarche,\r\nnumero,\r\nisPassMarcheSkyp\r\n)\r\nSELECT\r\nidjustif, \r\nidcircuitetape, \r\netatvalidation,\r\ncommentaire,\r\ndatevalidation,\r\n" + newValidateurs[i].idValidateur + " as idvalidateur,\r\n0 as isPotential,\r\nnull as isValidator,\r\nGETDATE() AS creationdate,\r\ncreatedby,\r\nisPassMarche,\r\nnumero,\r\nisPassMarcheSkyp\r\nFROM cte\r\nWHERE rn = 1;");

            }
        }


        // Update a Circuit
        public async Task<UpdateCircuitResult> UpdateCircuit(int idCircuit, CreateCircuitDTO circuitDto, int currentUserId)
        {
            var existingCircuit = await _context.Circuit
                                            .Include(c => c.CircuitProjets)
                                            .Include(c => c.CircuitSites)
                                            .Include(c => c.CircuitEtapes)
                                            .ThenInclude(e => e.CircuitEtapeValidateurs)
                                            .Include(c => c.CircuitEtapes)
                                            .ThenInclude(e => e.CircuitEtapeCheckLists)
                                            .FirstOrDefaultAsync(c => c.idCircuit == idCircuit && c.deletiondate == null);

            if (existingCircuit == null)
                return UpdateCircuitResult.NotFound;

            //var isCircuitUsedRequete = await _context.CircuitRequete.AnyAsync(a => a.idCircuit == idCircuit);
            //var isCircuitUsedJustif = await _context.CircuitJustificatif.AnyAsync(a => a.idCircuit == idCircuit);

            var isCircuitUsedRequete = await _context.Requete.FromSqlRaw("select requete.* from circuitrequete \r\njoin requete on requete.idrequete = circuitrequete.idrequete and requete.etatvalidation != 2 and requete.etatvalidation != 5\r\nwhere idcircuit = @p0", idCircuit).AnyAsync();
            var isCircuitUsedJustif = await _context.Requete.FromSqlRaw("select justificatif.* from circuitjustificatif\r\njoin justificatif on justificatif.idjustif = circuitjustificatif.idjustif and justificatif.etatvalidation != 2 and justificatif.etatvalidation != 5\r\nwhere idcircuit = @p0", idCircuit).AnyAsync();

            //var isCircuitUsed = false;
            if (isCircuitUsedRequete  || isCircuitUsedJustif) // Si circuit déjà en cours d'utilisation alors : on ne peut rien faire mais juste ajouter des validateur et checklist s'il y en a venant modele
            {
                existingCircuit.intitule = circuitDto.Libelle;
                foreach (var etapeDto in circuitDto.Etapes)
                {
                    var existingEtape = existingCircuit.CircuitEtapes.FirstOrDefault(e => e.numero == etapeDto.Numero && e.deletiondate == null);

                    if (existingEtape != null)
                    {
                        // Ajouter les nouveaux validateurs
                        var newValidateurs = etapeDto.Validateurs
                            .Where(id => !existingEtape.CircuitEtapeValidateurs.Any(v => v.idValidateur == id))
                            .Select(id => new CircuitEtapeValidateur
                            {
                                idCircuitEtape = existingEtape.idCircuitEtape,
                                numero = existingEtape.numero,
                                idValidateur = id,
                                creationdate = DateTime.Now,
                                createdby = currentUserId,
                                //isPassMarche = existingEtape.isPassMarche
                            });
                        Console.WriteLine(newValidateurs.Count());
                        // Ajouter les nouvelles checklist
                        var newChecklists = (etapeDto.CheckList ?? new List<CheckListItemDTO>())
                            .Where(c => !existingEtape.CircuitEtapeCheckLists.Any(cl => cl.code == c.Code))
                            .Select(c => new CircuitEtapeCheckList
                            {
                                idCircuitEtape = existingEtape.idCircuitEtape,
                                code = c.Code,
                                libelle = c.Libelle,
                                creationdate = DateTime.Now,
                                createdby = currentUserId
                            });

                        //ajout des nouveaux validateurs dans historiquevalidationrequete
                        addValidateurToHistoriqueValidation(existingEtape.idCircuitEtape, newValidateurs.ToList());
                        addValidateurToHistoriqueValidationJustif(existingEtape.idCircuitEtape, newValidateurs.ToList());
                        _context.CircuitEtapeValidateur.AddRange(newValidateurs);
                        _context.CircuitEtapeCheckList.AddRange(newChecklists);
                        

                        existingEtape.isRefusable = etapeDto.isRefusable;
                        existingEtape.isPassMarche = etapeDto.isPassMarche;
                        existingEtape.isModifiable = etapeDto.isModifiable;
                        existingEtape.checkBudget = etapeDto.checkBudget;
                       
                        await _context.SaveChangesAsync();
                       
                       
                        
                    }
                }

                return UpdateCircuitResult.UpdatedValiCheck;
            }
            else // Sinon modification selon le modele
            {
                Console.WriteLine("---------LIBELLE----------");
                Console.WriteLine(circuitDto.Libelle);
                bool exists = await _context.Circuit.AnyAsync(c => c.idCircuit != idCircuit && c.intitule.ToLower() == circuitDto.Libelle.ToLower() && c.deletiondate == null);

                if (exists)
                    return UpdateCircuitResult.DuplicateLibelle;

                existingCircuit.intitule = circuitDto.Libelle;

                _context.CircuitProjet.RemoveRange(existingCircuit.CircuitProjets);
                _context.CircuitSite.RemoveRange(existingCircuit.CircuitSites);

                existingCircuit.CircuitProjets = circuitDto.Projets.Select(p => new CircuitProjet { idProjet = p }).ToList();
                existingCircuit.CircuitSites = circuitDto.Sites.Select(s => new CircuitSite { idSite = s }).ToList();

                var oldEtapes = await _context.CircuitEtape
                                            .Where(e => e.idCircuit == idCircuit && e.deletiondate == null)
                                            .ToListAsync();

                foreach (var oldEtape in oldEtapes)
                {
                    oldEtape.deletiondate = DateTime.Now;
                    oldEtape.deletedby = currentUserId;

                    var oldValidateurs = await _context.CircuitEtapeValidateur
                                                    .Where(v => v.idCircuitEtape == oldEtape.idCircuitEtape && v.deletiondate == null)
                                                    .ToListAsync();
                    oldValidateurs.ForEach(v => { v.deletiondate = DateTime.Now; v.deletedby = currentUserId; });

                    var oldChecklists = await _context.CircuitEtapeCheckList
                                                    .Where(cl => cl.idCircuitEtape == oldEtape.idCircuitEtape && cl.deletiondate == null)
                                                    .ToListAsync();

                    oldChecklists.ForEach(cl => { cl.deletiondate = DateTime.Now; cl.deletedby = currentUserId; });
                }

                for(int i = 0;i < circuitDto.Etapes.Count(); i++)
                //foreach (var etapeDto in circuitDto.Etapes)
                {
                    var newEtape = new CircuitEtape
                    {
                        idCircuit = idCircuit,
                        numero = i+1,
                        description = circuitDto.Etapes[i].Description,
                        duree = circuitDto.Etapes[i].Duree,
                        isPassMarche = circuitDto.Etapes[i].isPassMarche,
                        isModifiable = circuitDto.Etapes[i].isModifiable,
                        isRefusable = circuitDto.Etapes[i].isRefusable,
                        checkBudget = circuitDto.Etapes[i].checkBudget,
                        creationdate = DateTime.Now,
                        createdby = currentUserId
                    };

                    _context.CircuitEtape.Add(newEtape);
                    await _context.SaveChangesAsync();

                    var validateurs = circuitDto.Etapes[i].Validateurs.Select(id => new CircuitEtapeValidateur
                    {
                        idCircuitEtape = newEtape.idCircuitEtape,
                        numero = newEtape.numero,
                        idValidateur = id,
                        creationdate = DateTime.Now,
                        createdby = currentUserId,
                        //isPassMarche = newEtape.isPassMarche
                    });

                    var checklists = (circuitDto.Etapes[i].CheckList ?? new List<CheckListItemDTO>()).Select(c => new CircuitEtapeCheckList
                    {
                        idCircuitEtape = newEtape.idCircuitEtape,
                        code = c.Code,
                        libelle = c.Libelle,
                        creationdate = DateTime.Now,
                        createdby = currentUserId
                    });

                    _context.CircuitEtapeValidateur.AddRange(validateurs);
                    _context.CircuitEtapeCheckList.AddRange(checklists);
                }

                await _context.SaveChangesAsync();
                return UpdateCircuitResult.Updated;
            }
        }
        
        public enum DuplicateCircuitResult
        {
            NotFound,
            DuplicateLibelle,
            Success
        }

        // Duplication
        public async Task<(Circuit? circuit, DuplicateCircuitResult result)> DuplicateCircuit(int idCircuit, string newLibelle, int currentUserId)
        {
            var existingCircuit = await _context.Circuit
                .Include(c => c.CircuitProjets)
                .Include(c => c.CircuitSites)
                .Include(c => c.CircuitEtapes)
                .ThenInclude(e => e.CircuitEtapeValidateurs)
                .Include(c => c.CircuitEtapes)
                .ThenInclude(e => e.CircuitEtapeCheckLists)
                .FirstOrDefaultAsync(c => c.idCircuit == idCircuit && c.deletiondate == null);

            if (existingCircuit == null)
                return (null, DuplicateCircuitResult.NotFound);

            var libelleExists = await _context.Circuit.AnyAsync(c => c.intitule.ToLower() == newLibelle.ToLower() && c.deletiondate == null);

            if (libelleExists)
                return (null, DuplicateCircuitResult.DuplicateLibelle);

            var newCircuit = new Circuit
            {
                intitule = newLibelle,
                creationdate = DateTime.Now,
                createdby = currentUserId,
                CircuitProjets = existingCircuit.CircuitProjets.Select(p => new CircuitProjet { idProjet = p.idProjet }).ToList(),
                CircuitSites = existingCircuit.CircuitSites.Select(s => new CircuitSite { idSite = s.idSite }).ToList(),
                isdisabled = false
            };

            _context.Circuit.Add(newCircuit);
            await _context.SaveChangesAsync();

            var newEtapes = new List<CircuitEtape>();

            foreach (var existingEtape in existingCircuit.CircuitEtapes)
            {
                var newEtape = new CircuitEtape
                {
                    idCircuit = newCircuit.idCircuit,
                    numero = existingEtape.numero,
                    description = existingEtape.description,
                    duree = existingEtape.duree,
                    isPassMarche = existingEtape.isPassMarche,
                    creationdate = DateTime.Now,
                    createdby = currentUserId
                };

                _context.CircuitEtape.Add(newEtape);
                await _context.SaveChangesAsync();

                newEtapes.Add(newEtape);

                var newValidateurs = existingEtape.CircuitEtapeValidateurs.Select(v => new CircuitEtapeValidateur
                {
                    idCircuitEtape = newEtape.idCircuitEtape,
                    numero = v.numero,
                    idValidateur = v.idValidateur,
                    creationdate = DateTime.Now,
                    createdby = currentUserId,
                    //isPassMarche = newEtape.isPassMarche
                });

                _context.CircuitEtapeValidateur.AddRange(newValidateurs);

                var newChecklists = existingEtape.CircuitEtapeCheckLists.Select(cl => new CircuitEtapeCheckList
                {
                    idCircuitEtape = newEtape.idCircuitEtape,
                    code = cl.code,
                    libelle = cl.libelle,
                    creationdate = DateTime.Now,
                    createdby = currentUserId
                });

                _context.CircuitEtapeCheckList.AddRange(newChecklists);
            }

            await _context.SaveChangesAsync();

            return (newCircuit, DuplicateCircuitResult.Success);
        }

        public async Task<CircuitEtapeDTO?> GetCircuitEtapeValidateurEtapeNextFirst(int idEtape)
        {
            var etapes = await _context.CircuitEtape.FirstOrDefaultAsync(ce => ce.idCircuitEtape == idEtape && ce.deletiondate == null);
            if (etapes == null)
                return null;

            var etapesNext = await _context.CircuitEtape.FirstOrDefaultAsync(ce => ce.idCircuit == etapes.idCircuit && ce.numero == etapes.numero + 1 && ce.deletiondate == null);
            if (etapesNext == null)
                return null;

            var validateurs = await _context.CircuitEtapeValidateur
                                        .Where(v => v.idCircuitEtape == etapesNext.idCircuitEtape && v.deletiondate == null).Select(v => v.idValidateur)
                                        .ToListAsync();

            var checklists = await _context.CircuitEtapeCheckList
                                        .Where(v => v.idCircuitEtape == etapesNext.idCircuitEtape && v.deletiondate == null).Select(v => v.idCircuitEtapeCheckList)
                                        .ToListAsync();

            var etapeDto = new CircuitEtapeDTO
            {
                Id = etapesNext.idCircuitEtape,
                Numero = etapesNext.numero,
                Description = etapesNext.description,
                Duree = etapesNext.duree,
                Validateurs = validateurs,
                CheckList = checklists
            };

            return etapeDto;
        }

        public async Task<CircuitEtapeDTO?> GetCircuitEtapeById(int idEtape)
        {
            var etapes = await _context.CircuitEtape.FirstOrDefaultAsync(ce => ce.idCircuitEtape == idEtape && ce.deletiondate == null);
            if (etapes == null)
                return null;

            var validateurs = await _context.CircuitEtapeValidateur
                                        .Where(v => v.idCircuitEtape == etapes.idCircuitEtape && v.deletiondate == null).Select(v => v.idValidateur)
                                        .ToListAsync();

            var checklists = await _context.CircuitEtapeCheckList
                                        .Where(v => v.idCircuitEtape == etapes.idCircuitEtape && v.deletiondate == null).Select(v => v.idCircuitEtapeCheckList)
                                        .ToListAsync();

            var etapeDto = new CircuitEtapeDTO
            {
                Id = etapes.idCircuitEtape,
                Numero = etapes.numero,
                Description = etapes.description,
                Duree = etapes.duree,
                Validateurs = validateurs,
                CheckList = checklists
            };

            return etapeDto;
        }

        public async Task<CircuitEtapeDTO?> GetCircuitEtapeValidateurEtapeNextSeconde(int idEtape)
        {
            var etapes = await _context.CircuitEtape.FirstOrDefaultAsync(ce => ce.idCircuitEtape == idEtape && ce.deletiondate == null);
            if (etapes == null)
                return null;

            var etapesNext = await _context.CircuitEtape.FirstOrDefaultAsync(ce => ce.idCircuit == etapes.idCircuit && ce.numero == etapes.numero + 2 && ce.deletiondate == null);
            if (etapesNext == null)
                return null;

            var validateurs = await _context.CircuitEtapeValidateur
                                        .Where(v => v.idCircuitEtape == etapesNext.idCircuitEtape && v.deletiondate == null).Select(v => v.idValidateur)
                                        .ToListAsync();

            var checklists = await _context.CircuitEtapeCheckList
                                        .Where(v => v.idCircuitEtape == etapesNext.idCircuitEtape && v.deletiondate == null).Select(v => v.idCircuitEtapeCheckList)
                                        .ToListAsync();

            var etapeDto = new CircuitEtapeDTO
            {
                Id = etapesNext.idCircuitEtape,
                Numero = etapesNext.numero,
                Description = etapesNext.description,
                Duree = etapesNext.duree,
                Validateurs = validateurs,
                CheckList = checklists
            };

            return etapeDto;
        }

        public async Task<List<CircuitEtapeDTO?>> GetCircuitEtapePrevious(int idEtape)
        {
            var etapeActuelle = await _context.CircuitEtape.FirstOrDefaultAsync(ce => ce.idCircuitEtape == idEtape && ce.deletiondate == null);
            if (etapeActuelle == null)
                return null;

            var etapesPrecedentes = await _context.CircuitEtape.Where(ce => ce.idCircuit == etapeActuelle.idCircuit && ce.numero < etapeActuelle.numero && ce.deletiondate == null).OrderBy(ce => ce.numero).ToListAsync();

            var result = new List<CircuitEtapeDTO>();

            foreach (var etape in etapesPrecedentes)
            {
                var validateurs = await _context.CircuitEtapeValidateur
                    .Where(v => v.idCircuitEtape == etape.idCircuitEtape && v.deletiondate == null).Select(v => v.idValidateur)
                    .ToListAsync();

                var checklists = await _context.CircuitEtapeCheckList
                    .Where(c => c.idCircuitEtape == etape.idCircuitEtape && c.deletiondate == null).Select(c => c.idCircuitEtapeCheckList)
                    .ToListAsync();

                result.Add(new CircuitEtapeDTO
                {
                    Id = etape.idCircuitEtape,
                    Numero = etape.numero,
                    Description = "Etape "+etape.numero+" : "+etape.description,
                    Duree = etape.duree,
                    Validateurs = validateurs,
                    CheckList = checklists
                });
            }

            return result;
        }

        public async Task<CircuitEtapeCheckListDetailsDTO?> GetCircuitEtapeActuelByIdRequete(int idRequete)
        {
            var histoEnCours = await _context.HistoriqueValidationRequete.Where(h => h.idRequete == idRequete && h.dateValidation == null).OrderBy(h => h.numero).FirstOrDefaultAsync();
            Console.WriteLine("check 0");
            if (histoEnCours == null)
                return null;
            Console.WriteLine("check 1");
            var etape = await _context.CircuitEtape.FirstOrDefaultAsync(e => e.idCircuitEtape == histoEnCours.idCircuitEtape && e.deletiondate == null);

            if (etape == null)
                return null;
            Console.WriteLine("check 2");
            /* var validateurs = await _context.CircuitEtapeValidateur
                                         .Where(v => v.idCircuitEtape == etape.idCircuitEtape && v.deletiondate == null).Select(v => v.idValidateur)
                                         .ToListAsync();*/
            /*validateurs séléctionnés*/
            var validateurs = await _context.CircuitEtapeValidateur.FromSqlRaw("select circuitEtapeValidateur.* from circuitEtapeValidateur\r\njoin historiquevalidationrequete on \r\nhistoriquevalidationrequete.idrequete = @p0 and historiquevalidationrequete.idvalidateur = circuitEtapeValidateur.idvalidateur and circuitEtapeValidateur.idCircuitEtape = historiquevalidationrequete.idCircuitEtape and isPotential = 1\r\nwhere circuitEtapeValidateur.idCircuitEtape = @p1 and circuitetapevalidateur.deletiondate is null",idRequete, etape.idCircuitEtape).Select(v => v.idValidateur).ToListAsync();

            var checklists = await _context.CircuitEtapeCheckList.Where(v => v.idCircuitEtape == etape.idCircuitEtape && v.deletiondate == null)
            .Select(v => new CircuitEtapeCheckListDTO
            {
                idCircuitEtapeCheckList = v.idCircuitEtapeCheckList,
                idCircuitEtape = v.idCircuitEtape,
                code = v.code,
                libelle = v.libelle,
                creationdate = v.creationdate,
                createdby = v.createdby,
                deletiondate = v.deletiondate,
                deletedby = v.deletedby
            }).ToListAsync();

            bool isPassMarchNext = false;
            var etapesNext = await _context.CircuitEtape.FirstOrDefaultAsync(ce => ce.idCircuit == etape.idCircuit && ce.numero == etape.numero + 1 && ce.deletiondate == null);
            if (etapesNext != null)
            {
                isPassMarchNext = etapesNext?.isPassMarche ?? false;
            }

            var etapeDto = new CircuitEtapeCheckListDetailsDTO
            {
                Id = etape.idCircuitEtape,
                Numero = etape.numero,
                Description = etape.description,
                Duree = etape.duree,
                Validateurs = validateurs,
                CheckList = checklists,
                isPassMarcheNEXT = isPassMarchNext,
                isModifiable = etape.isModifiable,
                isRefusable = etape.isRefusable,
                checkBudget = etape.checkBudget
            };

            return etapeDto;
        }

        public  CircuitEtapeCheckListDetailsDTO? GetCircuitEtapeActuelByIdRequeteSync(int idRequete)
        {
            var histoEnCours =  _context.HistoriqueValidationRequete.Where(h => h.idRequete == idRequete && h.dateValidation == null).OrderBy(h => h.numero).FirstOrDefault();

            if (histoEnCours == null)
                return null;

            var etape =  _context.CircuitEtape.FirstOrDefault(e => e.idCircuitEtape == histoEnCours.idCircuitEtape && e.deletiondate == null);

            if (etape == null)
                return null;

            var validateurs =  _context.CircuitEtapeValidateur
                                        .Where(v => v.idCircuitEtape == etape.idCircuitEtape && v.deletiondate == null).Select(v => v.idValidateur)
                                        .ToList();

            var checklists =  _context.CircuitEtapeCheckList.Where(v => v.idCircuitEtape == etape.idCircuitEtape && v.deletiondate == null)
            .Select(v => new CircuitEtapeCheckListDTO
            {
                idCircuitEtapeCheckList = v.idCircuitEtapeCheckList,
                idCircuitEtape = v.idCircuitEtape,
                code = v.code,
                libelle = v.libelle,
                creationdate = v.creationdate,
                createdby = v.createdby,
                deletiondate = v.deletiondate,
                deletedby = v.deletedby
            }).ToList();

            bool isPassMarchNext = false;
            var etapesNext =  _context.CircuitEtape.FirstOrDefault(ce => ce.idCircuit == etape.idCircuit && ce.numero == etape.numero + 1 && ce.deletiondate == null);
            if (etapesNext != null)
            {
                isPassMarchNext = etapesNext?.isPassMarche ?? false;
            }

            var etapeDto = new CircuitEtapeCheckListDetailsDTO
            {
                Id = etape.idCircuitEtape,
                Numero = etape.numero,
                Description = etape.description,
                Duree = etape.duree,
                Validateurs = validateurs,
                CheckList = checklists,
                isPassMarcheNEXT = isPassMarchNext
            };

            return etapeDto;
        }

        public CircuitEtapeCheckListDetailsDTO? GetCircuitEtapeActuelByIdJustifSync(int idRequete)
        {
            var histoEnCours = _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == idRequete && h.dateValidation == null).OrderBy(h => h.numero).FirstOrDefault();

            if (histoEnCours == null)
                return null;

            var etape = _context.CircuitEtape.FirstOrDefault(e => e.idCircuitEtape == histoEnCours.idCircuitEtape && e.deletiondate == null);

            if (etape == null)
                return null;

            var validateurs = _context.CircuitEtapeValidateur
                                        .Where(v => v.idCircuitEtape == etape.idCircuitEtape && v.deletiondate == null).Select(v => v.idValidateur)
                                        .ToList();

            var checklists = _context.CircuitEtapeCheckList.Where(v => v.idCircuitEtape == etape.idCircuitEtape && v.deletiondate == null)
            .Select(v => new CircuitEtapeCheckListDTO
            {
                idCircuitEtapeCheckList = v.idCircuitEtapeCheckList,
                idCircuitEtape = v.idCircuitEtape,
                code = v.code,
                libelle = v.libelle,
                creationdate = v.creationdate,
                createdby = v.createdby,
                deletiondate = v.deletiondate,
                deletedby = v.deletedby
            }).ToList();

            bool isPassMarchNext = false;
            var etapesNext = _context.CircuitEtape.FirstOrDefault(ce => ce.idCircuit == etape.idCircuit && ce.numero == etape.numero + 1 && ce.deletiondate == null);
            if (etapesNext != null)
            {
                isPassMarchNext = etapesNext?.isPassMarche ?? false;
            }

            var etapeDto = new CircuitEtapeCheckListDetailsDTO
            {
                Id = etape.idCircuitEtape,
                Numero = etape.numero,
                Description = etape.description,
                Duree = etape.duree,
                Validateurs = validateurs,
                CheckList = checklists,
                isPassMarcheNEXT = isPassMarchNext
            };

            return etapeDto;
        }

        public async Task<CircuitEtapeCheckListDetailsDTO?> GetCircuitEtapeActuelByIdJustif(int idJustif)
        {
            var histoEnCours = await _context.HistoriqueValidationJustificatif.Where(h => h.idJustif == idJustif && h.dateValidation == null).OrderBy(h => h.numero).FirstOrDefaultAsync();

            if (histoEnCours == null)
                return null;

            var etape = await _context.CircuitEtape.FirstOrDefaultAsync(e => e.idCircuitEtape == histoEnCours.idCircuitEtape && e.deletiondate == null);

            if (etape == null)
                return null;

            var validateurs = await _context.CircuitEtapeValidateur
                                        .Where(v => v.idCircuitEtape == etape.idCircuitEtape && v.deletiondate == null).Select(v => v.idValidateur)
                                        .ToListAsync();

            var checklists = await _context.CircuitEtapeCheckList.Where(v => v.idCircuitEtape == etape.idCircuitEtape && v.deletiondate == null)
            .Select(v => new CircuitEtapeCheckListDTO
            {
                idCircuitEtapeCheckList = v.idCircuitEtapeCheckList,
                idCircuitEtape = v.idCircuitEtape,
                code = v.code,
                libelle = v.libelle,
                creationdate = v.creationdate,
                createdby = v.createdby,
                deletiondate = v.deletiondate,
                deletedby = v.deletedby
            }).ToListAsync();

            bool isPassMarchNext = false;
            var etapesNext = await _context.CircuitEtape.FirstOrDefaultAsync(ce => ce.idCircuit == etape.idCircuit && ce.numero == etape.numero + 1 && ce.deletiondate == null);
            if (etapesNext != null)
            {
                isPassMarchNext = etapesNext?.isPassMarche ?? false;
            }

            var etapeDto = new CircuitEtapeCheckListDetailsDTO
            {
                Id = etape.idCircuitEtape,
                Numero = etape.numero,
                Description = etape.description,
                Duree = etape.duree,
                Validateurs = validateurs,
                CheckList = checklists,
                isPassMarcheNEXT = isPassMarchNext,
                isModifiable = etape.isModifiable
            };

            return etapeDto;
        }

        //Function to get circuit requête
        public async Task<Circuit?> GetCircuitByRequeteId(int idRequete)
        {

            int? idCircuit = null;

            var connection = _context.Database.GetDbConnection();
            try
            {
                if (connection.State != System.Data.ConnectionState.Open)
                    await connection.OpenAsync();

                using var command = connection.CreateCommand();
                command.CommandText = "SELECT TOP 1 idCircuit FROM CircuitRequete WHERE idRequete = @idRequete";
                var param = command.CreateParameter();
                param.ParameterName = "@idRequete";
                param.Value = idRequete;
                command.Parameters.Add(param);

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == System.DBNull.Value)
                    return null;

                if (result is int intVal)
                    idCircuit = intVal;
                else if (int.TryParse(result.ToString(), out var parsed))
                    idCircuit = parsed;
                else
                    return null;
            }
            finally
            {
                try { await connection.CloseAsync(); } catch { }
            }

            if (!idCircuit.HasValue)
                return null;

            var circuit = await _context.Circuit
                .Where(c => c.idCircuit == idCircuit.Value && c.deletiondate == null)
                .Include(c => c.CircuitProjets).ThenInclude(cp => cp.Projet)
                .Include(c => c.CircuitSites).ThenInclude(cs => cs.Site)
                .Include(c => c.CircuitEtapes.Where(e => e.deletiondate == null)).ThenInclude(e => e.CircuitEtapeValidateurs)
                .Include(c => c.CircuitEtapes.Where(e => e.deletiondate == null)).ThenInclude(e => e.CircuitEtapeCheckLists)
                .FirstOrDefaultAsync();

            return circuit;
        }
    }
}