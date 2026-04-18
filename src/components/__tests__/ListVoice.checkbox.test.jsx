/**
 * Testes de componente para o comportamento do checkbox / total no ListVoice.
 * BUG-013: marcar checkbox deve atualizar `comprado` e o footer deve refletir o total.
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

// ── Mocks necessários ────────────────────────────────────────

jest.mock('../../styles/ListVoice.css', () => ({}));

// Mocks de hooks/componentes que não são o alvo do teste
jest.mock('../../hooks/useTheme', () => () => ({ toggleTheme: jest.fn(), isDark: false }));
jest.mock('../../hooks/useHistorico', () => () => ({
  registrar: jest.fn(),
  buscar: jest.fn(() => []),
  salvarSnapshot: jest.fn(() => ({ label: 'snap' })),
  listarSnapshots: jest.fn(() => []),
  excluirSnapshot: jest.fn(),
  carregarSnapshot: jest.fn(),
}));
jest.mock('../../hooks/useLLMParser', () => ({
  interpretar: jest.fn(),
  ultimoProvedorUsado: 'regex',
  PROVEDOR_ATIVO: 'regex',
}));
jest.mock('../../hooks/usePerfilFamiliar', () => () => ({
  carregarPerfil: jest.fn(() => ({ adultos: 2, criancas: 0 })),
  aplicarPerfil: jest.fn((itens) => itens),
}));
jest.mock('../../hooks/useTemplates', () => () => ({
  listarTemplates: jest.fn(() => []),
}));
jest.mock('../CardUltimoTemplate', () => () => null);
jest.mock('../ChipSugestao', () => {
  const mock = () => null;
  mock.getSugestao = jest.fn(() => null);
  return mock;
});
jest.mock('../VoiceFeedback', () => () => null);
jest.mock('../ModalTextoLivre', () => () => null);
jest.mock('../ModalConfirmacao', () => () => null);
jest.mock('../NotaFiscalUpload', () => () => null);
jest.mock('../ModalEstabelecimento', () => () => null);
jest.mock('../HistoricoPanel', () => () => null);
jest.mock('../ModalTemplates', () => () => null);
jest.mock('../ModalPerfilFamiliar', () => () => null);
jest.mock('../AutocompleteInput', () => ({ value, onChange, placeholder, onEnter }) => (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    onKeyDown={(e) => e.key === 'Enter' && onEnter && onEnter(e)}
  />
));

// ── Mock principal de useVoiceRecognition ────────────────────
jest.mock('../../hooks/useVoiceRecognition');
import useVoiceRecognition from '../../hooks/useVoiceRecognition';

import ListVoice from '../ListVoice';

// ── Helpers ──────────────────────────────────────────────────

const makeHookReturn = (overrides = {}) => ({
  itens: [],
  total: 0,
  totalGeral: 0,
  isListening: false,
  isProcessing: false,
  transcript: '',
  feedback: null,
  startListening: jest.fn(),
  stopListening: jest.fn(),
  removerItem: jest.fn(),
  atualizarPreco: jest.fn(),
  marcarItem: jest.fn(),
  limparLista: jest.fn(),
  adicionarManual: jest.fn(),
  ambiguousCommands: [],
  clearAmbiguous: jest.fn(),
  ...overrides,
});

// ── Testes ───────────────────────────────────────────────────

describe('ListVoice – checkbox (BUG-013)', () => {
  beforeEach(() => jest.resetAllMocks());

  test('renderiza checkbox controlado para cada item da lista', () => {
    const itens = [
      { id: '1', nome: 'Arroz', quantidade: 2, unidade: 'kg', preco: 10, comprado: false },
      { id: '2', nome: 'Feijão', quantidade: 1, unidade: 'kg', preco: 8, comprado: true },
    ];
    useVoiceRecognition.mockReturnValue(makeHookReturn({ itens, total: 8, totalGeral: 28 }));

    render(<ListVoice />);

    const checkboxes = screen.getAllByRole('checkbox');
    // Deve haver um checkbox por item na tabela (ignora checkboxes de outros componentes)
    const itemCheckboxes = checkboxes.filter(cb =>
      cb.getAttribute('aria-label')?.startsWith('Marcar')
    );
    expect(itemCheckboxes).toHaveLength(2);
    expect(itemCheckboxes[0].checked).toBe(false); // Arroz
    expect(itemCheckboxes[1].checked).toBe(true);  // Feijão
  });

  test('clicar no checkbox chama marcarItem com o id correto', () => {
    const marcarItem = jest.fn();
    const itens = [
      { id: 'abc-123', nome: 'Arroz', quantidade: 1, unidade: 'kg', preco: 10, comprado: false },
    ];
    useVoiceRecognition.mockReturnValue(makeHookReturn({ itens, marcarItem }));

    render(<ListVoice />);

    const checkbox = screen.getByRole('checkbox', { name: /Marcar Arroz/i });
    fireEvent.click(checkbox);

    expect(marcarItem).toHaveBeenCalledTimes(1);
    expect(marcarItem).toHaveBeenCalledWith('abc-123');
  });

  test('footer exibe total dos marcados (R$ 10,00 quando apenas arroz está marcado)', () => {
    const itens = [
      { id: '1', nome: 'Arroz', quantidade: 1, unidade: 'kg', preco: 10, comprado: true },
      { id: '2', nome: 'Feijão', quantidade: 1, unidade: 'kg', preco: 8, comprado: false },
    ];
    // total = 10 (só marcados), totalGeral = 18
    useVoiceRecognition.mockReturnValue(makeHookReturn({ itens, total: 10, totalGeral: 18 }));

    render(<ListVoice />);

    // O footer deve mostrar o total dos marcados via aria-label
    const footerTotal = screen.getByLabelText('Total dos itens marcados');
    expect(footerTotal.textContent).toMatch(/10[,.]00/);
    // Confirmar que o footer conta 1 / 2 itens
    expect(screen.getByText(/1.*\/.*2.*itens/i, { selector: 'p' })).toBeTruthy();
  });

  test('footer não exibe "Total geral" quando todos os itens estão marcados', () => {
    const itens = [
      { id: '1', nome: 'Arroz', quantidade: 1, unidade: 'kg', preco: 10, comprado: true },
    ];
    // total == totalGeral, qtdMarcados == qtdTotal → não deve exibir linha extra
    useVoiceRecognition.mockReturnValue(makeHookReturn({ itens, total: 10, totalGeral: 10 }));

    render(<ListVoice />);

    expect(screen.queryByText(/Total geral/i)).toBeNull();
  });

  test('item com comprado=false tem classe "unchecked" na linha da tabela', () => {
    const itens = [
      { id: '1', nome: 'Leite', quantidade: 1, unidade: 'lt', preco: 5, comprado: false },
    ];
    useVoiceRecognition.mockReturnValue(makeHookReturn({ itens }));

    const { container } = render(<ListVoice />);
    const row = container.querySelector('div.items-row.unchecked');
    expect(row).not.toBeNull();
  });

  test('item com comprado=true tem classe "checked" na linha da tabela', () => {
    const itens = [
      { id: '1', nome: 'Leite', quantidade: 1, unidade: 'lt', preco: 5, comprado: true },
    ];
    useVoiceRecognition.mockReturnValue(makeHookReturn({ itens, total: 5, totalGeral: 5 }));

    const { container } = render(<ListVoice />);
    const row = container.querySelector('div.items-row.checked');
    expect(row).not.toBeNull();
  });
});
