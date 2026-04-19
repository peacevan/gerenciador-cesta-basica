import React, { useState } from 'react';
import usePerfilFamiliar from '../hooks/usePerfilFamiliar';

const STEPS = ['pessoas', 'bebe', 'economico'];

const ModalPerfilFamiliar = ({ isOpen, onClose }) => {
  const { salvarPerfil } = usePerfilFamiliar();
  const [step, setStep] = useState(0);
  const [pessoas, setPessoas] = useState(null);
  const [temBebe, setTemBebe] = useState(null);
  const [perfilEconomico, setPerfilEconomico] = useState(null);

  if (!isOpen) return null;

  const handleSalvar = () => {
    const perfil = {
      pessoas: pessoas || 2,
      temBebe: temBebe ?? false,
      perfilEconomico: perfilEconomico || 'equilibrado',
    };
    salvarPerfil(perfil);
    onClose(perfil);
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else handleSalvar();
  };

  const canNext =
    (step === 0 && pessoas !== null) ||
    (step === 1 && temBebe !== null) ||
    (step === 2 && perfilEconomico !== null);

  const optionStyle = (active) => ({
    padding: '12px 20px',
    borderRadius: '12px',
    border: `2px solid ${active ? 'var(--accent-primary)' : 'var(--divider)'}`,
    background: active ? 'rgba(76,175,80,0.15)' : 'var(--bg-tertiary)',
    color: active ? 'var(--accent-text)' : 'var(--text-primary)',
    cursor: 'pointer',
    fontWeight: active ? 700 : 500,
    fontSize: '15px',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: '20px',
          maxWidth: '420px',
          width: '92%',
          padding: '0',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          border: '1px solid var(--divider)',
          overflow: 'hidden',
          animation: 'slideUp 0.3s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            padding: '20px 24px',
            color: '#fff',
          }}
        >
          <div style={{ fontSize: '28px', marginBottom: '4px' }}>👋</div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Bem-vindo!</h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.9 }}>
            3 perguntas rápidas para personalizar suas listas
          </p>
          {/* Progress dots */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '14px' }}>
            {STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: i <= step ? '#fff' : 'rgba(255,255,255,0.3)',
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 24px' }}>
          {/* Pergunta 1 */}
          {step === 0 && (
            <div>
              <p style={{ margin: '0 0 20px', fontWeight: 600, fontSize: '17px', color: 'var(--text-primary)' }}>
                Quantas pessoas na sua casa?
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[
                  { label: '1', valor: 1 },
                  { label: '2', valor: 2 },
                  { label: '3-4', valor: 4 },
                  { label: '5+', valor: 5 },
                ].map(({ label, valor }) => (
                  <button
                    key={valor}
                    style={optionStyle(pessoas === valor)}
                    onClick={() => setPessoas(valor)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pergunta 2 */}
          {step === 1 && (
            <div>
              <p style={{ margin: '0 0 20px', fontWeight: 600, fontSize: '17px', color: 'var(--text-primary)' }}>
                Tem criança ou bebê em casa?
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[
                  { label: '👶 Sim', valor: true },
                  { label: '🙅 Não', valor: false },
                ].map(({ label, valor }) => (
                  <button
                    key={String(valor)}
                    style={{ ...optionStyle(temBebe === valor), flex: 1, justifyContent: 'center' }}
                    onClick={() => setTemBebe(valor)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pergunta 3 */}
          {step === 2 && (
            <div>
              <p style={{ margin: '0 0 20px', fontWeight: 600, fontSize: '17px', color: 'var(--text-primary)' }}>
                Como você costuma comprar?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: '💰 Econômica', sub: 'Foco em preço e quantidade', valor: 'economico' },
                  { label: '⚖️ Equilibrada', sub: 'Custo-benefício balanceado', valor: 'equilibrado' },
                  { label: '🌿 Premium', sub: 'Qualidade em primeiro lugar', valor: 'premium' },
                ].map(({ label, sub, valor }) => (
                  <button
                    key={valor}
                    style={{
                      ...optionStyle(perfilEconomico === valor),
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '2px',
                    }}
                    onClick={() => setPerfilEconomico(valor)}
                  >
                    <span>{label}</span>
                    <span style={{ fontSize: '12px', opacity: 0.7, fontWeight: 400 }}>{sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px 24px',
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
            borderTop: '1px solid var(--divider)',
          }}
        >
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              style={{
                padding: '12px 20px',
                borderRadius: '10px',
                border: '1px solid var(--divider)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              ← Voltar
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canNext}
            style={{
              flex: 1,
              padding: '13px 24px',
              borderRadius: '10px',
              border: 'none',
              background: canNext
                ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                : 'var(--bg-tertiary)',
              color: canNext ? '#fff' : 'var(--text-disabled)',
              fontWeight: 700,
              fontSize: '15px',
              cursor: canNext ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            {step < STEPS.length - 1 ? 'Próximo →' : '✓ Salvar e começar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalPerfilFamiliar;
