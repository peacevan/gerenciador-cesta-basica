let db;
        const request = indexedDB.open("gerenciadorCestaBasica", 1);
        request.onupgradeneeded = function(event) {
            db = event.target.result;
            const carrinhoStore = db.createObjectStore("carrinho", { keyPath: "id", autoIncrement: true });
            const compraStore = db.createObjectStore("compras", { keyPath: "mes" });
        };

        request.onsuccess = function(event) {
            db = event.target.result;
        };

        request.onerror = function(event) {
            console.error("Database error: " + event.target.errorCode);
        };

        function addItemToCarrinho(data) {
            const transaction = db.transaction(["carrinho"], "readwrite");
            const objectStore = transaction.objectStore("carrinho");
            if(data.id){
               editCarrinhoItem(data.id, data);
               return true;
            }
             
            const newItem = {
                ...data,
                nome: data.nome.toUpperCase(),
                quantidade: parseInt(data.quantidade),
                precoUn: parseFloat(data.precoUn),
                unidade: data.unidade.toUpperCase()
            };
            delete newItem.id;
             console.log("objeto modificado",newItem)      
            const request = objectStore.add(newItem);
            request.onsuccess = function(event) {
                console.log("Item added to the cart", event.target.result);
            };
            request.onerror = function(event) {
                console.error("Error adding item to cart: ", event.target.errorCode);
            };
        }

        function listCarrinhoItems() {
          console.log("Buscando itens do carrinho");
          
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(["carrinho"], "readonly");
            const objectStore = transaction.objectStore("carrinho");
            const request = objectStore.getAll();
        
            request.onsuccess = function(event) {
              console.log("Itens do carrinho obtidos com sucesso");
              const items = event.target.result;
              console.log("Itens do carrinho:", items);
              resolve(items || []); // Retorna um array vazio se não houver itens
            };
        
            request.onerror = function(event) {
              console.error("Erro ao listar itens do carrinho:", event.target.errorCode);
              console.error("Descrição do erro:", event.target.error.name);
              console.error("Mensagem do erro:", event.target.error.message);
              reject(event.target.error);
            };
          });
        }

        function removeItemFromCarrinho(id) {
            const transaction = db.transaction(["carrinho"], "readwrite");
            const objectStore = transaction.objectStore("carrinho");
            const request = objectStore.delete(id);
            request.onsuccess = function(event) {
                console.log("Item removed from cart", event.target.result);
                atualizarLista(); 
            };
            request.onerror = function(event) {
                console.error("Error removing item from cart: ", event.target.errorCode);
            };
        }

        function editCarrinhoItem(id, updatedItem) {
            const transaction = db.transaction(["carrinho"], "readwrite");
            const objectStore = transaction.objectStore("carrinho");
            // Converter id para inteiro
            const integerId = parseInt(id, 10);
            const request = objectStore.get(integerId);
            console.log("Request to get item:", request);
            
            request.onsuccess = function(event) {
                const data = event.target.result;
                console.log("Item retrieved from database:", data);
                
                Object.assign(data, {
                    nome: updatedItem.nome.toUpperCase(),
                    quantidade: parseInt(updatedItem.quantidade) || data.quantidade,
                    precoUn: parseFloat(updatedItem.precoUn) || data.precoUn,
                    unidade: updatedItem.unidade.toUpperCase() || data.unidade
                });
                

                const updateRequest = objectStore.put(data);
                updateRequest.onsuccess = function(event) {
                    console.log("Item updated in the cart successfully");
                    atualizarLista(); // Chame esta função para atualizar a lista no frontend
                };
                updateRequest.onerror = function(event) {
                    console.error("Error updating item in cart: ", event.target.errorCode);
                };
            };
            
            request.onerror = function(event) {
                console.error("Error getting item from cart: ", event.target.errorCode);
            };
        }

        function buscarItemPorId(id) {
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(["carrinho"], "readonly");
            const objectStore = transaction.objectStore("carrinho");
            const request = objectStore.get(id);
        
            request.onsuccess = function(event) {
              const item = event.target.result;
              if (item) {
                resolve(item);
              } else {
                reject(new Error(`Item com ID ${id} não encontrado`));
              }
            };
        
            request.onerror = function(event) {
              reject(new Error(`Erro ao buscar item com ID ${id}: ${event.target.error.name}`));
            };
          });
        }

        function finalizarCompra(mes) {
            listCarrinhoItems().then(carrinhoItems => {
                const totalCompra = carrinhoItems.reduce((total, item) => total + (item.precoUn * item.quantidade), 0);
                const dataCompra = new Date().toLocaleDateString();

                const transaction = db.transaction(["compras"], "readwrite");
                const objectStore = transaction.objectStore("compras");
                const request = objectStore.put({ mes: mes, totalCompra: totalCompra, dataCompra: dataCompra, carrinho: carrinhoItems });

                request.onsuccess = function(event) {
                    console.log("Compra saved for month", mes);
                    clearCarrinho();
                };
                request.onerror = function(event) {
                    console.error("Error saving compra: ", event.target.errorCode);
                };
            }).catch(error => {
                console.error("Error listing cart items:", error);
            });
        }

        function clearCarrinho() {
            const transaction = db.transaction(["carrinho"], "readwrite");
            const objectStore = transaction.objectStore("carrinho");
            const request = objectStore.clear();
            request.onsuccess = function(event) {
                console.log("Carrinho cleared");
            };
            request.onerror = function(event) {
                console.error("Error clearing carrinho: ", event.target.errorCode);
            };
        }

        function getCompraByMes(mes) {
            const transaction = db.transaction(["compras"], "readonly");
            const objectStore = transaction.objectStore("compras");
            const request = objectStore.get(mes);
            request.onsuccess = function(event) {
                const compra = event.target.result;
                console.log("Compra for month", mes, ":", compra);
                return compra;
            };
            request.onerror = function(event) {
                console.error("Error getting compra for month: ", event.target.errorCode);
            };
        }

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

        async function loadItemsFromDatabase() {
          console.log("Iniciando carregamento de itens do banco de dados");
          await initializeDatabase();
          console.log("Banco de dados inicializado");
        
          try {
            const items = await listCarrinhoItems();
            console.log("Itens carregados do banco de dados:", items);
            return items;
          } catch (error) {
            console.error("Erro ao carregar itens do banco de dados:", error);
            throw error;
          }
        }

        function atualizarLista() {
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
                atualizarTotais();
                 // Inicialize o Materialize aqui
             
               var dropdowns = document.querySelectorAll('.dropdown-trigger');
               var dropdownOptions = {};
               var dropdownInstances = M.Dropdown.init(dropdowns, dropdownOptions);

               var modal = document.querySelector(".modal");
               var trigger = document.querySelector(".modal-trigger");
             
               if (!modal || !trigger) {
                  console.error("Modal ou trigger não encontrado!");
                  return;
               }
              
                   
            }).catch(error => {
                console.error("Erro ao carregar itens:", error);
            });
        }
