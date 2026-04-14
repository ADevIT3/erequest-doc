using System;
using System.Linq;
using System.Linq.Expressions;
using UCP_API.models;

namespace UCP_API.utils
{
    public enum RequeteStatutFiltre
    {
        Initie = 0,
        Envoye = 1,
        EnCours = 2,
        Refuse = 3,
        Valide = 4,
        Cloture = 5
    }

    public static class RequeteStatutFiltreExtensions
    {
        public static Expression<Func<Requete, bool>> GetFiltre(this RequeteStatutFiltre statut)
        {
            return statut switch
            {
                RequeteStatutFiltre.Initie =>
                    r => r.EtatValidation == 0 && !r.RequeteJustificatifs.Any(),

                RequeteStatutFiltre.Envoye =>
                    r => r.EtatValidation == 0 && r.RequeteJustificatifs.Any(),

                RequeteStatutFiltre.EnCours =>
                    r => r.EtatValidation == 1 || r.EtatValidation == 4,

                RequeteStatutFiltre.Refuse =>
                    r => r.EtatValidation == 2,

                RequeteStatutFiltre.Valide =>
                    r => r.EtatValidation == 5 && (r.cloture == false || r.cloture == null),

                RequeteStatutFiltre.Cloture =>
                    r => r.EtatValidation == 5 && r.cloture == true,

                _ => r => true
            };
        }
    }
}