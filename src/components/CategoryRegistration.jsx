import React, { useState } from 'react';
import Dexie from 'dexie';
import M from 'materialize-css';

// Initialize IndexedDB using Dexie
const db = new Dexie("SmartListDB");
db.version(1).stores({
    categories: "++id, name"
});

const CategoryRegistration = () => {
    const [category, setCategory] = useState('');

    const clearField = () => {
        setCategory('');
    };

    const handleSaveCategory = async () => {
        if (category) {
            await db.categories.add({ name: category.toUpperCase() });
            M.toast({ html: 'Categoria cadastrada com sucesso!', classes: 'green' });
            clearField();
        } else {
            M.toast({ html: 'Preencha o campo de categoria!', classes: 'red' });
        }
    };

    return (
        <div className="container">
            <h4 className="center-align">Cadastro de Categoria</h4>
            <form>
                <div className="input-field">
                    <input
                        id="category"
                        name="category"
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    />
                    <label htmlFor="category">Nome da Categoria</label>
                </div>
                <div className="center-align">
                    <button
                        type="button"
                        className="waves-effect waves-light btn green"
                        onClick={handleSaveCategory}
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

export default CategoryRegistration;
