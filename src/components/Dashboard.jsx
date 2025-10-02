import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import HomePage from '@/components/pages/HomePage';
import FaturasPage from '@/components/pages/FaturasPage';
import UsuariosPage from '@/components/pages/UsuariosPage';
import ControlePage from '@/components/pages/ControlePage';
import ContasReceberPage from '@/components/pages/ContasReceberPage';
import ContasPagarPage from '@/components/pages/ContasPagarPage';
import RelatoriosPage from '@/components/pages/RelatoriosPage';
import PagamentosMotoristasPage from '@/components/pages/PagamentosMotoristasPage';
import PersonalizacaoPage from '@/components/pages/PersonalizacaoPage';

const Dashboard = ({ user, onLogout, personalizacao, updatePersonalizacao }) => {
  const [currentPage, setCurrentPage] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage user={user} />;
      case 'faturas':
        return <FaturasPage user={user} />;
      case 'usuarios':
        return <UsuariosPage user={user} />;
      case 'controle':
        return <ControlePage user={user} />;
      case 'contas-receber':
        return <ContasReceberPage user={user} />;
      case 'contas-pagar':
        return <ContasPagarPage user={user} />;
      case 'relatorios':
        return <RelatoriosPage user={user} />;
      case 'pagamentos-motoristas':
        return <PagamentosMotoristasPage user={user} />;
      case 'personalizacao':
        return <PersonalizacaoPage user={user} updatePersonalizacao={updatePersonalizacao} />;
      default:
        return <HomePage user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        user={user}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        personalizacao={personalizacao}
      />
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Topbar
          user={user}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          personalizacao={personalizacao}
        />
        
        <main className="p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;