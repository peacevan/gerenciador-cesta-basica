function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("gerenciadorCestaBasica", 1);

        request.onerror = function(event) {
            console.error("Database error: " + event.target.errorCode);
            reject(event.target.error);
        };
        request.onsuccess = function(event) {
            db = event.target.result;
            console.log("Database opened successfully");
            resolve(db);
        };

        request.onupgradeneeded = function(event) {
            db = event.target.result;
            console.log("Database upgraded successfully");
            resolve(db);
        };
    });
}

let recognition;
let isListening = false;
let currentelement = null;
let totalMarcados = 0;

async function atualizarTotalMarcados(status, index) {
  try {
    // Buscar o item e atualizar o status
    const item = await db.carrinho.get(parseInt(index, 10));
    if (item) {
      // Atualiza o status do item no banco de dados
      item.status_escolhido = status;
      await db.carrinho.update(parseInt(index, 10), { status_escolhido: status });
      
      // Atualiza a aparência visual do item
      const checkbox = document.getElementById(`status-escolhido-${index}`);
      if (checkbox) {
        const row = checkbox.closest('.row-item');
        if (row) {
          if (status) {
            row.classList.add('item-selected');
          } else {
            row.classList.remove('item-selected');
          }
        }
      }
      
      // Recalcula os totais
      const itens = await db.carrinho.toArray();
      const totalMarcados = itens
        .filter(item => item.status_escolhido)
        .reduce((total, item) => total + (item.quantidade * item.precoUn), 0);
      
      document.getElementById("total-real").innerText = totalMarcados.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });

      const totalItens = itens.filter(item => item.status_escolhido).length;
      document.getElementById("total-itens").innerText = totalItens;
    }
  } catch (error) {
    console.error("Erro ao atualizar status do item:", error);
  }
}

async function atualizarLista2() {
  try {
    // Obter todos os itens do carrinho
    const itens = await db.carrinho.toArray();
    let lista = document.getElementById("lista-compras");
    lista.innerHTML = "";

    // Garantir que todos os itens tenham o campo status_escolhido
    for (const item of itens) {
      if (item.status_escolhido === undefined) {
        item.status_escolhido = true;
        await db.carrinho.update(item.id, { status_escolhido: true });
      }
      
      item.totalProduto = item.quantidade * item.precoUn;
      let itemHTML = criarItemHTML(item);
      lista.insertAdjacentHTML("beforeend", itemHTML);
    }

    // Atualiza os totais após carregar a lista
    const totalMarcados = itens
      .filter(item => item.status_escolhido)
      .reduce((total, item) => total + (item.quantidade * item.precoUn), 0);
    
    document.getElementById("total-real").innerText = totalMarcados.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    const totalItens = itens.filter(item => item.status_escolhido).length;
    document.getElementById("total-itens").innerText = totalItens;

    initializeDropdowns();
    await inicializarCheckboxes(itens);
  } catch (error) {
    console.error("Erro ao atualizar lista:", error);
  }
}

async function inicializarCheckboxes(itens) {
  try {
    // Se não receber itens como parâmetro, busca todos do banco
    if (!itens) {
      itens = await db.carrinho.toArray();
    }
    
    // Configura os estados iniciais dos checkboxes
    itens.forEach(item => {
      const checkbox = document.getElementById(`status-escolhido-${item.id}`);
      if (checkbox) {
        checkbox.checked = item.status_escolhido || false;
        
        // Atualiza a aparência dos itens com base no status
        const row = checkbox.closest('.row-item');
        if (row) {
          if (item.status_escolhido) {
            row.classList.add('item-selected');
          } else {
            row.classList.remove('item-selected');
          }
        }
      }
    });
  } catch (error) {
    console.error("Erro ao inicializar checkboxes:", error);
  }
}

