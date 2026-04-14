using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Collections.Generic;
using System.Drawing;
using System.Reflection.Metadata;
using UCP_API.dto;
using UCP_API.models;
using UCP_API.Models;

namespace UCP_API.data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Circuit> Circuit { get; set; }
        public DbSet<CircuitProjet> CircuitProjet { get; set; }
        public DbSet<CircuitSite> CircuitSite { get; set; }
        public DbSet<CircuitEtape> CircuitEtape { get; set; }
        public DbSet<CircuitEtapeValidateur> CircuitEtapeValidateur { get; set; }
        public DbSet<CircuitEtapeCheckList> CircuitEtapeCheckList { get; set; }
        public DbSet<HistoriqueValidationRequete> HistoriqueValidationRequete { get; set; }
        public DbSet<HistoriqueValidationRequetePj> HistoriqueValidationRequetePj { get; set; }
        public DbSet<Projet> Projet { get; set; }
        public DbSet<Requete> Requete { get; set; }
        public DbSet<RequeteJustificatif> RequeteJustificatif { get; set; }
        public DbSet<TypeRequete> TypeRequete { get; set; }
        public DbSet<Utilisateur> Utilisateur { get; set; }
        public DbSet<UtilisateurProjet> UtilisateurProjet { get; set; }
        public DbSet<Activite> Activite { get; set; }
        public DbSet<Entete> Entete { get; set; }
        public DbSet<Role> Role { get; set; }
        public DbSet<Site> Site { get; set; }
        public DbSet<UtilisateurSite> UtilisateurSite { get; set; }

        public DbSet<CategorieRubrique> CategorieRubrique { get; set; }
        public DbSet<CategorieRubriqueColonne> CategorieRubriqueColonne { get; set; }
        public DbSet<RequeteRubrique> RequeteRubrique { get; set; }
        public DbSet<Rubrique> Rubrique { get; set; }
        public DbSet<RubriqueCategorieRubrique> RubriqueCategorieRubrique { get; set; }
        public DbSet<TypeCategorieRubrique> TypeCategorieRubrique { get; set; }
        public DbSet<TypeRubrique> TypeRubrique { get; set; }
        public DbSet<Unit> Unit { get; set; }
        public DbSet<CircuitRequete> CircuitRequete { get; set; }
        public DbSet<RequeteAccuse> RequeteAccuse { get; set; }
        public DbSet<HistoriqueValidationRequeteCheckList> HistoriqueValidationRequeteCheckList { get; set; }
        public DbSet<HistoriqueValidationRequeteRedirection> HistoriqueValidationRequeteRedirection { get; set; }

        public DbSet<UtilisateurCC> UtilisateurCC { get; set; }
        public DbSet<Justificatif> Justificatif { get; set; }
        public DbSet<JustifDetails> JustifDetails { get; set; }
        public DbSet<JustifPj> JustifPj { get; set; }

        public DbSet<CircuitJustificatif> CircuitJustificatif { get; set; }
        public DbSet<JustificatifAccuse> JustificatifAccuse { get; set; }
        public DbSet<HistoriqueValidationJustificatifCheckList> HistoriqueValidationJustificatifCheckList { get; set; }
        public DbSet<HistoriqueValidationJustificatifRedirection> HistoriqueValidationJustificatifRedirection { get; set; }
        public DbSet<HistoriqueValidationJustificatif> HistoriqueValidationJustificatif { get; set; }

        public DbSet<HistoriqueValidationJustificatifPj> HistoriqueValidationJustificatifPj { get; set; }

        public DbSet<Agmo> Agmo { get; set; }

        public DbSet<SommeCategorieRubriqueDTO> SommeCategorieRubriqueDTO { get; set; }

        public DbSet<DashboardRetardDTO> DashboardRetards { get; set; }
        public DbSet<DashboardMontantDTO> DashboardMontants { get; set; }
        public DbSet<RouteDistance> RouteDistance { get; set; }

       /* protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        { 
            optionsBuilder
                .UseSqlServer("Server=localhost;Database=ucp;Trusted_Connection=True;Encrypt=True;TrustServerCertificate=True;Max Pool Size=200;Min Pool Size=5") // Replace with your actual connection string
                .EnableSensitiveDataLogging()
                .EnableDetailedErrors()
                .LogTo(Console.WriteLine, LogLevel.Information); // Enable logging to the console            
        }*/

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<FloatResult>().HasNoKey();
            modelBuilder.Entity<IntResult>().HasNoKey();
            modelBuilder.Entity<DateTimeResult>().HasNoKey();
            modelBuilder.Entity<SommeCategorieRubriqueDTO>().HasNoKey();

            modelBuilder.Entity<UtilisateurCC>()
               .HasOne(ucc => ucc.Utilisateur)
               .WithMany(u => u.UtilisateurCCs)
               .HasForeignKey(ucc => ucc.idUtilisateur);

        }
    }
}
