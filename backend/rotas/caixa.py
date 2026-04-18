from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor
from database import obter_conexao

router = APIRouter(prefix="/caixa", tags=["Fluxo de Caixa"])

class AberturaCaixa(BaseModel):
    id_caixa: int
    id_usuario: int
    valor_abertura: float

class FechamentoCaixa(BaseModel):
    id_sessao_caixa: int

@router.post("/abrir/")
def abrir_caixa(dados: AberturaCaixa):
    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Verifica se já está aberto e traz o NOME do operador
        sql_verifica = """
            SELECT s.id, u.nome as operador
            FROM "sessao_caixa" s
            JOIN "usuario" u ON s.id_usuario = u.id
            WHERE s.id_caixa = %s AND s.data_fechamento IS NULL;
        """
        cursor.execute(sql_verifica, (dados.id_caixa,))
        caixa_ocupado = cursor.fetchone()

        if caixa_ocupado:
            raise HTTPException(
                status_code=400, 
                detail=f"Este terminal já está aberto e sendo operado por: {caixa_ocupado['operador']}."
            )

        # Se estiver livre, abre a sessão
        sql_abrir = """
            INSERT INTO "sessao_caixa" ("id_caixa", "id_usuario", "valor_abertura")
            VALUES (%s, %s, %s) RETURNING id, data_abertura;
        """
        cursor.execute(sql_abrir, (dados.id_caixa, dados.id_usuario, dados.valor_abertura))
        nova_sessao = cursor.fetchone()
        
        # Regista na Auditoria
        sql_log = 'INSERT INTO "log_auditoria" ("id_usuario", "acao") VALUES (%s, %s);'
        acao = f"Abriu o Caixa (Terminal {dados.id_caixa}) com troco inicial de R$ {dados.valor_abertura}"
        cursor.execute(sql_log, (dados.id_usuario, acao))
        
        conn.commit()
        
        return {"status": "sucesso", "mensagem": "Caixa aberto com sucesso!", "sessao": nova_sessao}
    except HTTPException:
        raise
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            cursor.close()
            conn.close()

@router.put("/fechar/")
def fechar_caixa(dados: FechamentoCaixa):
    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        sql_fechar = 'UPDATE "sessao_caixa" SET data_fechamento = CURRENT_TIMESTAMP WHERE id = %s AND data_fechamento IS NULL RETURNING id, id_caixa, id_usuario;'
        cursor.execute(sql_fechar, (dados.id_sessao_caixa,))
        sessao_fechada = cursor.fetchone()
        
        if not sessao_fechada:
            raise HTTPException(status_code=400, detail="Sessão não encontrada ou já fechada.")

        # Regista na Auditoria
        sql_log = 'INSERT INTO "log_auditoria" ("id_usuario", "acao") VALUES (%s, %s);'
        acao = f"Fechou e encerrou o expediente do Caixa (Sessão #{sessao_fechada['id']})"
        cursor.execute(sql_log, (sessao_fechada['id_usuario'], acao))

        try:
            cursor.execute('SELECT * FROM vw_fechamento_caixa WHERE id_sessao = %s;', (dados.id_sessao_caixa,))
            relatorio = cursor.fetchone()
        except:
            relatorio = {"mensagem": "Relatório resumido: Caixa fechado com sucesso."}
            
        conn.commit()
        
        return {"status": "sucesso", "mensagem": "Expediente encerrado e caixa fechado!", "relatorio": relatorio}
    except HTTPException:
        raise
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            cursor.close()
            conn.close()

# ---------------------------------------------------------
# ROTA: Status do Caixa (Agora com Dashboard Financeiro!)
# ---------------------------------------------------------
@router.get("/status/{id_caixa}")
def verificar_status_caixa(id_caixa: int):
    conn = None
    try:
        conn = obter_conexao()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Verifica se tem alguma sessão aberta agora e puxa o valor_abertura
        sql_ativa = """
            SELECT s.id, s.id_caixa, s.data_abertura, s.valor_abertura, u.nome as operador
            FROM "sessao_caixa" s
            JOIN "usuario" u ON s.id_usuario = u.id
            WHERE s.id_caixa = %s AND s.data_fechamento IS NULL;
        """
        cursor.execute(sql_ativa, (id_caixa,))
        sessao = cursor.fetchone()

        if sessao:
            # 1.1 Se estiver aberta, calcula Entradas e Saídas em Tempo Real
            sql_mov = """
                SELECT 
                    COALESCE(SUM(CASE WHEN tipo_movimento = 'ENTRADA' THEN valor ELSE 0 END), 0) AS total_entradas,
                    COALESCE(SUM(CASE WHEN tipo_movimento = 'SAIDA' THEN valor ELSE 0 END), 0) AS total_saidas
                FROM "movimentacao_caixa"
                WHERE id_sessao_caixa = %s;
            """
            cursor.execute(sql_mov, (sessao['id'],))
            movs = cursor.fetchone()
            
            # Adiciona os totais ao pacote que vai para o React
            sessao['total_entradas'] = movs['total_entradas']
            sessao['total_saidas'] = movs['total_saidas']
            sessao['saldo_atual'] = sessao['valor_abertura'] + movs['total_entradas'] - movs['total_saidas']

            return {"sessao_ativa": True, "sessao": sessao, "ultimo_saldo": 0}
            
        # 2. Se estiver FECHADO, calcula o saldo final da ÚLTIMA sessão que existiu
        sql_ultimo_saldo = """
            SELECT (sc.valor_abertura + 
                 COALESCE(SUM(CASE WHEN mc.tipo_movimento = 'ENTRADA' THEN mc.valor ELSE 0 END), 0) - 
                 COALESCE(SUM(CASE WHEN mc.tipo_movimento = 'SAIDA' THEN mc.valor ELSE 0 END), 0)) AS saldo_final
            FROM "sessao_caixa" sc
            LEFT JOIN "movimentacao_caixa" mc ON sc.id = mc.id_sessao_caixa
            WHERE sc.id_caixa = %s AND sc.data_fechamento IS NOT NULL
            GROUP BY sc.id, sc.valor_abertura
            ORDER BY sc.id DESC LIMIT 1;
        """
        cursor.execute(sql_ultimo_saldo, (id_caixa,))
        ultima = cursor.fetchone()
        
        saldo_sugerido = ultima['saldo_final'] if ultima else 0.00
        return {"sessao_ativa": False, "sessao": None, "ultimo_saldo": float(saldo_sugerido)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            cursor.close()
            conn.close()