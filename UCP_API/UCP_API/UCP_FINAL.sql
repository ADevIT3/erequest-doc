CREATE TABLE role( 
	idRole int identity(1,1) PRIMARY KEY,
	nom nVARCHAR(50) NOT NULL,
);

CREATE TABLE utilisateur( 
	idUtilisateur int identity(1,1) PRIMARY KEY,
	username nVARCHAR(50) NOT NULL,
	password nVARCHAR(255) NOT NULL,
	phonenumber nVARCHAR(50) NOT NULL,
	email nVARCHAR(50) NOT NULL,
	role int  references role(idRole),
	firstname nVARCHAR(255) NOT NULL,
	lastname nVARCHAR(255) NOT NULL,
	fonction nVARCHAR(255) NOT NULL,
	creationDate datetime NOT NULL,
	createdBy int	NOT NULL,
	deletionDate datetime,
	deletedBy int,
	storage nVARCHAR(255),
	isReceivedRequete int
);
go

CREATE TABLE projet( 
	idProjet int identity(1,1) PRIMARY KEY,
	nom nVARCHAR(50) NOT NULL,
	storage nVARCHAR(255) NOT NULL,
	serverName nVARCHAR(255) NOT NULL,
	login nVARCHAR(255) NOT NULL,
	password nVARCHAR(255) NOT NULL,
	dataBaseName nVARCHAR(255) NOT NULL,
	creationDate datetime NOT NULL,
	createdBy int	NOT NULL,
	deletionDate datetime,
	deletedBy int,
);
go

CREATE TABLE site( 
	idSite int identity(1,1) PRIMARY KEY,
	code nVARCHAR(50) NOT NULL,
	nom nVARCHAR(50) NOT NULL,
	creationdate datetime NOT NULL,
	createdby int NOT NULL,
	deletiondate datetime,
	deletedby int,
);
go

CREATE TABLE utilisateurProjet( 
	idUtilisateurProjet int identity(1,1) PRIMARY KEY,
	idUtilisateur int references utilisateur(idUtilisateur),
	idProjet int references projet(idProjet),
);
go

CREATE TABLE utilisateurSite( 
	idUtilisateurSite int identity(1,1) PRIMARY KEY,
	idUtilisateur int references utilisateur(idUtilisateur),
	idSite int references site(idSite),
);
go

CREATE TABLE entete( 
	idEntete int identity(1,1) PRIMARY KEY,
	idUtilisateurAGMO int references Utilisateur(idUtilisateur),
	firstn nVARCHAR(255),
	seconden nVARCHAR(255),
	thirdn nVARCHAR(255),
	fourthn nVARCHAR(255),
	fifthn nVARCHAR(255),
	creationdate datetime NOT NULL,
	createdby int	NOT NULL
);
go

CREATE TABLE activite( 
	idActivite int identity(1,1) PRIMARY KEY,
	idProjet int references projet(idProjet) NOT NULL,
	code nVARCHAR(10) NOT NULL,
	nom nVARCHAR(255) NOT NULL,
	creationdate datetime NOT NULL,
	createdby int	NOT NULL,
	deletiondate datetime,
	deletedby int
);
go

CREATE TABLE TypeRequete (
    idTypeRequete INT IDENTITY(1,1) PRIMARY KEY,
    nom NVARCHAR(MAX) NOT NULL,
    delaiJustification INT NULL,
    modeJustification NVARCHAR(MAX) NOT NULL
);
go

CREATE TABLE requete(
	idRequete int identity(1,1) PRIMARY KEY,
	/*idTypeRequete int references typeRequete(idTypeRequete),*/
	idUtilisateur int references utilisateur(idUtilisateur),
	idProjet int references projet(idProjet),
	codeActiviteTom varchar(50),
	intituleActiviteTom varchar(50),
	numRequete varchar(255),
	/*idCircuit int references circuit(idCircuit),
	idCircuitEtape int references circuitEtape(idCircuitEtape),
	etatValidation int, /*en cours , refusé,validé*/*/
	dateExecution DATE,
	description VARCHAR(MAX)
);
go

CREATE TABLE typeRubrique(
	idTypeRubrique int identity(1,1) PRIMARY KEY,
	nom VARCHAR(255) NOT NULL
)
go

CREATE TABLE categorieRubrique(
	idCategorieRubrique int identity(1,1) PRIMARY KEY,
	nom VARCHAR(255) NOT NULL
)
go

CREATE TABLE typeCategorieRubrique(
	idtypeCategorieRubrique int identity(1,1) PRIMARY KEY,
	idTypeRubrique int references typeRubrique(idTypeRubrique),
	idCategorieRubrique int references categorieRubrique(idCategorieRubrique)
)
go

CREATE TABLE unit(
	idUnit int identity(1,1) PRIMARY KEY,
	nom  VARCHAR(50)
)
go

CREATE TABLE rubrique(
	idRubrique int identity(1,1) PRIMARY KEY,
	nom VARCHAR(255) NOT NULL
)
go

