import React, { useEffect, useState } from 'react';

// Modal de 2 passos para registrar uma compra
// Props: itens, onSalvar, onFechar
export default function RegistrarCompra({ itens = [], onSalvar, onFechar }) {
  const [step, setStep] = useState(1);
  const [mercado, setMercado] = useState('');
  const [localizacao, setLocalizacao] = useState(null);
  const [locStatus, setLocStatus] = useState('idle'); // 'idle' | 'locating' | 'captured' | 'denied'
  const [precos, setPrecos] = useState(() => itens.map(() => ''));

  // tenta obter geolocalização (se permitida)
  const getLocalizacao = () => {
    if (!navigator.geolocation) {
      setLocStatus('denied');
      return;
    }
    setLocStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocalizacao({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus('captured');
      },
      () => {
        setLocStatus('denied');
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  useEffect(() => {
    // quando o modal abre (componente montado), tenta localizar
    getLocalizacao();
  }, []);

  useEffect(() => {
    // quando itens mudam, resetar o estado de preços com o mesmo tamanho
    setPrecos(itens.map(() => ''));
  }, [itens]);

  const handlePrecoChange = (index, value) => {
    setPrecos((p) => {
      const next = [...p];
      next[index] = value;
      return next;
    });
  };

  const limpar = () => {
    setMercado('');
    setLocalizacao(null);
    setLocStatus('idle');
    setPrecos(itens.map(() => ''));
    setStep(1);
  };

  const fechar = () => {
    limpar();
    if (onFechar) onFechar();
  };

  const salvarCompra = () => {
    const itensComPrecos = itens.map((it, i) => {
      const raw = (precos[i] || '').toString().trim();
      if (!raw) return { ...it, preco: null };
      // normaliza: aceita 1,00 ou 1.00 ou 1
      const num = parseFloat(raw.replace(/[^0-9,.-]/g, '').replace(',', '.'));
      return { ...it, preco: Number.isFinite(num) ? num : null };
    });

    const registro = {
      mercado: mercado.trim(),
      localizacao: localizacao || null,
      dataCompra: new Date().toISOString(),
      itens: itensComPrecos.map(it => ({ nome: it.nome, quantidade: it.quantidade, unidade: it.unidade, preco: it.preco }))
    };

    // salvar no localStorage
    try {
      const raw = localStorage.getItem('historico_compras');
      const arr = raw ? JSON.parse(raw) : [];
      arr.push(registro);
      localStorage.setItem('historico_compras', JSON.stringify(arr));
    } catch (e) {
      // se falhar, não abortar: ainda chamamos onSalvar
      console.warn('Falha ao salvar histórico:', e);
    }

    if (onSalvar) onSalvar(registro);
    limpar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={fechar} />

      <div className="relative bg-white max-w-md w-full mx-4 rounded-2xl shadow-xl z-10">
        <header className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">{step === 1 ? 'Passo 1 de 2 — Mercado' : 'Passo 2 de 2 — Preços'}</h3>
            <p className="text-sm text-gray-500">{step === 1 ? 'Informe onde comprou' : 'Revise e informe preços'}</p>
          </div>
          <button onClick={fechar} aria-label="Fechar" className="text-gray-500 hover:text-gray-700">✕</button>
        </header>

        <main className="p-4">
          <div className="mb-3 text-sm text-gray-600">{`Passo ${step} de 2`}</div>

          {step === 1 && (
            <div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700">Localização</label>
                <div className="mt-2 text-sm text-gray-600">
                  {locStatus === 'locating' && '📍 Localizando...'}
                  {locStatus === 'captured' && `📍 Localização capturada (${localizacao.lat.toFixed(4)}, ${localizacao.lng.toFixed(4)})`}
                  {locStatus === 'denied' && '⚠️ Permissão de localização negada ou indisponível.'}
                  {locStatus === 'idle' && 'Você pode permitir a localização para capturar o local.'}
                </div>
                <div className="mt-2">
                  <button type="button" onClick={getLocalizacao} className="px-3 py-1 text-sm bg-gray-100 rounded">Tentar novamente</button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Nome do mercado <span className="text-red-500">*</span></label>
                <input
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={mercado}
                  onChange={(e) => setMercado(e.target.value)}
                  placeholder="Ex: Supermercado Central"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={fechar} className="px-4 py-2 rounded-md text-sm border">Cancelar</button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!mercado.trim()}
                  className={`px-4 py-2 rounded-md text-sm text-white ${mercado.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}
                >Continuar</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="space-y-3">
                {itens.length === 0 && <div className="text-sm text-gray-500">Nenhum item na lista.</div>}
                {itens.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between border p-3 rounded">
                    <div className="mr-3">
                      <div className="text-sm font-medium">{it.nome}</div>
                      <div className="text-xs text-gray-500">{`${it.quantidade} ${it.unidade}`}</div>
                    </div>
                    <div className="w-36">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={precos[idx]}
                        onChange={(e) => handlePrecoChange(idx, e.target.value)}
                        className="w-full rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-between">
                <button onClick={() => setStep(1)} className="px-4 py-2 rounded-md border">Voltar</button>
                <div className="flex gap-2">
                  <button onClick={fechar} className="px-4 py-2 rounded-md text-sm border">Cancelar</button>
                  <button onClick={salvarCompra} className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Salvar Compra</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
