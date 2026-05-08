import React, { useState, useEffect } from 'react';
import { Trash2, AlertCircle, LoaderCircle } from 'lucide-react';
import './styles/estilo_produto.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [rotacao, setRotacao] = useState(0);

  useEffect(() => {
    carregarProdutos();
  }, []);

  useEffect(() => {
    if (!carregando) return;

    const interval = setInterval(() => {
      setRotacao((prev) => prev + 8);
    }, 16);

    return () => clearInterval(interval);
  }, [carregando]);

  async function carregarProdutos() {
    setCarregando(true);

    try {
      const resposta = await fetch(`${API_URL}/produtos/`);
      const dados = await resposta.json();

      setTimeout(() => {
        setProdutos(dados.produtos || []);
        setCarregando(false);
      }, 500);

    } catch (erro) {
      console.error("Erro ao buscar produtos:", erro);

      setTimeout(() => {
        setCarregando(false);
      }, 500);
    }
  }

  async function handleDeletar(produto) {
    if (produto.quantidade_estoque > 0) {
      alert(`Ação bloqueada: O produto "${produto.nome}" possui ${produto.quantidade_estoque} unidades em estoque. Zere o estoque antes de excluir.`);
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir o produto "${produto.nome}" do catálogo?`)) return;

    try {
      const resposta = await fetch(`${API_URL}/produtos/${produto.id}`, {
        method: 'DELETE'
      });

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
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '40px',
          color: '#7f8c8d',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          marginTop: '40px'
        }}
      >
        <LoaderCircle
          size={40}
          style={{
            transform: `rotate(${rotacao}deg)`,
            color: '#3498db'
          }}
        />

        <span
          style={{
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          Sincronizando estoque...
        </span>
      </div>
    );
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
            <th style={{ textAlign: 'center' }}>Ações</th>
          </tr>
        </thead>

        <tbody>
          {produtos.map(produto => (
            <tr key={produto.id}>
              <td><strong>{produto.nome}</strong></td>

              <td><small>{produto.nome_categoria}</small></td>

              <td>
                <span
                  style={{
                    backgroundColor:
                      produto.quantidade_estoque === 0
                        ? '#f8d7da'
                        : '#d4edda',

                    color:
                      produto.quantidade_estoque === 0
                        ? '#721c24'
                        : '#155724',

                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}
                >
                  {produto.quantidade_estoque || 0} un
                </span>
              </td>

              <td className="preco">
                R$ {(produto.preco_venda || 0).toFixed(2)}
              </td>

              <td style={{ textAlign: 'center' }}>
                <button
                  onClick={() => handleDeletar(produto)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color:
                      produto.quantidade_estoque > 0
                        ? '#bdc3c7'
                        : '#e74c3c',

                    cursor:
                      produto.quantidade_estoque > 0
                        ? 'not-allowed'
                        : 'pointer'
                  }}
                  title={
                    produto.quantidade_estoque > 0
                      ? "Não é possível excluir com estoque"
                      : "Excluir Produto"
                  }
                >
                  <Trash2 size={20} />
                </button>
              </td>
            </tr>
          ))}

          {produtos.length === 0 && (
            <tr>
              <td
                colSpan="5"
                style={{
                  textAlign: 'center',
                  padding: '30px',
                  color: '#7f8c8d'
                }}
              >
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