import { BANKS } from '../constants';
import { ValidationRule, Language } from '../types';

export const validateInput = (value: any, rules: ValidationRule[] | undefined, lang: Language): string | null => {
  if (!rules) return null;

  for (const rule of rules) {
    if (rule.type === 'bank-name') {
      const input = String(value).toLowerCase().trim();
      if (!input) continue;

      const isKnownBank = BANKS.some(bank => {
        const nameMatch = bank.name.toLowerCase().includes(input) || input.includes(bank.name.toLowerCase());
        const aliasMatch = bank.aliases?.some(alias => 
          alias.toLowerCase() === input || input.includes(alias.toLowerCase())
        );
        return nameMatch || aliasMatch;
      });

      if (!isKnownBank && input.length > 2) {
        return rule.message[lang];
      }
    }

    if (rule.type === 'min-length') {
      if (String(value).length < rule.params) {
        return rule.message[lang];
      }
    }
  }

  return null;
};

export const getFingerprint = (): string => {
  let id = localStorage.getItem('survey_device_fingerprint');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('survey_device_fingerprint', id);
  }
  return id;
};