CREATE TABLE rubriqueCategorieRubrique(
	idRubriqueCategorieRubrique int identity(1,1) PRIMARY KEY,
	idRubrique int references rubrique(idRubrique),
	idCategorieRubrique int references categorieRubrique(idCategorieRubrique)
)
go

CREATE TABLE categorieRubriqueColonne(
	idCategorieRubriqueColonne int identity(1,1) PRIMARY KEY,
	idCategorieRubrique int references categorieRubrique(idCategorieRubrique),
	nom VARCHAR(50) NOT NULL,
	dataType VARCHAR(50) NOT NULL,
	isFormule int,
)
go


ALTER TABLE categorieRubriqueColonne ADD formule NVARCHAR(255)  ;
go

CREATE TABLE requeteRubrique(
	idRequeteRubrique int identity(1,1) PRIMARY KEY,
	idRequete int references requete(idRequete),
	idRubrique int references rubrique(idRubrique),
	idCategorieRubriqueColonne int references categorieRubriqueColonne(idCategorieRubriqueColonne),
	valeur VARCHAR(255)
)
go

CREATE TABLE requeteJustificatif(
	idRequeteJustificatif int identity(1,1) PRIMARY KEY,
	idRequete int references requete(idRequete),
	src NVARCHAR(255) NOT NULL,
	dateCreation DATETIME NOT NULL
);
go

CREATE TABLE circuit(
	idCircuit int identity(1,1) PRIMARY KEY,
	intitule nVARCHAR(255) NOT NULL,
	creationdate datetime NOT NULL,
	createdby int	NOT NULL,
	deletiondate datetime,
	deletedby int,
	isdisabled bit
);
go

CREATE TABLE circuitEtape(
	idCircuitEtape int identity(1,1) PRIMARY KEY,
	idCircuit int references circuit(idCircuit),
	numero int,
	description nVARCHAR(255) NOT NULL,
	duree int NOT NULL,
	isPassMarche bit,
	creactiondate datetime NOT NULL,
	createdby int	NOT NULL,
	deletiondate datetime,
	deletedby int
);
go

CREATE TABLE circuitEtapeCheckList(
	idCircuitEtapeCheckList int identity(1,1) PRIMARY KEY,
	idCircuitEtape int references circuitEtape(idCircuitEtape),
	code nvarchar(50) NOT NULL,
	libelle nvarchar(255) NOT NULL,
	creactiondate datetime NOT NULL,
	createdby int	NOT NULL,
	deletiondate datetime,
	deletedby int
);
go

CREATE TABLE circuitEtapeValidateur(
	idCircuitEtapeValidateur int identity(1,1) PRIMARY KEY,
	idCircuitEtape int references circuitEtape(idCircuitEtape),
	idValidateur int,
	numero int,
	creactiondate datetime NOT NULL,
	createdby int	NOT NULL,
	deletiondate datetime,
	deletedby int
);
go

CREATE TABLE circuitProjet( 
	idCircuitProjet int identity(1,1) PRIMARY KEY,
	idCircuit int references circuit(idCircuit),
	idProjet int references projet(idProjet),
);
go

CREATE TABLE circuitSite( 
	idCircuitSite int identity(1,1) PRIMARY KEY,
	idCircuit int references circuit(idCircuit),
	idSite int references site(idSite),
);
go



/*CREATE TABLE circuitSousEtape(
	idCircuitSousEtape int identity(1,1) PRIMARY KEY,
	idCircuitEtape int references circuit(idCircuit),
	numero int,
	description VARCHAR(255) NOT NULL
);
go
 */

CREATE TABLE historiqueValidationRequete(
	idHistoriqueValidationRequete int identity(1,1) PRIMARY KEY,
	idRequete int references requete(idRequete),
	idCircuitEtape int NOT NULL,
	etatValidation int NOT NULL,
	commentaire NVARCHAR(max),
	dateValidation DATETIME,
	idValidateur int,
	isPotential bit,
	isValidator bit,
	creactiondate datetime NOT NULL,
	createdby int	NOT NULL
);
go
/*CREATE TABLE historiqueValidationRequeteSousEtape( /*case à cocher*/
	idHistoriqueValidationRequeteSousEtape int identity(1,1) PRIMARY KEY,
	idRequete int references requete(idRequete),
	idCircuitSousEtape int references circuitSousEtape(idCircuitSousEtape)
);
go*/

CREATE TABLE historiqueValidationRequeteCheckList(
	idHistoriqueValidationRequeteCheckList int identity(1,1) PRIMARY KEY,
	idRequete int references requete(idRequete),
	idCircuitEtape int NOT NULL,
	idCircuitEtapeCheckList int NOT NULL,
	oui int,
	non bit,
	nonapplicable bit,
	creactiondate datetime NOT NULL,
	createdby int	NOT NULL
);
go

