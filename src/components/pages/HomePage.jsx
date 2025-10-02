import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const HomePage = ({ user }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState({
    totalFaturas: 0,
    faturasPagas: 0,
    totalRecebido: 0,
    contasPagar: 0,
    contasReceber: 0
  });
  const [clientesRelacao, setClientesRelacao] = useState([]);

  useEffect(() => {
    calculateStats();
  }, [selectedMonth, selectedYear]);

  const calculateStats = () => {
    const faturas = JSON.parse(localStorage.getItem('faturas') || '[]');
    const contasPagar = JSON.parse(localStorage.getItem('contasPagar') || '[]');
    const contasReceber = JSON.parse(localStorage.getItem('contasReceber') || '[]');

    const filteredFaturas = faturas.filter(f => {
      const vencimento = new Date(f.dataVencimento);
      return vencimento.getMonth() + 1 === selectedMonth && vencimento.getFullYear() === selectedYear;
    });

    const filteredContasPagar = contasPagar.filter(c => {
      const vencimento = new Date(c.dataVencimento);
      return vencimento.getMonth() + 1 === selectedMonth && vencimento.getFullYear() === selectedYear;
    });

    const filteredContasReceber = contasReceber.filter(c => {
      const vencimento = new Date(c.dataVencimento);
      return vencimento.getMonth() + 1 === selectedMonth && vencimento.getFullYear() === selectedYear;
    });

    const totalFaturas = filteredFaturas.length;
    const faturasPagas = filteredFaturas.filter(f => f.status === 'pago').length;
    const totalRecebido = filteredFaturas
      .filter(f => f.status === 'pago')
      .reduce((sum, f) => sum + parseFloat(f.valor || 0), 0);
    
    const totalContasPagar = filteredContasPagar.reduce((sum, c) => sum + parseFloat(c.valor || 0), 0);
    const totalContasReceber = filteredContasReceber.reduce((sum, c) => sum + parseFloat(c.valor || 0), 0);

    const clientesMap = {};
    filteredFaturas.forEach(f => {
      if (!clientesMap[f.cliente]) {
        clientesMap[f.cliente] = {
          cliente: f.cliente,
          totalPago: 0,
          totalAberto: 0,
          qtdPago: 0,
          qtdAberto: 0
        };
      }
      
      if (f.status === 'pago') {
        clientesMap[f.cliente].totalPago += parseFloat(f.valor || 0);
        clientesMap[f.cliente].qtdPago += 1;
      } else {
        clientesMap[f.cliente].totalAberto += parseFloat(f.valor || 0);
        clientesMap[f.cliente].qtdAberto += 1;
      }
    });

    setStats({
      totalFaturas,
      faturasPagas,
      totalRecebido,
      contasPagar: totalContasPagar,
      contasReceber: totalContasReceber
    });

    setClientesRelacao(Object.values(clientesMap));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const cards = [
    {
      title: 'Total de Faturas',
      value: stats.totalFaturas,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      format: 'number'
    },
    {
      title: 'Faturas Pagas',
      value: stats.faturasPagas,
      icon: FileText,
      color: 'from-green-500 to-green-600',
      format: 'number'
    },
    {
      title: 'Total Recebido',
      value: stats.totalRecebido,
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      format: 'currency'
    },
    {
      title: 'Contas a Pagar',
      value: stats.contasPagar,
      icon: TrendingDown,
      color: 'from-red-500 to-red-600',
      format: 'currency'
    },
    {
      title: 'Contas a Receber',
      value: stats.contasReceber,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      format: 'currency'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-purple-900">Dashboard</h1>
          <p className="text-purple-600 mt-1">Visão geral do sistema</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-md">
          <Calendar className="text-purple-600" size={20} />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {months.map((month, index) => (
              <option key={index} value={index + 1}>{month}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {[2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className={`bg-gradient-to-r ${card.color} p-4`}>
                <Icon className="text-white" size={32} />
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-purple-900">
                  {card.format === 'currency' ? formatCurrency(card.value) : card.value}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-purple-900 mb-4">Relação de Clientes</h2>
        
        {clientesRelacao.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhum cliente encontrado para o período selecionado</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-200">
                  <th className="text-left py-3 px-4 text-purple-900 font-semibold">Cliente</th>
                  <th className="text-left py-3 px-4 text-purple-900 font-semibold">Qtd. Pagas</th>
                  <th className="text-left py-3 px-4 text-purple-900 font-semibold">Total Pago</th>
                  <th className="text-left py-3 px-4 text-purple-900 font-semibold">Qtd. Abertas</th>
                  <th className="text-left py-3 px-4 text-purple-900 font-semibold">Total Aberto</th>
                </tr>
              </thead>
              <tbody>
                {clientesRelacao.map((cliente, index) => (
                  <tr key={index} className="border-b border-purple-100 hover:bg-purple-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-purple-900">{cliente.cliente}</td>
                    <td className="py-3 px-4 text-gray-700">{cliente.qtdPago}</td>
                    <td className="py-3 px-4 text-green-600 font-semibold">{formatCurrency(cliente.totalPago)}</td>
                    <td className="py-3 px-4 text-gray-700">{cliente.qtdAberto}</td>
                    <td className="py-3 px-4 text-orange-600 font-semibold">{formatCurrency(cliente.totalAberto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;