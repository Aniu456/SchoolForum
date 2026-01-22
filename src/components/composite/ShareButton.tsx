"use client"

import { Button, ConfirmDialog } from "@/components"
import { Share2 } from "lucide-react"
import React, { useState } from "react"

interface ShareButtonProps {
  url: string
  title: string
  description?: string
  className?: string
}

function ShareButton({ url, title, description, className }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const shareUrl = typeof window !== "undefined" ? window.location.origin + url : url

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("复制失败:", err)
    }
  }

  const handleShare = async (platform: string) => {
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      weibo: `https://service.weibo.com/share/share.php?title=${encodeURIComponent(
        title,
      )}&url=${encodeURIComponent(shareUrl)}`,
    }
    if (urls[platform]) {
      window.open(urls[platform], "_blank", "width=600,height=400")
    } else if (navigator.share) {
      try {
        await navigator.share({ title, text: description || title, url: shareUrl })
      } catch (err) {
        console.error("分享失败:", err)
      }
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 ${className || ""}`}
      >
        <Share2 className="h-5 w-5" />
        分享
      </Button>
      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="分享帖子"
        onConfirm={() => setIsOpen(false)}
        confirmText="关闭"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">链接地址</label>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <Button variant="primary" size="sm" onClick={handleCopy}>
                {copied ? "已复制" : "复制"}
              </Button>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">分享到</label>
            <div className="flex gap-2">
              <Button onClick={() => handleShare("twitter")} className="flex-1 bg-blue-400 hover:bg-blue-500">
                Twitter
              </Button>
              <Button onClick={() => handleShare("facebook")} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Facebook
              </Button>
              <Button onClick={() => handleShare("weibo")} className="flex-1 bg-red-500 hover:bg-red-600">
                微博
              </Button>
            </div>
          </div>
        </div>
      </ConfirmDialog>
    </>
  )
}

export default React.memo(ShareButton)
