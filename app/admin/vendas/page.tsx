"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Sale, SaleItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Eye, Search, Download } from "lucide-react"
import Link from "next/link"

interface SaleWithItems extends Sale {
  sale_items: (SaleItem & {
    product: {
      name: string
      image_url?: string
    }
  })[]
}

export default function VendasAdmin() {
  const [sales, setSales] = useState<SaleWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSale, setSelectedSale] = useState<SaleWithItems | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          sale_items(
            *,
            product:products(name, image_url)
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      setSales(data || [])
    } catch (error) {
      console.error("Error fetching sales:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = sales.filter(
    (sale) =>
      sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer_phone?.includes(searchTerm),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Aprovado
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pendente
          </Badge>
        )
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "credit_card":
        return "Cartão de Crédito"
      case "debit_card":
        return "Cartão de Débito"
      case "pix":
        return "PIX"
      case "cash":
        return "Dinheiro"
      default:
        return method
    }
  }

  const viewSaleDetails = (sale: SaleWithItems) => {
    setSelectedSale(sale)
    setShowDetails(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando vendas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Histórico de Vendas</h1>
            </div>

            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filtros */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar por número, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabela de Vendas */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas ({filteredSales.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.sale_number}</TableCell>
                    <TableCell>{new Date(sale.created_at).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>
                      <div>
                        {sale.customer_email && <p className="text-sm">{sale.customer_email}</p>}
                        {sale.customer_phone && <p className="text-sm text-gray-600">{sale.customer_phone}</p>}
                        {!sale.customer_email && !sale.customer_phone && (
                          <span className="text-gray-400">Cliente não informado</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-green-600">R$ {sale.total_amount.toFixed(2)}</TableCell>
                    <TableCell>{getPaymentMethodLabel(sale.payment_method)}</TableCell>
                    <TableCell>{getStatusBadge(sale.payment_status)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => viewSaleDetails(sale)}>
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredSales.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">{searchTerm ? "Nenhuma venda encontrada" : "Nenhuma venda registrada"}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalhes da Venda */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Venda - {selectedSale?.sale_number}</DialogTitle>
            </DialogHeader>

            {selectedSale && (
              <div className="space-y-6">
                {/* Informações da Venda */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Informações Gerais</h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>Número:</strong> {selectedSale.sale_number}
                      </p>
                      <p>
                        <strong>Data:</strong> {new Date(selectedSale.created_at).toLocaleString("pt-BR")}
                      </p>
                      <p>
                        <strong>Status:</strong> {getStatusBadge(selectedSale.payment_status)}
                      </p>
                      <p>
                        <strong>Pagamento:</strong> {getPaymentMethodLabel(selectedSale.payment_method)}
                      </p>
                      {selectedSale.mercadopago_payment_id && (
                        <p>
                          <strong>ID Mercado Pago:</strong> {selectedSale.mercadopago_payment_id}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Cliente</h4>
                    <div className="space-y-1 text-sm">
                      {selectedSale.customer_email ? (
                        <p>
                          <strong>Email:</strong> {selectedSale.customer_email}
                        </p>
                      ) : (
                        <p className="text-gray-500">Email não informado</p>
                      )}
                      {selectedSale.customer_phone ? (
                        <p>
                          <strong>Telefone:</strong> {selectedSale.customer_phone}
                        </p>
                      ) : (
                        <p className="text-gray-500">Telefone não informado</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Itens da Venda */}
                <div>
                  <h4 className="font-semibold mb-3">Itens da Venda</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Preço Unit.</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSale.sale_items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>R$ {item.unit_price.toFixed(2)}</TableCell>
                          <TableCell className="font-medium">R$ {item.total_price.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total da Venda:</span>
                    <span className="text-2xl font-bold text-green-600">R$ {selectedSale.total_amount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Observações */}
                {selectedSale.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Observações</h4>
                    <p className="text-sm bg-gray-50 p-3 rounded">{selectedSale.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
