import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, User, Package } from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { lovable } from '@/integrations/lovable';
import { useAuth, getUserRole, updateUserRole } from '@/hooks/useAuth';

const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'driver' ? 'driver' : 'customer';
  const [role, setRole] = useState<'customer' | 'driver'>(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      // Set the chosen role then redirect
      updateUserRole(user.id, role).then(() => {
        navigate(role === 'driver' ? '/driver' : '/booking');
      });
    }
  }, [user, authLoading, navigate, role]);

  const handleGoogleSignUp = async () => {
    // Store role in localStorage so we can apply it after redirect
    localStorage.setItem('antigravity_pending_role', role);
    setLoading(true);
    setError('');
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin + '/register?role=' + role,
      });
      if (result.error) {
        setError(result.error.message || 'Sign up failed');
      }
      if (result.redirected) return;
    } catch (e) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 gradient-amber items-center justify-center p-12">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-foreground/20">
            <Truck className="h-10 w-10 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold text-primary-foreground">Antigravity</h2>
          <p className="mt-2 text-primary-foreground/70">{t('app.tagline')}</p>
        </motion.div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between p-6">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <Truck className="h-5 w-5" />
            <span className="font-bold">Antigravity</span>
          </Link>
          <LanguageToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('auth.get_started')}</h1>
              <p className="mt-1 text-muted-foreground">{t('auth.register')}</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">{t('auth.role_select')}</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRole('customer')}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                    role === 'customer' ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-muted-foreground/30'
                  }`}
                >
                  <User className={`h-6 w-6 ${role === 'customer' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${role === 'customer' ? 'text-primary' : 'text-foreground'}`}>
                    {t('auth.customer')}
                  </span>
                </button>
                <button
                  onClick={() => setRole('driver')}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                    role === 'driver' ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-muted-foreground/30'
                  }`}
                >
                  <Package className={`h-6 w-6 ${role === 'driver' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${role === 'driver' ? 'text-primary' : 'text-foreground'}`}>
                    {t('auth.driver_role')}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
            )}

            <button
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card py-3.5 font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {loading ? 'Signing up...' : 'Continue with Google'}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">{t('auth.login')}</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
