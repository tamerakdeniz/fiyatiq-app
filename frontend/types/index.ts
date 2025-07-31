export interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  km: number
  damageStatus: string
  estimatedPrice: number
  aiSummary: string
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface EstimationRequest {
  brand: string
  model: string
  year: number
  km: number
  damageStatus: string
}

export interface EstimationResponse {
  estimatedPrice: number
  aiSummary: string
  confidence: number
}
