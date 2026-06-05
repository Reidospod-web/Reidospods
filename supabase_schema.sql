-- ============================================================
--  Catálogo RDP — Esquema do banco de dados (Supabase / Postgres)
--  Rode no painel: Supabase > SQL Editor > New query > Run
-- ============================================================

-- ------------------------------------------------------------
-- Tabela de PRODUTOS  (JÁ EXISTE neste projeto)
-- ------------------------------------------------------------
-- A tabela "produtos" já está criada com colunas em português:
--   id (integer, fornecido pelo app), nome, preco, marca, descricao,
--   categoria, imagem_url, emoji, tags (array), badge, disponivel (bool)
-- O código no index.html foi adaptado a esse formato — nada a fazer aqui.
--
-- (Referência: se algum dia precisar recriar do zero, use algo como:)
--   create table if not exists produtos (
--     id integer primary key,
--     nome text not null,
--     preco numeric(10,2) not null,
--     marca text,
--     descricao text,
--     categoria text,
--     imagem_url text,
--     emoji text default '💨',
--     tags text[] default '{}',
--     badge text,
--     disponivel boolean default true
--   );

-- ------------------------------------------------------------
-- Tabela de PEDIDOS  (PRECISA SER CRIADA — rode este bloco)
-- ------------------------------------------------------------
create table if not exists pedidos (
  id          bigint generated always as identity primary key,
  created_at  timestamptz default now(),
  nome        text not null,
  whatsapp    text,
  rua         text,
  numero      text,
  complemento text,
  bairro      text,
  cidade      text,
  uf          text,
  cep         text,
  referencia  text,
  pagamento   text,                 -- 'pix' ou 'dinheiro'
  total       numeric(10,2),
  itens       jsonb                  -- lista de itens do carrinho
);

alter table pedidos enable row level security;

-- Clientes (não logados, chave publishable) podem CRIAR pedidos no checkout...
drop policy if exists "pedidos_insert_public" on pedidos;
create policy "pedidos_insert_public" on pedidos
  for insert to anon, authenticated with check (true);

-- ...mas só ADMINS LOGADOS (Supabase Auth) podem LER os pedidos.
-- Como os pedidos têm dados pessoais (nome, telefone, endereço), a leitura
-- NÃO é liberada para a chave pública/anon — exige login.
drop policy if exists "pedidos_select_auth" on pedidos;
create policy "pedidos_select_auth" on pedidos
  for select to authenticated using (true);

-- (Opcional, mais restritivo) Em vez da policy acima, limite a leitura a um
-- e-mail específico de admin — troque o e-mail e use ESTA no lugar da anterior:
--   create policy "pedidos_select_admin" on pedidos
--     for select to authenticated
--     using ( (auth.jwt() ->> 'email') = 'SEU_EMAIL_ADMIN@exemplo.com' );

-- IMPORTANTE (no painel do Supabase, fora do SQL):
--   1) Authentication > Sign In / Providers > Email: DESATIVE "Allow new users
--      to sign up" (senão qualquer um pode se cadastrar e ler os pedidos).
--   2) Authentication > Users > Add user: crie seu usuário admin (e-mail + senha)
--      e marque "Auto Confirm User".
