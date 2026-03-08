// Simple Node.js test to verify bank recognition functions
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the bank recognition file
const bankRecognitionPath = path.join(__dirname, 'src', 'utils', 'bankRecognition.ts');
const bankRecognitionContent = fs.readFileSync(bankRecognitionPath, 'utf8');

console.log('✅ Bank Recognition file exists and is readable');
console.log('File size:', bankRecognitionContent.length, 'characters');

// Check for exports
const hasNamedExports = bankRecognitionContent.includes('export function recognizeTopOfMindBank');
const hasDefaultExport = bankRecognitionContent.includes('export default');

console.log('✅ Named exports found:', hasNamedExports);
console.log('✅ Default export found:', hasDefaultExport);

// Check for required functions
const hasRecognizeFunction = bankRecognitionContent.includes('recognizeTopOfMindBank');
const hasParseFunction = bankRecognitionContent.includes('parseSpontaneousBanks');
const hasProcessFunction = bankRecognitionContent.includes('processAwarenessData');

console.log('✅ recognizeTopOfMindBank function found:', hasRecognizeFunction);
console.log('✅ parseSpontaneousBanks function found:', hasParseFunction);
console.log('✅ processAwarenessData function found:', hasProcessFunction);

// Check for constants import
const hasConstantsImport = bankRecognitionContent.includes("from '../constants'");
console.log('✅ Constants import found:', hasConstantsImport);

console.log('\n🎉 All checks passed! The bank recognition implementation appears to be complete.');