
// Export all functionality from the modular files
export {
  fetchSavingsAccounts,
  createSavingsAccount,
  updateSavingsAccount,
  deleteSavingsAccount
} from './accounts';

export {
  fetchSavingsTransactions,
  addSavingsTransaction,
  deleteSavingsTransaction
} from './transactions';

export {
  moveSavingsToAccount,
  distributeAndTransferSavings
} from './transfers';

export {
  saveSavingsDistributionPlan,
  getSavingsDistributionPlan,
  getFutureDistributedSavings,
  deleteAllSavingsDistributionPlans
} from './distribution';

// Re-export the util functions
export { monthNames } from './utils';
