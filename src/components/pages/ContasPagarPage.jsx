import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Download, Upload, FileSpreadsheet, Filter, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';

const ContasPagarPage = ({ user }) => {
  const [contas, setContas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingConta, setEditingConta] = useState(null);
  const [filterCliente, setFilterCliente] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPeriodo, setFilterPeriodo] = useState('');
  const [selectedContas, setSelectedContas] = useState([]);
  const [formData, setFormData] = useState({
    descricao: '',
    fornecedor: '',
    valor: '',
    dataVencimento: '',
    status: 'pendente'
  });

  useEffect(() => {
    loadContas();
  }, []);

  const loadContas = () => {
    const stored = JSON.parse(localStorage.getItem('contasPagar') || '[]');
    setContas(stored);
  };

  const saveConta = () => {
    if (!formData.descricao || !formData.fornecedor || !formData.valor || !formData.dataVencimento) {
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

    localStorage.setItem('contasPagar', JSON.stringify(updatedContas));
    setContas(updatedContas);
    
    toast({
      title: "Sucesso!",
      description: editingConta ? "Conta atualizada!" : "Conta cadastrada!"
    });

    resetForm();
  };

  const deleteConta = (id) => {
    const updated = contas.filter(c => c.id !== id);
    localStorage.setItem('contasPagar', JSON.stringify(updated));
    setContas(updated);
    toast({ title: "Conta excluída!" });
  };

  const resetForm = () => {
    setFormData({
      descricao: '',
      fornecedor: '',
      valor: '',
      dataVencimento: '',
      status: 'pendente'
    });
    setEditingConta(null);
    setShowModal(false);
  };

  const downloadTemplate = () => {
    const template = [{
      'Descrição': 'Pagamento de Frete',
      'Fornecedor': 'Transportadora XYZ',
      'Valor': '2500,50',
      'Data Vencimento': '2024-02-15',
      'Status': 'pendente'
    }];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo');
    XLSX.writeFile(wb, 'modelo_contas_pagar.xlsx');

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
          descricao: row['Descrição'] || row['descricao'] || '',
          fornecedor: row['Fornecedor'] || row['fornecedor'] || '',
          valor: String(parseCurrency(row['Valor'] || row['valor']) || 0),
          dataVencimento: row['Data Vencimento'] || row['dataVencimento'] || '',
          status: row['Status'] || row['status'] || 'pendente'
        }));

        const existingContas = [...contas];
        imported.forEach(newConta => {
          existingContas.push(newConta);
        });

        localStorage.setItem('contasPagar', JSON.stringify(existingContas));
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
      'Descrição': c.descricao,
      'Fornecedor': c.fornecedor,
      'Valor': parseFloat(c.valor),
      'Data Vencimento': c.dataVencimento,
      'Status': c.status
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contas a Pagar');
    XLSX.writeFile(wb, 'contas_pagar.xlsx');

    toast({ title: "Exportado!" });
  };

  const getFilteredContas = () => {
    return contas.filter(c => {
      const matchFornecedor = !filterCliente || c.fornecedor.toLowerCase().includes(filterCliente.toLowerCase());
      const matchStatus = !filterStatus || c.status === filterStatus;
      const matchPeriodo = !filterPeriodo || c.dataVencimento.startsWith(filterPeriodo);
      return matchFornecedor && matchStatus && matchPeriodo;
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
    
    localStorage.setItem('contasPagar', JSON.stringify(updatedContas));
    setContas(updatedContas);

    toast({
      title: "Status atualizado!",
      description: `${selectedContas.length} contas marcadas como ${newStatus === 'pago' ? 'pagas' : 'pendentes'}`
    });
    setSelectedContas([]);
  };

  const filtered = getFilteredContas();
  const totalPagar = filtered.reduce((sum, c) => sum + parseFloat(c.valor || 0), 0);
  const jaPago = filtered.filter(c => c.status === 'pago').reduce((sum, c) => sum + parseFloat(c.valor || 0), 0);
  const pendente = filtered.filter(c => c.status === 'pendente').reduce((sum, c) => sum + parseFloat(c.valor || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-purple-900">Contas a Pagar</h1>
          <p className="text-purple-600 mt-1">Gerencie suas contas a pagar</p>
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

          <Button onClick={() => setShowModal(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus size={18} className="mr-2" />
            Nova Conta
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-sm opacity-90 mb-1">Total a Pagar</p>
          <p className="text-3xl font-bold">{formatCurrency(totalPagar)}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-sm opacity-90 mb-1">Já Pago</p>
          <p className="text-3xl font-bold">{formatCurrency(jaPago)}</p>
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
            placeholder="Filtrar por fornecedor"
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
                <th className="text-left py-3 px-4">Descrição</th>
                <th className="text-left py-3 px-4">Fornecedor</th>
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
                  <td className="py-3 px-4 font-medium">{conta.descricao}</td>
                  <td className="py-3 px-4">{conta.fornecedor}</td>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor *</label>
                <input
                  type="text"
                  value={formData.fornecedor}
                  onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
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
    </div>
  );
};

export default ContasPagarPage;