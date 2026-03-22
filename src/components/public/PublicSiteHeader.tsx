import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Insights', to: '/insights' },
  { label: 'Methodology', to: '/methodology' },
  { label: 'Coverage', to: '/coverage' },
  { label: 'Survey', to: '/survey' },
];

const isActiveRoute = (pathname: string, target: string): boolean => {
  if (target === '/') {
    return pathname === '/';
  }

  return pathname === target || pathname.startsWith(`${target}/`);
};

export const PublicSiteHeader: React.FC = () => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-left">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">BrandEdge</p>
          <p className="text-[11px] text-slate-500">Banking Intelligence Platform</p>
        </Link>
        <nav className="hidden items-center gap-6 text-xs uppercase tracking-widest text-slate-300 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={isActiveRoute(location.pathname, item.to) ? 'text-white' : 'hover:text-white'}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/get-started" className="rounded-2xl bg-cyan-500 px-4 py-3 text-slate-950 hover:bg-cyan-400">Get Started</Link>
          <Link to="/login" className={isActiveRoute(location.pathname, '/login') ? 'text-white' : 'hover:text-white'}>Login</Link>
        </nav>
      </div>
    </header>
  );
};
