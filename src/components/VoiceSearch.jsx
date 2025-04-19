import React, { useState } from 'react';
import Dexie from 'dexie';

const db = new Dexie("SmartListDB");
db.version(210).stores({
    products: "++id, nome, precoUn, quantidade, unidade, categoria, url_img, marca"
});

const VoiceSearch = ({ onProductFound }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const wordsToNumbers = (word) => {
        const numberWords = {
            um: 1, dois: 2, três: 3, quatro: 4, cinco: 5,
            seis: 6, sete: 7, oito: 8, nove: 9, dez: 10
        };
        return numberWords[word.toLowerCase()] || null;
    };

    const parseInput = async (input) => {
        const parts = input.trim().split(/\s+/); // Split input into words
        let quantidade = 1;
        let precoUn = '';
        let nome = '';

        if (parts.length > 0) {
            // Check if the first part is a number or a word representing a number
            if (!isNaN(parts[0])) {
                quantidade = parseInt(parts[0], 10);
                parts.shift(); // Remove the first part
            } else {
                const numberFromWord = wordsToNumbers(parts[0]);
                if (numberFromWord !== null) {
                    quantidade = numberFromWord;
                    parts.shift(); // Remove the first part
                }
            }

            // Check if the last part is a price
            const lastPart = parts[parts.length - 1];
            if (lastPart && (lastPart.includes('.') || lastPart.includes(','))) {
                precoUn = parseFloat(lastPart.replace(',', '.'));
                parts.pop(); // Remove the last part
            }

            // The remaining parts are the product name
            nome = parts.join(' ').trim();
        }

        // Check database for product if price is missing
        const product = await db.products.where('nome').equalsIgnoreCase(nome).first();
        if (product) {
            onProductFound({
                nome: product.nome,
                precoUn: precoUn || product.precoUn,
                quantidade: quantidade || 1,
                unidade: product.unidade,
                categoria: product.categoria,
                url_img: product.url_img,
                marca: product.marca
            });
        } else {
            onProductFound({
                nome,
                precoUn: precoUn || '',
                quantidade: quantidade || 1,
                unidade: '',
                categoria: '',
                url_img: '',
                marca: ''
            });
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        parseInput(value);
    };

    const handleVoiceSearch = () => {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'pt-BR';
        recognition.onresult = (event) => {
            const voiceInput = event.results[0][0].transcript;
            setSearchTerm(voiceInput);
            parseInput(voiceInput);
        };
        recognition.start();
    };

    return (
        <div className="voice-search">
            <div className="input-field">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    placeholder="Ex: 5 arroz R$5,50"
                />
                <button
                    type="button"
                    className="btn-flat"
                    onClick={handleVoiceSearch}
                    style={{ marginLeft: '10px' }}
                >
                    <i className="material-icons">mic</i>
                </button>
            </div>
        </div>
    );
};

export default VoiceSearch;
