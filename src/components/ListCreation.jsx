import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';

const ListCreation = () => {
    const navigate = useNavigate();

    const options = [
        { title: "Digitação Manual", description: "Crie sua lista digitando os itens manualmente.", path: "/create-from-scratch", icon: "edit" },
        { title: "Comando de Voz", description: "Use comandos de voz para criar sua lista.", path: "/create-from-voice", icon: "mic" },
        { title: "Importação de Lista Anterior", description: "Importe listas de compras anteriores.", path: "/create-from-history", icon: "history" },
        { title: "Lista por CRC (Câmera)", description: "Use a câmera para escanear códigos de barras.", path: "/create-from-camera", icon: "camera_alt" },
        { title: "Adicionar Produto via Fotos", description: "Adicione produtos tirando fotos.", path: "/create-from-photos", icon: "photo_camera" },
    ];

    return (
        <div className="page-content">
            {/* Header */}
            <div className="navbar-fixed">
                <nav>
                    <div className="nav-wrapper">
                        <a href="#" className="brand-logo center">Criação de Lista</a>
                    </div>
                </nav>
            </div>

            {/* Main Content */}
            <div className="container" style={{ marginTop: '20px' }}>
                <div className="row">
                    {options.map((option, index) => (
                        <div className="col s12 m6" key={index}>
                            <div className="card small">
                                <div className="card-content center-align">
                                    <i className="material-icons large" style={{ color: '#42a5f5' }}>{option.icon}</i>
                                    <span className="card-title">{option.title}</span>
                                    <p>{option.description}</p>
                                </div>
                                <div className="card-action center-align">
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

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default ListCreation;
