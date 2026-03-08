import { describe, it, expect } from 'vitest';
import {
  recognizeTopOfMindBank,
  parseSpontaneousBanks,
  processAwarenessData,
  type RecognitionResult,
  type SpontaneousResult,
  type AwarenessData,
} from './bankRecognition';

describe('Bank Recognition Engine', () => {
  describe('recognizeTopOfMindBank', () => {
    it('should recognize exact match', () => {
      const result = recognizeTopOfMindBank('Access Bank');
      
      expect(result.recognized).toBe(true);
      expect(result.standardName).toBe('Access Bank');
      expect(result.bankId).toBe('ACC_RW');
      expect(result.confidence).toBe(1.0);
    });

    it('should recognize case-insensitive match', () => {
      const result = recognizeTopOfMindBank('access bank');
      
      expect(result.recognized).toBe(true);
      expect(result.standardName).toBe('Access Bank');
      expect(result.confidence).toBe(1.0);
    });

    it('should recognize fuzzy match', () => {
      const result = recognizeTopOfMindBank('Acess Bank'); // Typo
      
      expect(result.recognized).toBe(true);
      expect(result.standardName).toBe('Access Bank');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should not recognize unrelated input', () => {
      const result = recognizeTopOfMindBank('Random Bank Name');
      
      expect(result.recognized).toBe(false);
      expect(result.standardName).toBe(null);
      expect(result.confidence).toBe(0);
    });

    it('should provide suggestions for unrecognized input', () => {
      const result = recognizeTopOfMindBank('GTB');
      
      // May or may not recognize, but should provide suggestions
      if (!result.recognized) {
        expect(result.suggestions).toBeDefined();
        expect(result.suggestions!.length).toBeGreaterThan(0);
      }
    });

    it('should handle empty input', () => {
      const result = recognizeTopOfMindBank('');
      
      expect(result.recognized).toBe(false);
      expect(result.standardName).toBe(null);
      expect(result.confidence).toBe(0);
    });
  });

  describe('parseSpontaneousBanks', () => {
    it('should parse comma-separated banks', () => {
      const result = parseSpontaneousBanks('Access Bank, GTBank, Zenith Bank');
      
      expect(result.banks).toHaveLength(3);
      expect(result.banks[0].standardName).toBe('Access Bank');
      expect(result.recognized_banks).toHaveLength(3);
      expect(result.unrecognized_entries).toHaveLength(0);
    });

    it('should parse semicolon-separated banks', () => {
      const result = parseSpontaneousBanks('Access Bank; GTBank; Zenith Bank');
      
      expect(result.banks).toHaveLength(3);
      expect(result.recognized_banks).toHaveLength(3);
    });

    it('should parse newline-separated banks', () => {
      const result = parseSpontaneousBanks('Access Bank\nGTBank\nZenith Bank');
      
      expect(result.banks).toHaveLength(3);
      expect(result.recognized_banks).toHaveLength(3);
    });

    it('should handle mixed separators', () => {
      const result = parseSpontaneousBanks('Access Bank, GTBank; Zenith Bank\nFirst Bank');
      
      expect(result.banks).toHaveLength(4);
      expect(result.recognized_banks).toHaveLength(4);
    });

    it('should handle unrecognized banks', () => {
      const result = parseSpontaneousBanks('Access Bank, Fake Bank, GTBank');
      
      expect(result.banks).toHaveLength(3);
      expect(result.recognized_banks).toHaveLength(2);
      expect(result.unrecognized_entries).toHaveLength(1);
      expect(result.unrecognized_entries).toContain('Fake Bank');
    });
  });

  describe('processAwarenessData', () => {
    it('should deduplicate banks across all three steps', () => {
      const result = processAwarenessData(
        'Access Bank',
        'Access Bank, GTBank',
        ['ACC_RW', 'GTB_RW', 'KCB_RW']
      );
      
      expect(result.total).toContain('ACC_RW');
      expect(result.total).toContain('GTB_RW');
      expect(result.total).toContain('KCB_RW');
      expect(result.total.length).toBe(3); // Should not duplicate 'ACC_RW'
    });

    it('should handle empty inputs', () => {
      const result = processAwarenessData('', '', []);
      
      expect(result.total).toHaveLength(0);
      expect(result.topOfMind.recognized).toBe(false);
      expect(result.spontaneous.banks).toHaveLength(0);
    });

    it('should include all recognized banks', () => {
      const result = processAwarenessData(
        'Access Bank',
        'GTBank, Zenith Bank',
        ['KCB_RW', 'BOA_RW']
      );
      
      expect(result.total).toContain('ACC_RW');
      expect(result.total).toContain('GTB_RW');
      expect(result.total).toContain('KCB_RW');
      expect(result.total).toContain('BOA_RW');
      expect(result.total.length).toBe(4);
    });

    it('should handle country parameter', () => {
      const result = processAwarenessData(
        'Access Bank',
        'GTBank',
        ['KCB_RW'],
        'rwanda'
      );
      
      expect(result.total).toContain('ACC_RW');
      expect(result.total).toContain('GTB_RW');
      expect(result.total).toContain('KCB_RW');
    });
  });

  describe('Interface Compatibility', () => {
    it('should have all required interface properties', () => {
      const result = recognizeTopOfMindBank('Access Bank');
      
      // Check main properties
      expect(result).toHaveProperty('input');
      expect(result).toHaveProperty('recognized');
      expect(result).toHaveProperty('standardName');
      expect(result).toHaveProperty('bankId');
      expect(result).toHaveProperty('confidence');
      
      // Check alias properties
      expect(result).toHaveProperty('bank_id');
      expect(result).toHaveProperty('matched_name');
      expect(result).toHaveProperty('recognition_confidence');
      expect(result).toHaveProperty('recognized_bank_id');
    });

    it('should have all SpontaneousResult properties', () => {
      const result = parseSpontaneousBanks('Access Bank, GTBank');
      
      // Check main properties
      expect(result).toHaveProperty('rawInput');
      expect(result).toHaveProperty('banks');
      
      // Check alias properties
      expect(result).toHaveProperty('recognized_banks');
      expect(result).toHaveProperty('unrecognized_entries');
      expect(result).toHaveProperty('recognized_bank_ids');
    });

    it('should have all AwarenessData properties', () => {
      const result = processAwarenessData('Access Bank', 'GTBank', ['KCB_RW']);
      
      // Check main properties
      expect(result).toHaveProperty('topOfMind');
      expect(result).toHaveProperty('spontaneous');
      expect(result).toHaveProperty('total');
      
      // Check alias properties
      expect(result).toHaveProperty('top_of_mind');
      expect(result).toHaveProperty('total_awareness');
      expect(result).toHaveProperty('recognized_bank_ids');
      expect(result).toHaveProperty('assisted');
    });
  });
});