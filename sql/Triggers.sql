-- 1. Criação da Função de Auditoria
CREATE OR REPLACE FUNCTION registrar_log_estoque()
RETURNS TRIGGER AS $$
DECLARE
    v_acao VARCHAR(255);
BEGIN
    -- Verifica se a coluna 'quantidade_estoque' realmente sofreu alteração
    IF NEW.quantidade_estoque <> OLD.quantidade_estoque THEN
        
        -- Monta uma frase descritiva com o que aconteceu
        v_acao := 'Produto ID ' || NEW.id || ' (' || NEW.nome || 
                  ') teve o estoque alterado de ' || OLD.quantidade_estoque || 
                  ' para ' || NEW.quantidade_estoque || '.';

        -- Insere o registro na tabela de auditoria
        -- Obs: O id_usuario fica como NULL aqui (leia a dica de ouro abaixo sobre isso)
        INSERT INTO "log_auditoria" ("id_usuario", "acao", "data_hora")
        VALUES (NULL, v_acao, CURRENT_TIMESTAMP);
        
    END IF;

    -- Como é uma trigger AFTER, apenas retornamos o NEW
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Criação do Gatilho na tabela Produto
CREATE TRIGGER trg_auditoria_estoque
AFTER UPDATE ON "produto"
FOR EACH ROW
EXECUTE FUNCTION registrar_log_estoque();


-- 3. Função que subtrai o estoque
CREATE OR REPLACE FUNCTION baixar_estoque_venda()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualiza a tabela produto, subtraindo a quantidade vendida
    UPDATE "produto"
    SET quantidade_estoque = quantidade_estoque - NEW.quantidade
    WHERE id = NEW.id_produto;

    -- Retorna o registro recém-inserido
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gatilho acionado APÓS inserir um item na venda
CREATE TRIGGER trg_saida_estoque
AFTER INSERT ON "item_venda"
FOR EACH ROW
EXECUTE FUNCTION baixar_estoque_venda();

-- 4. Função que soma o estoque
CREATE OR REPLACE FUNCTION adicionar_estoque_compra()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualiza a tabela produto, somando a quantidade comprada
    UPDATE "produto"
    SET quantidade_estoque = quantidade_estoque + NEW.quantidade
    WHERE id = NEW.id_produto;

    -- Retorna o registro recém-inserido
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gatilho acionado APÓS inserir um item na compra
CREATE TRIGGER trg_entrada_estoque
AFTER INSERT ON "item_compra"
FOR EACH ROW
EXECUTE FUNCTION adicionar_estoque_compra();

CREATE OR REPLACE FUNCTION validar_estoque_disponivel()
RETURNS TRIGGER AS $$
DECLARE
    v_estoque_atual INT;
    v_nome_produto VARCHAR;
BEGIN
    -- Busca o estoque atual e o nome do produto
    SELECT quantidade_estoque, nome INTO v_estoque_atual, v_nome_produto
    FROM "produto"
    WHERE id = NEW.id_produto;

    -- Verifica se a quantidade solicitada é maior que o estoque
    IF NEW.quantidade > v_estoque_atual THEN
        -- Interrompe a transação e lança um erro para a aplicação
        RAISE EXCEPTION 'Estoque insuficiente para o produto % (ID: %). Solicitado: %, Disponível: %', 
                        v_nome_produto, NEW.id_produto, NEW.quantidade, v_estoque_atual;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Essa trigger precisa ser BEFORE, para impedir a inserção ANTES de subtrair
CREATE TRIGGER trg_validar_estoque
BEFORE INSERT ON "item_venda"
FOR EACH ROW
EXECUTE FUNCTION validar_estoque_disponivel();

-- 5. Função de Integração: Venda -> Caixa
-- Objetivo: Registrar automaticamente a entrada de valor no fluxo de caixa (tabela movimentacao_caixa)
--           quando uma nova venda é inserida ou tem seu valor total alterado.
CREATE OR REPLACE FUNCTION trg_venda_caixa()
RETURNS TRIGGER AS $$
BEGIN
    -- Se for uma nova venda, insere a ENTRADA
    IF TG_OP = 'INSERT' THEN
        INSERT INTO "movimentacao_caixa" (
            "id_sessao_caixa", "id_venda", "tipo_movimento", "valor"
        ) VALUES (
            NEW.id_sessao_caixa, NEW.id, 'ENTRADA', NEW.valor_total
        );
        
    -- Se o valor total da venda for atualizado, atualiza o caixa também
    ELSIF TG_OP = 'UPDATE' AND NEW.valor_total <> OLD.valor_total THEN
        UPDATE "movimentacao_caixa"
        SET valor = NEW.valor_total
        WHERE id_venda = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gatilho acionado APÓS inserir ou atualizar o cabeçalho de uma venda
CREATE TRIGGER tg_integra_venda_caixa
AFTER INSERT OR UPDATE ON "venda"
FOR EACH ROW
EXECUTE FUNCTION trg_venda_caixa();


-- 6. Função de Integração: Compra -> Caixa
-- Objetivo: Registrar automaticamente a saída de valor no fluxo de caixa (tabela movimentacao_caixa)
--           quando uma nova compra é inserida ou alterada, vinculando à sessão de caixa que estiver aberta.
CREATE OR REPLACE FUNCTION trg_compra_caixa()
RETURNS TRIGGER AS $$
DECLARE
    v_id_sessao_aberta INTEGER;
