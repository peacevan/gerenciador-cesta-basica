import React from 'react';
import Footer from './Footer';

const PurchaseHistory = () => {
    const months = [
        { name: "Janeiro", icon: "shopping_cart" },
        { name: "Fevereiro", icon: "shopping_cart" },
        { name: "Março", icon: "shopping_cart" },
        { name: "Abril", icon: "shopping_cart" },
        { name: "Maio", icon: "shopping_cart" },
        { name: "Junho", icon: "shopping_cart" },
        { name: "Julho", icon: "shopping_cart" },
        { name: "Agosto", icon: "shopping_cart" },
        { name: "Setembro", icon: "shopping_cart" },
        { name: "Outubro", icon: "shopping_cart" },
        { name: "Novembro", icon: "shopping_cart" },
        { name: "Dezembro", icon: "shopping_cart" },
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
                            Histórico de Compras
                        </a>
                    </div>
                </nav>
            </div>

            {/* Main Content */}
            <div className="container" style={{ marginTop: '20px', overflow: 'hidden' }}>
                <div className="row" style={{ margin: '0 -2px' }}>
                    {months.map((month, index) => (
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
                            >
                                <i
                                    className="material-icons"
                                    style={{
                                        fontSize: '24px',
                                        color: '#42a5f5',
                                    }}
                                >
                                    {month.icon}
                                </i>
                                <span style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '3px' }}>
                                    {month.name}
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

export default PurchaseHistory;
