import React, { useState } from 'react';
import { recognizeTopOfMindBank, parseSpontaneousBanks, processAwarenessData } from '../utils/bankRecognition';
import { RecognitionResult, SpontaneousResult, AwarenessData } from '../utils/bankRecognition';

const BankRecognitionTest: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<RecognitionResult | SpontaneousResult | AwarenessData | null>(null);
  const [testType, setTestType] = useState('topOfMind');

  const runTest = () => {
    if (testType === 'topOfMind') {
      const res = recognizeTopOfMindBank(input);
      setResult(res);
    } else if (testType === 'spontaneous') {
      const res = parseSpontaneousBanks(input);
      setResult(res);
    } else if (testType === 'process') {
      const res = processAwarenessData(input, input, []);
      setResult(res);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Bank Recognition Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          Test Type:
          <select value={testType} onChange={(e) => setTestType(e.target.value)}>
            <option value="topOfMind">Top-of-Mind</option>
            <option value="spontaneous">Spontaneous</option>
            <option value="process">Process Awareness</option>
          </select>
        </label>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>
          Input:
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            placeholder="Enter bank name(s)..."
          />
        </label>
      </div>

      <button onClick={runTest} style={{ padding: '10px 20px', marginBottom: '20px' }}>
        Run Test
      </button>

      {result && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
          <h3>Result:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default BankRecognitionTest;