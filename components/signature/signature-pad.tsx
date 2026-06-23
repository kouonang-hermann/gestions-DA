"use client"

import { useRef, forwardRef, useImperativeHandle, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type SignatureCanvasType from 'react-signature-canvas'
import { Button } from '@/components/ui/button'

const SignatureCanvas = dynamic(() => import('react-signature-canvas'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center" style={{ height: 200, background: '#fff' }}>
      <span className="text-gray-400 text-sm">Chargement...</span>
    </div>
  ),
}) as any

export interface SignaturePadRef {
  clear: () => void
  isEmpty: () => boolean
  toDataURL: () => string
}

interface SignaturePadProps {
  onSave?: (signature: string) => void
  width?: number
  height?: number
}

export const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  ({ onSave, width: propWidth, height = 200 }, ref) => {
    const sigPad = useRef<SignatureCanvasType>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const hasMeasuredRef = useRef(false)

    const [canvasWidth, setCanvasWidth] = useState(() => {
      return propWidth ? Math.min(propWidth, 320) : 320
    })

    useEffect(() => {
      hasMeasuredRef.current = false
      setCanvasWidth(propWidth ? Math.min(propWidth, 320) : 320)

      if (!wrapperRef.current) return

      const resizeObserver = new ResizeObserver(() => {
        if (!hasMeasuredRef.current && wrapperRef.current) {
          const rect = wrapperRef.current.getBoundingClientRect()
          if (rect.width > 0) {
            const targetWidth = propWidth ? Math.min(rect.width, propWidth) : rect.width
            setCanvasWidth(Math.floor(targetWidth))
            hasMeasuredRef.current = true
            resizeObserver.disconnect()
          }
        }
      })

      resizeObserver.observe(wrapperRef.current)
      return () => resizeObserver.disconnect()
    }, [propWidth])

    useImperativeHandle(ref, () => ({
      clear: () => {
        sigPad.current?.clear()
      },
      isEmpty: () => {
        return sigPad.current?.isEmpty() ?? true
      },
      toDataURL: () => {
        return sigPad.current?.toDataURL('image/png') ?? ''
      }
    }))

    const handleClear = () => {
      sigPad.current?.clear()
    }

    const handleSave = () => {
      if (sigPad.current && !sigPad.current.isEmpty()) {
        const dataURL = sigPad.current.toDataURL('image/png')
        onSave?.(dataURL)
      }
    }

    return (
      <div className="space-y-4">
        <div
          ref={wrapperRef}
          className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white mx-auto"
          style={{ width: '100%', maxWidth: propWidth ? `${propWidth}px` : undefined }}
        >
          <SignatureCanvas
            ref={sigPad}
            canvasProps={{
              width: canvasWidth,
              height: height,
              className: 'w-full cursor-crosshair touch-none',
              style: { height: `${height}px`, touchAction: 'none' }
            }}
            backgroundColor="rgb(255, 255, 255)"
            penColor="rgb(0, 0, 0)"
            minWidth={1}
            maxWidth={3}
            throttle={16}
            velocityFilterWeight={0.7}
            clearOnResize={false}
          />
        </div>
        
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Effacer
          </Button>
          
          {onSave && (
            <Button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Sauvegarder Signature
            </Button>
          )}
        </div>
        
        <p className="text-sm text-gray-500 text-center">
          Dessinez votre signature dans le cadre ci-dessus
        </p>
      </div>
    )
  }
)

SignaturePad.displayName = 'SignaturePad'
