# Deploy fora do Lovable

App = frontend TanStack Start + Supabase (DB/Auth/Storage). Não há server functions próprias, então qualquer host que rode Node 22 serve.

## 1. Variáveis necessárias

Pegue no painel do Supabase (Settings → API):

| Variável | Onde | Descrição |
|---|---|---|
| `VITE_SUPABASE_URL` | build + runtime | URL do projeto (ex: `https://xxxx.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | build + runtime | chave `anon`/`publishable` (pública, vai no bundle) |
| `VITE_SUPABASE_PROJECT_ID` | build | id do projeto (opcional) |
| `SUPABASE_URL` | runtime | mesma URL acima (usada pelo SSR) |
| `SUPABASE_PUBLISHABLE_KEY` | runtime | mesma chave acima |

> A `SERVICE_ROLE_KEY` **não** é necessária — o app só usa o client público.

## 2. Build da imagem

```bash
docker build \
  --build-arg VITE_SUPABASE_URL="https://SEU.supabase.co" \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGc..." \
  -t couple-run-quest .
```

## 3. Rodar local

```bash
docker run --rm -p 3000:3000 \
  -e SUPABASE_URL="https://SEU.supabase.co" \
  -e SUPABASE_PUBLISHABLE_KEY="eyJhbGc..." \
  couple-run-quest
```

Acesse `http://localhost:3000`.

## 4. Fly.io

```bash
fly launch --no-deploy --image-label v1
fly secrets set \
  SUPABASE_URL="https://SEU.supabase.co" \
  SUPABASE_PUBLISHABLE_KEY="eyJhbGc..."

fly deploy \
  --build-arg VITE_SUPABASE_URL="https://SEU.supabase.co" \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGc..."
```

No `fly.toml` confirme:

```toml
[http_service]
  internal_port = 3000
  force_https = true
```

## 5. Outras hosts

- **Railway / Render / Coolify**: apontam para o Dockerfile, configure as 5 env vars (build args + runtime envs) e exponha a porta 3000.
- **VPS própria**: `docker compose up -d` com um `docker-compose.yml` setando `build.args` e `environment`.

## 6. Banco

O Supabase continua sendo o backend. As tabelas (`profiles`, `runs`, `photos`) e o bucket `photos` já existem no projeto que você criou no Lovable. Para migrar para um Supabase próprio:

1. Crie um novo projeto Supabase
2. Rode as migrations em `supabase/migrations/` na nova instância (via `supabase db push` ou copiando o SQL)
3. Crie o bucket `photos` (privado) e replique a policy `open_all_*` se quiser manter sem login
4. Aponte as env vars acima para o novo projeto
