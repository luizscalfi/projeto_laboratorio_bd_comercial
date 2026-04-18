import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login({ aoLogar }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');

    try {
      const resposta = await fetch('http://127.0.0.1:8000/usuarios/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        setErro(resultado.detail || "Erro ao fazer login.");
      } else {
        // MÁGICA: Salva o usuário na memória do navegador para não deslogar quando der F5
        localStorage.setItem('usuarioGestao', JSON.stringify(resultado.usuario));
        
        // Avisa o sistema que alguém logou
        aoLogar(resultado.usuario);
        
        // Joga pra tela inicial
        navigate('/');
      }
    } catch (erro) {
      setErro("Erro de conexão. O servidor Python está ligado?");
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '20px' }}>Entrar no Sistema</h2>
      
      {erro && <div style={{ padding: '10px', marginBottom: '15px', borderRadius: '5px', backgroundColor: '#f8d7da', color: '#721c24' }}>❌ {erro}</div>}

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
        <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
        
        <button type="submit" style={{ padding: '12px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
          Entrar
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
        Novo por aqui? <Link to="/cadastro" style={{ color: '#27ae60', textDecoration: 'none', fontWeight: 'bold' }}>Crie sua conta</Link>
      </p>
    </div>
  );
}

export default Login;