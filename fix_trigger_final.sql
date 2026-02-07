-- 1. Modificar a Função do Trigger para permitir bypass via variável de sessão
CREATE OR REPLACE FUNCTION public.prevent_credit_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Permitir se a flag de bypass estiver ativa (usada por funções confiáveis)
  IF current_setting('app.bypass_credit_trigger', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Permitir se for Service Role (Admin/API)
  IF (auth.jwt() ->> 'role') = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Bloquear se houver mudança nos créditos
  IF NEW.credits IS DISTINCT FROM OLD.credits THEN
      RAISE EXCEPTION 'Você não tem permissão para alterar seus créditos manualmente.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Modificar a função de adicionar créditos para ativar a flag
CREATE OR REPLACE FUNCTION public.add_user_credits(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Ativa a flag de bypass apenas para esta transação (is_local = true)
  PERFORM set_config('app.bypass_credit_trigger', 'true', true);

  -- Atualiza os créditos
  UPDATE public.profiles
  SET credits = COALESCE(credits, 0) + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Garantir permissões de execução
GRANT EXECUTE ON FUNCTION public.add_user_credits(uuid, integer) TO public;
GRANT EXECUTE ON FUNCTION public.add_user_credits(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_user_credits(uuid, integer) TO service_role;
