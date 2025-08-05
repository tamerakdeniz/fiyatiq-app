'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { systemService } from '@/services/api';
import { CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export function BackendStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const checkBackend = async () => {
    setLoading(true);
    try {
      const health = await systemService.healthCheck();
      const statistics = await systemService.getStatistics();
      setIsConnected(true);
      setStats(statistics);
    } catch (error) {
      setIsConnected(false);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  const getStatusColor = () => {
    if (isConnected === null) return 'bg-gray-50 border-gray-200';
    return isConnected
      ? 'bg-green-50 border-green-200'
      : 'bg-red-50 border-red-200';
  };

  const getTextColor = () => {
    if (isConnected === null) return 'text-gray-800';
    return isConnected ? 'text-green-800' : 'text-red-800';
  };

  return (
    <Alert className={getStatusColor()}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConnected === null ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : isConnected ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
                     <span className={`font-semibold ${getTextColor()}`}>
             {isConnected === null
               ? 'Backend Kontrol Ediliyor...'
               : isConnected
               ? 'Backend Bağlı'
               : 'Backend Bağlantısı Yok'}
           </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={checkBackend}
          disabled={loading}
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>
             <AlertDescription className={`mt-2 ${getTextColor()}`}>
         {isConnected === null ? (
           'FastAPI backend bağlantısı kontrol ediliyor...'
         ) : isConnected ? (
           <div className="space-y-1">
             <p>✅ FastAPI backend çalışıyor ve erişilebilir</p>
             <p>
               📍 API URL:{' '}
               {process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}
             </p>
             {stats && (
               <>
                 <p>📊 Toplam Tahmin: {stats.toplam_tahmin}</p>
                 <p>⚡ Ort. Yanıt: {stats.ortalama_response_time}ms</p>
                 <p>📈 Bugünkü Kullanım: {stats.gunluk_kullanim}</p>
               </>
             )}
           </div>
         ) : (
           <div className="space-y-1">
             <p>❌ FastAPI backend'e bağlanılamıyor</p>
             <p>
               📍 Beklenen URL:{' '}
               {process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}
             </p>
             <p>
               💡 Backend başlat:{' '}
               <code className="bg-gray-100 px-1 rounded">
                 cd backend && uvicorn main:app --reload
               </code>
             </p>
           </div>
         )}
       </AlertDescription>
    </Alert>
  );
}
