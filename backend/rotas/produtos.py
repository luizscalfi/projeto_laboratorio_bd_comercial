from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import obter_conexao
from psycopg2.extras import RealDictCursor


router = APIRouter(prefix="/produtos", tags=["Estoque e Produtos"])

class ProdutoBase(BaseModel):
    nome: str
    id_categoria: int
    preco_custo: float
    preco_venda: float

@router.get("/")
def listar_produtos():
    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        sql = """
            SELECT p.id, p.nome, p.id_categoria, c.nome as nome_categoria, 
                   p.preco_custo, p.preco_venda, p.quantidade_estoque
            FROM "produto" p
            LEFT JOIN "categoria" c ON p.id_categoria = c.id
            ORDER BY p.nome;
        """
        cursor.execute(sql)
        return {"produtos": cursor.fetchall()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@router.delete("/{id_produto}")
def deletar_produto(id_produto: int):
    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor()
        
        # Validação extra no backend: Não deleta se houver estoque
        cursor.execute('SELECT quantidade_estoque FROM "produto" WHERE id = %s;', (id_produto,))
        produto = cursor.fetchone()
        
        if not produto:
            raise HTTPException(status_code=404, detail="Produto não encontrado.")
        
        if produto[0] > 0:
            raise HTTPException(status_code=400, detail="Não é possível excluir produtos com estoque positivo.")

        cursor.execute('DELETE FROM "produto" WHERE id = %s RETURNING id;', (id_produto,))
        conn.commit()
        return {"status": "sucesso", "mensagem": "Produto excluído."}
    except HTTPException:
        raise
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

# -------------------------------------------------------------------
# ROTA: BUSCAR CATEGORIAS (Necessária para o cadastro rápido em Compras)
# -------------------------------------------------------------------
@router.get("/categorias/")
def listar_categorias():
    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute('SELECT id, nome FROM "categoria" ORDER BY nome;')
        return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            cursor.close()
            conn.close()

# -------------------------------------------------------------------
# ROTA: CRIAR PRODUTO NOVO (Usada pelo Atalho da Tela de Compras)
# -------------------------------------------------------------------
@router.post("/")
def criar_produto(dados: ProdutoBase):
    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor()
        
        sql = """
            INSERT INTO "produto" (nome, id_categoria, preco_custo, preco_venda, quantidade_estoque)
            VALUES (%s, %s, %s, %s, 0) RETURNING id;
        """
        cursor.execute(sql, (dados.nome, dados.id_categoria, dados.preco_custo, dados.preco_venda))
        novo_id = cursor.fetchone()[0]
        conn.commit()
        
        return {"status": "sucesso", "mensagem": "Produto cadastrado!", "id": novo_id}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            cursor.close()
            conn.close()

# ---------------------------------------------------------
# NOVA ROTA: BUSCAR ITENS DE UMA COMPRA ESPECÍFICA
# ---------------------------------------------------------
@router.get("/{id_compra}/itens")
def listar_itens_compra(id_compra: int):
    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Faz um JOIN para pegar o nome do produto junto com a quantidade
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