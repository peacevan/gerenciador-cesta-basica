import { useState, useEffect, useCallback, useRef } from 'react';
import { interpretar, ultimoProvedorUsado as parserUltimo, PROVEDOR_ATIVO } from './useLLMParser';
import useShoppingList from './useShoppingList';
import useHistorico from './useHistorico';

// US-010: log frases não reconhecidas (localStorage, max 50 FIFO)
function logUnrecognized(phrase) {
  try {
    const KEY = 'smartlist:unrecognized';
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift({ phrase, ts: new Date().toISOString() });
    if (list.length > 50) list.splice(50);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (e) {}
}

export default function useVoiceRecognition() {
  const {
    itens, total, totalGeral, adicionarManual, removerItem,
    atualizarPreco, atualizarItem, marcarItem, limparLista, processarComandos,
  } = useShoppingList();
  const { registrar } = useHistorico();

  const [ambiguousCommands, setAmbiguousCommands] = useState([]);
  const CONFIDENCE_THRESHOLD = 0.75;
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [provedorAtivo, setProvedorAtivo] = useState('llm');
  const recognitionRef = useRef(null);

  // US-006: debounce ref — aguarda 1.5s de silêncio antes de processar
  const debounceRef = useRef(null);

  // US-015: último item adicionado por voz (para snackbar "Desfazer")
  const [lastVoiceAdded, setLastVoiceAdded] = useState(null);
  const lastVoiceTimerRef = useRef(null);

  // Atalho de teclado (Espaço = toggle gravação)
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        if (isListening) recognitionRef.current?.stop();
        else startListening();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isListening]);

  const showFeedback = (message, type = 'info', duration = 3000) => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), duration);
  };

  // US-015: registra item adicionado por voz — exibe snackbar por 4s
  const setVoiceAdded = (item) => {
    setLastVoiceAdded(item);
    if (lastVoiceTimerRef.current) clearTimeout(lastVoiceTimerRef.current);
    lastVoiceTimerRef.current = setTimeout(() => setLastVoiceAdded(null), 4000);
  };

  const clearVoiceAdded = useCallback(() => {
    if (lastVoiceTimerRef.current) clearTimeout(lastVoiceTimerRef.current);
    setLastVoiceAdded(null);
  }, []);

  // Núcleo de processamento: chamado após texto estabilizado
  const processarTexto = useCallback(async (text) => {
    setIsProcessing(true);
    showFeedback('Interpretando...', 'info', 10000);
    console.log(`%c[VOZ] 🎙️ Transcrição recebida`, 'color:#0066ff;font-weight:bold', { text, online: navigator.onLine });
    try {
      setProvedorAtivo(navigator.onLine ? 'llm' : 'regex');
      const comandos = await interpretar(text);
      console.log('%c[VOZ] 📦 Comandos interpretados', 'color:green;font-weight:bold', comandos);

      // US-005: frase inválida retornada pelo parser
      if (Array.isArray(comandos) && comandos.length > 0 && comandos[0].erro === 'frase_invalida') {
        showFeedback('Não entendi. Tente: arroz 10 reais ou 2 kg arroz 10 reais', 'error', 4000);
        logUnrecognized(text);
        return;
      }

      // US-010: log quando LLM retorna erro de contexto
      if (Array.isArray(comandos) && comandos.length > 0 && comandos[0].erro) {
        showFeedback('Não é um produto de supermercado', 'error', 3000);
        logUnrecognized(text);
        return;
      }

      const hasLowConfidence = Array.isArray(comandos) && comandos.some(c =>
        typeof c.confidence === 'number' ? c.confidence < CONFIDENCE_THRESHOLD : false
      );

      if (hasLowConfidence) {
        setAmbiguousCommands(Array.isArray(comandos) ? comandos : []);
        showFeedback('Confirmação necessária para ações detectadas', 'warning', 4000);
      } else {
        const resumo = processarComandos(comandos);

        // US-010: log confidence muito baixa (< 0.4)
        try {
          const allLow = Array.isArray(comandos) && comandos.length > 0 &&
            comandos.every(c => (c.confidence ?? 1) < 0.4);
          if (allLow) logUnrecognized(text);
        } catch (e) {}

        // Registrar itens no catálogo histórico
        try {
          if (Array.isArray(comandos)) {
            const adicionados = comandos.filter(cmd => cmd && cmd.acao === 'adicionar' && cmd.nome);
            adicionados.forEach(cmd => {
              try {
                registrar({ nome: cmd.nome, unidade: cmd.unidade || 'un', precoUltimo: cmd.preco ?? null });
              } catch (e) { console.warn('registrar falhou:', e); }
            });
            // US-015: snackbar desfazer para o primeiro item adicionado
            if (adicionados.length > 0) {
              const first = adicionados[0];
              const precoStr = first.preco ? ` — R$${parseFloat(first.preco).toFixed(2)}` : '';
              setVoiceAdded({
                nome: first.nome,
                preco: first.preco,
                label: `${first.nome}${precoStr} adicionado`,
              });
            }
          }
        } catch (e) { console.warn('Erro ao registrar itens de voz:', e); }

        if (parserUltimo === 'regex') {
          if (!navigator.onLine) showFeedback('📵 Offline — modo básico ativo', 'warning', 4000);
          else showFeedback('⚠️ Modo básico ativo', 'warning', 4000);
          setProvedorAtivo('regex');
        } else {
          showFeedback(`✓ ${resumo}`, 'success', 4000);
          setProvedorAtivo('llm');
        }
      }
    } catch (err) {
      console.error('Erro interpretar:', err);
      showFeedback('Erro ao interpretar. Tente novamente.', 'error', 4000);
    } finally {
      setIsProcessing(false);
    }
  }, [processarComandos, registrar]);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showFeedback('Navegador não suporta reconhecimento de voz.', 'error'); return; }

    const recognition = new SR();
    recognition.lang = 'pt-BR';
    // US-006: interimResults = true → fragmentos exibidos mas não processados
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      showFeedback('Ouvindo...', 'info', 10000);
    };

    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      const text = last[0].transcript.trim();

      // Atualiza transcript visualmente (fragmento ou final)
      setTranscript(text);

      if (last.isFinal) {
        // US-006: texto final → agenda processamento com debounce 1.5s
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => processarTexto(text), 1500);
      } else {
        // Interim: usuário ainda fala → reseta debounce
        clearTimeout(debounceRef.current);
      }
    };

    recognition.onerror = () => {
      showFeedback('Erro no microfone.', 'error');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Debounce pendente continua correndo (texto já capturado)
    };

    recognition.start();
  }, [processarTexto]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
    // Parada manual: cancela debounce
    clearTimeout(debounceRef.current);
  }, []);

  const clearAmbiguous = useCallback(() => setAmbiguousCommands([]), []);

  return {
    itens, total, totalGeral, adicionarManual, removerItem,
    atualizarPreco, atualizarItem, marcarItem, limparLista,
    isListening, isProcessing, transcript, feedback, provedorAtivo,
    startListening, stopListening, ambiguousCommands, clearAmbiguous,
    // US-015
    lastVoiceAdded, clearVoiceAdded,
  };
}