CREATE TABLE historiqueValidationRequetePj(
	idHistoriqueValidationRequetePj int identity(1,1) PRIMARY KEY,
	idHistoriqueValidationRequete int references historiqueValidationRequete(idHistoriqueValidationRequete),
	src NVARCHAR(255) NOT NULL,
	dateCreation DATETIME NOT NULL
);
go

CREATE TABLE historiqueValidationJustificatifPj(
	idHistoriqueValidationJustificatifPj int identity(1,1) PRIMARY KEY,
	idHistoriqueValidationJustificatif int references historiqueValidationJustificatif(idHistoriqueValidationJustificatif),
	src NVARCHAR(255) NOT NULL,
	dateCreation DATETIME NOT NULL
);
go

CREATE TABLE utilisateurCC( 
	idUtilisateurCC int identity(1,1) PRIMARY KEY,
	idUtilisateur int references utilisateur(idUtilisateur),
	mailCC nvarchar(max)
);
go


CREATE TABLE justificatif(
	idJustif int identity(1,1) PRIMARY KEY,
	idRequete int references requete(idRequete),
	numero int,
	creationdate datetime NOT NULL,
	etatValidation int,
	objet NVARCHAR(255) NOT NULL
);
go

CREATE TABLE justifDetails(
	idJustifDetails int identity(1,1) PRIMARY KEY,
	idJustif int references justificatif(idJustif),
	idCategorieRubrique int references categorieRubrique(idCategorieRubrique),
	idRubrique int references rubrique(idRubrique)
);
go

CREATE TABLE justifPj(
	idJustifPj int identity(1,1) PRIMARY KEY,
	idJustif int references justificatif(idJustif),
	src NVARCHAR(255) NOT NULL
);
go

CREATE TABLE CircuitJustificatif (
    idCircuitJustificatif INT IDENTITY(1,1) PRIMARY KEY,
    idJustif INT references justificatif(idJustif),
    idCircuit INT references circuit(idCircuit)
);
go

CREATE TABLE HistoriqueValidationJustificatif (
    idHistoriqueValidationJustificatif INT IDENTITY(1,1) PRIMARY KEY,
    idJustif INT  references justificatif(idJustif),
    idCircuitEtape INT references circuitetape(idCircuitEtape),
    numero INT ,
    etatValidation INT NOT NULL,
    commentaire NVARCHAR(MAX) NULL,
    dateValidation DATETIME NULL,
    idValidateur INT NULL,
    isPotential BIT NULL,
    isValidator BIT NULL,
    creationdate DATETIME NOT NULL,
    createdby INT NOT NULL,
    isPassMarche BIT NULL,
    isPassMarcheSkyp BIT NULL
);
go

CREATE TABLE HistoriqueValidationJustificatifCheckList (
    idHistoriqueValidationJustificatifCheckList INT IDENTITY(1,1) PRIMARY KEY,
    idJustif INT  references justificatif(idJustif),
    idCircuitEtape INT references circuitetape(idCircuitEtape),
    idCircuitEtapeCheckList INT references circuitetapechecklist(idCircuitEtapeCheckList),
    oui BIT NULL,
    non BIT NULL,
    nonapplicable BIT NULL,
    creationdate DATETIME NOT NULL,
    createdby INT NOT NULL
);
go

CREATE TABLE HistoriqueValidationJustificatifRedirection (
    idHistoriqueValidationJustificatifRedirection INT IDENTITY(1,1) PRIMARY KEY,
    idJustif INT  references justificatif(idJustif),
    idfrom INT  references utilisateur(idUtilisateur),
    idto INT references utilisateur(idUtilisateur),
    isValidator INT NOT NULL,
    commentaire NVARCHAR(MAX) NULL,
    creationdate DATETIME NOT NULL,
);
go

CREATE TABLE JustificatifAccuse (
    idJustifAccuse INT IDENTITY(1,1) PRIMARY KEY,
    idJustif INT  references justificatif(idJustif),
    creationdate DATETIME NOT NULL,
    createdby INT  references utilisateur(idUtilisateur),
    justifNumero INT NULL,
    justifYear INT NULL,
    justifSite NVARCHAR(MAX) NULL,
    referenceInterne NVARCHAR(MAX) NULL
);
go

CREATE TABLE Agmo (
    idAgmo INT IDENTITY(1,1) PRIMARY KEY,
    nom NVARCHAR(MAX) NOT NULL,
    creationdate DATETIME NULL,
    createdby INT references utilisateur(idUtilisateur),
    deletiondate DATETIME NULL,
    deletedby INT NULL
);
go

ALTER TABLE justifDetails ADD montant float  ;
go

ALTER TABLE justificatif ADD message NVARCHAR(255)  ;
go

ALTER TABLE utilisateur ADD idAgmo int references agmo(idAgmo)   ;
go

ALTER TABLE justificatif
ALTER COLUMN numero NVARCHAR(255);
go

