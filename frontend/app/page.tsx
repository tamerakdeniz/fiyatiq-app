'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Car, FileText, Loader2, PlusCircle, Sparkles, Trash2 } from 'lucide-react';
import { useState, useMemo } from 'react';

// Mock API service
const api = {
  hizliTahmin: async (data: any) => {
    const response = await fetch('http://localhost:8000/hizli-tahmin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Bir hata oluştu.');
    }
    return response.json();
  },
  detayliTahmin: async (data: any) => {
    const response = await fetch('http://localhost:8000/detayli-tahmin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Bir hata oluştu.');
    }
    return response.json();
  },
};

const ResultCard = ({ result }: { result: any }) => (
    <Card className="bg-white/60 backdrop-blur-sm border-blue-200/80 shadow-lg animate-fade-in">
        <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">Analiz Sonucu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <span className="font-medium text-gray-600">Ortalama Fiyat</span>
                <span className="text-3xl font-bold text-blue-600">
                    {result.ortalama_fiyat.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 })}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-sm text-green-600">En Düşük Fiyat</div>
                    <div className="text-xl font-semibold text-green-800">
                        {result.tahmini_fiyat_min.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 })}
                    </div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-sm text-red-600">En Yüksek Fiyat</div>
                    <div className="text-xl font-semibold text-red-800">
                        {result.tahmini_fiyat_max.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 })}
                    </div>
                </div>
            </div>
            <div>
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center"><Sparkles className="w-5 h-5 mr-2 text-yellow-500" /> Rapor</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border">{result.rapor}</p>
            </div>
            <div>
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center"><FileText className="w-5 h-5 mr-2 text-indigo-500" /> Pazar Analizi</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border">{result.pazar_analizi}</p>
            </div>
            <p className="text-xs text-center text-gray-500 pt-2">Analiz Tarihi: {new Date(result.analiz_tarihi).toLocaleString('tr-TR')}</p>
        </CardContent>
    </Card>
);

