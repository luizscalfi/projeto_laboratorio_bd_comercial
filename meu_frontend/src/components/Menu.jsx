import React from 'react';
import { NavLink } from 'react-router-dom';
import { House, BaggageClaim, Box, ShoppingCart, PiggyBank, LogOut } from 'lucide-react';

function Menu({ usuario, onLogout }) {

  const linkStyle = {
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const getLinkStyle = (isActive) => ({
    ...linkStyle,
    color: isActive ? '#2ecc71' : '#ecf0f1',
    fontWeight: isActive ? 'bold' : 'normal'
  });

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
          <NavLink to="/" style={({ isActive }) => getLinkStyle(isActive)}>
            <House size={20} />
            Início
          </NavLink>
        </li>

        <li>
          <NavLink to="/vendas" style={({ isActive }) => getLinkStyle(isActive)}>
            <BaggageClaim size={20} />
            PDV / Vendas
          </NavLink>
        </li>

        <li>
          <NavLink to="/produtos" style={({ isActive }) => getLinkStyle(isActive)}>
            <Box size={20} />
            Produtos
          </NavLink>
        </li>

        <li>
          <NavLink to="/compras" style={({ isActive }) => getLinkStyle(isActive)}>
            <ShoppingCart size={20} />
            Compras
          </NavLink>
        </li>

        <li>
          <NavLink to="/caixa" style={({ isActive }) => getLinkStyle(isActive)}>
            <PiggyBank size={20} />
            Fluxo de Caixa
          </NavLink>
        </li>

        {/* USUÁRIO + SAIR */}
        <li style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ color: '#ecf0f1', fontSize: '14px' }}>
            Usuário: <strong>{usuario?.nome}</strong>
          </span>

          <button
            onClick={onLogout}
            style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LogOut size={16} />
            Sair
          </button>
        </li>

      </ul>
    </nav>
  );
}

export default Menu;