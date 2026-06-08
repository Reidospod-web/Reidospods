#!/usr/bin/env node
// Migra as imagens dos produtos de base64 (coluna imagem_url) para o Supabase
// Storage, substituindo o valor da coluna pela URL pública do arquivo.
//
// COMO RODAR (precisa da service_role key — NUNCA exponha no front-end):
//   export SUPABASE_SERVICE_ROLE_KEY='sua_service_role_key'
//   node migrate_images.mjs
//
// Requer Node 18+ (fetch nativo). É idempotente: linhas que já têm URL
// (não-base64) são puladas, então pode rodar de novo com segurança.

const URL = 'https://gegykbsjgzvxyzwpnzol.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'produtos';

if (!KEY) {
  console.error('❌ Defina SUPABASE_SERVICE_ROLE_KEY no ambiente antes de rodar.');
  console.error("   export SUPABASE_SERVICE_ROLE_KEY='...'  (Settings > API > service_role)");
  process.exit(1);
}

const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };

async function ensureBucket() {
  // Cria o bucket público se ainda não existir.
  const res = await fetch(`${URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...H, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (res.ok) { console.log(`✅ Bucket "${BUCKET}" criado (público).`); return; }
  const body = await res.json().catch(() => ({}));
  if (res.status === 409 || /already exists/i.test(body.message || '')) {
    console.log(`ℹ️  Bucket "${BUCKET}" já existe.`);
  } else {
    throw new Error(`Falha ao criar bucket: HTTP ${res.status} ${JSON.stringify(body)}`);
  }
}

function parseDataUrl(s) {
  const m = /^data:([^;]+);base64,(.*)$/s.exec(s || '');
  if (!m) return null;
  return { mime: m[1].toLowerCase(), buf: Buffer.from(m[2], 'base64') };
}

async function fetchProducts() {
  const res = await fetch(`${URL}/rest/v1/produtos?select=id,imagem_url&order=id.asc`, { headers: H });
  if (!res.ok) throw new Error(`Falha ao listar produtos: HTTP ${res.status}`);
  return res.json();
}

async function uploadObject(path, buf, mime) {
  const res = await fetch(`${URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: { ...H, 'Content-Type': mime, 'x-upsert': 'true' },
    body: buf,
  });
  if (!res.ok) throw new Error(`Upload falhou (${path}): HTTP ${res.status} ${await res.text()}`);
  return `${URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

async function updateRow(id, publicUrl) {
  const res = await fetch(`${URL}/rest/v1/produtos?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ imagem_url: publicUrl }),
  });
  if (!res.ok) throw new Error(`UPDATE falhou (id=${id}): HTTP ${res.status} ${await res.text()}`);
}

async function main() {
  await ensureBucket();
  const products = await fetchProducts();
  let migrated = 0, skipped = 0;
  for (const p of products) {
    const parsed = parseDataUrl(p.imagem_url);
    if (!parsed) { skipped++; console.log(`⏭️  id=${p.id}: sem base64 (pulado).`); continue; }
    const ext = EXT[parsed.mime] || 'png';
    const path = `${p.id}.${ext}`;
    const sizeKB = (parsed.buf.length / 1024).toFixed(0);
    const publicUrl = await uploadObject(path, parsed.buf, parsed.mime);
    await updateRow(p.id, publicUrl);
    migrated++;
    console.log(`✅ id=${p.id}: ${sizeKB} KB → ${publicUrl}`);
  }
  console.log(`\n🎉 Concluído. Migrados: ${migrated} | Pulados: ${skipped}`);
}

main().catch((e) => { console.error('\n❌ Erro:', e.message); process.exit(1); });
