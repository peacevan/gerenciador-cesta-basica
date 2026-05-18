import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import SimpleDropdown from './SimpleDropdown';

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
                    <SimpleDropdown
                        triggerClassName="nav-item bottom-nav__menu-trigger"
                        menuClassName="dropdown-content simple-dropdown__menu-list"
                        trigger={(
                            <>
                                <i className="material-icons">menu</i>
                                <span>Mais</span>
                            </>
                        )}
                    >
                        <NavLink className="simple-dropdown__item" to="/product-list">Produtos</NavLink>
                        <NavLink className="simple-dropdown__item" to="/nit-registration">Unidades</NavLink>
                        <NavLink className="simple-dropdown__item" to="/category-registration">Categorias</NavLink>
                        <NavLink className="simple-dropdown__item" to="/settings">Configurações</NavLink>
                        <NavLink className="simple-dropdown__item" to="/help">Ajuda</NavLink>
                    </SimpleDropdown>
                </div>
            </div>

        </div>
    );
};

export default Footer;
