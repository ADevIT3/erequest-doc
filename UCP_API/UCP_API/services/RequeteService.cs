using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using UCP_API.repositories;
using UCP_API.models;
using UCP_API.utils;
using System.Security.Claims;
using UCP_API.dto;



namespace UCP_API.services
{
    public class RequeteService : BackgroundService
    {
        
        
        private readonly IServiceScopeFactory _scopeFactory;

        public RequeteService( IServiceScopeFactory scopeFactory)
        {
            
          
            _scopeFactory = scopeFactory;
        }

        /*protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using (var scope = _scopeFactory.CreateScope())
                {

                    var repo = scope.ServiceProvider.GetRequiredService<RequeteRepository>();
                    var mailService = scope.ServiceProvider.GetRequiredService<Mailservice>();
                    // utilisation du repo

                    Console.WriteLine("Background task running...");
                    List<Requete> requetes = repo.GetRequetesAalerter();
                    for (int i = 0; i < requetes.Count(); i++)
                    {
                        requetes[i].alerter(mailService);
                    }
                }
                    await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
                
            }
        }*/

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using (var scope = _scopeFactory.CreateScope())
                {

                    var repo = scope.ServiceProvider.GetRequiredService<RequeteRepository>();
                    var mailService = scope.ServiceProvider.GetRequiredService<Mailservice>();
                    // utilisation du repo
                    DateOnly todayDate = DateOnly.FromDateTime(DateTime.Now);
                    Console.WriteLine("Background task running...");
                    List<Requete> requetes = repo.GetRequetesAalerter();
                    List<Requete> requetesApresEcheance = repo.GetRequetesAalerterApresEcheance();

                    Requete requete = new Requete();
                    //requete.CodeActiviteTom = RequeteData.ActiviteTom.Split("-")[0];
                    //requete.IntituleActiviteTom = RequeteData.ActiviteTom.Split("-")[1];
                   

                    for (int i = 0; i < requetes.Count(); i++)
                    {
                        if (requetes[i].NbRappel != 0)
                        {
                            if (requetes[i].NextRappel == todayDate)
                            {
                                requetes[i].alerter(mailService);
                                requete.NbRappel = requetes[i].NbRappel + 1;
                                requete.LastRappel = todayDate;
                                requete.NextRappel = todayDate.AddDays(15 - (5 * (int)requetes[i].NbRappel));

                                requete.IdRequete = requetes[i].IdRequete;
                                requete.IdUtilisateur = requetes[i].IdUtilisateur;
                                requete.IdProjet = requetes[i].IdProjet;
                                requete.DateExecution = requetes[i].DateExecution;
                                requete.Description = requetes[i].Description;
                                requete.CodeActiviteTom = requetes[i].CodeActiviteTom;
                                requete.IntituleActiviteTom = requetes[i].IntituleActiviteTom;
                                requete.IdSite = requetes[i].IdSite;
                                requete.NumRequete = requetes[i].NumRequete;
                                requete.NumActiviteInterne = requetes[i].NumActiviteInterne;
                                requete.Lieu = requetes[i].Lieu;
                                requete.EtatValidation = requetes[i].EtatValidation;
                                requete.DateFinExecution = requetes[i].DateFinExecution;
                                requete.IdTypeRequete = requetes[i].IdTypeRequete;
                                requete.ReferenceInterne = requetes[i].ReferenceInterne;
                                requete.creationdate = requetes[i].creationdate;
                                requete.Montant = requetes[i].Montant;
                                requete.Objet = requetes[i].Objet;
                                requete.MontantValide = requetes[i].MontantValide;
                                requete.IntituleActiviteInterne = requetes[i].IntituleActiviteInterne;
                                requete.Copie_a = requetes[i].Copie_a;
                                requete.Compte_rendu = requetes[i].Compte_rendu;
                                requete.ManquePj = requetes[i].ManquePj;

                                repo.UpdateRequete(requete);
                            }
                        }
                        else
                        {
                            requetes[i].alerter(mailService);
                            requete.NbRappel = requetes[i].NbRappel + 1;
                            requete.LastRappel = todayDate;
                            requete.NextRappel = todayDate.AddDays(15 - (5 * (int)requetes[i].NbRappel));

                            requete.IdRequete = requetes[i].IdRequete;
                            requete.IdUtilisateur = requetes[i].IdUtilisateur;
                            requete.IdProjet = requetes[i].IdProjet;
                            requete.DateExecution = requetes[i].DateExecution;
                            requete.Description = requetes[i].Description;
                            requete.CodeActiviteTom = requetes[i].CodeActiviteTom;
                            requete.IntituleActiviteTom = requetes[i].IntituleActiviteTom;
                            requete.IdSite = requetes[i].IdSite;
                            requete.NumRequete = requetes[i].NumRequete;
                            requete.NumActiviteInterne = requetes[i].NumActiviteInterne;
                            requete.Lieu = requetes[i].Lieu;
                            requete.EtatValidation = requetes[i].EtatValidation;
                            requete.DateFinExecution = requetes[i].DateFinExecution;
                            requete.IdTypeRequete = requetes[i].IdTypeRequete;
                            requete.ReferenceInterne = requetes[i].ReferenceInterne;
                            requete.creationdate = requetes[i].creationdate;
                            requete.Montant = requetes[i].Montant;
                            requete.Objet = requetes[i].Objet;
                            requete.MontantValide = requetes[i].MontantValide;
                            requete.IntituleActiviteInterne = requetes[i].IntituleActiviteInterne;
                            requete.Copie_a = requetes[i].Copie_a;
                            requete.Compte_rendu = requetes[i].Compte_rendu;
                            requete.ManquePj = requetes[i].ManquePj;

                            repo.UpdateRequete(requete);
                        }
                    }

                    for (int i = 0; i < requetesApresEcheance.Count(); i++)
                    {
                        requetesApresEcheance[i].alerter(mailService);        
                    }
                }
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);

            }
        }
    }

}
