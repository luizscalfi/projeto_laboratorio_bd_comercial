import React, { useState, useEffect } from 'react';
import { Trash2, AlertCircle, LoaderCircle } from 'lucide-react';
import './styles/estilo_produto.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [rotacao, setRotacao] = useState(0);
  const [toast, setToast] = useState({
    visivel: false,
    mensagem: '',
    tipo: 'sucesso'
  });
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

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

  const mostrarToast = (mensagem, tipo = 'sucesso') => {
    setToast({
      visivel: true,
      mensagem,
      tipo
    });

    setTimeout(() => {
      setToast({
        visivel: false,
        mensagem: '',
        tipo: 'sucesso'
      });
    }, 3000);
  };

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
      mostrarToast(
        `Ação bloqueada:\nO produto "${produto.nome}" possui ${produto.quantidade_estoque} unidades em estoque.\n\nO produto deve estar com o estoque zerado para ser removido.`,
        'erro'
      );
      return;
    }

    setProdutoSelecionado(produto);
    setModalExcluirAberto(true);
  }

  async function confirmarExclusao() {
    if (!produtoSelecionado) return;

    try {
      const resposta = await fetch(`${API_URL}/produtos/${produtoSelecionado.id}`, {
        method: 'DELETE'
      });

      if (resposta.ok) {
        setProdutos(produtos.filter(p => p.id !== produtoSelecionado.id));

        mostrarToast(
          `Produto "${produtoSelecionado.nome}" excluído com sucesso!`,
          'sucesso'
        );
      }
    } catch (erro) {
      mostrarToast("Erro de conexão com o servidor.", 'erro');
    } finally {
      setModalExcluirAberto(false);
      setProdutoSelecionado(null);
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
      {toast.visivel && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor:
              toast.tipo === 'sucesso'
                ? '#2ecc71'
                : '#e74c3c',
            color: '#fff',
            padding: '14px 18px',
            borderRadius: '8px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            zIndex: 99999,
            fontWeight: '600',
            minWidth: '280px',
            animation: 'slideToast 0.25s ease',
            whiteSpace: 'pre-line'
          }}
        >
          {toast.mensagem}
        </div>
      )}
      {modalExcluirAberto && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(3px)'
          }}
        >
          <div
            style={{
              width: '420px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '25px',
              boxShadow: '0 10px 35px rgba(0,0,0,0.2)',
              animation: 'fadeIn 0.2s ease'
            }}
          >
            <h2
              style={{
                margin: '0 0 10px 0',
                color: '#2f3640',
                fontSize: '22px'
              }}
            >
              Confirmar Exclusão
            </h2>

            <p
              style={{
                color: '#636e72',
                lineHeight: '1.5',
                marginBottom: '25px'
              }}
            >
              Tem certeza que deseja remover o produto:
              <br /><br />
              <strong>{produtoSelecionado?.nome}</strong>
              <br /><br />
              Esta ação não poderá ser desfeita.
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px'
              }}
            >
              <button
                onClick={() => {
                  setModalExcluirAberto(false);
                  setProdutoSelecionado(null);
                }}
                style={{
                  padding: '12px 18px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#dfe6e9',
                  color: '#2f3640',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancelar
              </button>

              <button
                onClick={confirmarExclusao}
                style={{
                  padding: '12px 18px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#c0392b',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Produtos;