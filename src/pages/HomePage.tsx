import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Search,
  ArrowRight,
  Smartphone,
  Laptop,
  Wind,
  Refrigerator,
  Tv,
  Disc,
  Zap,
  ShieldCheck,
  DollarSign,
  Lock,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { ServiceCard } from '../components/ServiceCard.tsx';
import { ServiceSkeleton } from '../components/ServiceSkeleton.tsx';
import { SafeImage } from '../components/SafeImage.tsx';
import type { ServiceCategory, ServiceItem } from '../shared/types.ts';

const CATEGORY_CARDS: Array<{
  name: ServiceCategory;
  subtitle: string;
  Icon: typeof Smartphone;
}> = [
  { name: 'Smartphone', subtitle: 'Screens, batteries & micro-soldering', Icon: Smartphone },
  { name: 'Laptop & PC', subtitle: 'Logic boards, thermals & SSD upgrades', Icon: Laptop },
  { name: 'AC', subtitle: 'Gas top-up, coil cleaning & PCB repair', Icon: Wind },
  { name: 'Refrigerator', subtitle: 'Compressors, thermostats & cooling', Icon: Refrigerator },
  { name: 'TV', subtitle: 'OLED panels, backlights & T-Con boards', Icon: Tv },
  { name: 'Washing Machine', subtitle: 'Drum motors, pumps & drain lines', Icon: Disc },
  { name: 'Electrical', subtitle: 'Breakers, wiring & surge diagnostics', Icon: Zap },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Find a Service',
    desc: 'Browse verified repair specialists by device category, service mode, and transparent base rate.',
  },
  {
    step: '02',
    title: 'Send a Request',
    desc: 'Describe the issue, choose a preferred date, and submit your booking directly to the technician.',
  },
  {
    step: '03',
    title: 'Technician Fixes It',
    desc: 'Track live job progress from acceptance through active repair at your doorstep or drop-off center.',
  },
  {
    step: '04',
    title: 'Pay After Completion',
    desc: 'Pay securely through Stripe Checkout only after your device is repaired and verified working.',
  },
];

const WHY_CHOOSE = [
  {
    title: 'Verified Technicians',
    desc: 'Every technician and service listing undergoes administrative review before appearing on the marketplace.',
    Icon: ShieldCheck,
  },
  {
    title: 'Transparent Pricing',
    desc: 'Clear starting prices up front with itemized final billing approved upon job completion.',
    Icon: DollarSign,
  },
  {
    title: 'Secure Payments',
    desc: '256-bit Stripe Checkout processing ensures you never pay until the repair is marked complete.',
    Icon: Lock,
  },
  {
    title: 'Real-Time Job Tracking',
    desc: 'Follow every stage from requested to accepted, in-progress, and completed in your dashboard.',
    Icon: Activity,
  },
];

const TESTIMONIALS = [
  {
    quote:
      'My MacBook Pro stopped charging right before a client pitch. Tariq diagnosed the USB-C power rail the same afternoon, replaced the faulty controller, and I paid via Stripe once it booted cleanly.',
    author: 'Maya Lin',
    role: 'Principal Product Designer, Northstar Studio',
    outcome: 'Logic board restored in 90 minutes',
  },
  {
    quote:
      'Our split AC unit began leaking water and blowing warm air during a heatwave. Booking took two minutes, pricing matched the quote, and the technician cleared the drain line and recharged pressure.',
    author: 'Omar Farooq',
    role: 'Operations Manager, Bayview Coworking',
    outcome: 'Same-day home visit completed',
  },
  {
    quote:
      'Our front-load washer threw a drain pump error with a full load inside. Nadia arrived on time with the OEM pump in stock and tested three spin cycles before finalizing the invoice.',
    author: 'Hannah Brooks',
    role: 'Homeowner, Westside District',
    outcome: 'Zero follow-up issues after 6 months',
  },
];

