import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Download, Upload, FileSpreadsheet, Trash2, Edit, FileText, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PagamentosMotoristasPage = ({ user }) => {
  const [pagamentos, setPagamentos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [editingPagamento, setEditingPagamento] = useState(null);
  const [exportMotorista, setExportMotorista] = useState('');
  const [exportPeriodoInicio, setExportPeriodoInicio] = useState('');
  const [exportPeriodoFim, setExportPeriodoFim] = useState('');
  const [pdfMotorista, setPdfMotorista] = useState('');
  const [pdfPeriodoInicio, setPdfPeriodoInicio] = useState('');
  const [pdfPeriodoFim, setPdfPeriodoFim] = useState('');
  const [selectedPagamentos, setSelectedPagamentos] = useState([]);
  const [formData, setFormData] = useState({
    fatura: '',
    dataSaida: '',
    dataVencimento: '',
    motorista: '',
    valorCombinado: '',
    status: 'pendente',
    contaBancaria: ''
  });

  useEffect(() => {
    loadPagamentos();
  }, []);

  const loadPagamentos = () => {
    const stored = JSON.parse(localStorage.getItem('pagamentosMotoristas') || '[]');
    setPagamentos(stored);
  };

  const savePagamento = () => {
    if (!formData.fatura || !formData.dataSaida || !formData.dataVencimento || !formData.motorista || !formData.valorCombinado) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios!",
        variant: "destructive"
      });
      return;
    }

    let updatedPagamentos;
    if (editingPagamento) {
      updatedPagamentos = pagamentos.map(p => p.id === editingPagamento.id ? { ...formData, id: p.id } : p);
      
      const contasPagar = JSON.parse(localStorage.getItem('contasPagar') || '[]');
      const updatedContasPagar = contasPagar.map(c =>
        c.pagamentoMotoristaId === editingPagamento.id
          ? { ...c, valor: formData.valorCombinado, dataVencimento: formData.dataVencimento, status: formData.status }
          : c
      );
      localStorage.setItem('contasPagar', JSON.stringify(updatedContasPagar));
    } else {
      const newPagamento = { ...formData, id: Date.now() };
      updatedPagamentos = [...pagamentos, newPagamento];
      
      const contaPagar = {
        id: Date.now() + 1,
        pagamentoMotoristaId: newPagamento.id,
        descricao: `Pagamento Motorista - ${newPagamento.fatura}`,
        fornecedor: newPagamento.motorista,
        valor: newPagamento.valorCombinado,
        dataVencimento: newPagamento.dataVencimento,
        status: newPagamento.status
      };
      
      const contasPagar = JSON.parse(localStorage.getItem('contasPagar') || '[]');
      contasPagar.push(contaPagar);
      localStorage.setItem('contasPagar', JSON.stringify(contasPagar));
    }

    localStorage.setItem('pagamentosMotoristas', JSON.stringify(updatedPagamentos));
    setPagamentos(updatedPagamentos);
    
    toast({
      title: "Sucesso!",
      description: editingPagamento ? "Pagamento atualizado!" : "Pagamento cadastrado!"
    });

    resetForm();
  };

  const deletePagamento = (id) => {
    const updated = pagamentos.filter(p => p.id !== id);
    localStorage.setItem('pagamentosMotoristas', JSON.stringify(updated));
    setPagamentos(updated);

    const contasPagar = JSON.parse(localStorage.getItem('contasPagar') || '[]');
    const updatedContasPagar = contasPagar.filter(c => c.pagamentoMotoristaId !== id);
    localStorage.setItem('contasPagar', JSON.stringify(updatedContasPagar));

    toast({ title: "Pagamento excluído!" });
  };

  const resetForm = () => {
    setFormData({
      fatura: '',
      dataSaida: '',
      dataVencimento: '',
      motorista: '',
      valorCombinado: '',
      status: 'pendente',
      contaBancaria: ''
    });
    setEditingPagamento(null);
    setShowModal(false);
  };

  const downloadTemplate = () => {
    const template = [{
      'Fatura': 'FAT-MOT-001',
      'Data Saída': '2024-01-15',
      'Data Vencimento': '2024-02-15',
      'Motorista': 'João Silva',
      'Valor Combinado': '3500,50',
      'Status': 'pendente',
      'Conta Bancária': '12345-6'
    }];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo');
    XLSX.writeFile(wb, 'modelo_pagamentos_motoristas.xlsx');

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
          fatura: row['Fatura'] || row['fatura'] || '',
          dataSaida: row['Data Saída'] || row['dataSaida'] || '',
          dataVencimento: row['Data Vencimento'] || row['dataVencimento'] || '',
          motorista: row['Motorista'] || row['motorista'] || '',
          valorCombinado: String(parseCurrency(row['Valor Combinado'] || row['valorCombinado']) || 0),
          status: row['Status'] || row['status'] || 'pendente',
          contaBancaria: row['Conta Bancária'] || row['contaBancaria'] || ''
        }));

        const existingPagamentos = [...pagamentos];
        imported.forEach(newPagamento => {
          const existingIndex = existingPagamentos.findIndex(
            p => p.fatura === newPagamento.fatura
          );
          
          if (existingIndex >= 0) {
            existingPagamentos[existingIndex] = { ...existingPagamentos[existingIndex], ...newPagamento };
          } else {
            existingPagamentos.push(newPagamento);
            
            const contaPagar = {
              id: Date.now() + Math.random(),
              pagamentoMotoristaId: newPagamento.id,
              descricao: `Pagamento Motorista - ${newPagamento.fatura}`,
              fornecedor: newPagamento.motorista,
              valor: newPagamento.valorCombinado,
              dataVencimento: newPagamento.dataVencimento,
              status: newPagamento.status
            };
            
            const contasPagar = JSON.parse(localStorage.getItem('contasPagar') || '[]');
            contasPagar.push(contaPagar);
            localStorage.setItem('contasPagar', JSON.stringify(contasPagar));
          }
        });

        localStorage.setItem('pagamentosMotoristas', JSON.stringify(existingPagamentos));
        setPagamentos(existingPagamentos);

        toast({
          title: "Importado!",
          description: `${imported.length} pagamentos importados`
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
    if (!exportMotorista && !exportPeriodoInicio && !exportPeriodoFim) {
      const data = pagamentos.map(p => ({
        'Fatura': p.fatura,
        'Data Saída': p.dataSaida,
        'Data Vencimento': p.dataVencimento,
        'Motorista': p.motorista,
        'Valor Combinado': parseFloat(p.valorCombinado),
        'Status': p.status,
        'Conta Bancária': p.contaBancaria
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pagamentos');
      XLSX.writeFile(wb, 'pagamentos_motoristas.xlsx');

      toast({ title: "Exportado!" });
      return;
    }

    setShowExportModal(true);
  };

  const confirmExportExcel = () => {
    const filtered = pagamentos.filter(p => {
      const matchMotorista = !exportMotorista || p.motorista.toLowerCase().includes(exportMotorista.toLowerCase());
      
      let matchPeriodo = true;
      if (exportPeriodoInicio && exportPeriodoFim) {
        const dataSaida = new Date(p.dataSaida);
        const inicio = new Date(exportPeriodoInicio);
        const fim = new Date(exportPeriodoFim);
        matchPeriodo = dataSaida >= inicio && dataSaida <= fim;
      }
      
      return matchMotorista && matchPeriodo;
    });

    const data = filtered.map(p => ({
      'Fatura': p.fatura,
      'Data Saída': p.dataSaida,
      'Data Vencimento': p.dataVencimento,
      'Motorista': p.motorista,
      'Valor Combinado': parseFloat(p.valorCombinado),
      'Status': p.status,
      'Conta Bancária': p.contaBancaria
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pagamentos');
    XLSX.writeFile(wb, 'pagamentos_motoristas.xlsx');

    setShowExportModal(false);
    setExportMotorista('');
    setExportPeriodoInicio('');
    setExportPeriodoFim('');

    toast({ title: "Exportado!" });
  };

  const exportToPDF = () => {
    if (!pdfMotorista || !pdfPeriodoInicio || !pdfPeriodoFim) {
      toast({
        title: "Erro",
        description: "Preencha todos os filtros para gerar a fatura",
        variant: "destructive"
      });
      return;
    }

    const filtered = pagamentos.filter(p => {
      const matchMotorista = p.motorista.toLowerCase().includes(pdfMotorista.toLowerCase());
      const dataSaida = new Date(p.dataSaida);
      const inicio = new Date(pdfPeriodoInicio);
      const fim = new Date(pdfPeriodoFim);
      const matchPeriodo = dataSaida >= inicio && dataSaida <= fim;
      return matchMotorista && matchPeriodo;
    });

    if (filtered.length === 0) {
      toast({
        title: "Nenhum dado encontrado",
        description: "Não há pagamentos para os filtros selecionados",
        variant: "destructive"
      });
      return;
    }

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Fatura de Pagamento - Motorista', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Motorista: ${pdfMotorista}`, 14, 32);
    doc.text(`Período: ${new Date(pdfPeriodoInicio).toLocaleDateString('pt-BR')} a ${new Date(pdfPeriodoFim).toLocaleDateString('pt-BR')}`, 14, 38);

    const tableData = filtered.map(p => [
      p.fatura,
      new Date(p.dataSaida).toLocaleDateString('pt-BR'),
      formatCurrency(p.valorCombinado),
      p.status === 'pago' ? 'Pago' : 'Pendente'
    ]);

    const total = filtered.reduce((sum, p) => sum + parseFloat(p.valorCombinado || 0), 0);

    doc.autoTable({
      startY: 45,
      head: [['Fatura', 'Data Saída', 'Valor', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [147, 51, 234] }
    });

    const finalY = doc.lastAutoTable.finalY || 45;
    doc.setFontSize(12);
    doc.text(`Total: ${formatCurrency(total)}`, 14, finalY + 10);

    doc.save(`fatura_motorista_${pdfMotorista.replace(/\s+/g, '_')}.pdf`);
    
    setShowPdfModal(false);
    setPdfMotorista('');
    setPdfPeriodoInicio('');
    setPdfPeriodoFim('');

    toast({ title: "Fatura gerada com sucesso!" });
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
    setSelectedPagamentos(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const updateSelectedStatus = (newStatus) => {
    if (selectedPagamentos.length === 0) {
      toast({ title: "Nenhum pagamento selecionado", variant: "destructive" });
      return;
    }

    const updatedPagamentos = pagamentos.map(p =>
      selectedPagamentos.includes(p.id) ? { ...p, status: newStatus } : p
    );
    
    localStorage.setItem('pagamentosMotoristas', JSON.stringify(updatedPagamentos));
    setPagamentos(updatedPagamentos);

    const contasPagar = JSON.parse(localStorage.getItem('contasPagar') || '[]');
    const updatedContasPagar = contasPagar.map(c =>
      selectedPagamentos.includes(c.pagamentoMotoristaId) ? { ...c, status: newStatus } : c
    );
    localStorage.setItem('contasPagar', JSON.stringify(updatedContasPagar));

    toast({
      title: "Status atualizado!",
      description: `${selectedPagamentos.length} pagamentos marcados como ${newStatus === 'pago' ? 'pagos' : 'pendentes'}`
    });
    setSelectedPagamentos([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-purple-900">Pagamentos de Motorista</h1>
          <p className="text-purple-600 mt-1">Gerencie pagamentos de motoristas</p>
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
            Novo Pagamento
          </Button>
        </div>
      </div>

      {selectedPagamentos.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4 flex items-center gap-4">
          <span className="font-medium text-purple-900">{selectedPagamentos.length} selecionados</span>
          <Button onClick={() => updateSelectedStatus('pago')} size="sm" className="bg-green-600 hover:bg-green-700">
            <CheckCircle size={16} className="mr-2" /> Marcar como Pago
          </Button>
          <Button onClick={() => updateSelectedStatus('pendente')} size="sm" className="bg-orange-600 hover:bg-orange-700">
            <XCircle size={16} className="mr-2" /> Marcar como Pendente
          </Button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-600 text-white">
              <tr>
                <th className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedPagamentos.length === pagamentos.length && pagamentos.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPagamentos(pagamentos.map(p => p.id));
                      } else {
                        setSelectedPagamentos([]);
                      }
                    }}
                    className="w-4 h-4"
                  />
                </th>
                <th className="text-left py-3 px-4">Fatura</th>
                <th className="text-left py-3 px-4">Data Saída</th>
                <th className="text-left py-3 px-4">Vencimento</th>
                <th className="text-left py-3 px-4">Motorista</th>
                <th className="text-left py-3 px-4">Valor</th>
                <th className="text-left py-3 px-4">Conta Bancária</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pagamentos.map((pagamento) => (
                <tr key={pagamento.id} className="border-b border-purple-100 hover:bg-purple-50 transition-colors">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedPagamentos.includes(pagamento.id)}
                      onChange={() => toggleSelection(pagamento.id)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="py-3 px-4 font-medium">{pagamento.fatura}</td>
                  <td className="py-3 px-4">{new Date(pagamento.dataSaida).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-4">{new Date(pagamento.dataVencimento).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-4">{pagamento.motorista}</td>
                  <td className="py-3 px-4 font-semibold text-purple-900">{formatCurrency(pagamento.valorCombinado)}</td>
                  <td className="py-3 px-4">{pagamento.contaBancaria}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      pagamento.status === 'pago'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {pagamento.status === 'pago' ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingPagamento(pagamento);
                          setFormData(pagamento);
                          setShowModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => deletePagamento(pagamento.id)}
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
              {editingPagamento ? 'Editar Pagamento' : 'Novo Pagamento'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fatura *</label>
                <input
                  type="text"
                  value={formData.fatura}
                  onChange={(e) => setFormData({ ...formData, fatura: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motorista *</label>
                <input
                  type="text"
                  value={formData.motorista}
                  onChange={(e) => setFormData({ ...formData, motorista: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Saída *</label>
                <input
                  type="date"
                  value={formData.dataSaida}
                  onChange={(e) => setFormData({ ...formData, dataSaida: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Combinado *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valorCombinado}
                  onChange={(e) => setFormData({ ...formData, valorCombinado: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conta Bancária</label>
                <input
                  type="text"
                  value={formData.contaBancaria}
                  onChange={(e) => setFormData({ ...formData, contaBancaria: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="md:col-span-2">
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
              <Button onClick={savePagamento} className="flex-1 bg-purple-600 hover:bg-purple-700">
                {editingPagamento ? 'Atualizar' : 'Salvar'}
              </Button>
              <Button onClick={resetForm} variant="outline" className="flex-1">
                Cancelar
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold text-purple-900 mb-4">Exportar Excel</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motorista</label>
                <input
                  type="text"
                  value={exportMotorista}
                  onChange={(e) => setExportMotorista(e.target.value)}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                <input
                  type="date"
                  value={exportPeriodoInicio}
                  onChange={(e) => setExportPeriodoInicio(e.target.value)}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
                <input
                  type="date"
                  value={exportPeriodoFim}
                  onChange={(e) => setExportPeriodoFim(e.target.value)}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={confirmExportExcel} className="flex-1 bg-orange-600 hover:bg-orange-700">
                Exportar
              </Button>
              <Button onClick={() => setShowExportModal(false)} variant="outline" className="flex-1">
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
            <h2 className="text-2xl font-bold text-purple-900 mb-4">Exportar Fatura PDF</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motorista *</label>
                <input
                  type="text"
                  value={pdfMotorista}
                  onChange={(e) => setPdfMotorista(e.target.value)}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Início *</label>
                <input
                  type="date"
                  value={pdfPeriodoInicio}
                  onChange={(e) => setPdfPeriodoInicio(e.target.value)}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim *</label>
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
                Gerar Fatura
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

export default PagamentosMotoristasPage;