async function adicionarItem() {
  let nome = document.getElementById("new-item").value.trim();
  let quantidade = document.getElementById("new-quantity").value.trim();
  let preco = document
    .querySelector("#new-price")
    .value.replace(/[^\d.,]/g, "")
    .trim()
    .replace(".", "#")
    .replace(",", ".")
    .replace("#", ".");
  let unidade = document.getElementById("new-unity").value.trim();

  if (nome && quantidade > 0 && unidade && preco !== "") {
    try {
      const newItem = {
        nome: nome.toUpperCase(),
        quantidade: parseInt(quantidade),
        precoUn: parseFloat(preco.replace("R$ ", "").replace(",", ".").trim()),
        unidade: unidade.toUpperCase(),
        status_escolhido: true
      };
      
      await addItemToCarrinho(newItem);
      await atualizarLista2();

      document.getElementById("new-item").value = "";
      document.getElementById("new-quantity").value = "";
      document.getElementById("new-price").value = "";
    } catch (error) {
      console.error("Erro ao adicionar item:", error);
    }
  }
}

function isFormValid() {
  let nome = document.getElementById("new-item").value.trim();
  let quantidade = document.getElementById("new-quantity").value.trim();
  let preco = document.querySelector("#new-price").value.trim();
  let unidade = document.getElementById("new-unity").value.trim();
  
  // Validar nome (não pode estar vazio)
  if (!nome) return false;
  
  // Validar quantidade (deve ser um número maior que 0)
  if (!quantidade || isNaN(quantidade) || parseFloat(quantidade) <= 0) return false;
  
  // Validar preço (deve ser um número válido, considerando formatos de moeda)
  let precoNumerico = preco.replace(/[^\d.,]/g, "")
    .replace(".", "#")
    .replace(",", ".")
    .replace("#", ".");
  if (!precoNumerico || isNaN(parseFloat(precoNumerico))) return false;
  
  // Validar unidade (não pode estar vazia)
  if (!unidade) return false;
  
  // Se todas as validações passaram, o formulário é válido
  return true;
}

function converter(valor) {
  var numero = valor.toLocaleString("pt-BR");
  document.getElementById("total-real").value = "R$ " + numero;
}

// Função para iniciar o reconhecimento de voz
function iniciarReconhecimento() {
  if (!isListening) {
    recognition = new (window.SpeechRecognition ||
    window.webkitSpeechRecognition)();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = function (event) {
      const result = event.results[event.resultIndex];
      const transcript = result[0].transcript;
      console.log("Transcrição:", transcript);
      if (transcript.toLowerCase() === "adicionar item") {
        document.getElementById("new-item").focus();
        currentelement = "new-item";
      } else if (transcript.toLowerCase().includes("quantidade")) {
        document.getElementById("new-quantity").focus();
        currentelement = "new-quantity";
      } else if (transcript.toLowerCase().includes("valor")) {
        document.getElementById("new-price").focus();
        currentelement = "new-price";
      } else {
        document.getElementById(currentelement).value = transcript;
        cadastrarItem(currentelement, transcript);
      }
    };

    recognition.onend = function () {
      console.log("Reconhecimento encerrado");
      isListening = false;
      updateButtonIcon();
    };

    recognition.start();
    isListening = true;
    updateButtonIcon();
  } else {
    pararReconhecimento(recognition);
  }
}

// Função para cadastrar o item
function cadastrarItem(transcript) {
  console.log("Cadastrando item:", transcript);
}

// Função para parar o reconhecimento
function pararReconhecimento(recognition) {
  recognition.stop();
}

function updateButtonIcon() {
  const button = document.getElementById("startRecordingButton");
  if (isListening) {
    button.innerHTML = '<i class="material-icons">mic_none</i>';
    button.classList.remove("btn-circle");
    button.classList.add("btn-round");
  } else {
    button.innerHTML = '<i class="material-icons left">mic</i>';
    button.classList.remove("btn-round");
    button.classList.add("btn-circle");
  }
}

