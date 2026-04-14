using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using UCP_API.models;


namespace UCP_API.utils
{
    public class Util
    {
        public static Boolean checkMontantJustif(double montantTotal, List<JustifDetailsDTO> details)
        {
            double montantEnvoye = 0;
            for(int i=0; i<details.Count; i++)
            {
                montantEnvoye = montantEnvoye + details[i].Montant;
            }
            if(montantEnvoye < montantTotal)
            {
                return false;
            }
            else
            {
                return true;
            }
        }

        public static DateOnly AddBusinessDays(DateOnly startDate, int daysToAdd)
        {
            int addedDays = 0;
            DateOnly currentDate = startDate;

            while (addedDays < daysToAdd)
            {
                currentDate = currentDate.AddDays(1);

                // Skip Saturdays and Sundays
                if (currentDate.DayOfWeek != DayOfWeek.Saturday &&
                    currentDate.DayOfWeek != DayOfWeek.Sunday)
                {
                    addedDays++;
                }
            }

            return currentDate;
        }

        public static List<RequeteRubrique> addMissingColumn(List<RequeteRubrique> requeteRubriques,List<CategorieRubriqueColonne> categorieRubriqueColonnes)
        {
            int i = 0;
            int j = 0;
            Console.WriteLine("REQUETE RIBRIQUE");

            for (int k = 0; k < requeteRubriques.Count(); k++)
            {
                Console.WriteLine(requeteRubriques[k].IdCategorieRubriqueColonne);
            }

            Console.WriteLine("COLONNES");

            for (int k = 0; k < categorieRubriqueColonnes.Count(); k++)
            {
                Console.WriteLine(categorieRubriqueColonnes[k].IdCategorieRubriqueColonne);
            }

            for (i = 0; i < requeteRubriques.Count(); i++)
            {
                    
                    if(requeteRubriques[i].IdCategorieRubriqueColonne != categorieRubriqueColonnes[j].IdCategorieRubriqueColonne)
                    {
                    Console.WriteLine("MISY TSY MITOVY");
                    Console.WriteLine(requeteRubriques[i].IdCategorieRubriqueColonne + " /" + categorieRubriqueColonnes[j].IdCategorieRubriqueColonne);
                        if(categorieRubriqueColonnes[j].Datatype == "nombre")
                        {
                            RequeteRubrique newRequeteRubrique = new RequeteRubrique();
                            if (i != 0)
                            {


                                newRequeteRubrique.IdRubrique = requeteRubriques[i - 1].IdRubrique;
                                newRequeteRubrique.IdRequete = requeteRubriques[i - 1].IdRequete;
                                newRequeteRubrique.IdCategorieRubriqueColonne = categorieRubriqueColonnes[j].IdCategorieRubriqueColonne;
                                newRequeteRubrique.Valeur = "0";
                                newRequeteRubrique.IdTypeRubrique = requeteRubriques[i - 1].IdTypeRubrique;

                                requeteRubriques.Insert(i, newRequeteRubrique);
                            }
                            else
                            {
                                newRequeteRubrique.IdRubrique = requeteRubriques[0].IdRubrique;
                                newRequeteRubrique.IdRequete = requeteRubriques[0].IdRequete;
                                newRequeteRubrique.IdCategorieRubriqueColonne = categorieRubriqueColonnes[j].IdCategorieRubriqueColonne;
                                newRequeteRubrique.Valeur = "0";
                                newRequeteRubrique.IdTypeRubrique = requeteRubriques[0].IdTypeRubrique;

                                requeteRubriques.Insert(i, newRequeteRubrique);
                            }
                        }
                        else
                        {
                            {
                                RequeteRubrique newRequeteRubrique = new RequeteRubrique();
                                newRequeteRubrique.IdRubrique = requeteRubriques[i - 1].IdRubrique;
                                newRequeteRubrique.IdRequete = requeteRubriques[i - 1].IdRequete;
                                newRequeteRubrique.IdCategorieRubriqueColonne = categorieRubriqueColonnes[j].IdCategorieRubriqueColonne;
                                newRequeteRubrique.Valeur = " ";
                                newRequeteRubrique.IdTypeRubrique = requeteRubriques[i - 1].IdTypeRubrique;

                                requeteRubriques.Insert(i, newRequeteRubrique);
                            }
                        }
                    }
                if(j == categorieRubriqueColonnes.Count() - 1)
                {
                    j = 0;
                }
                else
                {
                    j++;
                }
                   
            }

            


            return requeteRubriques;
        }

    }
}
