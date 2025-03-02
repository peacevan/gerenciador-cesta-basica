let totalValue = 0;

function addItem() {
    const itemInput = document.getElementById('itemInput');
    const itemText = itemInput.value;
    if (itemText === '') return;

    const shoppingList = document.getElementById('shoppingList');
    const listItem = document.createElement('li');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.onchange = updateTotal;

    const itemLabel = document.createElement('span');
    itemLabel.textContent = itemText;

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remover';
    removeButton.onclick = () => {
        shoppingList.removeChild(listItem);
        updateTotal();
    };

    listItem.appendChild(checkbox);
    listItem.appendChild(itemLabel);
    listItem.appendChild(removeButton);
    shoppingList.appendChild(listItem);

    itemInput.value = '';
    updateTotal();
}

function updateTotal() {
    const checkboxes = document.querySelectorAll('#shoppingList input[type="checkbox"]');
    totalValue = Array.from(checkboxes).reduce((total, checkbox) => {
        return total + (checkbox.checked ? 1 : 0);
    }, 0);
    document.getElementById('totalValue').textContent = totalValue.toFixed(2);
}