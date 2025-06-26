"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { GlassButton } from "@/components/ui/glass-button"
import { GlassInput } from "@/components/ui/glass-input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Webhook,
  Save,
  TestTube,
  Upload,
  RotateCcw,
  ImageIcon,
  User,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Copy,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { Icons } from "@/components/icons"

interface WebhookSetting {
  id: string
  event_type: string
  webhook_url: string
  is_active: boolean
  retry_attempts: number
  timeout_seconds: number
  headers?: any
}

interface UserProfile {
  id: string
  email: string
  name: string
  created_at: string
}

export default function ConfiguracoesAdmin() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [webhooks, setWebhooks] = useState<WebhookSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null)

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

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // URLs de exemplo para teste
  const exampleUrls = {
    stock_alert: "https://example.com/api/webhooks/examples/stock-alert",
    sale: "https://example.com/api/webhooks/examples/sale-completed",
    daily_summary: "https://example.com/api/webhooks/examples/daily-summary",
  }

  useEffect(() => {
    fetchData()
    fetchUserProfile()
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

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/auth/profile")
      const result = await response.json()

      if (result.success) {
        setUser(result.user)
        setProfileForm({
          name: result.user.name || "",
          email: result.user.email || "",
        })
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
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
        setSuccess("Configurações da loja salvas com sucesso!")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        throw new Error("Erro ao salvar configurações")
      }
    } catch (error) {
      console.error("Error saving store settings:", error)
      setError("Erro ao salvar configurações da loja")
      setTimeout(() => setError(""), 3000)
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
        setSuccess("Configurações de webhook salvas com sucesso!")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        throw new Error("Erro ao salvar configurações")
      }
    } catch (error) {
      console.error("Error saving webhook settings:", error)
      setError("Erro ao salvar configurações de webhook")
      setTimeout(() => setError(""), 3000)
    } finally {
      setSaving(false)
    }
  }

  const updateProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess("Perfil atualizado com sucesso!")
        setShowProfileDialog(false)
        await fetchUserProfile()
        setTimeout(() => setSuccess(""), 3000)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      setError("Erro ao atualizar perfil: " + error.message)
      setTimeout(() => setError(""), 3000)
    } finally {
      setSaving(false)
    }
  }

  const updatePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("As senhas não coincidem")
      setTimeout(() => setError(""), 3000)
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres")
      setTimeout(() => setError(""), 3000)
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess("Senha alterada com sucesso!")
        setShowPasswordDialog(false)
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
        setTimeout(() => setSuccess(""), 3000)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      setError("Erro ao alterar senha: " + error.message)
      setTimeout(() => setError(""), 3000)
    } finally {
      setSaving(false)
    }
  }

  const testWebhook = async (eventType: string) => {
    const webhookUrl = webhookSettings[`${eventType}_webhook` as keyof typeof webhookSettings]

    if (!webhookUrl || !webhookUrl.trim()) {
      setError(`URL do webhook ${eventType} não está configurada`)
      setTimeout(() => setError(""), 3000)
      return
    }

    setTestingWebhook(eventType)
    try {
      const response = await fetch("/api/webhooks/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventType,
          webhookUrl: webhookUrl.trim(),
          token: webhookSettings.n8n_webhook_token?.trim(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(result.message || `Webhook ${eventType} testado com sucesso!`)
        setTimeout(() => setSuccess(""), 5000)
      } else {
        let errorMsg = result.error
        if (result.suggestion) {
          errorMsg += `\n\nSugestão: ${result.suggestion}`
        }
        throw new Error(errorMsg)
      }
    } catch (error) {
      console.error("Webhook test error:", error)
      setError(`Erro ao testar webhook: ${error.message}`)
      setTimeout(() => setError(""), 8000)
    } finally {
      setTestingWebhook(null)
    }
  }

  const validateWebhookUrl = (url: string): boolean => {
    if (!url || !url.trim()) return false
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setSuccess("URL copiada para a área de transferência!")
      setTimeout(() => setSuccess(""), 2000)
    } catch (error) {
      console.error("Erro ao copiar:", error)
    }
  }

  const useExampleUrl = (eventType: string) => {
    const url = exampleUrls[eventType as keyof typeof exampleUrls]

    setWebhookSettings({
      ...webhookSettings,
      [`${eventType}_webhook`]: url,
    })

    setSuccess(`URL de exemplo definida para ${eventType}`)
    setTimeout(() => setSuccess(""), 3000)
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
        setSuccess("Logo atualizado com sucesso!")
        setTimeout(() => setSuccess(""), 3000)
        // Recarregar a página para mostrar o novo logo
        window.location.reload()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Logo upload error:", error)
      setError("Erro ao fazer upload do logo: " + error.message)
      setTimeout(() => setError(""), 3000)
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
        setSuccess("Logo restaurado para o padrão!")
        setTimeout(() => setSuccess(""), 3000)
        window.location.reload()
      } else {
        throw new Error("Erro ao restaurar logo")
      }
    } catch (error) {
      console.error("Logo reset error:", error)
      setError("Erro ao restaurar logo")
      setTimeout(() => setError(""), 3000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <Icons.loader className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-300">Carregando configurações...</p>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-700/30">
        <GlassCard variant="elevated" className="rounded-none border-x-0 border-t-0">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/admin">
                  <GlassButton variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </GlassButton>
                </Link>
                <Logo size="sm" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-200">Configurações do Sistema</h1>
                  <p className="text-sm text-slate-400">Gerencie as configurações da loja e integrações</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <GlassButton variant="outline" onClick={() => setShowProfileDialog(true)}>
                  <User className="w-4 h-4 mr-2" />
                  Meu Perfil
                </GlassButton>
              </div>
            </div>
          </div>
        </GlassCard>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/30">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-red-400 whitespace-pre-line">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-500/10 border-green-500/30">
            <CheckCircle className="w-4 h-4" />
            <AlertDescription className="text-green-400">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="store" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/30 backdrop-blur-md border border-slate-700/40">
            <TabsTrigger
              value="store"
              className="data-[state=active]:bg-blue-500/80 data-[state=active]:text-white text-slate-300"
            >
              Loja
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="data-[state=active]:bg-blue-500/80 data-[state=active]:text-white text-slate-300"
            >
              Aparência
            </TabsTrigger>
            <TabsTrigger
              value="webhooks"
              className="data-[state=active]:bg-blue-500/80 data-[state=active]:text-white text-slate-300"
            >
              Webhooks
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="data-[state=active]:bg-blue-500/80 data-[state=active]:text-white text-slate-300"
            >
              Integrações
            </TabsTrigger>
          </TabsList>

          {/* Configurações da Loja */}
          <TabsContent value="store">
            <GlassCard className="p-6">
              <div className="flex items-center mb-6">
                <Icons.settings className="w-5 h-5 mr-2 text-blue-400" />
                <h2 className="text-lg font-semibold text-slate-200">Configurações da Loja</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="store_name" className="text-slate-300">
                      Nome da Loja
                    </Label>
                    <GlassInput
                      id="store_name"
                      value={storeSettings.store_name}
                      onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="store_phone" className="text-slate-300">
                      Telefone
                    </Label>
                    <GlassInput
                      id="store_phone"
                      value={storeSettings.store_phone}
                      onChange={(e) => setStoreSettings({ ...storeSettings, store_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="store_email" className="text-slate-300">
                    Email
                  </Label>
                  <GlassInput
                    id="store_email"
                    type="email"
                    value={storeSettings.store_email}
                    onChange={(e) => setStoreSettings({ ...storeSettings, store_email: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tax_rate" className="text-slate-300">
                      Taxa de Imposto (%)
                    </Label>
                    <GlassInput
                      id="tax_rate"
                      type="number"
                      step="0.01"
                      value={storeSettings.tax_rate}
                      onChange={(e) => setStoreSettings({ ...storeSettings, tax_rate: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="currency" className="text-slate-300">
                      Moeda
                    </Label>
                    <GlassInput
                      id="currency"
                      value={storeSettings.currency}
                      onChange={(e) => setStoreSettings({ ...storeSettings, currency: e.target.value })}
                    />
                  </div>
                </div>

                <GlassButton onClick={saveStoreSettings} disabled={saving} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Salvando..." : "Salvar Configurações da Loja"}
                </GlassButton>
              </div>
            </GlassCard>
          </TabsContent>

          {/* Configurações de Aparência */}
          <TabsContent value="appearance">
            <GlassCard className="p-6">
              <div className="flex items-center mb-6">
                <ImageIcon className="w-5 h-5 mr-2 text-blue-400" />
                <h2 className="text-lg font-semibold text-slate-200">Logo da Loja</h2>
              </div>
              <div className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0">
                    <Logo size="lg" showText={false} />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <Label htmlFor="logo-upload" className="text-slate-300">
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
                        <GlassButton
                          onClick={() => document.getElementById("logo-upload")?.click()}
                          disabled={uploadingLogo}
                          variant="outline"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadingLogo ? "Enviando..." : "Escolher Arquivo"}
                        </GlassButton>

                        <GlassButton onClick={resetLogo} variant="outline">
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Restaurar Padrão
                        </GlassButton>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        Formatos aceitos: PNG, JPG, SVG. Tamanho máximo: 2MB
                      </p>
                    </div>
                  </div>
                </div>

                <GlassCard variant="subtle" className="p-4">
                  <h4 className="font-medium text-blue-300 mb-2">Dicas para o Logo:</h4>
                  <ul className="text-sm text-slate-400 space-y-1">
                    <li>• Use imagens quadradas para melhor resultado</li>
                    <li>• Resolução recomendada: 200x200px ou superior</li>
                    <li>• Prefira fundos transparentes (PNG)</li>
                    <li>• O logo será redimensionado automaticamente</li>
                  </ul>
                </GlassCard>
              </div>
            </GlassCard>
          </TabsContent>

          {/* Configurações de Webhooks */}
          <TabsContent value="webhooks">
            <div className="space-y-6">
              <GlassCard className="p-6">
                <div className="flex items-center mb-6">
                  <Webhook className="w-5 h-5 mr-2 text-blue-400" />
                  <h2 className="text-lg font-semibold text-slate-200">Configurações N8N & WhatsApp</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="n8n_base_url" className="text-slate-300">
                      URL Base do N8N
                    </Label>
                    <GlassInput
                      id="n8n_base_url"
                      placeholder="https://your-n8n-instance.com"
                      value={webhookSettings.n8n_base_url}
                      onChange={(e) => setWebhookSettings({ ...webhookSettings, n8n_base_url: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="n8n_webhook_token" className="text-slate-300">
                      Token de Autenticação N8N
                    </Label>
                    <GlassInput
                      id="n8n_webhook_token"
                      type="password"
                      placeholder="Bearer token para autenticação"
                      value={webhookSettings.n8n_webhook_token}
                      onChange={(e) => setWebhookSettings({ ...webhookSettings, n8n_webhook_token: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="whatsapp_phone" className="text-slate-300">
                      Número WhatsApp (com DDI)
                    </Label>
                    <GlassInput
                      id="whatsapp_phone"
                      placeholder="5511999999999"
                      value={webhookSettings.whatsapp_phone}
                      onChange={(e) => setWebhookSettings({ ...webhookSettings, whatsapp_phone: e.target.value })}
                    />
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">URLs dos Webhooks</h3>
                <div className="space-y-6">
                  {[
                    {
                      key: "stock_alert",
                      label: "Webhook - Alerta de Estoque",
                      placeholder: "https://your-n8n-instance.com/webhook/stock-alert",
                    },
                    {
                      key: "sale",
                      label: "Webhook - Venda Concluída",
                      placeholder: "https://your-n8n-instance.com/webhook/sale-completed",
                    },
                    {
                      key: "daily_summary",
                      label: "Webhook - Resumo Diário",
                      placeholder: "https://your-n8n-instance.com/webhook/daily-summary",
                    },
                  ].map((webhook) => (
                    <div key={webhook.key}>
                      <Label htmlFor={`${webhook.key}_webhook`} className="text-slate-300">
                        {webhook.label}
                      </Label>
                      <div className="flex space-x-2 mt-1">
                        <GlassInput
                          id={`${webhook.key}_webhook`}
                          placeholder={webhook.placeholder}
                          value={webhookSettings[`${webhook.key}_webhook` as keyof typeof webhookSettings]}
                          onChange={(e) =>
                            setWebhookSettings({ ...webhookSettings, [`${webhook.key}_webhook`]: e.target.value })
                          }
                          className="flex-1"
                        />
                        <GlassButton
                          variant="outline"
                          size="sm"
                          onClick={() => testWebhook(webhook.key)}
                          disabled={
                            !validateWebhookUrl(
                              webhookSettings[`${webhook.key}_webhook` as keyof typeof webhookSettings],
                            ) || testingWebhook === webhook.key
                          }
                        >
                          {testingWebhook === webhook.key ? (
                            <Icons.loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <TestTube className="w-4 h-4" />
                          )}
                        </GlassButton>
                      </div>

                      {/* Botões de exemplo */}
                      <div className="flex items-center space-x-2 mt-2">
                        <GlassButton
                          variant="ghost"
                          size="sm"
                          onClick={() => useExampleUrl(webhook.key)}
                          className="text-xs"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Usar Exemplo
                        </GlassButton>
                        <GlassButton
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(exampleUrls[webhook.key as keyof typeof exampleUrls])}
                          className="text-xs"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copiar URL Exemplo
                        </GlassButton>
                      </div>

                      {webhookSettings[`${webhook.key}_webhook` as keyof typeof webhookSettings] &&
                        !validateWebhookUrl(
                          webhookSettings[`${webhook.key}_webhook` as keyof typeof webhookSettings],
                        ) && <p className="text-xs text-red-400 mt-1">URL inválida</p>}
                    </div>
                  ))}

                  <GlassButton onClick={saveWebhookSettings} disabled={saving} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Salvando..." : "Salvar Configurações de Webhook"}
                  </GlassButton>
                </div>
              </GlassCard>

              {/* Status dos Webhooks */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">Status dos Webhooks</h3>
                <div className="space-y-3">
                  {[
                    { key: "stock_alert", label: "Alerta de Estoque", url: webhookSettings.stock_alert_webhook },
                    { key: "sale", label: "Venda Concluída", url: webhookSettings.sale_webhook },
                    { key: "daily_summary", label: "Resumo Diário", url: webhookSettings.daily_summary_webhook },
                  ].map((webhook) => (
                    <GlassCard key={webhook.key} variant="subtle" className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-200">{webhook.label}</p>
                          <p className="text-sm text-slate-400 truncate max-w-md">{webhook.url || "Não configurado"}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {webhook.url && !validateWebhookUrl(webhook.url) && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              URL Inválida
                            </Badge>
                          )}
                          <Badge
                            variant={webhook.url && validateWebhookUrl(webhook.url) ? "default" : "secondary"}
                            className={
                              webhook.url && validateWebhookUrl(webhook.url)
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : "bg-slate-700/60 text-slate-400 border-slate-600/40"
                            }
                          >
                            {webhook.url && validateWebhookUrl(webhook.url) ? "Configurado" : "Pendente"}
                          </Badge>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </GlassCard>

              {/* Dicas para Webhooks */}
              <GlassCard variant="subtle" className="p-4">
                <h4 className="font-medium text-blue-300 mb-2">Dicas para Configuração de Webhooks:</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Use os botões "Usar Exemplo" para testar com endpoints locais</li>
                  <li>• Certifique-se de que as URLs estão acessíveis publicamente</li>
                  <li>• Use HTTPS sempre que possível para maior segurança</li>
                  <li>• Configure o token de autenticação no N8N</li>
                  <li>• Teste os webhooks após configurar para verificar conectividade</li>
                  <li>• URLs devem aceitar requisições POST com JSON</li>
                </ul>
              </GlassCard>
            </div>
          </TabsContent>

          {/* Integrações */}
          <TabsContent value="integrations">
            <GlassCard className="p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-6">Integrações Externas</h2>
              <div className="space-y-6">
                <GlassCard variant="subtle" className="p-4">
                  <h3 className="font-semibold mb-2 text-slate-200">Mercado Pago</h3>
                  <p className="text-sm text-slate-400 mb-3">
                    Configure suas credenciais do Mercado Pago nas variáveis de ambiente do Vercel
                  </p>
                  <div className="space-y-2 text-sm">
                    <p>
                      <code className="bg-slate-800/50 px-2 py-1 rounded border border-slate-700/40 text-slate-300">
                        MERCADOPAGO_ACCESS_TOKEN
                      </code>
                    </p>
                    <p>
                      <code className="bg-slate-800/50 px-2 py-1 rounded border border-slate-700/40 text-slate-300">
                        MERCADOPAGO_PUBLIC_KEY
                      </code>
                    </p>
                  </div>
                </GlassCard>

                <GlassCard variant="subtle" className="p-4">
                  <h3 className="font-semibold mb-2 text-slate-200">Evolution API (WhatsApp)</h3>
                  <p className="text-sm text-slate-400 mb-3">
                    Configure a Evolution API para envio de mensagens WhatsApp
                  </p>
                  <div className="space-y-2 text-sm">
                    <p>
                      <code className="bg-slate-800/50 px-2 py-1 rounded border border-slate-700/40 text-slate-300">
                        EVOLUTION_API_URL
                      </code>
                    </p>
                    <p>
                      <code className="bg-slate-800/50 px-2 py-1 rounded border border-slate-700/40 text-slate-300">
                        EVOLUTION_API_KEY
                      </code>
                    </p>
                  </div>
                </GlassCard>

                <GlassCard variant="subtle" className="p-4 border-green-500/30">
                  <h3 className="font-semibold mb-2 text-slate-200">Supabase</h3>
                  <p className="text-sm text-slate-400 mb-3">Banco de dados e autenticação</p>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Configurado</Badge>
                </GlassCard>
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-md border-slate-700/50">
          <DialogHeader>
            <DialogTitle className="text-slate-200">Meu Perfil</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {user && (
              <GlassCard variant="subtle" className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200">{user.name}</h3>
                    <p className="text-sm text-slate-400">{user.email}</p>
                    <p className="text-xs text-slate-500">
                      Criado em {new Date(user.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              </GlassCard>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="profile_name" className="text-slate-300">
                  Nome
                </Label>
                <GlassInput
                  id="profile_name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="profile_email" className="text-slate-300">
                  Email
                </Label>
                <GlassInput
                  id="profile_email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <GlassButton onClick={updateProfile} disabled={saving} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Salvando..." : "Salvar Perfil"}
              </GlassButton>

              <GlassButton variant="outline" onClick={() => setShowPasswordDialog(true)}>
                <Icons.settings className="w-4 h-4 mr-2" />
                Alterar Senha
              </GlassButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-md border-slate-700/50">
          <DialogHeader>
            <DialogTitle className="text-slate-200">Alterar Senha</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="current_password" className="text-slate-300">
                Senha Atual
              </Label>
              <div className="relative">
                <GlassInput
                  id="current_password"
                  type={showPasswordFields ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordFields(!showPasswordFields)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPasswordFields ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="new_password" className="text-slate-300">
                Nova Senha
              </Label>
              <GlassInput
                id="new_password"
                type={showPasswordFields ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="confirm_password" className="text-slate-300">
                Confirmar Nova Senha
              </Label>
              <GlassInput
                id="confirm_password"
                type={showPasswordFields ? "text" : "password"}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>

            <div className="flex space-x-3">
              <GlassButton onClick={updatePassword} disabled={saving} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Alterando..." : "Alterar Senha"}
              </GlassButton>

              <GlassButton
                variant="outline"
                onClick={() => {
                  setShowPasswordDialog(false)
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
                }}
              >
                Cancelar
              </GlassButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