export default function HomePage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('hizli');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const [formData, setFormData] = useState({
        marka: '',
        model: '',
        yil: '',
        kilometre: '',
        yakit_tipi: '',
        vites_tipi: '',
        il: '',
        hasar_durumu: '',
        renk: '',
        motor_hacmi: '',
        motor_gucu: '',
        ekstra_bilgiler: '',
        hasar_detaylari: [{ parca: '', durum: '' }],
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleHasarChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const yeniHasarlar = [...formData.hasar_detaylari];
        yeniHasarlar[index] = { ...yeniHasarlar[index], [name]: value };
        setFormData(prev => ({ ...prev, hasar_detaylari: yeniHasarlar }));
    };

    const handleHasarDurumChange = (index: number, value: string) => {
        const yeniHasarlar = [...formData.hasar_detaylari];
        yeniHasarlar[index].durum = value;
        setFormData(prev => ({ ...prev, hasar_detaylari: yeniHasarlar }));
    };

    const addHasarKaydi = () => {
        setFormData(prev => ({ ...prev, hasar_detaylari: [...prev.hasar_detaylari, { parca: '', durum: '' }] }));
    };

    const removeHasarKaydi = (index: number) => {
        const yeniHasarlar = formData.hasar_detaylari.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, hasar_detaylari: yeniHasarlar }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        try {
            const apiFunc = activeTab === 'hizli' ? api.hizliTahmin : api.detayliTahmin;
            const submissionData = { ...formData, yil: parseInt(formData.yil), kilometre: parseInt(formData.kilometre) };
            const res = await apiFunc(submissionData);
            setResult(res);
        } catch (error: any) {
            toast({ title: 'Hata', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear; i >= currentYear - 50; i--) {
            years.push(i.toString());
        }
        return years;
    }, []);

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 text-gray-800">
            <header className="py-6">
                <div className="container mx-auto flex items-center justify-center gap-3">
                    <Car className="h-10 w-10 text-blue-600" />
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900">Fiyat<span className="text-blue-600">IQ</span></h1>
                </div>
                <p className="text-center text-lg text-gray-600 mt-2">Yapay Zeka Destekli Araç Fiyatlandırma Asistanınız</p>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    <Card className="bg-white/50 backdrop-blur-sm border-gray-200/70 shadow-md">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <CardHeader>
                                <TabsList className="grid w-full grid-cols-2 bg-gray-200/80">
                                    <TabsTrigger value="hizli">Hızlı Analiz</TabsTrigger>
                                    <TabsTrigger value="detayli">Detaylı Analiz</TabsTrigger>
                                </TabsList>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <TabsContent value="hizli">
                                        <div className="space-y-4 animate-fade-in">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <Input name="marka" placeholder="Marka" value={formData.marka} onChange={handleInputChange} required className="bg-white/80" />
                                                <Input name="model" placeholder="Model" value={formData.model} onChange={handleInputChange} required className="bg-white/80" />
                                                <Select name="yil" onValueChange={(v) => handleSelectChange('yil', v)} value={formData.yil} required>
                                                    <SelectTrigger className="bg-white/80"><SelectValue placeholder="Yıl" /></SelectTrigger>
                                                    <SelectContent>{yearOptions.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                                                </Select>
                                                <Input name="kilometre" placeholder="Kilometre" type="number" value={formData.kilometre} onChange={handleInputChange} required className="bg-white/80" />
                                                <Select name="yakit_tipi" onValueChange={(v) => handleSelectChange('yakit_tipi', v)} value={formData.yakit_tipi} required>
                                                    <SelectTrigger className="bg-white/80"><SelectValue placeholder="Yakıt Tipi" /></SelectTrigger>
                                                    <SelectContent>{['Benzin', 'Dizel', 'LPG', 'Hibrit', 'Elektrik'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                                                </Select>
                                                <Select name="vites_tipi" onValueChange={(v) => handleSelectChange('vites_tipi', v)} value={formData.vites_tipi} required>
                                                    <SelectTrigger className="bg-white/80"><SelectValue placeholder="Vites Tipi" /></SelectTrigger>
                                                    <SelectContent>{['Otomatik', 'Manuel', 'Yarı Otomatik'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                            <Input name="il" placeholder="İl" value={formData.il} onChange={handleInputChange} required className="bg-white/80" />
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="detayli">
                                        <div className="space-y-4 animate-fade-in">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <Input name="marka" placeholder="Marka" value={formData.marka} onChange={handleInputChange} required className="bg-white/80" />
                                                <Input name="model" placeholder="Model" value={formData.model} onChange={handleInputChange} required className="bg-white/80" />
                                                <Select name="yil" onValueChange={(v) => handleSelectChange('yil', v)} value={formData.yil} required>
                                                    <SelectTrigger className="bg-white/80"><SelectValue placeholder="Yıl" /></SelectTrigger>
                                                    <SelectContent>{yearOptions.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                                                </Select>
                                                <Input name="kilometre" placeholder="Kilometre" type="number" value={formData.kilometre} onChange={handleInputChange} required className="bg-white/80" />
                                                <Select name="yakit_tipi" onValueChange={(v) => handleSelectChange('yakit_tipi', v)} value={formData.yakit_tipi} required>
                                                    <SelectTrigger className="bg-white/80"><SelectValue placeholder="Yakıt Tipi" /></SelectTrigger>
                                                    <SelectContent>{['Benzin', 'Dizel', 'LPG', 'Hibrit', 'Elektrik'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                                                </Select>
                                                <Select name="vites_tipi" onValueChange={(v) => handleSelectChange('vites_tipi', v)} value={formData.vites_tipi} required>
                                                    <SelectTrigger className="bg-white/80"><SelectValue placeholder="Vites Tipi" /></SelectTrigger>
                                                    <SelectContent>{['Otomatik', 'Manuel', 'Yarı Otomatik'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                                                </Select>
                                                <Input name="renk" placeholder="Renk" value={formData.renk} onChange={handleInputChange} required className="bg-white/80" />
                                                <Input name="motor_hacmi" placeholder="Motor Hacmi (L)" type="number" step="0.1" value={formData.motor_hacmi} onChange={handleInputChange} className="bg-white/80" />
                                                <Input name="motor_gucu" placeholder="Motor Gücü (HP)" type="number" value={formData.motor_gucu} onChange={handleInputChange} className="bg-white/80" />
                                            </div>
                                            <Input name="il" placeholder="İl" value={formData.il} onChange={handleInputChange} required className="bg-white/80" />
                                            <textarea name="ekstra_bilgiler" placeholder="Ekstra Bilgiler (Örn: Bakımları yeni yapıldı, sigara içilmemiş...)" rows={3} value={formData.ekstra_bilgiler} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white/80" />

                                            <div className="space-y-3 pt-4">
                                                <Label className="font-medium text-gray-800">Hasar Detayları</Label>
                                                {formData.hasar_detaylari.map((hasar, index) => (
                                                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-100/80 rounded-md">
                                                        <Input name="parca" placeholder="Örn: Kaput" value={hasar.parca} onChange={(e) => handleHasarChange(index, e)} className="flex-grow" />
                                                        <Select name="durum" onValueChange={(v) => handleHasarDurumChange(index, v)} value={hasar.durum}>
                                                            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Durum" /></SelectTrigger>
                                                            <SelectContent>{['Boyalı', 'Değişen', 'Lokal Boyalı', 'Çizik', 'Ezik'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeHasarKaydi(index)} className="text-red-500 hover:text-red-700">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                <Button type="button" variant="outline" onClick={addHasarKaydi} className="w-full border-dashed">
                                                    <PlusCircle className="h-4 w-4 mr-2" /> Hasar Kaydı Ekle
                                                </Button>
                                            </div>
                                        </div>
                                    </TabsContent>
                                    <Button type="submit" className="w-full !mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg" disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />} Analiz Et
                                    </Button>
                                </form>
                            </CardContent>
                        </Tabs>
                    </Card>

                    <div className="sticky top-8">
                        {loading && (
                            <div className="flex flex-col items-center justify-center h-96">
                                <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
                                <p className="text-lg text-gray-600">Analiz yapılıyor, lütfen bekleyin...</p>
                            </div>
                        )}
                        {result && <ResultCard result={result} />}
                        {!loading && !result && (
                            <Card className="bg-white/60 backdrop-blur-sm border-blue-200/80 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-800">Hoş Geldiniz!</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-gray-600">Aracınızın piyasa değerini öğrenmek için sol taraftaki formu doldurun.</p>
                                    <ul className="space-y-2 text-sm text-gray-700">
                                        <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-500" /> <strong>Hızlı Analiz:</strong> Temel bilgilerle anında fiyat aralığı alın.</li>
                                        <li className="flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-500" /> <strong>Detaylı Analiz:</strong> Hasar, renk gibi detayları ekleyerek kapsamlı rapor edinin.</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}