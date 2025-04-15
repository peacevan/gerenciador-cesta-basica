import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Cart from './components/Cart';
import History from './components/History';
import ChartPage from './components/ChartPage';
import ProductRegistration from './components/ProductRegistration';
import UnitRegistration from './components/UnitRegistration';
import CategoryRegistration from './components/CategoryRegistration';
import ProductList from './components/ProductList'; // Importe o componente ProductList
import NewProduct from './components/NewProduct'; // Importe o componente NewProduct, se necessário

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/history" element={<History />} />
                <Route path="/chart" element={<ChartPage />} />
                <Route path="/product-registration" element={<ProductRegistration />} />
                <Route path="/unit-registration" element={<UnitRegistration />} />
                <Route path="/category-registration" element={<CategoryRegistration />} />
                <Route path="/product-list" element={<ProductList />} /> {/* Adicione esta rota */}
                <Route path="/new-product" element={<NewProduct />} /> {/* Adicione esta rota, se necessário */}
            </Routes>
        </Router>
    );
};

export default App;