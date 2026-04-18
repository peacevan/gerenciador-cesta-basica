import { useState, useCallback, useRef } from 'react';

const wordsToNumbers = (word) => {
  const map = {
    um: 1, uma: 1, dois: 2, duas: 2, três: 3, tres: 3,
    quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10
  };
  return map[word.toLowerCase()] ?? null;
};

const parseVoiceInput = (input) => {
  const parts = input.trim().split(/\s+/);
  let quantidade = 1;
  let preco = '';
  let unidade = 'un';

  if (parts.length === 0) return null;

  // Parse quantity from first word
  if (!isNaN(parts[0])) {
    quantidade = parseFloat(parts[0]);
    parts.shift();
  } else {
    const num = wordsToNumbers(parts[0]);
    if (num !== null) {
      quantidade = num;
      parts.shift();
    }
  }

  // Parse unit if present
  const units = ['kg', 'lt', 'litro', 'litros', 'un', 'unidade', 'dúz', 'duzia', 'dúzia', 'g', 'ml'];
  if (parts.length > 0 && units.includes(parts[parts.length - 1].toLowerCase())) {
    unidade = parts.pop().toLowerCase();
  }

  // Parse price from last word
  if (parts.length > 0) {
    const lastPart = parts[parts.length - 1];
    if (/^[\d.,]+$/.test(lastPart)) {
      preco = parseFloat(lastPart.replace(',', '.'));
      parts.pop();
    }
  }

  const nome = parts.join(' ').trim();
  if (!nome) return null;

  return { nome, quantidade, unidade, preco: preco || '' };
};

export default function useVoiceRecognition(onItemRecognized) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState(null);
  const recognitionRef = useRef(null);

  const showFeedback = (message, type = 'info', duration = 3000) => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), duration);
  };

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showFeedback('Seu navegador não suporta reconhecimento de voz.', 'error');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      showFeedback('Ouvindo... Fale o produto', 'info', 10000);
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript.trim();
      setTranscript(text);

      const parsed = parseVoiceInput(text);
      if (parsed && parsed.nome) {
        showFeedback(`"${parsed.nome}" adicionado!`, 'success');
        onItemRecognized(parsed);
      } else {
        showFeedback('Não entendi. Tente: "2 arroz 5.50"', 'warning');
      }
    };

    recognition.onerror = (event) => {
      console.error('Erro no reconhecimento de voz:', event.error);
      showFeedback('Erro no reconhecimento de voz.', 'error');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [onItemRecognized]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  return { isListening, transcript, feedback, startListening, stopListening };
}
