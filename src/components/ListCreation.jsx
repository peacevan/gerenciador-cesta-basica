import React from 'react';
import { useNavigate } from 'react-router-dom';

const ListCreation = () => {
    const navigate = useNavigate();

    const options = [
        { title: "Digitação Manual", description: "Crie sua lista digitando os itens manualmente.", path: "/create-from-scratch" },
        { title: "Comando de Voz", description: "Use comandos de voz para criar sua lista.", path: "/create-from-voice" },
        { title: "Importação de Lista Anterior", description: "Importe listas de compras anteriores.", path: "/create-from-history" },
        { title: "Lista por CRC (Câmera)", description: "Use a câmera para escanear códigos de barras.", path: "/create-from-camera" },
        { title: "Adicionar Produto via Fotos", description: "Adicione produtos tirando fotos.", path: "/create-from-photos" },
    ];

    return (
        <div className="container">
            <h4>Escolha uma Forma de Criar sua Lista</h4>
            <div className="row">
                {options.map((option, index) => (
                    <div className="col s12 m6 l4" key={index}>
                        <div className="card">
                            <div className="card-content">
                                <span className="card-title">{option.title}</span>
                                <p>{option.description}</p>
                            </div>
                            <div className="card-action">
                                <button
                                    className="btn waves-effect waves-light"
                                    onClick={() => navigate(option.path)}
                                >
                                    Selecionar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ListCreation;
