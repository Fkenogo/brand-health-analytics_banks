import { SurveyResponse } from '../types';

export const exportToCSV = (responses: SurveyResponse[]) => {
  if (responses.length === 0) return;

  // Get all unique keys from all responses for headers
  const allKeys = Array.from(new Set(responses.flatMap(r => Object.keys(r))));
  
  const csvContent = [
    allKeys.join(','),
    ...responses.map(row => {
      return allKeys.map(key => {
        const val = row[key];
        if (Array.isArray(val)) return `"${val.join('; ')}"`;
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
        return val ?? '';
      }).join(',');
    })
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `survey_responses_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
