'use client';
/**
 * Resilient destination image with lazy + progressive loading and a guaranteed
 * local SVG fallback. Never shows a broken image.
 */
import { useEffect, useRef, useState } from 'react';
import { resolveDestinationImage, gradientCover } from '@/lib/destinations';
import { cn } from '@/lib/utils';

interface Props {
  country?: string;
  city?: string;
  seed?: string;       // used for the gradient fallback (e.g. trip name)
  flag?: string;
  className?: string;
  rounded?: string;    // tailwind rounding override
  overlay?: boolean;   // dark gradient overlay for text legibility
  eager?: boolean;     // skip lazy (above-the-fold heroes)
}

export default function DestinationImage({
  country, city, seed = '', flag = '', className, rounded = 'rounded-3xl', overlay = true, eager = false
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(eager);
  const [src, setSrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // lazy: only resolve when scrolled into view
  useEffect(() => {
    if (eager || inView || !ref.current) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { setInView(true); io.disconnect(); }
    }, { rootMargin: '200px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [eager, inView]);

  useEffect(() => {
    if (!inView) return;
    let alive = true;
    void resolveDestinationImage(country, city).then((url) => {
      if (!alive) return;
      if (url) setSrc(url); else setFailed(true);
    });
    return () => { alive = false; };
  }, [inView, country, city]);

  const fallback = gradientCover(seed || city || country || 'trip', flag);
  const showImg = src && !failed;

  return (
    <div ref={ref} className={cn('relative overflow-hidden bg-royal-card', rounded, className)}>
      {/* gradient base — always present, acts as skeleton + fallback */}
      <img src={fallback} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
      {!loaded && inView && !failed && (
        <div className="absolute inset-0 shimmer" />
      )}
      {showImg && (
        <img
          src={src}
          alt={city || country || 'destination'}
          loading={eager ? 'eager' : 'lazy'}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn('absolute inset-0 w-full h-full object-cover transition-opacity duration-700',
            loaded ? 'opacity-100' : 'opacity-0')}
        />
      )}
      {overlay && <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent mix-blend-multiply" />}
      {overlay && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-resort-ocean/10 mix-blend-overlay" />}
    </div>
  );
}
