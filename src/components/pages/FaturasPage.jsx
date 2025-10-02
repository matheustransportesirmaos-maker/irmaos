import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Download, Upload, FileSpreadsheet, Filter, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';

const FaturasPage = ({ user }) => {
  const [faturas, setFaturas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingFatura, setEditingFatura] = useState(null);
  const [filterCliente, setFilterCliente] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPeriodo, setFilterPeriodo] = useState('');
  const [selectedFaturas, setSelectedFaturas] = useState([]);
  const [formData, setFormData] = useState({
    numeroFatura: '',
    cliente: '',
    valor: '',
    dataEmissao: '',
    dataVencimento: '',
    desconto: '',
    status: 'pendente'
  });

  useEffect(() => {
    loadFaturas();
  }, []);

  const loadFaturas = () => {
    const stored = JSON.parse(localStorage.getItem('faturas') || '[]');
    setFaturas(stored);
  };

  const saveFatura = () => {
    if (!formData.numeroFatura || !formData.cliente || !formData.valor || !formData.dataVencimento) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios!",
        variant: "destructive"
      });
      return;
    }

    let updatedFaturas;
    
    if (editingFatura) {
      updatedFaturas = faturas.map(f => 
        f.id === editingFatura.id ? { ...formData, id: f.id } : f
      );
      
      const contasReceber = JSON.parse(localStorage.getItem('contasReceber') || '[]');
      const updatedContasReceber = contasReceber.map(c => 
        c.faturaId === editingFatura.id 
          ? { ...c, valor: formData.valor, dataVencimento: formData.dataVencimento, status: formData.status }
          : c
      );
      localStorage.setItem('contasReceber', JSON.stringify(updatedContasReceber));
    } else {
      const newFatura = {
        ...formData,
        id: Date.now()
      };
      updatedFaturas = [...faturas, newFatura];
      
      const contaReceber = {
        id: Date.now() + 1,
        faturaId: newFatura.id,
        numeroFatura: newFatura.numeroFatura,
        cliente: newFatura.cliente,
        valor: newFatura.valor,
        dataVencimento: newFatura.dataVencimento,
        status: newFatura.status
      };
      
      const contasReceber = JSON.parse(localStorage.getItem('contasReceber') || '[]');
      contasReceber.push(contaReceber);
      localStorage.setItem('contasReceber', JSON.stringify(contasReceber));
    }

    localStorage.setItem('faturas', JSON.stringify(updatedFaturas));
    setFaturas(updatedFaturas);
    
    toast({
      title: "Sucesso!",
      description: editingFatura ? "Fatura atualizada com sucesso!" : "Fatura cadastrada com sucesso!"
    });

    resetForm();
  };

  const toggleStatus = (fatura) => {
    const newStatus = fatura.status === 'pago' ? 'pendente' : 'pago';
    const updatedFaturas = faturas.map(f =>
      f.id === fatura.id ? { ...f, status: newStatus } : f
    );
    
    localStorage.setItem('faturas', JSON.stringify(updatedFaturas));
    setFaturas(updatedFaturas);

    const contasReceber = JSON.parse(localStorage.getItem('contasReceber') || '[]');
    const updatedContasReceber = contasReceber.map(c =>
      c.faturaId === fatura.id ? { ...c, status: newStatus } : c
    );
    localStorage.setItem('contasReceber', JSON.stringify(updatedContasReceber));

    toast({
      title: "Status atualizado!",
      description: `Fatura marcada como ${newStatus === 'pago' ? 'paga' : 'pendente'}`
    });
  };

  const deleteFatura = (id) => {
    const updatedFaturas = faturas.filter(f => f.id !== id);
    localStorage.setItem('faturas', JSON.stringify(updatedFaturas));
    setFaturas(updatedFaturas);

    const contasReceber = JSON.parse(localStorage.getItem('contasReceber') || '[]');
    const updatedContasReceber = contasReceber.filter(c => c.faturaId !== id);
    localStorage.setItem('contasReceber', JSON.stringify(updatedContasReceber));

    toast({
      title: "Fatura excluída!",
      description: "A fatura foi removida com sucesso"
    });
  };

  const resetForm = () => {
    setFormData({
      numeroFatura: '',
      cliente: '',
      valor: '',
      dataEmissao: '',
      dataVencimento: '',
      desconto: '',
      status: 'pendente'
    });
    setEditingFatura(null);
    setShowModal(false);
  };

  const exportToExcel = () => {
    const filtered = getFilteredFaturas();
    const data = filtered.map(f => ({
      'Número Fatura': f.numeroFatura,
      'Cliente': f.cliente,
      'Valor': parseFloat(f.valor),
      'Data Emissão': f.dataEmissao,
      'Data Vencimento': f.dataVencimento,
      'Desconto': parseFloat(f.desconto || 0),
      'Status': f.status
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Faturas');
    XLSX.writeFile(wb, 'faturas.xlsx');

    toast({
      title: "Exportado!",
      description: "Arquivo Excel gerado com sucesso"
    });
  };

  const downloadTemplate = () => {
    const template = [{
      'Número Fatura': 'FAT-001',
      'Cliente': 'Cliente Exemplo Ltda',
      'Valor': '1500,50',
      'Data Emissão': '2024-01-15',
      'Data Vencimento': '2024-02-15',
      'Desconto': '50,00',
      'Status': 'pendente'
    }];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo');
    XLSX.writeFile(wb, 'modelo_faturas.xlsx');

    toast({
      title: "Modelo baixado!",
      description: "Use este arquivo como referência para importação"
    });
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
          dataEmissao: row['Data Emissão'] || row['dataEmissao'] || '',
          dataVencimento: row['Data Vencimento'] || row['dataVencimento'] || '',
          desconto: String(parseCurrency(row['Desconto'] || row['desconto']) || 0),
          status: row['Status'] || row['status'] || 'pendente'
        }));

        const existingFaturas = [...faturas];
        imported.forEach(newFatura => {
          const existingIndex = existingFaturas.findIndex(
            f => f.numeroFatura === newFatura.numeroFatura
          );
          
          if (existingIndex >= 0) {
            existingFaturas[existingIndex] = { ...existingFaturas[existingIndex], ...newFatura };
          } else {
            existingFaturas.push(newFatura);
            
            const contaReceber = {
              id: Date.now() + Math.random(),
              faturaId: newFatura.id,
              numeroFatura: newFatura.numeroFatura,
              cliente: newFatura.cliente,
              valor: newFatura.valor,
              dataVencimento: newFatura.dataVencimento,
              status: newFatura.status
            };
            
            const contasReceber = JSON.parse(localStorage.getItem('contasReceber') || '[]');
            contasReceber.push(contaReceber);
            localStorage.setItem('contasReceber', JSON.stringify(contasReceber));
          }
        });

        localStorage.setItem('faturas', JSON.stringify(existingFaturas));
        setFaturas(existingFaturas);

        toast({
          title: "Importado!",
          description: `${imported.length} faturas importadas com sucesso`
        });

      } catch (error) {
        toast({
          title: "Erro na importação",
          description: "Verifique o formato do arquivo",
          variant: "destructive"
        });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const getFilteredFaturas = () => {
    return faturas.filter(f => {
      const matchCliente = !filterCliente || f.cliente.toLowerCase().includes(filterCliente.toLowerCase());
      const matchStatus = !filterStatus || f.status === filterStatus;
      const matchPeriodo = !filterPeriodo || f.dataVencimento.startsWith(filterPeriodo);
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
    setSelectedFaturas(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const updateSelectedStatus = (newStatus) => {
    if (selectedFaturas.length === 0) {
      toast({ title: "Nenhuma fatura selecionada", variant: "destructive" });
      return;
    }

    const updatedFaturas = faturas.map(f =>
      selectedFaturas.includes(f.id) ? { ...f, status: newStatus } : f
    );
    
    localStorage.setItem('faturas', JSON.stringify(updatedFaturas));
    setFaturas(updatedFaturas);

    const contasReceber = JSON.parse(localStorage.getItem('contasReceber') || '[]');
    const updatedContasReceber = contasReceber.map(c =>
      selectedFaturas.includes(c.faturaId) ? { ...c, status: newStatus } : c
    );
    localStorage.setItem('contasReceber', JSON.stringify(updatedContasReceber));

    toast({
      title: "Status atualizado!",
      description: `${selectedFaturas.length} faturas marcadas como ${newStatus === 'pago' ? 'pagas' : 'pendentes'}`
    });
    setSelectedFaturas([]);
  };

  const filtered = getFilteredFaturas();
  const totalPago = filtered.filter(f => f.status === 'pago').reduce((sum, f) => sum + parseFloat(f.valor || 0), 0);
  const totalPendente = filtered.filter(f => f.status === 'pendente').reduce((sum, f) => sum + parseFloat(f.valor || 0), 0);
  const totalGeral = filtered.reduce((sum, f) => sum + parseFloat(f.valor || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-purple-900">Faturas</h1>
          <p className="text-purple-600 mt-1">Gerencie suas faturas</p>
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
            Nova Fatura
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-sm opacity-90 mb-1">Total Pago</p>
          <p className="text-3xl font-bold">{formatCurrency(totalPago)}</p>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-sm opacity-90 mb-1">Total Pendente</p>
          <p className="text-3xl font-bold">{formatCurrency(totalPendente)}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-sm opacity-90 mb-1">Total Geral</p>
          <p className="text-3xl font-bold">{formatCurrency(totalGeral)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-purple-600" />
            <h3 className="font-semibold text-purple-900">Filtros</h3>
          </div>
          {selectedFaturas.length > 0 && (
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
                    checked={selectedFaturas.length === filtered.length && filtered.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFaturas(filtered.map(f => f.id));
                      } else {
                        setSelectedFaturas([]);
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
              {filtered.map((fatura) => (
                <tr key={fatura.id} className="border-b border-purple-100 hover:bg-purple-50 transition-colors">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedFaturas.includes(fatura.id)}
                      onChange={() => toggleSelection(fatura.id)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="py-3 px-4 font-medium">{fatura.numeroFatura}</td>
                  <td className="py-3 px-4">{fatura.cliente}</td>
                  <td className="py-3 px-4 font-semibold text-purple-900">{formatCurrency(fatura.valor)}</td>
                  <td className="py-3 px-4">{new Date(fatura.dataVencimento).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleStatus(fatura)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        fatura.status === 'pago'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      }`}
                    >
                      {fatura.status === 'pago' ? 'Pago' : 'Pendente'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingFatura(fatura);
                          setFormData(fatura);
                          setShowModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => deleteFatura(fatura.id)}
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
            className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-purple-900 mb-4">
              {editingFatura ? 'Editar Fatura' : 'Nova Fatura'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Emissão</label>
                <input
                  type="date"
                  value={formData.dataEmissao}
                  onChange={(e) => setFormData({ ...formData, dataEmissao: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Desconto</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.desconto}
                  onChange={(e) => setFormData({ ...formData, desconto: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={saveFatura} className="flex-1 bg-purple-600 hover:bg-purple-700">
                {editingFatura ? 'Atualizar' : 'Salvar'}
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

export default FaturasPage;