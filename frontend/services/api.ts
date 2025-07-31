// Mock API Service - Simulates FastAPI backend behavior
// In production, replace this with actual API calls

interface MockUser {
  id: string
  name: string
  email: string
  password: string
  createdAt: string
}

interface MockVehicle {
  id: string
  userId: string
  brand: string
  model: string
  year: number
  km: number
  damageStatus: string
  estimatedPrice: number
  aiSummary: string
  confidence: number
  createdAt: string
  updatedAt: string
}

// Mock Database - In production, this would be your actual database
const mockDB = {
  users: [
    {
      id: "demo-user-123",
      name: "Demo User",
      email: "demo@demo.com",
      password: "12345678", // In production, this would be hashed
      createdAt: "2024-01-01T00:00:00Z",
    },
  ] as MockUser[],

  vehicles: [
    {
      id: "vehicle-1",
      userId: "demo-user-123",
      brand: "Toyota",
      model: "Corolla",
      year: 2020,
      km: 45000,
      damageStatus: "Minor",
      estimatedPrice: 285000,
      aiSummary:
        "This 2020 Toyota Corolla shows excellent value retention. With 45,000 km and minor damage, it's priced competitively in the current market. The vehicle's reliability record and fuel efficiency make it an attractive option for buyers. Minor cosmetic damage slightly reduces value but doesn't affect mechanical integrity.",
      confidence: 87,
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
    },
    {
      id: "vehicle-2",
      userId: "demo-user-123",
      brand: "BMW",
      model: "320i",
      year: 2019,
      km: 62000,
      damageStatus: "No Damage",
      estimatedPrice: 420000,
      aiSummary:
        "This BMW 320i represents premium German engineering with no reported damage. At 62,000 km, it's within optimal mileage range for a 2019 model. Market analysis shows strong demand for this model, supporting the current valuation. Maintenance history and brand prestige contribute to price stability.",
      confidence: 92,
      createdAt: "2024-01-20T14:15:00Z",
      updatedAt: "2024-01-20T14:15:00Z",
    },
  ] as MockVehicle[],
}

// Utility functions for localStorage management
const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "currentUser",
  VEHICLES: "userVehicles",
}

// Simulate network delay
const delay = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms))

// Generate mock JWT token
const generateMockToken = (userId: string) => {
  return `mock-jwt-token-${userId}-${Date.now()}`
}

// Get current user from localStorage
const getCurrentUser = (): MockUser | null => {
  const userData = localStorage.getItem(STORAGE_KEYS.USER)
  return userData ? JSON.parse(userData) : null
}

// Get user vehicles from localStorage
const getUserVehicles = (userId: string): MockVehicle[] => {
  const vehicles = localStorage.getItem(STORAGE_KEYS.VEHICLES)
  const allVehicles: MockVehicle[] = vehicles ? JSON.parse(vehicles) : mockDB.vehicles
  return allVehicles.filter((v) => v.userId === userId)
}

// Save vehicles to localStorage
const saveVehicles = (vehicles: MockVehicle[]) => {
  localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles))
}

// Auth Service - Mock Implementation
export const authService = {
  async signin(email: string, password: string) {
    console.log("🔄 Mock API: POST /signin", { email, password })
    await delay(800) // Simulate network delay

    // Find user in mock database
    const user = mockDB.users.find((u) => u.email === email && u.password === password)

    if (!user) {
      throw new Error("Invalid email or password")
    }

    // Generate mock token
    const token = generateMockToken(user.id)

    // Store in localStorage
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))

    console.log("✅ Mock API: Signin successful", { user: user.name, token })

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    }
  },

  async signup(name: string, email: string, password: string) {
    console.log("🔄 Mock API: POST /signup", { name, email, password })
    await delay(1000)

    // Check if user already exists
    const existingUser = mockDB.users.find((u) => u.email === email)
    if (existingUser) {
      throw new Error("User with this email already exists")
    }

    // Create new user
    const newUser: MockUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      password, // In production, this would be hashed
      createdAt: new Date().toISOString(),
    }

    // Add to mock database
    mockDB.users.push(newUser)

    // Generate token and store
    const token = generateMockToken(newUser.id)
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser))

    console.log("✅ Mock API: Signup successful", { user: newUser.name, token })

    return {
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    }
  },

  async getProfile() {
    console.log("🔄 Mock API: GET /profile")
    await delay(300)

    const user = getCurrentUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    console.log("✅ Mock API: Profile retrieved", { user: user.name })

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    }
  },
}

