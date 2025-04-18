import React from 'react';
import Footer from './Footer';

const History = () => {
    return (
        <div className="page-content">
            <div className="navbar-fixed">
                <nav>
                    <div className="nav-wrapper">
                        <a href="#" className="brand-logo"  style={{ fontSize: '12px !important' }}>Smart List</a>
                        <ul id="nav-mobile" className="right hide-on-med-and-down">
                            <li><a href="#history">Histórico</a></li>
                        </ul>
                    </div>
                </nav>
            </div>

            <div className="container">
                <div className="section">
                    <h4 className="center-align">Histórico de Compras</h4>
                    <p className="grey-text center-align">Acompanhe suas compras mensais.</p>
                </div>
            </div>

            <div id="historico-compras" className="section">
                <div className="card hoverable">
                    <div className="card-content">
                        <span className="card-title">Histórico de Compras</span>
                        <p>Veja todas as suas compras anteriores organizadas por data. Clique em uma compra para visualizar os detalhes e acompanhar seus gastos.</p>
                    </div>
                    <div className="card-action">
                        <a href="#" className="btn waves-effect waves-light teal">Explorar Histórico</a>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default History;