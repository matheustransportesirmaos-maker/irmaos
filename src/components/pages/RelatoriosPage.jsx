import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const RelatoriosPage = ({ user }) => {
  const [tipoRelatorio, setTipoRelatorio] = useState('faturas');
  const [filterCliente, setFilterCliente] = useState('');
  const [filterPeriodoInicio, setFilterPeriodoInicio] = useState('');
  const [filterPeriodoFim, setFilterPeriodoFim] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const getData = () => {
    let data = [];
    
    switch (tipoRelatorio) {
      case 'faturas':
        data = JSON.parse(localStorage.getItem('faturas') || '[]');
        break;
      case 'contas-receber':
        data = JSON.parse(localStorage.getItem('contasReceber') || '[]');
        break;
      case 'contas-pagar':
        data = JSON.parse(localStorage.getItem('contasPagar') || '[]');
        break;
      case 'controle':
        data = JSON.parse(localStorage.getItem('notas') || '[]');
        break;
      default:
        data = [];
    }

    return data.filter(item => {
      const matchCliente = !filterCliente || 
        (item.cliente && item.cliente.toLowerCase().includes(filterCliente.toLowerCase())) ||
        (item.fornecedor && item.fornecedor.toLowerCase().includes(filterCliente.toLowerCase()));
      
      const matchStatus = !filterStatus || item.status === filterStatus;
      
      let matchPeriodo = true;
      if (filterPeriodoInicio && filterPeriodoFim) {
        const dataItem = new Date(item.dataVencimento || item.dataNota);
        const inicio = new Date(filterPeriodoInicio);
        const fim = new Date(filterPeriodoFim);
        matchPeriodo = dataItem >= inicio && dataItem <= fim;
      }
      
      return matchCliente && matchStatus && matchPeriodo;
    });
  };

  const exportToPDF = () => {
    if (!filterPeriodoInicio || !filterPeriodoFim) {
      toast({
        title: "Erro",
        description: "Selecione o período para gerar o relatório",
        variant: "destructive"
      });
      return;
    }

    const data = getData();
    
    if (data.length === 0) {
      toast({
        title: "Nenhum dado encontrado",
        description: "Não há dados para o filtro selecionado",
        variant: "destructive"
      });
      return;
    }

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`Relatório - ${getTipoRelatorioLabel()}`, 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Período: ${new Date(filterPeriodoInicio).toLocaleDateString('pt-BR')} a ${new Date(filterPeriodoFim).toLocaleDateString('pt-BR')}`, 14, 32);

    let tableData = [];
    let headers = [];

    switch (tipoRelatorio) {
      case 'faturas':
        headers = ['Nº Fatura', 'Cliente', 'Valor', 'Vencimento', 'Status'];
        tableData = data.map(f => [
          f.numeroFatura,
          f.cliente,
          formatCurrency(f.valor),
          new Date(f.dataVencimento).toLocaleDateString('pt-BR'),
          f.status === 'pago' ? 'Pago' : 'Pendente'
        ]);
        break;
      case 'contas-receber':
        headers = ['Nº Fatura', 'Cliente', 'Valor', 'Vencimento', 'Status'];
        tableData = data.map(c => [
          c.numeroFatura,
          c.cliente,
          formatCurrency(c.valor),
          new Date(c.dataVencimento).toLocaleDateString('pt-BR'),
          c.status === 'pago' ? 'Pago' : 'Pendente'
        ]);
        break;
      case 'contas-pagar':
        headers = ['Descrição', 'Fornecedor', 'Valor', 'Vencimento', 'Status'];
        tableData = data.map(c => [
          c.descricao,
          c.fornecedor,
          formatCurrency(c.valor),
          new Date(c.dataVencimento).toLocaleDateString('pt-BR'),
          c.status === 'pago' ? 'Pago' : 'Pendente'
        ]);
        break;
      case 'controle':
        headers = ['Nº Nota', 'Cliente', 'Nº Carga', 'Data', 'Status'];
        tableData = data.map(n => [
          n.numeroNota,
          n.cliente,
          n.numeroCarga,
          new Date(n.dataNota).toLocaleDateString('pt-BR'),
          getStatusLabel(n.status)
        ]);
        break;
    }

    doc.autoTable({
      startY: 40,
      head: [headers],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [147, 51, 234] }
    });

    doc.save(`relatorio_${tipoRelatorio}.pdf`);

    toast({
      title: "PDF gerado!",
      description: "Relatório exportado com sucesso"
    });
  };

  const exportToExcel = () => {
    const data = getData();
    
    if (data.length === 0) {
      toast({
        title: "Nenhum dado encontrado",
        description: "Não há dados para o filtro selecionado",
        variant: "destructive"
      });
      return;
    }

    let excelData = [];

    switch (tipoRelatorio) {
      case 'faturas':
        excelData = data.map(f => ({
          'Número Fatura': f.numeroFatura,
          'Cliente': f.cliente,
          'Valor': parseFloat(f.valor),
          'Data Vencimento': f.dataVencimento,
          'Status': f.status
        }));
        break;
      case 'contas-receber':
        excelData = data.map(c => ({
          'Número Fatura': c.numeroFatura,
          'Cliente': c.cliente,
          'Valor': parseFloat(c.valor),
          'Data Vencimento': c.dataVencimento,
          'Status': c.status
        }));
        break;
      case 'contas-pagar':
        excelData = data.map(c => ({
          'Descrição': c.descricao,
          'Fornecedor': c.fornecedor,
          'Valor': parseFloat(c.valor),
          'Data Vencimento': c.dataVencimento,
          'Status': c.status
        }));
        break;
      case 'controle':
        excelData = data.map(n => ({
          'Número Nota': n.numeroNota,
          'Cliente': n.cliente,
          'Número Carga': n.numeroCarga,
          'Data Nota': n.dataNota,
          'Status': n.status
        }));
        break;
    }

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, `relatorio_${tipoRelatorio}.xlsx`);

    toast({
      title: "Excel exportado!",
      description: "Relatório exportado com sucesso"
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTipoRelatorioLabel = () => {
    switch (tipoRelatorio) {
      case 'faturas': return 'Faturas';
      case 'contas-receber': return 'Contas a Receber';
      case 'contas-pagar': return 'Contas a Pagar';
      case 'controle': return 'Controle';
      default: return '';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'vencendo-hoje': return 'Vencendo Hoje';
      case 'a-vencer': return 'A Vencer';
      case 'vencida': return 'Vencida';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-purple-900">Relatórios</h1>
        <p className="text-purple-600 mt-1">Gere relatórios personalizados</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-purple-900 mb-4">Configurar Relatório</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Relatório</label>
            <select
              value={tipoRelatorio}
              onChange={(e) => setTipoRelatorio(e.target.value)}
              className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="faturas">Faturas</option>
              <option value="contas-receber">Contas a Receber</option>
              <option value="contas-pagar">Contas a Pagar</option>
              <option value="controle">Controle</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente/Fornecedor</label>
            <input
              type="text"
              placeholder="Filtrar por nome"
              value={filterCliente}
              onChange={(e) => setFilterCliente(e.target.value)}
              className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
            <input
              type="date"
              value={filterPeriodoInicio}
              onChange={(e) => setFilterPeriodoInicio(e.target.value)}
              className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
            <input
              type="date"
              value={filterPeriodoFim}
              onChange={(e) => setFilterPeriodoFim(e.target.value)}
              className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {tipoRelatorio !== 'controle' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={exportToPDF} className="flex-1 bg-red-600 hover:bg-red-700">
            <FileText size={18} className="mr-2" />
            Exportar PDF
          </Button>
          <Button onClick={exportToExcel} className="flex-1 bg-green-600 hover:bg-green-700">
            <Download size={18} className="mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RelatoriosPage;