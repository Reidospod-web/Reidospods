-- Policies do Storage para o bucket "produtos".
-- Rode UMA VEZ no Supabase (Dashboard > SQL Editor).
--
-- O bucket é público (leitura liberada via URL pública), mas o upload a partir
-- do Admin usa a sessão autenticada (chave publishable + login). Sem estas
-- policies, o Supabase bloqueia o envio das imagens.

-- Permite o admin autenticado ENVIAR imagens para o bucket "produtos".
create policy "produtos_insert_authenticated"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'produtos');

-- Permite SOBRESCREVER (upsert) uma imagem existente.
create policy "produtos_update_authenticated"
  on storage.objects for update to authenticated
  using (bucket_id = 'produtos')
  with check (bucket_id = 'produtos');
