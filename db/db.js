// db.js

var DatabaseManager = (function() {
    function DatabaseManager() {
      this.dbName = 'ShoppingListDB';
      this.version = 1;
      this.objectStores = ['items'];
    }
  
    DatabaseManager.prototype.connect = function(callback) {
      var request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = function(event) {
        console.error("Erro ao abrir o banco de dados:", event.target.error);
        callback(event.target.error, null);
      };
  
      request.onsuccess = function(event) {
        this.db = event.target.result;
        console.log("Conectado ao banco de dados com sucesso");
        callback(null, true);
      }.bind(this);
  
      request.onupgradeneeded = function(event) {
        var db = event.target.result;
        if (!db.objectStoreNames.contains(this.objectStores[0])) {
          db.createObjectStore(this.objectStores[0], { keyPath: 'id', autoIncrement: true });
        }
      }.bind(this);
    };
  
    DatabaseManager.prototype.insertItem = function(item, callback) {
      this.connect(function(error) {
        if (error) {
          callback(error);
          return;
        }
        var transaction = this.db.transaction(this.objectStores, 'readwrite');
        var objectStore = transaction.objectStore(this.objectStores[0]);
        var request = objectStore.add(item);
        request.onerror = function(event) {
          console.error("Erro ao adicionar item:", event.target.error);
          callback(event.target.error);
        };
        request.onsuccess = function() {
          console.log("Item adicionado com sucesso:", item.id);
          callback(null, item.id);
        };
      }.bind(this));
    };
  
    DatabaseManager.prototype.removeItem = function(id, callback) {
      this.connect(function(error) {
        if (error) {
          callback(error);
          return;
        }
        var transaction = this.db.transaction([this.objectStores[0]], 'readwrite');
        var objectStore = transaction.objectStore(this.objectStores[0]);
        var request = objectStore.delete(id);
        request.onerror = function(event) {
          console.error("Erro ao remover item:", event.target.error);
          callback(event.target.error);
        };
        request.onsuccess = function() {
          console.log("Item removido com sucesso:", id);
          callback(null, true);
        };
      }.bind(this));
    };
  
    DatabaseManager.prototype.getItemById = function(id, callback) {
      this.connect(function(error) {
        if (error) {
          callback(error);
          return;
        }
        var transaction = this.db.transaction([this.objectStores[0]], 'readonly');
        var objectStore = transaction.objectStore(this.objectStores[0]);
        var request = objectStore.get(id);
        request.onerror = function(event) {
          console.error("Erro ao buscar item:", event.target.error);
          callback(event.target.error);
        };
        request.onsuccess = function(event) {
          callback(null, event.target.result);
        };
      }.bind(this));
    };
  
    DatabaseManager.prototype.getAllItems = function(callback) {
      this.connect(function(error) {
        if (error) {
          callback(error);
          return;
        }
        var transaction = this.db.transaction(this.objectStores, 'readonly');
        var objectStore = transaction.objectStore(this.objectStores[0]);
        var request = objectStore.getAll();
        request.onerror = function(event) {
          console.error("Erro ao buscar todos os itens:", event.target.error);
          callback(event.target.error);
        };
        request.onsuccess = function(event) {
          callback(null, event.target.result);
        };
      }.bind(this));
    };
  
    return DatabaseManager;
  })();
  
  // Exporta o construtor da classe
  window.DatabaseManager = DatabaseManager;