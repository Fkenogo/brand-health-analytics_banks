import React, { useState, useEffect } from 'react';

const DebugTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    const runTests = async () => {
      try {
        // Test dynamic import
        const bankRecognition = await import('../utils/bankRecognition');
        
        setTestResults(prev => [...prev, '✅ Module imported successfully']);
        setTestResults(prev => [...prev, `Available exports: ${Object.keys(bankRecognition).join(', ')}`]);
        
        // Test individual functions
        if (bankRecognition.recognizeTopOfMindBank) {
          const result = bankRecognition.recognizeTopOfMindBank('Access Bank');
          setTestResults(prev => [...prev, `✅ recognizeTopOfMindBank works: ${JSON.stringify(result)}`]);
        } else {
          setTestResults(prev => [...prev, '❌ recognizeTopOfMindBank not found']);
        }

        if (bankRecognition.parseSpontaneousBanks) {
          const result = bankRecognition.parseSpontaneousBanks('Access Bank, GTBank');
          setTestResults(prev => [...prev, `✅ parseSpontaneousBanks works: ${JSON.stringify(result)}`]);
        } else {
          setTestResults(prev => [...prev, '❌ parseSpontaneousBanks not found']);
        }

        if (bankRecognition.processAwarenessData) {
          const result = bankRecognition.processAwarenessData('Access Bank', 'GTBank', []);
          setTestResults(prev => [...prev, `✅ processAwarenessData works: ${JSON.stringify(result)}`]);
        } else {
          setTestResults(prev => [...prev, '❌ processAwarenessData not found']);
        }

      } catch (error) {
        setTestResults(prev => [...prev, `❌ Error: ${error}`]);
      }
    };

    runTests();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Debug Test Results</h2>
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        {testResults.map((result, index) => (
          <div key={index} style={{ marginBottom: '5px', fontFamily: 'monospace' }}>
            {result}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugTest;