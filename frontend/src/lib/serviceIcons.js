import {
  Globe, Code, Zap, Lock, Shield, ShieldCheck, Cpu, Server, Database, Cloud,
  Gauge, Wrench, Settings, Package, Boxes, Star, CreditCard, Gift, Rocket,
  BarChart3, TrendingUp, Users, Search, LifeBuoy, Bot, Brain, Layers, Plug,
  FileCode, Store, Monitor, Bell, Compass, Target, Award, Repeat
} from 'lucide-react';

const ICONS = {
  globe: Globe,
  store: Store,
  code: Code,
  filecode: FileCode,
  plug: Plug,
  zap: Zap,
  rocket: Rocket,
  lock: Lock,
  shield: Shield,
  shieldcheck: ShieldCheck,
  cpu: Cpu,
  bot: Bot,
  brain: Brain,
  server: Server,
  database: Database,
  cloud: Cloud,
  gauge: Gauge,
  wrench: Wrench,
  settings: Settings,
  layers: Layers,
  package: Package,
  boxes: Boxes,
  monitor: Monitor,
  gift: Gift,
  star: Star,
  creditcard: CreditCard,
  trendingup: TrendingUp,
  barChart3: BarChart3,
  barchart3: BarChart3,
  users: Users,
  lifeBuoy: LifeBuoy,
  lifebuoy: LifeBuoy,
  bell: Bell,
  compass: Compass,
  target: Target,
  award: Award,
  repeat: Repeat,
  search: Search
};

// Accepts "Globe", "globe", "shopping-cart", "shopping_cart" or a component
// reference, since the admin editor stores a free-text lucide name.
function normalize(value) {
  return String(value).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

export function resolveServiceIcon(icon, fallback = Globe) {
  if (!icon) return fallback;
  if (typeof icon === 'function' || typeof icon === 'object') return icon;
  return ICONS[normalize(icon)] || fallback;
}