import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Cart from './components/Cart';
import History from './components/History';
import ChartPage from './components/ChartPage';
import ProductRegistration from './components/ProductRegistration';
import UnitRegistration from './components/UnitRegistration';
import CategoryRegistration from './components/CategoryRegistration';
import ProductList from './components/ProductList';
import NewProduct from './components/NewProduct';
import ListCreation from './components/ListCreation';
import PurchaseHistory from './components/PurchaseHistory';
import OCRProductInput from './components/OCRProductInput';

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
                <Route path="/product-list" element={<ProductList />} />
                <Route path="/new-product" element={<NewProduct />} />
                <Route path="/list-creation" element={<ListCreation />} />
                <Route path="/create-from-template" element={<div>Modelo de Lista</div>} />
                <Route path="/create-from-scratch" element={<div>Criar do Zero</div>} />
                <Route path="/create-from-voice" element={<div>Comando de Voz</div>} />
                <Route path="/create-from-history" element={<div>Histórico de Compras</div>} />
                <Route path="/create-from-camera" element={<div>Lista por CRC (Câmera)</div>} />
                <Route path="/create-from-photos" element={<div>Adicionar Produto via Fotos</div>} />
                <Route path="/purchase-history" element={<PurchaseHistory />} />
                <Route path="/ocr-product-input" element={<OCRProductInput />} />
            </Routes>
        </Router>
    );
};

export default App;