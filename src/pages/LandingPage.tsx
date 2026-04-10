import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Truck, MapPin, Box, Users, ShieldCheck, CreditCard,
  ArrowRight, Package
} from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';
import heroImage from '@/assets/hero-logistics.jpg';

const featureIcons = [Box, MapPin, Package, Users, ShieldCheck, CreditCard];

const featureKeys = [
  'smart_matching', 'live_tracking', 'load_optimizer',
  'shared_transport', 'verified_drivers', 'secure_payments'
] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const }
  }),
};

const LandingPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-amber">
              <Truck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">Antigravity</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {t('auth.login')}
            </Link>
            <Link
              to="/register"
              className="rounded-lg gradient-amber px-4 py-2 text-sm font-semibold text-primary-foreground shadow-amber transition-transform hover:scale-[1.02]"
            >
              {t('auth.register')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16">
        <div className="gradient-hero">
          <div className="container grid min-h-[85vh] items-center gap-12 py-20 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-light px-4 py-1.5 text-sm font-medium text-primary">
                <Package className="h-4 w-4" />
                {t('app.tagline')}
              </div>
              <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {t('hero.title')}
              </h1>
              <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
                {t('hero.subtitle')}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl gradient-amber px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-amber transition-transform hover:scale-[1.02]"
                >
                  {t('hero.cta_customer')}
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/register?role=driver"
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-foreground bg-foreground px-6 py-3.5 text-base font-semibold text-background transition-colors hover:bg-foreground/90"
                >
                  {t('hero.cta_driver')}
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-6">
                {[
                  { value: '5K+', label: 'Deliveries' },
                  { value: '500+', label: 'Drivers' },
                  { value: '4.8', label: 'Rating' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="overflow-hidden rounded-2xl shadow-elevated">
                <img
                  src={heroImage}
                  alt="Logistics hub at golden hour"
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              </div>
              {/* Floating card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute -bottom-6 -left-6 rounded-xl bg-card p-4 shadow-elevated"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-active/10">
                    <MapPin className="h-5 w-5 text-status-active" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-card-foreground">Live Tracking</div>
                    <div className="text-xs text-muted-foreground">Real-time GPS updates</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need to move goods
            </h2>
            <p className="mt-3 text-muted-foreground">
              A complete logistics platform built for reliability and speed
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featureKeys.map((key, i) => {
              const Icon = featureIcons[i];
              return (
                <motion.div
                  key={key}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="group rounded-xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-elevated"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-card-foreground">
                    {t(`features.${key}`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(`features.${key}_desc`)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="overflow-hidden rounded-2xl gradient-amber p-12 text-center">
            <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl">
              Ready to move?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-primary-foreground/80">
              Join thousands of customers and drivers on the Antigravity platform
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-primary-foreground px-6 py-3.5 font-semibold text-primary transition-transform hover:scale-[1.02]"
              >
                Get Started <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="h-4 w-4" />
            <span>© 2026 Antigravity. All rights reserved.</span>
          </div>
          <LanguageToggle />
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
