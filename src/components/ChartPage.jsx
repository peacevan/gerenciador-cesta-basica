import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import Footer from './Footer';

const ChartPage = () => {
    const chartRef = useRef(null);
    const [cartPrice, setCartPrice] = useState('');

    const handleCartPriceChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-numeric characters
        setCartPrice(value); // Atualiza o estado com o valor numérico puro
    };

    const handleCartPriceBlur = () => {
        if (cartPrice) {
            const formattedValue = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
            }).format(cartPrice / 100); // Formata como moeda BRL
            setCartPrice(formattedValue); // Atualiza o estado com o valor formatado
        }
    };

    useEffect(() => {
        const ctx = chartRef.current.getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho'],
                datasets: [
                    {
                        label: 'Total de Vendas (R$)',
                        data: [1200, 1500, 800, 1700, 2000, 2500],
                        backgroundColor: 'rgba(38, 166, 154, 0.6)',
                        borderColor: 'rgba(38, 166, 154, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Gráfico de Vendas Mensais'
                    }
                }
            }
        });
    }, []);

    return (
        <div className="page-content">
            <div className="navbar-fixed">
                <nav>
                    <div className="nav-wrapper">
                        <a href="#" className="brand-logo">Smart List</a>
                        <ul id="nav-mobile" className="right hide-on-med-and-down">
                            <li><a href="#chart">Gráfico</a></li>
                        </ul>
                    </div>
                </nav>
            </div>

            <div className="container">
                <div className="section">
                    <h4 className="center-align">Gráfico de Vendas</h4>
                    <p className="grey-text center-align">Visualize o desempenho das suas vendas mensais.</p>
                </div>

                <div className="chart-container" style={{ position: 'relative', height: '40vh', width: '80vw' }}>
                    <canvas ref={chartRef}></canvas>
                </div>
            </div>

            <div className="bottom-nav">
                <div className="row" style={{ width: '100%', margin: 0 }}>
                    <div className="col s3 center-align">
                        <a href="index.html" className="nav-item">
                            <i className="material-icons">home</i>
                        </a>
                    </div>
                    <div className="col s3 center-align">
                        <a href="cart.html" className="nav-item">
                            <i className="material-icons">shopping_cart</i>
                        </a>
                    </div>
                    <div className="col s3 center-align">
                        <a href="history.html" className="nav-item">
                            <i className="material-icons">history</i>
                        </a>
                    </div>
                    <div className="col s3 center-align">
                        <a href="#chart" className="nav-item active">
                            <i className="material-icons">bar_chart</i>
                        </a>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default ChartPage;