Insert into role values("SuperAdmin");
Insert into role values("Admin");
Insert into role values("Utilisateur");
Insert into role values("AGMO");

go

ALTER TABLE requete ADD idTypeRequete int  ;
go

ALTER TABLE requete ADD objet NVARCHAR(255)  ;
go

ALTER TABLE IntituleActiviteInterne ADD IntituleActiviteInterne NVARCHAR(255)  ;
go

ALTER TABLE requete ADD copie_a NVARCHAR(255)  ;
go

ALTER TABLE requete ADD compte_rendu NVARCHAR(255)  ;
go

ALTER TABLE requete ADD manquePj bit  ;
go

ALTER TABLE categorierubriquecolonne ADD role NVARCHAR(255)  ;
go




/*somme montant par categorie d'une requete*//*requete = 2 , categorie 4,rubrique = 6  TOTAL_VALIDE*/
ALTER FUNCTION getSommeCategoriesOfRequete(@idRequete INT)
RETURNS TABLE 
AS
RETURN(
	select categorierubrique.*,SUM(TRY_CAST(valeur AS FLOAT) ) total  FROM 
	(select requeterubrique.*,categorieRubriqueColonne.idcategorierubrique from requeterubrique join categorieRubriqueColonne on requeterubrique.idcategorieRubriqueColonne = categorieRubriqueColonne.idcategorieRubriqueColonne and categorieRubriqueColonne.nom = 'total_valide'  where idrequete = @idRequete) tab
	join categorierubrique on tab.idcategorierubrique = categorierubrique.idcategorierubrique
	group by categorierubrique.idcategorierubrique,categorierubrique.nom
	
)
go

/*somme montant par categorie d'une requete*//*requete = 2 , categorie 4,rubrique = 6* TOTAL/ 
ALTER FUNCTION getSommeCategoriesOfRequete(@idRequete INT)
RETURNS TABLE 
AS
RETURN(
	select categorierubrique.*,SUM(TRY_CAST(valeur AS FLOAT) ) total  FROM 
	(select requeterubrique.*,categorieRubriqueColonne.idcategorierubrique from requeterubrique join categorieRubriqueColonne on requeterubrique.idcategorieRubriqueColonne = categorieRubriqueColonne.idcategorieRubriqueColonne and categorieRubriqueColonne.nom = 'total'  where idrequete = @idRequete) tab
	join categorierubrique on tab.idcategorierubrique = categorierubrique.idcategorierubrique
	group by categorierubrique.idcategorierubrique,categorierubrique.nom
	
)
go
*/
/*categories d'une requete*/
CREATE FUNCTION getCategoriesOfRequete(@idRequete INT)
RETURNS TABLE 
AS
RETURN(
select categorierubrique.* from categorierubrique join
(select distinct categorieRubriqueColonne.idcategorierubrique from requeterubrique join categorieRubriqueColonne on requeterubrique.idcategorieRubriqueColonne = categorieRubriqueColonne.idcategorieRubriqueColonne where idrequete = @idRequete ) tab
on categorierubrique.idcategorierubrique = tab.idcategorierubrique
)
go

/*rubriques d'une requete et categorie*/
CREATE FUNCTION getRubriquesOfCategorieAndRequete(@idRequete INT,@idCategorieRubrique INT)
RETURNS TABLE 
AS
RETURN(
select rubrique.* from rubrique join 
(select distinct requeterubrique.idrubrique from requeterubrique join categorieRubriqueColonne on requeterubrique.idcategorieRubriqueColonne = categorieRubriqueColonne.idcategorieRubriqueColonne where idrequete = @idRequete and categorieRubriqueColonne.idcategorierubrique = @idCategorieRubrique) tab 
on rubrique.idrubrique = tab.idrubrique
)
go

/*requeterubrique d'une requete et rubrique*/
ALTER FUNCTION getRequeteRubriquesOfRubriqueAndRequete(@idRequete INT,@idRubrique INT, @idCategorie INT)
RETURNS TABLE 
AS
RETURN(
select requeterubrique.* from requeterubrique join categorierubriquecolonne on requeterubrique.idCategorieRubriqueColonne = categorierubriquecolonne.idCategorieRubriqueColonne and categorierubriquecolonne.idCategorieRubrique = @idCategorie where idrequete = @idRequete and idrubrique = @idRubrique
)
go

CREATE FUNCTION getRequeteRubriquesOfRubriqueAndRequeteAndType(@idRequete INT,@idRubrique INT, @idCategorie INT, @idType INT)
RETURNS TABLE 
AS
RETURN(
select requeterubrique.* from requeterubrique join categorierubriquecolonne on requeterubrique.idCategorieRubriqueColonne = categorierubriquecolonne.idCategorieRubriqueColonne and categorierubriquecolonne.idCategorieRubrique = @idCategorie where idrequete = @idRequete and idrubrique = @idRubrique and requeterubrique.idTypeRubrique = @idType
)
go


ALTER TABLE requete ADD idSite int references site(idSite) ;
go

