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
            console.log("Adding product to list:", product); // Debugging log
            setProductList([...productList, product]);
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

    return (
        <div className="container" style={{ marginTop: '20px' }}>
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
                            <th>Nome</th>
                            <th>Preço Unitário</th>
                            <th>Quantidade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productList.map((item, index) => (
                            <tr key={index}>
                                <td>{item.nome}</td>
                                <td>{item.precoUn}</td>
                                <td>{item.quantidade}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CreateFromVoice;
