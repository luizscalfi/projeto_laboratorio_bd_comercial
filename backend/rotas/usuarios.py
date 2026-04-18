import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor
import psycopg2
from database import obter_conexao

router = APIRouter(prefix="/usuarios", tags=["Segurança e Autenticação"])

# ==========================================
# MODELOS DE DADOS (Pydantic)
# ==========================================
class NovoUsuario(BaseModel):
    id_perfil: int
    nome: str
    email: str
    senha: str

class LoginRequest(BaseModel):
    email: str
    senha: str

class AlterarSenha(BaseModel):
    id_usuario: int
    senha_mestra: str  # <--- Agora recebe a senha mestra
    nova_senha: str

# ==========================================
# ROTAS DO SISTEMA
# ==========================================

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

# ---------------------------------------------------------
# ROTA: Alterar Senha (com verificação da SENHA MESTRA via .env)
# ---------------------------------------------------------
@router.put("/alterar-senha/")
def alterar_senha(dados: AlterarSenha):
    conn = None
    try:
        # 1. Puxa a senha do .env (Se não achar, usa 'admin123' como fallback de segurança)
        SENHA_MESTRA_SISTEMA = os.getenv("SENHA_MESTRA_TROCA", "admin123")

        # 2. Verifica se a senha mestra enviada pelo React bate com a do sistema
        if dados.senha_mestra != SENHA_MESTRA_SISTEMA:
            raise HTTPException(status_code=403, detail="A senha de autorização (Senha Mestra) está incorreta.")

        conn = obter_conexao()
        cursor = conn.cursor()

        # 3. Gera o novo hash e atualiza no banco para o usuário selecionado
        sql_update = """
            UPDATE "usuario" 
            SET senha_hash = crypt(%s, gen_salt('bf')) 
            WHERE id = %s;
        """
        cursor.execute(sql_update, (dados.nova_senha, dados.id_usuario))

        # Confirma se o update realmente alterou alguma linha (se o usuário existe)
        if cursor.rowcount == 0:
             raise HTTPException(status_code=404, detail="Usuário não encontrado no banco de dados.")

        # 4. Registra na Auditoria
        sql_log = 'INSERT INTO "log_auditoria" ("id_usuario", "acao") VALUES (%s, %s);'
        acao = "Alterou a senha de acesso utilizando a autorização Mestra"
        cursor.execute(sql_log, (dados.id_usuario, acao))

        conn.commit()
        return {"status": "sucesso", "mensagem": "Senha alterada com sucesso!"}

    except HTTPException:
        raise
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            cursor.close()
            conn.close()