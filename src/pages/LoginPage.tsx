import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, Package, User, Phone, Mail, Lock, ArrowRight } from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';

const LoginPage = () => {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);

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
              <h1 className="text-2xl font-bold text-foreground">{t('auth.welcome_back')}</h1>
              <p className="mt-1 text-muted-foreground">{t('auth.login')}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {t('auth.phone')}
                </label>
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

              {otpSent && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    className="w-full rounded-xl border border-input bg-card py-3 px-4 text-foreground tracking-widest text-center text-lg placeholder:text-muted-foreground placeholder:tracking-normal placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </motion.div>
              )}

              <button
                onClick={() => setOtpSent(true)}
                className="w-full rounded-xl gradient-amber py-3 font-semibold text-primary-foreground shadow-amber transition-transform hover:scale-[1.01]"
              >
                {otpSent ? t('auth.verify_otp') : t('auth.send_otp')}
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-3 text-xs text-muted-foreground">or</span>
                </div>
              </div>

              <button className="w-full rounded-xl border border-border bg-card py-3 font-medium text-foreground transition-colors hover:bg-muted">
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t('auth.email')} / {t('auth.password')}
                </div>
              </button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary hover:underline">
                {t('auth.register')}
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
