'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon, ChevronRight } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Badge, Card, EmptyState, Input, Spinner, ListSkeleton } from '@/components/ui/Primitives';
import { SECTION_ICONS } from '@/lib/icons';

interface Result { entity: string; trip_id: string; id: string; title: string; snippet: string }
const ROUTE: Record<string, string> = { trip: '/trip/', shopping: '/trip/shopping/', request: '/trip/requests/', expense: '/trip/expenses/', note: '/trip/notes/' };
const ICON: Record<string, string> = { trip: 'trips', shopping: 'shopping', request: 'requests', expense: 'expenses', note: 'notes' };

export default function SearchPage() {
  const t = useT();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.length < 2) { setResults([]); return; }
    const id = setTimeout(async () => {
      setLoading(true);
      const res = await api<Result[]>('search.global', { q });
      if (res.ok && Array.isArray(res.data)) setResults(res.data);
      setLoading(false);
    }, 400);
    return () => clearTimeout(id);
  }, [q]);

  return (
    <AppShell>
      <div className="pt-1">
        <div className="flex items-center gap-3 mb-4 rise">
          <span className="icon-tile"><SearchIcon size={20} /></span>
          <h1 className="font-display text-[22px] gold-text">{t('search')}</h1>
        </div>
        <div className="mb-4 rise rise-1">
          <Input value={q} onChange={setQ} placeholder={t('search') + '…'} icon={<SearchIcon size={16} />} />
        </div>
        {loading ? <ListSkeleton /> : q.length >= 2 && results.length === 0 ? <EmptyState imageSrc="/illustrations/empty-search.svg" /> : (
          <div className="space-y-2.5">
            {results.map((r) => (
              <Card key={r.entity + r.id} flat onClick={() => router.push(ROUTE[r.entity] || '/trip/')} className="!p-3.5">
                <div className="flex items-center gap-3">
                  {SECTION_ICONS[ICON[r.entity]] || SECTION_ICONS.notes}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-foreground truncate">{r.title}</p>
                    {r.snippet && <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{r.snippet}</p>}
                  </div>
                  <Badge color="muted">{r.entity}</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
