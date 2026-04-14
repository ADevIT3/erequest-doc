import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from "sonner"
import { ProtectedRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import RubricsInsert from './pages/requetes/RubricsInert'
import RubricsInsertModification from './pages/requetes/RubricsInsertModification'
import ParametragePage from './pages/parametrage'
import TypePage from './pages/parametrage/type'
import CategoriePage from './pages/parametrage/categorie'
import RubriquePage from './pages/parametrage/rubrique'
import AssignationPage from './pages/parametrage/assignation'
import User from './pages/parametrage/User'
import Role from './pages/parametrage/Role'
import Site from './pages/parametrage/Site'
import Projet from './pages/parametrage/Projet'
import EntetePage from './pages/parametrage/entete'
import RequetesPage from './pages/requetes/ListeRequete';
import RequetesPageMinistere from './pages/requetes/ListeRequeteMinistere';
import Layout from './components/layout/Layout';
import AjouterCircuit from './pages/circuit/AjouterCircuit';
import ListCircuit from './pages/circuit/ListCircuit';
import AssignationTypeCategoriePage from './pages/parametrage/assignation-type-categorie';
import AssignationCategorieRubriquePage from './pages/parametrage/assignation-categorie-rubrique';
import AssignationRubriqueColonnePage from './pages/parametrage/assignation-categorie-colonne';
// import NotificationsPage from './pages/parametrage/notifications';
import RequetesValidateurPage from './pages/requetes/ListeRequeteValidateur';
import ModifCircuit from './pages/circuit/ModifCircuit';
import ModifCircuitV2 from './pages/circuit/ModifCircuitV2';
import UnitsPage from './pages/parametrage/units';
import ListRequeteEnCours from './pages/requetes/ListeRequeteEnCours';
import ListeRequeteRefusees from './pages/requetes/ListeRequeteRefusees';
import ListeRequeteRefuseesValidateur from './pages/requetes/ListeRequeteRefuseesValidateur';
import ListRequeteEnCoursValidateur from './pages/requetes/ListeRequeteEnCoursValidateur';
import RequetesValidateurAvalider from './pages/requetes/ListeRequeteAvalider';
import DetailsRequetes from './pages/requetes/DetailsRequetes';
import ListeRequeteAjustifier from './pages/requetes/ListeRequeteAjustifier';
import ListeRequeteCloturees from './pages/requetes/ListeRequeteCloturees';
import ListeRequeteClotureesValidateur from './pages/requetes/ListeRequeteClotureesValidateur';
import ListeRequeteAcloturer from './pages/requetes/ListeRequeteAcloturer';
import ListeRequeteManquePj from './pages/requetes/ListeRequeteManquePj';
import ListeRequeteValidesValidateur from './pages/requetes/ListeRequeteValidesValidateur';
import AjoutJustificatif from './pages/justificatifs/AjoutJustificatif';
import TypeRequetePage from './pages/parametrage/typesRequete'
import TypeAgmo from './pages/parametrage/TypeAgmo'

import ListeJustifArattacherCircuit from './pages/justificatifs/ListeJustifArattacherCircuit';
import ListeJustifAvalider from './pages/justificatifs/ListeJustifAvalider';
import ListeJustifEnCours from './pages/justificatifs/ListeJustifEnCours';
import ListeJustifInities from './pages/justificatifs/ListeJustifInities';
import ListeJustifRefuses from './pages/justificatifs/ListeJustifRefuses';
import ListeJustifValides from './pages/justificatifs/ListeJustifValides';
import ListeJustifValidesValidateur from './pages/justificatifs/ListeJustifValidesValidateur';
import ListeJustifEnCoursValidateur from './pages/justificatifs/ListeJustifEnCoursValidateur';
import ListeJustifRefusesValidateur from './pages/justificatifs/ListeJustifRefusesValidateur';
import ListeJustifAreviser from './pages/justificatifs/ListeJustifAreviser';

import SuiviDelaiTraitementJustifs from './pages/tableauDeBord/SuiviDelaiTraitementJustifs';
import JustifsRefusees from './pages/tableauDeBord/JustifsRefusees';
import RequetesRefusees from './pages/tableauDeBord/RequetesRefusees';
import StatistiquesGeneralesRequetes from './pages/tableauDeBord/StatistiquesGeneralesRequetes';
import StatistiquesGeneralesJustifs from './pages/tableauDeBord/StatistiquesGeneralesJustifs';




import Dashboard1 from './pages/dashboard/dashboard1';
import Dashboard2 from './pages/dashboard/Dashboard2';
import Dashboard3 from './pages/dashboard/Dashboard3';
import Dashboard5 from './pages/dashboard/Dashboard5';
import Dashboard6 from './pages/dashboard/Dashboard6';
import AlertesEcheances from './pages/tableauDeBord/AlertesEcheances';
import RequetesEtJustifsRefusees from './pages/tableauDeBord/RequetesEtJustifsRefusees';
import SuiviDelaiTraitementRequetesJustifs from './pages/tableauDeBord/SuiviDelaiTraitementRequetesJustifs';

import SuiviRequetesJustifs from './pages/dashboard/SuiviRequetesJustifs';
import SuiviEtapesValidation from './pages/dashboard/SuiviEtapesValidation';
import SuiviTraitementRequetes from './pages/dashboard/SuiviTraitementRequetes';

const App: React.FC = () => {
    return (
        <Router>
            <Toaster position="top-right" />
            <Routes>

                {/* route publique */}
                <Route path="/" element={<Login />} />

                {/* toutes les routes suivantes sont protégées */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route
                        path="/requetes"
                        element={
                            <ProtectedRoute>
                                <RequetesPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/requetes/ListRequetes"
                        element={
                            <ProtectedRoute>
                                <RequetesPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/requetes/ListRequetesMinistere"
                        element={
                            <ProtectedRoute>
                                <RequetesPageMinistere />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/requetes/ListRequetesEnCours"
                        element={
                            <ProtectedRoute>
                                <ListRequeteEnCours />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/requetes/cloturees"
                        element={
                            <ProtectedRoute>
                                <ListeRequeteCloturees />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/requetes/manque_pj"
                        element={
                            <ProtectedRoute>
                                <ListeRequeteManquePj />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/requetes/validateur/en_cours"
                        element={
                            <ProtectedRoute>
                                <ListRequeteEnCoursValidateur />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/requetes/validateur/valides"
                        element={
                            <ProtectedRoute>
                                <ListeRequeteValidesValidateur />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/requetes/validateur/a_cloturer"
                        element={
                            <ProtectedRoute>
                                <ListeRequeteAcloturer />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/requetes/validateur/cloturees"
                        element={
                            <ProtectedRoute>
                                <ListeRequeteClotureesValidateur />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/requetes/validateur/valides"
                        element={
                            <ProtectedRoute>
                                <ListeRequeteValidesValidateur />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/requetes/ListRequeteAjustifier"
                        element={
                            <ProtectedRoute>
                                <ListeRequeteAjustifier />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/requetes/ListeRequeteRefusees"
                        element={
                            <ProtectedRoute>
                                <ListeRequeteRefusees />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/requetes/validateur/refusees"
                        element={
                            <ProtectedRoute>
                                <ListeRequeteRefuseesValidateur />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/parametrage/typesRequete"
                        element={
                            <ProtectedRoute>
                                <TypeRequetePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/parametrage/typeAgmo"
                        element={
                            <ProtectedRoute>
                                <TypeAgmo />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/requetes/validateur/ListRequetes"
                        element={
                            <ProtectedRoute>
                                <RequetesValidateurPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/requetes/validateur/a_valider"
                        element={
                            <ProtectedRoute>
                                <RequetesValidateurAvalider />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/requetes/AjouterRequetes"
                        element={
                            <ProtectedRoute>
                                <RubricsInsert />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/requetes/ModifierRequetes/:id"
                        element={
                            <ProtectedRoute>
                                <RubricsInsertModification />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/justificatifs/ajout/:id"
                        element={
                            <ProtectedRoute>
                                <AjoutJustificatif />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/justificatifs/a_reviser"
                        element={
                            <ProtectedRoute>
                                <ListeJustifAreviser />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/justificatifs/a_rattacher"
                        element={
                            <ProtectedRoute>
                                <ListeJustifArattacherCircuit />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/justificatifs/validateur/en_cours"
                        element={
                            <ProtectedRoute>
                                <ListeJustifEnCoursValidateur />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/justificatifs/validateur/refuses"
                        element={
                            <ProtectedRoute>
                                <ListeJustifRefusesValidateur />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/justificatifs/validateur/valides"
                        element={
                            <ProtectedRoute>
                                <ListeJustifValidesValidateur />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/justificatifs/a_valider"
                        element={
                            <ProtectedRoute>
                                <ListeJustifAvalider />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/justificatifs/en_cours"
                        element={
                            <ProtectedRoute>
                                <ListeJustifEnCours />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/justificatifs/inities"
                        element={
                            <ProtectedRoute>
                                <ListeJustifInities />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/justificatifs/refuses"
                        element={
                            <ProtectedRoute>
                                <ListeJustifRefuses />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/justificatifs/valides"
                        element={
                            <ProtectedRoute>
                                <ListeJustifValides />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/parametrage"
                        element={
                            <ProtectedRoute>
                                <ParametragePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/parametrage/type"
                        element={
                            <ProtectedRoute>
                                <TypePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/parametrage/categorie"
                        element={
                            <ProtectedRoute>
                                <CategoriePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/parametrage/rubrique"
                        element={
                            <ProtectedRoute>
                                <RubriquePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/parametrage/assignation"
                        element={
                            <ProtectedRoute>
                                <AssignationPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/parametrage/user"
                        element={
                            <ProtectedRoute>
                                <User />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/parametrage/role"
                        element={
                            <ProtectedRoute>
                                <Role />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/parametrage/site"
                        element={
                            <ProtectedRoute>
                                <Site />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/parametrage/projet"
                        element={
                            <ProtectedRoute>
                                <Projet />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/parametrage/entete"
                        element={
                            <ProtectedRoute>
                                <EntetePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/parametrage/entete/:userId"
                        element={
                            <ProtectedRoute>
                                <EntetePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/parametrage/assignation-categorie-colonne"
                        element={
                            <ProtectedRoute>
                                <AssignationTypeCategoriePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/parametrage/assignation-categorie-rubrique"
                        element={
                            <ProtectedRoute>
                                <AssignationCategorieRubriquePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/parametrage/assignation-rubrique-colonne"
                        element={
                            <ProtectedRoute>
                                <AssignationRubriqueColonnePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/parametrage/units"
                        element={
                            <ProtectedRoute>
                                <UnitsPage />
                            </ProtectedRoute>
                        }
                    />
                    {/* <Route
            path="/parametrage/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          /> */}
                    <Route
                        path="/circuits/AjouterCircuits"
                        element={
                            <ProtectedRoute>
                                <AjouterCircuit />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/circuits/ListCircuits"
                        element={
                            <ProtectedRoute>
                                <ListCircuit />
                            </ProtectedRoute>
                        }

                    />
                    {/*<Route
                        path="/circuit/ModifCircuit/:circuitId"
                        element={
                            <ProtectedRoute>
                                <ModifCircuit />
                            </ProtectedRoute>
                        }
                    />*/}
                    <Route
                        path="/circuit/ModifCircuit/:id"
                        element={
                            <ProtectedRoute>
                                <ModifCircuitV2 />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/requetes/DetailsRequetes/:requeteId"
                        element={
                            <ProtectedRoute>
                                <DetailsRequetes />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/tableauDeBord/AlertesEcheances"
                        element={
                            <ProtectedRoute>
                                <AlertesEcheances />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/tableauDeBord/SuiviDelaiTraitementJustifs"
                        element={
                            <ProtectedRoute>
                                <SuiviDelaiTraitementJustifs />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/tableauDeBord/RequetesRefusees"
                        element={
                            <ProtectedRoute>
                                <RequetesRefusees />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/tableauDeBord/justifsRefusees"
                        element={
                            <ProtectedRoute>
                                <JustifsRefusees />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/tableauDeBord/StatistiquesGeneralesRequetes"
                        element={
                            <ProtectedRoute>
                                <StatistiquesGeneralesRequetes />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/tableauDeBord/StatistiquesGeneralesJustifs"
                        element={
                            <ProtectedRoute>
                                <StatistiquesGeneralesJustifs />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dashbord/Dashbord1"
                        element={
                            <ProtectedRoute>
                                <Dashboard1 />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dashbord/Dashbord2"
                        element={
                            <ProtectedRoute>
                                <Dashboard2 />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dashbord/Dashbord3"
                        element={
                            <ProtectedRoute>
                                <Dashboard3 />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dashbord/Dashbord4"
                        element={
                            <ProtectedRoute>
                                <Dashboard1 />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dashbord/Dashbord5"
                        element={
                            <ProtectedRoute>
                                <Dashboard5 />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dashbord/Dashbord6"
                        element={
                            <ProtectedRoute>
                                <Dashboard6 />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/tableauDeBord/AlertesEcheances"
                        element={
                            <ProtectedRoute>
                                <AlertesEcheances />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/tableauDeBord/RequetesEtJustifsRefusees"
                        element={
                            <ProtectedRoute>
                                <RequetesEtJustifsRefusees />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/tableauDeBord/SuiviDelaiTraitementRequetesJustifs"
                        element={
                            <ProtectedRoute>
                                <SuiviDelaiTraitementRequetesJustifs />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dashbord/Dashbord14"
                        element={
                            <ProtectedRoute>
                                <SuiviRequetesJustifs />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dashbord/SuiviEtapesValidation"
                        element={
                            <ProtectedRoute>
                                <SuiviEtapesValidation />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dashbord/SuiviTraitementRequetes"
                        element={
                            <ProtectedRoute>
                                <SuiviTraitementRequetes />
                            </ProtectedRoute>
                        }
                    />
                </Route>
            </Routes>
        </Router>



    )

}

export default App