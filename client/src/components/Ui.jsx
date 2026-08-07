import React from 'react';
import { Search, Inbox } from 'lucide-react';

export function Spinner({ className = 'h-6 w-6' }) {
  return (
    <div className={`${className} animate-spin rounded-full border-2 border-brand-200 border-t-brand-600`} />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex h-full min-h-[50vh] items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center text-slate-400">
      <Icon className="h-10 w-10 mb-1" strokeWidth={1.5} />
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      {subtitle && <p className="text-xs max-w-xs">{subtitle}</p>}
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Search' }) {
  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-10"
      />
    </div>
  );
}

export function PageHeader({ title, right }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-lg font-bold text-slate-900">{title}</h1>
      {right}
    </div>
  );
}
