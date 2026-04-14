import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Header from './components/layout/Header';
import { SidebarProvider } from './components/ui/sidebar';
import AppRoutes from './routes';
import { AppSidebar } from './components/layout/Sidebar';

const App: React.FC = () => {
  return (
    <Router>
        <AppRoutes />
    </Router>
  );
};

export default App;
