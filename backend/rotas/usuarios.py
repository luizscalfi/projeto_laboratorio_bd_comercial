from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor
import psycopg2
from database import obter_conexao

router = APIRouter(prefix="/usuarios", tags=["Segurança e Autenticação"])

class NovoUsuario(BaseModel):
    id_perfil: int
    nome: str
    email: str
    senha: str

class LoginRequest(BaseModel):
    email: str
    senha: str

@router.post("/")
def criar_usuario(usuario: NovoUsuario):
    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor()
        sql = """
            INSERT INTO "usuario" ("id_perfil", "nome", "email", "senha_hash")
            VALUES (%s, %s, %s, crypt(%s, gen_salt('bf'))) RETURNING id;
        """
        cursor.execute(sql, (usuario.id_perfil, usuario.nome, usuario.email, usuario.senha))
        id_gerado = cursor.fetchone()[0]
        conn.commit()
        return {"status": "sucesso", "mensagem": "Usuário cadastrado com sucesso!", "id_usuario": id_gerado}
    except psycopg2.errors.UniqueViolation:
        if conn: conn.rollback()
        raise HTTPException(status_code=400, detail="Este email já está cadastrado no sistema.")
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            cursor.close()
            conn.close()

@router.post("/login/")
def fazer_login(credenciais: LoginRequest):
    try:
        conn = obter_conexao()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        sql = """
            SELECT id, nome, id_perfil, email, status 
            FROM "usuario" 
            WHERE email = %s AND senha_hash = crypt(%s, senha_hash);
        """
        cursor.execute(sql, (credenciais.email, credenciais.senha))
        usuario = cursor.fetchone()
        
        if not usuario:
            raise HTTPException(status_code=401, detail="Email ou senha incorretos.")
        if not usuario['status']:
            raise HTTPException(status_code=403, detail="Usuário bloqueado ou inativo.")
            
        return {"status": "sucesso", "mensagem": f"Bem-vindo(a), {usuario['nome']}!", "usuario": usuario}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'conn' in locals() and conn:
            cursor.close()
            conn.close()