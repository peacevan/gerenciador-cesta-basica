let itens = [
    { nome: "Arroz", quantidade: 8,unidade:' kg ', precoEstimado: 40.00 },
    { nome: "Feijão", quantidade: 5,unidade:' kg ', precoEstimado: 35.00 },
    { nome: "Macarrão", quantidade: 3,unidade:'kg ', precoEstimado: 18.00 },
    { nome: "Farinha de trigo", quantidade: 2,unidade:' Kg ', precoEstimado: 10.00 },
    { nome: "Carne bovina", quantidade: 4,unidade:' kg ', precoEstimado: 160.00 },
    { nome: "Peito de frango", quantidade: 4,unidade:' kg ', precoEstimado: 80.00 },
    { nome: "Ovos", quantidade: 3,unidade:' duz ', precoEstimado: 36.00 },
    { nome: "Leite", quantidade:15,unidade:'Lt ', precoEstimado: 75.00 },
    { nome: "Banana", quantidade: 5,unidade:' Dúz ', precoEstimado: 25.00 },
    { nome: "Maçã", quantidade: 3,unidade:' kg ', precoEstimado: 21.00 },
    { nome: "Batata", quantidade: 5,unidade: ' kg ', precoEstimado: 20.00 }
];
let recognition;
let isListening = false;
let currentelement=null;

function atualizarLista() {
    let lista = document.getElementById("lista-compras");
    lista.innerHTML = "";

    itens.forEach((item, index) => {
        item.totalProduto=item.quantidade * item.precoEstimado;
        let itemHTML = criarItemHTML(item);
        lista.insertAdjacentHTML('beforeend', itemHTML);
    });

    atualizarTotais();
}


function atualizarTotais() {
let totalReal = itens.reduce((acc, item) => acc + (item.precoReal || 0), 0);
document.getElementById("total-real").innerText = totalReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function adicionarItem() {
    let nome = document.getElementById("novo-item").value.trim();
    let quantidade = document.getElementById("nova-quantidade").value.trim();
    let precoEstimado = parseFloat(document.getElementById("novo-preco").value) || 0;

    if (nome && quantidade) {
        itens.push({ nome, quantidade, precoEstimado });
        atualizarLista();
    }

    document.getElementById("novo-item").value = "";
    document.getElementById("nova-quantidade").value = "";
    document.getElementById("novo-preco").value = "";
}

function atualizarTotais() {
    let totalReal = itens.reduce((acc, item) => acc + (item.precoReal || 0), 0);
    document.getElementById("total-real").innerText = totalReal.toFixed(2);
}

function converter(valor){
    var numero = (valor).toLocaleString('pt-BR');
    document.getElementById('total-real').value = 'R$ '+numero;
  }

  // Adicione estas funções ao seu script.js

// Função para iniciar o reconhecimento de voz
function iniciarReconhecimento() {
    if (!isListening) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = function(event) {
            const result = event.results[event.resultIndex];
            const transcript = result[0].transcript;
          
            console.log('Transcrição:', transcript);
      
            if (transcript.toLowerCase() === 'adicionar item') {
                document.getElementById('novo-item').focus();
                currentelement= 'novo-item';
            } else if (transcript.toLowerCase().includes('quantidade')) {
                document.getElementById('nova-quantidade').focus();
                currentelement= 'nova-quantidade';
            } else if (transcript.toLowerCase().includes('valor')) {
                document.getElementById('novo-preco').focus();
                currentelement= 'novo-preco';
            } else {
                debugger;
                document.getElementById(currentelement).value=transcript;
                cadastrarItem(currentelement,transcript);
            }
        };

        recognition.onend = function() {
            console.log('Reconhecimento encerrado');
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
    console.log('Cadastrando item:', transcript);
  
}

// Função para parar o reconhecimento
function pararReconhecimento(recognition) {
    recognition.stop();
}


function updateButtonIcon() {
    const button = document.getElementById('startRecordingButton');
    if (isListening) {
        button.innerHTML = '<i class="material-icons">mic_none</i>';
        button.classList.remove('btn-circle');
        button.classList.add('btn-round');
    } else {
        button.innerHTML = '<i class="material-icons left">mic</i>';
        button.classList.remove('btn-round');
        button.classList.add('btn-circle');
    }
}
function criarItemHTML(item) {
    return `
        <div class="row row-item card-panel- hoverable-">
               <div class="col col-item-nome">
                <span class="item-name">${item.nome}</span>
                <div><span style="color:red;"><span>${item.quantidade}</span>${item.unidade} x ${item.precoEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}=${item.totalProduto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
            </div>
                 <div class="col col-checkbox  center-align">
                <input type="checkbox" class="filled-in" data-index="${item.index}" />
                aqui
            </div>
            <!--<div class="col s1 center-align">
                <button class="btn-floating btn-small waves-effect waves-light red delete-item" data-index="${item.index}"><i class="material-icons">delete</i></button>
            </div>-->
        </div>
    `;
}

function adicionarItemModal() {
    var nome = document.querySelector('#nome').value;
    var quantidade = document.querySelector('#quantidade').value;
    var preco = document.querySelector('#preco').value;
    if (nome && quantidade && preco) {
      adicionarItem(nome, quantidade, preco);
      M.Modal.getInstance(modal).close();
    }
  }

  function closeModal() {
   
    var modal = document.querySelector('.modal');
    M.Modal.getInstance(modal).close();
   
  }

/*
document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('startRecordingButton');

    startButton.addEventListener('click', function() {
        iniciarReconhecimento();
    });
});*/