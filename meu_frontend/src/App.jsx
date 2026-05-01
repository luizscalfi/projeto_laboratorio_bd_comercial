import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importação dos Componentes
import Menu from './components/Menu';
import Home from './pages/Home';
import Produtos from './pages/Produtos';
import Caixa from './pages/Caixa';
import Compras from './pages/Compras'; // Verifique se o nome do ficheiro está correto
import Cadastro from './pages/Cadastro';
import Vendas from './pages/Vendas'; // <-- Adicione esta linha!
import Login from './pages/Login';

function App() {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Sincronização com o armazenamento local
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('usuarioGestao');
    if (usuarioSalvo) {
      setUsuario(JSON.parse(usuarioSalvo));
    }
    setCarregando(false);
  }, []);

  const fazerLogout = () => {
    localStorage.removeItem('usuarioGestao');
    setUsuario(null);
  };

  if (carregando) return <h2 style={{ textAlign: 'center', marginTop: '50px' }}>A carregar sistema...</h2>;

  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'sans-serif', backgroundColor: '#f5f6fa', minHeight: '100vh' }}>
        
        {/* Barra de Utilizador e Logout */}
       

        {/* Menu de Navegação */}
        {usuario && <Menu usuario={usuario} onLogout={fazerLogout} />}

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px' }}>
          <Routes>
            {/* ROTAS PÚBLICAS */}
            <Route path="/login" element={ !usuario ? <Login aoLogar={setUsuario} /> : <Navigate to="/" /> } />
            <Route path="/cadastro" element={ !usuario ? <Cadastro /> : <Navigate to="/" /> } />
            {/* ROTAS PROTEGIDAS (Só acessíveis se 'usuario' existir) */}
            <Route path="/" element={ usuario ? <Home /> : <Navigate to="/login" /> } />
            <Route path="/produtos" element={ usuario ? <Produtos /> : <Navigate to="/login" /> } />
            <Route path="/caixa" element={ usuario ? <Caixa usuarioLogado={usuario} /> : <Navigate to="/login" /> } />
            <Route path="/compras" element={ usuario ? <Compras /> : <Navigate to="/login" /> } />
            <Route path="/vendas" element={ usuario ? <Vendas /> : <Navigate to="/login" /> } />
            {/* Redirecionar qualquer rota desconhecida para o Início */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;