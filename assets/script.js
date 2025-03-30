

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


let itens = [
  { id: 1, nome: "Arroz", quantidade: 8, unidade: " kg ", precoUn: 40.0 },
  { id: 2, nome: "Feijão", quantidade: 5, unidade: " kg ", precoUn: 35.0 },
  { id: 3, nome: "Macarrão", quantidade: 3, unidade: "kg ", precoUn: 18.0 },
  {
    id: 4,
    nome: "Farinha de trigo",
    quantidade: 2,
    unidade: " Kg ",
    precoUn: 10.0,
  },
  {
    id: 5,
    nome: "Carne bovina",
    quantidade: 4,
    unidade: " kg ",
    precoUn: 160.0,
  },
  {
    id: 6,
    nome: "Peito de frango",
    quantidade: 4,
    unidade: " kg ",
    precoUn: 80.0,
  },
  { id: 7, nome: "Ovos", quantidade: 3, unidade: " duz ", precoUn: 36.0 },
  { id: 8, nome: "Leite", quantidade: 15, unidade: "Lt ", precoUn: 75.0 },
  { id: 9, nome: "Banana", quantidade: 5, unidade: " Dúz ", precoUn: 25.0 },
  { id: 10, nome: "Maçã", quantidade: 3, unidade: " kg ", precoUn: 21.0 },
  { id: 11, nome: "Batata", quantidade: 5, unidade: " kg ", precoUn: 20.0 },
];
let recognition;
let isListening = false;
let currentelement = null;
let totalMarcados = 0;
itens.forEach((item) => {
  item.status_escolhido = true; // Isso definirá todos os itens como selecionados inicialmente
});


function atualizarLista2() {
  let lista = document.getElementById("lista-compras");
  lista.innerHTML = "";

  itens.forEach((item, index) => {
    item.totalProduto = item.quantidade * item.precoUn;
    let itemHTML = criarItemHTML(item, index);
    lista.insertAdjacentHTML("beforeend", itemHTML);
  });

  atualizarTotais();
}

function atualizarTotais() {
  let totalReal = itens.reduce(
    (acc, item) => acc + (item.quantidade * item.precoUn || 0),
    0
  );
  totalMarcados = totalReal;
  document.getElementById("total-real").innerText = totalReal.toLocaleString(
    "pt-BR",
    { style: "currency", currency: "BRL" }
  );
}

function atualizarTotalMarcados(status, index) {
  const item = itens.find((i) => i.id === index);
  if (status) {
    totalMarcados += item.quantidade * item.precoUn;
  } else {
    totalMarcados -= item.quantidade * item.precoUn;
  }

  document.getElementById("total-real").innerText =
    totalMarcados.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
}
function adicionarItem() {
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
    itens.push({
      id: itens.length + 1,
      nome: nome,
      quantidade: parseInt(quantidade),
      precoUn: parseFloat(preco.replace("R$ ", "").replace(",", ".").trim()),
      unidade: unidade.trim(),
    });
    atualizarLista();
  }

  document.getElementById("new-item").value = "";
  document.getElementById("new-quantity").value = "";
  document.getElementById("new-price").value = "";
}

