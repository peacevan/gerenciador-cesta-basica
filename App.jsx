import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Cart from './components/Cart';
import History from './components/History';
import ChartPage from './components/ChartPage';

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/history" element={<History />} />
                <Route path="/chart" element={<ChartPage />} />
            </Routes>
        </Router>
    );
};

export default App;