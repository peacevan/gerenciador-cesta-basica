import React, { useState } from 'react';

const CreateFromVoice = () => {
    const [productName, setProductName] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [listening, setListening] = useState(false);

    const handleVoiceInput = (field) => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Seu navegador não suporta reconhecimento de voz.');
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setListening(true);
        recognition.onend = () => setListening(false);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.trim();
            if (field === 'name') {
                setProductName(transcript);
            } else if (field === 'price') {
                setProductPrice(transcript);
            }
        };

        recognition.onerror = (event) => {
            console.error('Erro no reconhecimento de voz:', event.error);
            alert('Erro ao capturar a fala. Tente novamente.');
        };

        recognition.start();
    };

    return (
        <div className="container" style={{ marginTop: '20px' }}>
            <h4>Adicionar Nome e Preço do Produto por Voz</h4>

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
                    onClick={() => handleVoiceInput('name')}
                >
                    {listening ? 'Ouvindo...' : 'Falar Nome'}
                </button>
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
                    onClick={() => handleVoiceInput('price')}
                >
                    {listening ? 'Ouvindo...' : 'Falar Preço'}
                </button>
            </div>
        </div>
    );
};

export default CreateFromVoice;