function isFormValid() {
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
  return nome && quantidade > 0 && unidade && preco !== "";
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


function criarItemHTML(item, index) {
  let statusEscolhido = item.status_escolhido || false;
  return `
        <div class="row row-item card-panel- hoverable-">
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
                     }" checked=${statusEscolhido ? "checked" : ""}>
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
function adicionarItemModal() {
  var nome = document.querySelector("#new-item").value;
  var quantidade = document.querySelector("#new-quantity").value;
  var preco = document.querySelector("#new-price").value;
  var unit = document.querySelector("#new-unity").value;
  var id=document.querySelector("#id").value
 
  if (nome && quantidade && preco) {
     preco.replace(/[^\d.,]/g, "")
    .trim()
    .replace(".", "#")
    .replace(",", ".")
    .replace("#", ".");
    preco=parseFloat(preco.replace("R$ ", "").replace(",", ".").trim());
    addItemToCarrinho({id:id,nome: nome, quantidade: quantidade, unidade: unit, precoUn:preco});
    adicionarItem(nome, quantidade, preco);
    atualizarLista();
    document.getElementById("new-item").value = "";
    document.getElementById("new-quantity").value = "";
    document.getElementById("new-price").value = "";
    document.getElementById("new-price").value = "";
  
    closeModal();
  }
}

function closeModal() {
  var modal = document.querySelector(".modal");
  M.Modal.getInstance(modal).close();
}
var modalInstance;
function openModalToEditCart(id) {

  buscarItemPorId(id).then(item => {
  var modal = document.querySelector(".modal");
  var modalInstance = M.Modal.getInstance(modal);
  const form = modal.querySelector("form");
  
  if ((modalInstance)&&(item)) {
    document.querySelector("#id").value=item.id.toString();
    document.querySelector("#new-item").value=item.nome.toString();
    document.querySelector("#new-quantity").value=item.quantidade.toString();
    document.querySelector("#new-price").value=item.precoUn.toString();
    document.querySelector("#new-unity").value=item.unidade;
    var selectElement = document.getElementById('new-unity');
    selectElement.value = '';
    //selectElement.querySelector(`option[value="${item.unidade}"]`).selected = true;
    var selectElement = $('#new-unity');
    document.querySelector("#new-unity").focus();
    msValue(selectElement, item.unidade);
    modalInstance.open();
  } else {
     console.error("Não foi possível obter a instância do modal");
   }
 }).catch(error => {
   console.error("Erro ao abrir modal:", error);
});
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

$(function () {
  $(".currency").maskMoney({
    prefix: "R$ ",
    thousands: ".",
    decimal: ",",
  });
  $(".currency").maskMoney("mask");
});

window.onload = function() {

};
document.addEventListener("DOMContentLoaded", function () {

  M.AutoInit();
  var options = {};
  var modal = document.querySelector(".modal");
  var trigger = document.querySelector(".modal-trigger");

  if (!modal || !trigger) {
     console.error("Modal ou trigger não encontrado!");
     return;
  }
  var instance = M.Modal.init(modal, {
      onCloseEnd: function () {
      formClear();
    },
  });

  var elems = document.querySelectorAll('.dropdown-trigger');
  var instances = M.Dropdown.init(elems, options);

  trigger.addEventListener("click", function () {
    instance.open();
  });

  try {
    var elems = document.querySelectorAll("select");
    console.log("Select elements found:", elems.length);
    var instances = M.FormSelect.init(elems, options);
    console.log("FormSelect initialized successfully");
  } catch (error) {
    console.error("Error initializing FormSelect:", error);
  }

  const startButton = document.getElementById("startRecordingButton");

  /*startButton.addEventListener('click', function() {
        iniciarReconhecimento();
    });*/

  const btAdd = document.getElementById("bt-add-item");

  ["new-item", "new-quantity", "new-price", "new-unity"].forEach((inputId) => {
    const input = document.getElementById(inputId);
    input.addEventListener("input", function () {
      if (isFormValid()) {
        btAdd.disabled = false;
      } else {
        btAdd.disabled = true;
      }
      const unitySelect = document.getElementById("new-unity");
      unitySelect.addEventListener("change", function () {
        btAdd.disabled = !isFormValid();
      });

      const newPrice = document.getElementById("new-price");
      unitySelect.addEventListener("change", function () {
        btAdd.disabled = !isFormValid();
      });
    });
  });

  // Inicializar o estado do botão
  if (isFormValid()) {
    btAdd.disabled = false;
  } else {
    btAdd.disabled = true;
  }
      document.querySelectorAll("#status-escolhido").forEach((checkbox) => {
      checkbox.addEventListener("change", function (e) {
      atualizarTotalMarcados(this.checked, parseInt(this.dataset.index));
    });
  });
 // checkDatabaseReady();

 initializeDatabase()
 .then(db => {
   console.log("Database initialized successfully");
   // Inicialize o Materialize
   //atualizarLista(); 
 })
 .catch(error => {
     console.error("Failed to initialize database:", error);
 });

});



