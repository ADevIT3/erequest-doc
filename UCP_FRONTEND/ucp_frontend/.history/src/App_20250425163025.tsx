import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import { SidebarProvider } from './components/ui/sidebar';
import AppRoutes from './routes';
import { AppSidebar } from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import TypePage from './pages/parametrage/type';
import CategoriePage from './pages/parametrage/categorie';
import RubriquePage from './pages/parametrage/rubrique';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/parametrage/type" element={<TypePage />} />
        <Route path="/parametrage/categorie" element={<CategoriePage />} />
        <Route path="/parametrage/rubrique" element={<RubriquePage />} />
      </Routes>
    </Router>
  );
};

export default App;
