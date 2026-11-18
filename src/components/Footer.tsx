import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { FixMateLogo } from './FixMateLogo.tsx';
import { SERVICE_CATEGORIES } from '../shared/types.ts';

export function Footer() {
  return (
    <footer className="bg-[#101B35] text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand & Tagline */}
          <div className="space-y-4">
            <FixMateLogo inverted />
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Verified smart device and home appliance repair professionals on demand, backed by transparent upfront pricing and Stripe checkout protection.
            </p>
            <div className="flex items-center gap-3 pt-1">
              {/* New X logo */}
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="FixMate on X"
                className="w-9 h-9 rounded-lg border border-slate-700 hover:border-[#22D3EE] text-slate-300 hover:text-white inline-flex items-center justify-center transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="FixMate on LinkedIn"
                className="w-9 h-9 rounded-lg border border-slate-700 hover:border-[#22D3EE] text-slate-300 hover:text-white inline-flex items-center justify-center transition-colors text-xs font-bold"
              >
                in
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="FixMate on GitHub"
                className="w-9 h-9 rounded-lg border border-slate-700 hover:border-[#22D3EE] text-slate-300 hover:text-white inline-flex items-center justify-center transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Quick Navigation</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-slate-400 hover:text-white transition-colors">
                  Browse Services
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-400 hover:text-white transition-colors">
                  How FixMate Works
                </Link>
              </li>
              <li>
                <Link to="/sign-up" className="text-slate-400 hover:text-white transition-colors">
                  Become a Technician
                </Link>
              </li>
              <li>
                <Link to="/sign-in" className="text-slate-400 hover:text-white transition-colors">
                  Customer Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Categories */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Repair Categories</h3>
            <ul className="space-y-2.5 text-sm">
              {SERVICE_CATEGORIES.slice(0, 6).map((cat) => (
                <li key={cat}>
                  <Link
                    to={`/services?category=${encodeURIComponent(cat)}`}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Support & Dispatch</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#22D3EE] mt-0.5 shrink-0" />
                <span>support@fixmate.service</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#22D3EE] mt-0.5 shrink-0" />
                <span className="tabular-nums">+1 (800) 555-0194</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#22D3EE] mt-0.5 shrink-0" />
                <span>548 Market Street, Suite 410, San Francisco, CA</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} FixMate Technologies Inc. All rights reserved.</p>
          <p>Verified Technicians · Transparent Pricing · Stripe Test Mode Enabled</p>
        </div>
      </div>
    </footer>
  );
}
