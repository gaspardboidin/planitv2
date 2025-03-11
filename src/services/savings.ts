
// This file now serves as an entry point to maintain backward compatibility
// All functionality has been refactored into smaller modules in the savings/ directory

export { 
  fetchSavingsAccounts, 
  createSavingsAccount, 
  updateSavingsAccount, 
  deleteSavingsAccount,
  fetchSavingsTransactions,
  addSavingsTransaction,
  deleteSavingsTransaction,
  moveSavingsToAccount,
  distributeAndTransferSavings,
  saveSavingsDistributionPlan,
  getSavingsDistributionPlan,
  getFutureDistributedSavings,
  deleteAllSavingsDistributionPlans,
  monthNames
} from './savings/index';
