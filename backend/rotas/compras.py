from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import obter_conexao
from psycopg2.extras import RealDictCursor

router = APIRouter(prefix="/compras", tags=["Fornecedores e Compras"])

class NovaCompra(BaseModel):
    id_fornecedor: int
    id_usuario: int  # Campo obrigatório para a auditoria

class NovoItemCompra(BaseModel):
    id_compra: int
    id_produto: int
    quantidade: int
    valor_unitario: float

# -------------------------------------------------------------------
# ROTA 1: LISTAR HISTÓRICO
# -------------------------------------------------------------------
@router.get("/")
def listar_historico_compras():
    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        sql = """
            SELECT c.id, c.valor_total, f.razao_social as nome_fornecedor
            FROM "compra" c
            JOIN "fornecedor" f ON c.id_fornecedor = f.id
            ORDER BY c.id DESC;
        """
        cursor.execute(sql)
        return {"compras": cursor.fetchall()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            cursor.close()
            conn.close()

# -------------------------------------------------------------------
# ROTA 2: LISTAR ITENS DA COMPRA
# -------------------------------------------------------------------
@router.get("/{id_compra}/itens")
def listar_itens_compra(id_compra: int):
    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        sql = """
            SELECT ic.id, ic.quantidade, ic.valor_unitario, p.nome as nome_produto 
            FROM "item_compra" ic
            JOIN "produto" p ON ic.id_produto = p.id
            WHERE ic.id_compra = %s;
        """
        cursor.execute(sql, (id_compra,))
        return {"itens": cursor.fetchall()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            cursor.close()
            conn.close()

# -------------------------------------------------------------------
# ROTA 3: INICIAR COMPRA (Com Registo de Auditoria)
# -------------------------------------------------------------------
@router.post("/")
def iniciar_compra(compra: NovaCompra):
    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor()
        
        # 1. Cria a nota de compra
        sql = 'INSERT INTO "compra" ("id_fornecedor", "valor_total") VALUES (%s, 0.00) RETURNING id;'
        cursor.execute(sql, (compra.id_fornecedor,))
        id_gerado = cursor.fetchone()[0]
        
        # 2. Grava o LOG DE AUDITORIA com o utilizador real
        sql_log = 'INSERT INTO "log_auditoria" ("id_usuario", "acao") VALUES (%s, %s);'
        acao = f"Iniciou a Nota de Compra #{id_gerado}"
        cursor.execute(sql_log, (compra.id_usuario, acao))
        
        conn.commit()
        return {"status": "sucesso", "id_compra": id_gerado}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            cursor.close()
            conn.close()

# -------------------------------------------------------------------
# ROTA 4: REGISTRAR ITEM
# -------------------------------------------------------------------
@router.post("/itens/")
def registrar_item_compra(item: NovoItemCompra):
    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor()
        sql = """
            INSERT INTO "item_compra" ("id_compra", "id_produto", "quantidade", "valor_unitario")
            VALUES (%s, %s, %s, %s) RETURNING id;
        """
        cursor.execute(sql, (item.id_compra, item.id_produto, item.quantidade, item.valor_unitario))
        id_item = cursor.fetchone()[0]
        conn.commit()
        return {"status": "sucesso", "mensagem": "Item registado!", "id_item": id_item}
    except Exception as e:
        if conn: conn.rollback()
        if "Sem sessão de caixa aberta" in str(e):
            raise HTTPException(status_code=400, detail="Erro: Caixa fechado.")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            cursor.close()
            conn.close()
            
# -------------------------------------------------------------------
# ROTA 5: DELETAR COMPRA EM CASCATA (Com Registo de Auditoria)
# -------------------------------------------------------------------
@router.delete("/{id_compra}")
def cancelar_compra(id_compra: int, id_usuario: int):
    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM "movimentacao_caixa" WHERE id_compra = %s;', (id_compra,))
        cursor.execute('DELETE FROM "item_compra" WHERE id_compra = %s;', (id_compra,))
        cursor.execute('DELETE FROM "compra" WHERE id = %s RETURNING id;', (id_compra,))
        
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Compra não encontrada.")
            
        # Grava o LOG DE AUDITORIA do estorno
        sql_log = 'INSERT INTO "log_auditoria" ("id_usuario", "acao") VALUES (%s, %s);'
        acao = f"Estornou e cancelou a Compra #{id_compra} (Itens e Financeiro revertidos)"
        cursor.execute(sql_log, (id_usuario, acao))
            
        conn.commit()
        return {"status": "sucesso", "mensagem": "Compra cancelada e excluída com sucesso!"}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            cursor.close()
            conn.close()