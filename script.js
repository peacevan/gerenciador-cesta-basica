const STORAGE_KEY = 'listaCompras';
let itens = [];
let recognition = null;
let isListening = false;

// ─── localStorage ────────────────────────────────────────────────────────────

function salvarLista() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
}

function carregarLista() {
    const dados = localStorage.getItem(STORAGE_KEY);
    if (dados) {
        try {
            itens = JSON.parse(dados);
        } catch (e) {
            itens = [];
        }
    } else {
        // Dados iniciais de exemplo
        itens = [
            { id: 1, nome: 'Arroz',          quantidade: 8,  unidade: 'kg', precoUn: 40.00, marcado: true },
            { id: 2, nome: 'Feijão',          quantidade: 5,  unidade: 'kg', precoUn: 35.00, marcado: true },
            { id: 3, nome: 'Macarrão',        quantidade: 3,  unidade: 'kg', precoUn: 18.00, marcado: true },
            { id: 4, nome: 'Farinha de trigo',quantidade: 2,  unidade: 'kg', precoUn: 10.00, marcado: true },
            { id: 5, nome: 'Carne bovina',    quantidade: 4,  unidade: 'kg', precoUn: 160.00,marcado: true },
            { id: 6, nome: 'Peito de frango', quantidade: 4,  unidade: 'kg', precoUn: 80.00, marcado: true },
            { id: 7, nome: 'Ovos',            quantidade: 3,  unidade: 'dúz',precoUn: 36.00, marcado: true },
            { id: 8, nome: 'Leite',           quantidade: 15, unidade: 'lt', precoUn: 75.00, marcado: true },
            { id: 9, nome: 'Banana',          quantidade: 5,  unidade: 'dúz',precoUn: 25.00, marcado: true },
            { id:10, nome: 'Maçã',            quantidade: 3,  unidade: 'kg', precoUn: 21.00, marcado: true },
            { id:11, nome: 'Batata',          quantidade: 5,  unidade: 'kg', precoUn: 20.00, marcado: true }
        ];
        salvarLista();
    }
    atualizarLista();
}

function limparLista() {
    if (confirm('Deseja realmente limpar toda a lista?')) {
        itens = [];
        salvarLista();
        atualizarLista();
    }
}

// ─── Renderização ─────────────────────────────────────────────────────────────

function atualizarLista() {
    const lista = document.getElementById('lista-compras');
    if (!lista) return;
    lista.innerHTML = '';

    itens.forEach((item) => {
        item.totalProduto = item.quantidade * item.precoUn;
        lista.insertAdjacentHTML('beforeend', criarItemHTML(item));
    });

    atualizarTotais();
}

function criarItemHTML(item) {
    const marcado = item.marcado !== false;
    const totalFormatado = (item.quantidade * item.precoUn).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const precoFormatado  = item.precoUn.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const nomeEscapado    = escapeHtml(item.nome);
    return `
        <div class="row row-item${marcado ? '' : ' item-desmarcado'}">
            <div class="col col-checkbox">
                <label>
                    <input type="checkbox" class="filled-in item-checkbox" data-id="${item.id}"${marcado ? ' checked' : ''}>
                    <span></span>
                </label>
            </div>
            <div class="col col-item-nome">
                <span class="item-name">${nomeEscapado}</span>
                <div class="item-detail">
                    <span>${item.quantidade} ${item.unidade} x ${precoFormatado} = ${totalFormatado}</span>
                </div>
            </div>
            <div class="col col-delete">
                <button class="btn-floating btn-small waves-effect waves-light red btn-delete-item"
                        data-id="${item.id}" title="Remover item">
                    <i class="material-icons">delete</i>
                </button>
            </div>
        </div>`;
}

