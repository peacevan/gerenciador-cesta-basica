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
        setProduct(foundProduct);
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setProduct((prevProduct) => ({
            ...prevProduct,
            [id]: value, // Dynamically update the field based on its ID
        }));
    };

    const handleAddProduct = () => {
        if (product.nome) {
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
        console.log("Finalized List:", productList);
        // Add logic to save or process the finalized list
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
                        value={product.nome}
                        onChange={handleInputChange} // Add onChange handler
                    />
                    <label htmlFor="nome" className="active">Nome</label>
                </div>
            </div>
            <div className="row">
                <div className="input-field col s6">
                    <input
                        id="quantidade"
                        type="text"
                        value={product.quantidade}
                        onChange={handleInputChange} // Add onChange handler
                    />
                    <label htmlFor="quantidade" className="active">Quantidade</label>
                </div>
                <div className="input-field col s6">
                    <input
                        id="precoUn"
                        type="text"
                        value={product.precoUn}
                        onChange={handleInputChange} // Add onChange handler
                    />
                    <label htmlFor="precoUn" className="active">Preço Unitário</label>
                </div>
                {/* <div className="input-field col s6">
                    <input
                        id="unidade"
                        type="text"
                        value={product.unidade}
                       
                    />
                    <label htmlFor="unidade" className="active">Unidade</label>
                </div>*/}
            </div>
            {/*<div className="row">
                <div className="input-field col s6">
                    <input
                        id="categoria"
                        type="text"
                        value={product.categoria}
                       
                    />
                    <label htmlFor="categoria" className="active">Categoria</label>
                </div>
                <div className="input-field col s6">
                    <input
                        id="marca"
                        type="text"
                        value={product.marca}
                       
                    />
                    <label htmlFor="marca" className="active">Marca</label>
                </div>
            </div>
            <div className="row">
                <div className="input-field col s12">
                    <input
                        id="url_img"
                        type="text"
                        value={product.url_img}
                       
                    />
                    <label htmlFor="url_img" className="active">URL da Imagem</label>
                </div>
            </div>*/}
            <div className="row">
                <button
                    className="btn green"
                    onClick={handleAddProduct}
                    style={{ marginRight: '10px' }}
                >
                    Adicionar Produto
                </button>
                <button
                    className="btn blue"
                    onClick={handleFinalizeList}
                >
                    Finalizar Lista
                </button>
            </div>
            <div className="row" style={{ marginTop: '20px' }}>
                <table className="striped">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Preço Unitário</th>
                            <th>Quantidade</th>
                               {/*<th>Unidade</th>
                            <th>Categoria</th>
                            <th>Marca</th>*/}
                        </tr>
                    </thead>
                    <tbody>
                        {productList.map((item, index) => (
                            <tr key={index}>
                                <td>{item.nome}</td>
                                <td>{item.precoUn}</td>
                                <td>{item.quantidade}</td>
                               {/* <td>{item.unidade}</td>
                                <td>{item.categoria}</td>
                                <td>{item.marca}</td>*/}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CreateFromVoice;
