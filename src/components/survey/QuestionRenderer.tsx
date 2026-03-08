import React, { useEffect, useMemo, useState } from 'react';
import { Question, Language, SurveyResponse, CountryCode } from '@/types';
import { UI_STRINGS, RATING_DESCRIPTORS } from '@/constants';
import { AlertTriangle, Check, CheckCircle2, ChevronDown, Loader2, Lock, XCircle } from 'lucide-react';
import { parseSpontaneousBanks, processAwarenessData, recognizeTopOfMindBank, type RecognitionResult, type SpontaneousResult } from '@/utils/bankRecognition';

interface QuestionRendererProps {
  question: Question;
  value: string | string[] | number | Record<string, number | undefined> | undefined;
  onChange: (val: string | string[] | number | Record<string, number | undefined>) => void;
  onMetaChange?: (patch: Partial<SurveyResponse>) => void;
  formData: Partial<SurveyResponse>;
  lang: Language;
  isHighContrast?: boolean;
  themeColor?: string;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({ 
  question, 
  value, 
  onChange, 
  onMetaChange,
  formData,
  lang,
  isHighContrast,
  themeColor
}) => {
  const choices = question.filterChoices ? question.filterChoices(formData) : question.choices || [];
  const country = (formData.selected_country || 'rwanda') as CountryCode;
  const [topResult, setTopResult] = useState<RecognitionResult | null>(null);
  const [spontResult, setSpontResult] = useState<SpontaneousResult | null>(null);
  const [recognitionLoading, setRecognitionLoading] = useState(false);

  const updateAwarenessMeta = React.useCallback((topInput: string, spontInput: string, assistedSelections: string[]) => {
    const data = processAwarenessData(topInput, spontInput, assistedSelections, country);
    onMetaChange?.({
      c1_recognized_bank_id: data.top_of_mind.recognized_bank_id,
      c1_recognition_confidence: data.top_of_mind.recognition_confidence,
      c2_recognized_bank_ids: data.spontaneous.recognized_bank_ids,
      c2_unrecognized_entries: data.spontaneous.unrecognized_entries,
      c3_total_awareness: data.total_awareness,
      raw_input_q1: topInput,
      recognized_bank_id_q1: data.top_of_mind.recognized_bank_id,
      recognition_confidence_q1: data.top_of_mind.recognition_confidence,
      raw_input_q2: spontInput,
      recognized_bank_ids_q2: data.spontaneous.recognized_bank_ids,
      unrecognized_entries_q2: data.spontaneous.unrecognized_entries,
      top_of_mind_bank_id: data.top_of_mind.recognized_bank_id,
      spontaneous_awareness_bank_ids: data.spontaneous.recognized_bank_ids,
      assisted_awareness_bank_ids: assistedSelections,
      total_awareness_bank_ids: data.total_awareness,
    });
  }, [country, onMetaChange]);

  useEffect(() => {
    if (question.id !== 'c1_top_of_mind') return;
    const input = String(value || '');
    setRecognitionLoading(true);
    const timeout = setTimeout(() => {
      const result = recognizeTopOfMindBank(input, country);
      setTopResult(result);
      setRecognitionLoading(false);
      updateAwarenessMeta(input, String(formData.c2_spontaneous || ''), Array.isArray(formData.c3_aware_banks) ? formData.c3_aware_banks : []);
    }, 300);
    return () => clearTimeout(timeout);
  }, [question.id, value, country, formData.c2_spontaneous, formData.c3_aware_banks, updateAwarenessMeta]);

  useEffect(() => {
    if (question.id !== 'c2_spontaneous') return;
    const input = String(value || '');
    setRecognitionLoading(true);
    const timeout = setTimeout(() => {
      const topBank = recognizeTopOfMindBank(String(formData.c1_top_of_mind || ''), country);
      const result = parseSpontaneousBanks(input, country, {
        excludeBankIds: topBank.bankId ? [topBank.bankId] : [],
      });
      setSpontResult(result);
      setRecognitionLoading(false);
      updateAwarenessMeta(String(formData.c1_top_of_mind || ''), input, Array.isArray(formData.c3_aware_banks) ? formData.c3_aware_banks : []);
    }, 500);
    return () => clearTimeout(timeout);
  }, [question.id, value, country, formData.c1_top_of_mind, formData.c3_aware_banks]);

  const lockedBanks = useMemo(() => {
    const top = recognizeTopOfMindBank(String(formData.c1_top_of_mind || ''), country);
    const spont = parseSpontaneousBanks(String(formData.c2_spontaneous || ''), country, {
      excludeBankIds: top.bankId ? [top.bankId] : [],
    });
    const locked = new Set<string>();
    if (top.bankId) locked.add(top.bankId);
    spont.recognized_bank_ids.forEach(id => locked.add(id));
    return Array.from(locked);
  }, [formData.c1_top_of_mind, formData.c2_spontaneous, country]);

  useEffect(() => {
    if (question.id !== 'c3_aware_banks') return;
    const current = Array.isArray(value) ? value : [];
    const merged = Array.from(new Set([...current, ...lockedBanks]));
    if (merged.length !== current.length) {
      onChange(merged);
      updateAwarenessMeta(String(formData.c1_top_of_mind || ''), String(formData.c2_spontaneous || ''), merged);
    }
  }, [question.id, value, lockedBanks, formData.c1_top_of_mind, formData.c2_spontaneous]);

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
      onChange({ ...currentValue, [bankId]: rating } as Record<string, number | undefined>);
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
          {question.id === 'c3_aware_banks' && lockedBanks.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-slate-300">
              <div className="mb-2 font-bold uppercase tracking-widest text-slate-500">Already captured</div>
              <div className="flex flex-wrap gap-2">
                {lockedBanks.map(id => {
                  const label = choices.find(choice => choice.value === id)?.label?.[lang] || id;
                  return (
                    <span key={id} className="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-200">
                      <Lock size={12} /> {label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {choices.map(choice => {
            const current = Array.isArray(value) ? value : [];
            const isLocked = question.id === 'c3_aware_banks' && lockedBanks.includes(choice.value);
            const isSelected = isLocked || current.includes(choice.value);
            return (
              <button 
                key={choice.value} 
                onClick={() => {
                  if (isLocked) return;
                  const next = isSelected ? current.filter((v: string) => v !== choice.value) : [...current, choice.value];
                  const merged = question.id === 'c3_aware_banks' ? Array.from(new Set([...next, ...lockedBanks])) : next;
                  onChange(merged);
                  if (question.id === 'c3_aware_banks') {
                    updateAwarenessMeta(String(formData.c1_top_of_mind || ''), String(formData.c2_spontaneous || ''), merged);
                  }
                }}
                className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                  isSelected 
                    ? (isHighContrast ? 'border-yellow-400 bg-yellow-400 text-black' : 'border-indigo-500 bg-indigo-600 text-white') 
                    : (isHighContrast ? 'border-yellow-400/20 text-slate-400' : 'glass-card border-white/5 text-slate-400 active:bg-white/5')
                } ${isLocked ? 'opacity-90 cursor-not-allowed' : ''}`}
                style={isSelected && !isHighContrast && themeColor ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
              >
                <span className="text-xs font-bold">{choice.label[lang]}</span>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'border-white' : 'border-slate-700'}`}>
                  {isLocked ? <Lock size={12} /> : isSelected && <Check size={14} />}
                </div>
              </button>
            );
          })}
        </div>
      );

    case 'text':
    case 'date':
      if (question.id === 'c1_top_of_mind' || question.id === 'c2_spontaneous') {
        return (
          <div className="space-y-4">
            <input 
              type="text"
              value={value || ''}
              placeholder={UI_STRINGS.typeAnswer[lang]}
              onChange={(e) => onChange(e.target.value)}
              className={`w-full h-16 px-6 rounded-2xl border outline-none font-bold transition-all ${
                isHighContrast ? 'bg-black border-yellow-400 text-white focus:bg-yellow-400/10' : 'glass-card border-white/10 text-white focus:border-blue-500'
              }`}
              style={!isHighContrast && themeColor ? { borderColor: `${themeColor}40` } : {}}
            />
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-sm text-slate-300">
              {recognitionLoading ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 size={16} className="animate-spin" />
                  Recognizing bank names…
                </div>
              ) : question.id === 'c1_top_of_mind' ? (
                topResult?.recognized ? (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 size={16} />
                    Matched: {topResult.standardName} ({Math.round((topResult.confidence || 0) * 100)}% confidence)
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-300">
                    <AlertTriangle size={16} />
                    Not recognized yet. Suggestions: {topResult?.suggestions?.join(', ') || 'None'}
                  </div>
                )
              ) : spontResult ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 size={16} />
                    Recognized: {spontResult.recognized_banks.length}
                  </div>
                  {spontResult.excluded_entries && spontResult.excluded_entries.length > 0 && (
                    <div className="flex items-center gap-2 text-blue-300">
                      <Lock size={16} />
                      Already captured in Q1: {spontResult.excluded_entries.join(', ')}
                    </div>
                  )}
                  {spontResult.unrecognized_entries.length > 0 && (
                    <div className="flex items-center gap-2 text-rose-400">
                      <XCircle size={16} />
                      Unrecognized: {spontResult.unrecognized_entries.join(', ')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-400">Enter bank names separated by commas or new lines.</div>
              )}
            </div>
          </div>
        );
      }

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
