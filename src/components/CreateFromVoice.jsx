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
        <div className="container" style={{ marginTop: '20px' }}>
      

            {/* Debugging log to verify productList */}
            {console.log("Rendering productList:", productList)}
            <VoiceSearch onProductFound={handleProductFound} />

            {/* Card for product details */}
            <div className="row">
                <div className="card">
                    <div className="card-content" style={{ padding: '10px' }}>
                        <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                            <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', borderBottom: '1px solid #e0e0e0', paddingBottom: '5px' }}>
                                <strong style={{ textAlign: 'left' }}>Item:</strong>
                                <span style={{ textAlign: 'right' }}>{product.nome || '---'}</span>
                            </li>
                            <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', borderBottom: '1px solid #e0e0e0', paddingBottom: '5px' }}>
                                <strong style={{ textAlign: 'left' }}>Quantidade:</strong>
                                <span style={{ textAlign: 'right' }}>{product.quantidade || '---'}</span>
                            </li>
                            <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', borderBottom: '1px solid #e0e0e0', paddingBottom: '5px' }}>
                                <strong style={{ textAlign: 'left' }}>Valor:</strong>
                                <span style={{ textAlign: 'right' }}>{formatCurrency(product.precoUn)}</span>
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
            <div className="row" style={{ marginTop: '20px' }}>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}> {/* Added scrollable container */}
                    <table className="striped">
                        <thead>
                            <tr>
                                <th style={{ width: '50%' }}>item</th> {/* Adjusted width */}
                                <th style={{ width: '15%' }}>Qtd.</th>
                                <th style={{ width: '15%' }}>Preço</th>
                                <th style={{ width: '15%' }}>Total</th> {/* New column for Total */}
                                <th style={{ width: '5%' }}>Ação</th> {/* New column for delete button */}
                            </tr>
                        </thead>
                        <tbody>
                            {productList.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.nome}</td>
                                    <td>{item.quantidade}</td>
                                    <td>{formatCurrency(item.precoUn)}</td>
                                    <td>{formatCurrency(item.quantidade * item.precoUn)}</td> {/* Calculate Total */}
                                    <td>
                                        <button
                                            className="btn-flat red-text"
                                            onClick={() => handleRemoveProduct(index)}
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
            </div>
     </div>
    );
};

export default CreateFromVoice;