// Vehicle Service - Mock Implementation
export const vehicleService = {
  async getVehicles() {
    console.log("🔄 Mock API: GET /vehicles")
    await delay(600)

    const user = getCurrentUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    const vehicles = getUserVehicles(user.id)
    console.log("✅ Mock API: Vehicles retrieved", { count: vehicles.length })

    return vehicles
  },

  async estimatePrice(vehicleData: any) {
    console.log("🔄 Mock API: POST /estimate", vehicleData)
    await delay(2000) // Longer delay to simulate AI processing

    // Mock price calculation based on vehicle data
    let basePrice = 100000 // Base price in Turkish Lira

    // Adjust price based on brand
    const brandMultipliers: Record<string, number> = {
      toyota: 1.2,
      honda: 1.15,
      bmw: 2.0,
      mercedes: 2.2,
      audi: 1.9,
      volkswagen: 1.3,
      ford: 1.1,
      renault: 0.9,
      fiat: 0.8,
    }

    const brandMultiplier = brandMultipliers[vehicleData.brand.toLowerCase()] || 1.0
    basePrice *= brandMultiplier

    // Adjust for year (depreciation)
    const currentYear = new Date().getFullYear()
    const age = currentYear - vehicleData.year
    const depreciationFactor = Math.max(0.3, 1 - age * 0.08)
    basePrice *= depreciationFactor

    // Adjust for mileage
    const mileageFactor = Math.max(0.4, 1 - vehicleData.km / 200000)
    basePrice *= mileageFactor

    // Adjust for damage
    const damageMultipliers: Record<string, number> = {
      "no damage": 1.0,
      minor: 0.85,
      moderate: 0.7,
      major: 0.5,
      severe: 0.3,
    }

    const damageMultiplier = damageMultipliers[vehicleData.damageStatus.toLowerCase()] || 0.8
    basePrice *= damageMultiplier

    const estimatedPrice = Math.round(basePrice)
    const confidence = Math.floor(Math.random() * 20) + 75 // 75-95% confidence

    // Generate AI summary based on vehicle data
    const aiSummary = generateAISummary(vehicleData, estimatedPrice, confidence)

    const result = {
      estimatedPrice,
      aiSummary,
      confidence,
    }

    console.log("✅ Mock API: Price estimation completed", result)
    return result
  },

  async saveVehicle(vehicleData: any) {
    console.log("🔄 Mock API: POST /vehicles", vehicleData)
    await delay(500)

    const user = getCurrentUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    const newVehicle: MockVehicle = {
      id: `vehicle-${Date.now()}`,
      userId: user.id,
      ...vehicleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Get existing vehicles and add new one
    const existingVehicles = getUserVehicles(user.id)
    const allVehicles = [...existingVehicles, newVehicle]
    saveVehicles(allVehicles)

    console.log("✅ Mock API: Vehicle saved", { id: newVehicle.id })
    return newVehicle
  },

  async deleteVehicle(id: string) {
    console.log("🔄 Mock API: DELETE /vehicles/" + id)
    await delay(400)

    const user = getCurrentUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    const vehicles = getUserVehicles(user.id)
    const updatedVehicles = vehicles.filter((v) => v.id !== id)
    saveVehicles(updatedVehicles)

    console.log("✅ Mock API: Vehicle deleted", { id })
  },

  async recalculatePrice(id: string) {
    console.log("🔄 Mock API: POST /vehicles/" + id + "/recalculate")
    await delay(1500)

    const user = getCurrentUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    const vehicles = getUserVehicles(user.id)
    const vehicle = vehicles.find((v) => v.id === id)

    if (!vehicle) {
      throw new Error("Vehicle not found")
    }

    // Simulate price recalculation with slight variation
    const priceVariation = 0.95 + Math.random() * 0.1 // ±5% variation
    const newPrice = Math.round(vehicle.estimatedPrice * priceVariation)
    const newConfidence = Math.floor(Math.random() * 20) + 75

    const updatedVehicle = {
      ...vehicle,
      estimatedPrice: newPrice,
      confidence: newConfidence,
      aiSummary: generateAISummary(vehicle, newPrice, newConfidence),
      updatedAt: new Date().toISOString(),
    }

    // Update in storage
    const updatedVehicles = vehicles.map((v) => (v.id === id ? updatedVehicle : v))
    saveVehicles(updatedVehicles)

    console.log("✅ Mock API: Price recalculated", { id, newPrice })
    return updatedVehicle
  },

  async clearAllVehicles() {
    console.log("🔄 Mock API: DELETE /vehicles")
    await delay(600)

    const user = getCurrentUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Clear all vehicles for current user
    saveVehicles([])

    console.log("✅ Mock API: All vehicles cleared")
  },
}

// Profile Service - Mock Implementation
export const profileService = {
  async getProfile() {
    console.log("🔄 Mock API: GET /profile")
    await delay(300)

    const user = getCurrentUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    console.log("✅ Mock API: Profile retrieved")
    return {
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    }
  },

  async updateProfile(data: { name: string; email: string }) {
    console.log("🔄 Mock API: PUT /profile", data)
    await delay(700)

    const user = getCurrentUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Check if email is already taken by another user
    const existingUser = mockDB.users.find((u) => u.email === data.email && u.id !== user.id)
    if (existingUser) {
      throw new Error("Email is already taken")
    }

    // Update user data
    const updatedUser = {
      ...user,
      name: data.name,
      email: data.email,
    }

    // Update in mock database
    const userIndex = mockDB.users.findIndex((u) => u.id === user.id)
    if (userIndex !== -1) {
      mockDB.users[userIndex] = updatedUser
    }

    // Update localStorage
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser))

    console.log("✅ Mock API: Profile updated")
    return {
      name: updatedUser.name,
      email: updatedUser.email,
      createdAt: updatedUser.createdAt,
    }
  },

  async changePassword(oldPassword: string, newPassword: string) {
    console.log("🔄 Mock API: PUT /change-password")
    await delay(800)

    const user = getCurrentUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Verify old password
    if (user.password !== oldPassword) {
      throw new Error("Current password is incorrect")
    }

    // Update password
    const updatedUser = {
      ...user,
      password: newPassword,
    }

    // Update in mock database
    const userIndex = mockDB.users.findIndex((u) => u.id === user.id)
    if (userIndex !== -1) {
      mockDB.users[userIndex] = updatedUser
    }

    // Update localStorage
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser))

    console.log("✅ Mock API: Password changed")
  },

  async deleteAccount() {
    console.log("🔄 Mock API: DELETE /account")
    await delay(1000)

    const user = getCurrentUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Remove user from mock database
    const userIndex = mockDB.users.findIndex((u) => u.id === user.id)
    if (userIndex !== -1) {
      mockDB.users.splice(userIndex, 1)
    }

    // Clear all user data from localStorage
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
    localStorage.removeItem(STORAGE_KEYS.VEHICLES)

    console.log("✅ Mock API: Account deleted")
  },
}

