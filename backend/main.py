from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importa as nossas "gavetas" de rotas
from rotas import produtos, fornecedores, usuarios, caixa, vendas, compras

app = FastAPI(
    title="API de Gestão Comercial",
    description="Sistema de retaguarda para controle de vendas, estoque e fluxo de caixa.",
    version="1.0.0"
)

# Libera o acesso para o React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em produção, substitua "*" pela URL do seu site React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pluga os módulos no aplicativo principal
app.include_router(produtos.router)
app.include_router(fornecedores.router)
app.include_router(usuarios.router)
app.include_router(caixa.router)
app.include_router(vendas.router)
app.include_router(compras.router)

@app.get("/", tags=["Saúde da API"])
def pagina_inicial():
    return {"mensagem": "API Modularizada e rodando perfeitamente! Acesse /docs"}