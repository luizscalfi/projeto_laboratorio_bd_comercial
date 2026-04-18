import React from 'react';
import { Link } from 'react-router-dom';

function Menu() {
  return (
    <nav style={{ 
      backgroundColor: '#2c3e50', 
      padding: '15px 30px', 
      marginBottom: '30px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <ul style={{ 
        listStyle: 'none', 
        margin: 0, 
        padding: 0, 
        display: 'flex', 
        gap: '30px',
        alignItems: 'center'
      }}>
        <li>
          <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '18px' }}>
            🏠 Início
          </Link>
        </li>
        <li>
          <Link to="/vendas" style={{ color: '#2ecc71', textDecoration: 'none', fontWeight: 'bold' }}>
            🛍️ PDV / Vendas
          </Link>
        </li>
        <li>
          <Link to="/produtos" style={{ color: '#ecf0f1', textDecoration: 'none' }}>
            📦 Produtos
          </Link>
        </li>
        <li>
          <Link to="/compras" style={{ color: '#ecf0f1', textDecoration: 'none' }}>
            🛒 Compras
          </Link>
        </li>
        <li>
          <Link to="/caixa" style={{ color: '#ecf0f1', textDecoration: 'none' }}>
            💰 Fluxo de Caixa
          </Link>
        </li>
      </ul>
    </nav>
  );
}

// É esta belezinha aqui embaixo que estava faltando ou com nome diferente!
export default Menu;