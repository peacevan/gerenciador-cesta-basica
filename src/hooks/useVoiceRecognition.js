import { useState, useEffect, useCallback, useRef } from 'react';
import { interpretar, ultimoProvedorUsado as parserUltimo, PROVEDOR_ATIVO } from './useLLMParser';
import useShoppingList from './useShoppingList';
import useHistorico from './useHistorico';

export default function useVoiceRecognition() {
  const { itens, total, adicionarManual, removerItem, atualizarPreco, marcarItem, limparLista, processarComandos } = useShoppingList();
  const { registrar } = useHistorico();
  const [ambiguousCommands, setAmbiguousCommands] = useState([]);
  const CONFIDENCE_THRESHOLD = 0.75;
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [provedorAtivo, setProvedorAtivo] = useState('llm');
  const recognitionRef = useRef(null);

  useEffect(() => { const onKey = (e) => { if (e.code === 'Space' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) { e.preventDefault(); if (isListening) recognitionRef.current?.stop(); else startListening(); } }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [isListening]);

  const showFeedback = (message, type='info', duration=3000) => { setFeedback({ message, type }); setTimeout(() => setFeedback(null), duration); };

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showFeedback('Navegador não suporta reconhecimento de voz.', 'error'); return; }
    const recognition = new SR(); recognition.lang = 'pt-BR'; recognition.interimResults = false; recognition.maxAlternatives = 1; recognitionRef.current = recognition;
    recognition.onstart = () => { setIsListening(true); showFeedback('Ouvindo...', 'info', 10000); };
    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript.trim(); setTranscript(text); setIsProcessing(true); showFeedback('Interpretando...', 'info', 10000);
      try {
        setProvedorAtivo(navigator.onLine ? 'llm' : 'regex');
        const comandos = await interpretar(text);
        // Se qualquer comando tiver confiança baixa, marcar como ambíguo e delegar confirmação à UI
        const hasLowConfidence = Array.isArray(comandos) && comandos.some(c => typeof c.confidence === 'number' ? c.confidence < CONFIDENCE_THRESHOLD : false);
        if (hasLowConfidence) {
          setAmbiguousCommands(Array.isArray(comandos) ? comandos : []);
          showFeedback('Confirmação necessária para ações detectadas', 'warning', 4000);
        } else {
          const resumo = processarComandos(comandos);
          // Registrar itens adicionados via voz no catálogo histórico
          try {
            if (Array.isArray(comandos)) {
              comandos.forEach(cmd => {
                if (cmd && cmd.acao === 'adicionar' && cmd.nome) {
                  try { registrar({ nome: cmd.nome, unidade: cmd.unidade || 'un', precoUltimo: cmd.preco ?? null }); } catch (e) { console.warn('registrar falhou:', e); }
                }
              });
            }
          } catch (e) { console.warn('Erro ao registrar itens de voz:', e); }
          if (parserUltimo === 'regex') { if (!navigator.onLine) showFeedback('📵 Offline — modo básico ativo','warning',4000); else showFeedback('⚠️ Modo básico ativo','warning',4000); setProvedorAtivo('regex'); }
          else { showFeedback(`✓ ${resumo}`,'success',4000); setProvedorAtivo('llm'); }
        }
      } catch (err) { console.error('Erro interpretar:', err); showFeedback('Erro ao interpretar. Tente novamente.','error',4000); }
      finally { setIsProcessing(false); }
    };
    recognition.onerror = () => { showFeedback('Erro no microfone.','error'); setIsListening(false); };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }, [processarComandos]);

  const stopListening = useCallback(() => { if (recognitionRef.current) recognitionRef.current.stop(); setIsListening(false); }, []);

  const clearAmbiguous = useCallback(() => setAmbiguousCommands([]), []);

  return { itens, total, adicionarManual, removerItem, atualizarPreco, marcarItem, limparLista, isListening, isProcessing, transcript, feedback, provedorAtivo, startListening, stopListening, ambiguousCommands, clearAmbiguous };
}