BEGIN
    -- Busca a sessão de caixa que está atualmente aberta
    SELECT id INTO v_id_sessao_aberta
    FROM "sessao_caixa"
    WHERE data_fechamento IS NULL
    ORDER BY id DESC LIMIT 1;

    -- Proteção: Se não houver caixa aberto, barra a operação
    IF v_id_sessao_aberta IS NULL THEN
        RAISE EXCEPTION 'Não é possível registrar a compra. Não há nenhuma sessão de caixa aberta no momento.';
    END IF;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO "movimentacao_caixa" (
            "id_sessao_caixa", "id_compra", "tipo_movimento", "valor"
        ) VALUES (
            v_id_sessao_aberta, NEW.id, 'SAIDA', NEW.valor_total
        );
        
    ELSIF TG_OP = 'UPDATE' AND NEW.valor_total <> OLD.valor_total THEN
        UPDATE "movimentacao_caixa"
        SET valor = NEW.valor_total
        WHERE id_compra = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gatilho acionado APÓS inserir ou atualizar o cabeçalho de uma compra
CREATE TRIGGER tg_integra_compra_caixa
AFTER INSERT OR UPDATE ON "compra"
FOR EACH ROW
EXECUTE FUNCTION trg_compra_caixa();


-- 7. Função de Integração: Despesa -> Caixa
-- Objetivo: Registrar automaticamente a saída de valor no fluxo de caixa (tabela movimentacao_caixa)
--           quando uma nova despesa é lançada ou alterada, vinculando à sessão de caixa que estiver aberta.
CREATE OR REPLACE FUNCTION trg_despesa_caixa()
RETURNS TRIGGER AS $$
DECLARE
    v_id_sessao_aberta INTEGER;
BEGIN
    -- Busca a sessão de caixa que está atualmente aberta
    SELECT id INTO v_id_sessao_aberta
    FROM "sessao_caixa"
    WHERE data_fechamento IS NULL
    ORDER BY id DESC LIMIT 1;

    IF v_id_sessao_aberta IS NULL THEN
        RAISE EXCEPTION 'Não é possível lançar a despesa. Não há nenhuma sessão de caixa aberta.';
    END IF;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO "movimentacao_caixa" (
            "id_sessao_caixa", "id_despesa", "tipo_movimento", "valor"
        ) VALUES (
            v_id_sessao_aberta, NEW.id, 'SAIDA', NEW.valor
        );
        
    ELSIF TG_OP = 'UPDATE' AND NEW.valor <> OLD.valor THEN
        UPDATE "movimentacao_caixa"
        SET valor = NEW.valor
        WHERE id_despesa = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gatilho acionado APÓS inserir ou atualizar uma despesa
CREATE TRIGGER tg_integra_despesa_caixa
AFTER INSERT OR UPDATE ON "despesa"
FOR EACH ROW
EXECUTE FUNCTION trg_despesa_caixa();

-- 8. Função de Cálculo: Item Venda -> Total Venda
-- Objetivo: Recalcular o 'valor_total' da tabela 'venda' automaticamente sempre que 
--           um item for adicionado, modificado ou removido da tabela 'item_venda'.
CREATE OR REPLACE FUNCTION calcular_total_venda()
RETURNS TRIGGER AS $$
DECLARE
    v_id_venda INTEGER;
    v_total DECIMAL(10,2);
BEGIN
    -- Define qual ID de venda usar (OLD para deleção, NEW para inserção/atualização)
    IF TG_OP = 'DELETE' THEN
        v_id_venda := OLD.id_venda;
    ELSE
        v_id_venda := NEW.id_venda;
    END IF;

    -- Calcula a soma de (quantidade * valor_unitario) de todos os itens dessa venda
    -- O COALESCE garante que, se a venda ficar sem itens, o total seja 0 em vez de NULL
    SELECT COALESCE(SUM(quantidade * valor_unitario), 0) INTO v_total
    FROM "item_venda"
    WHERE id_venda = v_id_venda;

    -- Atualiza o cabeçalho da venda com o novo total
    UPDATE "venda"
    SET valor_total = v_total
    WHERE id = v_id_venda;

    -- Retorna o registro apropriado dependendo da operação
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Gatilho acionado APÓS inserir, atualizar ou deletar um item da venda
CREATE TRIGGER tg_calcula_total_venda
AFTER INSERT OR UPDATE OR DELETE ON "item_venda"
FOR EACH ROW
EXECUTE FUNCTION calcular_total_venda();


-- 9. Função de Cálculo: Item Compra -> Total Compra
-- Objetivo: Recalcular o 'valor_total' da tabela 'compra' automaticamente sempre que 
--           um item for adicionado, modificado ou removido da tabela 'item_compra'.
CREATE OR REPLACE FUNCTION calcular_total_compra()
RETURNS TRIGGER AS $$
DECLARE
    v_id_compra INTEGER;
    v_total DECIMAL(10,2);
BEGIN
    -- Define qual ID de compra usar (OLD para deleção, NEW para inserção/atualização)
    IF TG_OP = 'DELETE' THEN
        v_id_compra := OLD.id_compra;
    ELSE
        v_id_compra := NEW.id_compra;
    END IF;

    -- Calcula a soma de (quantidade * valor_unitario) de todos os itens dessa compra
    SELECT COALESCE(SUM(quantidade * valor_unitario), 0) INTO v_total
    FROM "item_compra"
    WHERE id_compra = v_id_compra;

    -- Atualiza o cabeçalho da compra com o novo total
    UPDATE "compra"
    SET valor_total = v_total
    WHERE id = v_id_compra;

    -- Retorna o registro apropriado dependendo da operação
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Gatilho acionado APÓS inserir, atualizar ou deletar um item da compra
CREATE TRIGGER tg_calcula_total_compra
AFTER INSERT OR UPDATE OR DELETE ON "item_compra"
FOR EACH ROW
EXECUTE FUNCTION calcular_total_compra();