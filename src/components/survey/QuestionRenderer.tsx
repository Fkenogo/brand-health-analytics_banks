import React from 'react';
import { Question, Language } from '@/types';
import { UI_STRINGS, RATING_DESCRIPTORS } from '@/constants';
import { Check, ChevronDown } from 'lucide-react';

interface QuestionRendererProps {
  question: Question;
  value: any;
  onChange: (val: any) => void;
  formData: any;
  lang: Language;
  isHighContrast?: boolean;
  themeColor?: string;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({ 
  question, 
  value, 
  onChange, 
  formData,
  lang,
  isHighContrast,
  themeColor
}) => {
  const choices = question.filterChoices ? question.filterChoices(formData) : question.choices || [];

  const renderScale = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-end px-1 mb-1">
        <div className="flex flex-col">
          <span className={`text-[9px] font-black uppercase tracking-widest ${isHighContrast ? 'text-yellow-400' : 'text-rose-500'}`}>0: {RATING_DESCRIPTORS[0][lang]}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className={`text-[9px] font-black uppercase tracking-widest ${isHighContrast ? 'text-yellow-400' : 'text-emerald-500'}`}>10: {RATING_DESCRIPTORS[10][lang]}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {[...Array(11).keys()].map(num => (
          <button
            key={num}
            onClick={() => onChange(num)}
            className={`h-14 rounded-xl font-black text-sm transition-all flex flex-col items-center justify-center border relative overflow-hidden ${
              value === num 
                ? (isHighContrast ? 'bg-yellow-400 border-yellow-400 text-black scale-105 z-10' : 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105 z-10') 
                : (isHighContrast ? 'bg-black border-yellow-400/30 text-yellow-400' : 'glass-card border-white/5 text-slate-500 active:bg-white/5')
            }`}
            style={value === num && themeColor ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
          >
            <span className="text-lg">{num}</span>
          </button>
        ))}
      </div>

      <div className="min-h-[44px] flex items-center justify-center pt-2">
        {typeof value === 'number' ? (
          <div className="text-center animate-in fade-in zoom-in duration-300">
             <span className={`text-[10px] font-black uppercase tracking-widest py-2 px-6 rounded-full border ${
               isHighContrast ? 'bg-yellow-400/10 border-yellow-400 text-yellow-400' : 'bg-blue-400/10 border-blue-400/20 text-blue-400'
             }`}
             style={themeColor ? { borderColor: `${themeColor}40`, color: themeColor, backgroundColor: `${themeColor}10` } : {}}
             >
                {value}: {RATING_DESCRIPTORS[value]?.[lang] || 'Selected'}
             </span>
          </div>
        ) : (
          <div className="text-center opacity-40">
            <span className="text-[9px] font-bold uppercase tracking-widest italic">
              {UI_STRINGS.selectOption[lang]}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const renderRatingMatrix = () => {
    const ratings = [...Array(11).keys()];
    const currentValue = (value || {}) as Record<string, number | undefined>;

    const handleRatingChange = (bankId: string, rating: number) => {
      onChange({ ...currentValue, [bankId]: rating });
    };

    return (
      <div className="space-y-2">
        {/* Header row with rating numbers */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[500px]">
            <thead>
              <tr>
                <th className="text-left p-2 min-w-[120px]"></th>
                {ratings.map(num => (
                  <th 
                    key={num} 
                    className={`text-center p-1 text-xs font-bold min-w-[32px] ${
                      num === 0 ? 'text-rose-500' : num === 10 ? 'text-emerald-500' : 'text-slate-400'
                    }`}
                  >
                    {num}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {choices.map((choice, index) => (
                <tr 
                  key={choice.value} 
                  className={`border-t border-white/5 ${index % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
                >
                  <td className="p-3 text-sm font-semibold text-white min-w-[120px]">
                    {choice.label[lang]}
                  </td>
                  {ratings.map(num => {
                    const isSelected = currentValue[choice.value] === num;
                    return (
                      <td key={num} className="text-center p-1">
                        <button
                          onClick={() => handleRatingChange(choice.value, num)}
                          className={`w-7 h-7 rounded-full transition-all flex items-center justify-center mx-auto text-xs font-bold ${
                            isSelected
                              ? (isHighContrast 
                                  ? 'bg-yellow-400 text-black' 
                                  : 'bg-blue-600 text-white shadow-lg')
                              : (isHighContrast 
                                  ? 'border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10' 
                                  : 'border border-white/10 text-slate-500 hover:bg-white/5')
                          }`}
                          style={isSelected && themeColor ? { backgroundColor: themeColor } : {}}
                        >
                          {isSelected ? '✓' : ''}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Legend */}
        <div className="flex justify-between pt-4 px-2 text-[9px] font-bold uppercase tracking-widest">
          <span className="text-rose-500">0: {RATING_DESCRIPTORS[0][lang]}</span>
          <span className="text-emerald-500">10: {RATING_DESCRIPTORS[10][lang]}</span>
        </div>
        
        {/* Progress indicator */}
        <div className="pt-2 text-center">
          <span className="text-[10px] text-slate-500">
            {Object.keys(currentValue).filter(k => typeof currentValue[k] === 'number').length} / {choices.length} {lang === 'en' ? 'rated' : lang === 'fr' ? 'évalué(s)' : 'byatanzwe'}
          </span>
        </div>
      </div>
    );
  };

  switch (question.type) {
    case 'note':
      return (
        <div className={`p-6 rounded-3xl border-l-4 ${isHighContrast ? 'bg-gray-900 border-yellow-400' : 'bg-blue-500/10 border-blue-500'}`}
          style={!isHighContrast && themeColor ? { borderColor: themeColor, backgroundColor: `${themeColor}10` } : {}}
        >
          <p className="text-sm leading-relaxed opacity-80">{question.description?.[lang]}</p>
        </div>
      );

    case 'radio':
      return (
        <div className="space-y-3">
          {choices.map(choice => (
            <button 
              key={choice.value} 
              onClick={() => onChange(choice.value)}
              className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${
                value === choice.value 
                  ? (isHighContrast ? 'border-yellow-400 bg-yellow-400 text-black' : 'border-blue-500 bg-blue-600 text-white shadow-xl') 
                  : (isHighContrast ? 'border-yellow-400/20 text-slate-400' : 'glass-card border-white/5 text-slate-400 active:bg-white/5')
              }`}
              style={value === choice.value && !isHighContrast && themeColor ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
            >
              <span className="text-sm font-bold">{choice.label[lang]}</span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${value === choice.value ? 'border-white' : 'border-slate-700'}`}>
                {value === choice.value && <div className="w-2 h-2 rounded-full bg-current" />}
              </div>
            </button>
          ))}
        </div>
      );

    case 'checkbox':
      return (
        <div className="grid grid-cols-1 gap-3">
          {choices.map(choice => {
            const isSelected = (value || []).includes(choice.value);
            return (
              <button 
                key={choice.value} 
                onClick={() => {
                  const current = Array.isArray(value) ? value : [];
                  onChange(isSelected ? current.filter((v: string) => v !== choice.value) : [...current, choice.value]);
                }}
                className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                  isSelected 
                    ? (isHighContrast ? 'border-yellow-400 bg-yellow-400 text-black' : 'border-indigo-500 bg-indigo-600 text-white') 
                    : (isHighContrast ? 'border-yellow-400/20 text-slate-400' : 'glass-card border-white/5 text-slate-400 active:bg-white/5')
                }`}
                style={isSelected && !isHighContrast && themeColor ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
              >
                <span className="text-xs font-bold">{choice.label[lang]}</span>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'border-white' : 'border-slate-700'}`}>
                  {isSelected && <Check size={14} />}
                </div>
              </button>
            );
          })}
        </div>
      );

    case 'text':
    case 'date':
      return (
        <input 
          type={question.type === 'date' ? 'date' : 'text'}
          value={value || ''}
          placeholder={UI_STRINGS.typeAnswer[lang]}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-16 px-6 rounded-2xl border outline-none font-bold transition-all ${
            isHighContrast ? 'bg-black border-yellow-400 text-white focus:bg-yellow-400/10' : 'glass-card border-white/10 text-white focus:border-blue-500'
          }`}
          style={!isHighContrast && themeColor ? { borderColor: `${themeColor}40` } : {}}
        />
      );

    case 'dropdown':
      return (
        <div className="relative">
          <select 
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full h-16 px-6 rounded-2xl border appearance-none outline-none font-bold transition-all ${
              isHighContrast ? 'bg-black border-yellow-400 text-white' : 'glass-card border-white/10 text-white'
            }`}
          >
            <option value="">{UI_STRINGS.selectOption[lang]}</option>
            {choices.map(choice => (
              <option key={choice.value} value={choice.value}>{choice.label[lang]}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" size={20} />
        </div>
      );

    case 'rating-matrix':
      return renderRatingMatrix();

    case 'rating-0-10-nr':
    case 'rating-0-10-dk':
      return renderScale();

    default:
      return null;
  }
};
