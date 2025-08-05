// Types based on backend API schema

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

// Backend user structure
export interface BackendUser {
  id: number;
  ad: string;
  soyad: string;
  email: string;
  telefon?: string;
  sehir?: string;
  kayit_tarihi: string;
  son_giris?: string;
  aktif: boolean;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  km: number;
  damageStatus: string;
  estimatedPrice: number;
  aiSummary: string;
  confidence?: number;
  createdAt: string;
  updatedAt: string;
}

// Backend vehicle structure
export interface BackendVehicle {
  id: number;
  kullanici_id: number;
  arac_adi: string;
  marka: string;
  model: string;
  yil: number;
  kilometre: number;
  yakit_tipi: string;
  vites_tipi: string;
  hasar_durumu: string;
  renk: string;
  motor_hacmi?: number;
  motor_gucu?: number;
  kayit_tarihi: string;
  guncelleme_tarihi: string;
  aktif: boolean;
  notlar?: string;
}

export interface EstimationRequest {
  brand: string;
  model: string;
  year: number;
  km: number;
  damageStatus: string;
  fuelType?: string;
  transmission?: string;
  color?: string;
  city?: string;
  engineSize?: number;
  enginePower?: number;
  additionalInfo?: string;
}

// Backend estimation request structure
export interface BackendEstimationRequest {
  marka: string;
  model: string;
  yil: number;
  kilometre: number;
  yakit_tipi: string;
  vites_tipi: string;
  hasar_durumu: string;
  renk: string;
  il: string;
  motor_hacmi?: number;
  motor_gucu?: number;
  ekstra_bilgiler?: string;
}

export interface EstimationResponse {
  estimatedPrice: number;
  aiSummary: string;
  confidence: number;
}

// Backend estimation response structure
export interface BackendEstimationResponse {
  tahmini_fiyat_min: number;
  tahmini_fiyat_max: number;
  ortalama_fiyat: number;
  rapor: string;
  analiz_tarihi: string;
  pazar_analizi: string;
  tahmin_id?: number;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface SystemHealth {
  status: string;
  gemini_api: string;
  langchain: string;
  database: string;
}

export interface Statistics {
  toplam_tahmin: number;
  populer_markalar: Array<{
    marka: string;
    model: string;
    arama_sayisi: number;
    ortalama_fiyat: number;
  }>;
  ortalama_response_time: number;
  gunluk_kullanim: number;
}