ALTER TABLE requete ADD numRequete varchar(255) ;
go

ALTER TABLE requete ADD numActiviteInterne NVARCHAR(255) ;
go

ALTER TABLE categorierubriquecolonne ADD numero int ;
go

ALTER TABLE requete ADD lieu VARCHAR(50) ;
go

ALTER TABLE requete ADD dateFinExecution DATE ;
go

ALTER TABLE utilisateur ADD idAgmo int references agmo(idAgmo) ;
go

ALTER TABLE requete
ALTER COLUMN numRequete NVARCHAR(255);
go

ALTER TABLE requete
ALTER COLUMN intituleActiviteTom NVARCHAR(255);
go

EXEC sp_rename 'justificatifdetails.idjustificatif', 'idJustif', 'COLUMN';
go

select tab1.* from
(select tab.* from 
(select requete.* from requetejustificatif join requete on requete.idrequete = requetejustificatif.idrequete) tab
join utilisateursite on utilisateursite.idsite = tab.idsite where utilisateursite.idutilisateur = 8) tab1
join utilisateurprojet on utilisateurprojet.idprojet = tab1.idprojet where utilisateurprojet.idutilisateur = 8
go

ALTER TABLE CircuitEtapeValidateur ADD isPassMarche bit ;
go

ALTER TABLE HistoriqueValidationRequete ADD isPassMarche bit ;
go

ALTER TABLE CircuitEtapeValidateur
ALTER COLUMN isPassMarche bit ;
go

ALTER TABLE HistoriqueValidationRequete
ALTER COLUMN isPassMarche bit ;
go

ALTER TABLE HistoriqueValidationRequete ADD numero bit ;
go

ALTER TABLE HistoriqueValidationRequete
ALTER COLUMN numero int ;
go

ALTER TABLE HistoriqueValidationRequete ADD isPassMarcheSkyp bit ;
go

CREATE TABLE CircuitRequete( 
	idCircuitRequete int identity(1,1) PRIMARY KEY,
	idRequete int references requete(idRequete),
	idCircuit nvarchar(max)
);
go

ALTER TABLE requete ADD EtatValidation int ;
go

ALTER TABLE justificatif ADD idUtilisateur int REFERENCES Utilisateur(idUtilisateur);
go
ALTER TABLE justificatif ADD montant float ;
go

ALTER TABLE justifPj ADD dateCreation DATETIME ;
go

ALTER TABLE requete ADD referenceInterne NVARCHAR(255) ;
go


ALTER TABLE requete ADD cloture bit ;
go

ALTER TABLE requete ADD cloturedate DATETIME ;
go


ALTER TABLE requete ADD clotureby int ;
go

ALTER TABLE requete ADD creationdate DATETIME ;
go

ALTER TABLE requete ADD montant float ;
go

ALTER TABLE requete ADD objet NVARCHAR(255) ;
go

ALTER TABLE requete ADD montantValide float ;
go


ALTER TABLE requete
ALTER COLUMN creationdate DATETIME ;
go

ALTER TABLE circuitEtape ADD isModifiable BIT;
go

ALTER TABLE circuitEtape ADD isRefusable BIT;
go

ALTER TABLE circuitEtape ADD checkBudget BIT;
go







CREATE TABLE RequeteAccuse (
    idRequeteAccuse INT IDENTITY(1,1) PRIMARY KEY,
    idRequete INT REFERENCES Requete(idRequete),
    creationdate DATETIME,
    createdby INT,
    requeteNumero INT,
    requeteYear INT,
    requeteSite VARCHAR(255),
    referenceInterne VARCHAR(255)
);
go

CREATE TABLE HistoriqueValidationRequeteRedirection (
    idHistoriqueValidationRequeteRedirection INT IDENTITY(1,1) PRIMARY KEY,
    idRequete INT references requete(idrequete),
    idfrom INT references circuitetape(idcircuitetape),
    idto INT references circuitetape(idcircuitetape),
    isValidator INT,
    commentaire NVARCHAR(max),
    creationdate DATETIME NOT NULL,

);
go
select top 1 * from historiquevalidationrequete where etatvalidation != 0
go

/*  état de la requete à chaque étape*/
select * from (select historiquevalidationrequete.* ,  row_number() over (partition by idrequete,idcircuitetape order by etatValidation desc) as rank from historiquevalidationrequete ) tab
where rank = 1
go

/*étape actuelle des requetes */
select circuitetape.numero from
(select tab1.*,row_number() over (partition by idrequete order by idcircuitetape) as rank2 from 
(select * from (select historiquevalidationrequete.* ,  row_number() over (partition by idrequete,idcircuitetape order by etatValidation desc) as rank from historiquevalidationrequete where idrequete = 17  ) tab
where rank = 1) tab1 where etatvalidation = 0 and dateValidation is null) tab2
join circuitetape on circuitetape.idcircuitetape = tab2.idcircuitetape where rank2 = 1
go

/*validateur de pour l'étape actuelle*/
select * from (select *,MAX(rank2) OVER (PARTITION BY idrequete) etape_actuelle from
(select idrequete,idcircuitetape,idvalidateur,dense_rank() over (partition by idrequete order by idcircuitetape) as rank2 from 
(select historiquevalidationrequete.*, row_number() over (partition by idrequete,idcircuitetape order by etatValidation desc) as rank from historiquevalidationrequete  ) tab2
where isPotential = 1 and etatvalidation = 0) tab3) tab4 where rank2 = etape_actuelle
go

/* requete à valider pour le validateur */
select requete.* from
( select * from (select *,MAX(rank2) OVER (PARTITION BY idrequete) etape_actuelle from
(select idrequete,idcircuitetape,idvalidateur,dense_rank() over (partition by idrequete order by idcircuitetape) as rank2 from 
(select historiquevalidationrequete.*, row_number() over (partition by idrequete,idcircuitetape order by etatValidation desc) as rank from historiquevalidationrequete  ) tab2
where isPotential = 1 and datevalidation is null ) tab3) tab4 where rank2 = etape_actuelle and tab4.idvalidateur = 3 ) tab5
join requete on tab5.idrequete = requete.idrequete
go



/*pj par validation d'une requete*/
select historiquevalidationrequetepj.* from historiquevalidationrequetepj
join (select * from historiquevalidationrequete where idrequete = 6 and etatvalidation !=0) tab 
on historiquevalidationrequetepj.idhistoriquevalidationrequete = tab.idhistoriquevalidationrequete
go



/*liste des requêtes cloturées*/
select * from requete where etatvalidation = 5

/*liste des requêtes refusées*/
/*select distinct requete.* from historiquevalidationrequete join requete on requete.idrequete = historiquevalidationrequete.idrequete where historiquevalidationrequete.etatvalidation = 2 */
select * from requete where etatvalidation = 2
/*en cours de validation validateur*/
/* sady tsy anaty refusée no validée */


ALTER TABLE HistoriqueValidationRequeteCheckList
ALTER COLUMN oui bit ;
go



select requeterubrique.valeur from requeterubrique join categorierubriquecolonne on requeterubrique.idcategorierubriquecolonne = categorierubriquecolonne.idcategorierubriquecolonne and categorierubriquecolonne.nom = 'Total' where idRubrique = 1 and idCategorieRubrique = 1 and idRequete = 6

/*montant total d'un justificatif d'une rubrique de requete*/
select sum(montant) montant from justifdetails join  justificatif on justifdetails.idjustificatif = justificatif.idjustificatif where idRequete = 6 and idRubrique = 1 and idCategorieRubrique = 1 group by justifdetails.idjustificatif
go

/*nombre de séance de justificatif d'une requete*/
select count(idjustificatif) value from justificatif where idrequete = 6

/*montant total d'une requete*/
select SUM(TRY_CAST (valeur as float)) value from requeterubrique join categorierubriquecolonne on requeterubrique.idcategorierubriquecolonne = categorierubriquecolonne.idcategorierubriquecolonne where categorierubriquecolonne.nom = 'Total' and idRequete = 6
go

select tab4.* from 
(select tab3.* from
(select tab1.*, requete.idprojet, requete.idsite from
(select * from (select justificatif.*,coalesce(tab.exist,0) exist from justificatif 
left join (select  idJustif exist from circuitjustificatif) tab on justificatif.idJustif = tab.exist ) tab where exist = 0) tab1
join requete on tab1.idRequete = requete.idRequete) tab3
join utilisateursite on utilisateursite.idsite = tab3.idsite where utilisateursite.idutilisateur = 8 ) tab4
join utilisateurprojet on utilisateurprojet.idprojet = tab4.idprojet where utilisateurprojet.idutilisateur = 8
go

/*justificatif à valider pour validateur*/
select justificatif.* from
( select * from (select *,MAX(rank2) OVER (PARTITION BY idjustif) etape_actuelle from
(select idjustif,idcircuitetape,idvalidateur,dense_rank() over (partition by idjustif order by idcircuitetape) as rank2 from 
(select historiquevalidationjustificatif.*, row_number() over (partition by idjustif,idcircuitetape order by etatValidation desc) as rank from historiquevalidationjustificatif  ) tab2
where isPotential = 1 and etatvalidation = 0) tab3) tab4 where rank2 = etape_actuelle and tab4.idvalidateur = @p0 ) tab5
join justificatif on tab5.idjustif = justificatif.idjustif where justificatif.etatValidation != 2 and justificatif.etatValidation != 5
go


/*check droit demande requete*/
select count(idrequete) nb from (select tab.idrequete,coalesce(justificatif.idjustif,0) idjustif from (select requete.idrequete,utilisateur.idagmo from requete join utilisateur on utilisateur.idutilisateur = requete.idutilisateur where EtatValidation = 5 and utilisateur.idagmo = 1 and DATEADD(DAY,15,requete.datefinexecution) <= CAST(GETDATE() AS DATE)) tab left join justificatif on tab.idrequete = justificatif.idrequete ) tab1 where idjustif = 0


