CREATE TABLE "perfil_acesso" (
  "id" SERIAL PRIMARY KEY,
  "nome" VARCHAR(50) NOT NULL
);

CREATE TABLE "usuario" (
  "id" SERIAL PRIMARY KEY,
  "id_perfil" INTEGER NOT NULL,
  "nome" VARCHAR(100) NOT NULL,
  "email" VARCHAR(100) UNIQUE NOT NULL,
  "senha_hash" VARCHAR(255) NOT NULL,
  "status" BOOLEAN DEFAULT TRUE
);

CREATE TABLE "log_auditoria" (
  "id" SERIAL PRIMARY KEY,
  "id_usuario" INTEGER,
  "acao" VARCHAR(255) NOT NULL,
  "data_hora" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "caixa" (
  "id" SERIAL PRIMARY KEY,
  "nome" VARCHAR(50) NOT NULL,
  "status_ativo" BOOLEAN DEFAULT TRUE
);

CREATE TABLE "sessao_caixa" (
  "id" SERIAL PRIMARY KEY,
  "id_caixa" INTEGER NOT NULL,
  "id_usuario" INTEGER NOT NULL,
  "data_abertura" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "data_fechamento" TIMESTAMP,
  "valor_abertura" DECIMAL(10,2) NOT NULL DEFAULT 0.00
);

CREATE TABLE "despesa" (
  "id" SERIAL PRIMARY KEY,
  "descricao" VARCHAR(255) NOT NULL,
  "valor" DECIMAL(10,2) NOT NULL,
  "data_despesa" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "categoria" (
  "id" SERIAL PRIMARY KEY,
  "nome" VARCHAR(100) NOT NULL
);

CREATE TABLE "produto" (
  "id" SERIAL PRIMARY KEY,
  "id_categoria" INTEGER NOT NULL,
  "nome" VARCHAR(150) NOT NULL,
  "quantidade_estoque" INTEGER DEFAULT 0,
  "preco_custo" DECIMAL(10,2) NOT NULL,
  "preco_venda" DECIMAL(10,2) NOT NULL
);

CREATE TABLE "fornecedor" (
  "id" SERIAL PRIMARY KEY,
  "razao_social" VARCHAR(150) NOT NULL,
  "cnpj" VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE "produto_fornecedor" (
  "id_produto" INTEGER,
  "id_fornecedor" INTEGER,
  PRIMARY KEY ("id_produto", "id_fornecedor")
);

CREATE TABLE "compra" (
  "id" SERIAL PRIMARY KEY,
  "id_fornecedor" INTEGER NOT NULL,
  "data_compra" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "valor_total" DECIMAL(10,2) NOT NULL
);

CREATE TABLE "item_compra" (
  "id" SERIAL PRIMARY KEY,
  "id_compra" INTEGER NOT NULL,
  "id_produto" INTEGER NOT NULL,
  "quantidade" INTEGER NOT NULL,
  "valor_unitario" DECIMAL(10,2) NOT NULL
);

CREATE TABLE "cliente" (
  "id" SERIAL PRIMARY KEY,
  "nome" VARCHAR(150) NOT NULL,
  "cpf_cnpj" VARCHAR(20) UNIQUE
);

CREATE TABLE "forma_pagamento" (
  "id" SERIAL PRIMARY KEY,
  "nome" VARCHAR(50) NOT NULL
);

CREATE TABLE "venda" (
  "id" SERIAL PRIMARY KEY,
  "id_cliente" INTEGER,
  "id_forma_pagamento" INTEGER NOT NULL,
  "id_sessao_caixa" INTEGER NOT NULL,
  "data_venda" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "valor_total" DECIMAL(10,2) NOT NULL
);

CREATE TABLE "item_venda" (
  "id" SERIAL PRIMARY KEY,
  "id_venda" INTEGER NOT NULL,
  "id_produto" INTEGER NOT NULL,
  "quantidade" INTEGER NOT NULL,
  "valor_unitario" DECIMAL(10,2) NOT NULL
);

CREATE TABLE "movimentacao_caixa" (
  "id" SERIAL PRIMARY KEY,
  "id_sessao_caixa" INTEGER NOT NULL,
  "id_venda" INTEGER,
  "id_compra" INTEGER,
  "id_despesa" INTEGER,
  "tipo_movimento" VARCHAR(20) NOT NULL, -- 'ENTRADA' ou 'SAIDA'
  "valor" DECIMAL(10,2) NOT NULL,
  "data_movimentacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- CHAVES ESTRANGEIRAS
-- =====================================

ALTER TABLE "usuario" ADD FOREIGN KEY ("id_perfil") REFERENCES "perfil_acesso" ("id");
ALTER TABLE "log_auditoria" ADD FOREIGN KEY ("id_usuario") REFERENCES "usuario" ("id");
ALTER TABLE "sessao_caixa" ADD FOREIGN KEY ("id_caixa") REFERENCES "caixa" ("id");
ALTER TABLE "sessao_caixa" ADD FOREIGN KEY ("id_usuario") REFERENCES "usuario" ("id");
ALTER TABLE "produto" ADD FOREIGN KEY ("id_categoria") REFERENCES "categoria" ("id");
ALTER TABLE "produto_fornecedor" ADD FOREIGN KEY ("id_produto") REFERENCES "produto" ("id");
ALTER TABLE "produto_fornecedor" ADD FOREIGN KEY ("id_fornecedor") REFERENCES "fornecedor" ("id");
ALTER TABLE "compra" ADD FOREIGN KEY ("id_fornecedor") REFERENCES "fornecedor" ("id");
ALTER TABLE "item_compra" ADD FOREIGN KEY ("id_compra") REFERENCES "compra" ("id");
ALTER TABLE "item_compra" ADD FOREIGN KEY ("id_produto") REFERENCES "produto" ("id");
ALTER TABLE "venda" ADD FOREIGN KEY ("id_cliente") REFERENCES "cliente" ("id");
ALTER TABLE "venda" ADD FOREIGN KEY ("id_forma_pagamento") REFERENCES "forma_pagamento" ("id");
ALTER TABLE "venda" ADD FOREIGN KEY ("id_sessao_caixa") REFERENCES "sessao_caixa" ("id");
ALTER TABLE "item_venda" ADD FOREIGN KEY ("id_venda") REFERENCES "venda" ("id");
ALTER TABLE "item_venda" ADD FOREIGN KEY ("id_produto") REFERENCES "produto" ("id");
ALTER TABLE "movimentacao_caixa" ADD FOREIGN KEY ("id_sessao_caixa") REFERENCES "sessao_caixa" ("id");
ALTER TABLE "movimentacao_caixa" ADD FOREIGN KEY ("id_venda") REFERENCES "venda" ("id");
ALTER TABLE "movimentacao_caixa" ADD FOREIGN KEY ("id_compra") REFERENCES "compra" ("id");
ALTER TABLE "movimentacao_caixa" ADD FOREIGN KEY ("id_despesa") REFERENCES "despesa" ("id");

-- =====================================
-- INSERTS INICIAIS (Omitindo IDs por causa do SERIAL)
-- =====================================

INSERT INTO "perfil_acesso" ("nome") VALUES ('Administrador'), ('Caixa/Vendedor');
INSERT INTO "categoria" ("nome") VALUES ('Eletrônicos'), ('Acessórios');
INSERT INTO "forma_pagamento" ("nome") VALUES ('PIX'), ('Cartão de Crédito'), ('Dinheiro');
INSERT INTO "produto" ("id_categoria", "nome", "quantidade_estoque", "preco_custo", "preco_venda")
VALUES 
  (1, 'Smartphone', 15, 1000.00, 1500.00),
  (2, 'Cabo USB-C', 50, 15.00, 35.00);


  