import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Truck, Package, TrendingUp, CheckCircle2, XCircle,
  MapPin, Clock, Star, BarChart3, Plus, X, LogOut, Loader2
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { LanguageToggle } from '@/components/LanguageToggle';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Vehicle = Tables<'vehicles'>;
type Booking = Tables<'bookings'>;

type TabId = 'dashboard' | 'vehicles' | 'earnings';

const DriverDashboard = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [incomingBookings, setIncomingBookings] = useState<Booking[]>([]);
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Vehicle form
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vForm, setVForm] = useState({
    vehicle_type: 'truck',
    plate_number: '',
    capacity_m3: '',
    max_weight_kg: '',
    allowed_categories: ['general'] as string[],
  });
  const [savingVehicle, setSavingVehicle] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoadingData(true);

    const [vehiclesRes, incomingRes, activeRes] = await Promise.all([
      supabase.from('vehicles').select('*').eq('driver_id', user.id),
      supabase.from('bookings').select('*').eq('driver_id', user.id).eq('status', 'matched'),
      supabase.from('bookings').select('*').eq('driver_id', user.id).in('status', ['accepted', 'in_transit']),
    ]);

    setVehicles(vehiclesRes.data || []);
    setIncomingBookings(incomingRes.data || []);
    setActiveBookings(activeRes.data || []);
    setLoadingData(false);
  };

  const handleAccept = async (bookingId: string) => {
    setActionLoading(bookingId);
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'accepted' })
      .eq('id', bookingId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Accepted!', description: 'Booking accepted successfully.' });
      fetchData();
    }
    setActionLoading(null);
  };

  const handleDecline = async (bookingId: string) => {
    setActionLoading(bookingId);
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'pending', driver_id: null, vehicle_id: null })
      .eq('id', bookingId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Declined', description: 'Booking returned to pool.' });
      fetchData();
    }
    setActionLoading(null);
  };

  const handleAddVehicle = async () => {
    if (!user) return;
    if (!vForm.plate_number || !vForm.capacity_m3 || !vForm.max_weight_kg) {
      toast({ title: 'Missing fields', description: 'Fill in all vehicle details.', variant: 'destructive' });
      return;
    }
    setSavingVehicle(true);
    const { error } = await supabase.from('vehicles').insert({
      driver_id: user.id,
      vehicle_type: vForm.vehicle_type,
      plate_number: vForm.plate_number,
      capacity_m3: parseFloat(vForm.capacity_m3),
      max_weight_kg: parseFloat(vForm.max_weight_kg),
      allowed_categories: vForm.allowed_categories,
    });

    setSavingVehicle(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Vehicle added!' });
      setShowVehicleForm(false);
      setVForm({ vehicle_type: 'truck', plate_number: '', capacity_m3: '', max_weight_kg: '', allowed_categories: ['general'] });
      fetchData();
    }
  };

  const toggleVehicleActive = async (v: Vehicle) => {
    await supabase.from('vehicles').update({ is_active: !v.is_active }).eq('id', v.id);
    fetchData();
  };

  const totalCapacity = vehicles.reduce((s, v) => s + Number(v.capacity_m3), 0);
  const usedCapacity = activeBookings.reduce((s, b) => s + Number(b.total_volume_m3), 0);
  const usedPercent = totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;

  const categoryOptions = ['general', 'fragile', 'medical', 'restricted'];

  if (authLoading || loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <button onClick={() => { signOut(); navigate('/'); }} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="container max-w-3xl py-6">
        <AnimatePresence mode="wait">
          {/* ===== DASHBOARD TAB ===== */}
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h1 className="mb-6 text-2xl font-bold text-foreground">{t('driver.dashboard')}</h1>

              {/* Capacity gauge */}
              <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-card">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-card-foreground">{t('driver.capacity')}</h2>
                  <span className="text-xs text-muted-foreground">
                    {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {totalCapacity > 0 ? (
                  <>
                    <div className="mb-2 h-4 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(usedPercent, 100)}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full rounded-full gradient-amber"
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {t('driver.used')}: <span className="font-semibold text-foreground">{usedCapacity.toFixed(1)} m³</span>
                      </span>
                      <span className="text-muted-foreground">
                        {t('driver.available')}: <span className="font-semibold text-status-active">{(totalCapacity - usedCapacity).toFixed(1)} m³</span>
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No vehicles registered yet. Add one in the Vehicles tab.</p>
                )}
              </div>

              {/* Incoming requests */}
              <div>
                <h2 className="mb-3 text-sm font-semibold text-foreground">{t('driver.incoming_requests')}</h2>
                {incomingBookings.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    No incoming requests right now.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incomingBookings.map((req) => (
                      <motion.div
                        key={req.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-border bg-card p-4 shadow-card"
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground">
                              {(req.items as any[])?.length || 0} items • {Number(req.total_volume_m3).toFixed(2)} m³ • {Number(req.total_weight_kg).toFixed(0)} kg
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {req.categories?.map((cat) => (
                              <span key={cat} className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mb-3 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 text-status-active" />
                            {req.pickup_address}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 text-destructive" />
                            {req.delivery_address}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-card-foreground">
                            {req.price ? `₹${Number(req.price).toLocaleString()}` : 'Quote pending'}
                          </div>
                          <div className="flex gap-2">
                            <button
                              disabled={actionLoading === req.id}
                              onClick={() => handleDecline(req.id)}
                              className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                            >
                              {t('driver.decline')}
                            </button>
                            <button
                              disabled={actionLoading === req.id}
                              onClick={() => handleAccept(req.id)}
                              className="rounded-lg gradient-amber px-4 py-2 text-xs font-semibold text-primary-foreground shadow-amber transition-transform hover:scale-[1.02] disabled:opacity-50"
                            >
                              {actionLoading === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : t('driver.accept')}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active deliveries */}
              {activeBookings.length > 0 && (
                <div className="mt-6">
                  <h2 className="mb-3 text-sm font-semibold text-foreground">Active Deliveries</h2>
                  <div className="space-y-3">
                    {activeBookings.map((b) => (
                      <div key={b.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground">{b.pickup_address} → {b.delivery_address}</div>
                            <div className="text-sm font-semibold text-card-foreground">
                              {Number(b.total_volume_m3).toFixed(2)} m³ • {Number(b.total_weight_kg).toFixed(0)} kg
                            </div>
                          </div>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            b.status === 'in_transit' ? 'bg-primary/10 text-primary' : 'bg-status-active/10 text-status-active'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ===== VEHICLES TAB ===== */}
          {activeTab === 'vehicles' && (
            <motion.div key="vehicles" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">{t('nav.vehicles')}</h1>
                <button
                  onClick={() => setShowVehicleForm(true)}
                  className="flex items-center gap-1.5 rounded-lg gradient-amber px-4 py-2 text-sm font-semibold text-primary-foreground shadow-amber"
                >
                  <Plus className="h-4 w-4" /> Add Vehicle
                </button>
              </div>

              {/* Add vehicle form */}
              <AnimatePresence>
                {showVehicleForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 overflow-hidden rounded-xl border border-border bg-card p-5 shadow-card"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-card-foreground">New Vehicle</h3>
                      <button onClick={() => setShowVehicleForm(false)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <select
                        value={vForm.vehicle_type}
                        onChange={(e) => setVForm({ ...vForm, vehicle_type: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="truck">Truck</option>
                        <option value="van">Van</option>
                        <option value="pickup">Pickup</option>
                        <option value="tempo">Tempo</option>
                      </select>
                      <input
                        placeholder="Plate Number (e.g. TN 07 AB 1234)"
                        value={vForm.plate_number}
                        onChange={(e) => setVForm({ ...vForm, plate_number: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          placeholder="Capacity (m³)"
                          value={vForm.capacity_m3}
                          onChange={(e) => setVForm({ ...vForm, capacity_m3: e.target.value })}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <input
                          type="number"
                          placeholder="Max Weight (kg)"
                          value={vForm.max_weight_kg}
                          onChange={(e) => setVForm({ ...vForm, max_weight_kg: e.target.value })}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Allowed Categories</label>
                        <div className="flex flex-wrap gap-2">
                          {categoryOptions.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => {
                                const cats = vForm.allowed_categories.includes(cat)
                                  ? vForm.allowed_categories.filter((c) => c !== cat)
                                  : [...vForm.allowed_categories, cat];
                                setVForm({ ...vForm, allowed_categories: cats.length ? cats : ['general'] });
                              }}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                                vForm.allowed_categories.includes(cat)
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={handleAddVehicle}
                        disabled={savingVehicle}
                        className="w-full rounded-lg gradient-amber py-2.5 text-sm font-semibold text-primary-foreground shadow-amber disabled:opacity-50"
                      >
                        {savingVehicle ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Save Vehicle'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Vehicle list */}
              {vehicles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No vehicles yet. Add your first vehicle above.
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicles.map((v) => (
                    <div key={v.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-card-foreground capitalize">{v.vehicle_type}</span>
                            <span className="text-xs text-muted-foreground">• {v.plate_number}</span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {Number(v.capacity_m3)} m³ capacity • {Number(v.max_weight_kg)} kg max
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {v.allowed_categories.map((cat) => (
                              <span key={cat} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{cat}</span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleVehicleActive(v)}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            v.is_active
                              ? 'bg-status-active/10 text-status-active'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {v.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ===== EARNINGS TAB ===== */}
          {activeTab === 'earnings' && (
            <motion.div key="earnings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h1 className="mb-6 text-2xl font-bold text-foreground">{t('nav.earnings')}</h1>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: t('driver.today'), icon: TrendingUp },
                  { label: t('driver.week'), icon: BarChart3 },
                  { label: t('driver.month'), icon: Star },
                ].map(({ label, icon: Icon }) => (
                  <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-card">
                    <Icon className="mb-2 h-5 w-5 text-primary" />
                    <div className="text-lg font-bold text-card-foreground">₹0</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Earnings data will appear here as you complete deliveries.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/80 backdrop-blur-md">
        <div className="flex items-center justify-around py-2">
          {([
            { id: 'dashboard' as TabId, icon: Package, label: t('nav.dashboard') },
            { id: 'vehicles' as TabId, icon: Truck, label: t('nav.vehicles') },
            { id: 'earnings' as TabId, icon: TrendingUp, label: t('nav.earnings') },
          ]).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
                activeTab === id ? 'text-primary font-medium' : 'text-muted-foreground'
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
