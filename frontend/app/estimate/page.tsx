'use client';

import type React from 'react';

import { Navbar } from '@/components/navbar';
import { PrivateRoute } from '@/components/private-route';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { useToast } from '@/hooks/use-toast';
import { vehicleService } from '@/services/api';
import { Brain, Car, Loader2, Save, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface EstimationResult {
  estimatedPrice: number;
  aiSummary: string;
  confidence: number;
}

function EstimateContent() {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '',
    km: '',
    damageStatus: '',
    fuelType: 'Benzin',
    transmission: 'Manuel',
    color: 'Beyaz',
    city: 'İstanbul'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EstimationResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const { toast } = useToast();

  const damageOptions = ['Hasarsız', 'Boyalı', 'Değişen', 'Hasarlı'];
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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const estimationData = {
        brand: formData.brand,
        model: formData.model,
        year: Number.parseInt(formData.year),
        km: Number.parseInt(formData.km),
        damageStatus: formData.damageStatus,
        fuelType: formData.fuelType,
        transmission: formData.transmission,
        color: formData.color,
        city: formData.city
      };

      const result = await vehicleService.estimatePrice(estimationData);
      setResult(result);
    } catch (err: any) {
      setError(err.message || 'Fiyat tahmini yapılamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;

    setSaving(true);
    try {
      const vehicleData = {
        brand: formData.brand,
        model: formData.model,
        year: Number.parseInt(formData.year),
        km: Number.parseInt(formData.km),
        damageStatus: formData.damageStatus,
        fuelType: formData.fuelType,
        transmission: formData.transmission,
        color: formData.color,
        estimatedPrice: result.estimatedPrice,
        aiSummary: result.aiSummary
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

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Araç Fiyat Tahmini</h1>
        <p className="text-gray-600">
          Gerçek zamanlı pazar verileri ile AI destekli fiyat tahminleri alın
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Araç Bilgileri
            </CardTitle>
            <CardDescription>
              Doğru tahmin için araç detaylarınızı girin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Marka</Label>
                  <Input
                    id="brand"
                    placeholder="Örn: Toyota"
                    value={formData.brand}
                    onChange={e => handleChange('brand', e.target.value)}
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
                    value={formData.year}
                    onValueChange={value => handleChange('year', value)}
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
                    value={formData.km}
                    onChange={e => handleChange('km', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="damage">Hasar Durumu</Label>
                <Select
                  value={formData.damageStatus}
                  onValueChange={value => handleChange('damageStatus', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Hasar durumu seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {damageOptions.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fuel">Yakıt Tipi</Label>
                  <Select
                    value={formData.fuelType}
                    onValueChange={value => handleChange('fuelType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Yakıt tipi seçin" />
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
                    value={formData.transmission}
                    onValueChange={value => handleChange('transmission', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vites seçin" />
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
                    value={formData.color}
                    onValueChange={value => handleChange('color', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Renk seçin" />
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
                    value={formData.city}
                    onValueChange={value => handleChange('city', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Şehir seçin" />
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analiz Ediliyor...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Fiyat Tahmin Et
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                AI Tahmin Sonucu
              </CardTitle>
              <CardDescription>
                Güncel pazar analizine dayanıyor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-sm text-blue-600 font-medium mb-1">
                  Tahmini Fiyat
                </div>
                <div className="text-3xl font-bold text-blue-900">
                  ₺{result.estimatedPrice.toLocaleString()}
                </div>
                <div className="text-sm text-blue-600 mt-1">
                  Güven: {result.confidence}%
                </div>
              </div>

              <div className="space-y-2">
                <Label>AI Uzman Analizi</Label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {result.aiSummary}
                  </p>
                </div>
              </div>

              <Button onClick={handleSave} className="w-full" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Panoya Kaydet
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function EstimatePage() {
  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <EstimateContent />
        </main>
      </div>
    </PrivateRoute>
  );
}
