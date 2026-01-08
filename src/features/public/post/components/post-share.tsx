"use client"

import { useState } from "react"
import { Check, Copy, Facebook, Linkedin, Share2, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Flex } from "@/components/ui/flex"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { TypographySpanSmallMuted } from "@/components/ui/typography"
import { motion, AnimatePresence } from "framer-motion"

interface PostShareProps {
  title: string
  url: string
  variant?: "default" | "compact" | "sticky"
  compact?: boolean // Keep for backward compatibility
}

export const PostShare = ({ title, url, variant = "default", compact: compactProp }: PostShareProps) => {
  const [copied, setCopied] = useState(false)
  const isCompact = variant === "compact" || compactProp
  const isSticky = variant === "sticky"

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Đã sao chép liên kết vào bộ nhớ tạm")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error("Không thể sao chép liên kết")
    }
  }

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], "_blank", "width=600,height=400")
  }

  if (isSticky) {
    return (
      <AnimatePresence mode="wait">
        {/* Desktop Sticky - Side */}
        <motion.div
          key="desktop-sticky-share"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed right-6 top-32 z-50 hidden lg:block"
        >
          <Flex 
            direction="col" 
            align="center" 
            gap={2} 
            className="bg-background/80 backdrop-blur-sm p-1.5 rounded-full border shadow-sm"
          >
            <TooltipProvider delayDuration={0}>
              {[
                { id: "facebook", icon: Facebook, color: "hover:text-blue-600 hover:bg-blue-50", label: "Facebook" },
                { id: "twitter", icon: Twitter, color: "hover:text-sky-500 hover:bg-sky-50", label: "X (Twitter)" },
                { id: "linkedin", icon: Linkedin, color: "hover:text-blue-700 hover:bg-blue-50", label: "LinkedIn" },
              ].map((platform) => (
                <Tooltip key={platform.id}>
                  <TooltipTrigger asChild>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`rounded-full h-8 w-8 transition-colors ${platform.color}`}
                        onClick={() => handleShare(platform.id as keyof typeof shareLinks)}
                      >
                        <platform.icon className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="left">Chia sẻ lên {platform.label}</TooltipContent>
                </Tooltip>
              ))}

              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:bg-orange-50 hover:text-orange-600 h-8 w-8 transition-colors"
                      onClick={handleCopyLink}
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="left">Sao chép liên kết</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Flex>
        </motion.div>

        {/* Mobile Sticky - Bottom Bar */}
        <motion.div 
          key="mobile-sticky-share"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 pb-4 pt-2 bg-gradient-to-t from-background via-background/95 to-transparent"
        >
          <Flex 
            align="center" 
            justify="center" 
            gap={3} 
            className="bg-background border shadow-md rounded-full py-1.5 px-4 max-w-fit mx-auto"
          >
            {[
              { id: "facebook", icon: Facebook, color: "text-blue-600" },
              { id: "twitter", icon: Twitter, color: "text-sky-500" },
              { id: "linkedin", icon: Linkedin, color: "text-blue-700" },
            ].map((platform) => (
              <motion.div key={platform.id} whileTap={{ scale: 0.85 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`rounded-full h-8 w-8 ${platform.color}`}
                  onClick={() => handleShare(platform.id as keyof typeof shareLinks)}
                >
                  <platform.icon className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
            <motion.div whileTap={{ scale: 0.85 }}>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 text-orange-600"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </motion.div>
          </Flex>
        </motion.div>
      </AnimatePresence>
    )
  }

  return (    <Flex 
      direction={isCompact ? "row" : "col"} 
      align={isCompact ? "center" : "start"}
      gap={4} 
      className={`${isCompact ? "py-4 border-b" : "py-6 border-y my-8"}`}
    >
      {!isCompact && (
        <Flex align="center" gap={2}>
          <Share2 className="w-4 h-4 text-muted-foreground" />
          <TypographySpanSmallMuted className="font-medium uppercase tracking-wider">Chia sẻ bài viết</TypographySpanSmallMuted>
        </Flex>
      )}
      
      {isCompact && (
        <Flex align="center" gap={2} className="shrink-0 mr-2">
          <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
          <TypographySpanSmallMuted className="text-[10px] font-bold uppercase tracking-widest">SHARE</TypographySpanSmallMuted>
        </Flex>
      )}
      
      <Flex align="center" gap={isCompact ? 1.5 : 2} wrap>
        <TooltipProvider>
          {/* Facebook */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full hover:bg-blue-50 hover:text-blue-600 border-muted-foreground/20"
                onClick={() => handleShare("facebook")}
              >
                <Facebook className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Chia sẻ lên Facebook</TooltipContent>
          </Tooltip>

          {/* Twitter / X */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full hover:bg-sky-50 hover:text-sky-500 border-muted-foreground/20"
                onClick={() => handleShare("twitter")}
              >
                <Twitter className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Chia sẻ lên X (Twitter)</TooltipContent>
          </Tooltip>

          {/* LinkedIn */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full hover:bg-blue-50 hover:text-blue-700 border-muted-foreground/20"
                onClick={() => handleShare("linkedin")}
              >
                <Linkedin className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Chia sẻ lên LinkedIn</TooltipContent>
          </Tooltip>

          {/* Copy Link */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full hover:bg-orange-50 hover:text-orange-600 border-muted-foreground/20"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sao chép liên kết</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Flex>
    </Flex>
  )
}