export function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [featured, setFeatured] = useState<ServiceItem[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    async function loadFeatured() {
      try {
        const res = await fetch('/api/services?limit=6&sort=newest');
        if (!res.ok) return;
        const data = await res.json();
        if (active) setFeatured(data.services || []);
      } finally {
        if (active) setLoadingFeatured(false);
      }
    }
    void loadFeatured();
    return () => {
      active = false;
    };
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`/services?search=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/services');
    }
  };

  return (
    <div className="bg-[#F7F9FC] dark:bg-[#0B1120]">
      {/* Section 1: Hero */}
      <section className="relative overflow-hidden bg-[#101B35] text-white border-b border-slate-800">
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(circle at 80% 20%, rgba(56, 103, 255, 0.45), transparent 45%), radial-gradient(circle at 15% 85%, rgba(34, 211, 238, 0.25), transparent 40%)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="lg:col-span-6 flex flex-col justify-center space-y-6"
            >
              <p className="text-xs font-semibold tracking-wide text-[#22D3EE]">
                On-Demand Smart Device &amp; Appliance Care
              </p>
              <h1
                className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] text-white"
                style={{ textWrap: 'balance' }}
              >
                Broken Device? We&apos;ll Fix It.
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                Book trusted repair professionals and get your devices working again. Transparent upfront estimates, verified specialists, and secure post-repair Stripe payments.
              </p>

              {/* Search Bar + Primary CTA */}
              <form onSubmit={handleHeroSearch} className="flex flex-col sm:flex-row gap-3 pt-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search iPhone screen, AC servicing, laptop..."
                    aria-label="Search repair services"
                    className="w-full h-12 pl-10 pr-4 rounded-lg bg-white text-[#172033] placeholder:text-[#68758A] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#22D3EE]"
                  />
                </div>
                <button
                  type="submit"
                  className="h-12 px-6 rounded-lg bg-[#3867FF] hover:bg-[#2B54DB] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-2"
                >
                  <span>Search Repairs</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <Link
                  to="/services"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#22D3EE] hover:text-white transition-colors"
                >
                  <span>Browse All Services</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#22D3EE]" />
                    <span>Vetted Technicians</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#22D3EE]" />
                    <span>Pay Only After Completion</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#22D3EE]" />
                    <span>180-Day Workmanship Guarantee</span>
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="lg:col-span-6"
            >
              <div className="relative h-full min-h-[280px] sm:min-h-[360px] rounded-xl overflow-hidden border border-slate-700/80 bg-slate-900">
                <SafeImage
                  src="/src/assets/images/hero_repair_bench_1795006392482.jpg"
                  alt="FixMate certified technician inspecting a smartphone motherboard under precision microscope"
                  fallbackLabel="Precision Device Diagnostics"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-[#0B1120]/90 via-[#0B1120]/50 to-transparent">
                  <p className="text-xs font-semibold text-[#22D3EE]">
                    Certified Diagnostics Lab · Same-Day Dispatch
                  </p>
                  <p className="text-sm font-medium text-white mt-0.5">
                    Home visits and drop-off repairs across 7 major device &amp; appliance categories.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 2: Featured Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-[#3867FF] dark:text-[#22D3EE] mb-1.5">
              Verified Listings
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101B35] dark:text-white tracking-tight">
              Featured Repair Services
            </h2>
          </div>
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3867FF] dark:text-[#22D3EE] hover:underline whitespace-nowrap"
          >
            <span>Explore full catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingFeatured ? (
          <ServiceSkeleton count={6} />
        ) : featured.length === 0 ? (
          <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
            <p className="text-sm text-[#68758A] dark:text-slate-400">
              No featured services available right now. Check back soon or browse all categories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((service) => (
              <ServiceCard key={service._id} service={service} />
            ))}
          </div>
        )}
      </section>

      {/* Section 3: Popular Categories */}
      <section className="bg-white dark:bg-[#151E30] border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold text-[#3867FF] dark:text-[#22D3EE] mb-1.5">
              Browse by Specialty
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101B35] dark:text-white tracking-tight">
              Popular Repair Categories
            </h2>
            <p className="text-sm text-[#68758A] dark:text-slate-400 mt-2">
              Select a category to filter available technicians, repair turnaround times, and base rates.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORY_CARDS.map(({ name, subtitle, Icon }) => (
              <Link
                key={name}
                to={`/services?category=${encodeURIComponent(name)}`}
                className="group p-5 rounded-xl bg-[#F7F9FC] dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 hover:border-[#3867FF] dark:hover:border-[#22D3EE] transition-colors flex items-start gap-4"
              >
                <div className="w-11 h-11 rounded-lg bg-[#101B35] dark:bg-[#3867FF]/20 text-white dark:text-[#22D3EE] inline-flex items-center justify-center shrink-0 group-hover:bg-[#3867FF] group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#101B35] dark:text-white group-hover:text-[#3867FF] dark:group-hover:text-[#22D3EE] transition-colors">
                    {name}
                  </h3>
                  <p className="text-xs text-[#68758A] dark:text-slate-400 mt-1 leading-relaxed">
                    {subtitle}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: How FixMate Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-semibold text-[#3867FF] dark:text-[#22D3EE] mb-1.5">
            Streamlined Repair Flow
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101B35] dark:text-white tracking-tight">
            How FixMate Works
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map((item) => (
            <div
              key={item.step}
              className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col"
            >
              <span className="font-mono text-sm font-bold text-[#3867FF] dark:text-[#22D3EE] mb-3">
                {item.step}.
              </span>
              <h3 className="text-base font-bold text-[#101B35] dark:text-white mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-[#68758A] dark:text-slate-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 5: Why Choose FixMate */}
      <section className="bg-white dark:bg-[#151E30] border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-4 space-y-3">
              <p className="text-xs font-semibold text-[#3867FF] dark:text-[#22D3EE]">
                Platform Standards
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101B35] dark:text-white tracking-tight">
                Why Choose FixMate
              </h2>
              <p className="text-sm text-[#68758A] dark:text-slate-400 leading-relaxed">
                Built to eliminate guesswork from device and appliance repair through strict technician approval, real-time job state tracking, and post-completion payments.
              </p>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {WHY_CHOOSE.map(({ title, desc, Icon }) => (
                <div
                  key={title}
                  className="p-6 rounded-xl bg-[#F7F9FC] dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 space-y-2.5"
                >
                  <Icon className="w-5 h-5 text-[#3867FF] dark:text-[#22D3EE]" />
                  <h3 className="text-base font-bold text-[#101B35] dark:text-white">{title}</h3>
                  <p className="text-sm text-[#68758A] dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-semibold text-[#3867FF] dark:text-[#22D3EE] mb-1.5">
            Customer Stories
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101B35] dark:text-white tracking-tight">
            Trusted by Homeowners &amp; Teams
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <blockquote
              key={t.author}
              className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#3867FF] dark:text-[#22D3EE]">
                  {t.outcome}
                </p>
                <p className="text-sm text-[#172033] dark:text-slate-200 leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
              <footer className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-sm font-bold text-[#101B35] dark:text-white">{t.author}</p>
                <p className="text-xs text-[#68758A] dark:text-slate-400">{t.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* Section 7: Final CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-2xl bg-[#101B35] text-white p-8 sm:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border border-slate-800">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to get your device back to peak condition?
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Schedule a certified specialist in minutes and pay only after the repair is completed.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/services"
              className="px-6 py-3 rounded-lg bg-[#3867FF] hover:bg-[#2B54DB] text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              Book a Repair
            </Link>
            <Link
              to="/sign-up"
              className="px-6 py-3 rounded-lg border border-slate-600 hover:border-[#22D3EE] text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              Join as Technician
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
