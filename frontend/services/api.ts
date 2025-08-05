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

// Auth Service
export const authService = {
  async signin(email: string, password: string) {
    // Note: Backend doesn't have authentication yet, but we'll prepare the structure
    // For now, we'll create a mock user but still try to reach the backend
    try {
      // Try to ping the backend first
      await apiCall('/health');
      
      // Since there's no auth in backend yet, create a mock response
      const mockUser = {
        id: 1,
        name: 'Demo User',
        email: email,
      };
      
      return {
        token: 'demo-token',
        user: mockUser,
      };
    } catch (error) {
      throw new ApiError('Unable to connect to backend server. Please ensure the backend is running.');
    }
  },

  async signup(name: string, email: string, password: string) {
    try {
      await apiCall('/health');
      
      const mockUser = {
        id: 1,
        name: name,
        email: email,
      };
      
      return {
        token: 'demo-token',
        user: mockUser,
      };
    } catch (error) {
      throw new ApiError('Unable to connect to backend server. Please ensure the backend is running.');
    }
  },

  async getProfile() {
    try {
      await apiCall('/health');
      
      return {
        id: 1,
        name: 'Demo User',
        email: 'demo@demo.com',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new ApiError('Unable to connect to backend server.');
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