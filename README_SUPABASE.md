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
- ✅ SQL da tabela `pedidos` executado no banco (RLS + policies aplicadas).
- ⚙️ Falta configurar o usuário admin (passo 2 abaixo).

## 1. Criar a tabela `pedidos` — ✅ FEITO

O conteúdo de [`supabase_schema.sql`](./supabase_schema.sql) já foi **executado no banco**.
A tabela `pedidos` está criada com:
- INSERT liberado para clientes (checkout sem login);
- SELECT (leitura) liberado **apenas para usuários autenticados** (admin logado).

> Para reaplicar (script é idempotente), rode o arquivo em
> **Supabase → SQL Editor → New query → Run**.
>
> **Conexão por fora do painel:** a string de **conexão direta**
> (`db.<ref>.supabase.co:5432`) é IPv6-only. Em ambientes sem IPv6, use o **pooler**:
> host `aws-1-sa-east-1.pooler.supabase.com`, porta `5432` (ou `6543`), usuário
> `postgres.<ref>`. O TLS usa a CA própria do Supabase (*Supabase Root 2021 CA*) —
> valide contra ela em vez de desabilitar a verificação de certificado.

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
