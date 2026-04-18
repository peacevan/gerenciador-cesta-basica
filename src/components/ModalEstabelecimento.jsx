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
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-estabelecimento"
        role="dialog"
        aria-modal="true"
        aria-label="Onde você está comprando?"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h5>
            <i className="material-icons" style={{ verticalAlign: 'middle', marginRight: 6 }}>store</i>
            Onde você está comprando?
          </h5>
          <button className="btn-close-modal" onClick={onClose} aria-label="Fechar">
            <i className="material-icons">close</i>
          </button>
        </div>

        <div className="modal-form estab-form">
          <div className="estab-geo">
            <button
              className="btn-geo"
              onClick={handleUseLocation}
              disabled={loadingGeo}
              aria-label="Usar localização atual"
            >
              <i className="material-icons">my_location</i>
              {loadingGeo ? 'Localizando…' : '📍 Usar minha localização'}
            </button>
            {geoError && <p className="form-error estab-geo__error">{geoError}</p>}
          </div>

          <div className="form-field">
            <label htmlFor="estab-nome">Nome do estabelecimento <span className="field-optional">(opcional)</span></label>
            <input
              id="estab-nome"
              value={nome}
              onChange={(e) => { setNome(e.target.value); setFonte('manual'); }}
              placeholder="Ex: Atacadão Paralela"
            />
          </div>

          <div className="form-field">
            <label htmlFor="estab-endereco">Endereço <span className="field-optional">(opcional)</span></label>
            <input
              id="estab-endereco"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Endereço"
            />
          </div>

          <div className="form-field">
            <label htmlFor="estab-tipo">Tipo <span className="field-optional">(opcional)</span></label>
            <select id="estab-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="supermercado">Supermercado</option>
              <option value="atacado">Atacado</option>
              <option value="feira">Feira</option>
              <option value="outro">Outro</option>
            </select>
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-cancel">Cancelar</button>
          <button onClick={handleSaveWithoutLocal} className="btn-cancel">Sem local</button>
          <button onClick={handleSaveWithLocal} className="btn-submit">
            <i className="material-icons">save</i> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
