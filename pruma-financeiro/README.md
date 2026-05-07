# PRUMA — Financeiro

Sistema de controle financeiro interno da Pruma. Regime de competência + regime de caixa, DRE, Fluxo de Caixa, Ciclo Financeiro e muito mais.

---

## Rodar localmente

```bash
# 1. Clone o repositório
git clone https://github.com/SEU_USUARIO/pruma-financeiro.git
cd pruma-financeiro

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# (edite o .env conforme necessário — veja a seção Supabase abaixo)

# 4. Rode em desenvolvimento
npm run dev
```

O sistema abre em `http://localhost:5173`.

> **Sem configurar o Supabase**, os dados ficam no `localStorage` do navegador — funcionam localmente mas não são compartilhados entre os sócios.

---

## Compartilhar dados entre os 3 sócios — Supabase (gratuito)

### 1. Criar o projeto Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita
2. Crie um novo projeto (escolha a região mais próxima — ex: South America)
3. Aguarde o projeto inicializar (~2 minutos)

### 2. Criar a tabela no banco

No painel do Supabase, vá em **SQL Editor** e rode:

```sql
-- Tabela de chave-valor compartilhada
CREATE TABLE kv_store (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE kv_store ENABLE ROW LEVEL SECURITY;

-- Permitir leitura e escrita anônima (acesso interno dos sócios)
CREATE POLICY "Acesso total anon" ON kv_store
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);
```

### 3. Pegar as credenciais

Em **Project Settings → API**:
- Copie a **Project URL**
- Copie a **anon public key**

### 4. Configurar o .env

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

Pronto — os 3 sócios vão compartilhar os mesmos dados em tempo real.

---

## Deploy no Vercel (URL própria)

### Opção A — Via GitHub (recomendado)

1. Faça push do projeto para o GitHub
2. Acesse [vercel.com](https://vercel.com) e importe o repositório
3. Na tela de configuração, adicione as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Clique em **Deploy**

O Vercel detecta automaticamente que é um projeto Vite e configura tudo.

### Opção B — Via Vercel CLI

```bash
npm install -g vercel
vercel --prod
```

---

## Estrutura do projeto

```
pruma-financeiro/
├── src/
│   ├── App.jsx       ← sistema completo (11 módulos)
│   ├── storage.js    ← camada de persistência (localStorage ou Supabase)
│   ├── main.jsx      ← entry point React
│   └── index.css     ← variáveis de design e reset
├── index.html
├── vite.config.js
├── package.json
├── .env.example
└── .gitignore
```

---

## Módulos

| Módulo | Descrição |
|---|---|
| Dashboard | KPIs, gráfico receita vs despesa, próximos vencimentos |
| Lançamentos | CRUD completo, filtros, baixa rápida |
| Clientes | Retainer e avulso, valor mensal, histórico de faturamento |
| Plano de Contas | Editável, agrupado por grupo e tipo |
| DRE | Orçado vs Realizado vs Variação por período |
| Fluxo de Caixa | Realizado e projetado, saldo inicial configurável |
| C. Receber / Pagar | Aging em 5 faixas, baixa individual |
| Vendas por Serviço | Valor total, custo, margem %, ticket médio mensal |
| Ciclo Financeiro | PMR, PMP, ciclo geral, por cliente, por serviço e mês a mês |
| Conciliação Bancária | Import CSV e OFX, vinculação a lançamentos |
| Log de Auditoria | Quem fez o quê e quando, filtro por usuário |

---

## Usuários pré-cadastrados

- **Kelly Lima** — configura PIN no primeiro acesso
- **Marcelo Mattioli** — configura PIN no primeiro acesso
- **Diogo Arado** — configura PIN no primeiro acesso

---

Feito com ♥ para a Pruma.
