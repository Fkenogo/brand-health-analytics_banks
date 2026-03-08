import { recognizeTopOfMindBank } from './src/utils/bankRecognition';

console.log('Testing import...');
console.log('recognizeTopOfMindBank:', typeof recognizeTopOfMindBank);
console.log('recognizeTopOfMindBank function:', recognizeTopOfMindBank);

if (typeof recognizeTopOfMindBank === 'function') {
  const result = recognizeTopOfMindBank('Access Bank');
  console.log('Test result:', result);
} else {
  console.log('Import failed - function not found');
}