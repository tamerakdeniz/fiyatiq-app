"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Car } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function SigninPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const { signin } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await signin(formData.email, formData.password)
      toast({
        title: "Tekrar hoş geldiniz!",
        description: "Başarıyla giriş yaptınız.",
      })
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Giriş yapılamadı")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Car className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Tekrar Hoş Geldiniz</CardTitle>
          <CardDescription>Araç tahmin hesabınıza giriş yapın</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Debug Panel - Development Only */}
          {process.env.NODE_ENV === "development" && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 text-sm mb-2">🧪 Demo Hesap</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p>
                  <strong>Email:</strong> demo@demo.com
                </p>
                <p>
                  <strong>Şifre:</strong> 12345678
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ email: "demo@demo.com", password: "12345678" })
                  }}
                  className="mt-2 px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs"
                >
                  Demo Bilgilerini Doldur
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Email adresinizi girin"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Şifrenizi girin"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : (
                "Giriş Yap"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Hesabınız yok mu? </span>
            <Link href="/signup" className="text-blue-600 hover:underline">
              Kayıt ol
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
