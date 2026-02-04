import React from 'react';
import { Filter, X, Calendar, Users, UserCircle, GitCompare } from 'lucide-react';
import { BANKS } from '@/constants';
import { CountryCode } from '@/types';

export interface FilterState {
  ageGroups: string[];
  genders: string[];
  timePeriod: string;
}

export interface ComparisonState {
  enabled: boolean;
  compareWithBankId: string | null;
}

interface DashboardFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  comparison: ComparisonState;
  onComparisonChange: (comparison: ComparisonState) => void;
  activeCountry: CountryCode;
  selectedBankId: string;
  isOpen: boolean;
  onToggle: () => void;
}

const AGE_GROUPS = ['18-24', '25-34', '35-44', '45-54', '55+'];
const GENDERS = ['male', 'female'];
const TIME_PERIODS = [
  { value: 'all', label: 'All Time' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '6m', label: 'Last 6 Months' },
];

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  filters,
  onFiltersChange,
  comparison,
  onComparisonChange,
  activeCountry,
  selectedBankId,
  isOpen,
  onToggle
}) => {
  const countryBanks = BANKS.filter(b => b.country === activeCountry && b.id !== selectedBankId);

  const toggleAgeGroup = (age: string) => {
    const updated = filters.ageGroups.includes(age)
      ? filters.ageGroups.filter(a => a !== age)
      : [...filters.ageGroups, age];
    onFiltersChange({ ...filters, ageGroups: updated });
  };

  const toggleGender = (gender: string) => {
    const updated = filters.genders.includes(gender)
      ? filters.genders.filter(g => g !== gender)
      : [...filters.genders, gender];
    onFiltersChange({ ...filters, genders: updated });
  };

  const clearFilters = () => {
    onFiltersChange({ ageGroups: [], genders: [], timePeriod: 'all' });
  };

  const activeFilterCount = 
    filters.ageGroups.length + 
    filters.genders.length + 
    (filters.timePeriod !== 'all' ? 1 : 0);

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="px-6 py-3 bg-secondary text-foreground rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] border border-border hover:bg-secondary/80 transition-all relative"
      >
        <Filter size={14} />
        Filters
        {activeFilterCount > 0 && (
          <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-[9px] font-black rounded-full flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Filter size={18} className="text-primary" />
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Filters & Comparison</h3>
        </div>
        <div className="flex items-center gap-3">
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-[10px] font-bold text-destructive uppercase tracking-wider hover:underline"
            >
              Clear All
            </button>
          )}
          <button
            onClick={onToggle}
            className="p-2 hover:bg-secondary rounded-lg transition-all"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Age Groups */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <UserCircle size={14} className="text-muted-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Age Group</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {AGE_GROUPS.map(age => (
              <button
                key={age}
                onClick={() => toggleAgeGroup(age)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filters.ageGroups.includes(age)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary border border-border'
                }`}
              >
                {age}
              </button>
            ))}
          </div>
        </div>

        {/* Gender */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-muted-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Gender</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {GENDERS.map(gender => (
              <button
                key={gender}
                onClick={() => toggleGender(gender)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  filters.genders.includes(gender)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary border border-border'
                }`}
              >
                {gender}
              </button>
            ))}
          </div>
        </div>

        {/* Time Period */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={14} className="text-muted-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Time Period</span>
          </div>
          <select
            value={filters.timePeriod}
            onChange={(e) => onFiltersChange({ ...filters, timePeriod: e.target.value })}
            className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs font-bold text-foreground appearance-none cursor-pointer hover:bg-secondary transition-all"
          >
            {TIME_PERIODS.map(period => (
              <option key={period.value} value={period.value}>{period.label}</option>
            ))}
          </select>
        </div>

        {/* Comparison Mode */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <GitCompare size={14} className="text-muted-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Compare Banks</span>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={comparison.enabled}
                onChange={(e) => onComparisonChange({ 
                  ...comparison, 
                  enabled: e.target.checked,
                  compareWithBankId: e.target.checked ? (countryBanks[0]?.id || null) : null
                })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-xs font-medium text-foreground">Enable Comparison</span>
            </label>
            {comparison.enabled && (
              <select
                value={comparison.compareWithBankId || ''}
                onChange={(e) => onComparisonChange({ ...comparison, compareWithBankId: e.target.value })}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs font-bold text-foreground appearance-none cursor-pointer hover:bg-secondary transition-all"
              >
                {countryBanks.map(bank => (
                  <option key={bank.id} value={bank.id}>{bank.name.split(' (')[0]}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mr-2">Active:</span>
          {filters.ageGroups.map(age => (
            <span key={age} className="px-2 py-1 bg-primary/20 text-primary text-[10px] font-bold rounded-full flex items-center gap-1">
              {age}
              <X size={10} className="cursor-pointer hover:text-primary-foreground" onClick={() => toggleAgeGroup(age)} />
            </span>
          ))}
          {filters.genders.map(gender => (
            <span key={gender} className="px-2 py-1 bg-accent/20 text-accent text-[10px] font-bold rounded-full capitalize flex items-center gap-1">
              {gender}
              <X size={10} className="cursor-pointer hover:text-accent-foreground" onClick={() => toggleGender(gender)} />
            </span>
          ))}
          {filters.timePeriod !== 'all' && (
            <span className="px-2 py-1 bg-secondary text-foreground text-[10px] font-bold rounded-full flex items-center gap-1">
              {TIME_PERIODS.find(p => p.value === filters.timePeriod)?.label}
              <X size={10} className="cursor-pointer" onClick={() => onFiltersChange({ ...filters, timePeriod: 'all' })} />
            </span>
          )}
        </div>
      )}
    </div>
  );
};