function criarItemHTML(item) {
  let statusEscolhido = item.status_escolhido !== undefined ? item.status_escolhido : true;
  return `
        <div class="row row-item card-panel- hoverable- ${statusEscolhido ? 'item-selected' : ''}">
               <div class="col col-item-nome">
                <span class="item-name">${item.nome}</span>
                <div><span style="color:red;"><span>${item.quantidade} - </span>${
    item.unidade
  } x ${item.precoUn.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })}=${item.totalProduto.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })}</span></div>
        </div>
            <div class="col s1">
                <p>
                 <label>
                     <input type="checkbox" class="filled-in" id="status-escolhido-${
                      item.id
                    }" data-index="${
                       item.id
                     }" ${statusEscolhido ? "checked" : ""}>
                   <span></span>
                 </label>
                </p
            </div>
            </div>
             <div class="col s1 center-align">
                     <a class='dropdown-trigger  ' href='#' data-target="dropdown-${item.id}" > <i class="tiny material-icons">more_vert</i></a>
                        <ul id="dropdown-${item.id}" class='dropdown-content modal-trigger-' tabindex="0">
                               <li tabindex="0"><a href="#" class="edit-item" data-index="${
                          item.id
                        }" data-target="modal1-" onclick="openModalToEditCart(${item.id})" >Editar</a>
                        </li>
                        <li tabindex="0"><a href="#" class="delete-item" onclick="removeItemFromCarrinho(${item.id})"
                             data-index="${item.id}">Excluir</a></li>
                             <li class="divider" tabindex="-1"></li>
                         </ul>
                </div>
                   
        </div>
    `;
}
async function adicionarItemModal() {
  var nome = document.querySelector("#new-item").value;
  var quantidade = document.querySelector("#new-quantity").value;
  var preco = document.querySelector("#new-price").value;
  var unit = document.querySelector("#new-unity").value;
  var id = document.querySelector("#id").value;
 
  if (nome && quantidade && preco) {
    try {
      preco = preco.replace(/[^\d.,]/g, "")
        .trim()
        .replace(".", "#")
        .replace(",", ".")
        .replace("#", ".");
      preco = parseFloat(preco.replace("R$ ", "").replace(",", ".").trim());
      
      // Adicionar ou atualizar item no banco de dados
      const itemData = {
        nome: nome,
        quantidade: quantidade,
        precoUn: preco,
        unidade: unit,
        status_escolhido: true
      };
      
      if (id) {
        itemData.id = parseInt(id, 10);
      }
      
      await addItemToCarrinho(itemData);
      
      // Atualizar a lista após adicionar ou editar o item
      await atualizarLista2();
      
      // Limpar os campos do formulário
      document.getElementById("new-item").value = "";
      document.getElementById("new-quantity").value = "";
      document.getElementById("new-price").value = "";
      document.getElementById("id").value = "";
    
      closeModal();
    } catch (error) {
      console.error("Erro ao adicionar/editar item:", error);
      alert("Erro ao salvar o item. Por favor, tente novamente.");
    }
  }
}

function closeModal() {
  var modal = document.querySelector(".modal");
  M.Modal.getInstance(modal).close();
}
var modalInstance;
async function openModalToEditCart(id) {
  try {
    const item = await db.carrinho.get(parseInt(id, 10));
    
    if (!item) {
      console.error("Item não encontrado!");
      return;
    }
    
    var modal = document.querySelector(".modal");
    var modalInstance = M.Modal.getInstance(modal);
    
    if (modalInstance && item) {
      document.querySelector("#id").value = item.id.toString();
      document.querySelector("#new-item").value = item.nome.toString();
      document.querySelector("#new-quantity").value = item.quantidade.toString();
      document.querySelector("#new-price").value = item.precoUn.toString();
      document.querySelector("#new-unity").value = item.unidade;
      
      var selectElement = document.getElementById('new-unity');
      selectElement.value = '';
      
      var selectElement = $('#new-unity');
      // Removendo o foco automático para evitar problemas
      // document.querySelector("#new-unity").focus();
      msValue(selectElement, item.unidade);
      
      // Verificar se o formulário é válido e atualizar o estado do botão
      const btAdd = document.getElementById("bt-add-item");
      if (isFormValid()) {
        btAdd.disabled = false;
      } else {
        btAdd.disabled = true;
      }
      
      modalInstance.open();
    } else {
      console.error("Não foi possível obter a instância do modal");
    }
  } catch (error) {
    console.error("Erro ao abrir modal:", error);
  }
}

function msValue (selector, value) { 
  selector.val(value); 
  selector.closest('.select-wrapper')
  .find('li')
  .removeClass("active"); 
  selector.closest('.select-wrapper')
  .find('.select-dropdown')
  .val(value)
  .find('span:contains(' + value + ')')
  .parent()
  .addClass('selected active'); 

}

function formClear() {
    document.querySelectorAll(".modal form input").forEach(function (input) {
    input.value = "";
  });
}


