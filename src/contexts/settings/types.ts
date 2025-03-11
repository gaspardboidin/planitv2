
export interface SettingsState {
  theme: 'light' | 'dark';
}

export interface SettingsContextType {
  settings: SettingsState;
  toggleTheme: () => void;
}
