import React, { useState } from 'react';
import 'materialize-css/dist/css/materialize.min.css';
import VoiceSearch from './VoiceSearch';

const CreateFromVoice = () => {
    const [product, setProduct] = useState({
        nome: '',
        precoUn: '',
        quantidade: '',
        unidade: '',
        categoria: '',
        url_img: '',
        marca: ''
    });
    const [productList, setProductList] = useState([]);

    const handleProductFound = (foundProduct) => {
        console.log("Product found from VoiceSearch:", foundProduct); // Debugging log
        setProduct(foundProduct);
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        console.log(`Input changed: ${id} = ${value}`); // Debugging log
        setProduct((prevProduct) => ({
            ...prevProduct,
            [id]: value, // Dynamically update the field based on its ID
        }));
    };

    const handleAddProduct = () => {
        if (product.nome) {
            console.log("Before adding product, productList:", productList); // Debugging log
            setProductList((prevList) => {
                const updatedList = [...prevList, product];
                console.log("Updated productList:", updatedList); // Debugging log
                return updatedList;
            });
            setProduct({
                nome: '',
                precoUn: '',
                quantidade: '',
                unidade: '',
                categoria: '',
                url_img: '',
                marca: ''
            });
        }
    };

    const handleFinalizeList = () => {
        console.log("Finalized List:", productList); // Debugging log
        setProductList([]);
    };

    const handleRemoveProduct = (indexToRemove) => {
        setProductList((prevList) => prevList.filter((_, index) => index !== indexToRemove));
    };

    const handleClearProduct = () => {
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

    const formatCurrency = (value) => {
        if (!value) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className="page-content">
            {/* Page Header */}
            <div className="navbar-fixed">
                <nav>
                    <div className="nav-wrapper">
                        <a href="#" className="brand-logo" style={{ fontSize: '14px' }}>Smart List</a>
                        <ul id="nav-mobile" className="right hide-on-med-and-down">
                            <li><a href="#history">Histórico</a></li>
                        </ul>
                    </div>
                </nav>
            </div>
            <div className="container" style={{ marginTop: '30px', marginBottom: '80px' }}> {/* Adjusted bottom margin for footer */}
                {/* Card for product details */}
                <div className="row">
                    <div className="card z-depth-2" style={{ borderRadius: '10px', padding: '10px', height: 'auto' }}>
                        <div className="card-content" style={{ padding: '10px' }}>
                            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                                <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <strong>Item:</strong>
                                    <span>{product.nome || '---'}</span>
                                </li>
                                <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <strong>Quantidade:</strong>
                                    <span>{product.quantidade || '---'}</span>
                                </li>
                                <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <strong>Valor:</strong>
                                    <span>{formatCurrency(product.precoUn)}</span>
                                </li>
                            </ul>
                        </div>
                        <div className="card-action" style={{ display: 'flex', justifyContent: 'center', padding: '5px' }}>
                            <button
                                className="btn-flat green-text"
                                onClick={handleAddProduct}
                                style={{ marginRight: '10px' }}
                            >
                                <i className="material-icons">check</i>
                            </button>
                            <button
                                className="btn-flat red-text"
                                onClick={handleClearProduct}
                            >
                                <i className="material-icons">cancel</i>
                            </button>
                        </div>
                    </div>
                </div>
   
                {/* Product List Table */}
                <div className="row" style={{ marginTop: '30px' }}>
                    <div style={{ maxHeight: '300px', overflowY: 'auto', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)' }}>
                        <table className="striped centered highlight" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                            <thead className="blue lighten-4">
                                <tr>
                                    <th style={{ padding: '10px' }}>Item</th>
                                    <th style={{ padding: '10px' }}>Qtd.</th>
                                    <th style={{ padding: '10px' }}>Preço</th>
                                    <th style={{ padding: '10px' }}>Total</th>
                                    <th style={{ padding: '10px' }}>Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productList.map((item, index) => (
                                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#ffffff' }}>
                                        <td style={{ padding: '10px' }}>{item.nome}</td>
                                        <td style={{ padding: '10px' }}>{item.quantidade}</td>
                                        <td style={{ padding: '10px' }}>{formatCurrency(item.precoUn)}</td>
                                        <td style={{ padding: '10px' }}>{formatCurrency(item.quantidade * item.precoUn)}</td>
                                        <td style={{ padding: '10px' }}>
                                            <button
                                                className="btn-flat red-text"
                                                onClick={() => handleRemoveProduct(index)}
                                                style={{ padding: '0 8px' }}
                                            >
                                                <i className="material-icons">delete</i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                             {/* Action Buttons */}
                             <div className="row" style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                    <button
                        className="btn green"
                        onClick={handleAddProduct}
                        style={{ marginRight: '10px' }}
                    >
                        <i className="material-icons left">shopping_cart</i>
                    </button>
                    <button
                        className="btn blue"
                        onClick={handleFinalizeList}
                    >
                        <i className="material-icons left">save</i>
                    </button>
                </div>
            </div>
            {/* VoiceSearch is now in the fixed footer */}
            <div className="navbar-fixed" style={{ bottom: 0, position: 'fixed', width: '100%' }}>
                <VoiceSearch onProductFound={handleProductFound} />
            </div>
        </div>
    );
};

export default CreateFromVoice;
