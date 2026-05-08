# Gerenciador Comercial: Estoque e Fluxo de Caixa

> **Trabalho Acadêmico:** Disciplina de Laboratório de Banco de Dados Comercial.

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)

Uma solução full-stack moderna para gestão empresarial, focada na automação de processos de frente de caixa (PDV) e controle rigoroso de inventário. O projeto utiliza uma arquitetura que prioriza a **integridade de dados diretamente no motor do Banco de Dados**.

---

##  Destaques do Projeto

* ** PDV Inteligente:** Registro de vendas com baixa de estoque atômica e processamento de pagamentos.
* ** Inteligência em Banco de Dados:** Uso extensivo de `Triggers`, `Procedures` e `Views` para garantir que as regras de negócio sejam respeitadas independentemente do cliente.
* **Auditoria Automática:** Sistema de logs nativo que monitora cada alteração de estoque, registrando o "quem", "quando" e "o quê".
* **Gestão Financeira:** Controle de abertura/fechamento de caixa com cálculo automático de saldo e movimentações.

---

## Stack Tecnológica

### **Frontend**
* **React + Vite:** Interface reativa, rápida e componentizada.
* **CSS Modules:** Estilização isolada e responsiva.

### **Backend (API)**
* **Python + FastAPI:** Performance de alto nível e documentação automática (Swagger).
* **Psycopg2:** Comunicação robusta e transacional com o PostgreSQL.
* **Pydantic:** Validação rigorosa de esquemas de dados.

### **Banco de Dados & Infra**
* **PostgreSQL (Supabase):** Motor relacional com suporte a PL/pgSQL.
* **Render:** Deploy contínuo da API e do site estático.

---

## Arquitetura de Dados

O diferencial técnico deste projeto é a delegação de tarefas críticas para o **PostgreSQL**:

| Recurso | Descrição |
| :--- | :--- |
| **Triggers** | Gerenciam o recálculo de totais de venda e compras, além da redução imediata de estoque após o `INSERT` de itens. |
| **Views** | Consolidam relatórios financeiros complexos e resumos de estoque em tempo real. |
| **Indexes** | Otimizam as buscas textuais por nome de produto e filtros por períodos de data. |

---

## 📁 Estrutura de Pastas

```text
├── backend/
│   ├── rotas/           # Endpoints divididos por domínio (vendas, caixa, etc.)
│   ├── database.py      # Gestão de pool de conexões
│   └── main.py          # Inicialização e configuração do FastAPI
├── meu_frontend/
│   ├── src/pages/       # Componentes de página (Home, Caixa, Estoque)
│   ├── src/components/  # Elementos reutilizáveis (Menu, Tabelas)
│   └── src/styles/      # Arquivos de estilização CSS
├── sql/
│   ├── Triggers.sql     # Lógica de automação nativa
│   ├── Views.sql        # Consultas gerenciais consolidadas
│   └── Indexs.sql       # Estruturas de otimização de performance
└── Dicionário_de_dados.xlsx

## 🚀 Como Executar

### 1. Banco de Dados
Certifique-se de ter uma instância do PostgreSQL ativa. Execute os scripts da pasta `/sql` na ordem:
1. Tabelas estruturais.
2. `Views.sql`.
3. `Triggers.sql`.
4. `Indexs.sql`.

### 2. Backend
```bash
cd backend
python -m venv venv
# Ative o venv e instale:
pip install -r requirements.txt
# Configure a DATABASE_URL no seu .env
uvicorn main:app --reload

### 3. Frontend
```bash
cd meu_frontend
npm install
# Configure a VITE_API_URL no seu .env
npm run dev

---

## 🔗 Links Úteis

* **Repositório:** [https://github.com/luizscalfi/projeto_laboratorio_bd_comercial](https://github.com/luizscalfi/projeto_laboratorio_bd_comercial)
* **Aplicação em Produção:** [Link do seu Frontend no Render]
* **Documentação da API (Swagger):** [https://seu-backend.onrender.com/docs](https://seu-backend.onrender.com/docs)

---

## 👥 Autores

* **Diego Rafael de Oliveira** - *Desenvolvimento e Modelagem*
* **Luiz Carlos Scalfi** - *Desenvolvimento e Arquitetura de Nuvem*
