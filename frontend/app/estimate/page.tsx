"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Car, TrendingUp, Brain, Save } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { PrivateRoute } from "@/components/private-route"
import { vehicleService } from "@/services/api"
import { useToast } from "@/hooks/use-toast"

interface EstimationResult {
  estimatedPrice: number
  aiSummary: string
  confidence: number
}

function EstimateContent() {
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: "",
    km: "",
    damageStatus: "",
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EstimationResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const router = useRouter()
  const { toast } = useToast()

  const damageOptions = ["No Damage", "Minor", "Moderate", "Major", "Severe"]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const estimationData = {
        brand: formData.brand,
        model: formData.model,
        year: Number.parseInt(formData.year),
        km: Number.parseInt(formData.km),
        damageStatus: formData.damageStatus,
      }

      const result = await vehicleService.estimatePrice(estimationData)
      setResult(result)
    } catch (err: any) {
      setError(err.message || "Failed to estimate price")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!result) return

    setSaving(true)
    try {
      const vehicleData = {
        brand: formData.brand,
        model: formData.model,
        year: Number.parseInt(formData.year),
        km: Number.parseInt(formData.km),
        damageStatus: formData.damageStatus,
        estimatedPrice: result.estimatedPrice,
        aiSummary: result.aiSummary,
      }

      await vehicleService.saveVehicle(vehicleData)
      toast({
        title: "Vehicle saved!",
        description: "The vehicle has been added to your dashboard.",
      })
      router.push("/dashboard")
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save vehicle",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Vehicle Price Estimation</h1>
        <p className="text-gray-600">Get AI-powered price estimates based on real-time market data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Information
            </CardTitle>
            <CardDescription>Enter your vehicle details for accurate estimation</CardDescription>
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
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    placeholder="e.g., Toyota"
                    value={formData.brand}
                    onChange={(e) => handleChange("brand", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder="e.g., Corolla"
                    value={formData.model}
                    onChange={(e) => handleChange("model", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Select value={formData.year} onValueChange={(value) => handleChange("year", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="km">Kilometers</Label>
                  <Input
                    id="km"
                    type="number"
                    placeholder="e.g., 50000"
                    value={formData.km}
                    onChange={(e) => handleChange("km", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="damage">Damage Status</Label>
                <Select value={formData.damageStatus} onValueChange={(value) => handleChange("damageStatus", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select damage status" />
                  </SelectTrigger>
                  <SelectContent>
                    {damageOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Predict Price
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
                AI Estimation Result
              </CardTitle>
              <CardDescription>Based on current market analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-sm text-blue-600 font-medium mb-1">Estimated Price</div>
                <div className="text-3xl font-bold text-blue-900">₺{result.estimatedPrice.toLocaleString()}</div>
                <div className="text-sm text-blue-600 mt-1">Confidence: {result.confidence}%</div>
              </div>

              <div className="space-y-2">
                <Label>AI Expert Analysis</Label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700 leading-relaxed">{result.aiSummary}</p>
                </div>
              </div>

              <Button onClick={handleSave} className="w-full" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save to Dashboard
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
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
  )
}
