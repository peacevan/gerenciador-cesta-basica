import { useState, useEffect, useRef, useCallback } from 'react';

// Parser de comandos de voz
function parseVoiceCommand(texto) {
  texto = texto.toLowerCase()
    .replace(/^(adicionar|adiciona|colocar|coloca|põe)\s+/i, '')
    .trim();

  const patterns = [
    // "arroz 5 quilos 25 reais e 50"
    /^(.+?)\s+(\d+(?:[,\.]\d+)?)\s*(kg|quilos?|lt|litros?|un|unidades?|dúz|dúzias?)\s+(\d+)\s*reais?\s*e\s*(\d+)/i,
    // "arroz 5 quilos 25 reais"
    /^(.+?)\s+(\d+(?:[,\.]\d+)?)\s*(kg|quilos?|lt|litros?|un|unidades?|dúz|dúzias?)\s+(\d+(?:[,\.]\d+)?)\s*reais?/i,
    // "arroz 5 kg 25"
    /^(.+?)\s+(\d+(?:[,\.]\d+)?)\s*(kg|lt|un|dúz)\s+(\d+(?:[,\.]\d+)?)/i,
  ];

  for (let pattern of patterns) {
    const match = texto.match(pattern);
    if (match) {
      return {
        nome: match[1].trim(),
        quantidade: parseFloat(match[2].replace(',', '.')),
        unidade: normalizarUnidade(match[3]),
        preco: match[5]
          ? parseFloat(match[4]) + parseFloat(match[5].padStart(2, '0')) / 100
          : parseFloat(match[4].replace(',', '.'))
      };
    }
  }

  return null;
}

function normalizarUnidade(unidade) {
  const mapa = {
    'quilos': 'kg', 'quilo': 'kg',
    'litros': 'lt', 'litro': 'lt',
    'unidades': 'un', 'unidade': 'un',
    'dúzias': 'dúz', 'dúzia': 'dúz'
  };
  return mapa[unidade.toLowerCase()] || unidade.toLowerCase();
}

export default function useVoiceRecognition(onItemRecognized) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const recognitionRef = useRef(null);

  // Inicializar reconhecimento de voz
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setFeedback({
        message: 'Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.',
        type: 'error'
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setFeedback({ message: '🎤 Estou ouvindo...', type: 'info' });
    };

    recognition.onresult = (event) => {
      const current = event.results[0][0].transcript;
      setTranscript(current);
      setFeedback({ message: `Ouvi: "${current}"`, type: 'info' });

      if (event.results[0].isFinal) {
        const parsed = parseVoiceCommand(current);

        if (parsed) {
          onItemRecognized(parsed);
          setFeedback({
            message: '✅ Item adicionado com sucesso!',
            type: 'success'
          });
          setTranscript('');
        } else {
          setFeedback({
            message: '❌ Não entendi. Tente: "arroz 5 quilos 25 reais"',
            type: 'error'
          });
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        setFeedback({
          message: '⚠️ Nenhuma fala detectada',
          type: 'warning'
        });
      } else if (event.error === 'not-allowed') {
        setFeedback({
          message: '❌ Permissão de microfone negada',
          type: 'error'
        });
      } else {
        setFeedback({
          message: `❌ Erro: ${event.error}`,
          type: 'error'
        });
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Limpar feedback após 3 segundos
      setTimeout(() => {
        setFeedback({ message: '', type: '' });
        setTranscript('');
      }, 3000);
    };

    recognitionRef.current = recognition;
  }, [onItemRecognized]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    feedback,
    startListening,
    stopListening
  };
}
