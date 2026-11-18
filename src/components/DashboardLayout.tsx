import React, { useState } from 'react';
import { Link, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  CreditCard,
  PlusCircle,
  Wrench,
  Inbox,
  Users,
  ShieldCheck,
  Receipt,
  UserCog,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  Sun,
  Moon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { FixMateLogo } from './FixMateLogo.tsx';
import { SafeImage } from './SafeImage.tsx';
import type { UserRole } from '../shared/types.ts';

interface DashboardLayoutProps {
  allowedRoles: UserRole[];
  title: string;
  children: React.ReactNode;
}

interface NavItem {
  to: string;
  label: string;
  Icon: typeof LayoutDashboard;
  end?: boolean;
}

const ROLE_NAV: Record<UserRole, NavItem[]> = {
  customer: [
    { to: '/dashboard/customer', label: 'Overview', Icon: LayoutDashboard, end: true },
    { to: '/dashboard/customer/bookings', label: 'My Bookings', Icon: ClipboardList },
    { to: '/dashboard/customer/payments', label: 'Payment History', Icon: CreditCard },
    { to: '/dashboard/profile', label: 'Update Profile', Icon: UserCog },
  ],
  technician: [
    { to: '/dashboard/technician', label: 'Overview', Icon: LayoutDashboard, end: true },
    { to: '/dashboard/technician/add-service', label: 'Add Service', Icon: PlusCircle },
    { to: '/dashboard/technician/my-services', label: 'My Services', Icon: Wrench },
    { to: '/dashboard/technician/requests', label: 'Repair Requests', Icon: Inbox },
    { to: '/dashboard/profile', label: 'Update Profile', Icon: UserCog },
  ],
  admin: [
    { to: '/dashboard/admin', label: 'Overview', Icon: LayoutDashboard, end: true },
    { to: '/dashboard/admin/users', label: 'Manage Users', Icon: Users },
    { to: '/dashboard/admin/services', label: 'Service Approval', Icon: ShieldCheck },
    { to: '/dashboard/admin/bookings', label: 'All Bookings', Icon: ClipboardList },
    { to: '/dashboard/admin/transactions', label: 'Transactions', Icon: Receipt },
    { to: '/dashboard/profile', label: 'Update Profile', Icon: UserCog },
  ],
};

export function DashboardLayout({ allowedRoles, title, children }: DashboardLayoutProps) {
  const { user, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] dark:bg-[#0B1120]">
        <div className="w-8 h-8 border-2 border-[#3867FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/sign-in?redirect=${redirect}`} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={`/dashboard/${user.role}`} replace />;
  }

  const navItems = ROLE_NAV[user.role];

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully.');
    navigate('/');
  };

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
      isActive
        ? 'bg-[#3867FF] text-white'
        : 'text-[#68758A] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-[#172033] dark:hover:text-white'
    }`;

  return (
    <div className="min-h-screen flex bg-[#F7F9FC] dark:bg-[#0B1120] text-[#172033] dark:text-[#F8FAFC]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-white dark:bg-[#151E30] border-r border-slate-200 dark:border-slate-800">
        <div className="h-16 px-5 flex items-center border-b border-slate-200 dark:border-slate-800">
          <FixMateLogo />
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              <item.Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <Link
            to="/services"
            className="flex items-center gap-2 text-xs font-semibold text-[#68758A] dark:text-slate-400 hover:text-[#3867FF] dark:hover:text-[#22D3EE]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Marketplace</span>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 max-w-full bg-white dark:bg-[#151E30] h-full flex flex-col border-r border-slate-200 dark:border-slate-800 z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <FixMateLogo />
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
                className="p-2 rounded-lg text-[#68758A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-5 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={linkClass}
                >
                  <item.Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-rose-600 dark:text-rose-400"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-4 sm:px-8 bg-white dark:bg-[#151E30] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open dashboard menu"
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <p className="text-xs text-[#68758A] dark:text-slate-400 capitalize truncate">
                FixMate / {user.role} Workspace
              </p>
              <h1 className="text-base sm:text-lg font-bold text-[#101B35] dark:text-white truncate">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-[#68758A] dark:text-slate-300"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              to="/dashboard/profile"
              className="inline-flex items-center gap-2.5 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {user.image ? (
                <SafeImage
                  src={user.image}
                  alt={user.name}
                  className="w-8 h-8 rounded-md object-cover"
                />
              ) : (
                <span className="w-8 h-8 rounded-md bg-[#101B35] dark:bg-[#3867FF] text-white text-xs font-bold inline-flex items-center justify-center">
                  {initials}
                </span>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-[#172033] dark:text-white leading-tight">
                  {user.name}
                </p>
                <p className="text-[11px] text-[#3867FF] dark:text-[#22D3EE] uppercase font-semibold">
                  {user.role}
                </p>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