function escapeHtml(texto) {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ─── Totais ───────────────────────────────────────────────────────────────────

function atualizarTotais() {
    const marcados = itens.filter(i => i.marcado !== false);
    const total = marcados.reduce((acc, i) => acc + (i.quantidade * i.precoUn), 0);

    const elTotal = document.getElementById('total-real');
    if (elTotal) {
        elTotal.innerText = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    const elMarcados = document.getElementById('itens-marcados');
    const elTotalItens = document.getElementById('total-itens');
    if (elMarcados) elMarcados.textContent = marcados.length;
    if (elTotalItens) elTotalItens.textContent = itens.length;
}

// ─── Adicionar / Remover itens ────────────────────────────────────────────────

function adicionarItem() {
    const nome     = document.getElementById('new-item').value.trim();
    const qtd      = parseFloat(document.getElementById('new-quantity').value);
    const precoRaw = document.querySelector('#new-price').value
                        .replace(/[^\d,]/g, '')
                        .replace(',', '.');
    const unidade  = document.getElementById('new-unity').value.trim();
    const preco    = parseFloat(precoRaw);

    if (!nome) {
        destacarCampoInvalido('new-item');
        return;
    }
    if (!(qtd > 0)) {
        destacarCampoInvalido('new-quantity');
        return;
    }
    if (!unidade) {
        destacarCampoInvalido('new-unity');
        return;
    }
    if (isNaN(preco) || preco < 0) {
        destacarCampoInvalido('new-price');
        return;
    }

    itens.push({
        id: Date.now(),
        nome,
        quantidade: qtd,
        precoUn: preco,
        unidade,
        marcado: true,
        totalProduto: qtd * preco
    });

    salvarLista();
    atualizarLista();

    document.getElementById('new-item').value     = '';
    document.getElementById('new-quantity').value = '';
    document.getElementById('new-price').value    = '';
    document.getElementById('new-unity').value    = '';
    atualizarBotaoAdicionar();
}

function removerItem(id) {
    itens = itens.filter(i => i.id !== id);
    salvarLista();
    atualizarLista();
}

function destacarCampoInvalido(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('campo-invalido');
    el.focus();
    setTimeout(() => el.classList.remove('campo-invalido'), 2000);
}

// ─── Validação do formulário ──────────────────────────────────────────────────

function isFormValid() {
    const nome  = document.getElementById('new-item').value.trim();
    const qtd   = parseFloat(document.getElementById('new-quantity').value);
    const preco = document.querySelector('#new-price').value.replace(/[^\d,]/g, '').replace(',', '.');
    const un    = document.getElementById('new-unity').value.trim();
    return nome && qtd > 0 && un && preco !== '' && !isNaN(parseFloat(preco));
}

function atualizarBotaoAdicionar() {
    const btAdd = document.getElementById('bt-add-item');
    if (btAdd) btAdd.disabled = !isFormValid();
}

function adicionarItemModal() {
    adicionarItem();
}

function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal && M && M.Modal) {
        const inst = M.Modal.getInstance(modal);
        if (inst) inst.close();
    }
}

// ─── Parser de comandos de voz ────────────────────────────────────────────────

function normalizarUnidade(unidade) {
    const mapa = {
        // kg
        'quilos': 'kg', 'quilo': 'kg', 'quilograma': 'kg', 'quilogramas': 'kg',
        'kilo': 'kg', 'kilos': 'kg',
        // lt
        'litros': 'lt', 'litro': 'lt',
        // un
        'unidades': 'un', 'unidade': 'un', 'und': 'un',
        'lata': 'un', 'latas': 'un',
        'garrafa': 'un', 'garrafas': 'un',
        'caixa': 'un', 'caixas': 'un',
        'frasco': 'un', 'frascos': 'un',
        'pote': 'un', 'potes': 'un',
        'tablete': 'un', 'tabletes': 'un',
        'barra': 'un', 'barras': 'un',
        'rolo': 'un', 'rolos': 'un',
        'sache': 'un', 'saches': 'un', 'sachê': 'un', 'sachês': 'un',
        // dúz
        'dúzias': 'dúz', 'dúzia': 'dúz', 'duzias': 'dúz', 'duzia': 'dúz',
        // pq
        'pacote': 'pq', 'pacotes': 'pq',
        'saco': 'pq', 'sacos': 'pq',
        'pct': 'pq',
    };
    return mapa[unidade.toLowerCase()] || unidade.toLowerCase();
}

// Tabelas usadas por converterNumeroPalavra (definidas uma única vez no nível do módulo)
const _NUM_DEZ = { 'vinte': 20, 'trinta': 30, 'quarenta': 40, 'cinquenta': 50,
                   'sessenta': 60, 'setenta': 70, 'oitenta': 80, 'noventa': 90 };
