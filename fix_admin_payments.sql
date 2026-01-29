-- 1. Primeiro, removemos a política antiga que pode estar errada
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;

-- 2. Recriamos a política com o ID correto
CREATE POLICY "Admins can view all payments" 
ON payments 
FOR SELECT 
USING (auth.uid() = '426d48bb-fc97-4461-acc9-a8a59445b72d');

-- 3. (Opcional) Debug: Listar quantos pagamentos existem no total
-- Veja na aba "Results" se aparece algum número maior que 0
SELECT count(*) as total_pagamentos FROM payments;
