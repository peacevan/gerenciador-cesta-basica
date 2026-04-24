import React, { useState } from 'react';

const TIPO_OPTIONS = [
  { value: 'supermercado', label: 'Supermercado' },
  { value: 'mercadinho',   label: 'Mercadinho'   },
  { value: 'feira',        label: 'Feira'        },
  { value: 'atacado',      label: 'Atacado'      },
  { value: 'outro',        label: 'Outro'        },
];

export default function ModalEstabelecimento({ isOpen, onClose, onConfirm }) {
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [tipo, setTipo] = useState('supermercado');
  const [fonte, setFonte] = useState('manual');
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [nearbyPlaces, setNearbyPlaces] = useState([]);

  if (!isOpen) return null;

  const handleUseLocation = () => {
    if (!navigator || !navigator.geolocation) {
      setGeoError('Geolocalização não disponível neste navegador.');
      return;
    }
    setLoadingGeo(true);
    setGeoError('');
    setNearbyPlaces([]);
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
        // nearby search via Nominatim
        try {
          const delta = 0.01;
          const viewbox = `${longitude - delta},${latitude + delta},${longitude + delta},${latitude - delta}`;
          const nearUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=5&viewbox=${viewbox}&bounded=1&q=supermercado+mercado+atacado`;
          const nearRes = await fetch(nearUrl, { headers: { 'Accept': 'application/json' } });
          if (nearRes.ok) {
            const nearData = await nearRes.json();
            if (Array.isArray(nearData) && nearData.length > 0) setNearbyPlaces(nearData);
          }
        } catch (e) { console.warn('nearby search failed', e); }
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

  const calcDist = (plat, plng) => {
    if (lat == null || lng == null) return '';
    const R = 6371e3;
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(plat - lat);
    const dLng = toRad(plng - lng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat)) * Math.cos(toRad(plat)) * Math.sin(dLng / 2) ** 2;
    const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return d < 1000 ? `${Math.round(d)} m` : `${(d / 1000).toFixed(1)} km`;
  };

  const handleSelectNearby = (place) => {
    setNome(place.display_name.split(',')[0].trim());
    setEndereco(place.display_name);
    if (place.lat) setLat(parseFloat(place.lat));
    if (place.lon) setLng(parseFloat(place.lon));
    setFonte('gps');
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
    <div className="lv-estab-screen">
      <div className="lv-header lv-header--home">
        <button className="lv-header__back lv-header__icon-btn" onClick={onClose} aria-label="Voltar">
          <i className="material-icons">arrow_back</i>
        </button>
        <h1 className="lv-header__title">Onde você está comprando?</h1>
        <button className="lv-header__icon-btn" onClick={onClose} aria-label="Fechar">
          <i className="material-icons">close</i>
        </button>
      </div>

      <div className="lv-estab-body">
        <div className="lv-estab-geo">
          <button
            className="lv-estab-geo__btn"
            onClick={handleUseLocation}
            disabled={loadingGeo}
            type="button"
            aria-label="Usar localização atual"
          >
            {loadingGeo ? (
              <>
                <span className="lv-estab-spinner" />
                Buscando localização...
              </>
            ) : (
              <>
                <i className="material-icons">my_location</i>
                Usar minha localização
              </>
            )}
          </button>
          {geoError && <p className="lv-estab-geo__error">{geoError}</p>}
        </div>

        <div className="lv-estab-fields">
          <div className="lv-estab-field">
            <label className="lv-estab-label" htmlFor="estab-nome">Nome do estabelecimento</label>
            <input
              className="lv-estab-input"
              id="estab-nome"
              value={nome}
              onChange={(e) => { setNome(e.target.value); setFonte('manual'); }}
              placeholder="Ex: Atacadão Paralela"
            />
          </div>

          <div className="lv-estab-field">
            <label className="lv-estab-label" htmlFor="estab-endereco">Endereço</label>
            <input
              className="lv-estab-input"
              id="estab-endereco"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Endereço"
            />
          </div>

          <div className="lv-estab-field">
            <label className="lv-estab-label">Tipo</label>
            <div className="lv-estab-tipo-chips">
              {TIPO_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`lv-estab-tipo-chip${tipo === value ? ' lv-estab-tipo-chip--selected' : ''}`}
                  onClick={() => setTipo(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {nearbyPlaces.length > 0 && (
          <div className="lv-estab-nearby">
            <p className="lv-estab-nearby__label">PRÓXIMOS A VOCÊ</p>
            <ul className="lv-estab-nearby__list">
              {nearbyPlaces.map((place, i) => (
                <li
                  key={place.place_id || i}
                  className="lv-estab-nearby__item"
                  onClick={() => handleSelectNearby(place)}
                >
                  <span className="lv-estab-nearby__icon-wrap">
                    <i className="material-icons">store</i>
                  </span>
                  <span className="lv-estab-nearby__info">
                    <span className="lv-estab-nearby__name">{place.display_name.split(',')[0].trim()}</span>
                    <span className="lv-estab-nearby__addr">
                      {place.display_name.split(',').slice(1, 3).join(',').trim()}
                      {place.lat && place.lon ? ` · ${calcDist(parseFloat(place.lat), parseFloat(place.lon))}` : ''}
                    </span>
                  </span>
                  <i className="material-icons lv-estab-nearby__chevron">chevron_right</i>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="lv-estab-footer">
        <button className="lv-estab-footer__cancel" onClick={onClose} type="button">Cancelar</button>
        <button className="lv-estab-footer__no-local" onClick={handleSaveWithoutLocal} type="button">Sem local</button>
        <button className="lv-estab-footer__save" onClick={handleSaveWithLocal} type="button">
          <i className="material-icons">check</i>
          Salvar
        </button>
      </div>
    </div>
  );
}
