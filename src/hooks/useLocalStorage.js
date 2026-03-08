import { useState, useEffect } from 'react';

export default function useLocalStorage(key, initialValue) {
  // State inicial a partir do localStorage
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Erro ao carregar do localStorage:', error);
      return initialValue;
    }
  });

  // Salvar no localStorage sempre que o valor mudar
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
