// Test the bank recognition implementation
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing Bank Recognition Implementation...');

// Test 1: Check if the file exists and has content
const fs = await import('fs/promises');
const filePath = join(__dirname, 'src', 'utils', 'bankRecognition.ts');

try {
  const content = await fs.readFile(filePath, 'utf8');
  console.log('✅ File exists and has content:', content.length > 0 ? 'YES' : 'NO');
  console.log('File size:', content.length, 'characters');
  
  if (content.length > 0) {
    console.log('✅ File content preview (first 200 chars):');
    console.log(content.substring(0, 200));
  }
} catch (error) {
  console.error('❌ Error reading file:', error.message);
}

// Test 2: Try to import the functions
try {
  const bankRecognition = await import('./src/utils/bankRecognition.ts');
  console.log('✅ Import successful');
  console.log('Available exports:', Object.keys(bankRecognition));
  
  // Test function calls
  if (bankRecognition.recognizeTopOfMindBank) {
    const result = bankRecognition.recognizeTopOfMindBank('Access Bank');
    console.log('✅ Function call successful:', result);
  } else {
    console.log('❌ recognizeTopOfMindBank function not found');
  }
  
} catch (error) {
  console.error('❌ Import failed:', error.message);
}

console.log('Test completed.');