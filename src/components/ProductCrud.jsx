import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';
import M from 'materialize-css';

// Initialize IndexedDB using Dexie
const db = new Dexie("SmartListDB");
db.version(210).stores({
    products: "++id, name, price, category"
});

const ProductCrud = () => {
    const [products, setProducts] = useState([]);
    const [editProduct, setEditProduct] = useState(null);
    const [productName, setProductName] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productCategory, setProductCategory] = useState('');

    useEffect(() => {
        // Fetch products from IndexedDB
        const fetchProducts = async () => {
            const allProducts = await db.products.toArray();
            setProducts(allProducts);
        };

        fetchProducts();

        // Initialize Materialize components
        M.AutoInit();
    }, []);

    const clearModalFields = () => {
        setProductName('');
        setProductPrice('');
        setProductCategory('');
        setEditProduct(null);
    };

    const handleSaveProduct = () => {
        const price = parseFloat(productPrice.replace(/[^\d,]/g, '').replace(',', '.')) / 100;

        if (productName && price && productCategory) {
            const newProduct = { name: productName, price, category: productCategory };

            if (editProduct) {
                db.products.update(editProduct.id, newProduct).then(() => {
                    M.toast({ html: 'Produto atualizado com sucesso!', classes: 'green' });
                    db.products.toArray().then(setProducts);
                    clearModalFields();
                });
            } else {
                db.products.add(newProduct).then(() => {
                    M.toast({ html: 'Produto adicionado com sucesso!', classes: 'green' });
                    db.products.toArray().then(setProducts);
                    clearModalFields();
                });
            }
        } else {
            M.toast({ html: 'Preencha todos os campos!', classes: 'red' });
        }
    };

    const handleEditProduct = (product) => {
        setEditProduct(product);
        setProductName(product.name);
        setProductPrice(product.price.toFixed(2).replace('.', ','));
        setProductCategory(product.category);
        const modal = M.Modal.getInstance(document.getElementById('product-modal'));
        modal.open();
    };

    const handleDeleteProduct = async (id) => {
        const confirmDelete = window.confirm("Tem certeza de que deseja excluir este produto?");
        if (confirmDelete) {
            await db.products.delete(id);
            const updatedProducts = await db.products.toArray();
            setProducts(updatedProducts);
            M.toast({ html: 'Produto excluído com sucesso!', classes: 'green' });
        }
    };

    return (
        <div className="container">
            <h4 className="center-align">Gerenciamento de Produtos</h4>

            <button
                className="btn waves-effect waves-light modal-trigger"
                data-target="product-modal"
                onClick={clearModalFields}
            >
                <i className="material-icons left">add</i>Adicionar Produto
            </button>

            <ul className="collection">
                {products.length > 0 ? (
                    products.map(product => (
                        <li key={product.id} className="collection-item">
                            <div>
                                <strong>{product.name}</strong>
                                <span className="secondary-content">
                                    <button
                                        className="btn-flat"
                                        onClick={() => handleEditProduct(product)}
                                    >
                                        <i className="material-icons">edit</i>
                                    </button>
                                    <button
                                        className="btn-flat red-text"
                                        onClick={() => handleDeleteProduct(product.id)}
                                    >
                                        <i className="material-icons">delete</i>
                                    </button>
                                </span>
                                <p>Preço: R$ {product.price.toFixed(2).replace('.', ',')}</p>
                                <p>Categoria: {product.category}</p>
                            </div>
                        </li>
                    ))
                ) : (
                    <li className="collection-item center-align grey-text">Nenhum produto cadastrado.</li>
                )}
            </ul>

            {/* Modal */}
            <div id="product-modal" className="modal">
                <div className="modal-content">
                    <h5>{editProduct ? 'Editar Produto' : 'Adicionar Produto'}</h5>
                    <div className="input-field">
                        <input
                            id="product-name"
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                        />
                        <label htmlFor="product-name" className={editProduct ? 'active' : ''}>Nome do Produto</label>
                    </div>
                    <div className="input-field">
                        <input
                            id="product-price"
                            type="text"
                            value={productPrice}
                            onChange={(e) => setProductPrice(e.target.value.replace(/\D/g, ''))}
                            onBlur={() => {
                                if (productPrice) {
                                    const formattedValue = new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                    }).format(parseFloat(productPrice) / 100);
                                    setProductPrice(formattedValue);
                                }
                            }}
                        />
                        <label htmlFor="product-price" className={editProduct ? 'active' : ''}>Preço</label>
                    </div>
                    <div className="input-field">
                        <input
                            id="product-category"
                            type="text"
                            value={productCategory}
                            onChange={(e) => setProductCategory(e.target.value)}
                        />
                        <label htmlFor="product-category" className={editProduct ? 'active' : ''}>Categoria</label>
                    </div>
                </div>
                <div className="modal-footer">
                    <button
                        className="btn waves-effect waves-light green"
                        onClick={handleSaveProduct}
                    >
                        <i className="material-icons left">check</i>Salvar
                    </button>
                    <button
                        className="btn waves-effect waves-light red modal-close"
                        onClick={clearModalFields}
                    >
                        <i className="material-icons left">close</i>Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCrud;
