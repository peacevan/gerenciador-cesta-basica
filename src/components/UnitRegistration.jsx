import React, { useState } from 'react';
import Dexie from 'dexie';
import M from 'materialize-css';

// Initialize IndexedDB using Dexie
const db = new Dexie("SmartListDB");
db.version(210).stores({
    products: "++id, name, price, category",
    items: "++id, name, price, quantity, unit, checked",
    categories: "++id, name",
    units: "++id, name"
});

const UnitRegistration = () => {
    const [unit, setUnit] = useState('');

    const clearField = () => {
        setUnit('');
    };

    const handleSaveUnit = async () => {
        if (unit) {
            await db.units.add({ name: unit.toUpperCase() });
            M.toast({ html: 'Unidade cadastrada com sucesso!', classes: 'green' });
            clearField();
        } else {
            M.toast({ html: 'Preencha o campo de unidade!', classes: 'red' });
        }
    };

    return (
        <div className="container">
            <h4 className="center-align">Cadastro de Unidade</h4>
            <form>
                <div className="input-field">
                    <input
                        id="unit"
                        name="unit"
                        type="text"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                    />
                    <label htmlFor="unit">Nome da Unidade</label>
                </div>
                <div className="center-align">
                    <button
                        type="button"
                        className="waves-effect waves-light btn green"
                        onClick={handleSaveUnit}
                    >
                        <i className="material-icons left">check</i>Salvar
                    </button>
                    <button
                        type="button"
                        className="waves-effect waves-light btn red"
                        onClick={clearField}
                        style={{ marginLeft: '10px' }}
                    >
                        <i className="material-icons left">close</i>Limpar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UnitRegistration;
