let itens = [
    { id:1,nome: "Arroz", quantidade: 8,unidade:' kg ', precoUn: 40.00 },
    { id:2,nome: "Feijão", quantidade: 5,unidade:' kg ', precoUn: 35.00 },
    { id:3,nome: "Macarrão", quantidade: 3,unidade:'kg ', precoUn: 18.00 },
    { id:4,nome: "Farinha de trigo", quantidade: 2,unidade:' Kg ', precoUn: 10.00 },
    { id:5,nome: "Carne bovina", quantidade: 4,unidade:' kg ', precoUn: 160.00 },
    { id:6,nome: "Peito de frango", quantidade: 4,unidade:' kg ', precoUn: 80.00 },
    { id:7,nome: "Ovos", quantidade: 3,unidade:' duz ', precoUn: 36.00 },
    { id:8,nome: "Leite", quantidade:15,unidade:'Lt ', precoUn: 75.00 },
    { id:9,nome: "Banana", quantidade: 5,unidade:' Dúz ', precoUn: 25.00 },
    { id:10,nome:"Maçã", quantidade: 3,unidade:' kg ', precoUn: 21.00 },
    { id:11,nome:"Batata", quantidade: 5,unidade: ' kg ', precoUn: 20.00 }
];
let recognition;
let isListening = false;
let currentelement=null;
let totalMarcados = 0;
itens.forEach(item => {
    item.status_escolhido = true; // Isso definirá todos os itens como selecionados inicialmente
});
function atualizarLista() {
   
    let lista = document.getElementById("lista-compras");
    lista.innerHTML = "";
    
    itens.forEach((item, index) => {
        item.totalProduto = item.quantidade * item.precoUn;
        let itemHTML = criarItemHTML(item,index);
        lista.insertAdjacentHTML('beforeend', itemHTML);
    });
    
    atualizarTotais();
}


function atualizarTotais() {
let totalReal = itens.reduce((acc, item) => acc + (item.quantidade * item.precoUn || 0), 0);
totalMarcados=totalReal;
document.getElementById("total-real").innerText = totalReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function atualizarTotalMarcados(status, index) {
    const item = itens.find(i => i.id === index);
    if (status) {
        totalMarcados += item.quantidade * item.precoUn;
    } else {
        totalMarcados -= item.quantidade * item.precoUn;
    }
    document.getElementById("total-real").innerText = totalMarcados.toFixed(2);
}

function adicionarItem() {
    let nome = document.getElementById("novo-item").value.trim();
    let quantidade = document.getElementById("nova-quantidade").value.trim();
    let precoUn = parseFloat(document.getElementById("novo-preco").value) || 0;

    if (nome && quantidade) {
        itens.push({ nome, quantidade, precoUn });
        atualizarLista();
    }

    document.getElementById("novo-item").value = "";
    document.getElementById("nova-quantidade").value = "";
    document.getElementById("novo-preco").value = "";
}

function converter(valor){
    var numero = (valor).toLocaleString('pt-BR');
    document.getElementById('total-real').value = 'R$ '+numero;
  }



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

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('#status-escolhido').forEach(checkbox => {
        checkbox.addEventListener('change', function(e) {
        atualizarTotalMarcados(this.checked, parseInt(this.dataset.index));
        });
    });
});
function criarItemHTML(item,index) {
    let statusEscolhido = item.status_escolhido || false;
    return `
        <div class="row row-item card-panel- hoverable-">
               <div class="col col-item-nome">
                <span class="item-name">${item.nome}</span>
                <div><span style="color:red;"><span>${item.quantidade}</span>${item.unidade} x ${item.precoUn.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}=${item.totalProduto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
            </div>
                 <div class="col s2">
                                    
                <p>
                 <label>
                     <input type="checkbox" class="filled-in" id="status-escolhido" data-index="${item.id}" checked=${statusEscolhido ? 'checked' : ''}>
                   <span></span>
                 </label>
                </p
                 </div>
            <!--<div class="col s1 center-align">
                <button class="btn-floating btn-small waves-effect waves-light red delete-item" data-index="${item.id}"><i class="material-icons">delete</i></button>
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