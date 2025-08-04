"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, Car, Calendar, Gauge, AlertTriangle, Trash2, RefreshCw, Eye } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { PrivateRoute } from "@/components/private-route"
import { vehicleService } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import type { Vehicle } from "@/types"

const DEBUG_MODE = process.env.NODE_ENV === "development"

function DashboardContent() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadVehicles()
  }, [])

  const loadVehicles = async () => {
    try {
      setLoading(true)
      const data = await vehicleService.getVehicles()
      setVehicles(data)
    } catch (err: any) {
      setError(err.message || "Failed to load vehicles")
    } finally {
      setLoading(false)
    }
  }

  const debugInfo = () => {
    if (!DEBUG_MODE) return null

    return (
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">🔧 Debug Info (Development Only)</h3>
        <div className="text-sm text-yellow-700 space-y-1">
          <p>
            <strong>Demo Account:</strong> demo@demo.com / 12345678
          </p>
          <p>
            <strong>Vehicles in Storage:</strong> {vehicles.length}
          </p>
          <p>
            <strong>Mock API:</strong> Check browser console for API call logs
          </p>
          <p>
            <strong>Data Storage:</strong> Using localStorage (data persists until cleared)
          </p>
        </div>
      </div>
    )
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return

    try {
      await vehicleService.deleteVehicle(id)
      setVehicles((prev) => prev.filter((v) => v.id !== id))
      toast({
        title: "Vehicle deleted",
        description: "The vehicle has been removed from your dashboard.",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete vehicle",
        variant: "destructive",
      })
    }
  }

  const handleRecalculate = async (vehicle: Vehicle) => {
    try {
      const updatedVehicle = await vehicleService.recalculatePrice(vehicle.id)
      setVehicles((prev) => prev.map((v) => (v.id === vehicle.id ? updatedVehicle : v)))
      toast({
        title: "Price updated",
        description: "The vehicle price has been recalculated.",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to recalculate price",
        variant: "destructive",
      })
    }
  }

  const getDamageColor = (damage: string) => {
    switch (damage.toLowerCase()) {
      case "no damage":
        return "bg-green-100 text-green-800"
      case "minor":
        return "bg-yellow-100 text-yellow-800"
      case "major":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {debugInfo()}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Vehicles</h1>
          <p className="text-gray-600 mt-1">
            {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} saved
          </p>
        </div>
        <Button onClick={() => router.push("/estimate")} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Car className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <CardTitle className="mb-2">No vehicles yet</CardTitle>
            <CardDescription className="mb-6">
              Start by adding your first vehicle to get AI-powered price estimates
            </CardDescription>
            <Button onClick={() => router.push("/estimate")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Vehicle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {vehicle.brand} {vehicle.model}
                    </CardTitle>
                    <CardDescription>Added {new Date(vehicle.createdAt).toLocaleDateString()}</CardDescription>
                  </div>
                  <Badge className={getDamageColor(vehicle.damageStatus)}>{vehicle.damageStatus}</Badge>
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
                  <div className="text-sm text-blue-600 font-medium">Estimated Price</div>
                  <div className="text-2xl font-bold text-blue-900">₺{vehicle.estimatedPrice.toLocaleString()}</div>
                </div>

                {vehicle.aiSummary && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-1">AI Analysis</div>
                    <p className="text-sm text-gray-600 line-clamp-3">{vehicle.aiSummary}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleRecalculate(vehicle)} className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Recalculate
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/vehicle/${vehicle.id}`)}>
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
  )
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
  )
}
