import { useState, useRef, useCallback, useMemo } from 'react';

interface VirtualizationOptions {
  itemHeight: number;
  overscan?: number;
  containerHeight?: number;
}

interface VirtualizationReturn<T> {
  virtualItems: Array<{
    index: number;
    data: T;
    offsetTop: number;
    height: number;
  }>;
  totalHeight: number;
  containerRef: (node: HTMLElement | null) => void;
  scrollToIndex: (index: number) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
}

export function useVirtualization<T>(
  items: T[],
  options: VirtualizationOptions
): VirtualizationReturn<T> {
  const { itemHeight, overscan = 5, containerHeight = 0 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLElement | null>(null);

  // Calcular itens visíveis
  const virtualItems = useMemo(() => {
    if (!containerHeight) return [];

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const visibleItems = [];
    for (let i = startIndex; i <= endIndex; i++) {
      visibleItems.push({
        index: i,
        data: items[i],
        offsetTop: i * itemHeight,
        height: itemHeight
      });
    }

    return visibleItems;
  }, [items, scrollTop, containerHeight, itemHeight, overscan]);

  // Calcular altura total
  const totalHeight = useMemo(() => items.length * itemHeight, [items.length, itemHeight]);

  // Handler de scroll
  const handleScroll = useCallback((event: Event) => {
    const target = event.target as HTMLElement;
    setScrollTop(target.scrollTop);
  }, []);

  // Ref do container
  const setContainerRef = useCallback((node: HTMLElement | null) => {
    if (containerRef.current) {
      containerRef.current.removeEventListener('scroll', handleScroll);
    }

    containerRef.current = node;

    if (node) {
      node.addEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Scroll para índice específico
  const scrollToIndex = useCallback((index: number) => {
    if (containerRef.current) {
      const offsetTop = index * itemHeight;
      containerRef.current.scrollTop = offsetTop;
    }
  }, [itemHeight]);

  // Scroll para o topo
  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

  // Scroll para o final
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = totalHeight;
    }
  }, [totalHeight]);

  return {
    virtualItems,
    totalHeight,
    containerRef: setContainerRef,
    scrollToIndex,
    scrollToTop,
    scrollToBottom
  };
} 