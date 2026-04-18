import os
import secrets
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.proxy_headers import ProxyHeadersMiddleware

# Importação das rotas (Certifica-te que os ficheiros existem na pasta /rotas)
from rotas import usuarios, caixa, compras, vendas

# 1. INICIALIZAÇÃO DO APP
# Desativamos as URLs padrão para que ninguém aceda sem senha
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)

# 2. CONFIGURAÇÃO PARA O RENDER (Proxy)
# Isso resolve o problema da API tentar redirecionar para 'localhost' em produção
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

# 3. CONFIGURAÇÃO DO CORS
# Permite que o teu Frontend (React) consiga fazer requisições para este Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em produção real, substitui pelo domínio do teu site
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. SEGURANÇA DA DOCUMENTAÇÃO (HTTP Basic Auth)
security = HTTPBasic()

def autenticar_docs(credentials: HTTPBasicCredentials = Depends(security)):
    # Puxa as credenciais do teu ficheiro .env
    USUARIO_DOCS = os.getenv("DOCS_USER", "admin")
    SENHA_DOCS = os.getenv("DOCS_PASS", "admin123")
    
    is_user_ok = secrets.compare_digest(credentials.username, USUARIO_DOCS)
    is_pass_ok = secrets.compare_digest(credentials.password, SENHA_DOCS)

    if not (is_user_ok and is_pass_ok):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Acesso negado. Credenciais incorretas.",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

# 5. ROTAS DA DOCUMENTAÇÃO PROTEGIDAS
@app.get("/docs", include_in_schema=False)
def custom_swagger_ui(username: str = Depends(autenticar_docs)):
    return get_swagger_ui_html(
        openapi_url="/openapi.json", 
        title="Sistema Comercial - Documentação"
    )

@app.get("/openapi.json", include_in_schema=False)
def custom_openapi(username: str = Depends(autenticar_docs)):
    if app.openapi_schema:
        return app.openapi_schema
    
    # Força a URL do Render para o Swagger não apontar para localhost
    render_url = os.getenv("RENDER_EXTERNAL_URL", "http://localhost:8000")
    
    schema = get_openapi(
        title="API Gestão Comercial",
        version="1.0.0",
        description="Documentação técnica das rotas do sistema.",
        routes=app.routes,
        servers=[{"url": render_url}]
    )
    app.openapi_schema = schema
    return schema

# 6. INCLUSÃO DOS MÓDULOS (ROUTERS)
app.include_router(usuarios.router)
app.include_router(caixa.router)
app.include_router(compras.router)
app.include_router(vendas.router)

@app.get("/")
def raiz():
    return {"status": "online", "mensagem": "Backend de Gestão Comercial Ativo"}