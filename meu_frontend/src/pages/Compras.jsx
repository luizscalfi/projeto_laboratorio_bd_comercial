import React, { useState, useEffect } from 'react';
import { Store, ShoppingCart, Trash2, CheckCircle, XCircle, PackagePlus, Eye, EyeOff, List } from 'lucide-react';
import './styles/produto.css';

function Compras() {
  const [abaAtiva, setAbaAtiva] = useState('fornecedores'); 
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  
  const [fornecedores, setFornecedores] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [historicoCompras, setHistoricoCompras] = useState([]);
  
  const [notaAberta, setNotaAberta] = useState(false);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState('');
  const [carrinho, setCarrinho] = useState([]); 
  
  const [formFornecedor, setFormFornecedor] = useState({ razao_social: '', cnpj: '' });
  const [formItem, setFormItem] = useState({ id_produto: '', quantidade: '', valor_unitario: '' });
  const [mostrarNovoProduto, setMostrarNovoProduto] = useState(false);
  const [formNovoProduto, setFormNovoProduto] = useState({ nome: '', id_categoria: '', preco_venda: '' });

  const [detalhesCompraId, setDetalhesCompraId] = useState(null);
  const [itensDetalhe, setItensDetalhe] = useState([]);
  const [filtroData, setFiltroData] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    const user = localStorage.getItem('usuarioGestao');
    if (user) {
      setUsuarioLogado(JSON.parse(user));
    }
    carregarDados();
  }, [abaAtiva]);

  async function carregarDados() {
    try {
      const [resForn, resProd, resComp, resCat] = await Promise.all([
        fetch(`${API_URL}/fornecedores/`),
        fetch(`${API_URL}/produtos/`),
        fetch(`${API_URL}/compras/`),
        fetch(`${API_URL}/produtos/categorias/`)
      ]);
      const dForn = await resForn.json();
      const dProd = await resProd.json();
      const dComp = await resComp.json();
      const dCat = await resCat.json();

      setFornecedores(dForn.fornecedores || []);
      setProdutos(dProd.produtos || []);
      setHistoricoCompras(dComp.compras || []);
      setCategorias(dCat || []);
    } catch (e) {
      console.error("Erro ao sincronizar com o servidor:", e);
    }
  }

  async function handleSalvarFornecedor(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/fornecedores/`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(formFornecedor) 
      });
      if (res.ok) {
        setFormFornecedor({ razao_social: '', cnpj: '' });
        carregarDados();
      }
    } catch (e) { alert("Erro ao conectar ao servidor."); }
  }

  async function handleDeletarFornecedor(id) {
    if (!window.confirm("Remover este fornecedor?")) return;
    try {
      const res = await fetch(`${API_URL}/fornecedores/${id}`, { method: 'DELETE' });
      if (res.ok) carregarDados(); 
      else alert((await res.json()).detail);
    } catch (e) { alert("Erro ao excluir."); }
  }

  async function handleQuickCadastrarProduto(e) {
    e.preventDefault();
    if (!formNovoProduto.nome || !formNovoProduto.id_categoria || !formNovoProduto.preco_venda) {
      return alert("Preencha todos os campos do novo produto!");
    }
    let precoFormatado = formNovoProduto.preco_venda.toString().replace(',', '.');
    try {
      const res = await fetch(`${API_URL}/produtos/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nome: formNovoProduto.nome, 
          id_categoria: Number(formNovoProduto.id_categoria), 
          preco_custo: 0, 
          preco_venda: Number(precoFormatado) 
        })
      });
      if (res.ok) {
        setMostrarNovoProduto(false);
        setFormNovoProduto({ nome: '', id_categoria: '', preco_venda: '' });
        carregarDados();
        alert("Produto adicionado ao catálogo!");
      } else alert(`Erro: ${(await res.json()).detail}`);
    } catch (err) { alert("Erro de comunicação."); }
  }

  function handleIniciarCompra(e) {
    e.preventDefault();
    setNotaAberta(true); 
  }

  function handleColocarNoCarrinho(e) {
    e.preventDefault();
    const produtoEncontrado = produtos.find(p => p.id === parseInt(formItem.id_produto));
    const novoItem = {
      id_produto: produtoEncontrado.id,
      nome_produto: produtoEncontrado.nome,
      quantidade: parseInt(formItem.quantidade),
      valor_unitario: parseFloat(formItem.valor_unitario.toString().replace(',', '.'))
    };
    setCarrinho([...carrinho, novoItem]);
    setFormItem({ id_produto: '', quantidade: '', valor_unitario: '' });
  }

  function handleRemoverDoCarrinho(indexParaRemover) {
    setCarrinho(carrinho.filter((_, index) => index !== indexParaRemover));
  }

  async function handleFinalizarEntrada() {
    if (carrinho.length === 0) return alert("O carrinho está vazio!");
    if (!usuarioLogado) return alert("Erro de sessão: Utilizador não identificado.");

    try {
      const resCompra = await fetch(`${API_URL}/compras/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            id_fornecedor: parseInt(fornecedorSelecionado),
            id_usuario: usuarioLogado.id
        })
      });
      
      if (!resCompra.ok) throw new Error((await resCompra.json()).detail);
      const { id_compra } = await resCompra.json();

      for (const item of carrinho) {
        await fetch(`${API_URL}/compras/itens/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id_compra: id_compra, 
            id_produto: item.id_produto, 
            quantidade: item.quantidade, 
            valor_unitario: item.valor_unitario 
          })
        });
      }

      alert("Entrada concluída! Stock atualizado e registado na auditoria.");
      setNotaAberta(false);
      setCarrinho([]);
      setFornecedorSelecionado('');
      carregarDados();

    } catch (e) { alert("Erro: " + e.message); }
  }

  async function handleVerDetalhes(id) {
    if (detalhesCompraId === id) return setDetalhesCompraId(null);
    try {
      const res = await fetch(`${API_URL}/compras/${id}/itens`);
      const dados = await res.json();
      setItensDetalhe(dados.itens || []);
      setDetalhesCompraId(id);
    } catch (e) { alert("Erro ao carregar detalhes."); }
  }

  async function handleDeletarCompraHistorico(id) {
    if (!window.confirm("Atenção: Esta ação estornará o Stock e o Financeiro. Continuar?")) return;
    try {
      const res = await fetch(`${API_URL}/compras/${id}?id_usuario=${usuarioLogado.id}`, { method: 'DELETE' });
      if (res.ok) carregarDados(); 
      else alert((await res.json()).detail);
    } catch (e) { alert("Erro ao processar estorno."); }
  }

  // LÓGICA DO FILTRO DE DATAS
  const comprasFiltradas = filtroData 
    ? historicoCompras.filter(c => {
        if (!c.data_compra) return false;
        const dataAjustada = new Date(c.data_compra);
        const dataFormatada = `${dataAjustada.getFullYear()}-${String(dataAjustada.getMonth() + 1).padStart(2, '0')}-${String(dataAjustada.getDate()).padStart(2, '0')}`;
        return dataFormatada === filtroData;
      })
    : historicoCompras;

  return (
    <div className="container">
      <div className="header" style={{ display: 'flex', gap: '20px', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginBottom: '20px' }}>
        <button onClick={() => setAbaAtiva('fornecedores')} style={{ background: 'none', border: 'none', fontSize: '18px', fontWeight: 'bold', color: abaAtiva === 'fornecedores' ? '#3498db' : '#bdc3c7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Store size={20} /> Fornecedores</button>
        <button onClick={() => setAbaAtiva('compras')} style={{ background: 'none', border: 'none', fontSize: '18px', fontWeight: 'bold', color: abaAtiva === 'compras' ? '#27ae60' : '#bdc3c7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><ShoppingCart size={20} /> Compras / Entradas</button>
      </div>

      {abaAtiva === 'fornecedores' && (
        <section>
          <form onSubmit={handleSalvarFornecedor} style={{ display: 'flex', gap: '15px', marginBottom: '25px', background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <input placeholder="Razão Social" required style={{ flex: 2, padding: '10px' }} value={formFornecedor.razao_social} onChange={e => setFormFornecedor({...formFornecedor, razao_social: e.target.value})} />
            <input placeholder="CNPJ" required style={{ flex: 1, padding: '10px' }} value={formFornecedor.cnpj} onChange={e => setFormFornecedor({...formFornecedor, cnpj: e.target.value})} />
            <button type="submit" style={{ background: '#3498db', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>+ Adicionar</button>
          </form>
          <table className="tabela">
            <thead><tr><th>Fornecedor</th><th>CNPJ</th><th style={{textAlign: 'center'}}>Ações</th></tr></thead>
            <tbody>
              {fornecedores.map(f => (
                <tr key={f.id}><td><strong>{f.razao_social}</strong></td><td>{f.cnpj}</td><td style={{textAlign: 'center'}}><button onClick={() => handleDeletarFornecedor(f.id)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}><Trash2 size={18}/></button></td></tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {abaAtiva === 'compras' && (
        <section>
          <div style={{ background: '#fdfdfd', padding: '20px', borderRadius: '8px', border: '2px dashed #dcdde1', marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>{notaAberta ? `📦 Preparando Nota Fiscal` : '📝 Nova Entrada'}</h3>
              {notaAberta && (
                <button type="button" onClick={() => setMostrarNovoProduto(!mostrarNovoProduto)} style={{ background: '#f39c12', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                  <PackagePlus size={16} /> {mostrarNovoProduto ? 'Voltar' : 'Produto Não Cadastrado?'}
                </button>
              )}
            </div>

            {mostrarNovoProduto && (
              <form onSubmit={handleQuickCadastrarProduto} style={{ background: '#fef5e7', padding: '15px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #f39c12', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input placeholder="Nome" style={{ flex: 2, padding: '8px' }} value={formNovoProduto.nome} onChange={e => setFormNovoProduto({...formNovoProduto, nome: e.target.value})} />
                <select style={{ flex: 1, padding: '8px' }} value={formNovoProduto.id_categoria} onChange={e => setFormNovoProduto({...formNovoProduto, id_categoria: e.target.value})}>
                  <option value="">Categoria...</option>
                  {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
                </select>
                <input placeholder="P. Venda" style={{ flex: 1, padding: '8px' }} value={formNovoProduto.preco_venda} onChange={e => setFormNovoProduto({...formNovoProduto, preco_venda: e.target.value})} />
                <button type="submit" style={{ background: '#f39c12', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Gravar no Catálogo</button>
              </form>
            )}
            
            {!notaAberta ? (
              <form onSubmit={handleIniciarCompra} style={{ display: 'flex', gap: '15px' }}>
                <select required value={fornecedorSelecionado} onChange={e => setFornecedorSelecionado(e.target.value)} style={{ flex: 1, padding: '10px' }}>
                  <option value="" disabled>Selecione o Fornecedor...</option>
                  {fornecedores.map(f => <option key={f.id} value={f.id}>{f.razao_social}</option>)}
                </select>
                <button type="submit" style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Abrir Carrinho</button>
              </form>
            ) : (
              <div>
                <form onSubmit={handleColocarNoCarrinho} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  <select required value={formItem.id_produto} onChange={e => setFormItem({...formItem, id_produto: e.target.value})} style={{ flex: 2, padding: '10px' }}>
                    <option value="" disabled>Produto...</option>
                    {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                  <input type="number" required placeholder="Qtd" min="1" value={formItem.quantidade} onChange={e => setFormItem({...formItem, quantidade: e.target.value})} style={{ flex: 1, padding: '10px' }} />
                  <input type="number" step="0.01" required placeholder="Custo" value={formItem.valor_unitario} onChange={e => setFormItem({...formItem, valor_unitario: e.target.value})} style={{ flex: 1, padding: '10px' }} />
                  <button type="submit" style={{ background: '#3498db', color: '#fff', border: 'none', padding: '10px', borderRadius: '5px' }}>+ Inserir</button>
                </form>

                {carrinho.length > 0 && (
                  <div style={{ background: '#ecf0f1', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}><List size={18}/> Itens no Carrinho:</h4>
                    <ul style={{ paddingLeft: '20px' }}>
                      {carrinho.map((item, i) => (
                        <li key={i}>{item.quantidade}x {item.nome_produto} — R$ {item.valor_unitario.toFixed(2)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleFinalizarEntrada} style={{ flex: 1, background: '#2c3e50', color: '#fff', border: 'none', padding: '12px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}><CheckCircle size={18}/> Finalizar e Salvar</button>
                  <button onClick={() => { setNotaAberta(false); setCarrinho([]); }} style={{ flex: 1, background: '#e74c3c', color: '#fff', border: 'none', padding: '12px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}><XCircle size={18}/> Cancelar</button>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>Histórico de Entradas</h3>
            
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
            <thead><tr><th>ID</th><th>Data / Hora</th><th>Fornecedor</th><th>Total</th><th style={{textAlign: 'center'}}>Ações</th></tr></thead>
            <tbody>
              {comprasFiltradas.map(c => (
                <React.Fragment key={c.id}>
                  <tr>
                    <td><strong>#{c.id}</strong></td>
                    {/* COLUNA DE DATA E HORA AQUI */}
                    <td>{c.data_compra ? new Date(c.data_compra).toLocaleString('pt-BR') : 'N/A'}</td>
                    <td>{c.nome_fornecedor}</td>
                    <td className="preco">R$ {(c.valor_total || 0).toFixed(2)}</td>
                    <td style={{textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '15px'}}>
                      <button onClick={() => handleVerDetalhes(c.id)} style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer' }}>
                        {detalhesCompraId === c.id ? <EyeOff size={18}/> : <Eye size={18}/>}
                      </button>
                      {usuarioLogado && usuarioLogado.id_perfil === 1 && (
                        <button onClick={() => handleDeletarCompraHistorico(c.id)} title="Estornar (Admin)" style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>
                          <Trash2 size={18}/>
                        </button>
                      )}
                    </td>
                  </tr>
                  {detalhesCompraId === c.id && (
                    <tr style={{ background: '#f8f9fa' }}>
                      <td colSpan="5" style={{ padding: '15px 40px' }}>
                        <ul style={{ margin: 0, fontSize: '14px' }}>
                          {itensDetalhe.map(it => <li key={it.id}>{it.quantidade}x {it.nome_produto} (R$ {parseFloat(it.valor_unitario).toFixed(2)})</li>)}
                        </ul>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {comprasFiltradas.length === 0 && <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>Nenhuma entrada encontrada para este filtro.</td></tr>}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

export default Compras;