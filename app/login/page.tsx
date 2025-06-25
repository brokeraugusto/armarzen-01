"use client"

import type React from "react"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { GlassButton } from "@/components/ui/glass-button"
import { GlassInput } from "@/components/ui/glass-input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Icons } from "@/components/icons"
import { Logo } from "@/components/logo"
import Link from "next/link"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      })

      const result = await response.json()

      if (result.success) {
        window.location.href = "/admin"
      } else {
        setError(result.error || "Erro no login")
      }
    } catch (error) {
      setError("Erro de conexão")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <GlassCard variant="elevated" className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-4" />
          <h1 className="text-2xl font-bold text-slate-200 mb-2">Acesso Administrativo</h1>
          <p className="text-slate-400">Entre com suas credenciais</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/30">
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email" className="text-slate-300">
              Email
            </Label>
            <GlassInput
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin@exemplo.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-slate-300">
              Senha
            </Label>
            <GlassInput
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>

          <GlassButton type="submit" disabled={loading} className="w-full h-11">
            {loading ? (
              <>
                <Icons.loader className="w-4 h-4 mr-2 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <Icons.user className="w-4 h-4 mr-2" />
                Entrar
              </>
            )}
          </GlassButton>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            Não tem acesso?{" "}
            <Link href="/setup" className="text-blue-400 hover:text-blue-300">
              Configurar sistema
            </Link>
          </p>
        </div>
      </GlassCard>
    </div>
  )
}
