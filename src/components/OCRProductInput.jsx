import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

const OCRProductInput = () => {
    const [productName, setProductName] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCapture = async (event, field) => {
        const file = event.target.files[0];
        if (!file) return;

        setLoading(true);

        try {
            const result = await Tesseract.recognize(file, 'por', { // Alterado para o idioma português
                logger: (info) => console.log(info),
            });

            const detectedText = result.data.text.trim();
            alert(detectedText);
            if (field === 'name') {
                setProductName(detectedText);
            } else if (field === 'price') {
                setProductPrice(detectedText);
            }
        } catch (error) {
            console.error('Erro ao processar a imagem:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ marginTop: '20px' }}>
            <h4>Capturar Nome e Preço do Produto</h4>

            <div className="input-field">
                <label htmlFor="productName">Nome do Produto</label>
                <input
                    type="text"
                    id="productName"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Nome do Produto"
                />
                <button
                    className="btn waves-effect waves-light"
                    onClick={() => document.getElementById('nameCapture').click()}
                >
                    Capturar Nome
                </button>
                <input
                    type="file"
                    id="nameCapture"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={(e) => handleCapture(e, 'name')}
                />
            </div>

            <div className="input-field">
                <label htmlFor="productPrice">Preço do Produto</label>
                <input
                    type="text"
                    id="productPrice"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="Preço do Produto"
                />
                <button
                    className="btn waves-effect waves-light"
                    onClick={() => document.getElementById('priceCapture').click()}
                >
                    Capturar Preço
                </button>
                <input
                    type="file"
                    id="priceCapture"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={(e) => handleCapture(e, 'price')}
                />
            </div>

            {loading && <p>Processando imagem, por favor aguarde...</p>}
        </div>
    );
};

export default OCRProductInput;