select * from (select requeterubrique.*, categorierubriquecolonne.idcategorierubrique, categorierubriquecolonne.numero from requeterubrique join categorierubriquecolonne on requeterubrique.idcategorierubriquecolonne = categorierubriquecolonne.idcategorierubriquecolonne and idRequete = 6 where idcategorierubrique = 1) tab order by numero asc

ALTER TABLE justifDetails
DROP COLUMN idRubrique;

/* requêtes en cours de validation pour utilisateur*/
select requete.* from
(select tab.* from
(select  circuitrequete.*,requete.EtatValidation from circuitrequete
join requete on requete.idRequete = circuitrequete.idRequete and requete.EtatValidation != 5 and requete.EtatValidation != 2) tab
join (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = 3) tab2 on tab.idCircuit = tab2.idCircuit) tab3
join requete on requete.idrequete = tab3.idrequete

/*requêtes à cloturer*/
select requete.* from
(select distinct idrequete from
(select tab.* from
(select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif
join justificatif on justificatif.idJustif = circuitjustificatif.idJustif and justificatif.EtatValidation = 5 ) tab
join (select distinct circuitetape.idcircuit from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = 3) tab2 on tab.idCircuit = tab2.idCircuit) tab3
join justificatif on justificatif.idJustif = tab3.idJustif) tab4
join requete on tab4.idrequete = requete.idrequete where requete.cloturedate is null


ALTER TABLE utilisateur ADD isClotureur BIT ;
go


/* requêtes refusées par validateur*/
select requete.* from
(select tab.* from
(select  circuitrequete.*,requete.EtatValidation from circuitrequete
join requete on requete.idRequete = circuitrequete.idRequete and requete.EtatValidation = 2 ) tab
join (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = 3) tab2 on tab.idCircuit = tab2.idCircuit) tab3
join requete on requete.idrequete = tab3.idrequete

