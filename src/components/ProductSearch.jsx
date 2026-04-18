import React, { useState } from 'react';
import Dexie from 'dexie';

const db = new Dexie("SmartListDB");
db.version(210).stores({
    products: "++id, name, price, category",
    items: "++id, name, price, quantity, unit, checked",
    categories: "++id, name",
    units: "++id, name"
});

const ProductSearch = ({ onProductSelect }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);

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

    return (
        <div className="input-field">
            <input
                type="text"
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
                            onProductSelect(product);
                            setSearchTerm("");
                            setSearchResults([]);
                        }}
                    >
                        {product.name} - R$ {product.price.toFixed(2).replace('.', ',')}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ProductSearch;
