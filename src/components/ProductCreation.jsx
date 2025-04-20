import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

const ProductCreation = () => {
    const [product, setProduct] = useState({
        nome: '',
        precoUn: '',
        quantidade: '',
        unidade: '',
        categoria: '',
        marca: ''
    });
    const navigate = useNavigate();
    const location = useLocation();

    // Check if editing an existing product
    const editingProduct = location.state?.product;
    React.useEffect(() => {
        if (editingProduct) {
            setProduct(editingProduct);
        }
    }, [editingProduct]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProduct({ ...product, [name]: value });
    };

    const handleSaveProduct = async () => {
        if (!product.nome || !product.precoUn) {
            M.toast({ html: 'Por favor, preencha os campos obrigatórios.', classes: 'red' });
            return;
        }

        if (editingProduct) {
            // Update existing product
            await db.products.update(editingProduct.id, product);
            M.toast({ html: 'Produto atualizado com sucesso!', classes: 'green' });
        } else {
            // Add new product
            await db.products.add(product);
            M.toast({ html: 'Produto adicionado com sucesso!', classes: 'green' });
        }

        navigate('/');
    };

    return (
        <div className="container">
            <h4>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h4>
            <div className="input-field">
                <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={product.nome}
                    onChange={handleInputChange}
                />
                <label htmlFor="nome" className={product.nome ? 'active' : ''}>Nome</label>
            </div>
            <div className="input-field">
                <input
                    type="number"
                    id="precoUn"
                    name="precoUn"
                    value={product.precoUn}
                    onChange={handleInputChange}
                />
                <label htmlFor="precoUn" className={product.precoUn ? 'active' : ''}>Preço Unitário</label>
            </div>
            <div className="input-field">
                <input
                    type="number"
                    id="quantidade"
                    name="quantidade"
                    value={product.quantidade}
                    onChange={handleInputChange}
                />
                <label htmlFor="quantidade" className={product.quantidade ? 'active' : ''}>Quantidade</label>
            </div>
            <div className="input-field">
                <input
                    type="text"
                    id="unidade"
                    name="unidade"
                    value={product.unidade}
                    onChange={handleInputChange}
                />
                <label htmlFor="unidade" className={product.unidade ? 'active' : ''}>Unidade</label>
            </div>
            <div className="input-field">
                <input
                    type="text"
                    id="categoria"
                    name="categoria"
                    value={product.categoria}
                    onChange={handleInputChange}
                />
                <label htmlFor="categoria" className={product.categoria ? 'active' : ''}>Categoria</label>
            </div>
            <div className="input-field">
                <input
                    type="text"
                    id="marca"
                    name="marca"
                    value={product.marca}
                    onChange={handleInputChange}
                />
                <label htmlFor="marca" className={product.marca ? 'active' : ''}>Marca</label>
            </div>
            <button
                className="btn waves-effect waves-light"
                onClick={handleSaveProduct}
            >
                <i className="material-icons left">save</i>Salvar
            </button>
        </div>
    );
};

export default ProductCreation;