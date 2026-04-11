import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Plus, Trash2, ArrowRight, MapPin, Calendar,
  Box, Droplets, Grid3X3, X, Truck as TruckIcon, Star, Loader2, CheckCircle2
} from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type DimensionMode = '3d' | 'area' | 'liquid';
type LengthUnit = 'cm' | 'm' | 'ft';
type WeightUnit = 'kg' | 'lbs';
type Category = 'fragile' | 'medical' | 'general' | 'restricted';

interface BookingItem {
  id: string;
  name: string;
  description: string;
  category: Category;
  dimensionMode: DimensionMode;
  lengthUnit: LengthUnit;
  length: string;
  width: string;
  height: string;
  thickness: string;
  litres: string;
  weightUnit: WeightUnit;
  weight: string;
  stackable: boolean;
  orientationSensitive: boolean;
}

interface MatchedVehicle {
  vehicle_id: string;
  driver_id: string;
  vehicle_type: string;
  plate_number: string;
  capacity_m3: number;
  max_weight_kg: number;
  allowed_categories: string[];
  driver_name: string | null;
  driver_avatar: string | null;
  available_space: number;
}

const createBlankItem = (): BookingItem => ({
  id: crypto.randomUUID(),
  name: '',
  description: '',
  category: 'general',
  dimensionMode: '3d',
  lengthUnit: 'm',
  length: '',
  width: '',
  height: '',
  thickness: '',
  litres: '',
  weightUnit: 'kg',
  weight: '',
  stackable: true,
  orientationSensitive: false,
});

const toMetres = (val: number, unit: LengthUnit) => {
  if (unit === 'cm') return val * 0.01;
  if (unit === 'ft') return val * 0.3048;
  return val;
};

const toKg = (val: number, unit: WeightUnit) => {
  if (unit === 'lbs') return val * 0.453592;
  return val;
};

const calcVolume = (item: BookingItem): number => {
  if (item.dimensionMode === 'liquid') {
    const l = parseFloat(item.litres) || 0;
    return l * 0.001;
  }
  const L = toMetres(parseFloat(item.length) || 0, item.lengthUnit);
  const W = toMetres(parseFloat(item.width) || 0, item.lengthUnit);
  if (item.dimensionMode === 'area') {
    const T = toMetres(parseFloat(item.thickness) || 0, item.lengthUnit);
    return L * W * T;
  }
  const H = toMetres(parseFloat(item.height) || 0, item.lengthUnit);
  return L * W * H;
};

const categoryColors: Record<Category, string> = {
  fragile: 'bg-primary/10 text-primary border-primary/30',
  medical: 'bg-category-medical/10 text-category-medical border-category-medical/30',
  general: 'bg-muted text-muted-foreground border-border',
  restricted: 'bg-destructive/10 text-destructive border-destructive/30',
};

const BookingPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<BookingItem[]>([createBlankItem()]);
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [matchedVehicles, setMatchedVehicles] = useState<MatchedVehicle[]>([]);
  const [booking, setBooking] = useState(false);

  const updateItem = (id: string, updates: Partial<BookingItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...updates } : it)));
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const totalVolume = useMemo(() => items.reduce((sum, it) => sum + calcVolume(it), 0), [items]);
  const totalWeight = useMemo(() => items.reduce((sum, it) => sum + toKg(parseFloat(it.weight) || 0, it.weightUnit), 0), [items]);
  const uniqueCategories = useMemo(() => [...new Set(items.map((it) => it.category))], [items]);

  const handleFindDrivers = async () => {
    if (!pickup || !delivery || !pickupDate) {
      toast({ title: 'Missing details', description: 'Please fill in pickup, delivery address and date.', variant: 'destructive' });
      return;
    }
    if (totalVolume <= 0) {
      toast({ title: 'No items', description: 'Please add item dimensions to calculate volume.', variant: 'destructive' });
      return;
    }

    setSearching(true);
    setShowResults(true);

    const { data, error } = await supabase.rpc('find_matching_vehicles', {
      p_volume: totalVolume,
      p_weight: totalWeight,
      p_categories: uniqueCategories,
    });

    if (error) {
      console.error('Matching error:', error);
      setMatchedVehicles([]);
    } else {
      setMatchedVehicles((data as MatchedVehicle[]) || []);
    }
    setSearching(false);
  };

  const handleSelectDriver = async (vehicle: MatchedVehicle) => {
    if (!user) {
      toast({ title: 'Not logged in', description: 'Please log in to book.', variant: 'destructive' });
      return;
    }
    setBooking(true);

    const { error } = await supabase.from('bookings').insert({
      customer_id: user.id,
      driver_id: vehicle.driver_id,
      vehicle_id: vehicle.vehicle_id,
      pickup_address: pickup,
      delivery_address: delivery,
      pickup_date: pickupDate,
      items: items.map((it) => ({
        name: it.name,
        category: it.category,
        volume_m3: calcVolume(it),
        weight_kg: toKg(parseFloat(it.weight) || 0, it.weightUnit),
        stackable: it.stackable,
        orientationSensitive: it.orientationSensitive,
      })),
      total_volume_m3: totalVolume,
      total_weight_kg: totalWeight,
      categories: uniqueCategories,
      special_instructions: instructions || null,
      status: 'matched',
    });

    setBooking(false);
    if (error) {
      toast({ title: 'Booking failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Booking confirmed!', description: `Your shipment is matched with ${vehicle.driver_name || 'a driver'}.` });
      setShowResults(false);
      setItems([createBlankItem()]);
      setPickup('');
      setDelivery('');
      setPickupDate('');
      setInstructions('');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <Truck className="h-5 w-5" />
            <span className="font-bold">Antigravity</span>
          </Link>
          <LanguageToggle />
        </div>
      </header>

      <div className="container max-w-2xl py-6 pb-32">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-6 text-2xl font-bold text-foreground">{t('booking.title')}</h1>

          {/* Addresses */}
          <div className="mb-6 space-y-3">
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-status-active" />
              <input
                placeholder={t('booking.pickup')}
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="w-full rounded-xl border border-input bg-card py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-destructive" />
              <input
                placeholder={t('booking.delivery')}
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
                className="w-full rounded-xl border border-input bg-card py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full rounded-xl border border-input bg-card py-3 pl-10 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Items */}
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-card-foreground">Item {idx + 1}</h3>
                {items.length > 1 && (
                  <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <input
                  placeholder={t('booking.product_name')}
                  value={item.name}
                  onChange={(e) => updateItem(item.id, { name: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />

                {/* Category */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('booking.category')}</label>
                  <div className="flex flex-wrap gap-2">
                    {(['fragile', 'medical', 'general', 'restricted'] as Category[]).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => updateItem(item.id, { category: cat })}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                          item.category === cat ? categoryColors[cat] : 'border-border bg-background text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {t(`booking.${cat}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dimension mode */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('booking.dimensions')}</label>
                  <div className="flex gap-1 rounded-lg bg-muted p-1">
                    {([
                      { mode: '3d' as const, icon: Box, label: t('booking.mode_3d') },
                      { mode: 'area' as const, icon: Grid3X3, label: t('booking.mode_area') },
                      { mode: 'liquid' as const, icon: Droplets, label: t('booking.mode_liquid') },
                    ]).map(({ mode, icon: Icon, label }) => (
                      <button
                        key={mode}
                        onClick={() => updateItem(item.id, { dimensionMode: mode })}
                        className={`flex flex-1 items-center justify-center gap-1 rounded-md py-2 text-xs font-medium transition-all ${
                          item.dimensionMode === mode
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dimension inputs */}
                {item.dimensionMode !== 'liquid' && (
                  <div className="flex gap-2">
                    <select
                      value={item.lengthUnit}
                      onChange={(e) => updateItem(item.id, { lengthUnit: e.target.value as LengthUnit })}
                      className="rounded-lg border border-input bg-background px-2 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="m">m</option>
                      <option value="cm">cm</option>
                      <option value="ft">ft</option>
                    </select>
                    <input
                      type="number"
                      placeholder={t('booking.length')}
                      value={item.length}
                      onChange={(e) => updateItem(item.id, { length: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <input
                      type="number"
                      placeholder={t('booking.width')}
                      value={item.width}
                      onChange={(e) => updateItem(item.id, { width: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {item.dimensionMode === '3d' && (
                      <input
                        type="number"
                        placeholder={t('booking.height')}
                        value={item.height}
                        onChange={(e) => updateItem(item.id, { height: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    )}
                    {item.dimensionMode === 'area' && (
                      <input
                        type="number"
                        placeholder={t('booking.thickness')}
                        value={item.thickness}
                        onChange={(e) => updateItem(item.id, { thickness: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    )}
                  </div>
                )}

                {item.dimensionMode === 'liquid' && (
                  <input
                    type="number"
                    placeholder={t('booking.litres')}
                    value={item.litres}
                    onChange={(e) => updateItem(item.id, { litres: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                )}

                {/* Volume display */}
                {calcVolume(item) > 0 && (
                  <div className="rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                    {t('booking.space_required')}: {calcVolume(item).toFixed(3)} m³ ({(calcVolume(item) * 35.3147).toFixed(1)} ft³)
                  </div>
                )}

                {/* Weight */}
                <div className="flex gap-2">
                  <select
                    value={item.weightUnit}
                    onChange={(e) => updateItem(item.id, { weightUnit: e.target.value as WeightUnit })}
                    className="rounded-lg border border-input bg-background px-2 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="kg">kg</option>
                    <option value="lbs">lbs</option>
                  </select>
                  <input
                    type="number"
                    placeholder={t('booking.weight')}
                    value={item.weight}
                    onChange={(e) => updateItem(item.id, { weight: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Toggles */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={item.stackable}
                      onChange={(e) => updateItem(item.id, { stackable: e.target.checked })}
                      className="rounded border-input accent-primary"
                    />
                    {t('booking.stackable')}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={item.orientationSensitive}
                      onChange={(e) => updateItem(item.id, { orientationSensitive: e.target.checked })}
                      className="rounded border-input accent-primary"
                    />
                    {t('booking.orientation_sensitive')}
                  </label>
                </div>
              </div>
            </motion.div>
          ))}

          <button
            onClick={() => setItems((prev) => [...prev, createBlankItem()])}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            {t('booking.add_item')}
          </button>

          {/* Special instructions */}
          <textarea
            placeholder={t('booking.instructions')}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={2}
            className="mb-6 w-full rounded-xl border border-input bg-card py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </motion.div>
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/80 backdrop-blur-md z-40">
        <div className="container max-w-2xl flex items-center justify-between py-4">
          <div>
            <div className="text-xs text-muted-foreground">{t('booking.space_required')}</div>
            <div className="text-lg font-bold text-foreground">{totalVolume.toFixed(3)} m³</div>
          </div>
          <button
            onClick={handleFindDrivers}
            disabled={searching}
            className="inline-flex items-center gap-2 rounded-xl gradient-amber px-6 py-3 font-semibold text-primary-foreground shadow-amber transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {searching ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
            {t('booking.find_drivers')}
          </button>
        </div>
      </div>

      {/* Driver results overlay */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowResults(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-border bg-card p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Available Drivers</h2>
                <button onClick={() => setShowResults(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Summary */}
              <div className="mb-4 flex gap-3 text-xs">
                <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                  {totalVolume.toFixed(3)} m³
                </span>
                <span className="rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground">
                  {totalWeight.toFixed(1)} kg
                </span>
                {uniqueCategories.map((cat) => (
                  <span key={cat} className={`rounded-full border px-3 py-1 font-medium ${categoryColors[cat as Category]}`}>
                    {cat}
                  </span>
                ))}
              </div>

              {searching ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                  <p className="text-sm text-muted-foreground">Searching for drivers...</p>
                </div>
              ) : matchedVehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <TruckIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-foreground">No drivers available</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No vehicles currently match your volume, weight, and category requirements.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matchedVehicles.map((v) => (
                    <motion.div
                      key={v.vehicle_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-border bg-background p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          {v.driver_avatar ? (
                            <img src={v.driver_avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                          ) : (
                            <TruckIcon className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground truncate">
                              {v.driver_name || 'Driver'}
                            </h3>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                              4.8
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground capitalize">{v.vehicle_type} · {v.plate_number}</p>
                          <div className="mt-2 flex gap-2 text-xs">
                            <span className="rounded bg-muted px-2 py-0.5">
                              {Number(v.available_space).toFixed(1)} m³ free
                            </span>
                            <span className="rounded bg-muted px-2 py-0.5">
                              {Number(v.max_weight_kg).toFixed(0)} kg max
                            </span>
                          </div>
                          {/* Capacity bar */}
                          <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{
                                width: `${Math.min(100, (totalVolume / Number(v.capacity_m3)) * 100)}%`,
                              }}
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            Your cargo fills {((totalVolume / Number(v.capacity_m3)) * 100).toFixed(0)}% of this vehicle
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelectDriver(v)}
                        disabled={booking}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg gradient-amber py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-50"
                      >
                        {booking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Book this driver
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingPage;
