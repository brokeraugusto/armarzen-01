"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { DashboardMetrics } from "@/lib/types"
import { GlassCard } from "@/components/ui/glass-card"
import { GlassButton } from "@/components/ui/glass-button"
import { Icons } from "@/components/icons"
import { Logo } from "@/components/logo"
import Link from "next/link"

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    todayRevenue: 0,
    todaySales: 0,
    monthRevenue: 0,
    monthProfit: 0,
    lowStockItems: 0,
    pendingPayments: 0,
  })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchMetrics()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/check")
      const result = await response.json()

      if (!result.authenticated) {
        window.location.href = "/login"
        return
      }

      setUser(result.user)
    } catch (error) {
      console.error("Auth check error:", error)
      window.location.href = "/login"
    }
  }

  const fetchMetrics = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]

      const { data: todaySales } = await supabase
        .from("sales")
        .select("total_amount")
        .gte("created_at", today)
        .eq("payment_status", "approved")

      const { data: monthSales } = await supabase
        .from("sales")
        .select("total_amount")
        .gte("created_at", monthStart)
        .eq("payment_status", "approved")

      const { data: lowStockProducts } = await supabase
        .from("products")
        .select("id")
        .filter("stock_quantity", "lte", "min_stock_level")
        .eq("is_active", true)

      const { data: pendingPayments } = await supabase.from("sales").select("id").eq("payment_status", "pending")

      const todayRevenue = todaySales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0
      const monthRevenue = monthSales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0

      setMetrics({
        todayRevenue,
        todaySales: todaySales?.length || 0,
        monthRevenue,
        monthProfit: monthRevenue * 0.3,
        lowStockItems: lowStockProducts?.length || 0,
        pendingPayments: pendingPayments?.length || 0,
      })
    } catch (error) {
      console.error("Error fetching metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        window.location.href = "/login"
      } else {
        throw new Error("Erro no logout")
      }
    } catch (error) {
      console.error("Logout error:", error)
      window.location.href = "/login"
    } finally {
      setLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <Icons.loader className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-300">Carregando dashboard...</p>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-700/30">
        <GlassCard variant="elevated" className="rounded-none border-x-0 border-t-0">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Logo size="md" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-200">Painel Administrativo</h2>
                  <p className="text-sm text-slate-400">Bem-vindo, {user?.name || user?.email || "Admin"}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Link href="/">
                  <GlassButton variant="outline">
                    <Icons.home className="w-4 h-4 mr-2" />
                    Ver Loja
                  </GlassButton>
                </Link>
                <Link href="/admin/configuracoes">
                  <GlassButton variant="outline">
                    <Icons.settings className="w-4 h-4 mr-2" />
                    Configurações
                  </GlassButton>
                </Link>
                <GlassButton variant="destructive" onClick={handleLogout} disabled={loggingOut}>
                  {loggingOut ? (
                    <Icons.loader className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Icons.logout className="w-4 h-4 mr-2" />
                  )}
                  Sair
                </GlassButton>
              </div>
            </div>
          </div>
        </GlassCard>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Vendas Hoje</p>
                <p className="text-xl font-bold text-green-400">R$ {metrics.todayRevenue.toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <span className="text-green-400 text-lg">💰</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Pedidos Hoje</p>
                <p className="text-xl font-bold text-blue-400">{metrics.todaySales}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Icons.cart className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Receita Mensal</p>
                <p className="text-xl font-bold text-green-400">R$ {metrics.monthRevenue.toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Icons.chart className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Lucro Mensal</p>
                <p className="text-xl font-bold text-green-400">R$ {metrics.monthProfit.toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <span className="text-green-400 text-lg">📈</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Estoque Baixo</p>
                <p className="text-xl font-bold text-amber-400">{metrics.lowStockItems}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <span className="text-amber-400 text-lg">⚠️</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Pendentes</p>
                <p className="text-xl font-bold text-red-400">{metrics.pendingPayments}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Icons.user className="w-5 h-5 text-red-400" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/admin/categorias">
            <GlassCard className="p-6 text-center hover:scale-[1.02] transition-all duration-300 cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-400 text-2xl">🎨</span>
              </div>
              <h3 className="font-semibold mb-2 text-slate-200">Categorias</h3>
              <p className="text-sm text-slate-400">Organizar produtos</p>
            </GlassCard>
          </Link>

          <Link href="/admin/produtos">
            <GlassCard className="p-6 text-center hover:scale-[1.02] transition-all duration-300 cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Icons.package className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2 text-slate-200">Produtos</h3>
              <p className="text-sm text-slate-400">Gerenciar catálogo</p>
            </GlassCard>
          </Link>

          <Link href="/admin/vendas">
            <GlassCard className="p-6 text-center hover:scale-[1.02] transition-all duration-300 cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Icons.cart className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="font-semibold mb-2 text-slate-200">Vendas</h3>
              <p className="text-sm text-slate-400">Histórico de vendas</p>
            </GlassCard>
          </Link>

          <Link href="/admin/estoque">
            <GlassCard className="p-6 text-center hover:scale-[1.02] transition-all duration-300 cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-amber-400 text-2xl">📦</span>
              </div>
              <h3 className="font-semibold mb-2 text-slate-200">Estoque</h3>
              <p className="text-sm text-slate-400">Controle de estoque</p>
            </GlassCard>
          </Link>
        </div>
      </div>
    </div>
  )
}
