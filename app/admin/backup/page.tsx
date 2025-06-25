"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, Upload, Database, FileText } from "lucide-react"
import Link from "next/link"

export default function BackupPage() {
  const [backupType, setBackupType] = useState("full")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)

  const generateBackup = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: backupType }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `armarzen_backup_${backupType}_${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        throw new Error("Erro ao gerar backup")
      }
    } catch (error) {
      alert("Erro ao gerar backup: " + error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsRestoring(true)
    try {
      const text = await file.text()
      const backupData = JSON.parse(text)

      const response = await fetch("/api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backupData),
      })

      const result = await response.json()

      if (result.success) {
        alert(
          `Backup restaurado com sucesso!\n\nResultados:\n- Categorias: ${result.results.categories}\n- Produtos: ${result.results.products}\n- Configurações: ${result.results.settings}`,
        )
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      alert("Erro ao restaurar backup: " + error.message)
    } finally {
      setIsRestoring(false)
    }
  }

  const exportData = async (type: string) => {
    try {
      const response = await fetch(`/api/reports/export?type=${type}&format=csv`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${type}_${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        throw new Error("Erro ao exportar dados")
      }
    } catch (error) {
      alert("Erro ao exportar: " + error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Database className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold">Backup e Restauração</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="w-5 h-5 mr-2" />
                Gerar Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Backup</label>
                <Select value={backupType} onValueChange={setBackupType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Backup Completo</SelectItem>
                    <SelectItem value="products">Apenas Produtos</SelectItem>
                    <SelectItem value="categories">Apenas Categorias</SelectItem>
                    <SelectItem value="sales">Apenas Vendas</SelectItem>
                    <SelectItem value="settings">Apenas Configurações</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={generateBackup} disabled={isGenerating} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                {isGenerating ? "Gerando..." : "Gerar Backup"}
              </Button>

              <div className="text-sm text-gray-600">
                <p>O backup será baixado como arquivo JSON contendo:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {backupType === "full" && (
                    <>
                      <li>Produtos e categorias</li>
                      <li>Vendas e itens</li>
                      <li>Configurações do sistema</li>
                    </>
                  )}
                  {backupType === "products" && <li>Todos os produtos ativos</li>}
                  {backupType === "categories" && <li>Todas as categorias ativas</li>}
                  {backupType === "sales" && <li>Últimas 1000 vendas</li>}
                  {backupType === "settings" && <li>Configurações do sistema</li>}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Restore */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Restaurar Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Arquivo de Backup</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  disabled={isRestoring}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {isRestoring && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Restaurando backup...</span>
                </div>
              )}

              <div className="text-sm text-gray-600">
                <p className="font-medium text-amber-600 mb-2">⚠️ Atenção:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>A restauração irá sobrescrever dados existentes</li>
                  <li>Faça um backup atual antes de restaurar</li>
                  <li>Use apenas arquivos de backup válidos</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Data */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Exportar Dados (CSV)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button variant="outline" onClick={() => exportData("sales")} className="h-20 flex-col">
                <FileText className="w-6 h-6 mb-2" />
                Exportar Vendas
              </Button>

              <Button variant="outline" onClick={() => exportData("products")} className="h-20 flex-col">
                <FileText className="w-6 h-6 mb-2" />
                Exportar Produtos
              </Button>

              <Button variant="outline" onClick={() => exportData("stock")} className="h-20 flex-col">
                <FileText className="w-6 h-6 mb-2" />
                Exportar Estoque
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