/* requêtes cloturées par validateur*/
select requete.* from
(select tab.* from
(select  circuitrequete.*,requete.EtatValidation from circuitrequete
join requete on requete.idRequete = circuitrequete.idRequete and requete.cloturedate is not null ) tab
join (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3
join requete on requete.idrequete = tab3.idrequete

/* justificatifs en cours de validation pour utilisateur*/
select justificatif.* from
(select tab.* from
(select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif
join justificatif on justificatif.idJustif = circuitjustificatif.idJustif and justificatif.EtatValidation != 5 and justificatif.EtatValidation != 2) tab
join (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3
join justificatif on justificatif.idJustif = tab3.idJustif

/* justificatifs refusées par validateur*/
select justificatif.* from
(select tab.* from
(select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif
join justificatif on justificatif.idJustif = circuitjustificatif.idJustif and justificatif.EtatValidation = 2 ) tab
join (select distinct circuitetape.idcircuit  from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 on tab.idCircuit = tab2.idCircuit) tab3
join justificatif on justificatif.idJustif = tab3.idJustif

/*alerte requete*/
select tab3.* from
(select tab2.* from
(select tab1.* from
(select tab.*, COALESCE(idJustif,0) justif from 
(select * from requete where EtatValidation = 4 ) tab
left join justificatif on tab.idrequete = justificatif.idrequete) tab1
where justif = 0) tab2 where datefinexecution > CAST(GETDATE() AS DATE)) tab3
WHERE DATEDIFF(DAY, dateFinExecution, GETDATE()) <= 5

select * from utilisateur where username LIKE @p0 or email LIKE @p0 or firstname LIKE @p0 or lastname LIKE @p0 or fonction LIKE @p0 

/*recherche utilisateur*/
select utilisateur.* from utilisateur 
join role on role.idrole = utilisateur.idrole and role.nom LIKE '@p0%'
join agmo on agmo.idagmo = agmo.idagmo and agmo.nom LIKE '%@p0%'
where username LIKE 'a%' or email LIKE 'a%' or firstname LIKE '@p0%' or lastname LIKE '@p0%' or fonction LIKE '@p0%' 

ALTER TABLE requeterubrique ADD idTypeRubrique int references typeRubrique(idTypeRubrique) ;
go

ALTER TABLE requete ADD nbRappel int ;
go

ALTER TABLE requete ADD lastRappel DATE ;
go

ALTER TABLE requete ADD nextRappel DATE ;
go

ALTER TABLE requete ADD pourinformations VARCHAR(255) ;
go

ALTER TABLE requete ADD dateSoumission DATE ;
go

ALTER TABLE requete ADD numBudget int ;
go

update categorierubriquecolonne set formule = '( [nb_voiture] * [nb_personne] )' where idcategorierubriquecolonne = 28;
update categorierubriquecolonne set formule = '( [nb_voiture] * [nb_personne] )' where idcategorierubriquecolonne = 29;

ALTER TABLE justificatif ADD montantValide float ;
go

ALTER TABLE justifDetails ADD montantValide float ;
go


ALTER TABLE categorierubriquecolonne ADD formule NVARCHAR(255) ;
go

ALTER TABLE justificatif ADD manquePj bit  ;
go

ALTER TABLE typeRubrique ADD needJustificatif bit  ;
go

ALTER TABLE requete ADD commentaireRevision NVARCHAR(255)  ;
go

ALTER TABLE requete ADD numBr NVARCHAR(255)  ;
go

ALTER TABLE requete ADD exercice int  ;
go


ALTER TABLE justificatif ADD commentaireRevision NVARCHAR(255)  ;
go

ALTER TABLE justifDetails ADD commentaire NVARCHAR(255)  ;
go

ALTER TABLE utilisateur ADD canDeleteAttachment BIT ;
go

ALTER TABLE HistoriqueValidationRequetePj ADD DateSuppression DATETIME ;
go

ALTER TABLE HistoriqueValidationJustificatifPj ADD DateSuppression DATETIME ;
go

ALTER TABLE circuitrequete ADD creationDate DATETIME ;
go

ALTER TABLE categorierubriquecolonne ADD role NVARCHAR(255) ;
go







/* requêtes tsy mila justificatif */
select distinct requeterubrique.idrequete from requeterubrique 
join typerubrique on requeterubrique.idtyperubrique = typerubrique.idtyperubrique and typerubrique.needJustificatif = 0

/* à justifier */
select count(idrequete) value from (select tab_a_justifier2.* from (select * from (select requete.*,coalesce(justif_valide.idJustif,0) justif from requete
left join (select justificatif.idJustif,justificatif.idrequete from justificatif where etatValidation != 2) justif_valide on requete.idRequete = justif_valide.idRequete
where requete.etatvalidation = 5) tab_a_justifier
where justif = 0) tab_a_justifier2 
where etatvalidation = 5 and cloturedate is null and tab_a_justifier2.idutilisateur = @p0 ) tab

/*à cloturer*/ /*la partie après anle union ny requete tsy mila justificatif de tao anatinle circuit anle validateur*/
select * from (select a_cloturer.*,site.nom nomsite,projet.nom nomprojet,utilisateur.idagmo,agmo.nom nomagmo from 
(select requete.* from (select distinct idrequete from 
(select tab.* from (select  circuitjustificatif.*,justificatif.EtatValidation from circuitjustificatif 
join justificatif on justificatif.idJustif = circuitjustificatif.idJustif and justificatif.EtatValidation = 5 ) tab
join (select distinct circuitetape.idcircuit from circuitEtapeValidateur  join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p0) tab2 
on tab.idCircuit = tab2.idCircuit) tab3 join justificatif on justificatif.idJustif = tab3.idJustif) tab4 
join requete on tab4.idrequete = requete.idrequete where requete.cloturedate is null
UNION
select tab9.* from (select requete.* from
(select distinct requeterubrique.idrequete from requeterubrique 
join typerubrique on requeterubrique.idtyperubrique = typerubrique.idtyperubrique and typerubrique.needJustificatif = 0) tab6
join requete on requete.idrequete = tab6.idrequete where etatValidation = 5) tab9
join
(select circuitrequete.idrequete from
(select distinct circuitetape.idcircuit from circuitEtapeValidateur  
join circuitetape on circuitetape.idcircuitetape = circuitetapevalidateur.idcircuitetape where idValidateur = @p1) tab7
join circuitrequete on circuitrequete.idcircuit = tab7.idcircuit) tab8
on tab9.idrequete = tab8.idrequete) a_cloturer
join site on site.idsite = a_cloturer.idsite
join projet on projet.idprojet = a_cloturer.idprojet
join utilisateur on utilisateur.idUtilisateur = a_cloturer.idutilisateur
join agmo on agmo.idagmo = utilisateur.idagmo) a_justifier_recherche
where nomprojet LIKE @p1 or nomsite LIKE @p1 or referenceInterne LIKE @p1 or objet LIKE @p1 or numRequete LIKE @p1 or nomagmo LIKE @p1 or montant LIKE @p1 or dateExecution LIKE @p1 or dateFinExecution LIKE @p1



select * from (select tab2.*, coalesce(circuitrequete.idcircuitrequete,0) existence from 
(select distinct tab1.* from (select tab.* from 
(select requete.* from requetejustificatif join requete on requete.idrequete = requetejustificatif.idrequete) tab join utilisateursite on utilisateursite.idsite = tab.idsite where utilisateursite.idutilisateur = @p0) tab1 
join utilisateurprojet on utilisateurprojet.idprojet = tab1.idprojet where utilisateurprojet.idutilisateur = @p1) tab2 left join circuitrequete on tab2.idrequete = circuitrequete.idrequete) tab3 where existence = 0