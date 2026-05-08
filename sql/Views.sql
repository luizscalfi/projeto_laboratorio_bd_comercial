CREATE OR REPLACE VIEW vw_fechamento_caixa AS
SELECT 
    sc.id AS id_sessao,
    c.nome AS nome_caixa,
    u.nome AS operador,
    sc.data_abertura,
    sc.data_fechamento,
    CASE 
        WHEN sc.data_fechamento IS NULL THEN 'ABERTA'
        ELSE 'FECHADA'
    END AS status_sessao,
    sc.valor_abertura,
    -- Soma todas as entradas, se for NULL (sem vendas) retorna 0
    COALESCE(SUM(CASE WHEN mc.tipo_movimento = 'ENTRADA' THEN mc.valor ELSE 0 END), 0) AS total_entradas,
    -- Soma todas as saídas, se for NULL (sem despesas/compras) retorna 0
    COALESCE(SUM(CASE WHEN mc.tipo_movimento = 'SAIDA' THEN mc.valor ELSE 0 END), 0) AS total_saidas,
    -- Calcula o Saldo Final = (Abertura + Entradas - Saídas)
    (sc.valor_abertura + 
     COALESCE(SUM(CASE WHEN mc.tipo_movimento = 'ENTRADA' THEN mc.valor ELSE 0 END), 0) - 
     COALESCE(SUM(CASE WHEN mc.tipo_movimento = 'SAIDA' THEN mc.valor ELSE 0 END), 0)) AS saldo_final_previsto
FROM 
    "sessao_caixa" sc
JOIN 
    "caixa" c ON sc.id_caixa = c.id
JOIN 
    "usuario" u ON sc.id_usuario = u.id
LEFT JOIN 
    "movimentacao_caixa" mc ON sc.id = mc.id_sessao_caixa
GROUP BY 
    sc.id, c.nome, u.nome, sc.data_abertura, sc.data_fechamento, sc.valor_abertura;





CREATE OR REPLACE VIEW vw_resumo_estoque AS
SELECT 
    p.id AS id_produto,
    p.nome AS nome_produto,
    c.nome AS categoria,
    p.quantidade_estoque,
    p.preco_custo,
    p.preco_venda,
    -- Quanto custou para comprar esse estoque
    (p.quantidade_estoque * p.preco_custo) AS valor_total_investido,
    -- Quanto vai render se vender tudo
    (p.quantidade_estoque * p.preco_venda) AS valor_potencial_bruto,
    -- O lucro bruto esperado
    ((p.quantidade_estoque * p.preco_venda) - (p.quantidade_estoque * p.preco_custo)) AS lucro_potencial_esperado
FROM 
    "produto" p
JOIN 
    "categoria" c ON p.id_categoria = c.id;