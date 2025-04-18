import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';

const ListCreation = () => {
    const navigate = useNavigate();

    const options = [
        { title: "Digitação Manual", path: "/create-from-scratch", icon: "edit" },
        { title: "Comando de Voz", path: "/create-from-voice", icon: "mic" }, // Atualizado para a nova rota
        { title: "Importação de Lista", path: "/create-from-history", icon: "history" },
        { title: "Lista por CRC", path: "/create-from-camera", icon: "camera_alt" },
        { title: "Via Fotos", path: "/create-from-photos", icon: "photo_camera" },
    ];

    return (
        <div className="page-content">
            {/* Header */}
            <div className="navbar-fixed">
                <nav>
                    <div className="nav-wrapper">
                        <a
                            href="#"
                            className="brand-logo center"
                            style={{ fontSize: '12px !important' }}
                        >
                            Criação de Lista
                        </a>
                    </div>
                </nav>
            </div>

            {/* Main Content */}
            <div className="container" style={{ marginTop: '10px', overflow: 'hidden' }}>
                <div className="row" style={{ margin: '0 25px' }}>
                    {options.map((option, index) => (
                        <div className="col s4 m2" key={index} style={{ padding: '2px', textAlign: 'center' }}>
                            <div
                                className="card hoverable"
                                style={{
                                    width: '70px',
                                    height: '70px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#f5f5f5',
                                    margin: '5px auto',
                                }}
                                onClick={() => navigate(option.path)}
                            >
                                <i
                                    className="material-icons"
                                    style={{
                                        fontSize: '24px',
                                        color: '#42a5f5',
                                    }}
                                >
                                    {option.icon}
                                </i>
                                <span style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '3px' }}>
                                    {option.title}
                                </span>
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
