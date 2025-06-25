"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, X, Zap } from "lucide-react"

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (isScanning) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => stopCamera()
  }, [isScanning])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }

      setError(null)
    } catch (err) {
      console.error("Camera access error:", err)
      setError("Não foi possível acessar a câmera")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const handleManualInput = () => {
    const barcode = prompt("Digite o código de barras:")
    if (barcode) {
      onScan(barcode)
    }
  }

  const simulateScan = () => {
    const sampleBarcodes = [
      "7894900011517", // Coca-Cola
      "7891234567890", // Água
      "7891000100103", // Chips
      "7622210951045", // Chocolate
      "1234567890123", // Cabo USB
    ]

    const randomBarcode = sampleBarcodes[Math.floor(Math.random() * sampleBarcodes.length)]
    onScan(randomBarcode)
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-slate-800/90 backdrop-blur-sm border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-200">Scanner de Código de Barras</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {error ? (
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">{error}</p>
            <Button
              onClick={handleManualInput}
              variant="outline"
              className="bg-slate-700 border-slate-600 text-slate-200"
            >
              Digitar Código Manualmente
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {isScanning ? (
              <div className="relative">
                <video ref={videoRef} autoPlay playsInline className="w-full h-48 bg-slate-900 rounded-lg" />
                <div className="absolute inset-0 border-2 border-sky-500 rounded-lg pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-1 bg-sky-500 animate-pulse"></div>
                </div>
              </div>
            ) : (
              <div className="h-48 bg-slate-700/50 rounded-lg flex items-center justify-center">
                <Camera className="w-12 h-12 text-slate-500" />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => setIsScanning(!isScanning)}
                className={`flex-1 ${
                  isScanning
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600"
                } text-white border-0`}
              >
                <Camera className="w-4 h-4 mr-2" />
                {isScanning ? "Parar Scanner" : "Iniciar Scanner"}
              </Button>

              <Button onClick={simulateScan} variant="outline" className="bg-slate-700 border-slate-600 text-slate-200">
                <Zap className="w-4 h-4 mr-2" />
                Simular
              </Button>
            </div>

            <Button
              onClick={handleManualInput}
              variant="outline"
              className="w-full bg-slate-700 border-slate-600 text-slate-200"
            >
              Digitar Código Manualmente
            </Button>

            <p className="text-xs text-slate-400 text-center">Aponte a câmera para o código de barras do produto</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