const _NUM_UNI = { 'um': 1, 'uma': 1, 'dois': 2, 'duas': 2, 'três': 3, 'tres': 3,
                   'quatro': 4, 'cinco': 5, 'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9 };
const _NUM_SIMPLES = {
    'zero': '0', 'um': '1', 'uma': '1', 'dois': '2', 'duas': '2',
    'três': '3', 'tres': '3', 'quatro': '4', 'cinco': '5', 'seis': '6',
    'sete': '7', 'oito': '8', 'nove': '9', 'dez': '10',
    'onze': '11', 'doze': '12', 'treze': '13',
    'catorze': '14', 'quatorze': '14', 'quinze': '15',
    'dezesseis': '16', 'dezasseis': '16',
    'dezessete': '17', 'dezassete': '17',
    'dezoito': '18', 'dezenove': '19', 'dezanove': '19',
    'vinte': '20', 'trinta': '30', 'quarenta': '40',
    'cinquenta': '50', 'sessenta': '60', 'setenta': '70',
    'oitenta': '80', 'noventa': '90', 'cem': '100', 'cento': '100',
    'meia': '0.5', 'meio': '0.5',
};
// Regex compilados uma única vez
const _RE_COMPOSTO = new RegExp(
    `\\b(${Object.keys(_NUM_DEZ).join('|')})\\s+e\\s+(${Object.keys(_NUM_UNI).join('|')})\\b`, 'gi'
);
const _RE_SIMPLES = new RegExp(`\\b(${Object.keys(_NUM_SIMPLES).join('|')})\\b`, 'gi');

// Converte números escritos por extenso em dígitos (suporte ao reconhecimento de voz)
function converterNumeroPalavra(texto) {
    // Primeira passagem: compostos "dezena + e + unidade" (ex: "vinte e cinco" → 25)
    texto = texto.replace(_RE_COMPOSTO, (m, dez, uni) =>
        String(_NUM_DEZ[dez.toLowerCase()] + _NUM_UNI[uni.toLowerCase()])
    );
    // Segunda passagem: palavras simples
    return texto.replace(_RE_SIMPLES, (m) => _NUM_SIMPLES[m.toLowerCase()] ?? m);
}

// Grupo de unidades reconhecíveis em comandos de voz (espelha as chaves de normalizarUnidade)
const _U = 'kg|quilos?|kilo?s?|quilogramas?|lt|litros?|un|und|unidades?|d[uú]zias?|pacotes?|sacos?|latas?|garrafas?|caixas?|frascos?|potes?|tabletes?|barras?|rolos?|sach[eê]s?|pct';

// Conector de preço opcional: "a", "por", "custa"
const _CP = '(?:a\\s+|por\\s+|custa\\s+|custando\\s+)?';

function parseVoiceCommand(texto) {
    // Normalizar: minúsculas, símbolo de moeda, números por extenso
    texto = texto.toLowerCase().trim();
    texto = texto.replace(/r?\$\s*/g, '');   // remove "$3" ou "R$3" → "3"
    texto = converterNumeroPalavra(texto);

    // Remover verbos de comando iniciais (suporte a formas expandidas)
    texto = texto.replace(
        /^(?:(?:quero|queria|preciso|pode|por\s+favor)\s+)?(?:adicionar?|adiciona|colocar?|coloca|p[oõ]e|por|botar?|bota|incluir?|inclui|comprar?|compra|me\s+adiciona?)\s+(?:de?\s+)?/i,
        ''
    ).trim();

    // Padrões ordenados do mais específico ao mais genérico
    // Grupo A – quantidade primeiro (mais natural em fala: "5 quilos de arroz")
    // Grupo B – item primeiro (formato original:  "arroz 5 quilos")
    const patterns = [
        // A1 – "5 quilos de arroz 25 reais e 50 centavos"
        [new RegExp(`^(\\d+(?:[,.]\\d+)?)\\s*(${_U})\\s+(?:de\\s+)?(.+?)\\s+(\\d+)\\s*reais?\\s+e\\s+(\\d+)`, 'i'), 'QF-cents'],
        // A2 – "5 quilos de arroz a 25 reais" | "5 quilos de arroz 25 reais"
        [new RegExp(`^(\\d+(?:[,.]\\d+)?)\\s*(${_U})\\s+(?:de\\s+)?(.+?)\\s+${_CP}(\\d+(?:[,.]\\d+)?)\\s*reais?`, 'i'), 'QF-reais'],
        // A3 – "5 quilos de arroz 25"  (sem palavra "reais", fim de frase)
        [new RegExp(`^(\\d+(?:[,.]\\d+)?)\\s*(${_U})\\s+(?:de\\s+)?(.+?)\\s+${_CP}(\\d+(?:[,.]\\d+)?)\\s*$`, 'i'), 'QF-bare'],
        // B1 – "arroz 5 quilos 25 reais e 50 centavos"
        [new RegExp(`^(.+?)\\s+(\\d+(?:[,.]\\d+)?)\\s*(${_U})\\s+(\\d+)\\s*reais?\\s+e\\s+(\\d+)`, 'i'), 'IF-cents'],
        // B2 – "arroz 5 quilos a 25 reais" | "arroz 5 quilos 25 reais"
        [new RegExp(`^(.+?)\\s+(\\d+(?:[,.]\\d+)?)\\s*(${_U})\\s+${_CP}(\\d+(?:[,.]\\d+)?)\\s*reais?`, 'i'), 'IF-reais'],
        // B3 – "arroz 5 kg 25"  (unidades abreviadas, sem "reais")
        [new RegExp(`^(.+?)\\s+(\\d+(?:[,.]\\d+)?)\\s*(${_U})\\s+${_CP}(\\d+(?:[,.]\\d+)?)`, 'i'), 'IF-bare'],
        // C1 – "3 pacotes de sabão" | "5 kg de arroz"  (sem preço, quantidade primeiro)
        [new RegExp(`^(\\d+(?:[,.]\\d+)?)\\s*(${_U})\\s+(?:de\\s+)?(.+?)\\s*$`, 'i'), 'QF-nopreco'],
        // C2 – "sabão 3 pacotes" | "arroz 5 kg"  (sem preço, item primeiro)
        [new RegExp(`^(.+?)\\s+(\\d+(?:[,.]\\d+)?)\\s*(${_U})\\s*$`, 'i'), 'IF-nopreco'],
    ];

    for (const [pattern, tipo] of patterns) {
        const m = texto.match(pattern);
        if (!m) continue;

        let nome, quantidade, unidade, preco;

        if (tipo.startsWith('QF')) {
            // grupos: 1=qtd, 2=unidade, 3=nome, [4=preço, 5=centavos]
            quantidade = parseFloat(m[1].replace(',', '.'));
            unidade    = normalizarUnidade(m[2]);
            nome       = m[3].trim();
            if (tipo === 'QF-nopreco') {
                preco = 0;
            } else {
                preco = tipo === 'QF-cents'
                    ? parseFloat(m[4] + '.' + m[5].padStart(2, '0'))
                    : parseFloat(m[4].replace(',', '.'));
            }
        } else {
            // grupos: 1=nome, 2=qtd, 3=unidade, [4=preço, 5=centavos]
            nome       = m[1].trim();
            quantidade = parseFloat(m[2].replace(',', '.'));
            unidade    = normalizarUnidade(m[3]);
            if (tipo === 'IF-nopreco') {
                preco = 0;
            } else {
                preco = tipo === 'IF-cents'
                    ? parseFloat(m[4] + '.' + m[5].padStart(2, '0'))
                    : parseFloat(m[4].replace(',', '.'));
            }
        }

        if (!nome || nome.length < 2) continue;  // nomes com 1 letra são inválidos (ex: ruído)
        if (isNaN(quantidade) || quantidade <= 0) continue;
        if (isNaN(preco) || preco < 0) continue;

        return { nome, quantidade, unidade, preco };
    }

    return null;
}

// ─── Reconhecimento de voz ────────────────────────────────────────────────────

function inicializarReconhecimentoVoz() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        const btn = document.getElementById('mic-button');
        if (btn) {
            btn.title = 'Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.';
            btn.disabled = true;
            btn.style.opacity = '0.5';
        }
        return null;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
        isListening = true;
        const btn = document.getElementById('mic-button');
        if (btn) btn.classList.add('listening');
        mostrarFeedback('🎤 Estou ouvindo...', 'info');
    };

    recognition.onresult = (event) => {
        const result     = event.results[0];
        const primário   = result[0].transcript;
        mostrarFeedback(`Ouvi: "${primário}"`, 'info');

        if (result.isFinal) {
            // Tenta cada alternativa do reconhecimento até encontrar um match
            let parsed = null;
            for (let i = 0; i < result.length; i++) {
                parsed = parseVoiceCommand(result[i].transcript);
                if (parsed) break;
            }

            if (parsed) {
                adicionarItemPorVoz(parsed);
                mostrarFeedback(`✅ "${parsed.nome}" adicionado com sucesso!`, 'success');
            } else {
                mostrarFeedback(
                    `❌ Não entendi "${primário}". Exemplos: "5 quilos de arroz 25 reais" ou "arroz 5 kg a 25 reais"`,
                    'error'
                );
            }
        }
    };

    recognition.onerror = (event) => {
        isListening = false;
        const btn = document.getElementById('mic-button');
        if (btn) btn.classList.remove('listening');
        if (event.error === 'no-speech') {
            mostrarFeedback('⚠️ Nenhuma fala detectada. Tente novamente.', 'warning');
        } else if (event.error === 'not-allowed') {
            mostrarFeedback('❌ Permissão de microfone negada. Habilite nas configurações.', 'error');
        } else {
            mostrarFeedback(`❌ Erro: ${event.error}`, 'error');
        }
    };

    recognition.onend = () => {
        isListening = false;
        const btn = document.getElementById('mic-button');
        if (btn) btn.classList.remove('listening');
    };

    return recognition;
}

