import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Sun,
  Moon,
  LayoutDashboard,
  UserCog,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { FixMateLogo } from './FixMateLogo.tsx';
import { SafeImage } from './SafeImage.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';

export function Navbar() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const dashboardPath = user ? `/dashboard/${user.role}` : '/sign-in';

  const handleSignOut = async () => {
    setMenuOpen(false);
    setMobileOpen(false);
    await signOut();
    toast.success('Signed out successfully.');
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors duration-150 ${
      isActive
        ? 'text-[#3867FF] border-[#3867FF] dark:text-[#22D3EE] dark:border-[#22D3EE]'
        : 'text-[#68758A] dark:text-slate-300 border-transparent hover:text-[#101B35] dark:hover:text-white'
    }`;

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'FM';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand */}
        <FixMateLogo />

        {/* Zone 2: Center Navigation */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/services" className={navLinkClass}>
            Services
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
          {user && (
            <NavLink to={dashboardPath} className={navLinkClass}>
              Dashboard
            </NavLink>
          )}
        </nav>

        {/* Zone 3: Right Actions */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-[#68758A] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {!user ? (
            <>
              <Link
                to="/sign-in"
                className="px-3.5 py-2 text-sm font-semibold text-[#172033] dark:text-slate-200 hover:text-[#3867FF] dark:hover:text-[#22D3EE] transition-colors whitespace-nowrap shrink-0"
              >
                Sign In
              </Link>
              <Link
                to="/sign-up"
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#3867FF] text-white hover:bg-[#2B54DB] transition-colors whitespace-nowrap shrink-0"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-expanded={menuOpen}
                className="inline-flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151E30] hover:border-[#3867FF]/50 transition-colors"
              >
                {user.image ? (
                  <SafeImage
                    src={user.image}
                    alt={user.name}
                    className="w-7 h-7 rounded-md object-cover"
                  />
                ) : (
                  <span className="w-7 h-7 rounded-md bg-[#101B35] dark:bg-[#3867FF] text-white text-xs font-bold inline-flex items-center justify-center">
                    {initials}
                  </span>
                )}
                <span className="text-sm font-semibold text-[#172033] dark:text-white max-w-[120px] truncate">
                  {user.name}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#3867FF] dark:text-[#22D3EE]">
                  {user.role}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#68758A]" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 shadow-lg py-1.5 z-50">
                  <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-[#172033] dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-[#68758A] dark:text-slate-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    to={dashboardPath}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#172033] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#3867FF]" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/dashboard/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#172033] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                  >
                    <UserCog className="w-4 h-4 text-[#3867FF]" />
                    <span>Update Profile</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-[#68758A] dark:text-slate-300"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-[#172033] dark:text-white"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] px-4 py-4 space-y-3">
          <div className="flex flex-col space-y-2">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-[#172033] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Home
            </Link>
            <Link
              to="/services"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-[#172033] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Services
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-[#172033] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              About
            </Link>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            {!user ? (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 text-center text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-[#172033] dark:text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/sign-up"
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 text-center text-sm font-semibold rounded-lg bg-[#3867FF] text-white"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-2 py-1.5">
                  <span className="w-8 h-8 rounded-md bg-[#101B35] dark:bg-[#3867FF] text-white text-xs font-bold inline-flex items-center justify-center">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#172033] dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-[#68758A] dark:text-slate-400 capitalize">
                      {user.role}
                    </p>
                  </div>
                </div>
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#172033] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Dashboard
                </Link>
                <Link
                  to="/dashboard/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#172033] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Update Profile
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
