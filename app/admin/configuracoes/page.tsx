"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Webhook, Save, TestTube, Upload, RotateCcw, ImageIcon } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"

interface WebhookSetting {
  id: string
  event_type: string
  webhook_url: string
  is_active: boolean
  retry_attempts: number
  timeout_seconds: number
  headers?: any
}

export default function ConfiguracoesAdmin() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [webhooks, setWebhooks] = useState<WebhookSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const [storeSettings, setStoreSettings] = useState({
    store_name: "",
    store_phone: "",
    store_email: "",
    tax_rate: "",
    currency: "BRL",
  })

  const [webhookSettings, setWebhookSettings] = useState({
    n8n_base_url: "",
    n8n_webhook_token: "",
    whatsapp_phone: "",
    stock_alert_webhook: "",
    sale_webhook: "",
    daily_summary_webhook: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [settingsResponse, webhooksResponse] = await Promise.all([fetch("/api/settings"), fetch("/api/webhooks")])

      const settingsData = await settingsResponse.json()
      const webhooksData = await webhooksResponse.json()

      setSettings(settingsData)
      setWebhooks(webhooksData)

      // Preencher formulários
      setStoreSettings({
        store_name: settingsData.store_name || "",
        store_phone: settingsData.store_phone || "",
        store_email: settingsData.store_email || "",
        tax_rate: settingsData.tax_rate || "0",
        currency: settingsData.currency || "BRL",
      })

      setWebhookSettings({
        n8n_base_url: settingsData.n8n_base_url || "",
        n8n_webhook_token: settingsData.n8n_webhook_token || "",
        whatsapp_phone: settingsData.whatsapp_phone || "",
        stock_alert_webhook: settingsData.stock_alert_webhook || "",
        sale_webhook: settingsData.sale_webhook || "",
        daily_summary_webhook: settingsData.daily_summary_webhook || "",
      })
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveStoreSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeSettings),
      })

      if (response.ok) {
        alert("Configurações da loja salvas com sucesso!")
      } else {
        throw new Error("Erro ao salvar configurações")
      }
    } catch (error) {
      console.error("Error saving store settings:", error)
      alert("Erro ao salvar configurações da loja")
    } finally {
      setSaving(false)
    }
  }

  const saveWebhookSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookSettings),
      })

      if (response.ok) {
        alert("Configurações de webhook salvas com sucesso!")
      } else {
        throw new Error("Erro ao salvar configurações")
      }
    } catch (error) {
      console.error("Error saving webhook settings:", error)
      alert("Erro ao salvar configurações de webhook")
    } finally {
      setSaving(false)
    }
  }

  const testWebhook = async (eventType: string) => {
    try {
      const testPayload = {
        event: eventType,
        test: true,
        timestamp: new Date().toISOString(),
        data: {
          message: `Teste de webhook para evento: ${eventType}`,
        },
      }

      const webhookUrl = webhookSettings[`${eventType}_webhook` as keyof typeof webhookSettings]

      if (!webhookUrl) {
        alert("URL do webhook não configurada")
        return
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${webhookSettings.n8n_webhook_token}`,
        },
        body: JSON.stringify(testPayload),
      })

      if (response.ok) {
        alert(`Webhook ${eventType} testado com sucesso!`)
      } else {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Webhook test error:", error)
      alert(`Erro ao testar webhook: ${error.message}`)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append("logo", file)

      const response = await fetch("/api/settings/logo", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        alert("Logo atualizado com sucesso!")
        // Recarregar a página para mostrar o novo logo
        window.location.reload()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Logo upload error:", error)
      alert("Erro ao fazer upload do logo: " + error.message)
    } finally {
      setUploadingLogo(false)
    }
  }

  const resetLogo = async () => {
    if (!confirm("Tem certeza que deseja restaurar o logo padrão?")) return

    try {
      const response = await fetch("/api/settings/logo", {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        alert("Logo restaurado para o padrão!")
        window.location.reload()
      } else {
        throw new Error("Erro ao restaurar logo")
      }
    } catch (error) {
      console.error("Logo reset error:", error)
      alert("Erro ao restaurar logo")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <Logo size="sm" />
            <div>
              <h1 className="text-2xl font-bold text-slate-700">Configurações do Sistema</h1>
              <p className="text-sm text-slate-500">Gerencie as configurações da loja e integrações</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="store" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 border border-blue-200">
            <TabsTrigger value="store" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Loja
            </TabsTrigger>
            <TabsTrigger value="appearance" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Aparência
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Webhooks
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Integrações
            </TabsTrigger>
          </TabsList>

          {/* Configurações da Loja */}
          <TabsContent value="store">
            <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
              <CardHeader>
                <CardTitle className="text-slate-700">Configurações da Loja</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="store_name" className="text-slate-600">
                      Nome da Loja
                    </Label>
                    <Input
                      id="store_name"
                      value={storeSettings.store_name}
                      onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })}
                      className="bg-white/80 border-blue-200"
                    />
                  </div>

                  <div>
                    <Label htmlFor="store_phone" className="text-slate-600">
                      Telefone
                    </Label>
                    <Input
                      id="store_phone"
                      value={storeSettings.store_phone}
                      onChange={(e) => setStoreSettings({ ...storeSettings, store_phone: e.target.value })}
                      className="bg-white/80 border-blue-200"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="store_email" className="text-slate-600">
                    Email
                  </Label>
                  <Input
                    id="store_email"
                    type="email"
                    value={storeSettings.store_email}
                    onChange={(e) => setStoreSettings({ ...storeSettings, store_email: e.target.value })}
                    className="bg-white/80 border-blue-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tax_rate" className="text-slate-600">
                      Taxa de Imposto (%)
                    </Label>
                    <Input
                      id="tax_rate"
                      type="number"
                      step="0.01"
                      value={storeSettings.tax_rate}
                      onChange={(e) => setStoreSettings({ ...storeSettings, tax_rate: e.target.value })}
                      className="bg-white/80 border-blue-200"
                    />
                  </div>

                  <div>
                    <Label htmlFor="currency" className="text-slate-600">
                      Moeda
                    </Label>
                    <Input
                      id="currency"
                      value={storeSettings.currency}
                      onChange={(e) => setStoreSettings({ ...storeSettings, currency: e.target.value })}
                      className="bg-white/80 border-blue-200"
                    />
                  </div>
                </div>

                <Button
                  onClick={saveStoreSettings}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Salvando..." : "Salvar Configurações da Loja"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações de Aparência */}
          <TabsContent value="appearance">
            <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-700">
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Logo da Loja
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0">
                    <Logo size="lg" showText={false} />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <Label htmlFor="logo-upload" className="text-slate-600">
                        Alterar Logo
                      </Label>
                      <div className="mt-2 flex items-center space-x-4">
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                          className="hidden"
                        />
                        <Button
                          onClick={() => document.getElementById("logo-upload")?.click()}
                          disabled={uploadingLogo}
                          variant="outline"
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadingLogo ? "Enviando..." : "Escolher Arquivo"}
                        </Button>

                        <Button
                          onClick={resetLogo}
                          variant="outline"
                          className="border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Restaurar Padrão
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Formatos aceitos: PNG, JPG, SVG. Tamanho máximo: 2MB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Dicas para o Logo:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Use imagens quadradas para melhor resultado</li>
                    <li>• Resolução recomendada: 200x200px ou superior</li>
                    <li>• Prefira fundos transparentes (PNG)</li>
                    <li>• O logo será redimensionado automaticamente</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações de Webhooks */}
          <TabsContent value="webhooks">
            <div className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-700">
                    <Webhook className="w-5 h-5 mr-2" />
                    Configurações N8N & WhatsApp
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="n8n_base_url" className="text-slate-600">
                      URL Base do N8N
                    </Label>
                    <Input
                      id="n8n_base_url"
                      placeholder="https://your-n8n-instance.com"
                      value={webhookSettings.n8n_base_url}
                      onChange={(e) => setWebhookSettings({ ...webhookSettings, n8n_base_url: e.target.value })}
                      className="bg-white/80 border-blue-200"
                    />
                  </div>

                  <div>
                    <Label htmlFor="n8n_webhook_token" className="text-slate-600">
                      Token de Autenticação N8N
                    </Label>
                    <Input
                      id="n8n_webhook_token"
                      type="password"
                      placeholder="Bearer token para autenticação"
                      value={webhookSettings.n8n_webhook_token}
                      onChange={(e) => setWebhookSettings({ ...webhookSettings, n8n_webhook_token: e.target.value })}
                      className="bg-white/80 border-blue-200"
                    />
                  </div>

                  <div>
                    <Label htmlFor="whatsapp_phone" className="text-slate-600">
                      Número WhatsApp (com DDI)
                    </Label>
                    <Input
                      id="whatsapp_phone"
                      placeholder="5511999999999"
                      value={webhookSettings.whatsapp_phone}
                      onChange={(e) => setWebhookSettings({ ...webhookSettings, whatsapp_phone: e.target.value })}
                      className="bg-white/80 border-blue-200"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
                <CardHeader>
                  <CardTitle className="text-slate-700">URLs dos Webhooks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="stock_alert_webhook" className="text-slate-600">
                      Webhook - Alerta de Estoque
                    </Label>
                    <div className="flex space-x-2">
                      <Input
                        id="stock_alert_webhook"
                        placeholder="https://your-n8n-instance.com/webhook/stock-alert"
                        value={webhookSettings.stock_alert_webhook}
                        onChange={(e) =>
                          setWebhookSettings({ ...webhookSettings, stock_alert_webhook: e.target.value })
                        }
                        className="bg-white/80 border-blue-200"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testWebhook("stock_alert")}
                        disabled={!webhookSettings.stock_alert_webhook}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <TestTube className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sale_webhook" className="text-slate-600">
                      Webhook - Venda Concluída
                    </Label>
                    <div className="flex space-x-2">
                      <Input
                        id="sale_webhook"
                        placeholder="https://your-n8n-instance.com/webhook/sale-completed"
                        value={webhookSettings.sale_webhook}
                        onChange={(e) => setWebhookSettings({ ...webhookSettings, sale_webhook: e.target.value })}
                        className="bg-white/80 border-blue-200"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testWebhook("sale")}
                        disabled={!webhookSettings.sale_webhook}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <TestTube className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="daily_summary_webhook" className="text-slate-600">
                      Webhook - Resumo Diário
                    </Label>
                    <div className="flex space-x-2">
                      <Input
                        id="daily_summary_webhook"
                        placeholder="https://your-n8n-instance.com/webhook/daily-summary"
                        value={webhookSettings.daily_summary_webhook}
                        onChange={(e) =>
                          setWebhookSettings({ ...webhookSettings, daily_summary_webhook: e.target.value })
                        }
                        className="bg-white/80 border-blue-200"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testWebhook("daily_summary")}
                        disabled={!webhookSettings.daily_summary_webhook}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <TestTube className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={saveWebhookSettings}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Salvando..." : "Salvar Configurações de Webhook"}
                  </Button>
                </CardContent>
              </Card>

              {/* Status dos Webhooks */}
              <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
                <CardHeader>
                  <CardTitle className="text-slate-700">Status dos Webhooks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { key: "stock_alert", label: "Alerta de Estoque", url: webhookSettings.stock_alert_webhook },
                      { key: "sale", label: "Venda Concluída", url: webhookSettings.sale_webhook },
                      { key: "daily_summary", label: "Resumo Diário", url: webhookSettings.daily_summary_webhook },
                    ].map((webhook) => (
                      <div
                        key={webhook.key}
                        className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <div>
                          <p className="font-medium text-slate-700">{webhook.label}</p>
                          <p className="text-sm text-slate-500 truncate max-w-md">{webhook.url || "Não configurado"}</p>
                        </div>
                        <Badge
                          variant={webhook.url ? "default" : "secondary"}
                          className={webhook.url ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}
                        >
                          {webhook.url ? "Configurado" : "Pendente"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Integrações */}
          <TabsContent value="integrations">
            <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
              <CardHeader>
                <CardTitle className="text-slate-700">Integrações Externas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <h3 className="font-semibold mb-2 text-slate-700">Mercado Pago</h3>
                    <p className="text-sm text-slate-600 mb-3">
                      Configure suas credenciais do Mercado Pago nas variáveis de ambiente do Vercel
                    </p>
                    <div className="space-y-2 text-sm">
                      <p>
                        <code className="bg-white px-2 py-1 rounded border">MERCADOPAGO_ACCESS_TOKEN</code>
                      </p>
                      <p>
                        <code className="bg-white px-2 py-1 rounded border">MERCADOPAGO_PUBLIC_KEY</code>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <h3 className="font-semibold mb-2 text-slate-700">Evolution API (WhatsApp)</h3>
                    <p className="text-sm text-slate-600 mb-3">
                      Configure a Evolution API para envio de mensagens WhatsApp
                    </p>
                    <div className="space-y-2 text-sm">
                      <p>
                        <code className="bg-white px-2 py-1 rounded border">EVOLUTION_API_URL</code>
                      </p>
                      <p>
                        <code className="bg-white px-2 py-1 rounded border">EVOLUTION_API_KEY</code>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <h3 className="font-semibold mb-2 text-slate-700">Supabase</h3>
                    <p className="text-sm text-slate-600 mb-3">Banco de dados e autenticação</p>
                    <Badge className="bg-green-100 text-green-800">Configurado</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
