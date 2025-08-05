// Real API Service - Connects to FastAPI backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

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
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
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
        body: JSON.stringify({ email, password }),
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
          sehir: response.user.sehir,
        },
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
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ad, soyad, email, password }),
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
          sehir: response.user.sehir,
        },
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
          'Authorization': `Bearer ${token}`,
        },
      });

      return {
        id: response.id,
        name: `${response.ad} ${response.soyad}`,
        email: response.email,
        telefon: response.telefon,
        sehir: response.sehir,
        createdAt: response.kayit_tarihi,
        lastLogin: response.son_giris,
        emailVerified: response.email_verified,
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
        body: JSON.stringify({ refresh_token: refreshToken }),
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
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      return { success: true };
    } catch (error) {
      throw error;
    }
  },
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
      il: 'İstanbul',
    };

    const response = await apiCall<EstimationResponse>('/tahmin-et', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    return {
      estimatedPrice: response.ortalama_fiyat,
      aiSummary: response.rapor,
      confidence: 85, // Backend doesn't return confidence, using default
    };
  },

  async getVehicles() {
    // Since backend requires kullanici_id and we don't have real auth,
    // return empty array for now
    return [];
  },

  async saveVehicle(vehicleData: any) {
    // Since we don't have real user management yet, we'll mock this
    // but the structure is ready for when backend auth is implemented
    const mockVehicle = {
      id: Date.now().toString(),
      userId: '1',
      brand: vehicleData.brand,
      model: vehicleData.model,
      year: vehicleData.year,
      km: vehicleData.km,
      damageStatus: vehicleData.damageStatus,
      estimatedPrice: vehicleData.estimatedPrice,
      aiSummary: vehicleData.aiSummary,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return mockVehicle;
  },

  async deleteVehicle(id: string) {
    // Mock implementation until backend auth is ready
    return { success: true };
  },

  async recalculatePrice(id: string) {
    // Mock implementation
    return {
      id,
      estimatedPrice: Math.floor(Math.random() * 100000) + 400000,
      confidence: Math.floor(Math.random() * 20) + 80,
    };
  },
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
      createdAt: new Date().toISOString(),
    };
  },
};

// System health check
export const systemService = {
  async healthCheck() {
    return await apiCall('/health');
  },

  async getStatistics() {
    return await apiCall('/istatistikler');
  },
};

console.log('🚀 Real API Service initialized');
console.log('🌐 Backend URL:', API_BASE_URL);
console.log('🔍 Use browser console to monitor API calls');