import React from 'react';
import { Menu, Bell } from 'lucide-react';

const Topbar = ({ user, toggleSidebar }) => {
  return (
    <header className="bg-white shadow-md border-b border-purple-100">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-purple-100 rounded-lg transition-colors text-purple-700"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold text-purple-900">Sistema de Gestão</h1>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-purple-100 rounded-lg transition-colors text-purple-700 relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-purple-900">{user.name}</p>
              <p className="text-xs text-purple-600">{user.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;