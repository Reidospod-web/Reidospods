# Catálogo RDP — Integração com Supabase

O catálogo salva **produtos** e **pedidos** no Supabase (banco na nuvem), em vez
do IndexedDB local. Os produtos cadastrados no Admin aparecem para todos os
clientes, em qualquer dispositivo. O painel **Admin** agora usa **login real**
(Supabase Auth) e só admins logados conseguem ver os pedidos.

## Status da configuração

- ✅ Cliente do Supabase incluído no `index.html` (via CDN, versão fixa + SRI).
- ✅ URL e chave **publishable** preenchidas no `index.html`.
- ✅ Código adaptado à tabela `produtos` que já existe (colunas em português).
- ✅ Painel Admin com login (Supabase Auth) + tela de pedidos protegida.
- ⚙️ Falta rodar o SQL da tabela `pedidos` e configurar o usuário admin (abaixo).

## 1. Criar a tabela `pedidos`

Rode o conteúdo de [`supabase_schema.sql`](./supabase_schema.sql) em
**Supabase → SQL Editor → New query → Run**. Isso cria a tabela `pedidos` com:
- INSERT liberado para clientes (checkout sem login);
- SELECT (leitura) liberado **apenas para usuários autenticados** (admin logado).

## 2. Configurar o login do admin (no painel do Supabase)

1. **Desative cadastros públicos:** Authentication → *Sign In / Providers* →
   **Email** → desligue **"Allow new users to sign up"**.
   (Sem isso, qualquer um poderia se cadastrar e ler os pedidos.)
2. **Crie o usuário admin:** Authentication → **Users** → **Add user** →
   informe e-mail + senha e marque **"Auto Confirm User"**.

## 3. Usar

Abra o `index.html` no navegador:

- **Catálogo**: lê os produtos do Supabase (público).
- **Admin**: pede **e-mail + senha** (o usuário criado no passo 2). Depois de
  logar, você adiciona/pausa/remove produtos e vê a lista de **Pedidos**.
  O botão **Sair** encerra a sessão.
- **Checkout**: ao finalizar, o pedido é gravado na tabela `pedidos` **e** segue
  pelo WhatsApp como antes.

## Observações

- **`id` dos produtos:** a tabela `produtos` não usa auto-incremento, então o app
  gera o `id` (maior id atual + 1). Para uso intenso, configure a coluna como
  `identity` no Supabase.
- **Imagens em base64:** as fotos vão como texto base64 na coluna `imagem_url`.
  Para catálogos grandes, o ideal é usar o **Supabase Storage**.
- **Produtos:** a escrita de produtos continua usando a chave pública (a tabela é
  compartilhada com outro projeto). Quem chega ao formulário já passou pelo login
  do Admin. Se quiser, dá para também restringir a escrita de `produtos` a
  usuários autenticados via RLS.
