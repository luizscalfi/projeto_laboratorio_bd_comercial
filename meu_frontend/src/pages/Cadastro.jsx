import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function Cadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
  const navigate = useNavigate(); // Ferramenta para redirecionar de página

  const handleCadastro = async (e) => {
    e.preventDefault();
    setMensagem({ texto: '', tipo: '' });

    // Prepara os dados. Vamos usar id_perfil: 1 (Admin) como padrão para vocês testarem
    const dados = { id_perfil: 1, nome, email, senha };

    try {
      const resposta = await fetch(`${API_URL}/usuarios/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        setMensagem({ texto: resultado.detail || "Erro ao cadastrar.", tipo: 'erro' });
      } else {
        setMensagem({ texto: "Conta criada com sucesso! Faça login.", tipo: 'sucesso' });
        // Limpa o formulário
        setNome(''); setEmail(''); setSenha('');
        // Opcional: Redireciona para o login após 2 segundos
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (erro) {
      setMensagem({ texto: "Erro ao conectar com o servidor.", tipo: 'erro' });
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '20px' }}>Criar Conta</h2>
      
      {mensagem.texto && (
        <div style={{ padding: '10px', marginBottom: '15px', borderRadius: '5px', backgroundColor: mensagem.tipo === 'erro' ? '#f8d7da' : '#d4edda', color: mensagem.tipo === 'erro' ? '#721c24' : '#155724' }}>
          {mensagem.texto}
        </div>
      )}

      <form onSubmit={handleCadastro} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input type="text" placeholder="Seu Nome" value={nome} onChange={(e) => setNome(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
        <input type="email" placeholder="Seu E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
        <input type="password" placeholder="Sua Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
        
        <button type="submit" style={{ padding: '12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
          Cadastrar
        </button>
      </form>
      
      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
        Já tem uma conta? <Link to="/login" style={{ color: '#3498db', textDecoration: 'none', fontWeight: 'bold' }}>Faça Login</Link>
      </p>
    </div>
  );
}

export default Cadastro;