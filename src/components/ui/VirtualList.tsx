'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface Props<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  pageSize?: number;
  emptyState?: React.ReactNode;
}

export function VirtualList<T>({ items, renderItem, keyExtractor, className, pageSize = 20, emptyState }: Props<T>) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items, pageSize]);

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + pageSize, items.length));
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.unobserve(el);
  }, [items.length, pageSize]);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  if (!items.length && emptyState) return <>{emptyState}</>;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {visibleItems.map((item, index) => (
        <div key={keyExtractor(item, index)}>
          {renderItem(item, index)}
        </div>
      ))}
      {visibleCount < items.length && (
        <div ref={observerRef} className="h-10 w-full flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}
