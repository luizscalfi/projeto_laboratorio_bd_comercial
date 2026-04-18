import os
import secrets
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.middleware.cors import CORSMiddleware

# 1. Importe as suas rotas aqui
from rotas import compras, vendas, caixa, usuarios # adicione as outras (produtos, fornecedores, etc)

# 2. INICIALIZA O APP DESLIGANDO A DOC PADRÃO
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)

# ---------------------------------------------------------
# CONFIGURAÇÃO DE SEGURANÇA DA DOCUMENTAÇÃO (Cadeado do /docs)
# ---------------------------------------------------------
security = HTTPBasic()

def autenticar_docs(credentials: HTTPBasicCredentials = Depends(security)):
    # Puxa do .env (Se não existir, usa um valor padrão de emergência)
    USUARIO_CORRETO = os.getenv("DOCS_USER", "admin")
    SENHA_CORRETA = os.getenv("DOCS_PASS", "admin")

    # Usamos secrets.compare_digest para evitar ataques de "timing" (Medida de segurança avançada!)
    is_user_ok = secrets.compare_digest(credentials.username, USUARIO_CORRETO)
    is_pass_ok = secrets.compare_digest(credentials.password, SENHA_CORRETA)

    if not (is_user_ok and is_pass_ok):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Acesso negado à documentação.",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

# Rotas recriadas COM a trava de segurança
@app.get("/docs", include_in_schema=False)
def custom_swagger_ui(username: str = Depends(autenticar_docs)):
    return get_swagger_ui_html(openapi_url="/openapi.json", title="Documentação da API")

@app.get("/openapi.json", include_in_schema=False)
def custom_openapi(username: str = Depends(autenticar_docs)):
    return get_openapi(title="API Gestão Comercial", version="1.0.0", routes=app.routes)

# ---------------------------------------------------------
# CONFIGURAÇÃO DO CORS (Para o React conseguir conversar)
# ---------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Na hora de subir pro servidor real, mude o "*" para o domínio do seu React!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# INCLUSÃO DAS SUAS ROTAS NO APP
# ---------------------------------------------------------
app.include_router(usuarios.router)
app.include_router(caixa.router)
app.include_router(compras.router)
app.include_router(vendas.router)
# app.include_router(produtos.router) ... e assim por diante