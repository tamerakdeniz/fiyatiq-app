import { auth } from '@/lib/auth';
import type { BackendUser, BackendVehicle } from '@/types';

// Real API Service - Connects to FastAPI backend
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

interface ApiResponse<T> {
  data?: T;
  message?: string;
  success?: boolean;
}

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// Utility function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json'
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.detail ||
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) return {} as T;

    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error or server unavailable');
  }
}

// Types based on backend API
interface User {
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

interface Vehicle {
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

interface EstimationRequest {
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

interface EstimationResponse {
  tahmini_fiyat_min: number;
  tahmini_fiyat_max: number;
  ortalama_fiyat: number;
  rapor: string;
  analiz_tarihi: string;
  pazar_analizi: string;
  tahmin_id?: number;
}

// Auth Service with Secure Implementation
export const authService = {
  async signin(email: string, password: string) {
    try {
      const response = await apiCall<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
        user: {
          id: number;
          ad: string;
          soyad: string;
          email: string;
          telefon?: string;
          sehir?: string;
        };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      // Store tokens securely
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);

      return {
        token: response.access_token,
        user: {
          id: response.user.id,
          name: `${response.user.ad} ${response.user.soyad}`,
          email: response.user.email,
          telefon: response.user.telefon,
          sehir: response.user.sehir
        }
      };
    } catch (error) {
      throw error;
    }
  },

  async signup(name: string, email: string, password: string) {
    try {
      // Split name into first and last name
      const nameParts = name.trim().split(' ');
      const ad = nameParts[0] || '';
      const soyad = nameParts.slice(1).join(' ') || '';

      // Validate password requirements - simplified for demo
      if (password.length < 6) {
        throw new ApiError('Şifre en az 6 karakter olmalıdır');
      }

      const response = await apiCall<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
        user: BackendUser;
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ad, soyad, email, password })
      });

      // Store tokens securely
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);

      return {
        token: response.access_token,
        user: {
          id: response.user.id,
          name: `${response.user.ad} ${response.user.soyad}`,
          email: response.user.email,
          telefon: response.user.telefon,
          sehir: response.user.sehir
        }
      };
    } catch (error) {
      throw error;
    }
  },

  async getProfile() {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new ApiError('No authentication token found');
      }

      const response = await apiCall<{
        id: number;
        ad: string;
        soyad: string;
        email: string;
        telefon?: string;
        sehir?: string;
        kayit_tarihi: string;
        son_giris?: string;
        email_verified: boolean;
      }>('/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return {
        id: response.id,
        name: `${response.ad} ${response.soyad}`,
        email: response.email,
        telefon: response.telefon,
        sehir: response.sehir,
        createdAt: response.kayit_tarihi,
        lastLogin: response.son_giris,
        emailVerified: response.email_verified
      };
    } catch (error) {
      // If token is invalid, clear it and redirect to login
      if (error instanceof ApiError && error.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
      throw error;
    }
  },

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new ApiError('No refresh token found');
      }

      const response = await apiCall<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
        user: any;
      }>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);

      return response.access_token;
    } catch (error) {
      // Clear tokens if refresh fails
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      throw error;
    }
  },

  async signout() {
    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  async changePassword(currentPassword: string, newPassword: string) {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new ApiError('No authentication token found');
      }

      await apiCall('/auth/change-password', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      return { success: true };
    } catch (error) {
      throw error;
    }
  }
};

