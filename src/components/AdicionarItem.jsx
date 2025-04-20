import React, { useState, useEffect } from 'react';
import { addItemToCarrinho } from '../../db/db';
import IMask from 'imask';

const AdicionarItem = () => {
    const [nome, setNome] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [unidade, setUnidade] = useState('');
    const [precoUn, setPrecoUn] = useState('');

    useEffect(() => {
        const input = document.getElementById('preco-unitario');
        if (input) {
            IMask(input, {
                mask: 'R$ num',
                blocks: {
                    num: {
                        mask: Number,
                        thousandsSeparator: '.',
                        radix: ',',
                        scale: 2,
                        signed: false,
                        padFractionalZeros: true,
                        normalizeZeros: true,
                        mapToRadix: ['.']
                    }
                }
            });
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await addItemToCarrinho({
                nome,
                quantidade,
                unidade,
                precoUn
            });
            alert('Item adicionado com sucesso!');
            setNome('');
            setQuantidade('');
            setUnidade('');
            setPrecoUn('');
        } catch (error) {
            console.error('Erro ao adicionar item:', error);
            alert('Erro ao adicionar item. Tente novamente.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>Nome :</label>
                <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                />
            </div>
            <div style={{ display: 'flex', gap: '10px',width: '100%'  }}>
                <div style={{ flex: 1 }}>
                    <label>Quantidade:</label>
                    <input
                        type="number"
                        value={quantidade}
                        onChange={(e) => setQuantidade(e.target.value)}
                        required
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <label>Preço Unitário:</label>
                    <input
                        id="preco-unitario"
                        type="text"
                        value={precoUn}
                        onChange={(e) => setPrecoUn(e.target.value)}
                        required
                    />
                </div>
            </div>
            <div>
                <label>Unidade:</label>
                <input
                    type="text"
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    required
                />
            </div>
            <button type="submit">Adicionar</button>
        </form>
    );
};

export default AdicionarItem;