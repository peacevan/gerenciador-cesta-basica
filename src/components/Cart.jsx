import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import Dexie from 'dexie';
import M from 'materialize-css';
import Footer from './Footer';

// Initialize IndexedDB using Dexie
const db = new Dexie("SmartListDB");
db.version(210).stores({
    products: "++id, name, price, category",
    items: "++id, name, price, quantity, unit, checked",
    categories: "++id, name",
    units: "++id, name"
});

const Cart = () => {
    const [items, setItems] = useState([]);
    const [editItem, setEditItem] = useState(null);
    const [itemPrice, setItemPrice] = useState('');
    const [itemUnit, setItemUnit] = useState(''); // Add state for the select value
    const navigate = useNavigate(); // Initialize useNavigate

    useEffect(() => {
        const initializeDatabase = async () => {
            try {
                // Check if the database and object stores exist
                await db.open();
            } catch (error) {
                if (error.name === 'NotFoundError') {
                    console.error("Database or object store not found. Reinitializing database...");
                    // Recreate the database schema
                    db.version(210).stores({
                        products: "++id, name, price, category",
                        items: "++id, name, price, quantity, unit, checked",
                        categories: "++id, name",
                        units: "++id, name"
                    });
                    await db.open();
                } else {
                    console.error("Error initializing database:", error);
                }
            }
        };

        const fetchItems = async () => {
            try {
                await initializeDatabase(); // Ensure the database is initialized
                const allItems = await db.items.toArray();
                setItems(allItems);
            } catch (error) {
                console.error("Error fetching items from IndexedDB:", error);
                M.toast({ html: 'Erro ao acessar o banco de dados!', classes: 'red' });
            }
        };

        fetchItems();

        // Initialize Materialize components
        M.AutoInit();

        // Initialize dropdown
        const dropdowns = document.querySelectorAll('.dropdown-trigger');
        M.Dropdown.init(dropdowns, {
            constrainWidth: false,
            coverTrigger: false
        });
    }, []);

    const clearModalFields = () => {
        document.getElementById('item-name').value = '';
        document.getElementById('item-quantity').value = '';
        setItemPrice('');
        setItemUnit(''); // Clear the select value
        M.updateTextFields();
    };

    const handleItemPriceChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-numeric characters
        setItemPrice(value); // Atualiza o estado com o valor numérico puro
    };

    const handleItemPriceBlur = () => {
        if (itemPrice) {
            const formattedValue = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
            }).format(parseFloat(itemPrice) / 100); // Formata como moeda BRL
            setItemPrice(formattedValue); // Atualiza o estado com o valor formatado
        }
    };

    const handleSaveItem = () => {
        try {
            const name = document.getElementById('item-name').value.toUpperCase(); // Convert to uppercase
            const quantity = parseInt(document.getElementById('item-quantity').value, 10);
            const price = parseFloat(itemPrice.replace(/[^\d,]/g, '').replace(',', '.')) / 100; // Remove caracteres não numéricos e converte para número

            if (name && quantity && price && itemUnit) {
                const newItem = { name, quantity, price, unit: itemUnit, checked: true };

                if (editItem) {
                    db.items.update(editItem.id, newItem).then(() => {
                        M.toast({ html: 'Item atualizado com sucesso!', classes: 'green' });
                        db.items.toArray().then(setItems);
                        setEditItem(null);
                    });
                } else {
                    db.items.add(newItem).then(() => {
                        M.toast({ html: 'Item adicionado com sucesso!', classes: 'green' });
                        db.items.toArray().then(setItems);
                    });
                }
                clearModalFields(); // Clear modal fields after saving
            } else {
                M.toast({ html: 'Preencha todos os campos!', classes: 'red' });
            }
        } catch (error) {
            console.error("Error saving item to IndexedDB:", error);
            M.toast({ html: 'Erro ao salvar o item!', classes: 'red' });
        }
    };

    const handleEditItem = (item) => {
        setEditItem(item);
        document.getElementById('item-name').value = item.name.toUpperCase(); // Convert to uppercase
        document.getElementById('item-quantity').value = item.quantity;
        setItemPrice(item.price.toFixed(2).replace('.', ','));
        setItemUnit(item.unit); // Set the select value
        M.updateTextFields();
        const modal = M.Modal.getInstance(document.getElementById('modal1'));
        modal.open();
    };

    const handleDeleteItem = async (id) => {
        try {
            const confirmDelete = window.confirm("Tem certeza de que deseja excluir este item?");
            if (confirmDelete) {
                await db.items.delete(id);
                const updatedItems = await db.items.toArray();
                setItems(updatedItems);
                M.toast({ html: 'Item excluído com sucesso!', classes: 'green' });
            }
        } catch (error) {
            console.error("Error deleting item from IndexedDB:", error);
           // M.toast({ html: 'Erro ao excluir o item!', classes: 'red' });
        }
    };

    const calculateTotal = () => {
        const total = items
            .filter(item => item.checked)
            .reduce((sum, item) => sum + item.price * item.quantity, 0);
        return total.toFixed(2).replace('.', ',');
    };

    const handleNavigateToProductList = () => {
        navigate('/product-list'); // Navegar para a listagem de produtos
    };

    const handleNavigateToUnitRegistration = () => {
        navigate('/unit-registration'); // Navigate to unit registration
    };

    const handleNavigateToCategoryRegistration = () => {
        navigate('/category-registration'); // Navigate to category registration
    };

    return (
        <div className="page-content">
            <div className="navbar-fixed">
                <nav>
                    <div className="nav-wrapper">
                        <a href="#" className="brand-logo"  style={{ fontSize: '16px' }}>Smart List</a>
                        <ul id="nav-mobile" className="right hide-on-med-and-down">
                            <li><a href="index.html">Home</a></li>
                            <li><a href="cart.html" className="active">Carrinho</a></li>
                            <li><a href="history.html">Histórico</a></li>
                            <li><a href="chart.html">Gráficos</a></li>
                            <li>
                                <a className="dropdown-trigger" href="#!" data-target="dropdown-menu">
                                    <i className="material-icons">menu</i>
                                </a>
                            </li>
                        </ul>
                    </div>
                </nav>
            </div>

            {/* Dropdown Menu */}
            <ul id="dropdown-menu" className="dropdown-content">
                <li><a href="#!" onClick={handleNavigateToProductList}>Produtos</a></li>
                <li><a href="#!" onClick={handleNavigateToUnitRegistration}>Unidade de Medidas</a></li>
                <li><a href="#!" onClick={handleNavigateToCategoryRegistration}>Categoria</a></li>
                <li className="divider"></li>
                <li><a href="settings.html">Configurações</a></li>
                <li><a href="help.html">Ajuda</a></li>
            </ul>

            <div className="container-">
                <div className="section">
                </div>

                <ul className="collection">
                    {items.length > 0 ? (
                        items.map(item => (
                            <li key={item.id} className="collection-item">
                                <div>
                                    <strong style={{ fontSize: '1.2em', display: 'block', marginBottom: '5px' }}>{item.name}</strong>
                                    <div style={{ fontSize: '0.9em', color: '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{item.quantity} x R$ {item.price.toFixed(2).replace('.', ',')} = R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                            <label className="custom-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={item.checked}
                                                    onChange={(e) => db.items.update(item.id, { checked: e.target.checked }).then(() => db.items.toArray().then(setItems))}
                                                />
                                                <span></span>
                                            </label>
                                            <button
                                                className="btn-flat"
                                                onClick={() => handleEditItem(item)}
                                                style={{ minWidth: '24px', height: '24px', padding: 0 }}
                                            >
                                                <i className="material-icons" style={{ fontSize: '18px' }}>edit</i>
                                            </button>
                                            <button
                                                className="btn-flat red-text"
                                                onClick={() => handleDeleteItem(item.id)}
                                                style={{ minWidth: '24px', height: '24px', padding: 0 }}
                                            >
                                                <i className="material-icons" style={{ fontSize: '18px' }}>delete</i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))
                    ) : (
                        <li className="collection-item center-align grey-text">Nenhum item no carrinho.</li>
                    )}
                </ul>
            </div>

            <div className="fixed-footer" style={{ position: 'fixed', bottom: '60px', left: 0, right: 0, backgroundColor: 'white', boxShadow: '0 -2px 5px rgba(0, 0, 0, 0.1)', zIndex: 1000, padding: '10px 0' }}>
                <div className="row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9em' }}>
                    <div style={{ marginLeft: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="total-items">Itens: {items.length}</span>
                        <span className="total-price">Total: R$ {calculateTotal()}</span>
                    </div>
                    <div style={{ marginRight: '10px' }}>
                        <button
                            className="btn-floating btn-small waves-effect waves-light teal modal-trigger"
                            data-target="modal1"
                            style={{
                                margin: 0,
                                opacity: 1, // Garante que o botão não esteja opaco
                                pointerEvents: 'auto' // Garante que o botão seja clicável
                            }}
                        >
                            <i className="material-icons">add</i>
                        </button>
                    </div>
                </div>
            </div>

            <div id="modal1" className="modal" style={{ width: '95%', height: '80%' }}>
                <div className="modal-content">
                    <button
                        className="modal-close btn-flat"
                        style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            fontSize: '1.5em',
                            color: '#999',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        &times;
                    </button>
                    <form>
                        <div className="input-field">
                            <input id="item-name" type="text" className="validate" />
                            <label htmlFor="item-name">Nome do Item</label>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div className="input-field" style={{ flex: 1 }}>
                                <input id="item-quantity" type="number" className="validate" />
                                <label htmlFor="item-quantity">Quantidade</label>
                            </div>
                            <div className="input-field" style={{ flex: 1 }}>
                                <input
                                    id="item-price"
                                    type="text"
                                    className="validate"
                                    value={itemPrice}
                                    onChange={handleItemPriceChange}
                                    onBlur={handleItemPriceBlur}
                                    placeholder="R$ 0,00"
                                />
                                <label htmlFor="item-price">Preço</label>
                            </div>
                        </div>
                        <div className="input-field">
                            <select
                                id="item-unit"
                                value={itemUnit} // Use value prop instead of selected
                                onChange={(e) => setItemUnit(e.target.value)} // Update state on change
                            >
                                <option value="" disabled>Selecione a unidade</option>
                                <option value="KG">Quilograma (KG)</option>
                                <option value="L">Litro (L)</option>
                                <option value="UN">Unidade (UN)</option>
                                <option value="DZ">Dúzia (DZ)</option>
                                <option value="PC">Pacote (PC)</option>
                            </select>
                            <label htmlFor="item-unit">Unidade</label>
                        </div>
                    </form>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px' }}>
                    <button
                        className="waves-effect waves-light btn green"
                        onClick={handleSaveItem}
                        style={{ marginRight: '10px' }}
                    >
                        <i className="material-icons left">check</i>Salvar
                    </button>
                    <button
                        className="waves-effect waves-light btn red modal-close"
                        onClick={clearModalFields}
                    >
                        <i className="material-icons left">close</i>Cancelar
                    </button>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Cart;