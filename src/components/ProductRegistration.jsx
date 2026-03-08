import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import Dexie from 'dexie';
import M from 'materialize-css';
import VoiceSearch from './VoiceSearch';

// Initialize IndexedDB using Dexie
const db = new Dexie("SmartListDB");
db.version(210).stores({
    products: "++id, nome, precoUn, quantidade, unidade, categoria, url_img, marca"
});

const ProductRegistration = () => {
    const [product, setProduct] = useState({
        nome: '',
        precoUn: '',
        quantidade: '',
        unidade: '',
        categoria: '',
        url_img: '',
        marca: ''
    });

    const navigate = useNavigate(); // Initialize useNavigate

    useEffect(() => {
        // Initialize Materialize select
        const selects = document.querySelectorAll('select');
        M.FormSelect.init(selects);

        // Initialize Materialize dropdown
        const dropdowns = document.querySelectorAll('.dropdown-trigger');
        M.Dropdown.init(dropdowns);
    }, []);

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
        const { nome, precoUn, quantidade, unidade, categoria, url_img, marca } = product;

        if (nome && precoUn && quantidade && unidade && categoria && url_img && marca) {
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
            clearFields();
        } else {
            M.toast({ html: 'Preencha todos os campos!', classes: 'red' });
        }
    };

    const handleNavigateToCategoryRegistration = () => {
        navigate('/category-registration'); // Navigate to category registration
    };

    const handleNavigateToUnitRegistration = () => {
        navigate('/unit-registration'); // Navigate to unit registration
    };

    const handleProductFound = (foundProduct) => {
        setProduct(foundProduct);
    };

    return (
        <div className="page-content">
            {/* Header */}
            <div className="navbar-fixed">
                <nav>
                    <div className="nav-wrapper">
                        <button
                            className="btn-flat"
                            
                            onClick={() => navigate('/')}
                            style={{ marginLeft: '10px', display: 'flex', alignItems: 'center',float:'left' }}
                        >
                            <i className="material-icons">arrow_back</i>
                        </button>
                        <a href="#" className="brand-logo" style={{ marginLeft: '14px' }}>Cadastro de Produto</a>
                        <ul id="nav-mobile" className="right hide-on-med-and-down">
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
                <li><a href="#!" onClick={handleNavigateToCategoryRegistration}>Cadastro de Categoria</a></li>
                <li><a href="#!" onClick={handleNavigateToUnitRegistration}>Cadastro de Unidade</a></li>
                <li className="divider"></li>
                <li><a href="/">Home</a></li>
            </ul>

            {/* Main Content */}
            <div className="container">
                <VoiceSearch onProductFound={handleProductFound} />
                <form>
                    <div className="input-field">
                        <input
                            id="nome"
                            name="nome"
                            type="text"
                            value={product.nome}
                            onChange={handleInputChange}
                        />
                        <label htmlFor="nome">Nome do Produto</label>
                    </div>
                    <div className="input-field">
                        <input
                            id="precoUn"
                            name="precoUn"
                            type="text"
                            value={product.precoUn}
                            onChange={handleInputChange}
                        />
                        <label htmlFor="precoUn">Preço Unitário</label>
                    </div>
                    <div className="input-field">
                        <input
                            id="quantidade"
                            name="quantidade"
                            type="number"
                            value={product.quantidade}
                            onChange={handleInputChange}
                        />
                        <label htmlFor="quantidade">Quantidade</label>
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
                        <label htmlFor="unidade">Unidade</label>
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
                        <label htmlFor="categoria">Categoria</label>
                    </div>
                    <div className="input-field">
                        <input
                            id="url_img"
                            name="url_img"
                            type="text"
                            value={product.url_img}
                            onChange={handleInputChange}
                        />
                        <label htmlFor="url_img">URL da Imagem</label>
                    </div>
                    <div className="input-field">
                        <input
                            id="marca"
                            name="marca"
                            type="text"
                            value={product.marca}
                            onChange={handleInputChange}
                        />
                        <label htmlFor="marca">Marca</label>
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

export default ProductRegistration;
