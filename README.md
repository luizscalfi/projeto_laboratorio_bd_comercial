Gerenciador Comercial: Estoque e Fluxo de Caixa
Solução Full-Stack de gestão empresarial desenhada para otimizar o controle de inventário e movimentações financeiras de pequenas empresas. O projeto destaca-se pela inteligência nativa em banco de dados, utilizando gatilhos e visões para garantir a integridade absoluta dos dados.

Funcionalidades Principais
Frente de Caixa (PDV): Registro de vendas com baixa automática de estoque e atualização de saldo em tempo real.

Gestão de Inventário: Cadastro de produtos, categorias e fornecedores com histórico de compras.

Controle de Caixa: Abertura e fechamento de sessões com cálculo automatizado de entradas e saídas.

Auditoria de Estoque: Log automático de todas as alterações de saldo para prevenção de perdas.

Segurança: Autenticação de usuários com hash de senhas e validação de "Senha Mestra" para operações críticas.

Arquitetura Técnica
O sistema segue o modelo cliente-servidor moderno, dividido em três camadas principais:

1. Banco de Dados (PostgreSQL + Supabase)
A inteligência de negócio reside no motor do banco de dados através de PL/pgSQL:

Triggers: Automatizam a atualização do cabeçalho de vendas, deduções de estoque e logs de auditoria.

Views: Consolidam relatórios complexos, como o fechamento de caixa e resumos de estoque, simplificando as consultas da API.

Indexes: Otimizam buscas textuais e filtros temporais em grandes volumes de dados.

2. Backend (Python + FastAPI)
API RESTful de alta performance focada em segurança e agilidade:

Validação de dados com Pydantic.

Conexão assíncrona e segura com o banco de dados.

Modularização por domínios (Vendas, Compras, Usuários, Caixa).

3. Frontend (React + Vite)
Interface reativa e intuitiva:

Consumo dinâmico da API com tratamento de erros.

Navegação fluida e componentes reutilizáveis.

Configuração dinâmica via variáveis de ambiente (.env).

Estrutura do Projeto
Bash
├── backend/
│   ├── rotas/           # Endpoints da API (Vendas, Produtos, etc.)
│   ├── database.py      # Configuração de conexão
│   └── main.py          # Ponto de entrada do FastAPI
├── meu_frontend/
│   ├── src/pages/       # Telas do sistema (Caixa, Estoque, etc.)
│   └── src/components/  # Componentes de interface
├── sql/
│   ├── Triggers.sql     # Funções e Gatilhos automáticos
│   ├── Views.sql        # Visões gerenciais
│   └── Indexs.sql       # Otimizações de performance
└── Dicionário_de_dados.xlsx
Como Executar Localmente
Pré-requisitos
Python 3.10+

Node.js 18+

Banco PostgreSQL (ou instância no Supabase)

1. Configure o Banco de Dados
Execute os scripts SQL das pastas /sql na ordem: Tabelas -> Views -> Triggers -> Indexes.

2. Configure o Backend
Bash
cd backend
python -m venv venv
source venv/bin/activate  # ou venv\Scripts\activate no Windows
pip install -r requirements.txt
# Crie um .env com sua DATABASE_URL
uvicorn main:app --reload
3. Configure o Frontend
Bash
cd meu_frontend
npm install
# Crie um .env com VITE_API_URL=http://127.0.0.1:8000
npm run dev
☁️ Deploy e Nuvem
O projeto está configurado para integração contínua:

Frontend: Hospedado no Render.

Backend: Hospedado no Render Web Services.

Database: Gerenciado pelo Supabase.

Autores
Diego Rafael de Oliveira

Luiz Carlos Scalfi

Trabalho desenvolvido para a disciplina de Laboratório de Banco de Dados Comercial.
