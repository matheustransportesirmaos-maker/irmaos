import React, { useState, useEffect } from 'react';
import { Save, Image, Type, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const PersonalizacaoPage = ({ user, updatePersonalizacao }) => {
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#9333ea');

  useEffect(() => {
    const savedSettings = JSON.parse(localStorage.getItem('personalizacao') || '{}');
    if (savedSettings.companyName) {
      setCompanyName(savedSettings.companyName);
    }
    if (savedSettings.logo) {
      setLogoPreview(savedSettings.logo);
    }
    if (savedSettings.primaryColor) {
      setPrimaryColor(savedSettings.primaryColor);
    }
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setPrimaryColor(newColor);
  };

  const saveSettings = () => {
    const settings = {
      companyName,
      logo: logoPreview,
      primaryColor
    };
    localStorage.setItem('personalizacao', JSON.stringify(settings));
    updatePersonalizacao(settings);
    toast({
      title: "Salvo!",
      description: "As configurações de personalização foram salvas."
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-purple-900">Personalização</h1>
        <p className="text-purple-600 mt-1">Personalize a aparência do sistema</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-purple-900 flex items-center gap-2">
              <Image className="text-purple-600" />
              Logo da Empresa
            </h2>
            <div className="w-full h-40 border-2 border-dashed border-purple-200 rounded-lg flex items-center justify-center">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
              ) : (
                <p className="text-gray-500">Pré-visualização do logo</p>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-purple-900 flex items-center gap-2">
              <Type className="text-purple-600" />
              Nome da Empresa
            </h2>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Digite o nome da sua empresa"
              className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <h2 className="text-xl font-bold text-purple-900 flex items-center gap-2 mt-6">
              <Palette className="text-purple-600" />
              Cor do Sistema
            </h2>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={primaryColor}
                onChange={handleColorChange}
                className="w-16 h-10 p-1 bg-white border border-gray-300 rounded-lg cursor-pointer"
              />
              <span className="font-medium text-gray-700">{primaryColor}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-right">
          <Button onClick={saveSettings} className="bg-purple-600 hover:bg-purple-700">
            <Save size={18} className="mr-2" />
            Salvar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PersonalizacaoPage;