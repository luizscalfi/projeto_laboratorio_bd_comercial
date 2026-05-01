import React, { useState, useEffect } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import './styles/estilo_produto.css';

function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    setCarregando(true);
    try {
      const resposta = await fetch(`${API_URL}/produtos/`);
      const dados = await resposta.json();
      setProdutos(dados.produtos || []);
    } catch (erro) {
      console.error("Erro ao buscar produtos:", erro);
    } finally {
      setCarregando(false);
    }
  }

  async function handleDeletar(produto) {
    // REGRA DE NEGÓCIO: Só exclui se o estoque estiver vazio
    if (produto.quantidade_estoque > 0) {
      alert(`Ação bloqueada: O produto "${produto.nome}" possui ${produto.quantidade_estoque} unidades em estoque. Zere o estoque antes de excluir.`);
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir o produto "${produto.nome}" do catálogo?`)) return;
    
    try {
      const resposta = await fetch(`${API_URL}/produtos/${produto.id}`, { method: 'DELETE' });
      
      if (resposta.ok) {
        setProdutos(produtos.filter(p => p.id !== produto.id));
      } else {
        const erro = await resposta.json();
        alert(`Erro: ${erro.detail}`);
      }
    } catch (erro) {
      alert("Erro de conexão com o servidor.");
    }
  }

  if (carregando) {
    return <h2 className="loading" style={{color: 'black', textAlign: 'center', marginTop: '50px'}}>Sincronizando estoque...</h2>;
  }

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">Catálogo de Produtos</h1>
      </div>

      <table className="tabela">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Categoria</th>
            <th>Estoque Atual</th>
            <th>Preço de Venda</th>
            <th style={{textAlign: 'center'}}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map(produto => (
            <tr key={produto.id}>
              <td><strong>{produto.nome}</strong></td>
              <td><small>{produto.nome_categoria}</small></td>
              <td>
                <span style={{ 
                  backgroundColor: produto.quantidade_estoque === 0 ? '#f8d7da' : '#d4edda', 
                  color: produto.quantidade_estoque === 0 ? '#721c24' : '#155724',
                  padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' 
                }}>
                  {produto.quantidade_estoque || 0} un
                </span>
              </td>
              <td className="preco">R$ {(produto.preco_venda || 0).toFixed(2)}</td>
              <td style={{textAlign: 'center'}}>
                
                <button 
                  onClick={() => handleDeletar(produto)}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: produto.quantidade_estoque > 0 ? '#bdc3c7' : '#e74c3c', 
                    cursor: produto.quantidade_estoque > 0 ? 'not-allowed' : 'pointer' 
                  }}
                  title={produto.quantidade_estoque > 0 ? "Não é possível excluir com estoque" : "Excluir Produto"}
                >
                  <Trash2 size={20} />
                </button>

              </td>
            </tr>
          ))}
          
          {produtos.length === 0 && (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#7f8c8d' }}>
                Nenhum produto encontrado no catálogo.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Produtos;