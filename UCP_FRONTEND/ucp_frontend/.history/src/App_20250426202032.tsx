import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TypePage from './pages/parametrage/type';
import CategoriePage from './pages/parametrage/categorie';
import RubriquePage from './pages/parametrage/rubrique';
import ParametragePage from './pages/parametrage';
import AssignationPage from './pages/parametrage/assignation';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/parametrage" element={<ParametragePage />} />
        <Route path="/parametrage/type" element={<TypePage />} />
        <Route path="/parametrage/categorie" element={<CategoriePage />} />
        <Route path="/parametrage/rubrique" element={<RubriquePage />} />
        <Route path="/parametrage/assignation" element={<AssignationPage />} />
      </Routes>
    </Router>
  );
};

export default App;
