import React, { useEffect, useState } from 'react';
import Dexie from 'dexie';

// Initialize IndexedDB using Dexie
const db = new Dexie("SmartListDB");
db.version(210).stores({
    products: "++id, name, price, category",
    items: "++id, name, price, quantity, unit, checked",
    categories: "++id, name",
    units: "++id, name"
});

const Category = () => {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            const allCategories = await db.categories.toArray();
            setCategories(allCategories);
        };

        fetchCategories();
    }, []);

    return (
        <div className="container">
            <h4>Categorias</h4>
            <ul>
                {categories.map(category => (
                    <li key={category.id}>{category.name}</li>
                ))}
            </ul>
        </div>
    );
};

export default Category;