from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor
import psycopg2
from database import obter_conexao

router = APIRouter(prefix="/fornecedores", tags=["Fornecedores e Compras"])

class NovoFornecedor(BaseModel):
    razao_social: str
    cnpj: str

class VinculoProdutoFornecedor(BaseModel):
    id_produto: int
    id_fornecedor: int

@router.post("/")
def cadastrar_fornecedor(fornecedor: NovoFornecedor):
    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor()
        sql = 'INSERT INTO "fornecedor" ("razao_social", "cnpj") VALUES (%s, %s) RETURNING id;'
        cursor.execute(sql, (fornecedor.razao_social, fornecedor.cnpj))
        id_gerado = cursor.fetchone()[0]
        conn.commit()
        return {"status": "sucesso", "id_fornecedor": id_gerado}
    except psycopg2.errors.UniqueViolation:
        if conn: conn.rollback()
        raise HTTPException(status_code=400, detail="Já existe um fornecedor cadastrado com este CNPJ.")
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            cursor.close()
            conn.close()

@router.post("/vincular-produto/")
def vincular_produto_fornecedor(vinculo: VinculoProdutoFornecedor):
    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor()
        sql = 'INSERT INTO "produto_fornecedor" ("id_produto", "id_fornecedor") VALUES (%s, %s);'
        cursor.execute(sql, (vinculo.id_produto, vinculo.id_fornecedor))
        conn.commit()
        return {"status": "sucesso", "mensagem": "Produto vinculado ao fornecedor!"}
    except psycopg2.errors.UniqueViolation:
        if conn: conn.rollback()
        raise HTTPException(status_code=400, detail="Este produto já está vinculado a este fornecedor.")
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            cursor.close()
            conn.close()

@router.get("/{id_fornecedor}/produtos/")
def listar_produtos_do_fornecedor(id_fornecedor: int):
    try:
        conn = obter_conexao()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        sql = """
            SELECT p.id, p.nome, p.preco_custo, p.quantidade_estoque
            FROM "produto" p
            INNER JOIN "produto_fornecedor" pf ON p.id = pf.id_produto
            WHERE pf.id_fornecedor = %s;
        """
        cursor.execute(sql, (id_fornecedor,))
        catalogo = cursor.fetchall()
        return {"status": "sucesso", "catalogo": catalogo}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            cursor.close()
            conn.close()
            
@router.delete("/{id_fornecedor}")
def deletar_fornecedor(id_fornecedor: int):
    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM "fornecedor" WHERE id = %s RETURNING id;', (id_fornecedor,))
        deletado = cursor.fetchone()
        
        if not deletado:
            raise HTTPException(status_code=404, detail="Fornecedor não encontrado.")
            
        conn.commit()
        return {"status": "sucesso", "mensagem": "Fornecedor excluído com sucesso!"}
    except Exception as e:
        if conn: conn.rollback()
        if "foreign key" in str(e).lower():
            raise HTTPException(status_code=400, detail="Não é possível excluir um fornecedor que possui histórico de compras.")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            cursor.close()
            conn.close()
            
@router.get("/")
def listar_todos_fornecedores():
    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute('SELECT * FROM "fornecedor" ORDER BY razao_social;')
        return {"fornecedores": cursor.fetchall()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            cursor.close()
            conn.close()