function toggleReconhecimentoVoz() {
    if (!recognition) {
        recognition = inicializarReconhecimentoVoz();
        if (!recognition) return;
    }

    if (isListening) {
        recognition.stop();
    } else {
        try {
            recognition.start();
        } catch (e) {
            mostrarFeedback('❌ Erro ao iniciar o microfone. Tente novamente.', 'error');
        }
    }
}

function adicionarItemPorVoz(parsed) {
    itens.push({
        id: Date.now(),
        nome: parsed.nome,
        quantidade: parsed.quantidade,
        unidade: parsed.unidade,
        precoUn: parsed.preco,
        marcado: true,
        totalProduto: parsed.quantidade * parsed.preco
    });
    salvarLista();
    atualizarLista();
}

function mostrarFeedback(mensagem, tipo) {
    const el = document.getElementById('feedback-area');
    if (!el) return;
    el.textContent = mensagem;
    el.className = 'feedback ' + tipo;

    const duracao = (tipo === 'error' || tipo === 'warning') ? 6000 : 3000;
    clearTimeout(el._feedbackTimer);
    el._feedbackTimer = setTimeout(() => {
        el.textContent = '';
        el.className = 'feedback';
    }, duracao);
}

// ─── Compartilhar lista ───────────────────────────────────────────────────────

