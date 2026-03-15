"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/utils/helpers"
import { Loader2, ImageIcon } from "lucide-react"

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  containerClassName?: string
  aspectRatio?: "square" | "video" | "auto"
  objectFit?: "cover" | "contain" | "fill"
  onLoad?: () => void
  onError?: () => void
  placeholder?: React.ReactNode
  showLoadingSpinner?: boolean
}

export default function LazyImage({
  src,
  alt,
  className = "",
  containerClassName = "",
  aspectRatio = "auto",
  objectFit = "cover",
  onLoad,
  onError,
  placeholder,
  showLoadingSpinner = true,
}: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 图片加载完成
  const handleLoad = () => {
    setIsLoading(false)
    setImageLoaded(true)
    // 延迟显示以触发淡入动画
    setTimeout(() => setIsVisible(true), 10)
    onLoad?.()
  }

  // 图片加载错误
  const handleError = () => {
    setIsLoading(false)
    setIsError(true)
    onError?.()
  }

  // 预加载图片
  useEffect(() => {
    if (!src) {
      setIsError(true)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setIsError(false)
    setIsVisible(false)
    setImageLoaded(false)

    const img = new Image()
    img.onload = () => {
      if (imgRef.current) {
        imgRef.current.src = src
      }
    }
    img.onerror = handleError
    img.src = src
  }, [src])

  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "",
  }

  const objectFitClasses = {
    cover: "object-cover",
    contain: "object-contain",
    fill: "object-fill",
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gray-100",
        aspectRatioClasses[aspectRatio],
        containerClassName
      )}
    >
      {/* 加载占位符 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 animate-pulse">
          {showLoadingSpinner ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-blue-400" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-medium text-gray-600">图片加载中</span>
                <span className="text-xs text-gray-400">请稍候...</span>
              </div>
            </div>
          ) : (
            <div className="h-full w-full animate-pulse bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200">
              <div className="h-full w-full flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-gray-300" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 错误占位符 */}
      {isError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
          {placeholder || (
            <>
              <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
              <span className="text-xs">图片加载失败</span>
            </>
          )}
        </div>
      )}

      {/* 实际图片 */}
      {!isError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "h-full w-full transition-opacity duration-500",
            objectFitClasses[objectFit],
            imageLoaded && isVisible ? "opacity-100" : "opacity-0",
            className
          )}
          loading="lazy"
        />
      )}
    </div>
  )
}