window.onload = function() {

};
document.addEventListener("DOMContentLoaded", async function () {
  // Inicializa componentes do Materialize
  M.AutoInit();
  var options = {};
  var modal = document.querySelector(".modal");
  var trigger = document.querySelector(".modal-trigger");

  if (!modal || !trigger) {
     console.error("Modal ou trigger não encontrado!");
     return;
  }
  
  // Inicializa o modal
  var instance = M.Modal.init(modal, {
      onOpenStart: function() {
        // Se não tiver ID, é um novo item e devemos limpar o formulário
        if (!document.querySelector("#id").value) {
          formClear();
        }
        
        // Verificar se o formulário é válido e atualizar o estado do botão
        const btAdd = document.getElementById("bt-add-item");
        if (isFormValid()) {
          btAdd.disabled = false;
        } else {
          btAdd.disabled = true;
        }
      },
      onCloseEnd: function () {
        formClear();
      },
  });

  // Inicializa os dropdowns
  try {
    var elems = document.querySelectorAll("select");
    console.log("Select elements found:", elems.length);
    var instances = M.FormSelect.init(elems, options);
    console.log("FormSelect initialized successfully");
  } catch (error) {
    console.error("Error initializing FormSelect:", error);
  }

  // Inicializa o botão de adicionar
  const btAdd = document.getElementById("bt-add-item");

  ["new-item", "new-quantity", "new-price", "new-unity"].forEach((inputId) => {
    const input = document.getElementById(inputId);
    
    if (inputId === "new-unity") {
      // Para o select, precisamos monitorar o evento change
      input.addEventListener("change", function () {
        if (isFormValid()) {
          btAdd.disabled = false;
        } else {
          btAdd.disabled = true;
        }
      });
    } else {
      // Para inputs de texto, continuamos monitorando o evento input
      input.addEventListener("input", function () {
        if (isFormValid()) {
          btAdd.disabled = false;
        } else {
          btAdd.disabled = true;
        }
      });
    }
  });

  // Inicializar o estado do botão
  if (isFormValid()) {
    btAdd.disabled = false;
  } else {
    btAdd.disabled = true;
  }

  // Adicionar evento de clique nos checkboxes
  document.addEventListener('click', function(e) {
    if (e.target && e.target.matches('input[type="checkbox"]')) {
      const index = parseInt(e.target.dataset.index);
      atualizarTotalMarcados(e.target.checked, index);
    }
  });

  try {
    // Carregar dados e atualizar a lista
    console.log("Carregando banco de dados...");
    await atualizarLista2();
    console.log("Lista atualizada com sucesso!");
  } catch (error) {
    console.error("Erro ao inicializar o aplicativo:", error);
  }
});

async function finalizarCompraMes() {
  try {
    debugger;
    // Obtém a data atual para determinar o mês atual
    const dataAtual = new Date();
    const mesAtual = `${String(dataAtual.getMonth() + 1).padStart(2, '0')}/${dataAtual.getFullYear()}`;
    
    let itens;
    try {
        itens = await db.carrinho.toArray();
        itens = itens.filter(item => item.status_escolhido);
    } catch (error) {
        console.error("Erro ao buscar itens do carrinho:", error);
    }
    
    if (itens.length === 0) {
      alert("Não há itens selecionados para finalizar a compra!");
      return;
    }
    
    // Calcula o total dos itens selecionados
    const total = itens.reduce((soma, item) => {
      return soma + (item.quantidade * item.precoUn);
    }, 0);
     debugger;   
    // Pede confirmação ao usuário
    const confirmacao = confirm(`Finalizar compra do mês  ${mesAtual} com valor total de R$ ${total.toFixed(2)}?`);
    
    if (!confirmacao) {
      return;
    }
    
    // Finaliza a compra utilizando a função do db.js
    await finalizarCompra(mesAtual);
    
    alert(`Compra do mês ${mesAtual} finalizada com sucesso!`);
    
    // Atualiza a lista de itens
    await atualizarLista2();
    
  } catch (error) {
    console.error("Erro ao finalizar compra do mês:", error);
    alert(`Erro ao finalizar compra: ${error.message}`);
  }
}