function gerarTextoLista() {
    if (itens.length === 0) return 'Lista de compras vazia.';

    const marcados = itens.filter(i => i.marcado !== false);
    const linhas = itens.map(item => {
        const marcado = item.marcado !== false;
        const total = (item.quantidade * item.precoUn).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const preco = item.precoUn.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const check = marcado ? '✅' : '⬜';
        return `${check} ${item.nome} — ${item.quantidade} ${item.unidade} x ${preco} = ${total}`;
    });

    const totalGeral = marcados
        .reduce((acc, i) => acc + i.quantidade * i.precoUn, 0)
        .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return `🛒 Lista de Compras\n\n${linhas.join('\n')}\n\nTotal (marcados): ${totalGeral}`;
}

function compartilharLista() {
    const texto = gerarTextoLista();

    if (navigator.share) {
        navigator.share({
            title: 'Lista de Compras',
            text: texto
        }).catch(() => {});
        return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(() => {
            mostrarFeedback('📋 Lista copiada para a área de transferência!', 'success');
        }).catch(() => {
            abrirModalShare(texto);
        });
        return;
    }

    abrirModalShare(texto);
}

function abrirModalShare(texto) {
    const ta = document.getElementById('share-textarea');
    if (ta) ta.value = texto;

    const modal = document.getElementById('modal-share');
    if (!modal) return;

    if (typeof M !== 'undefined' && M.Modal) {
        const inst = M.Modal.getInstance(modal) || M.Modal.init(modal);
        inst.open();
        setTimeout(() => { if (ta) { ta.focus(); ta.select(); } }, 200);
    } else {
        modal.style.display = 'flex';
        setTimeout(() => { if (ta) { ta.focus(); ta.select(); } }, 50);
    }
}

