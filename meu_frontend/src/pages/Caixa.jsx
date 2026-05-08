import React, { useState, useEffect } from 'react';
import { LoaderCircle, HandCoins, TriangleAlert } from 'lucide-react';


function Caixa({ usuarioLogado }) {
  const [idCaixa, setIdCaixa] = useState('1');
  const [valorAbertura, setValorAbertura] = useState('');

  const [sessaoAtiva, setSessaoAtiva] = useState(null);
  const [carregandoStatus, setCarregandoStatus] = useState(true);

  const [menuAberto, setMenuAberto] = useState(false);
  const [modalFecharAberto, setModalFecharAberto] = useState(false);

  const [toast, setToast] = useState({
    visivel: false,
    mensagem: '',
    tipo: 'sucesso'
  });

  const terminais = [
    { id: '1', nome: 'Terminal 01 - Balcão Principal' },
    { id: '2', nome: 'Terminal 02 - Atendimento Expresso' }
  ];

  const terminalSelecionado = terminais.find(t => t.id === idCaixa);
  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  const [rotacao, setRotacao] = useState(0);

  useEffect(() => {
    if (!carregandoStatus) return;

    const interval = setInterval(() => {
      setRotacao((prev) => prev + 8);
    }, 16);

    return () => clearInterval(interval);
  }, [carregandoStatus]);

  useEffect(() => {
    verificarStatusCaixa();
  }, [idCaixa]);

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

  const verificarStatusCaixa = async () => {
    setCarregandoStatus(true);
    try {
      const resposta = await fetch(`${API_URL}/caixa/status/${idCaixa}`);
      const dados = await resposta.json();

      if (dados.sessao_ativa) {
        setSessaoAtiva(dados.sessao);
        setValorAbertura('');
      } else {
        setSessaoAtiva(null);
        if (dados.ultimo_saldo !== undefined) {
          setValorAbertura(dados.ultimo_saldo.toFixed(2));
        }
      }
    } catch (erro) {
      mostrarToast(
        "Falha ao verificar se o caixa está livre.",
        'erro'
      );
    } finally {
      setCarregandoStatus(false);
    }
  };

  const handleAbrirCaixa = async (e) => {
    e.preventDefault();

    const pacoteDeDados = {
      id_caixa: parseInt(idCaixa),
      id_usuario: usuarioLogado.id,
      valor_abertura: parseFloat(valorAbertura)
    };

    try {
      const resposta = await fetch(`${API_URL}/caixa/abrir/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pacoteDeDados)
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        mostrarToast(dados.detail || "Erro ao abrir o caixa.", 'erro');
      } else {
        mostrarToast('Feito! O caixa foi aberto.', 'sucesso');
        setValorAbertura('');
        verificarStatusCaixa();
      }
    } catch (erro) {
      mostrarToast("Erro ao conectar com o servidor.", 'erro');
    }
  };

  const handleFecharCaixa = async () => {
    try {
      const resposta = await fetch(`${API_URL}/caixa/fechar/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_sessao_caixa: sessaoAtiva.id })
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        mostrarToast(dados.detail || "Erro ao fechar o caixa.");
      } else {
        verificarStatusCaixa();
        mostrarToast('Feito! O caixa foi fechado.', 'sucesso');
      }
    } catch (erro) {
      mostrarToast(
        "Erro ao conectar com o servidor.",
        'erro'
      );
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span><HandCoins /> Controle de Caixa</span>
      </h2>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '20px', position: 'relative' }}>
          <label
            style={{
              fontWeight: 'bold',
              display: 'block',
              marginBottom: '5px',
              color: '#2f3640'
            }}
          >
            Qual terminal deseja utilizar?
          </label>

          <div
            onClick={() => setMenuAberto(!menuAberto)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #dcdde1',
              backgroundColor: '#f5f6fa',
              fontWeight: '600',
              color: '#2f3640',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              userSelect: 'none',
              transition: '0.2s'
            }}
          >
            <span>{terminalSelecionado?.nome}</span>

            <span
              style={{
                transition: '0.2s',
                transform: menuAberto ? 'rotate(180deg)' : 'rotate(0deg)',
                color: '#718093'
              }}
            >
              ▼
            </span>
          </div>

          {menuAberto && (
            <div
              style={{
                position: 'absolute',
                width: '100%',
                backgroundColor: '#ffffff',
                border: '1px solid #dcdde1',
                borderRadius: '8px',
                marginTop: '6px',
                overflow: 'hidden',
                boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                zIndex: 1000
              }}
            >
              {terminais.map((terminal) => (
                <div
                  key={terminal.id}
                  onClick={() => {
                    setIdCaixa(terminal.id);
                    setMenuAberto(false);
                  }}
                  style={{
                    padding: '12px',
                    cursor: 'pointer',
                    transition: '0.2s',
                    backgroundColor:
                      idCaixa === terminal.id ? '#ecf0f1' : '#ffffff',

                    color:
                      idCaixa === terminal.id ? '#2f3640' : '#636e72',

                    fontWeight:
                      idCaixa === terminal.id ? '600' : '500',

                    borderBottom: '1px solid #f1f2f6'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f1f2f6';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor =
                      idCaixa === terminal.id
                        ? '#ecf0f1'
                        : '#ffffff';
                  }}
                >
                  {terminal.nome}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {carregandoStatus ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#7f8c8d',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          <LoaderCircle
            size={40}
            style={{
              transform: `rotate(${rotacao}deg)`,
              color: '#3498db'
            }}
          />
          <span>Verificando status do terminal...</span>
        </div>
      ) : sessaoAtiva ? (

        sessaoAtiva.operador === usuarioLogado.nome ? (

          <div style={{ backgroundColor: '#525150', border: '1px solidrgb(129, 129, 129)', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ color: '#00000', margin: '0 0 5px 0' }}>Sessão Ativa - Seu Caixa está Aberto</h3>
            <p style={{ color: '#00000', margin: '0 0 15px 0', fontSize: '14px' }}>Sessão #{sessaoAtiva.id}</p>

            {/* MINI-DASHBOARD DO CAIXA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgb(255, 255, 255)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ flex: 1, borderLeft: '1px solidrgb(143, 143, 143)', borderRight: '1px solidrgb(165, 165, 165)' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#6b6963', textTransform: 'uppercase', fontWeight: 'bold' }}>Vendas (+)</p>
                <strong style={{ fontSize: '18px', color: '#27ae60' }}>R$ {parseFloat(sessaoAtiva.total_entradas).toFixed(2)}</strong>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#6b6963', textTransform: 'uppercase', fontWeight: 'bold' }}>Compras (-)</p>
                <strong style={{ fontSize: '18px', color: '#c0392b' }}>R$ {parseFloat(sessaoAtiva.total_saidas).toFixed(2)}</strong>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#6b6963', textTransform: 'uppercase', fontWeight: 'bold' }}>Fundo (Troco)</p>
                <strong style={{ fontSize: '18px', color: '#d35400' }}>R$ {parseFloat(sessaoAtiva.valor_abertura).toFixed(2)}</strong>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '2px solidrgb(131, 131, 131)' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b6963', textTransform: 'uppercase', fontWeight: 'bold' }}>Valor Esperado em Gaveta</p>
              <h1 style={{ margin: '5px 0 0 0', color: '#2c3e50', fontSize: '36px' }}>R$ {parseFloat(sessaoAtiva.saldo_atual).toFixed(2)}</h1>
            </div>

            <button onClick={() => setModalFecharAberto(true)} style={{ backgroundColor: '#8c2419', color: 'white', padding: '15px', width: '100%', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
              Encerrar Expediente e Fechar Caixa
            </button>
          </div>

        ) : (

          <div style={{ backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ color: '#721c24', margin: '0 0 10px 0' }}><TriangleAlert /> Terminal Ocupado</h3>
            <p style={{ color: '#721c24', margin: '0 0 0 0' }}>
              Este terminal já foi aberto por <strong>{sessaoAtiva.operador}</strong> e está em uso no momento.<br /><br />
              Por favor, selecione um terminal livre acima.
            </p>
          </div>

        )

      ) : (

        <form onSubmit={handleAbrirCaixa} style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Este terminal está livre!</h3>

          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Fundo de Troco Inicial (R$):</label>
            <p style={{ fontSize: '12px', color: '#7f8c8d', margin: '0 0 8px 0' }}>*Valor pré-preenchido baseado no saldo de fecho anterior</p>
            <input type="number" step="0.01" placeholder="Ex: 150.00" value={valorAbertura} onChange={(e) => setValorAbertura(e.target.value)} required style={{ width: '90%', padding: '15px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '18px' }} />
          </div>

          <button type="submit" style={{ backgroundColor: '#27ae60', color: 'white', padding: '15px', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
            Abrir Terminal e Iniciar Vendas
          </button>
        </form>

      )}
      {modalFecharAberto && (
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
              Encerrar Expediente
            </h2>

            <p
              style={{
                color: '#636e72',
                lineHeight: '1.5',
                marginBottom: '25px'
              }}
            >
              Conferiu os valores da gaveta?
              <br /><br />
              Após confirmar, o caixa será encerrado e o terminal ficará bloqueado até nova abertura.
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px'
              }}
            >
              <button
                onClick={() => setModalFecharAberto(false)}
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
                onClick={() => {
                  setModalFecharAberto(false);
                  handleFecharCaixa();
                }}
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
                Confirmar Encerramento
              </button>
            </div>
          </div>
        </div>
      )}
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
            animation: 'slideToast 0.25s ease'
          }}
        >
          {toast.mensagem}
        </div>
      )}
    </div>
  );
}

export default Caixa;