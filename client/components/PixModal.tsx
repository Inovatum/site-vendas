"use client"

import type React from "react"

import { Input } from "@/components/ui/input"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Copy, Check, QrCode } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PixModalProps {
  isOpen: boolean
  onClose: () => void
  pixCode: string // O código PIX Copia e Cola
  qrCodeBase64?: string // Dados base64 do QR Code
}

export default function PixModal({ isOpen, onClose, pixCode, qrCodeBase64 }: PixModalProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30 * 60) // 30 minutos em segundos
  const [timerExpired, setTimerExpired] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      // Resetar estado quando o modal fechar
      setCopied(false)
      setTimeLeft(30 * 60)
      setTimerExpired(false)
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer)
          setTimerExpired(true)
          toast({
            title: "Tempo Esgotado",
            description: "O tempo para pagamento PIX expirou. Gere um novo código se necessário.",
            variant: "destructive",
          })
          return 0
        }
        return prevTime - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, toast])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const handleCopyPixCode = useCallback(() => {
    navigator.clipboard.writeText(pixCode)
    setCopied(true)
    toast({
      title: "Código PIX Copiado!",
      description: "Cole o código no seu aplicativo de banco para finalizar o pagamento.",
      variant: "default",
    })
    setTimeout(() => setCopied(false), 2000) // Resetar o estado de copiado após 2 segundos
  }, [pixCode, toast])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold">Pague com PIX</DialogTitle>
          <DialogDescription>Escaneie o QR Code ou copie o código para pagar.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 mt-4">
          {qrCodeBase64 ? (
            <img
              src={`data:image/png;base64,${qrCodeBase64}`}
              alt="QR Code PIX"
              className="w-48 h-48 border rounded-lg p-2"
            />
          ) : (
            <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded-lg border border-dashed text-gray-500">
              <QrCode className="w-12 h-12" />
              <span className="sr-only">QR Code Placeholder</span>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-600">Tempo restante para pagamento:</p>
            <p className={`text-3xl font-bold ${timerExpired ? "text-red-500" : "text-primary"}`}>
              {formatTime(timeLeft)}
            </p>
            {timerExpired && (
              <p className="text-sm text-red-500 mt-1">
                Este código PIX expirou. Por favor, feche e reabra para gerar um novo.
              </p>
            )}
          </div>

          <div className="w-full space-y-2">
            <Label htmlFor="pix-code" className="sr-only">
              Código PIX Copia e Cola
            </Label>
            <div className="relative">
              <Input
                id="pix-code"
                value={pixCode}
                readOnly
                className="pr-10 text-center font-mono text-sm bg-gray-50 border-gray-200"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleCopyPixCode}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                disabled={copied || timerExpired}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                <span className="sr-only">{copied ? "Copiado!" : "Copiar código PIX"}</span>
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center">Clique no ícone para copiar o código.</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Para o Label do shadcn/ui
const Label = ({
  htmlFor,
  children,
  className,
}: { htmlFor?: string; children: React.ReactNode; className?: string }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 ${className}`}>
    {children}
  </label>
)
