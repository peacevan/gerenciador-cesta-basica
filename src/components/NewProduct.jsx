import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import Dexie from 'dexie';
import M from 'materialize-css';

// Initialize IndexedDB using Dexie
const db = new Dexie("SmartListDB");
db.version(210).stores({
    products: "++id, name, price, category",
    items: "++id, name, price, quantity, unit, checked",
    categories: "++id, name",
    units: "++id, name"
});

const NewProduct = () => {
    const [product, setProduct] = useState({
        nome: '',
        precoUn: '',
        quantidade: '',
        unidade: '',
        categoria: '',
        url_img: '',
        marca: ''
    });

    const navigate = useNavigate();
    const location = useLocation(); // Access the state passed via navigation

    useEffect(() => {
        // Initialize Materialize components
        const selects = document.querySelectorAll('select');
        M.FormSelect.init(selects);

        // Load product data if editing
        if (location.state && location.state.product) {
            setProduct(location.state.product);

            // Atualize os selects para refletir os valores carregados
            setTimeout(() => {
                const selects = document.querySelectorAll('select');
                M.FormSelect.init(selects);
            }, 0);
        }
    }, [location.state]);

    const clearFields = () => {
        setProduct({
            nome: '',
            precoUn: '',
            quantidade: '',
            unidade: '',
            categoria: '',
            url_img: '',
            marca: ''
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProduct({ ...product, [name]: value });
    };

    const handleSaveProduct = async () => {
        const { id, nome, precoUn, quantidade, unidade, categoria, url_img, marca } = product;

        if (nome && precoUn && quantidade && unidade && categoria && url_img && marca) {
            if (id) {
                // Update existing product
                await db.products.update(id, {
                    nome: nome.toUpperCase(),
                    precoUn: parseFloat(precoUn),
                    quantidade: parseInt(quantidade, 10),
                    unidade,
                    categoria,
                    url_img,
                    marca
                });
                M.toast({ html: 'Produto atualizado com sucesso!', classes: 'green' });
            } else {
                // Add new product
                await db.products.add({
                    nome: nome.toUpperCase(),
                    precoUn: parseFloat(precoUn),
                    quantidade: parseInt(quantidade, 10),
                    unidade,
                    categoria,
                    url_img,
                    marca
                });
                M.toast({ html: 'Produto cadastrado com sucesso!', classes: 'green' });
            }
            navigate('/product-list'); // Redirect to product list
        } else {
            M.toast({ html: 'Preencha todos os campos!', classes: 'red' });
        }
    };

    return (
        <div className="page-content">
            <div className="navbar-fixed">
                <nav>
                    <div className="nav-wrapper">
                        <button
                            className="btn-flat"
                            onClick={() => navigate('/product-list')} // Redirect to product list
                            style={{ marginLeft: '10px', display: 'flex', alignItems: 'center', float: 'left' }}
                        >
                            <i className="material-icons">arrow_back</i>
                        </button>
                        <a href="#" className="brand-logo" style={{ marginLeft: '12px' }}>Cadastro de Produto</a>
                    </div>
                </nav>
            </div>

            <div className="container">
                <form>
                    <div className="input-field">
                        <input
                            id="nome"
                            name="nome"
                            type="text"
                            value={product.nome}
                            onChange={handleInputChange}
                        />
                        <label htmlFor="nome" className={product.nome ? 'active' : ''}>Nome do Produto</label>
                    </div>
                    <div className="input-field">
                        <input
                            id="precoUn"
                            name="precoUn"
                            type="text"
                            value={product.precoUn}
                            onChange={handleInputChange}
                        />
                        <label htmlFor="precoUn" className={product.precoUn ? 'active' : ''}>Preço Unitário</label>
                    </div>
                    <div className="input-field">
                        <input
                            id="quantidade"
                            name="quantidade"
                            type="number"
                            value={product.quantidade}
                            onChange={handleInputChange}
                        />
                        <label htmlFor="quantidade" className={product.quantidade ? 'active' : ''}>Quantidade</label>
                    </div>
                    <div className="input-field">
                        <select
                            id="unidade"
                            name="unidade"
                            value={product.unidade}
                            onChange={handleInputChange}
                        >
                            <option value="" disabled>Selecione a unidade</option>
                            <option value="KG">Quilograma (KG)</option>
                            <option value="L">Litro (L)</option>
                            <option value="UN">Unidade (UN)</option>
                            <option value="DZ">Dúzia (DZ)</option>
                            <option value="PC">Pacote (PC)</option>
                        </select>
                        <label htmlFor="unidade" className={product.unidade ? 'active' : ''}>Unidade</label>
                    </div>
                    <div className="input-field">
                        <select
                            id="categoria"
                            name="categoria"
                            value={product.categoria}
                            onChange={handleInputChange}
                        >
                            <option value="" disabled>Selecione a categoria</option>
                            <option value="Alimentos">Alimentos</option>
                            <option value="Bebidas">Bebidas</option>
                            <option value="Limpeza">Limpeza</option>
                            <option value="Higiene">Higiene</option>
                            <option value="Outros">Outros</option>
                        </select>
                        <label htmlFor="categoria" className={product.categoria ? 'active' : ''}>Categoria</label>
                    </div>
                    <div className="input-field">
                        <input
                            id="url_img"
                            name="url_img"
                            type="text"
                            value={product.url_img}
                            onChange={handleInputChange}
                        />
                        <label htmlFor="url_img" className={product.url_img ? 'active' : ''}>URL da Imagem</label>
                    </div>
                    <div className="input-field">
                        <input
                            id="marca"
                            name="marca"
                            type="text"
                            value={product.marca}
                            onChange={handleInputChange}
                        />
                        <label htmlFor="marca" className={product.marca ? 'active' : ''}>Marca</label>
                    </div>
                    <div className="center-align">
                        <button
                            type="button"
                            className="waves-effect waves-light btn green"
                            onClick={handleSaveProduct}
                        >
                            <i className="material-icons left">check</i>Salvar
                        </button>
                        <button
                            type="button"
                            className="waves-effect waves-light btn red"
                            onClick={clearFields}
                            style={{ marginLeft: '10px' }}
                        >
                            <i className="material-icons left">close</i>Limpar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewProduct;
