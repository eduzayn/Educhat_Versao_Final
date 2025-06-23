"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, src, ...props }, ref) => {
  // Função para detectar URLs do WhatsApp
  const isWhatsAppUrl = (url: string | undefined): boolean => {
    if (!url || typeof url !== 'string') return false;
    return url.includes('pps.whatsapp.net') || 
           url.includes('mmg.whatsapp.net') ||
           url.includes('media.whatsapp.net');
  };

  // Função para converter para proxy
  const getProxiedUrl = (originalUrl: string): string => {
    const encodedUrl = encodeURIComponent(originalUrl);
    return `/api/proxy/whatsapp-image?url=${encodedUrl}`;
  };

  // CORREÇÃO: Determinar URL final evitando double-encoding
  const finalSrc = (() => {
    if (!src) return src;
    
    // Se já é uma URL de proxy, usar diretamente
    if (src.includes('/api/proxy/whatsapp-image')) {
      return src;
    }
    
    // Se é URL do WhatsApp, converter para proxy
    if (isWhatsAppUrl(src)) {
      return getProxiedUrl(src);
    }
    
    // Outras URLs passam direto
    return src;
  })();

  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn("aspect-square h-full w-full", className)}
      src={finalSrc}
      {...props}
    />
  );
})
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