// Helper function to generate realistic AI summaries
function generateAISummary(vehicleData: any, price: number, confidence: number): string {
  const templates = [
    `This ${vehicleData.year} ${vehicleData.brand} ${vehicleData.model} shows ${getValueAssessment(vehicleData, price)} in the current market. With ${vehicleData.km.toLocaleString()} km and ${vehicleData.damageStatus.toLowerCase()} condition, the estimated price reflects current market trends. ${getDamageImpact(vehicleData.damageStatus)} ${getMarketInsight(vehicleData.brand)}`,

    `Market analysis indicates this ${vehicleData.brand} ${vehicleData.model} is ${getPricePosition(price)} within its segment. The ${vehicleData.year} model year and ${vehicleData.km.toLocaleString()} km mileage are ${getMileageAssessment(vehicleData)} for this vehicle class. ${getBrandInsight(vehicleData.brand)} ${getRecommendation(confidence)}`,

    `Our AI assessment shows this vehicle represents ${getValueProposition(price)} in today's market. The ${vehicleData.damageStatus.toLowerCase()} status ${getDamageEffect(vehicleData.damageStatus)} the overall valuation. ${getAgeAssessment(vehicleData.year)} ${getFinalRecommendation(confidence)}`,
  ]

  return templates[Math.floor(Math.random() * templates.length)]
}

