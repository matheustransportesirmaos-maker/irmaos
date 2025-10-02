import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const Login = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const adminExists = users.some(u => u.email === 'Matheus.transportesirmaos@gmail.com');
    
    if (!adminExists) {
      const adminUser = {
        id: Date.now(),
        email: 'Matheus.transportesirmaos@gmail.com',
        password: 'mat2024@.',
        name: 'Admin Master',
        role: 'admin',
        approved: true
      };
      users.push(adminUser);
      localStorage.setItem('users', JSON.stringify(users));
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    if (isRegister) {
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        toast({
          title: "Erro",
          description: "Este e-mail já está cadastrado!",
          variant: "destructive"
        });
        return;
      }

      const newUser = {
        id: Date.now(),
        email,
        password,
        name,
        role: 'user',
        approved: false
      };

      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));

      toast({
        title: "Cadastro realizado!",
        description: "Aguarde a aprovação do administrador para acessar o sistema."
      });

      setIsRegister(false);
      setEmail('');
      setPassword('');
      setName('');
    } else {
      const user = users.find(u => u.email === email && u.password === password);
      
      if (!user) {
        toast({
          title: "Erro",
          description: "E-mail ou senha incorretos!",
          variant: "destructive"
        });
        return;
      }

      if (!user.approved) {
        toast({
          title: "Acesso negado",
          description: "Seu cadastro ainda não foi aprovado pelo administrador.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Bem-vindo!",
        description: `Login realizado com sucesso, ${user.name}!`
      });

      onLogin(user);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {isRegister ? 'Criar Conta' : 'Sistema ERP'}
            </h1>
            <p className="text-purple-200">
              {isRegister ? 'Cadastre-se para acessar' : 'Faça login para continuar'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegister && (
              <div>
                <label className="block text-white mb-2 text-sm font-medium">Nome Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Seu nome"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-white mb-2 text-sm font-medium">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2 text-sm font-medium">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-white text-purple-700 hover:bg-purple-50 font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isRegister ? (
                <>
                  <UserPlus size={20} />
                  Cadastrar
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Entrar
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-purple-200 hover:text-white transition-colors text-sm"
            >
              {isRegister ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;