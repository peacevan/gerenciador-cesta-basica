let itens = [
    { nome: "Arroz", quantidade: "8 kg", precoEstimado: 40.00 },
    { nome: "Feijão", quantidade: "5 kg", precoEstimado: 35.00 },
    { nome: "Macarrão", quantidade: "3 kg", precoEstimado: 18.00 },
    { nome: "Farinha de trigo", quantidade: "2 kg", precoEstimado: 10.00 },
    { nome: "Carne bovina", quantidade: "4 kg", precoEstimado: 160.00 },
    { nome: "Peito de frango", quantidade: "4 kg", precoEstimado: 80.00 },
    { nome: "Ovos", quantidade: "3 dúzias", precoEstimado: 36.00 },
    { nome: "Leite", quantidade: "15 litros", precoEstimado: 75.00 },
    { nome: "Banana", quantidade: "5 kg", precoEstimado: 25.00 },
    { nome: "Maçã", quantidade: "3 kg", precoEstimado: 21.00 },
    { nome: "Batata", quantidade: "5 kg", precoEstimado: 20.00 }
];
let recognition;
let isListening = false;
function atualizarLista() {
let lista = document.getElementById("lista-compras");
lista.innerHTML = "";
let totalEstimado = 0;
let totalReal = 0;

itens.forEach((item, index) => {
let row = document.createElement("div");
row.className = "row card-panel hoverable";

let cellCheck = document.createElement("div");
cellCheck.className = "col s1 center-align";
let checkbox = document.createElement("input");
checkbox.type = "checkbox";
checkbox.className = "filled-in";
checkbox.onclick = () => row.classList.toggle("comprado");
cellCheck.appendChild(checkbox);

let cellNome = document.createElement("div");
cellNome.className = "col s2";
cellNome.innerText = item.nome;

let cellQuantidade = document.createElement("div");
cellQuantidade.className = "col s2";
cellQuantidade.innerText = item.quantidade;

let cellPrecoEstimado = document.createElement("div");
cellPrecoEstimado.className = "col s3";
cellPrecoEstimado.innerText = item.precoEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
let cellPrecoReal = document.createElement("div");
cellPrecoReal.className = "col s3";
let inputPrecoReal = document.createElement("input");
inputPrecoReal.type = "text";
inputPrecoReal.className = "validate currency";
inputPrecoReal.value = item.precoReal || "";
inputPrecoReal.oninput = function () {
    itens[index].precoReal = parseFloat(inputPrecoReal.value) || 0;
    atualizarTotais();
    atualizarLista(); // Para atualizar a formatação do valor real
};
cellPrecoReal.appendChild(inputPrecoReal);

let cellDelete = document.createElement("div");
cellDelete.className = "col s1 center-align";
let btnDelete = document.createElement("button");
btnDelete.className = "btn-floating btn-small waves-effect waves-light red";
btnDelete.innerHTML = '<i class="material-icons">delete</i>';
btnDelete.onclick = () => {
    itens.splice(index, 1);
    atualizarLista();
};
cellDelete.appendChild(btnDelete);

row.appendChild(cellCheck);
row.appendChild(cellNome);
row.appendChild(cellQuantidade);
row.appendChild(cellPrecoEstimado);
row.appendChild(cellPrecoReal);
row.appendChild(cellDelete);

lista.appendChild(row);

totalEstimado += item.precoEstimado;
totalReal += item.precoReal || 0;
});

document.getElementById("total-estimado").innerText = totalEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
document.getElementById("total-real").innerText = totalReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
    document.getElementById('otal-real').value = 'R$ '+numero;
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
            currentelement=null
            console.log('Transcrição:', transcript);

            if (transcript.toLowerCase() === 'adicionar item') {
                document.getElementById('novo-item').focus();
                currentelement= document.getElementById('novo-item');
            } else if (transcript.toLowerCase().includes('quantidade')) {
                document.getElementById('nova-quantidade').focus();
            } else if (transcript.toLowerCase().includes('valor')) {
                document.getElementById('novo-preco').focus();
            } else {
                cadastrarItem(transcript);
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
    const startButton = document.getElementById('startRecordingButton');

    startButton.addEventListener('click', function() {
        iniciarReconhecimento();
    });
});