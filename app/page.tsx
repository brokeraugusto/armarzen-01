"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Product, Category } from "@/lib/types"
import { useCart } from "@/hooks/use-cart"
import { GlassCard } from "@/components/ui/glass-card"
import { GlassButton } from "@/components/ui/glass-button"
import { GlassInput } from "@/components/ui/glass-input"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/icons"
import { Logo } from "@/components/logo"
import Image from "next/image"
import { BarcodeScanner } from "@/components/barcode-scanner"

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)

  const { items, total, addItem, updateQuantity, getItemCount } = useCart()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: categoriesData } = await supabase.from("categories").select("*").eq("is_active", true).order("name")

      const { data: productsData } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(*)
        `)
        .eq("is_active", true)
        .order("name")

      setCategories(categoriesData || [])
      setProducts(productsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.barcode?.includes(searchTerm)
    return matchesCategory && matchesSearch
  })

  const getCartItemQuantity = (productId: string) => {
    const item = items.find((item) => item.product.id === productId)
    return item?.quantity || 0
  }

  const searchProductByBarcode = async (barcode: string) => {
    const product = products.find((p) => p.barcode === barcode)
    if (product) {
      addItem(product)
      setShowScanner(false)
      alert(`Produto "${product.name}" adicionado ao carrinho!`)
    } else {
      alert("Produto não encontrado!")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <Icons.loader className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-300">Carregando produtos...</p>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-700/30">
        <GlassCard variant="elevated" className="rounded-none border-x-0 border-t-0">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Logo size="md" />

              <div className="flex items-center space-x-4">
                <GlassButton
                  variant="outline"
                  size="lg"
                  onClick={() => (window.location.href = "/carrinho")}
                  className="relative"
                >
                  <Icons.cart className="w-5 h-5 mr-2" />
                  Carrinho
                  {getItemCount() > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-blue-500 text-white border-0 min-w-[1.25rem] h-5 text-xs">
                      {getItemCount()}
                    </Badge>
                  )}
                </GlassButton>

                {total > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Total</p>
                    <p className="text-lg font-bold text-blue-400">R$ {total.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-80 min-h-screen border-r border-slate-700/30">
          <GlassCard variant="subtle" className="h-full rounded-none border-y-0 border-l-0">
            <div className="p-6">
              {/* Search */}
              <div className="mb-6">
                <div className="relative flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Icons.search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <GlassInput
                      placeholder="Buscar produtos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <GlassButton variant="outline" size="icon" onClick={() => setShowScanner(true)}>
                    <Icons.search className="w-4 h-4" />
                  </GlassButton>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Categorias</h3>

                <GlassButton
                  variant={selectedCategory === "all" ? "default" : "ghost"}
                  onClick={() => setSelectedCategory("all")}
                  className="w-full justify-start"
                >
                  <Icons.package className="w-4 h-4 mr-3" />
                  Todos os Produtos
                  <Badge variant="secondary" className="ml-auto bg-slate-700/60 text-slate-300 border-0">
                    {products.length}
                  </Badge>
                </GlassButton>

                {categories.map((category) => {
                  const categoryProducts = products.filter((p) => p.category_id === category.id)
                  return (
                    <GlassButton
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "ghost"}
                      onClick={() => setSelectedCategory(category.id)}
                      className="w-full justify-start"
                    >
                      <span className="mr-3 text-lg">{category.icon || "📦"}</span>
                      {category.name}
                      <Badge variant="secondary" className="ml-auto bg-slate-700/60 text-slate-300 border-0">
                        {categoryProducts.length}
                      </Badge>
                    </GlassButton>
                  )
                })}
              </div>

              {/* Cart Summary */}
              {items.length > 0 && (
                <GlassCard variant="elevated" className="mt-8 p-4">
                  <h4 className="font-semibold text-slate-200 mb-3">Resumo do Carrinho</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-slate-300 truncate">
                          {item.quantity}x {item.product.name}
                        </span>
                        <span className="text-blue-400 font-medium">R$ {item.total.toFixed(2)}</span>
                      </div>
                    ))}
                    {items.length > 3 && <p className="text-xs text-slate-500">+{items.length - 3} itens...</p>}
                  </div>
                  <div className="border-t border-slate-600/30 mt-3 pt-3">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-200">Total</span>
                      <span className="text-blue-400">R$ {total.toFixed(2)}</span>
                    </div>
                  </div>
                </GlassCard>
              )}
            </div>
          </GlassCard>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-200 mb-2">
              {selectedCategory === "all"
                ? "Todos os Produtos"
                : categories.find((c) => c.id === selectedCategory)?.name || "Produtos"}
            </h2>
            <p className="text-slate-400">
              {filteredProducts.length} {filteredProducts.length === 1 ? "produto encontrado" : "produtos encontrados"}
            </p>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredProducts.map((product) => {
              const cartQuantity = getCartItemQuantity(product.id)

              return (
                <GlassCard
                  key={product.id}
                  variant="default"
                  className="overflow-hidden hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="aspect-square relative bg-gradient-to-br from-slate-800/30 to-slate-700/20">
                    <Image
                      src={product.image_url || `/placeholder.svg?height=200&width=200`}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    {product.stock_quantity <= product.min_stock_level && (
                      <Badge className="absolute top-2 right-2 bg-amber-500/80 text-white border-0">
                        Estoque Baixo
                      </Badge>
                    )}
                    {product.stock_quantity === 0 && (
                      <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
                        <Badge variant="destructive" className="bg-red-500/80">
                          Esgotado
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2 text-slate-200">{product.name}</h3>

                    <p className="text-xs text-slate-400 mb-2 line-clamp-1">{product.description}</p>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-blue-400">R$ {product.price.toFixed(2)}</span>
                      <span className="text-xs text-slate-500">Estoque: {product.stock_quantity}</span>
                    </div>

                    {cartQuantity === 0 ? (
                      <GlassButton
                        onClick={() => addItem(product)}
                        className="w-full"
                        disabled={product.stock_quantity === 0}
                      >
                        <Icons.plus className="w-4 h-4 mr-1" />
                        Adicionar
                      </GlassButton>
                    ) : (
                      <div className="flex items-center justify-between">
                        <GlassButton
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(product.id, cartQuantity - 1)}
                        >
                          <Icons.minus className="w-4 h-4" />
                        </GlassButton>

                        <span className="font-semibold px-3 text-slate-200">{cartQuantity}</span>

                        <GlassButton
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(product.id, cartQuantity + 1)}
                          disabled={cartQuantity >= product.stock_quantity}
                        >
                          <Icons.plus className="w-4 h-4" />
                        </GlassButton>
                      </div>
                    )}
                  </div>
                </GlassCard>
              )
            })}
          </div>

          {filteredProducts.length === 0 && (
            <GlassCard className="p-12 text-center">
              <Icons.search className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">
                {searchTerm ? "Nenhum produto encontrado" : "Nenhum produto disponível"}
              </p>
            </GlassCard>
          )}
        </main>
      </div>

      {/* Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <BarcodeScanner onScan={searchProductByBarcode} onClose={() => setShowScanner(false)} />
        </div>
      )}
    </div>
  )
}
