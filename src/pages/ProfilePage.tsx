import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Phone, Mail, MapPin, Calendar, Car, Star,
  Edit, Save, X, Plus, Trash2, Loader2, ArrowLeft,
  Languages, Award, CheckCircle2
} from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type Booking = Tables<'bookings'>;
type Vehicle = Tables<'vehicles'>;
type SavedAddress = {
  id: string;
  user_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
};

const ProfilePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Extended profile fields
  const [extendedProfile, setExtendedProfile] = useState({
    phone: '',
    experience_years: '',
    languages: [] as string[],
    is_verified: false,
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    display_name: '',
    phone: '',
    experience_years: '',
    languages: [] as string[],
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user) {
      fetchProfileData();
    }
  }, [user, authLoading, navigate]);

  const fetchProfileData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error:', profileError);
      }

      if (profileData) {
        setProfile(profileData);
        setEditForm({
          display_name: profileData.display_name || '',
          phone: extendedProfile.phone,
          experience_years: extendedProfile.experience_years,
          languages: extendedProfile.languages,
        });
      }

      // Fetch extended profile data (we'll need to create this table)
      const { data: extendedData } = await supabase
        .from('profile_details')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (extendedData) {
        setExtendedProfile({
          phone: extendedData.phone || '',
          experience_years: extendedData.experience_years?.toString() || '',
          languages: extendedData.languages || [],
          is_verified: extendedData.is_verified || false,
        });
        setEditForm(prev => ({
          ...prev,
          phone: extendedData.phone || '',
          experience_years: extendedData.experience_years?.toString() || '',
          languages: extendedData.languages || [],
        }));
      }

      // Fetch bookings based on role
      if (profileData?.role === 'customer') {
        const { data: bookingData } = await supabase
          .from('bookings')
          .select('*')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });
        setBookings(bookingData || []);
      } else if (profileData?.role === 'driver') {
        const { data: bookingData } = await supabase
          .from('bookings')
          .select('*')
          .eq('driver_id', user.id)
          .order('created_at', { ascending: false });
        setBookings(bookingData || []);
      }

      // Fetch vehicles for drivers
      if (profileData?.role === 'driver') {
        const { data: vehicleData } = await supabase
          .from('vehicles')
          .select('*')
          .eq('driver_id', user.id);
        setVehicles(vehicleData || []);
      }

      // Fetch saved addresses for customers
      if (profileData?.role === 'customer') {
        const { data: addressData } = await supabase
          .from('saved_addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false });
        setSavedAddresses(addressData || []);
      }

    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Update basic profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: editForm.display_name,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update extended profile
      const { error: extendedError } = await supabase
        .from('profile_details')
        .upsert({
          user_id: user.id,
          phone: editForm.phone,
          experience_years: editForm.experience_years ? parseInt(editForm.experience_years) : null,
          languages: editForm.languages,
          updated_at: new Date().toISOString(),
        });

      if (extendedError) throw extendedError;

      toast({ title: 'Profile updated!', description: 'Your profile has been saved successfully.' });
      setEditing(false);
      fetchProfileData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async (address: string, name: string) => {
    if (!user) return;

    try {
      // In a real app, you'd use Google Places API to get coordinates
      const { error } = await supabase
        .from('saved_addresses')
        .insert({
          user_id: user.id,
          name,
          address,
          latitude: 0, // Placeholder
          longitude: 0, // Placeholder
          is_default: savedAddresses.length === 0,
        });

      if (error) throw error;
      toast({ title: 'Address added!', description: 'New address saved successfully.' });
      fetchProfileData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const { error } = await supabase
        .from('saved_addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;
      toast({ title: 'Address deleted', description: 'Address removed successfully.' });
      fetchProfileData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-amber-600';
      case 'matched': return 'text-blue-600';
      case 'accepted': return 'text-green-600';
      case 'in_transit': return 'text-purple-600';
      case 'completed': return 'text-emerald-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Profile not found</h2>
          <p className="text-muted-foreground mt-2">Please contact support if this persists.</p>
        </div>
      </div>
    );
  }

  const isDriver = profile.role === 'driver';
  const isCustomer = profile.role === 'customer';

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={isDriver ? '/driver' : '/booking'} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-semibold text-foreground">Profile</h1>
          </div>
          <LanguageToggle />
        </div>
      </header>

      <div className="container max-w-2xl py-6 space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-6 shadow-card"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-primary" />
                  )}
                </div>
                {extendedProfile.is_verified && (
                  <CheckCircle2 className="absolute -bottom-1 -right-1 h-6 w-6 text-green-600 bg-background rounded-full" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-card-foreground">
                  {profile.display_name || 'Anonymous User'}
                </h2>
                <p className="text-sm text-muted-foreground capitalize">{profile.role}</p>
                {extendedProfile.is_verified && (
                  <div className="flex items-center gap-1 mt-1">
                    <Award className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Verified</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-card-foreground">{user?.email}</p>
              </div>
            </div>
            {extendedProfile.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium text-card-foreground">{extendedProfile.phone}</p>
                </div>
              </div>
            )}
            {isDriver && extendedProfile.experience_years && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Experience</p>
                  <p className="text-sm font-medium text-card-foreground">{extendedProfile.experience_years} years</p>
                </div>
              </div>
            )}
            {isDriver && extendedProfile.languages.length > 0 && (
              <div className="flex items-center gap-3">
                <Languages className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Languages</p>
                  <p className="text-sm font-medium text-card-foreground">{extendedProfile.languages.join(', ')}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Edit Profile Form */}
        <AnimatePresence>
          {editing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-card-foreground">Edit Profile</h3>
                <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">Display Name</label>
                  <input
                    type="text"
                    value={editForm.display_name}
                    onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter your display name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter your phone number"
                  />
                </div>

                {isDriver && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-card-foreground mb-1">Years of Experience</label>
                      <input
                        type="number"
                        value={editForm.experience_years}
                        onChange={(e) => setEditForm({ ...editForm, experience_years: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Enter years of experience"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-card-foreground mb-2">Languages Spoken</label>
                      <div className="flex flex-wrap gap-2">
                        {['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'].map((lang) => (
                          <button
                            key={lang}
                            onClick={() => {
                              const langs = editForm.languages.includes(lang)
                                ? editForm.languages.filter(l => l !== lang)
                                : [...editForm.languages, lang];
                              setEditForm({ ...editForm, languages: langs });
                            }}
                            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                              editForm.languages.includes(lang)
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-background text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg gradient-amber py-2.5 text-sm font-semibold text-primary-foreground shadow-amber disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex-1 rounded-lg border border-border bg-background py-2.5 text-sm font-medium hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved Addresses (Customer Only) */}
        {isCustomer && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-6 shadow-card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-card-foreground">Saved Addresses</h3>
              <button className="flex items-center gap-2 rounded-lg gradient-amber px-4 py-2 text-sm font-semibold text-primary-foreground shadow-amber">
                <Plus className="h-4 w-4" />
                Add Address
              </button>
            </div>

            <div className="space-y-3">
              {savedAddresses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No saved addresses yet. Add your frequently used addresses for faster booking.
                </p>
              ) : (
                savedAddresses.map((address) => (
                  <div key={address.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{address.name}</p>
                        <p className="text-xs text-muted-foreground">{address.address}</p>
                      </div>
                      {address.is_default && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Default</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteAddress(address.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Linked Vehicles (Driver Only) */}
        {isDriver && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-6 shadow-card"
          >
            <h3 className="text-lg font-semibold text-card-foreground mb-4">Linked Vehicles</h3>

            <div className="space-y-3">
              {vehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No vehicles linked yet. Add vehicles in your dashboard.
                </p>
              ) : (
                vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
                    <Car className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-card-foreground">
                        {vehicle.vehicle_type} - {vehicle.plate_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Capacity: {vehicle.capacity_m3} m³ • Max Weight: {vehicle.max_weight_kg} kg
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      vehicle.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {vehicle.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Booking History */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-6 shadow-card"
        >
          <h3 className="text-lg font-semibold text-card-foreground mb-4">
            {isCustomer ? 'Booking History' : 'Trip History'}
          </h3>

          <div className="space-y-3">
            {bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {isCustomer ? 'No bookings yet.' : 'No trips completed yet.'}
              </p>
            ) : (
              bookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${
                      booking.status === 'completed' ? 'bg-green-500' :
                      booking.status === 'cancelled' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-card-foreground">
                        {booking.pickup_address} → {booking.delivery_address}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-card-foreground capitalize">
                      {booking.status.replace('_', ' ')}
                    </p>
                    {booking.total_volume_m3 && (
                      <p className="text-xs text-muted-foreground">
                        {booking.total_volume_m3} m³
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {bookings.length > 5 && (
            <div className="text-center mt-4">
              <button className="text-sm text-primary hover:underline">
                View all {bookings.length} {isCustomer ? 'bookings' : 'trips'}
              </button>
            </div>
          )}
        </motion.div>

        {/* Earnings Summary (Driver Only) */}
        {isDriver && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-6 shadow-card"
          >
            <h3 className="text-lg font-semibold text-card-foreground mb-4">Earnings Summary</h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">₹0</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">₹0</p>
                <p className="text-sm text-muted-foreground">This Week</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">₹0</p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completed Trips</span>
                <span className="font-medium text-card-foreground">
                  {bookings.filter(b => b.status === 'completed').length}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;