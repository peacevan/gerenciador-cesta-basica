import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import M from 'materialize-css';

const Footer = () => {
    const [price, setPrice] = useState('');

    const handlePriceChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-numeric characters
        setPrice(value); // Atualiza o estado com o valor numérico puro
    };

    const handlePriceBlur = () => {
        if (price) {
            const formattedValue = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
            }).format(price / 100); // Formata como moeda BRL
            setPrice(formattedValue); // Atualiza o estado com o valor formatado
        }
    };

    useEffect(() => {
        // Initialize Materialize dropdown
        const dropdowns = document.querySelectorAll('.dropdown-trigger');
        M.Dropdown.init(dropdowns, {
            constrainWidth: false,
            coverTrigger: false,
            alignment: 'right'
        });
    }, []);

    return (
        <div className="bottom-nav">
            <div className="row" style={{ width: '100%', margin: 0 }}>
                <div className="col s2 center-align">
                    <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <i className="material-icons">home</i>
                        <span>Home</span>
                    </NavLink>
                </div>
                <div className="col s2 center-align">
                    <NavLink to="/cart" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <i className="material-icons">shopping_cart</i>
                        <span>Carrinho</span>
                    </NavLink>
                </div>
                <div className="col s2 center-align">
                    <NavLink to="/purchase-history" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <i className="material-icons">history</i>
                        <span>Histórico</span>
                    </NavLink>
                </div>
                <div className="col s2 center-align">
                    <NavLink to="/chart" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <i className="material-icons">bar_chart</i>
                        <span>Gráficos</span>
                    </NavLink>
                </div>
                <div className="col s2 center-align">
                    <NavLink to="/list-creation" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <i className="material-icons">list</i>
                        <span>Listas</span>
                    </NavLink>
                </div>
                <div className="col s2 center-align">
                    <a className="dropdown-trigger nav-item" href="#!" data-target="dropdown-menu-footer">
                        <i className="material-icons">menu</i>
                        <span>Mais</span>
                    </a>
                </div>
            </div>

            {/* Dropdown Menu */}
            <ul id="dropdown-menu-footer" className="dropdown-content">
                <li><NavLink to="/product-list">Produtos</NavLink></li>
                <li><NavLink to="/nit-registration">Unidades</NavLink></li>
                <li><NavLink to="/category-registration">Categorias</NavLink></li>
                <li className="divider"></li>
                <li><NavLink to="/settings">Configurações</NavLink></li>
                <li><NavLink to="/help">Ajuda</NavLink></li>
            </ul>

        </div>
    );
};

export default Footer;