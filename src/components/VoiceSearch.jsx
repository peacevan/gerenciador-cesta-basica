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

    const handleVoiceSearch = () => {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                alert("Seu navegador não suporta reconhecimento de voz.");
                return;
            }

            const recognition = new SpeechRecognition();
            recognition.lang = 'pt-BR';
            recognition.interimResults = false; // Ensure only final results are processed
            recognition.maxAlternatives = 1;

            recognition.onresult = (event) => {
                const voiceInput = event.results[0][0].transcript.trim();
                console.log("Texto reconhecido:", voiceInput); // Debugging log
                setSearchTerm(voiceInput);
                parseInput(voiceInput); // Ensure parseInput is called with the recognized text
            };

            recognition.onerror = (event) => {
                console.error("Erro no reconhecimento de voz:", event.error);
                alert("Erro no reconhecimento de voz. Tente novamente.");
            };

            recognition.onend = () => {
                console.log("Reconhecimento de voz finalizado.");
            };

            recognition.start();
        } catch (error) {
            console.error("Erro ao iniciar o reconhecimento de voz:", error);
            alert("Erro ao iniciar o reconhecimento de voz. Verifique se seu dispositivo suporta essa funcionalidade.");
        }
    };

    return (
        <div className="voice-search">
            <div className="row" style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: '1 1 80%' }}>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Ex: 5 arroz 5.50"
                        style={{ width: '100%' }}
                    />
                </div>
                <div style={{ flex: '0 0 auto', marginLeft: '10px' }}>
                    <button
                        type="button"
                        className="btn-flat"
                        onClick={handleVoiceSearch}
                    >
                        <i className="material-icons">mic</i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VoiceSearch;
