import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dexie from 'dexie';
import M from 'materialize-css';
import Footer from './Footer'; // Import Footer component

// Initialize IndexedDB using Dexie
const db = new Dexie("SmartListDB");
db.version(210).stores({
    products: "++id, name, price, category",
    items: "++id, name, price, quantity, unit, checked",
    categories: "++id, name",
    units: "++id, name"
});

// Verifique se as tabelas estão criadas e inicialize com dados padrão, se necessário
db.on('populate', () => {
    db.categories.bulkAdd([
        { name: "Alimentos" },
        { name: "Bebidas" },
        { name: "Limpeza" },
        { name: "Higiene" },
        { name: "Outros" }
    ]);

    db.units.bulkAdd([
        { name: "Quilograma (KG)" },
        { name: "Litro (L)" },
        { name: "Unidade (UN)" },
        { name: "Dúzia (DZ)" },
        { name: "Pacote (PC)" }
    ]);
});

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [cartItemCount, setCartItemCount] = useState(0); // Estado para armazenar a quantidade de itens no carrinho
    const [searchTerm, setSearchTerm] = useState(""); // Estado para armazenar o termo de busca
    const [searchResults, setSearchResults] = useState([]); // Estado para armazenar os resultados da busca
    const navigate = useNavigate();
    
    useEffect(() => {
        // Fetch products and cart item count from IndexedDB
        const fetchProductsAndCartCount = async () => {
            const allProducts = await db.products.toArray();
            setProducts(allProducts);

            const cartItems = await db.items.toArray();
            setCartItemCount(cartItems.length); // Atualiza a quantidade de itens no carrinho
        };

        fetchProductsAndCartCount();

        // Initialize Materialize components
        M.AutoInit();
    }, []);

    const handleNavigateToNewProduct = () => {
        navigate('/new-product'); // Navegar para a tela de criação de um novo produto
    };

    const handleNavigateToListCreation = () => {
        navigate('/list-creation'); // Navegar para a tela de criação de lista
    };

    const handleEditProduct = (product) => {
        navigate('/new-product', { state: { product } }); // Navegar para a tela de edição com o produto selecionado
    };

    const handleDeleteProduct = async (id) => {
        const confirmDelete = window.confirm("Tem certeza de que deseja excluir este produto?");
        if (confirmDelete) {
            await db.products.delete(id);
            const updatedProducts = await db.products.toArray();
            setProducts(updatedProducts);
            M.toast({ html: 'Produto excluído com sucesso!', classes: 'green' });
        }
    };

    const handleSearch = async () => {
        if (searchTerm.trim() === "") {
            setSearchResults([]);
            return;
        }

        const results = await db.products
            .where("name")
            .startsWithIgnoreCase(searchTerm)
            .toArray();
        setSearchResults(results);
    };

    const handleAddToCart = async (product) => {
        // Lógica para adicionar o produto ao carrinho
        console.log("Adicionar ao carrinho:", product);
    };

    return (
        <div className="page-content">
            {/* Header */}
            <div className="navbar-fixed">
                <nav>
                    <div className="nav-wrapper">
                        <a href="#" className="brand-logo center">Lista de Produtos</a>
                        <ul id="nav-mobile" className="right">
                            <li>
                                <a onClick={handleNavigateToListCreation}>
                                    <i className="material-icons">list</i>
                                </a>
                            </li>
                            <li style={{ position: 'relative' }}>
                                <a href="/cart">
                                    <i className="material-icons">shopping_cart</i>
                                    {cartItemCount > 0 && (
                                        <span
                                            style={{
                                                position: 'absolute',
                                                top: '5px',
                                                right: '5px',
                                                backgroundColor: 'red',
                                                color: 'white',
                                                borderRadius: '50%',
                                                padding: '2px 6px',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {cartItemCount}
                                        </span>
                                    )}
                                </a>
                            </li>
                        </ul>
                    </div>
                </nav>
            </div>

            {/* Main Content */}
            <div className="container">
                <button
                    className="btn waves-effect waves-light"
                    onClick={handleNavigateToNewProduct}
                >
                    <i className="material-icons left">add</i>Novo Produto
                </button>

                {/* Dynamic Search Field */}
                <div className="input-field" style={{ marginTop: '20px' }}>
                    <input
                        type="text"
                        id="dynamicSearch"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            handleSearch();
                        }}
                        placeholder="Pesquise um produto"
                    />
                    <ul
                        className="dropdown-content"
                        style={{
                            display: searchResults.length > 0 ? 'block' : 'none',
                            position: 'absolute',
                            zIndex: 1000,
                            backgroundColor: 'white',
                            border: '1px solid #ddd',
                            width: '100%',
                            maxHeight: '200px',
                            overflowY: 'auto',
                        }}
                    >
                        {searchResults.map((product) => (
                            <li
                                key={product.id}
                                style={{
                                    padding: '10px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #ddd',
                                }}
                                onClick={() => {
                                    setSearchTerm(product.name);
                                    setSearchResults([]);
                                }}
                            >
                                {product.name} - R$ {product.price.toFixed(2).replace('.', ',')}
                            </li>
                        ))}
                    </ul>
                </div>

                <table className="highlight centered">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Preço Unitário</th>
                            <th>Quantidade</th>
                            <th>Unidade</th>
                            <th>Categoria</th>
                            <th>Marca</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length > 0 ? (
                            products.map(product => (
                                <tr key={product.id}>
                                    <td>{product.nome || 'Produto sem nome'}</td>
                                    <td>R$ {(product.precoUn ? product.precoUn.toFixed(2) : '0,00').replace('.', ',')}</td>
                                    <td>{product.quantidade || '0'}</td>
                                    <td>{product.unidade || 'Sem unidade'}</td>
                                    <td>{product.categoria || 'Sem categoria'}</td>
                                    <td>{product.marca || 'Sem marca'}</td>
                                    <td>
                                        <button
                                            className="btn-flat"
                                            onClick={() => handleEditProduct(product)}
                                        >
                                            <i className="material-icons">edit</i>
                                        </button>
                                        <button
                                            className="btn-flat red-text"
                                            onClick={() => handleDeleteProduct(product.id)}
                                        >
                                            <i className="material-icons">delete</i>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="center-align grey-text">Nenhum produto cadastrado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default ProductList;
