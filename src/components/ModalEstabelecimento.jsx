import React, { useState } from 'react';

export default function ModalEstabelecimento({ isOpen, onClose, onConfirm }) {
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [tipo, setTipo] = useState('supermercado');
  const [fonte, setFonte] = useState('manual');
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [geoError, setGeoError] = useState('');

  if (!isOpen) return null;

  const handleUseLocation = () => {
    if (!navigator || !navigator.geolocation) {
      setGeoError('Geolocalização não disponível neste navegador.');
      return;
    }
    setLoadingGeo(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        setFonte('gps');
        // reverse geocoding via Nominatim
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          const data = await res.json();
          if (data && data.display_name) {
            setEndereco(data.display_name);
            if (!nome) setNome(data.name || (data.address && (data.address.shop || data.address.neighbourhood || data.address.suburb)) || '');
          }
        }
      } catch (e) {
        console.warn('reverse geocode failed', e);
      } finally {
        setLoadingGeo(false);
      }
    }, (err) => {
      setLoadingGeo(false);
      setGeoError(err && err.message ? String(err.message) : 'Erro ao obter localização');
    }, { enableHighAccuracy: true, timeout: 10000 });
  };

  const handleSaveWithLocal = () => {
    const estabelecimento = {
      nome: nome || null,
      endereco: endereco || null,
      lat: lat != null ? Number(lat) : null,
      lng: lng != null ? Number(lng) : null,
      tipo: tipo || null,
      fonte: fonte || null,
    };
    onConfirm(estabelecimento);
  };

  const handleSaveWithoutLocal = () => onConfirm(null);

  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal" style={modalStyle} role="dialog" aria-modal="true" aria-label="Onde você está comprando?">
        <h3>Onde você está comprando?</h3>

        <div style={{ marginBottom: 8 }}>
          <button onClick={handleUseLocation} disabled={loadingGeo} className="btn">
            📍 Usar minha localização{loadingGeo ? '…' : ''}
          </button>
          {geoError ? <div style={{ color: 'red', marginTop: 6 }}>{geoError}</div> : null}
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Nome do estabelecimento (opcional)</label>
          <input value={nome} onChange={(e) => { setNome(e.target.value); setFonte('manual'); }} placeholder="Ex: Atacadão Paralela" />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Endereço (opcional)</label>
          <input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Endereço" />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Tipo (opcional)</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="supermercado">supermercado</option>
            <option value="atacado">atacado</option>
            <option value="feira">feira</option>
            <option value="outro">outro</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={handleSaveWithLocal} className="btn btn-primary">Salvar com local</button>
          <button onClick={handleSaveWithoutLocal} className="btn">Salvar sem local</button>
          <button onClick={onClose} className="btn btn-link">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 };
const modalStyle = { background: '#fff', padding: 16, borderRadius: 6, width: 'min(720px, 96%)', boxShadow: '0 6px 24px rgba(0,0,0,0.2)' };
