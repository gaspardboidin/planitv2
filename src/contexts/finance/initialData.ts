// Add the missing export for initialState to fix the import error
export const initialState = {
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  userId: "",
  budgets: {},
  accounts: ['Courant', 'Espèces', 'Carte bancaire'],
  categories: ['Alimentation', 'Transport', 'Loisirs', 'Santé', 'Logement', 'Habillement', 'Autres']
};
