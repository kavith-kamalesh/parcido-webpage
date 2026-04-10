import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Truck, Package, TrendingUp, CheckCircle2, XCircle,
  MapPin, Clock, Star, ChevronRight, BarChart3
} from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';

// Mock data
const mockRequests = [
  {
    id: '1',
    customer: 'Ravi Kumar',
    pickup: 'T. Nagar, Chennai',
    delivery: 'Anna Nagar, Chennai',
    volume: 2.4,
    weight: 120,
    category: 'General',
    items: 3,
    price: 2450,
  },
  {
    id: '2',
    customer: 'Priya Sundaram',
    pickup: 'Velachery, Chennai',
    delivery: 'Tambaram, Chennai',
    volume: 0.8,
    weight: 45,
    category: 'Fragile',
    items: 1,
    price: 1200,
  },
];

const DriverDashboard = () => {
  const { t } = useTranslation();

  const totalCapacity = 12;
  const usedCapacity = 7.2;
  const usedPercent = (usedCapacity / totalCapacity) * 100;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <Truck className="h-5 w-5" />
            <span className="font-bold">Antigravity</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-amber text-sm font-bold text-primary-foreground">
              D
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-3xl py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-6 text-2xl font-bold text-foreground">{t('driver.dashboard')}</h1>

          {/* Capacity gauge */}
          <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-card-foreground">{t('driver.capacity')}</h2>
              <span className="text-xs text-muted-foreground">Tata Ace • TN 07 AB 1234</span>
            </div>
            <div className="mb-2 h-4 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${usedPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' as const }}
                className="h-full rounded-full gradient-amber"
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {t('driver.used')}: <span className="font-semibold text-foreground">{usedCapacity} m³</span>
              </span>
              <span className="text-muted-foreground">
                {t('driver.available')}: <span className="font-semibold text-status-active">{(totalCapacity - usedCapacity).toFixed(1)} m³</span>
              </span>
            </div>
          </div>

          {/* Earnings */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            {[
              { label: t('driver.today'), value: '₹4,200', icon: TrendingUp },
              { label: t('driver.week'), value: '₹28,500', icon: BarChart3 },
              { label: t('driver.month'), value: '₹1,12,000', icon: Star },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-card">
                <Icon className="mb-2 h-5 w-5 text-primary" />
                <div className="text-lg font-bold text-card-foreground">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          {/* Incoming requests */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-foreground">{t('driver.incoming_requests')}</h2>
            <div className="space-y-3">
              {mockRequests.map((req) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-card p-4 shadow-card"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-card-foreground">{req.customer}</div>
                      <div className="text-xs text-muted-foreground">{req.items} items • {req.volume} m³ • {req.weight} kg</div>
                    </div>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                      req.category === 'Fragile' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {req.category}
                    </span>
                  </div>

                  <div className="mb-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 text-status-active" />
                      {req.pickup}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 text-destructive" />
                      {req.delivery}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-card-foreground">₹{req.price.toLocaleString()}</div>
                    <div className="flex gap-2">
                      <button className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted">
                        {t('driver.decline')}
                      </button>
                      <button className="rounded-lg gradient-amber px-4 py-2 text-xs font-semibold text-primary-foreground shadow-amber transition-transform hover:scale-[1.02]">
                        {t('driver.accept')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/80 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-around py-2">
          {[
            { icon: Package, label: t('nav.dashboard'), active: true },
            { icon: Truck, label: t('nav.vehicles'), active: false },
            { icon: TrendingUp, label: t('nav.earnings'), active: false },
            { icon: MapPin, label: t('nav.track'), active: false },
          ].map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
                active ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default DriverDashboard;
