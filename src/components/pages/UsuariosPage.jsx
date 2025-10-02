import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, UserX, Trash2, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const UsuariosPage = ({ user }) => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const stored = JSON.parse(localStorage.getItem('users') || '[]');
    setUsers(stored);
  };

  const approveUser = (userId) => {
    const updated = users.map(u =>
      u.id === userId ? { ...u, approved: true } : u
    );
    localStorage.setItem('users', JSON.stringify(updated));
    setUsers(updated);
    
    toast({
      title: "Usuário aprovado!",
      description: "O usuário agora pode acessar o sistema"
    });
  };

  const rejectUser = (userId) => {
    const updated = users.map(u =>
      u.id === userId ? { ...u, approved: false } : u
    );
    localStorage.setItem('users', JSON.stringify(updated));
    setUsers(updated);
    
    toast({
      title: "Aprovação removida",
      description: "O acesso do usuário foi revogado"
    });
  };

  const deleteUser = (userId) => {
    const updated = users.filter(u => u.id !== userId);
    localStorage.setItem('users', JSON.stringify(updated));
    setUsers(updated);
    
    toast({
      title: "Usuário excluído",
      description: "O usuário foi removido do sistema"
    });
  };

  if (user.role !== 'admin') {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <Shield className="mx-auto text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
        <p className="text-gray-600">Apenas administradores podem acessar esta página</p>
      </div>
    );
  }

  const pendingUsers = users.filter(u => !u.approved);
  const approvedUsers = users.filter(u => u.approved);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-purple-900">Usuários</h1>
        <p className="text-purple-600 mt-1">Gerencie usuários do sistema</p>
      </div>

      {pendingUsers.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
            <UserCheck className="text-orange-500" />
            Aguardando Aprovação ({pendingUsers.length})
          </h2>
          
          <div className="space-y-3">
            {pendingUsers.map((u) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{u.name}</p>
                    <p className="text-sm text-gray-600">{u.email}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => approveUser(u.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <UserCheck size={18} className="mr-2" />
                    Aprovar
                  </Button>
                  <Button
                    onClick={() => deleteUser(u.id)}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
          <User className="text-green-500" />
          Usuários Aprovados ({approvedUsers.length})
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-600 text-white">
              <tr>
                <th className="text-left py-3 px-4">Nome</th>
                <th className="text-left py-3 px-4">E-mail</th>
                <th className="text-left py-3 px-4">Perfil</th>
                <th className="text-left py-3 px-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {approvedUsers.map((u) => (
                <tr key={u.id} className="border-b border-purple-100 hover:bg-purple-50 transition-colors">
                  <td className="py-3 px-4 font-medium">{u.name}</td>
                  <td className="py-3 px-4">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      u.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {u.role === 'admin' ? 'Administrador' : 'Usuário'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      {u.email !== 'Matheus.transportesirmaos@gmail.com' && (
                        <>
                          <button
                            onClick={() => rejectUser(u.id)}
                            className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                          >
                            <UserX size={18} />
                          </button>
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsuariosPage;