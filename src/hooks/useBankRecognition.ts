import { useState, useCallback, useEffect } from 'react';
import { 
  RecognitionResult, 
  SpontaneousResult, 
  AwarenessData,
  recognizeTopOfMindBank,
  parseSpontaneousBanks,
  processAwarenessData
} from '../utils/bankRecognition';
import { CountryCode } from '../types';
import { bankRecognitionEngine } from '../utils/bankRecognition';

interface UseBankRecognitionProps {
  country?: CountryCode;
  onAwarenessDataChange?: (data: AwarenessData) => void;
}

export const useBankRecognition = ({ country, onAwarenessDataChange }: UseBankRecognitionProps) => {
  // State for Top-of-Mind recognition
  const [topOfMindInput, setTopOfMindInput] = useState<string>('');
  const [topOfMindResult, setTopOfMindResult] = useState<RecognitionResult | null>(null);
  const [topOfMindLoading, setTopOfMindLoading] = useState(false);

  // State for Spontaneous recognition
  const [spontaneousInput, setSpontaneousInput] = useState<string>('');
  const [spontaneousResult, setSpontaneousResult] = useState<SpontaneousResult | null>(null);
  const [spontaneousLoading, setSpontaneousLoading] = useState(false);

  // State for Assisted selection
  const [assistedSelections, setAssistedSelections] = useState<string[]>([]);

  // State for final awareness data
  const [awarenessData, setAwarenessData] = useState<AwarenessData | null>(null);

  // Update final awareness data
  const updateAwarenessData = useCallback((topInput: string, spontInput: string, selections: string[]) => {
    const data = processAwarenessData(topInput, spontInput, selections, country || 'rwanda');
    setAwarenessData(data);
    if (onAwarenessDataChange) {
      onAwarenessDataChange(data);
    }
  }, [country, onAwarenessDataChange]);

  // Real-time Top-of-Mind recognition
  const handleTopOfMindChange = useCallback((input: string) => {
    setTopOfMindInput(input);
    setTopOfMindLoading(true);
    
    // Debounce recognition to avoid excessive processing
    const timeoutId = setTimeout(() => {
      const result = recognizeTopOfMindBank(input, country);
      setTopOfMindResult(result);
      setTopOfMindLoading(false);
      
      // Update awareness data
      updateAwarenessData(input, spontaneousInput, assistedSelections);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [country, spontaneousInput, assistedSelections, updateAwarenessData]);

  // Real-time Spontaneous recognition
  const handleSpontaneousChange = useCallback((input: string) => {
    setSpontaneousInput(input);
    setSpontaneousLoading(true);
    
    // Debounce recognition
    const timeoutId = setTimeout(() => {
      const result = parseSpontaneousBanks(input, country);
      setSpontaneousResult(result);
      setSpontaneousLoading(false);
      
      // Update awareness data
      updateAwarenessData(topOfMindInput, input, assistedSelections);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [country, topOfMindInput, assistedSelections, updateAwarenessData]);

  // Handle Assisted selection changes
  const handleAssistedSelectionChange = useCallback((selections: string[]) => {
    setAssistedSelections(selections);
    
    // Update awareness data
    updateAwarenessData(topOfMindInput, spontaneousInput, selections);
  }, [topOfMindInput, spontaneousInput, updateAwarenessData]);

  // Get pre-selected banks for assisted question
  const getPreSelectedBanks = useCallback(() => {
    const selectedBanks = new Set<string>();
    
    // Add top-of-mind bank if recognized
    if (topOfMindResult?.bank_id) {
      selectedBanks.add(topOfMindResult.bank_id);
    }
    
    // Add spontaneous banks if recognized
    if (spontaneousResult?.recognized_banks) {
      spontaneousResult.recognized_banks.forEach(result => {
        if (result.bank_id) {
          selectedBanks.add(result.bank_id);
        }
      });
    }
    
    return Array.from(selectedBanks);
  }, [topOfMindResult, spontaneousResult]);

  // Get banks to lock (pre-selected and non-editable)
  const getLockedBanks = useCallback(() => {
    return getPreSelectedBanks();
  }, [getPreSelectedBanks]);

  // Get banks available for selection (excluding pre-selected)
  const getAvailableBanks = useCallback((allBanks: string[]) => {
    const preSelected = new Set(getPreSelectedBanks());
    return allBanks.filter(bankId => !preSelected.has(bankId));
  }, [getPreSelectedBanks]);

  // Reset all recognition data
  const resetRecognition = useCallback(() => {
    setTopOfMindInput('');
    setTopOfMindResult(null);
    setTopOfMindLoading(false);
    setSpontaneousInput('');
    setSpontaneousResult(null);
    setSpontaneousLoading(false);
    setAssistedSelections([]);
    setAwarenessData(null);
  }, []);

  // Manual recognition trigger (for debugging or special cases)
  const recognizeBankManually = useCallback((input: string, bankCountry?: CountryCode) => {
    return recognizeTopOfMindBank(input, bankCountry || country);
  }, [country]);

  const parseBanksManually = useCallback((input: string, bankCountry?: CountryCode) => {
    return parseSpontaneousBanks(input, bankCountry || country);
  }, [country]);

  return {
    // Top-of-Mind
    topOfMindInput,
    topOfMindResult,
    topOfMindLoading,
    handleTopOfMindChange,
    
    // Spontaneous
    spontaneousInput,
    spontaneousResult,
    spontaneousLoading,
    handleSpontaneousChange,
    
    // Assisted
    assistedSelections,
    handleAssistedSelectionChange,
    
    // Final data
    awarenessData,
    
    // Utilities
    getPreSelectedBanks,
    getLockedBanks,
    getAvailableBanks,
    resetRecognition,
    recognizeBankManually,
    parseBanksManually,
    
    // Raw inputs for storage
    rawInputs: {
      topOfMind: topOfMindInput,
      spontaneous: spontaneousInput
    }
  };
};

// Convenience hook for awareness metrics calculation
export const useAwarenessMetrics = (awarenessData: AwarenessData | null) => {
  const calculateMetrics = useCallback(() => {
    if (!awarenessData) {
      return {
        topOfMind: 0,
        spontaneous: 0,
        totalAwareness: 0,
        recognitionRate: 0
      };
    }

    const { top_of_mind, spontaneous, total_awareness } = awarenessData;
    
    // Top-of-Mind rate (binary: 1 if recognized, 0 if not)
    const topOfMindRate = top_of_mind.recognized_bank_id ? 1 : 0;
    
    // Spontaneous rate (percentage of recognized banks vs total mentions)
    const totalMentions = spontaneous.recognized_bank_ids.length + spontaneous.unrecognized_entries.length;
    const spontaneousRate = totalMentions > 0 
      ? (spontaneous.recognized_bank_ids.length / totalMentions) * 100 
      : 0;
    
    // Total awareness (count of unique banks)
    const totalAwarenessCount = total_awareness.length;
    
    // Overall recognition rate
    const recognitionRate = totalMentions > 0 
      ? ((spontaneous.recognized_bank_ids.length + (top_of_mind.recognized_bank_id ? 1 : 0)) / (totalMentions + 1)) * 100 
      : 0;

    return {
      topOfMind: topOfMindRate,
      spontaneous: Math.round(spontaneousRate),
      totalAwareness: totalAwarenessCount,
      recognitionRate: Math.round(recognitionRate)
    };
  }, [awarenessData]);

  const metrics = calculateMetrics();

  return {
    metrics,
    calculateMetrics
  };
};

// Hook for bank name suggestions (autocomplete)
export const useBankSuggestions = (country?: CountryCode) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const getSuggestions = useCallback((input: string) => {
    if (!input || input.length < 2) {
      setSuggestions([]);
      return;
    }

    setSuggestionsLoading(true);
    
    // Simulate async operation for suggestions
    setTimeout(() => {
      // Get all banks for the country
      const allBanks = bankRecognitionEngine.getBanksByCountry(country || 'rwanda');
      
      // Filter banks based on input
      const normalizedInput = input.toLowerCase();
      const filteredBanks = allBanks
        .filter(bank => bank.name.toLowerCase().includes(normalizedInput))
        .slice(0, 5) // Limit to 5 suggestions
        .map(bank => bank.name);
      
      setSuggestions(filteredBanks);
      setSuggestionsLoading(false);
    }, 100);
  }, [country]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    suggestionsLoading,
    getSuggestions,
    clearSuggestions
  };
};