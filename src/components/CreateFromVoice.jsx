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

    return (
        <div className="container" style={{ marginTop: '20px' }}>
            {/* Debugging log to verify productList */}
            {console.log("Rendering productList:", productList)}
            <VoiceSearch onProductFound={handleProductFound} />
            <div className="row">
                <div className="input-field col s12">
                    <input
                        id="nome"
                        type="text"
                        value={product.nome} // Use value to bind to state
                        onChange={handleInputChange} // Ensure onChange updates state
                    />
                    <label htmlFor="nome" className="active">Nome</label>
                </div>
            </div>
            <div className="row">
                <div className="input-field col s6">
                    <input
                        id="quantidade"
                        type="text"
                        value={product.quantidade} // Use value to bind to state
                        onChange={handleInputChange} // Ensure onChange updates state
                    />
                    <label htmlFor="quantidade" className="active">Quantidade</label>
                </div>
                <div className="input-field col s6">
                    <input
                        id="precoUn"
                        type="text"
                        value={product.precoUn} // Use value to bind to state
                        onChange={handleInputChange} // Ensure onChange updates state
                    />
                    <label htmlFor="precoUn" className="active">Preço Unitário</label>
                </div>
            </div>
            <div className="row">
                <button
                    className="btn green"
                    onClick={handleAddProduct}
                    style={{ marginRight: '10px' }}
                >
                    <i className="material-icons left">add</i>Adicionar
                </button>
                <button
                    className="btn blue"
                    onClick={handleFinalizeList}
                >
                    <i className="material-icons left">check</i>Finalizar
                </button>
            </div>
            <div className="row" style={{ marginTop: '20px' }}>
                <table className="striped">
                    <thead>
                        <tr>
                            <th style={{ width: '50%' }}>Nome</th> {/* Adjusted width */}
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
                                <td>{item.precoUn}</td>
                                <td>{(item.quantidade * item.precoUn).toFixed(2)}</td> {/* Calculate Total */}
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
    );
};

export default CreateFromVoice;
