import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Login from '@/components/Login';
import Dashboard from '@/components/Dashboard';
import { Toaster } from '@/components/ui/toaster';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [personalizacao, setPersonalizacao] = useState({
    companyName: 'ERP System',
    logo: '',
    primaryColor: '#9333ea'
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    const savedSettings = JSON.parse(localStorage.getItem('personalizacao') || '{}');
    if (savedSettings.companyName || savedSettings.logo || savedSettings.primaryColor) {
      setPersonalizacao(prev => ({ ...prev, ...savedSettings }));
    }
    if (savedSettings.primaryColor) {
      applyColor(savedSettings.primaryColor);
    }

    setLoading(false);
  }, []);

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
      : null;
  };

  const applyColor = (color) => {
    const rgb = hexToRgb(color);
    if (rgb) {
      document.documentElement.style.setProperty('--primary-color', rgb);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const updatePersonalizacao = (newSettings) => {
    setPersonalizacao(prev => ({ ...prev, ...newSettings }));
    if (newSettings.primaryColor) {
      applyColor(newSettings.primaryColor);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-900">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{personalizacao.companyName} - Gestão Empresarial</title>
        <meta name="description" content="Sistema completo de gestão empresarial com controle de faturas, contas a pagar e receber" />
      </Helmet>
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard 
          user={user} 
          onLogout={handleLogout} 
          personalizacao={personalizacao}
          updatePersonalizacao={updatePersonalizacao}
        />
      )}
      <Toaster />
    </>
  );
}

export default App;