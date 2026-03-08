# Files to Address for Bank Awareness Recognition Logic

## Critical Files Requiring Immediate Attention

### 🔴 **CRITICAL: Import/Export System Files**

#### 1. **TypeScript Configuration Files**

- **File**: `tsconfig.json`
- **Issue**: Module resolution configuration may be incorrect
- **Required Changes**:
  - Verify module resolution settings
  - Check module export configuration
  - Ensure proper TypeScript compilation for Node.js imports

- **File**: `tsconfig.app.json`
- **Issue**: Application-specific TypeScript configuration
- **Required Changes**:
  - Verify build process includes bank recognition files
  - Check module resolution for utility files

- **File**: `vite.config.ts`
- **Issue**: Build tool configuration may affect module resolution
- **Required Changes**:
  - Verify TypeScript compilation settings
  - Check module resolution in build process

#### 2. **Package Configuration Files**

- **File**: `package.json`
- **Issue**: TypeScript and build tool dependencies may be misconfigured
- **Required Changes**:
  - Verify TypeScript compiler options
  - Check build script configurations
  - Ensure proper module resolution settings

### 🟡 **HIGH PRIORITY: Core Logic Files**

#### 3. **Bank Recognition Engine**

- **File**: `src/utils/bankRecognition.ts`
- **Issue**: Functions not being exported properly
- **Required Changes**:
  - Fix export statements
  - Verify import paths for constants
  - Test module resolution independently
  - Add fallback export methods if needed

#### 4. **Bank Recognition Hook**

- **File**: `src/hooks/useBankRecognition.ts`
- **Issue**: Depends on bankRecognition.ts which has import issues
- **Required Changes**:
  - Fix import statements once bankRecognition.ts is fixed
  - Add error handling for import failures
  - Test hook functionality independently

### 🟡 **HIGH PRIORITY: Survey Integration Files**

#### 5. **Question Renderer Component**

- **File**: `src/components/survey/QuestionRenderer.tsx`
- **Issue**: Not updated to use bank recognition logic
- **Required Changes**:
  - Import and integrate useBankRecognition hook
  - Add real-time recognition feedback UI
  - Implement pre-selection and locking for assisted question
  - Add confidence indicators and loading states
  - Handle unrecognized entries with suggestions

#### 6. **Survey Flow Component**

- **File**: `src/components/survey/SurveyFlow.tsx`
- **Issue**: May need updates to integrate bank recognition data
- **Required Changes**:
  - Integrate bank recognition hook
  - Update data storage to include recognition results
  - Add validation for bank awareness data
  - Handle recognition errors gracefully

### 🟡 **MEDIUM PRIORITY: Data Storage Files**

#### 7. **Storage Utility**

- **File**: `src/utils/storage.ts`
- **Issue**: May need updates to store recognition data
- **Required Changes**:
  - Add storage methods for bank recognition data
  - Implement audit trail for raw inputs vs recognized data
  - Add data validation for bank IDs
  - Ensure backward compatibility

#### 8. **API Integration**

- **File**: `src/utils/api.ts`
- **Issue**: May need updates for bank recognition data transmission
- **Required Changes**:
  - Add API endpoints for bank recognition data
  - Implement data validation for API calls
  - Add error handling for recognition failures

### 🟢 **LOW PRIORITY: Documentation and Testing Files**

#### 9. **Test Files**

- **File**: `src/test/example.test.ts`
- **Issue**: May need bank recognition specific tests
- **Required Changes**:
  - Add integration tests for bank recognition
  - Test edge cases and error scenarios
  - Validate deduplication logic
  - Test pre-selection mechanism

#### 10. **Constants File**

- **File**: `src/constants.ts`
- **Issue**: Need to verify bank data export
- **Required Changes**:
  - Verify ALL_BANKS is properly exported
  - Check import path in bankRecognition.ts
  - Ensure bank data structure is correct

### 🔧 **Additional Files for Enhancement**

#### 11. **UI Components**

- **Files**:
  - `src/components/ui/badge.tsx` (for confidence indicators)
  - `src/components/ui/command.tsx` (for bank suggestions)
  - `src/components/ui/sonner.tsx` (for recognition feedback)
- **Required Changes**:
  - Add bank recognition specific UI components
  - Implement confidence level indicators
  - Add loading states for recognition processing

#### 12. **Validation Files**

- **File**: `src/utils/validation.ts`
- **Issue**: May need bank-specific validation
- **Required Changes**:
  - Add bank recognition data validation
  - Implement confidence threshold validation
  - Add data integrity checks

## Implementation Priority Order

### **Phase 1: Fix Core Issues (CRITICAL)**

1. `tsconfig.json` - Fix module resolution
2. `tsconfig.app.json` - Verify build configuration
3. `vite.config.ts` - Check build process
4. `package.json` - Verify dependencies
5. `src/utils/bankRecognition.ts` - Fix exports

### **Phase 2: Fix Integration (HIGH PRIORITY)**

6. `src/hooks/useBankRecognition.ts` - Fix imports
7. `src/components/survey/QuestionRenderer.tsx` - Add recognition UI
8. `src/components/survey/SurveyFlow.tsx` - Integrate recognition data

### **Phase 3: Data Integration (MEDIUM PRIORITY)**

9. `src/utils/storage.ts` - Add recognition data storage
10. `src/utils/api.ts` - Add API integration
11. `src/constants.ts` - Verify bank data export

### **Phase 4: Testing and Enhancement (LOW PRIORITY)**

12. `src/test/example.test.ts` - Add recognition tests
13. UI components - Add recognition-specific UI
14. `src/utils/validation.ts` - Add validation logic

## Quick Fix Checklist

### **Immediate Actions Required**

- [ ] Test import of `src/utils/bankRecognition.ts` directly
- [ ] Verify TypeScript compilation settings
- [ ] Check if `ALL_BANKS` is properly exported from constants
- [ ] Test bank recognition functions in isolation
- [ ] Fix export statements in bankRecognition.ts
- [ ] Update import statements in useBankRecognition.ts

### **Integration Actions**

- [ ] Update QuestionRenderer to use bank recognition hook
- [ ] Add real-time recognition feedback to UI
- [ ] Implement pre-selection and locking mechanism
- [ ] Add confidence indicators and loading states
- [ ] Integrate with storage system
- [ ] Add data validation and sanitization

## File Dependencies

```
tsconfig.json → bankRecognition.ts → useBankRecognition.ts → QuestionRenderer.tsx
     ↓              ↓                    ↓                        ↓
vite.config.ts → constants.ts → SurveyFlow.tsx → storage.ts → api.ts
```

**Note**: All files marked with 🔴 are critical blockers that must be fixed before any other work can proceed.
