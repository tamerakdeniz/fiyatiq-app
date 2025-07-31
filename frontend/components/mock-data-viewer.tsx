"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Trash2, RefreshCw } from "lucide-react"
import { mockDatabase } from "@/services/api"

export function MockDataViewer() {
  const [isVisible, setIsVisible] = useState(false)
  const [storageData, setStorageData] = useState<any>({})

  const refreshStorageData = () => {
    setStorageData({
      token: localStorage.getItem("token"),
      user: localStorage.getItem("currentUser"),
      vehicles: localStorage.getItem("userVehicles"),
    })
  }

  useEffect(() => {
    if (isVisible) {
      refreshStorageData()
    }
  }, [isVisible])

  const clearAllData = () => {
    if (confirm("Clear all mock data? This will sign you out.")) {
      localStorage.clear()
      window.location.reload()
    }
  }

  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button variant="outline" size="sm" onClick={() => setIsVisible(!isVisible)} className="mb-2 bg-white shadow-lg">
        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        <span className="ml-2">Mock Data</span>
      </Button>

      {isVisible && (
        <Card className="w-80 max-h-96 overflow-auto shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              🔧 Mock Database
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={refreshStorageData}>
                  <RefreshCw className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={clearAllData}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardTitle>
            <CardDescription className="text-xs">Development debugging panel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div>
              <Badge variant="secondary" className="mb-2">
                Mock Users
              </Badge>
              <div className="bg-gray-50 p-2 rounded text-xs">
                {mockDatabase.users.map((user) => (
                  <div key={user.id} className="mb-1">
                    <strong>{user.email}</strong> ({user.name})
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Badge variant="secondary" className="mb-2">
                Mock Vehicles
              </Badge>
              <div className="bg-gray-50 p-2 rounded text-xs">{mockDatabase.vehicles.length} vehicles in mock DB</div>
            </div>

            <div>
              <Badge variant="secondary" className="mb-2">
                LocalStorage
              </Badge>
              <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
                <div>
                  <strong>Token:</strong> {storageData.token ? "✅ Set" : "❌ None"}
                </div>
                <div>
                  <strong>User:</strong> {storageData.user ? "✅ Set" : "❌ None"}
                </div>
                <div>
                  <strong>Vehicles:</strong> {storageData.vehicles ? "✅ Set" : "❌ None"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
