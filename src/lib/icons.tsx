'use client';
/** Category/section → Lucide icon maps (single source of truth) */
import {
  Plane, Hotel, UtensilsCrossed, Car, ShoppingBag, Gift, Clapperboard, Siren, Package,
  Shirt, Plug, FileText, Pill, User, LayoutDashboard, Wallet, ListChecks, Phone, StickyNote,
  Store, Building2, Calculator as CalcIcon, ScanLine, PieChart, FileBarChart2, MapPin,
  NotebookPen, Luggage, Users, Settings, Crown, CalendarRange, Search, BellRing, Boxes
} from 'lucide-react';
import type { ReactNode } from 'react';
import { JoyIcon, type JoyColor } from '@/components/ui/JoyIcon';

export const EXPENSE_ICONS: Record<string, ReactNode> = {
  flight: <JoyIcon icon={Plane} color="ocean" size="sm" />,
  hotel: <JoyIcon icon={Hotel} color="amethyst" size="sm" />,
  food: <JoyIcon icon={UtensilsCrossed} color="sunset" size="sm" />,
  transportation: <JoyIcon icon={Car} color="gold" size="sm" />,
  shopping: <JoyIcon icon={ShoppingBag} color="coral" size="sm" />,
  gifts: <JoyIcon icon={Gift} color="peach" size="sm" />,
  entertainment: <JoyIcon icon={Clapperboard} color="emerald" size="sm" />,
  emergency: <JoyIcon icon={Siren} color="coral" size="sm" />,
  other: <JoyIcon icon={Package} color="gold" size="sm" />
};

export const PACKING_ICONS: Record<string, ReactNode> = {
  clothes: <JoyIcon icon={Shirt} color="coral" size="sm" />,
  electronics: <JoyIcon icon={Plug} color="ocean" size="sm" />,
  documents: <JoyIcon icon={FileText} color="emerald" size="sm" />,
  gifts: <JoyIcon icon={Gift} color="peach" size="sm" />,
  personal: <JoyIcon icon={User} color="amethyst" size="sm" />,
  medicines: <JoyIcon icon={Pill} color="sunset" size="sm" />
};

export const SECTION_ICONS: Record<string, ReactNode> = {
  dashboard: <JoyIcon icon={LayoutDashboard} color="gold" size="sm" />,
  trips: <JoyIcon icon={Plane} color="ocean" size="sm" />,
  planner: <JoyIcon icon={CalendarRange} color="ocean" size="sm" />,
  expenses: <JoyIcon icon={Wallet} color="emerald" size="sm" />,
  shopping: <JoyIcon icon={ShoppingBag} color="coral" size="sm" />,
  requests: <JoyIcon icon={Boxes} color="amethyst" size="sm" />,
  gifts: <JoyIcon icon={Gift} color="peach" size="sm" />,
  packing: <JoyIcon icon={Luggage} color="sunset" size="sm" />,
  journal: <JoyIcon icon={NotebookPen} color="amethyst" size="sm" />,
  places: <JoyIcon icon={MapPin} color="coral" size="sm" />,
  documents: <JoyIcon icon={FileText} color="emerald" size="sm" />,
  analytics: <JoyIcon icon={PieChart} color="emerald" size="sm" />,
  reports: <JoyIcon icon={FileBarChart2} color="gold" size="sm" />,
  checklist: <JoyIcon icon={ListChecks} color="coral" size="sm" />,
  contacts: <JoyIcon icon={Phone} color="ocean" size="sm" />,
  notes: <JoyIcon icon={StickyNote} color="peach" size="sm" />,
  restaurants: <JoyIcon icon={Store} color="sunset" size="sm" />,
  malls: <JoyIcon icon={Building2} color="coral" size="sm" />,
  calculator: <JoyIcon icon={CalcIcon} color="ocean" size="sm" />,
  scanner: <JoyIcon icon={ScanLine} color="amethyst" size="sm" />,
  budget: <JoyIcon icon={PieChart} color="emerald" size="sm" />,
  users: <JoyIcon icon={Crown} color="gold" size="sm" />,
  settings: <JoyIcon icon={Settings} color="ocean" size="sm" />,
  search: <JoyIcon icon={Search} color="coral" size="sm" />,
  notifications: <JoyIcon icon={BellRing} color="sunset" size="sm" />,
  family: <JoyIcon icon={Users} color="amethyst" size="sm" />
};