// Função para carregar o histórico de compras
async function carregarHistoricoCompras() {
  try {
    const historicoContainer = document.getElementById('historico-compras');
    
    if (!historicoContainer) {
      console.error("Contêiner de histórico não encontrado");
      return;
    }
    
    // Limpa o contêiner antes de carregar os novos dados
    historicoContainer.innerHTML = '';
    
    // Obtém todas as compras do banco de dados
    const compras = await listarCompras();
    
    if (compras.length === 0) {
      historicoContainer.innerHTML = `
        <div class="empty-history">
          <i class="material-icons large">history</i>
          <p>Nenhuma compra finalizada ainda</p>
        </div>
      `;
      return;
    }
    
    // Ordena as compras pela data (mais recente primeiro)
    compras.sort((a, b) => new Date(b.dataCompra) - new Date(a.dataCompra));
    
    // Cria um card para cada compra
    compras.forEach(compra => {
      const dataFormatada = new Date(compra.dataCompra).toLocaleDateString('pt-BR');
      const card = document.createElement('div');
      card.className = 'history-card card';
      card.innerHTML = `
        <div class="card-content">
          <span class="card-title">${compra.mesFormatado || compra.mes}</span>
          <p>Data: ${dataFormatada}</p>
          <p>Total: R$ ${compra.totalCompra.toFixed(2)}</p>
          <p>Itens: ${compra.carrinho.length}</p>
        </div>
        <div class="card-action">
          <a href="#" onclick="verDetalhesCompra('${compra.mes}')">Ver Detalhes</a>
        </div>
      `;
      
      historicoContainer.appendChild(card);
    });
    
  } catch (error) {
    console.error("Erro ao carregar histórico de compras:", error);
    alert("Erro ao carregar histórico de compras");
  }
}

// Função para ver detalhes de uma compra específica
async function verDetalhesCompra(mes) {
  try {
    const compra = await getCompraByMes(mes);
    const detalhesContainer = document.getElementById('detalhes-compra');
    
    if (!compra) {
      alert("Compra não encontrada");
      return;
    }
    
    if (!detalhesContainer) {
      console.error("Contêiner de detalhes não encontrado");
      return;
    }
    
    // Limpa o contêiner antes de carregar os novos dados
    detalhesContainer.innerHTML = '';
    
    // Cria o título do modal
    const titulo = document.createElement('h5');
    titulo.className = 'modal-title';
    titulo.textContent = `Detalhes da compra - ${compra.mesFormatado || compra.mes}`;
    detalhesContainer.appendChild(titulo);
    
    // Cria a tabela de itens
    const tabela = document.createElement('table');
    tabela.className = 'striped';
    tabela.innerHTML = `
      <thead>
        <tr>
          <th>Item</th>
          <th>Qtde</th>
          <th>Unidade</th>
          <th>Preço Un.</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody id="tabela-itens">
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" class="right-align"><strong>Total:</strong></td>
          <td><strong>R$ ${compra.totalCompra.toFixed(2)}</strong></td>
        </tr>
      </tfoot>
    `;
    
    detalhesContainer.appendChild(tabela);
    
    const tabelaItens = document.getElementById('tabela-itens');
    
    // Adiciona cada item à tabela
    compra.carrinho.forEach(item => {
      const total = item.quantidade * item.precoUn;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.nome}</td>
        <td>${item.quantidade}</td>
        <td>${item.unidade}</td>
        <td>R$ ${item.precoUn.toFixed(2)}</td>
        <td>R$ ${total.toFixed(2)}</td>
      `;
      tabelaItens.appendChild(tr);
    });
    
    // Abre o modal de detalhes
    const modal = document.getElementById('modalDetalhes');
    if (modal && typeof M !== 'undefined') {
      const instance = M.Modal.getInstance(modal);
      if (instance) {
        instance.open();
      } else {
        M.Modal.init(modal).open();
      }
    }
    
  } catch (error) {
    console.error("Erro ao ver detalhes da compra:", error);
    alert("Erro ao carregar detalhes da compra");
  }
}

// Inicializa a página de histórico se estiver nela
document.addEventListener('DOMContentLoaded', function() {
  // Inicializa os modais
  if (typeof M !== 'undefined') {
    const modals = document.querySelectorAll('.modal');
    M.Modal.init(modals);
  }
  
  // Se estiver na página de histórico, carrega os dados
  if (document.getElementById('historico-compras')) {
    carregarHistoricoCompras();
  }
});



