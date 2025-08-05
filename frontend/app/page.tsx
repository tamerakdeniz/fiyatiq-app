'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { vehicleService } from '@/services/api';
import { Car, Loader2, Save, TrendingUp, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function HomePage() {
  const [quickEstimate, setQuickEstimate] = useState({
    brand: '',
    model: '',
    year: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [estimateResult, setEstimateResult] = useState<any>(null);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!estimateResult) return;

    setSaving(true);
    try {
      const vehicleData = {
        brand: quickEstimate.brand,
        model: quickEstimate.model,
        year: parseInt(quickEstimate.year),
        km: 100000, // Default value for quick estimate
        damageStatus: 'Hasarsız', // Default value for quick estimate
        fuelType: 'Benzin',
        transmission: 'Manuel',
        color: 'Beyaz',
        estimatedPrice: estimateResult.estimatedPrice,
        aiSummary: estimateResult.aiSummary
      };

      await vehicleService.saveVehicle(vehicleData);
      toast({
        title: 'Araç kaydedildi!',
        description: 'Araç panonuza eklendi.'
      });
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

  const handleQuickEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await vehicleService.estimatePrice({
        brand: quickEstimate.brand,
        model: quickEstimate.model,
        year: parseInt(quickEstimate.year),
        km: 100000, // Default value for quick estimate
        damageStatus: 'none' // Default value for quick estimate
      });
      setEstimateResult(result);
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Fiyat tahmini alınırken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-xl"
            >
              <Car className="h-6 w-6 text-blue-600" />
              <span>FiyatIQ</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/signin">
                <Button variant="ghost">Giriş Yap</Button>
              </Link>
              <Link href="/signup">
                <Button variant="default">Kayıt Ol</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Araç Fiyat Analizi ve Değerleme Platformu
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            İster araç almak isteyin, ister satmak; yapay zeka destekli
            sistemimizle güvenle ortalama değerini hesaplayın ve detaylı analiz
            sonuçlarını alın.
          </p>
        </div>

        {/* Quick Estimate Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Hızlı Değerleme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuickEstimate} className="space-y-4">
                <div>
                  <Label htmlFor="brand">Marka</Label>
                  <Input
                    id="brand"
                    value={quickEstimate.brand}
                    onChange={e =>
                      setQuickEstimate({
                        ...quickEstimate,
                        brand: e.target.value
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={quickEstimate.model}
                    onChange={e =>
                      setQuickEstimate({
                        ...quickEstimate,
                        model: e.target.value
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="year">Yıl</Label>
                  <Input
                    id="year"
                    value={quickEstimate.year}
                    onChange={e =>
                      setQuickEstimate({
                        ...quickEstimate,
                        year: e.target.value
                      })
                    }
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Hesaplanıyor...' : 'Hızlı Tahmin Al'}
                </Button>
              </form>

              {estimateResult && (
                <div className="mt-4 space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">
                      Tahmini Fiyat
                    </div>
                    <div className="text-2xl font-bold text-blue-900 mb-2">
                      ₺{estimateResult.estimatedPrice.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600">
                      {estimateResult.aiSummary}
                    </p>
                  </div>
                  <Button
                    onClick={handleSave}
                    className="w-full"
                    variant="outline"
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
                        Panoya Kaydet
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Benefits Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                Üyelik Avantajları
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-blue-100 p-1">
                    <Car className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Araç Verilerini Kaydetme</h3>
                    <p className="text-sm text-gray-600">
                      Tüm araçlarınızı sisteme kaydedebilir ve değer
                      değişimlerini takip edebilirsiniz.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-blue-100 p-1">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Detaylı Analiz Raporları</h3>
                    <p className="text-sm text-gray-600">
                      Kaza geçmişi, bakım durumu gibi ek verileri girerek daha
                      doğru sonuçlar alın.
                    </p>
                  </div>
                </li>
              </ul>
              <div className="mt-6">
                <Link href="/signup">
                  <Button className="w-full">Hemen Üye Ol</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