function copiarTextoShare() {
    const ta = document.getElementById('share-textarea');
    if (!ta) return;
    ta.select();
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ta.value).then(() => {
            mostrarFeedback('📋 Lista copiada!', 'success');
        }).catch(() => {
            document.execCommand('copy');
            mostrarFeedback('📋 Lista copiada!', 'success');
        });
    } else {
        document.execCommand('copy');
        mostrarFeedback('📋 Lista copiada!', 'success');
    }
}

// ─── Inicialização ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {
    // Materialize
    if (typeof M !== 'undefined') {
        M.AutoInit();
        const modal   = document.querySelector('.modal');
        const trigger = document.querySelector('.modal-trigger');

        if (modal && trigger) {
            const instance = M.Modal.init(modal, {
                onCloseEnd: function () { formClear(); }
            });
            trigger.addEventListener('click', function () { instance.open(); });
        }

        const elems = document.querySelectorAll('select');
        if (elems.length) M.FormSelect.init(elems);
    }

    // jQuery maskMoney
    if (typeof $ !== 'undefined' && typeof $.fn.maskMoney !== 'undefined') {
        $('.currency').maskMoney({ prefix: 'R$ ', thousands: '.', decimal: ',' });
        $('.currency').maskMoney('mask');
    }

    // Carregar lista do localStorage
    carregarLista();

    // Inicializar reconhecimento de voz
    inicializarReconhecimentoVoz();

    // Delegação de eventos para checkboxes e botões de deletar
    const lista = document.getElementById('lista-compras');
    if (lista) {
        lista.addEventListener('change', function (e) {
            if (e.target.classList.contains('item-checkbox')) {
                const id = parseInt(e.target.dataset.id);
                const item = itens.find(i => i.id === id);
                if (item) {
                    item.marcado = e.target.checked;
                    const row = e.target.closest('.row-item');
                    if (row) {
                        row.classList.toggle('item-desmarcado', !item.marcado);
                    }
                    salvarLista();
                    atualizarTotais();
                }
            }
        });

        lista.addEventListener('click', function (e) {
            const btn = e.target.closest('.btn-delete-item');
            if (btn) {
                const id = parseInt(btn.dataset.id);
                removerItem(id);
            }
        });
    }

    // Validação ao digitar nos campos do formulário
    const btAdd = document.getElementById('bt-add-item');
    ['new-item', 'new-quantity', 'new-price'].forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) input.addEventListener('input', atualizarBotaoAdicionar);
    });
    const unitySelect = document.getElementById('new-unity');
    if (unitySelect) unitySelect.addEventListener('change', atualizarBotaoAdicionar);

    atualizarBotaoAdicionar();

    // Enter no campo de preço = adicionar item
    const newPrice = document.getElementById('new-price');
    if (newPrice) {
        newPrice.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') adicionarItem();
        });
    }

    // Atalhos de teclado globais
    document.addEventListener('keydown', function (e) {
        // Esc = limpar campos
        if (e.key === 'Escape') {
            ['new-item', 'new-quantity', 'new-price', 'new-unity'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            atualizarBotaoAdicionar();
        }
        // Espaço = toggle microfone (apenas quando não está em campo de texto)
        if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            toggleReconhecimentoVoz();
        }
    });
});

function formClear() {
    document.querySelectorAll('.modal form input').forEach(function (input) {
        input.value = '';
    });
    atualizarBotaoAdicionar();
}