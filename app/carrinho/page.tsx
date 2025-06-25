"use client"

import { useState } from "react"
import { useCart } from "@/hooks/use-cart"
import { GlassCard } from "@/components/ui/glass-card"
import { GlassButton } from "@/components/ui/glass-button"
import { GlassInput } from "@/components/ui/glass-input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Icons } from "@/components/icons"
import { Logo } from "@/components/logo"
import Image from "next/image"
import Link from "next/link"

export default function CarrinhoPage() {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart()
  const [customerInfo, setCustomerInfo] = useState({
    email: "",
    phone: "",
  })
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCheckout = async () => {
    if (items.length === 0) return

    setIsProcessing(true)

    try {
      const validItems = items.filter(
        (item) => item.product && item.product.id && item.product.price > 0 && item.quantity > 0,
      )

      if (validItems.length === 0) {
        throw new Error("Nenhum item válido no carrinho")
      }

      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: validItems,
          customerInfo: {
            email: customerInfo.email.trim() || null,
            phone: customerInfo.phone.trim() || null,
          },
          paymentData: {
            method: "credit_card",
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Erro ${response.status}: ${response.statusText}`)
      }

      if (result.success) {
        alert(`✅ Pagamento aprovado!\n\nPedido: ${result.saleNumber}\nTotal: R$ ${total.toFixed(2)}`)
        clearCart()
        window.location.href = "/"
      } else {
        throw new Error(result.error || "Erro no processamento do pagamento")
      }
    } catch (error) {
      console.error("Payment error:", error)
      let errorMessage = "Erro no pagamento"
      if (error instanceof Error) {
        errorMessage = error.message
      }
      alert(`❌ ${errorMessage}\n\nTente novamente ou entre em contato com o suporte.`)
    } finally {
      setIsProcessing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <header className="border-b border-slate-700/30">
          <GlassCard variant="elevated" className="rounded-none border-x-0 border-t-0">
            <div className="max-w-4xl mx-auto px-6 py-4">
              <div className="flex items-center space-x-4">
                <Link href="/">
                  <GlassButton variant="ghost" size="sm">
                    <Icons.arrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </GlassButton>
                </Link>
                <Logo size="sm" />
                <h1 className="text-2xl font-bold text-slate-200">Carrinho</h1>
              </div>
            </div>
          </GlassCard>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <GlassCard className="p-12 text-center">
            <Icons.cart className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-slate-200">Seu carrinho está vazio</h2>
            <p className="text-slate-400 mb-6">Adicione alguns produtos para continuar</p>
            <Link href="/">
              <GlassButton size="lg">Continuar Comprando</GlassButton>
            </Link>
          </GlassCard>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-700/30">
        <GlassCard variant="elevated" className="rounded-none border-x-0 border-t-0">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <GlassButton variant="ghost" size="sm">
                  <Icons.arrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </GlassButton>
              </Link>
              <Logo size="sm" />
              <h1 className="text-2xl font-bold text-slate-200">Carrinho</h1>
              <span className="text-slate-400">
                ({items.length} {items.length === 1 ? "item" : "itens"})
              </span>
            </div>
          </div>
        </GlassCard>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <GlassCard key={item.id} className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 relative bg-gradient-to-br from-slate-800/30 to-slate-700/20 rounded-lg overflow-hidden">
                    <Image
                      src={item.product.image_url || `/placeholder.svg?height=64&width=64`}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-200">{item.product.name}</h3>
                    <p className="text-sm text-slate-400">{item.product.description}</p>
                    <p className="text-lg font-bold text-blue-400 mt-1">R$ {item.product.price.toFixed(2)}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <GlassButton
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      <Icons.minus className="w-4 h-4" />
                    </GlassButton>

                    <span className="w-12 text-center font-semibold text-slate-200">{item.quantity}</span>

                    <GlassButton
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock_quantity}
                    >
                      <Icons.plus className="w-4 h-4" />
                    </GlassButton>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-slate-200">R$ {item.total.toFixed(2)}</p>
                    <GlassButton
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(item.product.id)}
                      className="text-red-400 hover:text-red-300 mt-1"
                    >
                      <Icons.trash className="w-4 h-4" />
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Checkout */}
          <div className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">Informações do Cliente</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-slate-300">
                    Email (opcional)
                  </Label>
                  <GlassInput
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-slate-300">
                    Telefone (opcional)
                  </Label>
                  <GlassInput
                    id="phone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">Resumo do Pedido</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-slate-300">
                        {item.quantity}x {item.product.name}
                      </span>
                      <span className="text-slate-200">R$ {item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Separator className="bg-slate-600/30" />

                <div className="flex justify-between text-lg font-bold">
                  <span className="text-slate-200">Total</span>
                  <span className="text-blue-400">R$ {total.toFixed(2)}</span>
                </div>

                <GlassButton onClick={handleCheckout} disabled={isProcessing} className="w-full h-12 text-lg" size="lg">
                  {isProcessing ? (
                    <div className="flex items-center">
                      <Icons.loader className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </div>
                  ) : (
                    <>
                      <Icons.check className="w-5 h-5 mr-2" />
                      Finalizar Compra
                    </>
                  )}
                </GlassButton>

                <p className="text-xs text-slate-500 text-center">Pagamento seguro via Mercado Pago</p>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}
