import React, { useState } from 'react';
import 'materialize-css/dist/css/materialize.min.css';

const CreateFromVoice = () => {
    const [nome, setNome] = useState('');
    const [preco, setPreco] = useState('');
    const [isRecordingNome, setIsRecordingNome] = useState(false);
    const [isRecordingPreco, setIsRecordingPreco] = useState(false);
    const [lista, setLista] = useState([]);

    const handleAddToList = () => {
        if (nome && preco) {
            setLista([...lista, { nome, preco }]);
            setNome('');
            setPreco('');
        }
    };

    return (
        <div className="container" style={{ marginTop: '20px' }}>
            <div className="row">
                <div className="input-field col s7">
                    <input
                        id="nome"
                        type="text"
                        placeholder="Nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                    />
                    <label htmlFor="nome" className="active">Nome</label>
                </div>
                <div className="col s1">
                    <button
                        className={`btn btn-small ${isRecordingNome ? 'red' : 'blue'}`}
                        onClick={() => setIsRecordingNome(!isRecordingNome)}
                        style={{ marginTop: '20px' }}
                    >
                        {isRecordingNome ? '🎙️' : '🎤'}
                    </button>
                </div>
                <div className="input-field col s3">
                    <input
                        id="preco"
                        type="text"
                        placeholder="Preço"
                        value={preco}
                        onChange={(e) => setPreco(e.target.value)}
                    />
                    <label htmlFor="preco" className="active">Preço</label>
                </div>
                <div className="col s1">
                    <button
                        className={`btn btn-small ${isRecordingPreco ? 'red' : 'blue'}`}
                        onClick={() => setIsRecordingPreco(!isRecordingPreco)}
                        style={{ marginTop: '20px' }}
                    >
                        {isRecordingPreco ? '🎙️' : '🎤'}
                    </button>
                </div>
            </div>
            <div className="row">
                <button className="btn green" onClick={handleAddToList}>
                    <i className="material-icons">add</i>
                </button>
            </div>
            <ul className="collection" style={{ marginTop: '20px' }}>
                {lista.map((item, index) => (
                    <li key={index} className="collection-item">
                        {item.nome} - {item.preco}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CreateFromVoice;
