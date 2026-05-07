from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import obter_conexao
from psycopg2.extras import RealDictCursor

router = APIRouter(prefix="/vendas", tags=["Operações de Venda"])

class NovaVenda(BaseModel):
    id_cliente: int
    id_forma_pagamento: int
    id_sessao_caixa: int
    valor_total: float
    id_usuario: int  # Campo obrigatório para a auditoria

class NovoItemVenda(BaseModel):
    id_venda: int
    id_produto: int
    quantidade: int
    valor_unitario: float
    
class NovoCliente(BaseModel):
    nome: str
    cpf_cnpj: str = None

# -------------------------------------------------------------------
# ROTA 1: BUSCAR DADOS DE APOIO (Clientes e Formas de Pagamento)
# -------------------------------------------------------------------
@router.get("/apoio/")
def listar_dados_apoio():
    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute('SELECT id, nome FROM "cliente" ORDER BY nome;')
        clientes = cursor.fetchall()
        cursor.execute('SELECT id, nome FROM "forma_pagamento" ORDER BY nome;')
        formas_pagamento = cursor.fetchall()
        return {"clientes": clientes, "formas_pagamento": formas_pagamento}
    except Exception as e:
        return {"clientes": [], "formas_pagamento": []}
    finally:
        if conn: conn.close()

# -------------------------------------------------------------------
# ROTA 2: LISTAR HISTÓRICO DE VENDAS
# -------------------------------------------------------------------
@router.get("/")
def listar_historico_vendas():
    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        sql = """
            SELECT v.id, v.valor_total, v.data_venda, c.nome as nome_cliente, fp.nome as forma_pagamento
            FROM "venda" v
            LEFT JOIN "cliente" c ON v.id_cliente = c.id
            LEFT JOIN "forma_pagamento" fp ON v.id_forma_pagamento = fp.id
            ORDER BY v.id DESC;
        """
        cursor.execute(sql)
        return {"vendas": cursor.fetchall()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

# -------------------------------------------------------------------
# ROTA 3: BUSCAR ITENS DE UMA VENDA ESPECÍFICA
# -------------------------------------------------------------------
@router.get("/{id_venda}/itens")
def listar_itens_venda(id_venda: int):
    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        sql = """
            SELECT iv.id, iv.quantidade, iv.valor_unitario, p.nome as nome_produto 
            FROM "item_venda" iv
            JOIN "produto" p ON iv.id_produto = p.id
            WHERE iv.id_venda = %s;
        """
        cursor.execute(sql, (id_venda,))
        return {"itens": cursor.fetchall()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

# -------------------------------------------------------------------
# ROTA 4: REGISTRAR NOVA VENDA (Com Registo de Auditoria)
# -------------------------------------------------------------------
@router.post("/")
def registrar_venda(venda: NovaVenda):
    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor()
        
        # 1. Registra a venda
        sql = """
            INSERT INTO "venda" ("id_cliente", "id_forma_pagamento", "id_sessao_caixa", "valor_total")
            VALUES (%s, %s, %s, %s) RETURNING id;
        """
        cursor.execute(sql, (venda.id_cliente, venda.id_forma_pagamento, venda.id_sessao_caixa, venda.valor_total))
        id_gerado = cursor.fetchone()[0]
        
        # 2. Registra o LOG DE AUDITORIA
        sql_log = 'INSERT INTO "log_auditoria" ("id_usuario", "acao") VALUES (%s, %s);'
        acao = f"Realizou a Venda #{id_gerado} - Valor: R$ {venda.valor_total} (Caixa #{venda.id_sessao_caixa})"
        cursor.execute(sql_log, (venda.id_usuario, acao))
        
        conn.commit()
        return {"status": "sucesso", "id_venda": id_gerado}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

# -------------------------------------------------------------------
# ROTA 5: REGISTRAR ITEM DA VENDA (COM TRAVA DE STOCK)
# -------------------------------------------------------------------
@router.post("/itens/")
def registrar_item_venda(item: NovoItemVenda):
    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor()
        
        cursor.execute('SELECT quantidade_estoque, nome FROM "produto" WHERE id = %s;', (item.id_produto,))
        produto = cursor.fetchone()
        
        if not produto:
            raise HTTPException(status_code=404, detail="Produto não encontrado.")
            
        estoque_atual = produto[0]
        nome_produto = produto[1]
        
        if estoque_atual < item.quantidade:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para '{nome_produto}'. Restam apenas {estoque_atual} unidades.")
        
        # O INSERT do item da venda
        sql_insert = """
            INSERT INTO "item_venda" ("id_venda", "id_produto", "quantidade", "valor_unitario")
            VALUES (%s, %s, %s, %s) RETURNING id;
        """
        cursor.execute(sql_insert, (item.id_venda, item.id_produto, item.quantidade, item.valor_unitario))
        id_item = cursor.fetchone()[0]
        
        conn.commit()
        return {"status": "sucesso", "mensagem": "Item adicionado e stock reduzido!", "id_item": id_item}
    except HTTPException:
        raise
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

# -------------------------------------------------------------------
# ROTA 6: CADASTRAR CLIENTE RÁPIDO (Via PDV)
# -------------------------------------------------------------------
@router.post("/clientes/")
def cadastrar_cliente_pdv(cliente: NovoCliente):
    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor()
        
        # Se o CPF/CNPJ vier vazio do React, transformamos em NULL para não dar erro de UNIQUE
        cpf_cnpj_formatado = cliente.cpf_cnpj if cliente.cpf_cnpj else None
        
        sql = 'INSERT INTO "cliente" ("nome", "cpf_cnpj") VALUES (%s, %s) RETURNING id;'
        cursor.execute(sql, (cliente.nome, cpf_cnpj_formatado))
        id_gerado = cursor.fetchone()[0]
        
        conn.commit()
        return {"status": "sucesso", "id_cliente": id_gerado, "nome": cliente.nome}
    except Exception as e:
        if conn: conn.rollback()
        # Captura erro de CPF/CNPJ duplicado
        if "unique constraint" in str(e).lower():
            raise HTTPException(status_code=400, detail="Este CPF/CNPJ já está cadastrado.")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()