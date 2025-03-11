
import { useState, useEffect } from 'react';
import { SettingsState } from './types';

export const useSettingsState = () => {
  // Récupérer les préférences de thème du système
  const getSystemTheme = (): 'light' | 'dark' => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  };

  // Initialiser l'état avec les valeurs stockées dans localStorage ou les valeurs par défaut
  const [settings, setSettings] = useState<SettingsState>(() => {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    return {
      theme: getSystemTheme()
    };
  });

  // Mettre à jour le localStorage quand les paramètres changent
  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    
    // Appliquer la classe theme au document
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  // Basculer entre le thème clair et sombre
  const toggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }));
  };

  return {
    settings,
    toggleTheme
  };
};
