import React, { useState, useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';

function Caixa({ usuarioLogado }) {
  const [idCaixa, setIdCaixa] = useState('1');
  const [valorAbertura, setValorAbertura] = useState('');

  const [sessaoAtiva, setSessaoAtiva] = useState(null);
  const [carregandoStatus, setCarregandoStatus] = useState(true);

  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

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
    setMensagemSucesso('');
    setMensagemErro('');
  }, [idCaixa]);

  const verificarStatusCaixa = async () => {
    setCarregandoStatus(true);
    try {
      const resposta = await fetch(`http://127.0.0.1:8000/caixa/status/${idCaixa}`);
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
      setMensagemErro("Aviso: Falha ao verificar se o caixa está livre.");
    } finally {
      setCarregandoStatus(false);
    }
  };

  const handleAbrirCaixa = async (e) => {
    e.preventDefault();
    setMensagemSucesso('');
    setMensagemErro('');

    const pacoteDeDados = {
      id_caixa: parseInt(idCaixa),
      id_usuario: usuarioLogado.id,
      valor_abertura: parseFloat(valorAbertura)
    };

    try {
      const resposta = await fetch('http://127.0.0.1:8000/caixa/abrir/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pacoteDeDados)
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setMensagemErro(dados.detail || "Erro ao abrir o caixa.");
      } else {
        setMensagemSucesso(dados.mensagem);
        setValorAbertura('');
        verificarStatusCaixa();
      }
    } catch (erro) {
      setMensagemErro("Erro ao conectar com o servidor Python.");
    }
  };

  const handleFecharCaixa = async () => {
    setMensagemSucesso('');
    setMensagemErro('');

    if (!window.confirm("Atenção: Conferiu os valores da gaveta? Tem certeza que deseja fechar o expediente?")) return;

    try {
      const resposta = await fetch('http://127.0.0.1:8000/caixa/fechar/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_sessao_caixa: sessaoAtiva.id })
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setMensagemErro(dados.detail || "Erro ao fechar o caixa.");
      } else {
        setMensagemSucesso("Expediente encerrado com sucesso! Terminal bloqueado.");
        verificarStatusCaixa();
      }
    } catch (erro) {
      setMensagemErro("Erro ao conectar com o servidor Python.");
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>💰 Controle de Caixa</span>
      </h2>

      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', marginBottom: '20px', border: '1px solid #dee2e6', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ backgroundColor: '#3498db', color: 'white', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
          {usuarioLogado.nome.charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>Operador da Sessão</p>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#2c3e50' }}>{usuarioLogado.nome}</p>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#34495e' }}>Qual terminal você quer acessar?</label>
        <select
          value={idCaixa}
          onChange={(e) => setIdCaixa(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#e8f4f8', fontWeight: 'bold', color: '#2980b9' }}
        >
          <option value="1">Terminal 01 - Balcão Principal</option>
          <option value="2">Terminal 02 - Atendimento Expresso</option>
        </select>
      </div>

      {mensagemSucesso && <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '15px', borderRadius: '5px', marginBottom: '15px', fontWeight: 'bold' }}>✅ {mensagemSucesso}</div>}
      {mensagemErro && <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '5px', marginBottom: '15px', fontWeight: 'bold' }}>❌ {mensagemErro}</div>}

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

          <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeeba', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ color: '#856404', margin: '0 0 5px 0' }}>Sessão Ativa - Seu Caixa está Aberto</h3>
            <p style={{ color: '#856404', margin: '0 0 15px 0', fontSize: '14px' }}>Sessão #{sessaoAtiva.id}</p>

            {/* MINI-DASHBOARD DO CAIXA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.6)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#856404', textTransform: 'uppercase', fontWeight: 'bold' }}>Fundo (Troco)</p>
                <strong style={{ fontSize: '18px', color: '#d35400' }}>R$ {parseFloat(sessaoAtiva.valor_abertura).toFixed(2)}</strong>
              </div>
              <div style={{ flex: 1, borderLeft: '1px solid #ffeeba', borderRight: '1px solid #ffeeba' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#856404', textTransform: 'uppercase', fontWeight: 'bold' }}>Vendas (+)</p>
                <strong style={{ fontSize: '18px', color: '#27ae60' }}>R$ {parseFloat(sessaoAtiva.total_entradas).toFixed(2)}</strong>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#856404', textTransform: 'uppercase', fontWeight: 'bold' }}>Compras (-)</p>
                <strong style={{ fontSize: '18px', color: '#c0392b' }}>R$ {parseFloat(sessaoAtiva.total_saidas).toFixed(2)}</strong>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '2px solid #856404' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#856404', textTransform: 'uppercase', fontWeight: 'bold' }}>Valor Esperado em Gaveta</p>
              <h1 style={{ margin: '5px 0 0 0', color: '#2c3e50', fontSize: '36px' }}>R$ {parseFloat(sessaoAtiva.saldo_atual).toFixed(2)}</h1>
            </div>

            <button onClick={handleFecharCaixa} style={{ backgroundColor: '#e74c3c', color: 'white', padding: '15px', width: '100%', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
              🔒 Encerrar Expediente e Fechar Caixa
            </button>
          </div>

        ) : (

          <div style={{ backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ color: '#721c24', margin: '0 0 10px 0' }}>⚠️ Terminal Ocupado</h3>
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
            🔓 Abrir Terminal e Iniciar Vendas
          </button>
        </form>

      )}
    </div>
  );
}

export default Caixa;