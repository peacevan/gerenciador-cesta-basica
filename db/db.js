import Dexie from 'dexie';

// Inicialização do banco de dados usando Dexie
const db = new Dexie('gerenciadorCestaBasica');

db.version(210).stores({
    carrinho: '++id, nome, unidade, status_escolhido',
    compras: '++id, mes, dataCompra',
    cadastro_produtos: '++id,nome,precoUn,quantidade,unidade,categoria,url_foto,obs,cod_barra'
});

// Hook para inicializar o banco de dados
export const useDatabase = () => {
    return db;
};

// Função para adicionar ou atualizar um item no carrinho
export const addItemToCarrinho = async (data) => {
    try {
        if (data.id) {
            const id = parseInt(data.id, 10);
            await db.carrinho.update(id, {
                nome: data.nome.toUpperCase(),
                quantidade: parseInt(data.quantidade),
                precoUn: parseFloat(data.precoUn),
                unidade: data.unidade.toUpperCase(),
                status_escolhido: data.status_escolhido !== undefined ? data.status_escolhido : true
            });
            return id;
        } else {
            const newItemId = await db.carrinho.add({
                nome: data.nome.toUpperCase(),
                quantidade: parseInt(data.quantidade),
                precoUn: parseFloat(data.precoUn),
                unidade: data.unidade.toUpperCase(),
                status_escolhido: true
            });
            return newItemId;
        }
    } catch (error) {
        console.error("Erro ao adicionar/atualizar item:", error);
        throw error;
    }
};

// Função para listar todos os itens do carrinho
export const listCarrinhoItems = async () => {
    try {
        const items = await db.carrinho.toArray();
        return items || [];
    } catch (error) {
        console.error("Erro ao listar itens do carrinho:", error);
        throw error;
    }
};

// Função para remover um item do carrinho
export const removeItemFromCarrinho = async (id) => {
    try {
            const integerId = parseInt(id, 10);
        await db.carrinho.delete(integerId);
        return true;
    } catch (error) {
        console.error("Erro ao remover item:", error);
        throw error;
    }
};

// Função para buscar um item por ID
export const buscarItemPorId = async (id) => {
    try {
        const integerId = parseInt(id, 10);
        const item = await db.carrinho.get(integerId);
        if (!item) {
            throw new Error(`Item com ID ${id} não encontrado`);
        }
        return item;
    } catch (error) {
        console.error("Erro ao buscar item:", error);
        throw error;
    }
};

// Função para finalizar uma compra do mês
export const finalizarCompra = async (mes) => {
    try {
        if (!/^\d{2}\/\d{4}$/.test(mes)) {
            throw new Error("Formato de mês inválido. Esperado MM/AAAA.");
        }

        const carrinhoItems = (await db.carrinho.toArray()).filter(item => item.status_escolhido);
        if (carrinhoItems.length === 0) {
            throw new Error("Não há itens selecionados para finalizar a compra");
        }

                const totalCompra = carrinhoItems.reduce((total, item) => total + (item.precoUn * item.quantidade), 0);
        const dataCompra = new Date().toISOString();

        const compraExistente = await db.compras.where('mes').equals(mes).first();
        if (compraExistente) {
            const novoTotal = compraExistente.totalCompra + totalCompra;
            const itensAtualizados = [...compraExistente.carrinho, ...carrinhoItems];
            await db.compras.update(compraExistente.id, {
                totalCompra: novoTotal,
                dataCompra: dataCompra,
                carrinho: itensAtualizados
            });
        } else {
            await db.compras.add({
                mes: mes,
                totalCompra: totalCompra,
                dataCompra: dataCompra,
                carrinho: carrinhoItems
            });
        }

        for (const item of carrinhoItems) {
            await db.carrinho.delete(item.id);
        }

        return true;
    } catch (error) {
        console.error("Erro ao finalizar compra:", error);
        throw error;
    }
};

// Função para listar todas as compras
export const listarCompras = async () => {
    try {
        const compras = await db.compras.toArray();
        return compras || [];
          } catch (error) {
        console.error("Erro ao listar compras:", error);
            throw error;
          }
};
