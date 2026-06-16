'use client';
import { useUiStore } from '@/stores/uiStore';
import { motion } from 'framer-motion';
import { PlaneTakeoff, ExternalLink } from 'lucide-react';

import { useT, useIsRtl } from '@/lib/i18n';

interface FlightTrackerCardProps {
  airline: string;
  flightNo: string;
  departDate: string;
}

export default function FlightTrackerCard({ airline, flightNo, departDate }: FlightTrackerCardProps) {
  const isRtl = useIsRtl();

  if (!flightNo) return null;

  // Clean flight number (e.g. "KU 546" -> "KU546")
  const cleanFlight = flightNo.replace(/\s+/g, '').toUpperCase();
  
  // Construct tracker URLs
  const flightRadarUrl = `https://www.flightradar24.com/data/flights/${cleanFlight.toLowerCase()}`;
  const googleFlightsUrl = `https://www.google.com/search?q=Flight+${cleanFlight}`;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card-flat p-4 rounded-2xl border border-white/5 bg-gradient-to-tr from-royal-gold/10 via-transparent to-transparent"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-royal-gold/20 flex items-center justify-center text-royal-gold">
            <PlaneTakeoff size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">
              {airline || (isRtl ? 'تتبع الرحلة' : 'Flight Tracker')}
            </h4>
            <div className="text-xs text-zinc-400 font-medium tracking-wider">
              {cleanFlight}
            </div>
          </div>
        </div>
        <div className="text-right">
           <span className="text-[10px] uppercase tracking-wider font-semibold text-royal-gold bg-royal-gold/10 px-2 py-1 rounded">
             {isRtl ? 'تتبع مباشر' : 'Live Track'}
           </span>
        </div>
      </div>
      
      <div className="flex gap-2 mt-4">
        <a 
          href={flightRadarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-black/40 hover:bg-black/60 transition-colors py-2 px-3 rounded-xl flex items-center justify-center gap-2 border border-white/5"
        >
          <span className="text-xs font-semibold text-zinc-300">FlightRadar24</span>
          <ExternalLink size={12} className="text-zinc-500" />
        </a>
        <a 
          href={googleFlightsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-black/40 hover:bg-black/60 transition-colors py-2 px-3 rounded-xl flex items-center justify-center gap-2 border border-white/5"
        >
          <span className="text-xs font-semibold text-zinc-300">Google</span>
          <ExternalLink size={12} className="text-zinc-500" />
        </a>
      </div>
    </motion.div>
  );
}
