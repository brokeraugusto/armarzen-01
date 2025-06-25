"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Waves, Key, CheckCircle } from "lucide-react"

export default function SetupPage() {
  const [setupKey, setSetupKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setupKey }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || "Erro no setup")
      }
    } catch (error) {
      setError("Erro de conexão")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-200 mb-4">Setup Concluído!</h2>
            <p className="text-slate-400 mb-6">
              Usuário admin criado com sucesso.
              <br />
              <br />
              <strong className="text-slate-200">Credenciais:</strong>
              <br />
              Email: admin@armarzen.com
              <br />
              Senha: admin123
            </p>
            <Button
              onClick={() => (window.location.href = "/login")}
              className="w-full bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white border-0"
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 via-teal-500 to-emerald-500 flex items-center justify-center">
              <Waves className="w-7 h-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
            Setup Inicial
          </CardTitle>
          <p className="text-slate-400">Configure o usuário administrador do sistema</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <Label htmlFor="setupKey" className="text-slate-300">
                Chave de Setup
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  id="setupKey"
                  type="password"
                  value={setupKey}
                  onChange={(e) => setSetupKey(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-slate-200 pl-10"
                  placeholder="Digite a chave de setup"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Chave: armarzen-setup-2024</p>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white border-0"
            >
              {isLoading ? "Configurando..." : "Configurar Sistema"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-200 mb-2">O que será criado:</h4>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Usuário administrador</li>
              <li>• Email: admin@armarzen.com</li>
              <li>• Senha: admin123</li>
              <li>• Permissões completas</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