function getValueAssessment(vehicleData: any, price: number): string {
  if (price > 400000) return "excellent value retention"
  if (price > 250000) return "good market positioning"
  if (price > 150000) return "competitive pricing"
  return "budget-friendly positioning"
}

function getDamageImpact(damageStatus: string): string {
  switch (damageStatus.toLowerCase()) {
    case "no damage":
      return "The pristine condition adds significant value to the asking price."
    case "minor":
      return "Minor cosmetic issues have minimal impact on mechanical integrity."
    case "moderate":
      return "Moderate damage affects pricing but doesn't compromise core functionality."
    case "major":
      return "Major damage significantly impacts market value and requires careful consideration."
    default:
      return "The damage status affects the overall market positioning."
  }
}

function getMarketInsight(brand: string): string {
  const insights: Record<string, string> = {
    toyota: "Toyota's reputation for reliability supports strong resale values.",
    bmw: "Premium German engineering maintains market appeal despite depreciation.",
    mercedes: "Mercedes-Benz vehicles typically hold value well in the luxury segment.",
    honda: "Honda's reliability record contributes to stable market demand.",
    ford: "Ford models show consistent performance in the mid-market segment.",
  }
  return insights[brand.toLowerCase()] || "This brand maintains steady market presence."
}

function getPricePosition(price: number): string {
  if (price > 500000) return "positioned in the premium range"
  if (price > 300000) return "competitively priced in the mid-luxury segment"
  if (price > 200000) return "well-positioned in the mainstream market"
  return "attractively priced for budget-conscious buyers"
}

function getMileageAssessment(vehicleData: any): string {
  const kmPerYear = vehicleData.km / (new Date().getFullYear() - vehicleData.year)
  if (kmPerYear < 15000) return "below average, indicating careful usage"
  if (kmPerYear < 25000) return "within normal range for this age"
  return "above average, suggesting active usage"
}

function getBrandInsight(brand: string): string {
  return `${brand} vehicles in this category typically maintain ${Math.floor(Math.random() * 15) + 70}% of their original value after this period.`
}

function getRecommendation(confidence: number): string {
  if (confidence > 90) return "Our high confidence rating suggests this is a reliable valuation."
  if (confidence > 80) return "The assessment shows good confidence in current market conditions."
  return "Market volatility suggests monitoring price trends for optimal timing."
}

function getValueProposition(price: number): string {
  if (price > 400000) return "premium value"
  if (price > 250000) return "solid value"
  return "excellent value for money"
}

function getDamageEffect(damageStatus: string): string {
  switch (damageStatus.toLowerCase()) {
    case "no damage":
      return "positively influences"
    case "minor":
      return "slightly reduces"
    case "moderate":
      return "moderately impacts"
    case "major":
      return "significantly affects"
    default:
      return "influences"
  }
}

function getAgeAssessment(year: number): string {
  const age = new Date().getFullYear() - year
  if (age < 3) return "The recent model year supports premium pricing."
  if (age < 7) return "The vehicle age is optimal for the used car market."
  return "The mature age reflects in the competitive pricing."
}

function getFinalRecommendation(confidence: number): string {
  if (confidence > 85) return "Strong market indicators support this valuation."
  return "Consider current market conditions when making decisions."
}

// Export mock database for debugging (remove in production)
export const mockDatabase = mockDB

console.log("🚀 Mock API Service initialized with demo data")
console.log("📧 Demo login: demo@demo.com / 12345678")
console.log("🔍 Check browser console for API call logs")
