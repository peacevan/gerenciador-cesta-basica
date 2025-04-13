import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Cart from './components/Cart';
import History from './components/History';
import ChartPage from './components/ChartPage';
import ProductRegistration from './components/ProductRegistration';
import UnitRegistration from './components/UnitRegistration';
import CategoryRegistration from './components/CategoryRegistration';

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
            </Routes>
        </Router>
    );
};

export default App;