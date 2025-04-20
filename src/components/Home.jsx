import React from 'react';
import Footer from './Footer';

const Home = () => {
    return (
        <div className="page-content">
            <div className="navbar-fixed">
                <nav>
                    <div className="nav-wrapper">
                        <a href="#" className="brand-logo"  style={{ fontSize: '12px' }}>Smart List</a>
                        <ul id="nav-mobile" className="right hide-on-med-and-down">
                            <li><a href="#home">Home</a></li>
                        </ul>
                    </div>
                </nav>
            </div>

            <div className="container">
                <div className="section">
                    <h4 className="center-align">Bem-vindo ao Smart List</h4>
                    <p className="grey-text center-align">Gerencie suas compras de forma inteligente e organizada.</p>
                </div>
            </div>

            <div className="container">
                <div className="row">
                    <div className="col s12 m6">
                        <div className="card">
                            <div className="card-content">
                                <span className="card-title">Última Compra</span>
                                <p>Visualize e gerencie sua última lista de compras.</p>
                                <a href="/cart" className="btn waves-effect waves-light">Ver Carrinho</a>
                            </div>
                        </div>
                    </div>
                    <div className="col s12 m6">
                        <div className="card">
                            <div className="card-content">
                                <span className="card-title">Histórico</span>
                                <p>Acompanhe seu histórico de compras por mês.</p>
                                <a href="/history" className="btn waves-effect waves-light">Ver Histórico</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Home;