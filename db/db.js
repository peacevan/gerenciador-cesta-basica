// Inicialização do banco de dados usando Dexie
const db = new Dexie('gerenciadorCestaBasica');

// Definição do esquema - versão 1 atualizada
db.version(1).stores({
    carrinho: '++id, nome, unidade, status_escolhido',
    compras: '++id, mes, dataCompra'
});

// Função para adicionar ou atualizar um item no carrinho
async function addItemToCarrinho(data) {
    try {
        // Se tiver ID, é uma atualização
        if (data.id) {
            const id = parseInt(data.id, 10);
            await db.carrinho.update(id, {
                nome: data.nome.toUpperCase(),
                quantidade: parseInt(data.quantidade),
                precoUn: parseFloat(data.precoUn),
                unidade: data.unidade.toUpperCase(),
                status_escolhido: data.status_escolhido !== undefined ? data.status_escolhido : true
            });
            console.log("Item atualizado com sucesso");
            return id;
        } 
        // Senão, é uma inserção
        else {
            const newItemId = await db.carrinho.add({
                nome: data.nome.toUpperCase(),
                quantidade: parseInt(data.quantidade),
                precoUn: parseFloat(data.precoUn),
                unidade: data.unidade.toUpperCase(),
                status_escolhido: true
            });
            console.log("Item adicionado com sucesso, ID:", newItemId);
            return newItemId;
        }
    } catch (error) {
        console.error("Erro ao adicionar/atualizar item:", error);
        throw error;
    }
}

// Função para listar todos os itens do carrinho
async function listCarrinhoItems() {
    try {
        const items = await db.carrinho.toArray();
        console.log("Itens do carrinho obtidos com sucesso:", items);
        return items || [];
    } catch (error) {
        console.error("Erro ao listar itens do carrinho:", error);
        throw error;
    }
}

// Função para remover um item do carrinho
async function removeItemFromCarrinho(id) {
    try {
        const integerId = parseInt(id, 10);
        await db.carrinho.delete(integerId);
        console.log("Item removido com sucesso");
        atualizarLista();
        return true;
    } catch (error) {
        console.error("Erro ao remover item:", error);
        throw error;
    }
}

// Função para buscar um item por ID
async function buscarItemPorId(id) {
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
}

// Função para finalizar uma compra do mês
async function finalizarCompra(mes) {
    try {
        // Verifica se o formato do mês é válido
        if (!/^\d{2}\/\d{4}$/.test(mes)) {
            throw new Error("Formato de mês inválido. Esperado MM/AAAA.");
        }

        // Obtém somente os itens marcados/selecionados
        const carrinhoItems = await db.carrinho.where('status_escolhido').equals(true).toArray();
        
        if (carrinhoItems.length === 0) {
            throw new Error("Não há itens selecionados para finalizar a compra");
        }
        
        const totalCompra = carrinhoItems.reduce((total, item) => total + (item.precoUn * item.quantidade), 0);
        const dataCompra = new Date().toISOString();
        const mesFormatado = formatarNomeMes(mes);
        
        // Verifica se já existe uma compra para este mês
        const compraExistente = await db.compras.where('mes').equals(mes).first();
        
        if (compraExistente) {
            // Atualiza a compra existente
            const novoTotal = compraExistente.totalCompra + totalCompra;
            const itensAtualizados = [...compraExistente.carrinho, ...carrinhoItems];
            
            await db.compras.update(compraExistente.id, {
                totalCompra: novoTotal,
                dataCompra: dataCompra,
                carrinho: itensAtualizados
            });
            
            console.log("Compra atualizada para o mês:", mesFormatado);
        } else {
            // Cria uma nova compra
            await db.compras.add({
                mes: mes,
                mesFormatado: mesFormatado,
                totalCompra: totalCompra,
                dataCompra: dataCompra,
                carrinho: carrinhoItems
            });
            
            console.log("Compra finalizada para o mês:", mesFormatado);
        }
        
        // Remove os itens finalizados do carrinho
        for (const item of carrinhoItems) {
            await db.carrinho.delete(item.id);
        }
        
        return true;
    } catch (error) {
        console.error("Erro ao finalizar compra:", error);
        throw error;
    }
}

// Função para formatar o nome do mês
function formatarNomeMes(mes) {
    const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", 
        "Maio", "Junho", "Julho", "Agosto", 
        "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    
    // Verifica se o formato é MM/AAAA
    const partes = mes.split('/');
    if (partes.length === 2) {
        const mesIndex = parseInt(partes[0], 10) - 1; // -1 porque os índices de array começam em 0
        if (mesIndex >= 0 && mesIndex < 12) {
            return `${meses[mesIndex]} ${partes[1]}`;
        }
    }
    
    return mes;
}

// Função para listar todas as compras
async function listarCompras() {
    try {
        const compras = await db.compras.toArray();
        console.log("Compras obtidas com sucesso:", compras);
        return compras || [];
    } catch (error) {
        console.error("Erro ao listar compras:", error);
        throw error;
    }
}

// Função para obter uma compra por mês
async function getCompraByMes(mes) {
    try {
        const compra = await db.compras.where('mes').equals(mes).first();
        console.log("Compra para o mês", mes, ":", compra);
        return compra;
    } catch (error) {
        console.error("Erro ao buscar compra por mês:", error);
        throw error;
    }
}

// Função para inicializar o banco de dados - não é mais necessária com Dexie
// mas mantida para compatibilidade
async function initializeDatabase() {
    console.log("Banco de dados inicializado com Dexie");
    return db;
}

// Função para carregar itens do banco de dados
async function loadItemsFromDatabase() {
    try {
        console.log("Carregando itens do banco de dados");
        const items = await listCarrinhoItems();
        console.log("Itens carregados:", items);
        return items;
    } catch (error) {
        console.error("Erro ao carregar itens:", error);
        throw error;
    }
}

// Função para atualizar a lista
function atualizarLista() {
    // Chamar atualizarLista2 em vez da implementação antiga
    if (typeof atualizarLista2 === 'function') {
        atualizarLista2();
    } else {
        // Manter compatibilidade com código antigo se necessário
        loadItemsFromDatabase().then(items => {
            let lista = document.getElementById("lista-compras");
            lista.innerHTML = "";
            if (Array.isArray(items) && items.length > 0) {
                items.forEach((item, index) => {
                    if (typeof item === 'object' && item !== null) {
                        item.totalProduto = (item.quantidade || 0) * (item.precoUn || 0);
                        let itemHTML = criarItemHTML(item, index);
                        if (itemHTML.trim() !== '') {
                            lista.insertAdjacentHTML("beforeend", itemHTML);
                        } else {
                            console.error(`Falha ao criar HTML do item ${index}:`, item);
                        }
                    } else {
                        console.error(`Item não é um objeto válido:`, item);
                    }
                });
            } else {
                console.warn("Não há itens ou o array está vazio.");
            }
  
            initializeDropdowns();
            var modal = document.querySelector(".modal");
            var trigger = document.querySelector(".modal-trigger");
         
            if (!modal || !trigger) {
                console.error("Modal ou trigger não encontrado!");
                return;
            }
        }).catch(error => {
            console.error("Erro ao atualizar lista:", error);
        });
    }
}
