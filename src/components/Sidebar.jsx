import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  FileText,
  Users,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Truck,
  Settings,
  LogOut,
  X
} from 'lucide-react';

const Sidebar = ({ currentPage, setCurrentPage, user, onLogout, isOpen, setIsOpen, personalizacao }) => {
  const menuItems = [
    { id: 'home', label: 'Página Inicial', icon: Home },
    { id: 'faturas', label: 'Faturas', icon: FileText },
    ...(user.role === 'admin' ? [{ id: 'usuarios', label: 'Usuários', icon: Users }] : []),
    { id: 'controle', label: 'Controle', icon: ClipboardList },
    { id: 'contas-receber', label: 'Contas a Receber', icon: TrendingUp },
    { id: 'contas-pagar', label: 'Contas a Pagar', icon: TrendingDown },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    { id: 'pagamentos-motoristas', label: 'Pagamentos de Motorista', icon: Truck },
    { id: 'personalizacao', label: 'Personalização', icon: Settings }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-purple-900 to-purple-800 text-white shadow-2xl z-50 overflow-y-auto custom-scrollbar"
          >
            <div className="p-6 border-b border-purple-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {personalizacao.logo && <img src={personalizacao.logo} alt="Logo" className="h-8 w-auto" />}
                <h2 className="text-xl font-bold">{personalizacao.companyName}</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden text-white hover:bg-purple-700 p-2 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-purple-300 text-sm">{user.name}</p>
            </div>

            <nav className="p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id);
                      if (window.innerWidth < 1024) {
                        setIsOpen(false);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-purple-900 shadow-lg'
                        : 'text-purple-100 hover:bg-purple-700'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}

              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-purple-100 hover:bg-red-600 transition-all duration-200 mt-4"
              >
                <LogOut size={20} />
                <span className="font-medium">Sair do Sistema</span>
              </button>
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;