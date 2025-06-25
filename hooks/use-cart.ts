"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Product, CartItem } from "@/lib/types"

interface CartStore {
  items: CartItem[]
  total: number
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getItemCount: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,

      addItem: (product: Product, quantity = 1) => {
        // Validar produto
        if (!product || !product.id || !product.price || product.price <= 0) {
          console.error("Produto inválido:", product)
          return
        }

        // Validar quantidade
        if (quantity <= 0 || !Number.isInteger(quantity)) {
          console.error("Quantidade inválida:", quantity)
          return
        }

        const items = get().items
        const existingItem = items.find((item) => item.product.id === product.id)

        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity
          if (newQuantity <= product.stock_quantity) {
            get().updateQuantity(product.id, newQuantity)
          } else {
            console.warn("Quantidade excede estoque disponível")
          }
        } else {
          if (quantity <= product.stock_quantity) {
            const newItem: CartItem = {
              id: product.id,
              product,
              quantity,
              total: Number(product.price) * quantity,
            }

            const newItems = [...items, newItem]
            const newTotal = newItems.reduce((sum, item) => sum + item.total, 0)

            set({ items: newItems, total: newTotal })
          } else {
            console.warn("Quantidade excede estoque disponível")
          }
        }
      },

      removeItem: (productId: string) => {
        const items = get().items.filter((item) => item.product.id !== productId)
        const total = items.reduce((sum, item) => sum + item.total, 0)
        set({ items, total })
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }

        // Validar quantidade
        if (!Number.isInteger(quantity) || quantity < 0) {
          console.error("Quantidade inválida:", quantity)
          return
        }

        const items = get().items.map((item) => {
          if (item.product.id === productId) {
            // Verificar estoque disponível
            if (quantity > item.product.stock_quantity) {
              console.warn("Quantidade excede estoque disponível")
              return item // Manter quantidade atual
            }

            return {
              ...item,
              quantity,
              total: Number(item.product.price) * quantity,
            }
          }
          return item
        })

        const total = items.reduce((sum, item) => sum + item.total, 0)
        set({ items, total })
      },

      clearCart: () => set({ items: [], total: 0 }),

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: "armarzen-cart",
    },
  ),
)
