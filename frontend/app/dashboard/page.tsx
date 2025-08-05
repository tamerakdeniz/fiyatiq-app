'use client';

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
import { useToast } from '@/hooks/use-toast';
import { vehicleService } from '@/services/api';
import type { Vehicle } from '@/types';
import {
  AlertTriangle,
  Calendar,
  Car,
  Eye,
  Gauge,
  Loader2,
  Plus,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const DEBUG_MODE = process.env.NODE_ENV === 'development';

function DashboardContent() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await vehicleService.getVehicles();
      setVehicles(data);
    } catch (err: any) {
      setError(err.message || 'Araçlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu aracı silmek istediğinizden emin misiniz?')) return;

    try {
      await vehicleService.deleteVehicle(id);
      setVehicles(prev => prev.filter(v => v.id !== id));
      toast({
        title: 'Araç silindi',
        description: 'Araç panonuzdan kaldırıldı.'
      });
    } catch (err: any) {
      toast({
        title: 'Hata',
        description: err.message || 'Araç silinemedi',
        variant: 'destructive'
      });
    }
  };

  const handleRecalculate = async (vehicle: Vehicle) => {
    try {
      const result = await vehicleService.estimatePrice({
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        km: vehicle.km,
        damageStatus: vehicle.damageStatus
      });
      const updatedVehicle = {
        ...vehicle,
        estimatedPrice: result.estimatedPrice,
        aiSummary: result.aiSummary
      };
      setVehicles(prev =>
        prev.map(v => (v.id === vehicle.id ? updatedVehicle : v))
      );
      toast({
        title: 'Fiyat güncellendi',
        description: 'Araç fiyatı yeniden hesaplandı.'
      });
    } catch (err: any) {
      toast({
        title: 'Hata',
        description: err.message || 'Fiyat yeniden hesaplanamadı',
        variant: 'destructive'
      });
    }
  };

  const getDamageColor = (damage: string) => {
    switch (damage.toLowerCase()) {
      case 'no damage':
        return 'bg-green-100 text-green-800';
      case 'minor':
        return 'bg-yellow-100 text-yellow-800';
      case 'major':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Araçlarım</h1>
          <p className="text-gray-600 mt-1">{vehicles.length} araç kayıtlı</p>
        </div>
        <Button
          onClick={() => router.push('/estimate')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Araç Ekle
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Car className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <CardTitle className="mb-2">Henüz araç yok</CardTitle>
            <CardDescription className="mb-6">
              AI destekli fiyat tahminleri almak için ilk aracınızı ekleyerek
              başlayın
            </CardDescription>
            <Button onClick={() => router.push('/estimate')}>
              <Plus className="h-4 w-4 mr-2" />
              İlk Aracınızı Ekleyin
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map(vehicle => (
            <Card
              key={vehicle.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {vehicle.brand} {vehicle.model}
                    </CardTitle>
                    <CardDescription>
                      Eklendi:{' '}
                      {new Date(vehicle.createdAt).toLocaleDateString('tr-TR')}
                    </CardDescription>
                  </div>
                  <Badge className={getDamageColor(vehicle.damageStatus)}>
                    {vehicle.damageStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{vehicle.year}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-gray-500" />
                    <span>{vehicle.km.toLocaleString()} km</span>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">
                    Tahmini Fiyat
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    ₺{vehicle.estimatedPrice.toLocaleString()}
                  </div>
                </div>

                {vehicle.aiSummary && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      AI Analizi
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {vehicle.aiSummary}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRecalculate(vehicle)}
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Yeniden Hesapla
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/vehicle/${vehicle.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(vehicle.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <DashboardContent />
        </main>
      </div>
    </PrivateRoute>
  );
}
