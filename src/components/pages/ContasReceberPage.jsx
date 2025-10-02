import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Download, Upload, FileSpreadsheet, Filter, Trash2, Edit, FileText, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ContasReceberPage = ({ user }) => {
  const [contas, setContas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [editingConta, setEditingConta] = useState(null);
  const [filterCliente, setFilterCliente] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPeriodo, setFilterPeriodo] = useState('');
  const [pdfPeriodoInicio, setPdfPeriodoInicio] = useState('');
  const [pdfPeriodoFim, setPdfPeriodoFim] = useState('');
  const [selectedContas, setSelectedContas] = useState([]);
  const [formData, setFormData] = useState({
    numeroFatura: '',
    cliente: '',
    valor: '',
    dataVencimento: '',
    status: 'pendente'
  });

  useEffect(() => {
    loadContas();
  }, []);

  const loadContas = () => {
    const stored = JSON.parse(localStorage.getItem('contasReceber') || '[]');
    setContas(stored);
  };

  const saveConta = () => {
    if (!formData.numeroFatura || !formData.cliente || !formData.valor || !formData.dataVencimento) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios!",
        variant: "destructive"
      });
      return;
    }

    let updatedContas;
    if (editingConta) {
      updatedContas = contas.map(c => c.id === editingConta.id ? { ...formData, id: c.id } : c);
    } else {
      updatedContas = [...contas, { ...formData, id: Date.now() }];
    }

    localStorage.setItem('contasReceber', JSON.stringify(updatedContas));
    setContas(updatedContas);
    
    toast({
      title: "Sucesso!",
      description: editingConta ? "Conta atualizada!" : "Conta cadastrada!"
    });

    resetForm();
  };

  const deleteConta = (id) => {
    const updated = contas.filter(c => c.id !== id);
    localStorage.setItem('contasReceber', JSON.stringify(updated));
    setContas(updated);
    toast({ title: "Conta excluída!" });
  };

  const resetForm = () => {
    setFormData({
      numeroFatura: '',
      cliente: '',
      valor: '',
      dataVencimento: '',
      status: 'pendente'
    });
    setEditingConta(null);
    setShowModal(false);
  };

  const downloadTemplate = () => {
    const template = [{
      'Número Fatura': 'FAT-001',
      'Cliente': 'Cliente Exemplo Ltda',
      'Valor': '1500,50',
      'Data Vencimento': '2024-02-15',
      'Status': 'pendente'
    }];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo');
    XLSX.writeFile(wb, 'modelo_contas_receber.xlsx');

    toast({ title: "Modelo baixado!" });
  };

  const parseCurrency = (value) => {
    if (typeof value === 'string') {
      return value.replace(',', '.');
    }
    return value;
  };

  const importFromExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const wb = XLSX.read(event.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const imported = data.map(row => ({
          id: Date.now() + Math.random(),
          numeroFatura: row['Número Fatura'] || row['numeroFatura'] || '',
          cliente: row['Cliente'] || row['cliente'] || '',
          valor: String(parseCurrency(row['Valor'] || row['valor']) || 0),
          dataVencimento: row['Data Vencimento'] || row['dataVencimento'] || '',
          status: row['Status'] || row['status'] || 'pendente'
        }));

        const existingContas = [...contas];
        imported.forEach(newConta => {
          const existingIndex = existingContas.findIndex(
            c => c.numeroFatura === newConta.numeroFatura
          );
          
          if (existingIndex >= 0) {
            existingContas[existingIndex] = { ...existingContas[existingIndex], ...newConta };
          } else {
            existingContas.push(newConta);
          }
        });

        localStorage.setItem('contasReceber', JSON.stringify(existingContas));
        setContas(existingContas);

        toast({
          title: "Importado!",
          description: `${imported.length} contas importadas`
        });

      } catch (error) {
        toast({
          title: "Erro na importação",
          variant: "destructive"
        });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const exportToExcel = () => {
    const filtered = getFilteredContas();
    const data = filtered.map(c => ({
      'Número Fatura': c.numeroFatura,
      'Cliente': c.cliente,
      'Valor': parseFloat(c.valor),
      'Data Vencimento': c.dataVencimento,
      'Status': c.status
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contas a Receber');
    XLSX.writeFile(wb, 'contas_receber.xlsx');

    toast({ title: "Exportado!" });
  };

  const exportToPDF = () => {
    if (!pdfPeriodoInicio || !pdfPeriodoFim) {
      toast({
        title: "Erro",
        description: "Selecione o período para exportação",
        variant: "destructive"
      });
      return;
    }

    const filtered = contas.filter(c => {
      const dataVenc = new Date(c.dataVencimento);
      const inicio = new Date(pdfPeriodoInicio);
      const fim = new Date(pdfPeriodoFim);
      return dataVenc >= inicio && dataVenc <= fim;
    });

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Contas a Receber', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Período: ${new Date(pdfPeriodoInicio).toLocaleDateString('pt-BR')} a ${new Date(pdfPeriodoFim).toLocaleDateString('pt-BR')}`, 14, 32);

    const tableData = filtered.map(c => [
      c.numeroFatura,
      c.cliente,
      formatCurrency(c.valor),
      new Date(c.dataVencimento).toLocaleDateString('pt-BR'),
      c.status === 'pago' ? 'Pago' : 'Pendente'
    ]);

    doc.autoTable({
      startY: 40,
      head: [['Nº Fatura', 'Cliente', 'Valor', 'Vencimento', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [147, 51, 234] }
    });

    doc.save('contas_receber.pdf');
    setShowPdfModal(false);
    setPdfPeriodoInicio('');
    setPdfPeriodoFim('');

    toast({ title: "PDF gerado com sucesso!" });
  };

  const getFilteredContas = () => {
    return contas.filter(c => {
      const matchCliente = !filterCliente || c.cliente.toLowerCase().includes(filterCliente.toLowerCase());
      const matchStatus = !filterStatus || c.status === filterStatus;
      const matchPeriodo = !filterPeriodo || c.dataVencimento.startsWith(filterPeriodo);
      return matchCliente && matchStatus && matchPeriodo;
    });
  };

  const formatCurrency = (value) => {
    const numberValue = parseFloat(value);
    if (isNaN(numberValue)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numberValue);
  };

  const toggleSelection = (id) => {
    setSelectedContas(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const updateSelectedStatus = (newStatus) => {
    if (selectedContas.length === 0) {
      toast({ title: "Nenhuma conta selecionada", variant: "destructive" });
      return;
    }

    const updatedContas = contas.map(c =>
      selectedContas.includes(c.id) ? { ...c, status: newStatus } : c
    );
    
    localStorage.setItem('contasReceber', JSON.stringify(updatedContas));
    setContas(updatedContas);

    toast({
      title: "Status atualizado!",
      description: `${selectedContas.length} contas marcadas como ${newStatus === 'pago' ? 'pagas' : 'pendentes'}`
    });
    setSelectedContas([]);
  };

  const filtered = getFilteredContas();
  const totalReceber = filtered.reduce((sum, c) => sum + parseFloat(c.valor || 0), 0);
  const jaRecebido = filtered.filter(c => c.status === 'pago').reduce((sum, c) => sum + parseFloat(c.valor || 0), 0);
  const pendente = filtered.filter(c => c.status === 'pendente').reduce((sum, c) => sum + parseFloat(c.valor || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-purple-900">Contas a Receber</h1>
          <p className="text-purple-600 mt-1">Gerencie suas contas a receber</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={downloadTemplate} className="bg-blue-600 hover:bg-blue-700">
            <FileSpreadsheet size={18} className="mr-2" />
            Modelo Excel
          </Button>
          
          <label className="cursor-pointer">
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <div>
                <Upload size={18} className="mr-2" />
                Importar Arquivo
                <input type="file" accept=".xlsx,.xls" onChange={importFromExcel} className="hidden" />
              </div>
            </Button>
          </label>

          <Button onClick={exportToExcel} className="bg-orange-600 hover:bg-orange-700">
            <Download size={18} className="mr-2" />
            Exportar Excel
          </Button>

          <Button onClick={() => setShowPdfModal(true)} className="bg-red-600 hover:bg-red-700">
            <FileText size={18} className="mr-2" />
            Exportar PDF
          </Button>

          <Button onClick={() => setShowModal(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus size={18} className="mr-2" />
            Nova Conta
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-sm opacity-90 mb-1">Total a Receber</p>
          <p className="text-3xl font-bold">{formatCurrency(totalReceber)}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-sm opacity-90 mb-1">Já Recebido</p>
          <p className="text-3xl font-bold">{formatCurrency(jaRecebido)}</p>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-sm opacity-90 mb-1">Pendente</p>
          <p className="text-3xl font-bold">{formatCurrency(pendente)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-purple-600" />
            <h3 className="font-semibold text-purple-900">Filtros</h3>
          </div>
          {selectedContas.length > 0 && (
            <div className="flex gap-2">
              <Button onClick={() => updateSelectedStatus('pago')} size="sm" className="bg-green-600 hover:bg-green-700">
                <CheckCircle size={16} className="mr-2" /> Marcar como Pago
              </Button>
              <Button onClick={() => updateSelectedStatus('pendente')} size="sm" className="bg-orange-600 hover:bg-orange-700">
                <XCircle size={16} className="mr-2" /> Marcar como Pendente
              </Button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Filtrar por cliente"
            value={filterCliente}
            onChange={(e) => setFilterCliente(e.target.value)}
            className="px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
          </select>

          <input
            type="month"
            value={filterPeriodo}
            onChange={(e) => setFilterPeriodo(e.target.value)}
            className="px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-600 text-white">
              <tr>
                <th className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedContas.length === filtered.length && filtered.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedContas(filtered.map(c => c.id));
                      } else {
                        setSelectedContas([]);
                      }
                    }}
                    className="w-4 h-4"
                  />
                </th>
                <th className="text-left py-3 px-4">Nº Fatura</th>
                <th className="text-left py-3 px-4">Cliente</th>
                <th className="text-left py-3 px-4">Valor</th>
                <th className="text-left py-3 px-4">Vencimento</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((conta) => (
                <tr key={conta.id} className="border-b border-purple-100 hover:bg-purple-50 transition-colors">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedContas.includes(conta.id)}
                      onChange={() => toggleSelection(conta.id)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="py-3 px-4 font-medium">{conta.numeroFatura}</td>
                  <td className="py-3 px-4">{conta.cliente}</td>
                  <td className="py-3 px-4 font-semibold text-purple-900">{formatCurrency(conta.valor)}</td>
                  <td className="py-3 px-4">{new Date(conta.dataVencimento).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      conta.status === 'pago'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {conta.status === 'pago' ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingConta(conta);
                          setFormData(conta);
                          setShowModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => deleteConta(conta.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-2xl w-full"
          >
            <h2 className="text-2xl font-bold text-purple-900 mb-4">
              {editingConta ? 'Editar Conta' : 'Nova Conta'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número da Fatura *</label>
                <input
                  type="text"
                  value={formData.numeroFatura}
                  onChange={(e) => setFormData({ ...formData, numeroFatura: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                <input
                  type="text"
                  value={formData.cliente}
                  onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Vencimento *</label>
                <input
                  type="date"
                  value={formData.dataVencimento}
                  onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={saveConta} className="flex-1 bg-purple-600 hover:bg-purple-700">
                {editingConta ? 'Atualizar' : 'Salvar'}
              </Button>
              <Button onClick={resetForm} variant="outline" className="flex-1">
                Cancelar
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {showPdfModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold text-purple-900 mb-4">Exportar PDF</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                <input
                  type="date"
                  value={pdfPeriodoInicio}
                  onChange={(e) => setPdfPeriodoInicio(e.target.value)}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
                <input
                  type="date"
                  value={pdfPeriodoFim}
                  onChange={(e) => setPdfPeriodoFim(e.target.value)}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={exportToPDF} className="flex-1 bg-red-600 hover:bg-red-700">
                Gerar PDF
              </Button>
              <Button onClick={() => setShowPdfModal(false)} variant="outline" className="flex-1">
                Cancelar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ContasReceberPage;