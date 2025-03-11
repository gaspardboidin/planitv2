
// This file now serves as an entry point to maintain backward compatibility
// All functionality has been refactored into smaller modules in the finance/ directory

export { 
  loadFinanceData, 
  syncFinanceData, 
  fetchFinanceData, 
  saveFinanceData, 
  initializeFinanceData 
} from './finance/index';
