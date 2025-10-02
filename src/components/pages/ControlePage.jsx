import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Download, Upload, FileSpreadsheet, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';

const ControlePage = ({ user }) => {
  const [notas, setNotas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNota, setEditingNota] = useState(null);
  const [selectedNotas, setSelectedNotas] = useState([]);
  const [formData, setFormData] = useState({
    numeroNota: '',
    cliente: '',
    numeroCarga: '',
    dataNota: '',
    status: 'a-vencer'
  });

  useEffect(() => {
    loadNotas();
  }, []);

  const loadNotas = () => {
    const stored = JSON.parse(localStorage.getItem('notas') || '[]');
    const updated = stored.map(nota => ({
      ...nota,
      status: calculateStatus(nota.dataNota)
    }));
    setNotas(updated);
    localStorage.setItem('notas', JSON.stringify(updated));
  };

  const calculateStatus = (dataNota) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataNotaObj = new Date(dataNota);
    dataNotaObj.setHours(0, 0, 0, 0);

    if (dataNotaObj.getTime() === hoje.getTime()) {
      return 'vencendo-hoje';
    } else if (dataNotaObj > hoje) {
      return 'a-vencer';
    } else {
      return 'vencida';
    }
  };

  const saveNota = () => {
    if (!formData.numeroNota || !formData.cliente || !formData.numeroCarga || !formData.dataNota) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos!",
        variant: "destructive"
      });
      return;
    }

    const notaData = {
      ...formData,
      status: calculateStatus(formData.dataNota)
    };

    let updatedNotas;
    if (editingNota) {
      updatedNotas = notas.map(n => n.id === editingNota.id ? { ...notaData, id: n.id } : n);
    } else {
      updatedNotas = [...notas, { ...notaData, id: Date.now() }];
    }

    localStorage.setItem('notas', JSON.stringify(updatedNotas));
    setNotas(updatedNotas);
    
    toast({
      title: "Sucesso!",
      description: editingNota ? "Nota atualizada!" : "Nota cadastrada!"
    });

    resetForm();
  };

  const deleteNota = (id) => {
    const updated = notas.filter(n => n.id !== id);
    localStorage.setItem('notas', JSON.stringify(updated));
    setNotas(updated);
    toast({ title: "Nota excluída!" });
  };

  const deleteSelected = () => {
    if (selectedNotas.length === 0) {
      toast({
        title: "Nenhuma nota selecionada",
        variant: "destructive"
      });
      return;
    }

    const updated = notas.filter(n => !selectedNotas.includes(n.id));
    localStorage.setItem('notas', JSON.stringify(updated));
    setNotas(updated);
    setSelectedNotas([]);
    
    toast({
      title: "Notas excluídas!",
      description: `${selectedNotas.length} notas foram removidas`
    });
  };

  const toggleSelection = (id) => {
    setSelectedNotas(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const resetForm = () => {
    setFormData({
      numeroNota: '',
      cliente: '',
      numeroCarga: '',
      dataNota: '',
      status: 'a-vencer'
    });
    setEditingNota(null);
    setShowModal(false);
  };

  const downloadTemplate = () => {
    const template = [{
      'Número Nota': 'NOTA-001',
      'Cliente': 'Cliente Exemplo Ltda',
      'Número Carga': 'CARGA-001',
      'Data Nota': '2024-02-15'
    }];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo');
    XLSX.writeFile(wb, 'modelo_controle.xlsx');

    toast({
      title: "Modelo baixado!",
      description: "Use este arquivo como referência"
    });
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
          numeroNota: row['Número Nota'] || row['numeroNota'] || '',
          cliente: row['Cliente'] || row['cliente'] || '',
          numeroCarga: row['Número Carga'] || row['numeroCarga'] || '',
          dataNota: row['Data Nota'] || row['dataNota'] || '',
          status: calculateStatus(row['Data Nota'] || row['dataNota'] || '')
        }));

        const existingNotas = [...notas];
        imported.forEach(newNota => {
          const existingIndex = existingNotas.findIndex(
            n => n.numeroNota === newNota.numeroNota
          );
          
          if (existingIndex >= 0) {
            existingNotas[existingIndex] = { ...existingNotas[existingIndex], ...newNota };
          } else {
            existingNotas.push(newNota);
          }
        });

        localStorage.setItem('notas', JSON.stringify(existingNotas));
        setNotas(existingNotas);

        toast({
          title: "Importado!",
          description: `${imported.length} notas importadas`
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
    const data = notas.map(n => ({
      'Número Nota': n.numeroNota,
      'Cliente': n.cliente,
      'Número Carga': n.numeroCarga,
      'Data Nota': n.dataNota,
      'Status': n.status
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Controle');
    XLSX.writeFile(wb, 'controle.xlsx');

    toast({ title: "Exportado!" });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'vencendo-hoje':
        return 'bg-yellow-100 text-yellow-700';
      case 'a-vencer':
        return 'bg-blue-100 text-blue-700';
      case 'vencida':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'vencendo-hoje':
        return 'Vencendo Hoje';
      case 'a-vencer':
        return 'A Vencer';
      case 'vencida':
        return 'Vencida';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-purple-900">Controle</h1>
          <p className="text-purple-600 mt-1">Gerencie suas notas</p>
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

          {selectedNotas.length > 0 && (
            <Button onClick={deleteSelected} className="bg-red-600 hover:bg-red-700">
              <Trash2 size={18} className="mr-2" />
              Excluir Selecionadas ({selectedNotas.length})
            </Button>
          )}

          <Button onClick={() => setShowModal(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus size={18} className="mr-2" />
            Nova Nota
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-600 text-white">
              <tr>
                <th className="text-left py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedNotas.length === notas.length && notas.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedNotas(notas.map(n => n.id));
                      } else {
                        setSelectedNotas([]);
                      }
                    }}
                    className="w-4 h-4"
                  />
                </th>
                <th className="text-left py-3 px-4">Nº Nota</th>
                <th className="text-left py-3 px-4">Cliente</th>
                <th className="text-left py-3 px-4">Nº Carga</th>
                <th className="text-left py-3 px-4">Data Nota</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {notas.map((nota) => (
                <tr key={nota.id} className="border-b border-purple-100 hover:bg-purple-50 transition-colors">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedNotas.includes(nota.id)}
                      onChange={() => toggleSelection(nota.id)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="py-3 px-4 font-medium">{nota.numeroNota}</td>
                  <td className="py-3 px-4">{nota.cliente}</td>
                  <td className="py-3 px-4">{nota.numeroCarga}</td>
                  <td className="py-3 px-4">{new Date(nota.dataNota).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(nota.status)}`}>
                      {getStatusLabel(nota.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingNota(nota);
                          setFormData(nota);
                          setShowModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => deleteNota(nota.id)}
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
              {editingNota ? 'Editar Nota' : 'Nova Nota'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número da Nota *</label>
                <input
                  type="text"
                  value={formData.numeroNota}
                  onChange={(e) => setFormData({ ...formData, numeroNota: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Número da Carga *</label>
                <input
                  type="text"
                  value={formData.numeroCarga}
                  onChange={(e) => setFormData({ ...formData, numeroCarga: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data da Nota *</label>
                <input
                  type="date"
                  value={formData.dataNota}
                  onChange={(e) => setFormData({ ...formData, dataNota: e.target.value })}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={saveNota} className="flex-1 bg-purple-600 hover:bg-purple-700">
                {editingNota ? 'Atualizar' : 'Salvar'}
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

export default ControlePage;