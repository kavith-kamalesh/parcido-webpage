import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, User, Package, Phone } from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';

const RegisterPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'driver' ? 'driver' : 'customer';
  const [role, setRole] = useState<'customer' | 'driver'>(initialRole);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');

  return (
    <div className="flex min-h-screen">
      {/* Left visual */}
      <div className="hidden lg:flex lg:w-1/2 gradient-amber items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-foreground/20">
            <Truck className="h-10 w-10 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold text-primary-foreground">Antigravity</h2>
          <p className="mt-2 text-primary-foreground/70">{t('app.tagline')}</p>
        </motion.div>
      </div>

      {/* Right form */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between p-6">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <Truck className="h-5 w-5" />
            <span className="font-bold">Antigravity</span>
          </Link>
          <LanguageToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm space-y-6"
          >
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('auth.get_started')}</h1>
              <p className="mt-1 text-muted-foreground">{t('auth.register')}</p>
            </div>

            {/* Role selector */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">{t('auth.role_select')}</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRole('customer')}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                    role === 'customer'
                      ? 'border-primary bg-primary-light'
                      : 'border-border bg-card hover:border-muted-foreground/30'
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
                    role === 'driver'
                      ? 'border-primary bg-primary-light'
                      : 'border-border bg-card hover:border-muted-foreground/30'
                  }`}
                >
                  <Package className={`h-6 w-6 ${role === 'driver' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${role === 'driver' ? 'text-primary' : 'text-foreground'}`}>
                    {t('auth.driver_role')}
                  </span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-input bg-card py-3 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t('auth.phone')}</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-input bg-card py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <button className="w-full rounded-xl gradient-amber py-3 font-semibold text-primary-foreground shadow-amber transition-transform hover:scale-[1.01]">
                {t('auth.send_otp')}
              </button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                {t('auth.login')}
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
