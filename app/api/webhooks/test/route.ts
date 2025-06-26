import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { eventType, webhookUrl, token } = await request.json()

    // Validações básicas
    if (!eventType) {
      return NextResponse.json({ success: false, error: "Tipo de evento não especificado" }, { status: 400 })
    }

    if (!webhookUrl) {
      return NextResponse.json({ success: false, error: "URL do webhook não configurada" }, { status: 400 })
    }

    // Validar se é uma URL válida
    let url: URL
    try {
      url = new URL(webhookUrl)
    } catch (e) {
      return NextResponse.json({ success: false, error: "URL do webhook inválida" }, { status: 400 })
    }

    // Verificar se é HTTPS (recomendado para webhooks)
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return NextResponse.json({ success: false, error: "URL deve usar protocolo HTTP ou HTTPS" }, { status: 400 })
    }

    // Modo de teste local - se a URL contém localhost ou é um endpoint de teste
    const isLocalTest = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.pathname.includes("/test")

    // Payload de teste mais detalhado
    const testPayload = {
      event: eventType,
      test: true,
      timestamp: new Date().toISOString(),
      data: {
        message: `Teste de webhook para evento: ${eventType}`,
        source: "Armarzen System",
        environment: "test",
        eventType,
        testId: `test_${Date.now()}`,
        // Dados específicos por tipo de evento
        ...(eventType === "stock_alert" && {
          product: {
            id: "test_product_123",
            name: "Produto Teste",
            current_stock: 5,
            min_stock: 10,
          },
        }),
        ...(eventType === "sale" && {
          sale: {
            id: "test_sale_456",
            total: 150.75,
            items_count: 3,
            payment_method: "credit_card",
          },
        }),
        ...(eventType === "daily_summary" && {
          summary: {
            date: new Date().toISOString().split("T")[0],
            total_sales: 2450.3,
            sales_count: 15,
            top_products: ["Produto A", "Produto B", "Produto C"],
          },
        }),
      },
    }

    // Headers para a requisição
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "Armarzen-Webhook-Test/1.0",
      Accept: "application/json, text/plain, */*",
      "X-Webhook-Test": "true",
    }

    // Adicionar token se fornecido
    if (token && token.trim()) {
      headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`
    }

    console.log(`Testing webhook: ${webhookUrl}`)
    console.log(`Headers:`, headers)
    console.log(`Payload:`, testPayload)

    // Fazer a requisição para o webhook com timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 segundos

    let response: Response
    try {
      response = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(testPayload),
        signal: controller.signal,
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)

      // Tratamento específico para erros de fetch
      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          {
            success: false,
            error: "Timeout: Webhook não respondeu em 15 segundos",
            suggestion: "Verifique se o servidor webhook está online e respondendo rapidamente",
          },
          { status: 408 },
        )
      }

      if (fetchError.code === "ENOTFOUND" || fetchError.message.includes("getaddrinfo")) {
        return NextResponse.json(
          {
            success: false,
            error: "Domínio não encontrado: Não foi possível resolver o DNS da URL",
            suggestion: "Verifique se a URL está correta e o domínio existe",
            url: webhookUrl,
          },
          { status: 404 },
        )
      }

      if (fetchError.code === "ECONNREFUSED") {
        return NextResponse.json(
          {
            success: false,
            error: "Conexão recusada: O servidor não está aceitando conexões",
            suggestion: "Verifique se o servidor webhook está rodando e acessível",
            url: webhookUrl,
          },
          { status: 503 },
        )
      }

      // Erro genérico de conectividade
      return NextResponse.json(
        {
          success: false,
          error: `Erro de conectividade: ${fetchError.message}`,
          suggestion: "Verifique sua conexão de internet e se a URL está acessível",
          details: {
            name: fetchError.name,
            code: fetchError.code,
          },
        },
        { status: 500 },
      )
    }

    clearTimeout(timeoutId)

    console.log(`Webhook response status: ${response.status}`)
    console.log(`Webhook response headers:`, Object.fromEntries(response.headers.entries()))

    // Ler o corpo da resposta
    let responseText = ""
    let responseData = null

    try {
      responseText = await response.text()
      if (responseText) {
        try {
          responseData = JSON.parse(responseText)
        } catch (e) {
          // Resposta não é JSON, manter como texto
          responseData = responseText
        }
      }
    } catch (e) {
      console.error("Error reading response:", e)
    }

    console.log(`Webhook response body:`, responseData || responseText)

    if (!response.ok) {
      // Mensagens de erro mais específicas baseadas no status
      let errorMessage = `Webhook retornou erro ${response.status}`
      let suggestion = ""

      switch (response.status) {
        case 400:
          errorMessage += ": Dados inválidos enviados para o webhook"
          suggestion = "Verifique se o webhook aceita o formato JSON enviado"
          break
        case 401:
          errorMessage += ": Token de autenticação inválido ou ausente"
          suggestion = "Verifique se o token N8N está correto e válido"
          break
        case 403:
          errorMessage += ": Acesso negado ao webhook"
          suggestion = "Verifique as permissões do token ou configurações de segurança"
          break
        case 404:
          errorMessage += ": Webhook não encontrado"
          suggestion =
            "Verifique se a URL está correta e o endpoint existe no N8N. Exemplo: https://seu-n8n.com/webhook/nome-do-workflow"
          break
        case 405:
          errorMessage += ": Método não permitido"
          suggestion = "O webhook deve aceitar requisições POST"
          break
        case 408:
          errorMessage += ": Timeout na requisição"
          suggestion = "O webhook demorou muito para responder"
          break
        case 429:
          errorMessage += ": Muitas requisições"
          suggestion = "Aguarde alguns minutos antes de testar novamente"
          break
        case 500:
          errorMessage += ": Erro interno do servidor webhook"
          suggestion = "Verifique os logs do N8N para mais detalhes"
          break
        case 502:
          errorMessage += ": Bad Gateway"
          suggestion = "O servidor webhook está indisponível ou com problemas de proxy"
          break
        case 503:
          errorMessage += ": Serviço indisponível"
          suggestion = "O servidor webhook está temporariamente indisponível"
          break
        default:
          errorMessage += `: ${response.statusText || "Erro desconhecido"}`
          suggestion = "Verifique a configuração do webhook no N8N"
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          suggestion,
          details: {
            status: response.status,
            statusText: response.statusText,
            url: webhookUrl,
            responseBody: responseData || responseText,
            headers: Object.fromEntries(response.headers.entries()),
          },
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: `Webhook ${eventType} testado com sucesso!`,
      response: {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries()),
      },
    })
  } catch (error) {
    console.error("Webhook test error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor ao testar webhook",
        suggestion: "Tente novamente em alguns instantes",
        details: {
          message: error.message,
          name: error.name,
        },
      },
      { status: 500 },
    )
  }
}
