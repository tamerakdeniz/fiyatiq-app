'use client';

import type React from 'react';

import { Navbar } from '@/components/navbar';
import { PrivateRoute } from '@/components/private-route';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { vehicleService } from '@/services/api';
import {
  AlertCircle,
  BarChart3,
  Brain,
  Car,
  DollarSign,
  Loader2,
  Plus,
  Save,
  Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface CarPart {
  id: number;
  parca_adi: string;
  kategori: string;
  ortalama_maliyet: number | null;
  etki_faktoru: number;
  aktif: boolean;
}

interface DamageType {
  id: number;
  hasar_adi: string;
  aciklama: string | null;
  deger_azalma_orani: number;
  aktif: boolean;
}

interface DamageDetail {
  parca_id: number;
  hasar_tipi_id: number;
  hasar_seviyesi: string;
  tahmini_maliyet: number | null;
  aciklama: string;
}

interface DetailedEstimationResult {
  tahmini_fiyat_min: number;
  tahmini_fiyat_max: number;
  ortalama_fiyat: number;
  pazar_fiyati: number;
  hasar_indirimi: number;
  net_fiyat: number;
  hasar_detay_raporu: any[];
  toplam_depreciation_orani: number;
  rapor: string;
  pazar_analizi: string;
  oneri: string;
  analiz_tarihi: string;
  güven_skoru: number;
  veri_kaynagi: string;
  tahmin_id?: number;
}

function DetailedEstimateContent() {
  const [formData, setFormData] = useState({
    marka: '',
    model: '',
    yil: '',
    kilometre: '',
    yakit_tipi: 'Benzin',
    vites_tipi: 'Manuel',
    renk: 'Beyaz',
    il: 'İstanbul',
    motor_hacmi: '',
    motor_gucu: '',
    genel_durum: 'İyi',
    bakım_durumu: 'Düzenli',
    kaza_gecmisi: false,
    ekstra_bilgiler: ''
  });

  const [damageDetails, setDamageDetails] = useState<DamageDetail[]>([]);
  const [carParts, setCarParts] = useState<CarPart[]>([]);
  const [damageTypes, setDamageTypes] = useState<DamageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!result) return;

    setSaving(true);
    try {
      const vehicleData = {
        brand: formData.marka,
        model: formData.model,
        year: parseInt(formData.yil),
        km: parseInt(formData.kilometre),
        damageStatus: `Detaylı (${damageDetails.length} hasar)`,
        fuelType: formData.yakit_tipi,
        transmission: formData.vites_tipi,
        color: formData.renk,
        estimatedPrice: result.net_fiyat,
        aiSummary: result.rapor
      };

      await vehicleService.saveVehicle(vehicleData);
      toast({
        title: 'Araç kaydedildi!',
        description: 'Araç panonuza eklendi.'
      });
      router.push('/dashboard');
    } catch (err: any) {
      toast({
        title: 'Hata',
        description: err.message || 'Araç kaydedilemedi',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };
  const [result, setResult] = useState<DetailedEstimationResult | null>(null);
  const [error, setError] = useState('');

  const router = useRouter();
  const { toast } = useToast();

  const fuelOptions = ['Benzin', 'Dizel', 'LPG', 'Hibrit', 'Elektrik'];
  const transmissionOptions = ['Manuel', 'Otomatik'];
  const colorOptions = [
    'Beyaz',
    'Siyah',
    'Gri',
    'Mavi',
    'Kırmızı',
    'Yeşil',
    'Sarı',
    'Turuncu',
    'Mor',
    'Kahverengi'
  ];
  const cityOptions = [
    'İstanbul',
    'Ankara',
    'İzmir',
    'Bursa',
    'Antalya',
    'Adana',
    'Konya',
    'Gaziantep',
    'Mersin',
    'Diyarbakır'
  ];
  const conditionOptions = ['Mükemmel', 'Çok İyi', 'İyi', 'Orta', 'Kötü'];
  const maintenanceOptions = ['Düzenli', 'Kısmen', 'Eksik', 'Bilinmiyor'];
  const severityOptions = ['Hafif', 'Orta', 'Ağır'];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  // Load car parts and damage types
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [partsResponse, damageTypesResponse] = await Promise.all([
          fetch('http://localhost:8000/arac-parcalari'),
          fetch('http://localhost:8000/hasar-tipleri')
        ]);

        if (partsResponse.ok && damageTypesResponse.ok) {
          const parts = await partsResponse.json();
          const damages = await damageTypesResponse.json();
          setCarParts(parts);
          setDamageTypes(damages);
        } else {
          throw new Error('Failed to load data');
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
        toast({
          title: 'Hata',
          description: 'Araç parçaları ve hasar tipleri yüklenemedi',
          variant: 'destructive'
        });
      } finally {
        setLoadingData(false);
      }
    };

    loadInitialData();
  }, [toast]);

  const handleChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addDamageDetail = () => {
    setDamageDetails(prev => [
      ...prev,
      {
        parca_id: 0,
        hasar_tipi_id: 0,
        hasar_seviyesi: 'Orta',
        tahmini_maliyet: null,
        aciklama: ''
      }
    ]);
  };

  const removeDamageDetail = (index: number) => {
    setDamageDetails(prev => prev.filter((_, i) => i !== index));
  };

  const updateDamageDetail = (index: number, field: string, value: any) => {
    setDamageDetails(prev =>
      prev.map((detail, i) =>
        i === index ? { ...detail, [field]: value } : detail
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const requestData = {
        marka: formData.marka,
        model: formData.model,
        yil: parseInt(formData.yil),
        kilometre: parseInt(formData.kilometre),
        yakit_tipi: formData.yakit_tipi,
        vites_tipi: formData.vites_tipi,
        renk: formData.renk,
        il: formData.il,
        motor_hacmi: formData.motor_hacmi
          ? parseFloat(formData.motor_hacmi)
          : null,
        motor_gucu: formData.motor_gucu ? parseInt(formData.motor_gucu) : null,
        genel_durum: formData.genel_durum,
        bakım_durumu: formData.bakım_durumu,
        kaza_gecmisi: formData.kaza_gecmisi,
        ekstra_bilgiler: formData.ekstra_bilgiler,
        hasar_detaylari: damageDetails.filter(
          d => d.parca_id > 0 && d.hasar_tipi_id > 0
        )
      };

      const response = await fetch('http://localhost:8000/detayli-tahmin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Tahmin yapılamadı');
      }

      const result = await response.json();
      setResult(result);

      toast({
        title: 'Başarılı!',
        description: 'Detaylı fiyat tahmini tamamlandı'
      });
    } catch (err: any) {
      setError(err.message || 'Fiyat tahmini yapılamadı');
      toast({
        title: 'Hata',
        description: err.message || 'Fiyat tahmini yapılamadı',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">
          Detaylı Araç Değerlendirmesi
        </h1>
        <p className="text-gray-600">
          Parça bazında hasar analizi ile profesyonel fiyat tahmini
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle Information Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Araç Bilgileri
              </CardTitle>
              <CardDescription>
                Detaylı analiz için tüm araç bilgilerini girin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Basic Vehicle Info */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Temel Bilgiler</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand">Marka</Label>
                      <Input
                        id="brand"
                        placeholder="Örn: Toyota"
                        value={formData.marka}
                        onChange={e => handleChange('marka', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        placeholder="Örn: Corolla"
                        value={formData.model}
                        onChange={e => handleChange('model', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="year">Yıl</Label>
                      <Select
                        value={formData.yil}
                        onValueChange={value => handleChange('yil', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Yıl seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map(year => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="km">Kilometre</Label>
                      <Input
                        id="km"
                        type="number"
                        placeholder="Örn: 50000"
                        value={formData.kilometre}
                        onChange={e =>
                          handleChange('kilometre', e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fuel">Yakıt Tipi</Label>
                      <Select
                        value={formData.yakit_tipi}
                        onValueChange={value =>
                          handleChange('yakit_tipi', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fuelOptions.map(option => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="transmission">Vites</Label>
                      <Select
                        value={formData.vites_tipi}
                        onValueChange={value =>
                          handleChange('vites_tipi', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {transmissionOptions.map(option => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="color">Renk</Label>
                      <Select
                        value={formData.renk}
                        onValueChange={value => handleChange('renk', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {colorOptions.map(option => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Şehir</Label>
                      <Select
                        value={formData.il}
                        onValueChange={value => handleChange('il', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {cityOptions.map(option => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Technical Details */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Teknik Detaylar</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="engine">Motor Hacmi (L)</Label>
                      <Input
                        id="engine"
                        type="number"
                        step="0.1"
                        placeholder="Örn: 1.6"
                        value={formData.motor_hacmi}
                        onChange={e =>
                          handleChange('motor_hacmi', e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="power">Motor Gücü (HP)</Label>
                      <Input
                        id="power"
                        type="number"
                        placeholder="Örn: 130"
                        value={formData.motor_gucu}
                        onChange={e =>
                          handleChange('motor_gucu', e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Condition Assessment */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Durum Değerlendirmesi</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="condition">Genel Durum</Label>
                      <Select
                        value={formData.genel_durum}
                        onValueChange={value =>
                          handleChange('genel_durum', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {conditionOptions.map(option => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maintenance">Bakım Durumu</Label>
                      <Select
                        value={formData.bakım_durumu}
                        onValueChange={value =>
                          handleChange('bakım_durumu', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {maintenanceOptions.map(option => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="accident"
                      checked={formData.kaza_gecmisi}
                      onChange={e =>
                        handleChange('kaza_gecmisi', e.target.checked)
                      }
                      className="rounded"
                    />
                    <Label htmlFor="accident">Kaza geçmişi var</Label>
                  </div>
                </div>

                {/* Damage Details */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-lg">Hasar Detayları</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDamageDetail}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Hasar Ekle
                    </Button>
                  </div>

                  {damageDetails.map((detail, index) => (
                    <Card key={index} className="border-dashed">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-4">
                          <Badge variant="outline">Hasar #{index + 1}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDamageDetail(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Araç Parçası</Label>
                            <Select
                              value={detail.parca_id.toString()}
                              onValueChange={value =>
                                updateDamageDetail(
                                  index,
                                  'parca_id',
                                  parseInt(value)
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Parça seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                {carParts.map(part => (
                                  <SelectItem
                                    key={part.id}
                                    value={part.id.toString()}
                                  >
                                    {part.parca_adi} ({part.kategori})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Hasar Tipi</Label>
                            <Select
                              value={detail.hasar_tipi_id.toString()}
                              onValueChange={value =>
                                updateDamageDetail(
                                  index,
                                  'hasar_tipi_id',
                                  parseInt(value)
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Hasar tipi seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                {damageTypes.map(damageType => (
                                  <SelectItem
                                    key={damageType.id}
                                    value={damageType.id.toString()}
                                  >
                                    {damageType.hasar_adi}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <Label>Hasar Seviyesi</Label>
                            <Select
                              value={detail.hasar_seviyesi}
                              onValueChange={value =>
                                updateDamageDetail(
                                  index,
                                  'hasar_seviyesi',
                                  value
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {severityOptions.map(option => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Tahmini Maliyet (TL)</Label>
                            <Input
                              type="number"
                              placeholder="Örn: 5000"
                              value={detail.tahmini_maliyet || ''}
                              onChange={e =>
                                updateDamageDetail(
                                  index,
                                  'tahmini_maliyet',
                                  parseInt(e.target.value) || null
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-2 mt-4">
                          <Label>Açıklama</Label>
                          <Textarea
                            placeholder="Hasarla ilgili ek bilgiler..."
                            value={detail.aciklama}
                            onChange={e =>
                              updateDamageDetail(
                                index,
                                'aciklama',
                                e.target.value
                              )
                            }
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Ek Bilgiler</h3>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Ek Notlar</Label>
                    <Textarea
                      id="notes"
                      placeholder="Araçla ilgili diğer önemli bilgiler..."
                      value={formData.ekstra_bilgiler}
                      onChange={e =>
                        handleChange('ekstra_bilgiler', e.target.value)
                      }
                      rows={3}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Detaylı Analiz Yapılıyor...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Detaylı Tahmin Et
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        {result && (
          <div className="space-y-6">
            {/* Price Estimate */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Fiyat Tahmini
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-sm text-blue-600 font-medium mb-1">
                    Net Fiyat (Hasar İndirimi Sonrası)
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    ₺{result.net_fiyat.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-600 mt-1">
                    Güven: {result.güven_skoru}%
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pazar Fiyatı:</span>
                    <span className="font-medium">
                      ₺{result.pazar_fiyati.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Hasar İndirimi:
                    </span>
                    <span className="font-medium text-red-600">
                      -₺{result.hasar_indirimi.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Değer Kaybı:</span>
                    <span className="font-medium text-red-600">
                      %{(result.toplam_depreciation_orani * 100).toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-500">
                    Fiyat Aralığı: ₺{result.tahmini_fiyat_min.toLocaleString()}{' '}
                    - ₺{result.tahmini_fiyat_max.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Damage Breakdown */}
            {result.hasar_detay_raporu &&
              result.hasar_detay_raporu.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-orange-600" />
                      Hasar Analizi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.hasar_detay_raporu.map((item, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{item.part}</div>
                              <div className="text-sm text-gray-600">
                                {item.damage_type} - {item.damage_level}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-red-600">
                                -₺{item.estimated_cost?.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                %{(item.depreciation * 100).toFixed(1)} etki
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* AI Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  AI Analizi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Detaylı Rapor</Label>
                  <div className="bg-gray-50 p-3 rounded-lg mt-1">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {result.rapor}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Pazar Analizi</Label>
                  <div className="bg-gray-50 p-3 rounded-lg mt-1">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {result.pazar_analizi}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Öneriler</Label>
                  <div className="bg-gray-50 p-3 rounded-lg mt-1">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {result.oneri}
                    </p>
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                  <Button
                    onClick={handleSave}
                    className="w-full"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Panele Kaydet
                      </>
                    )}
                  </Button>
                  <div className="border-t text-xs text-gray-500 pt-2">
                    Analiz Tarihi: {result.analiz_tarihi} | Kaynak:{' '}
                    {result.veri_kaynagi}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DetailedEstimatePage() {
  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <DetailedEstimateContent />
        </main>
      </div>
    </PrivateRoute>
  );
}
