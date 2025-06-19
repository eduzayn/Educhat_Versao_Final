import { useEffect, useRef, useCallback, useState } from 'react';

interface IntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
}

interface UseIntersectionObserverReturn {
  ref: (node: Element | null) => void;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
}

export function useIntersectionObserver(
  callback?: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback((node: Element | null) => {
    elementRef.current = node;
    
    // Desconectar observer anterior
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Criar novo observer se o elemento existir
    if (node) {
      observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          setIsIntersecting(entry.isIntersecting);
          setEntry(entry);
          
          if (callback) {
            callback(entries);
          }
        });
      }, options);

      observerRef.current.observe(node);
    }
  }, [callback, options]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    ref,
    isIntersecting,
    entry
  };
} 