import React, { useState, useEffect } from 'react';
import { ShoppingBag, Trash2, CheckCircle, User, CreditCard, List, Lock, Eye, EyeOff, UserPlus } from 'lucide-react';
import './styles/produto.css';

function Vendas() {
  const [abaAtiva, setAbaAtiva] = useState('pdv'); 
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  
  // Estados do Caixa
  const [idCaixa, setIdCaixa] = useState('1'); 
  const [sessaoAtiva, setSessaoAtiva] = useState(null);
  const [carregandoCaixa, setCarregandoCaixa] = useState(true);

  // Estados de Dados Base
  const [produtos, setProdutos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [historicoVendas, setHistoricoVendas] = useState([]);
  
  // Estados do Carrinho (PDV)
  const [carrinho, setCarrinho] = useState([]); 
  const [formItem, setFormItem] = useState({ id_produto: '', quantidade: 1 });
  
  // Fechamento de Conta
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [pagamentoSelecionado, setPagamentoSelecionado] = useState('');

  // Estados do Cadastro Rápido de Cliente
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
  const [formCliente, setFormCliente] = useState({ nome: '', cpf_cnpj: '' });

  // Estados para Visualizar Detalhes e Filtro de Data
  const [detalhesVendaId, setDetalhesVendaId] = useState(null);
  const [itensDetalhe, setItensDetalhe] = useState([]);
  const [filtroData, setFiltroData] = useState(''); // <-- NOVO ESTADO DO FILTRO

  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    const user = localStorage.getItem('usuarioGestao');
    if (user) {
      setUsuarioLogado(JSON.parse(user));
    }
    carregarDados();
  }, [abaAtiva]);

  useEffect(() => {
    verificarStatusCaixa();
  }, [idCaixa]);

  async function verificarStatusCaixa() {
    setCarregandoCaixa(true);
    try {
      const res = await fetch(`${API_URL}/caixa/status/${idCaixa}`);
      const dados = await res.json();
      if (dados.sessao_ativa) {
        setSessaoAtiva(dados.sessao);
      } else {
        setSessaoAtiva(null);
      }
    } catch (erro) {
      console.error("Falha ao verificar caixa:", erro);
    } finally {
      setCarregandoCaixa(false);
    }
  }

  async function carregarDados() {
    try {
      const [resProd, resApoio, resVendas] = await Promise.all([
        fetch(`${API_URL}/produtos/`),
        fetch(`${API_URL}/vendas/apoio/`),
        fetch(`${API_URL}/vendas/`)
      ]);
      const dProd = await resProd.json();
      const dApoio = await resApoio.json();
      const dVendas = await resVendas.json();

      setProdutos(dProd.produtos || []);
      setClientes(dApoio.clientes || []);
      setFormasPagamento(dApoio.formas_pagamento || []);
      setHistoricoVendas(dVendas.vendas || []);
    } catch (e) { console.error("Erro ao sincronizar dados:", e); }
  }

  async function handleCadastrarCliente(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/vendas/clientes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formCliente.nome,
          cpf_cnpj: formCliente.cpf_cnpj || null
        })
      });
      const dados = await res.json();
      
      if (!res.ok) {
        throw new Error(dados.detail || "Erro ao cadastrar.");
      }

      alert("Cliente cadastrado com sucesso!");
      setFormCliente({ nome: '', cpf_cnpj: '' });
      setMostrarModalCliente(false);
      
      await carregarDados();
      setClienteSelecionado(dados.id_cliente.toString());

    } catch (erro) {
      alert(erro.message);
    }
  }

  function handleColocarNoCarrinho(e) {
    e.preventDefault();
    if (!formItem.id_produto || formItem.quantidade < 1) return;

    const produto = produtos.find(p => p.id === parseInt(formItem.id_produto));
    const qtdDesejada = parseInt(formItem.quantidade);

    const qtdJaNoCarrinho = carrinho.filter(i => i.id_produto === produto.id).reduce((acc, curr) => acc + curr.quantidade, 0);
    if (qtdJaNoCarrinho + qtdDesejada > produto.quantidade_estoque) {
      return alert(`❌ Stock insuficiente! Restam ${produto.quantidade_estoque - qtdJaNoCarrinho} unidades.`);
    }

    const novoItem = {
      id_produto: produto.id,
      nome_produto: produto.nome,
      quantidade: qtdDesejada,
      valor_unitario: parseFloat(produto.preco_venda),
      subtotal: qtdDesejada * parseFloat(produto.preco_venda)
    };

    setCarrinho([...carrinho, novoItem]);
    setFormItem({ id_produto: '', quantidade: 1 });
  }

  function handleRemoverDoCarrinho(indexParaRemover) {
    setCarrinho(carrinho.filter((_, index) => index !== indexParaRemover));
  }

  const calcularTotalCarrinho = () => carrinho.reduce((acc, item) => acc + item.subtotal, 0);

  async function handleFinalizarVenda() {
    if (carrinho.length === 0) return alert("O carrinho está vazio!");
    if (!clienteSelecionado) return alert("Selecione um cliente!");
    if (!pagamentoSelecionado) return alert("Selecione a forma de pagamento!");
    if (!sessaoAtiva) return alert("Erro: Nenhuma sessão de caixa ativa encontrada.");
    if (!usuarioLogado) return alert("Erro de sessão: Utilizador não identificado.");

    const valorTotal = calcularTotalCarrinho();

    try {
      const resVenda = await fetch(`${API_URL}/vendas/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id_cliente: parseInt(clienteSelecionado),
          id_forma_pagamento: parseInt(pagamentoSelecionado),
          id_sessao_caixa: sessaoAtiva.id,
          valor_total: valorTotal,
          id_usuario: usuarioLogado.id
        })
      });
      
      if (!resVenda.ok) throw new Error((await resVenda.json()).detail);
      const { id_venda } = await resVenda.json();

      for (const item of carrinho) {
        const resItem = await fetch(`${API_URL}/vendas/itens/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_venda: id_venda, id_produto: item.id_produto, quantidade: item.quantidade, valor_unitario: item.valor_unitario })
        });
        if (!resItem.ok) throw new Error((await resItem.json()).detail);
      }

      alert(`✅ Venda Concluída! Total: R$ ${valorTotal.toFixed(2)}`);
      setCarrinho([]);
      setClienteSelecionado('');
      setPagamentoSelecionado('');
      carregarDados(); 

    } catch (e) {
      alert("❌ Erro ao finalizar venda: " + e.message);
    }
  }

  async function handleVerDetalhes(id) {
    if (detalhesVendaId === id) return setDetalhesVendaId(null);
    try {
      const res = await fetch(`${API_URL}/vendas/${id}/itens`);
      const dados = await res.json();
      setItensDetalhe(dados.itens || []);
      setDetalhesVendaId(id);
    } catch (e) { alert("Erro ao carregar detalhes da venda."); }
  }

  // LÓGICA DO FILTRO DE DATAS
  const vendasFiltradas = filtroData 
    ? historicoVendas.filter(v => {
        if (!v.data_venda) return false;
        const dataAjustada = new Date(v.data_venda);
        const dataFormatada = `${dataAjustada.getFullYear()}-${String(dataAjustada.getMonth() + 1).padStart(2, '0')}-${String(dataAjustada.getDate()).padStart(2, '0')}`;
        return dataFormatada === filtroData;
      })
    : historicoVendas;

  return (
    <div className="container">
      <div className="header" style={{ display: 'flex', gap: '20px', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginBottom: '20px' }}>
        <button onClick={() => setAbaAtiva('pdv')} style={{ background: 'none', border: 'none', fontSize: '18px', fontWeight: 'bold', color: abaAtiva === 'pdv' ? '#27ae60' : '#bdc3c7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingBag size={20} /> Ponto de Venda (PDV)
        </button>
        <button onClick={() => setAbaAtiva('historico')} style={{ background: 'none', border: 'none', fontSize: '18px', fontWeight: 'bold', color: abaAtiva === 'historico' ? '#3498db' : '#bdc3c7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <List size={20} /> Histórico de Vendas
        </button>
      </div>

      {abaAtiva === 'pdv' && (
        <section>
          {/* SELETOR DE TERMINAL */}
          <div style={{ marginBottom: '20px', padding: '15px', background: '#ecf0f1', borderRadius: '8px', display: 'flex', gap: '15px', alignItems: 'center' }}>
            <label style={{ fontWeight: 'bold', color: '#2c3e50' }}>Terminal Operacional:</label>
            <select value={idCaixa} onChange={(e) => setIdCaixa(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #bdc3c7', flex: 1, maxWidth: '300px' }}>
              <option value="1">Terminal 01 - Balcão Principal</option>
              <option value="2">Terminal 02 - Atendimento Expresso</option>
            </select>
          </div>

          {carregandoCaixa ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>⏳ Verificando liberação do terminal...</div>
          ) : !sessaoAtiva ? (
            <div style={{ background: '#f8d7da', padding: '30px', borderRadius: '8px', textAlign: 'center', border: '1px solid #f5c6cb' }}>
              <Lock size={48} color="#721c24" style={{ marginBottom: '15px' }} />
              <h2 style={{ color: '#721c24', margin: '0 0 10px 0' }}>Terminal Fechado</h2>
              <p style={{ color: '#721c24' }}>Você precisa abrir o caixa no menu "Fluxo de Caixa" antes de realizar vendas neste terminal.</p>
            </div>
          ) : sessaoAtiva.operador !== usuarioLogado?.nome ? (
            <div style={{ background: '#fff3cd', padding: '30px', borderRadius: '8px', textAlign: 'center', border: '1px solid #ffeeba' }}>
              <Lock size={48} color="#856404" style={{ marginBottom: '15px' }} />
              <h2 style={{ color: '#856404', margin: '0 0 10px 0' }}>Terminal Ocupado</h2>
              <p style={{ color: '#856404' }}>Este terminal está sendo operado por <strong>{sessaoAtiva.operador}</strong>. Selecione outro terminal ou solicite o encerramento da sessão.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {/* LADO ESQUERDO: Adicionar Itens */}
              <div style={{ flex: 2, minWidth: '300px', background: '#fdfdfd', padding: '20px', borderRadius: '8px', border: '1px solid #dcdde1' }}>
                <h3 style={{ marginTop: 0, color: '#2c3e50' }}>🛒 Adicionar Produto</h3>
                
                <form onSubmit={handleColocarNoCarrinho} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  <select required value={formItem.id_produto} onChange={e => setFormItem({...formItem, id_produto: e.target.value})} style={{ flex: 3, padding: '12px', fontSize: '15px' }}>
                    <option value="" disabled>Selecione o Produto (Nome - Stock)</option>
                    {produtos.filter(p => p.quantidade_estoque > 0).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nome} — R$ {p.preco_venda.toFixed(2)} (Stock: {p.quantidade_estoque})
                      </option>
                    ))}
                  </select>
                  <input type="number" required placeholder="Qtd" min="1" value={formItem.quantidade} onChange={e => setFormItem({...formItem, quantidade: e.target.value})} style={{ flex: 1, padding: '12px', fontSize: '15px' }} />
                  <button type="submit" style={{ background: '#3498db', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Inserir</button>
                </form>

                <div style={{ background: '#ecf0f1', padding: '15px', borderRadius: '6px', minHeight: '200px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#34495e' }}>Itens Registados:</h4>
                  {carrinho.length === 0 ? <p style={{ color: '#7f8c8d' }}>Carrinho vazio. Adicione itens acima.</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        {carrinho.map((item, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #bdc3c7' }}>
                            <td style={{ padding: '8px 0' }}>{item.quantidade}x</td>
                            <td><strong>{item.nome_produto}</strong></td>
                            <td style={{ textAlign: 'right' }}>R$ {item.subtotal.toFixed(2)}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button onClick={() => handleRemoverDoCarrinho(i)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}><Trash2 size={16}/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* LADO DIREITO: Fechamento de Conta */}
              <div style={{ flex: 1, minWidth: '300px', background: '#2c3e50', padding: '20px', borderRadius: '8px', color: '#ecf0f1', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid #34495e', paddingBottom: '10px' }}>💳 Fechar Conta</h3>
                
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}><User size={16}/> Cliente:</label>
                  </div>
                  
                  {/* SELETOR DE CLIENTES + BOTÃO NOVO CLIENTE */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select value={clienteSelecionado} onChange={e => setClienteSelecionado(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: 'none' }}>
                      <option value="">Selecione o Cliente...</option>
                      {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                    <button 
                      onClick={() => setMostrarModalCliente(!mostrarModalCliente)} 
                      style={{ background: '#3498db', color: 'white', border: 'none', padding: '0 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      title="Cadastrar Novo Cliente Rápido"
                    >
                      <UserPlus size={18}/>
                    </button>
                  </div>
                </div>

                {/* FORMULÁRIO DE CADASTRO RÁPIDO */}
                {mostrarModalCliente && (
                  <form onSubmit={handleCadastrarCliente} style={{ background: '#34495e', padding: '15px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #3498db' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#3498db' }}>Novo Cliente</h4>
                    <input required placeholder="Nome Completo" value={formCliente.nome} onChange={e => setFormCliente({...formCliente, nome: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: 'none' }} />
                    <input placeholder="CPF / CNPJ (Opcional)" value={formCliente.cpf_cnpj} onChange={e => setFormCliente({...formCliente, cpf_cnpj: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: 'none' }} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="submit" style={{ flex: 1, background: '#2ecc71', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Salvar</button>
                      <button type="button" onClick={() => setMostrarModalCliente(false)} style={{ flex: 1, background: '#e74c3c', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                    </div>
                  </form>
                )}

                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px', fontSize: '14px' }}><CreditCard size={16}/> Pagamento:</label>
                  <select value={pagamentoSelecionado} onChange={e => setPagamentoSelecionado(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: 'none' }}>
                    <option value="">Forma de Pagamento...</option>
                    {formasPagamento.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                </div>

                <div style={{ marginTop: 'auto', background: '#34495e', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                  <span style={{ fontSize: '16px', color: '#bdc3c7' }}>Total da Venda</span>
                  <h1 style={{ margin: '5px 0', fontSize: '32px', color: '#2ecc71' }}>R$ {calcularTotalCarrinho().toFixed(2)}</h1>
                </div>

                <button onClick={handleFinalizarVenda} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '15px', borderRadius: '6px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginTop: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={22} /> Confirmar Venda
                </button>
                
                {carrinho.length > 0 && (
                  <button onClick={() => setCarrinho([])} style={{ background: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                    Cancelar Carrinho
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ABA 2: HISTÓRICO DE VENDAS COM CALENDÁRIO */}
      {abaAtiva === 'historico' && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>Relatório de Vendas Concluídas</h3>
            
            {/* O CALENDÁRIO MÁGICO AQUI */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#ecf0f1', padding: '8px 15px', borderRadius: '6px' }}>
              <label style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '14px' }}>Filtrar por Data:</label>
              <input 
                type="date" 
                value={filtroData} 
                onChange={(e) => setFiltroData(e.target.value)}
                style={{ padding: '5px', border: '1px solid #bdc3c7', borderRadius: '4px' }}
              />
              {filtroData && (
                <button onClick={() => setFiltroData('')} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Limpar</button>
              )}
            </div>
          </div>

          <table className="tabela">
            <thead>
              <tr>
                <th>ID</th>
                <th>Data / Hora</th>
                <th>Cliente</th>
                <th>Pagamento</th>
                <th>Total</th>
                <th style={{textAlign: 'center'}}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {vendasFiltradas.map(v => (
                <React.Fragment key={v.id}>
                  <tr>
                    <td><strong>#{v.id}</strong></td>
                    {/* AQUI MOSTRA A DATA COM A HORA */}
                    <td>{v.data_venda ? new Date(v.data_venda).toLocaleString('pt-BR') : 'N/A'}</td>
                    <td>{v.nome_cliente || 'Cliente Padrão'}</td>
                    <td>{v.forma_pagamento || 'Dinheiro'}</td>
                    <td className="preco" style={{ color: '#27ae60' }}>R$ {(v.valor_total || 0).toFixed(2)}</td>
                    <td style={{textAlign: 'center'}}>
                      <button onClick={() => handleVerDetalhes(v.id)} title="Ver Itens" style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer' }}>
                        {detalhesVendaId === v.id ? <EyeOff size={18}/> : <Eye size={18}/>}
                      </button>
                    </td>
                  </tr>
                  {detalhesVendaId === v.id && (
                    <tr style={{ background: '#f8f9fa' }}>
                      <td colSpan="6" style={{ padding: '15px 40px' }}>
                        <strong style={{ color: '#7f8c8d', fontSize: '13px' }}>CUPOM DA VENDA:</strong>
                        <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px', fontSize: '14px', color: '#2c3e50' }}>
                          {itensDetalhe.length === 0 ? <li>Nenhum item encontrado.</li> : itensDetalhe.map(item => (
                            <li key={item.id}>
                              {item.quantidade}x {item.nome_produto} — R$ {parseFloat(item.valor_unitario).toFixed(2)} / cada
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {vendasFiltradas.length === 0 && <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>Nenhuma venda encontrada para este filtro.</td></tr>}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

export default Vendas;