// Vehicle Service
export const vehicleService = {
  async estimatePrice(vehicleData: {
    brand: string;
    model: string;
    year: number;
    km: number;
    damageStatus: string;
  }) {
    const requestData: EstimationRequest = {
      marka: vehicleData.brand,
      model: vehicleData.model,
      yil: vehicleData.year,
      kilometre: vehicleData.km,
      yakit_tipi: 'Benzin', // Default values since estimate page doesn't capture these
      vites_tipi: 'Manuel',
      hasar_durumu: vehicleData.damageStatus,
      renk: 'Beyaz',
      il: 'İstanbul'
    };

    const response = await apiCall<EstimationResponse>('/tahmin-et', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    return {
      estimatedPrice: response.ortalama_fiyat,
      aiSummary: response.rapor,
      confidence: 85 // Backend doesn't return confidence, using default
    };
  },

  async getVehicles() {
    const user = await auth.getProfile();
    if (!user) {
      throw new Error('Giriş yapmanız gerekiyor');
    }
    const response = await fetch(`${API_URL}/kullanici/${user.id}/araclar`, {
      headers: await auth.getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Araçlar yüklenemedi');
    }
    const data = await response.json();
    return data.map((vehicle: BackendVehicle) => ({
      id: vehicle.id.toString(),
      brand: vehicle.marka,
      model: vehicle.model,
      year: vehicle.yil,
      km: vehicle.kilometre,
      damageStatus: vehicle.hasar_durumu,
      fuelType: vehicle.yakit_tipi,
      transmission: vehicle.vites_tipi,
      color: vehicle.renk,
      estimatedPrice: 0, // Will be updated with latest estimate
      aiSummary: vehicle.notlar || '',
      createdAt: vehicle.kayit_tarihi,
      updatedAt: vehicle.guncelleme_tarihi
    }));
  },

  async saveVehicle(vehicleData: any) {
    const user = await auth.getProfile();
    if (!user) {
      throw new Error('Giriş yapmanız gerekiyor');
    }

    // AracOlustur model format
    const requestData = {
      arac_adi: `${vehicleData.brand} ${vehicleData.model} ${vehicleData.year}`,
      marka: vehicleData.brand,
      model: vehicleData.model,
      yil: vehicleData.year,
      kilometre: vehicleData.km,
      yakit_tipi: vehicleData.fuelType || 'Benzin',
      vites_tipi: vehicleData.transmission || 'Manuel',
      hasar_durumu: vehicleData.damageStatus,
      renk: vehicleData.color || 'Belirtilmemiş',
      motor_hacmi: vehicleData.engineSize || null,
      motor_gucu: vehicleData.enginePower || null,
      notlar: vehicleData.aiSummary
    };

    try {
      const response = await fetch(`${API_URL}/kullanici/${user.id}/arac`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await auth.getAuthHeaders())
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const savedVehicle = await response.json();
      return {
        id: savedVehicle.id.toString(),
        brand: savedVehicle.marka,
        model: savedVehicle.model,
        year: savedVehicle.yil,
        km: savedVehicle.kilometre,
        damageStatus: savedVehicle.hasar_durumu,
        fuelType: savedVehicle.yakit_tipi,
        transmission: savedVehicle.vites_tipi,
        color: savedVehicle.renk,
        estimatedPrice: vehicleData.estimatedPrice,
        aiSummary: savedVehicle.notlar || '',
        createdAt: savedVehicle.kayit_tarihi,
        updatedAt: savedVehicle.guncelleme_tarihi
      };
    } catch (error) {
      console.error('Error saving vehicle:', error);
      throw error;
    }
  },

  async deleteVehicle(id: string) {
    const user = await auth.getProfile();
    if (!user) {
      throw new Error('Giriş yapmanız gerekiyor');
    }

    const response = await fetch(`${API_URL}/kullanici/${user.id}/arac/${id}`, {
      method: 'DELETE',
      headers: await auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Araç silinemedi');
    }

    const result = await response.json();
    return { success: true, message: result.message };
  },

  async recalculatePrice(id: string) {
    // Mock implementation
    return {
      id,
      estimatedPrice: Math.floor(Math.random() * 100000) + 400000,
      confidence: Math.floor(Math.random() * 20) + 80
    };
  }
};

// Profile Service
export const profileService = {
  async getProfile() {
    return authService.getProfile();
  },

  async updateProfile(data: { name: string; email: string }) {
    return {
      name: data.name,
      email: data.email,
      createdAt: new Date().toISOString()
    };
  }
};

// System health check
export const systemService = {
  async healthCheck() {
    return await apiCall('/health');
  },

  async getStatistics() {
    return await apiCall('/istatistikler');
  }
};

console.log('🚀 Real API Service initialized');
console.log('🌐 Backend URL:', API_URL);
console.log('🔍 Use browser console to monitor API calls');
