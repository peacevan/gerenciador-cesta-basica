
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

function atualizarLista() {
    let lista = document.getElementById("lista-compras");
    lista.innerHTML = "";
    let totalEstimado = 0;
    let totalReal = 0;

    itens.forEach((item, index) => {
        let row = document.createElement("div");
        row.className = "row";

        let cellCheck = document.createElement("div");
        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.onclick = () => row.classList.toggle("comprado");
        cellCheck.appendChild(checkbox);

        let cellNome = document.createElement("div");
        cellNome.innerText = item.nome;

        let cellQuantidade = document.createElement("div");
        cellQuantidade.innerText = item.quantidade;

        let cellPrecoEstimado = document.createElement("div");
        cellPrecoEstimado.innerText = item.precoEstimado.toFixed(2);

        let cellPrecoReal = document.createElement("div");
        let inputPrecoReal = document.createElement("input");
        inputPrecoReal.type = "number";
        inputPrecoReal.value = item.precoReal || "";
        inputPrecoReal.oninput = function () {
            itens[index].precoReal = parseFloat(inputPrecoReal.value) || 0;
            atualizarTotais();
        };
        cellPrecoReal.appendChild(inputPrecoReal);

        let cellDelete = document.createElement("div");
        let btnDelete = document.createElement("button");
        btnDelete.innerText = "❌";
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

    document.getElementById("total-estimado").innerText = totalEstimado.toFixed(2);
    document.getElementById("total-real").innerText = totalReal.toFixed(2);
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

atualizarLista();

