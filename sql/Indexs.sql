-- Acelera a soma dos itens e as consultas de "quais itens pertencem a esta venda/compra"
CREATE INDEX idx_item_venda_id_venda ON "item_venda" ("id_venda");
CREATE INDEX idx_item_compra_id_compra ON "item_compra" ("id_compra");

-- Acelera os relatórios de fechamento de caixa e a view que acabamos de criar
CREATE INDEX idx_movimentacao_sessao ON "movimentacao_caixa" ("id_sessao_caixa");
CREATE INDEX idx_venda_sessao ON "venda" ("id_sessao_caixa");

-- Acelera a busca pelo histórico de compras de um cliente específico
CREATE INDEX idx_venda_cliente ON "venda" ("id_cliente");

-- Acelera filtros por período (ex: faturamento de março)
CREATE INDEX idx_venda_data ON "venda" ("data_venda");
CREATE INDEX idx_compra_data ON "compra" ("data_compra");
CREATE INDEX idx_movimentacao_data ON "movimentacao_caixa" ("data_movimentacao");   

-- Acelera a busca de produtos e clientes pelo nome digitado no sistema
CREATE INDEX idx_produto_nome ON "produto" ("nome");
CREATE INDEX idx_cliente_nome ON "cliente" ("nome");