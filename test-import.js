// Test importing the bank recognition functions
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to import the functions
try {
  const { recognizeTopOfMindBank, parseSpontaneousBanks, processAwarenessData } = await import('./src/utils/bankRecognition.ts');
  
  console.log('✅ Successfully imported functions:');
  console.log('- recognizeTopOfMindBank:', typeof recognizeTopOfMindBank);
  console.log('- parseSpontaneousBanks:', typeof parseSpontaneousBanks);
  console.log('- processAwarenessData:', typeof processAwarenessData);
  
  // Test a simple function call
  if (typeof recognizeTopOfMindBank === 'function') {
    const result = recognizeTopOfMindBank('Access Bank');
    console.log('✅ Function call successful:', result);
  }
  
} catch (error) {
  console.error('❌ Import failed:', error.message);
}