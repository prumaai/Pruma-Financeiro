import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// Storage adapter: usa Supabase (produção) ou window.storage (Claude artifact)
let _storage = null;
const getStorage = async () => {
  if (_storage) return _storage;
  if (typeof window !== 'undefined' && window.storage) {
    // Modo Claude artifact
    _storage = {
      get: (key) => window.storage.get(key, true),
      set: (key, val) => window.storage.set(key, val, true),
    };
  } else {
    // Modo Netlify — importa storage.js (Supabase ou localStorage)
    const mod = await import('./storage.js');
    _storage = mod.storage;
  }
  return _storage;
};

// ═══════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════
// Pruma IA — Azul Marinho + Ciano Elétrico
const TEAL = '#00C4D8', TEAL_D = '#007F8F', TEAL_L = '#E0F9FB';
const BLUE = '#185FA5', BLUE_L = '#E6F1FB';
const AMBER = '#BA7517', AMBER_L = '#FAEEDA';
const RED = '#E24B4A', RED_L = '#FCEBEB';
const GREEN = '#3B6D11', GREEN_L = '#EAF3DE';
const DARK = '#0B1E3F'; // Azul Marinho

const K = {
  users: 'pf_users', lanc: 'pf_lanc', cli: 'pf_cli',
  plano: 'pf_plano_v2', ext: 'pf_ext', audit: 'pf_audit',
};

const U0 = [
  { id: 'kelly',   name: 'Kelly Lima',        initials: 'KL', color: TEAL,  pin: null },
  { id: 'marcelo', name: 'Marcelo Mattioli',   initials: 'MM', color: BLUE,  pin: null },
  { id: 'diogo',   name: 'Diogo Arado',        initials: 'DA', color: AMBER, pin: null },
];

const P0 = [
  // ── 1. RECEITA OPERACIONAL ─────────────────────────────
  // prazo_meses = prazo médio de recebimento (PMR) após emissão da NF
  { id: 'r1',  cod: '1.1', nome: 'Retainer / Mensalidade',          grupo: 'Receita Operacional',        tipo: 'receita', prazo_meses: 0 },
  { id: 'r2',  cod: '1.2', nome: 'Diagnóstico Financeiro',          grupo: 'Receita Operacional',        tipo: 'receita', prazo_meses: 0 },
  { id: 'r3',  cod: '1.3', nome: 'Implantação / Projeto',           grupo: 'Receita Operacional',        tipo: 'receita', prazo_meses: 0 },
  { id: 'r4',  cod: '1.4', nome: 'Mentoria / Advisory',             grupo: 'Receita Operacional',        tipo: 'receita', prazo_meses: 0 },
  { id: 'r5',  cod: '1.5', nome: 'Outras Receitas Operacionais',    grupo: 'Receita Operacional',        tipo: 'receita', prazo_meses: 0 },

  // ── 2. DEDUÇÕES SOBRE VENDAS ──────────────────────────
  { id: 'ded1', cod: '2.1', nome: 'Impostos sobre Receita',         grupo: 'Deduções sobre Vendas',      tipo: 'despesa', prazo_meses: 1 }, // pago mês seguinte
  { id: 'ded2', cod: '2.2', nome: 'Taxas Bancárias e de Transação', grupo: 'Deduções sobre Vendas',      tipo: 'despesa', prazo_meses: 0 },
  { id: 'ded3', cod: '2.3', nome: 'Devoluções e Cancelamentos',     grupo: 'Deduções sobre Vendas',      tipo: 'despesa', prazo_meses: 0 },

  // ── 3. CUSTOS VARIÁVEIS (CVS) ─────────────────────────
  { id: 'cv1',  cod: '3.1', nome: 'Pessoal de Operação',            grupo: 'Custos Variáveis',           tipo: 'despesa', prazo_meses: 1 }, // pago mês seguinte
  { id: 'cv2',  cod: '3.2', nome: 'Comissões de Vendas',            grupo: 'Custos Variáveis',           tipo: 'despesa', prazo_meses: 1 }, // pago mês seguinte
  { id: 'cv3',  cod: '3.3', nome: 'Ferramentas e Plataformas',      grupo: 'Custos Variáveis',           tipo: 'despesa', prazo_meses: 0 },
  { id: 'cv4',  cod: '3.4', nome: 'Outros Custos Variáveis',        grupo: 'Custos Variáveis',           tipo: 'despesa', prazo_meses: 0 },

  // ── 4. DESPESAS VARIÁVEIS (SG&A) ──────────────────────
  { id: 'dv1',  cod: '4.1', nome: 'Marketing e Vendas',             grupo: 'Despesas Variáveis',         tipo: 'despesa', prazo_meses: 0 },
  { id: 'dv2',  cod: '4.2', nome: 'Outras Despesas Variáveis',      grupo: 'Despesas Variáveis',         tipo: 'despesa', prazo_meses: 0 },

  // ── 5. DESPESAS FIXAS (G&A) ───────────────────────────
  { id: 'df1',  cod: '5.1', nome: 'Pessoal Administrativo',         grupo: 'Despesas Fixas',             tipo: 'despesa', prazo_meses: 1 }, // pago mês seguinte
  { id: 'df2',  cod: '5.2', nome: 'Ocupação',                       grupo: 'Despesas Fixas',             tipo: 'despesa', prazo_meses: 0 },
  { id: 'df3',  cod: '5.3', nome: 'Tecnologia e Infraestrutura',    grupo: 'Despesas Fixas',             tipo: 'despesa', prazo_meses: 0 },
  { id: 'df4',  cod: '5.4', nome: 'Serviços Profissionais',         grupo: 'Despesas Fixas',             tipo: 'despesa', prazo_meses: 0 },
  { id: 'df5',  cod: '5.5', nome: 'Outras Despesas Fixas',          grupo: 'Despesas Fixas',             tipo: 'despesa', prazo_meses: 0 },

  // ── 6. OUTRAS RECEITAS E DESPESAS ─────────────────────
  { id: 'or1',  cod: '6.1', nome: 'Receitas Financeiras',           grupo: 'Outras Receitas e Despesas', tipo: 'receita' },
  { id: 'or2',  cod: '6.2', nome: 'Outras Receitas Não Operacionais',grupo:'Outras Receitas e Despesas', tipo: 'receita' },
  { id: 'od1',  cod: '6.3', nome: 'Despesas Financeiras',           grupo: 'Outras Receitas e Despesas', tipo: 'despesa' },
  { id: 'od2',  cod: '6.4', nome: 'Outras Despesas Não Operacionais',grupo:'Outras Receitas e Despesas', tipo: 'despesa' },

  // ── 7. IR E CSLL ──────────────────────────────────────
  { id: 'ir1',  cod: '7.1', nome: 'Imposto de Renda (IRPJ)',        grupo: 'IR e CSLL',                  tipo: 'despesa' },
  { id: 'ir2',  cod: '7.2', nome: 'CSLL',                           grupo: 'IR e CSLL',                  tipo: 'despesa' },

  // ── 8. ATIVIDADES DE INVESTIMENTO (Fluxo de Caixa) ────
  { id: 'inv1', cod: '8.1', nome: 'Aquisição de Ativos',            grupo: 'Atividade de Investimento',  tipo: 'despesa' },
  { id: 'inv2', cod: '8.2', nome: 'Investimentos em Participações', grupo: 'Atividade de Investimento',  tipo: 'despesa' },
  { id: 'inv3', cod: '8.3', nome: 'Recebimento de Investimentos',   grupo: 'Atividade de Investimento',  tipo: 'receita' },

  // ── 9. ATIVIDADES DE FINANCIAMENTO (Fluxo de Caixa) ───
  { id: 'fn1',  cod: '9.1', nome: 'Captação de Empréstimos',        grupo: 'Atividade de Financiamento', tipo: 'receita' },
  { id: 'fn2',  cod: '9.2', nome: 'Pagamento de Dívidas',           grupo: 'Atividade de Financiamento', tipo: 'despesa' },
  { id: 'fn3',  cod: '9.3', nome: 'Aporte de Sócios',               grupo: 'Atividade de Financiamento', tipo: 'receita' },
  { id: 'fn4',  cod: '9.4', nome: 'Distribuição de Lucros',         grupo: 'Atividade de Financiamento', tipo: 'despesa' },
];

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════
const hashPin = s => Array.from(s).reduce((h, c) => Math.imul(31, h) + c.charCodeAt(0) | 0, 0).toString();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const today = () => new Date().toISOString().slice(0, 10);
const fmt = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtDate = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
const mk = d => d?.slice(0, 7) ?? '';
const ml = k => { if (!k) return ''; const [y, m] = k.split('-'); return ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][+m-1] + '/' + y.slice(2); };
const diffDays = (a, b) => a && b ? Math.round((new Date(b) - new Date(a)) / 86400000) : null;
const shiftMonth = (monthKey, n) => {
  if (!monthKey || !n) return monthKey;
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const getMonths = (count, offset = 0) => {
  const r = [], d = new Date();
  for (let i = offset; i < offset + count; i++) {
    const t = new Date(d.getFullYear(), d.getMonth() + i, 1);
    r.push(t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0'));
  }
  return r;
};

const buildMonthRange = (start, end) => {
  const months = [];
  let [sy, sm] = start.split('-').map(Number);
  const [ey, em] = end.split('-').map(Number);
  while (sy < ey || (sy === ey && sm <= em)) {
    months.push(`${sy}-${String(sm).padStart(2, '0')}`);
    sm++; if (sm > 12) { sm = 1; sy++; }
  }
  return months;
};

// ═══════════════════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════════════════
const stLoad = async (key, def) => {
  try {
    const st = await getStorage();
    const r = await st.get(key);
    return r ? JSON.parse(r.value) : def;
  } catch { return def; }
};
const stSave = async (key, val) => {
  try {
    const st = await getStorage();
    await st.set(key, JSON.stringify(val));
  } catch {}
};
// ─── CSV Export ───────────────────────────────────────
const exportCSV = (rows, filename) => {
  const csv = rows.map(row =>
    row.map(cell => {
      const v = cell == null ? '' : String(cell);
      return v.includes(',') || v.includes('"') || v.includes('\n')
        ? '"' + v.replace(/"/g, '""') + '"' : v;
    }).join(',')
  ).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};



// ═══════════════════════════════════════════════════════
// STYLE TOKENS
// ═══════════════════════════════════════════════════════
const S = {
  card: { background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '16px 20px' },
  btn:  (bg = TEAL, c = '#fff') => ({ background: bg, color: c, border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', lineHeight: 1.4 }),
  sm:   (bg = TEAL, c = '#fff') => ({ background: bg, color: c, border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 500, cursor: 'pointer', lineHeight: 1.4 }),
  tag:  (bg, c) => ({ background: bg, color: c, borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 500, display: 'inline-block', whiteSpace: 'nowrap' }),
  inp:  { width: '100%', padding: '8px 12px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 8, fontSize: 13, background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', boxSizing: 'border-box' },
  lbl:  { fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 },
  TH:   { fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px', borderBottom: '0.5px solid var(--color-border-tertiary)', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '.04em' },
  TD:   { fontSize: 13, color: 'var(--color-text-primary)', padding: '10px 12px', borderBottom: '0.5px solid var(--color-border-tertiary)', verticalAlign: 'middle' },
};

// ═══════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════
const PageHeader = ({ title, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)' }}>{title}</h2>
    {action}
  </div>
);

function Modal({ title, onClose, children, width = 540 }) {
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ ...S.card, width, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--color-text-secondary)', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

const Field = ({ label, children, col = 'auto' }) => (
  <div style={{ gridColumn: col }}>
    <label style={S.lbl}>{label}</label>
    {children}
  </div>
);

const KpiCard = ({ label, val, color = TEAL, sub }) => (
  <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '14px 18px' }}>
    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 600, color }}>{val}</div>
    {sub && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>{sub}</div>}
  </div>
);

const EmptyRow = ({ cols, msg }) => (
  <tr><td colSpan={cols} style={{ ...S.TD, textAlign: 'center', color: 'var(--color-text-secondary)', padding: 28, fontSize: 13 }}>{msg}</td></tr>
);

// ═══════════════════════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════════════════════
function LoginScreen({ users, onLogin }) {
  const [sel, setSel] = useState(null);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');

  const submit = () => {
    if (!sel.pin) return onLogin(sel);
    if (hashPin(pin) === sel.pin) onLogin(sel);
    else { setErr('PIN incorreto. Tente novamente.'); setPin(''); }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 600, background: 'var(--color-background-secondary)' }}>
      <div style={{ width: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '.08em', color: TEAL, marginBottom: 6 }}>PRUMA</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>Selecione seu perfil para acessar</div>
        </div>

        {!sel ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {users.map(u => (
              <div key={u.id} onClick={() => { setSel(u); setPin(''); setErr(''); }}
                style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'transform .1s' }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateX(4px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'none'}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{u.initials}</div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 15 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{u.pin ? '● ● ● ●  Protegido por PIN' : 'Clique para criar seu PIN'}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: sel.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{sel.initials}</div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 15 }}>{sel.name}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{sel.pin ? 'Digite seu PIN para entrar' : 'Você vai criar seu PIN agora'}</div>
              </div>
            </div>
            {sel.pin && (
              <div style={{ marginBottom: 12 }}>
                <input type="password" inputMode="numeric" placeholder="●  ●  ●  ●" value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && pin.length >= 4 && submit()}
                  style={{ ...S.inp, textAlign: 'center', fontSize: 26, letterSpacing: 12, paddingTop: 12, paddingBottom: 12 }} autoFocus />
                {err && <div style={{ color: RED, fontSize: 12, marginTop: 6 }}>{err}</div>}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={() => { setSel(null); setErr(''); }} style={S.btn('var(--color-background-secondary)', 'var(--color-text-primary)')}>← Voltar</button>
              <button onClick={submit} style={{ ...S.btn(sel.color), flex: 1 }}>{sel.pin ? 'Entrar' : 'Continuar →'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// PIN SETUP
// ═══════════════════════════════════════════════════════
function PinSetupScreen({ user, onSave }) {
  const [pin, setPin] = useState('');
  const [conf, setConf] = useState('');
  const [err, setErr] = useState('');

  const submit = () => {
    if (pin.length < 4) return setErr('PIN deve ter 4 a 6 dígitos');
    if (pin !== conf) return setErr('Os PINs não coincidem');
    onSave(pin);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 600, background: 'var(--color-background-secondary)' }}>
      <div style={{ ...S.card, width: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18, margin: '0 auto 14px' }}>{user.initials}</div>
          <div style={{ fontWeight: 500, fontSize: 17 }}>Bem-vinda(o), {user.name.split(' ')[0]}!</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6 }}>Crie um PIN de 4 a 6 dígitos para proteger seu acesso.</div>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <Field label="Novo PIN">
            <input type="password" inputMode="numeric" value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{ ...S.inp, textAlign: 'center', fontSize: 24, letterSpacing: 12, paddingTop: 10, paddingBottom: 10 }} autoFocus />
          </Field>
          <Field label="Confirmar PIN">
            <input type="password" inputMode="numeric" value={conf}
              onChange={e => setConf(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={{ ...S.inp, textAlign: 'center', fontSize: 24, letterSpacing: 12, paddingTop: 10, paddingBottom: 10 }} />
          </Field>
        </div>
        {err && <div style={{ color: RED, fontSize: 12, marginTop: 8 }}>{err}</div>}
        <button onClick={submit} style={{ ...S.btn(user.color), width: '100%', marginTop: 20, padding: '11px 0', fontSize: 14 }}>Criar PIN e Entrar</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════
function Sidebar({ page, setPage, user, onLogout }) {
  const nav = [
    { sec: 'Operacional' },
    { id: 'dashboard',    label: 'Dashboard',           icon: '▦' },
    { id: 'lancamentos',  label: 'Lançamentos',          icon: '⊟' },
    { id: 'clientes',     label: 'Clientes',             icon: '⊡' },
    { sec: 'Cadastros' },
    { id: 'plano',        label: 'Plano de Contas',      icon: '⊞' },
    { sec: 'Relatórios' },
    { id: 'dre',          label: 'DRE',                  icon: '↑' },
    { id: 'fluxo',        label: 'Fluxo de Caixa',       icon: '≈' },
    { id: 'crp',          label: 'C. Receber / Pagar',   icon: '↕' },
    { id: 'vendas',       label: 'Vendas por Serviço',   icon: '◈' },
    { id: 'ciclo',        label: 'Ciclo Financeiro',     icon: '⟳' },
    { sec: 'Ferramentas' },
    { id: 'conciliacao',  label: 'Conciliação Bancária', icon: '≡' },
    { id: 'audit',        label: 'Log de Auditoria',     icon: '⌕' },
  ];

  return (
    <div style={{ width: 220, background: DARK, display: 'flex', flexDirection: 'column', flexShrink: 0, minHeight: '100vh' }}>
      <div style={{ padding: '22px 18px 16px', borderBottom: '0.5px solid rgba(255,255,255,.06)' }}>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '.1em', color: TEAL, lineHeight: 1 }}>PRUMA</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
        {nav.map((item, i) => item.sec ? (
          <div key={i} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.12em', color: 'rgba(255,255,255,.3)', padding: '16px 10px 5px', textTransform: 'uppercase' }}>{item.sec}</div>
        ) : (
          <div key={item.id} onClick={() => setPage(item.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 13, marginBottom: 1,
              background: page === item.id ? `${TEAL}22` : 'transparent',
              color: page === item.id ? TEAL : 'rgba(255,255,255,.62)',
              fontWeight: page === item.id ? 500 : 400 }}>
            <span style={{ fontSize: 15, opacity: page === item.id ? 1 : 0.6 }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </div>

      <div style={{ padding: '14px 16px', borderTop: '0.5px solid rgba(255,255,255,.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{user.initials}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', lineHeight: 1.2 }}>{user.name.split(' ')[0]}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>Online agora</div>
          </div>
        </div>
        <div onClick={onLogout} style={{ fontSize: 12, color: 'rgba(255,255,255,.28)', cursor: 'pointer', paddingTop: 4 }}>Sair da conta</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════
function Dashboard({ lancamentos, clientes, periodo }) {
  const monthRange = buildMonthRange(periodo.start, periodo.end);
  const inPeriod = l => monthRange.includes(mk(l.dt_competencia));
  const realRec  = lancamentos.filter(l => l.tipo === 'receita'  && l.status === 'realizado' && inPeriod(l)).reduce((s, l) => s + l.valor, 0);
  const realDesp = lancamentos.filter(l => l.tipo === 'despesa'  && l.status === 'realizado' && inPeriod(l)).reduce((s, l) => s + l.valor, 0);
  const prevRec  = lancamentos.filter(l => l.tipo === 'receita'  && l.status === 'previsto'  && inPeriod(l)).reduce((s, l) => s + l.valor, 0);
  const aReceber = lancamentos.filter(l => l.tipo === 'receita'  && !l.dt_caixa_realizada).reduce((s, l) => s + l.valor, 0);
  const aPagar   = lancamentos.filter(l => l.tipo === 'despesa'  && !l.dt_caixa_realizada).reduce((s, l) => s + l.valor, 0);
  const resultado = realRec - realDesp;
  const margem   = realRec > 0 ? (resultado / realRec * 100).toFixed(1) + '%' : '—';

  const chartData = monthRange.map(m => ({
    name: ml(m),
    Receita: +lancamentos.filter(l => l.tipo === 'receita' && l.status === 'realizado' && mk(l.dt_competencia) === m).reduce((s, l) => s + l.valor, 0).toFixed(2),
    Despesa: +lancamentos.filter(l => l.tipo === 'despesa' && l.status === 'realizado' && mk(l.dt_competencia) === m).reduce((s, l) => s + l.valor, 0).toFixed(2),
  }));

  const proximos = lancamentos
    .filter(l => !l.dt_caixa_realizada && l.dt_caixa_prevista && l.dt_caixa_prevista >= today())
    .sort((a, b) => a.dt_caixa_prevista.localeCompare(b.dt_caixa_prevista))
    .slice(0, 7);

  const periodoLabel = monthRange.length === 1 ? ml(monthRange[0]) : ml(periodo.start) + ' — ' + ml(periodo.end);

  return (
    <div>
      <PageHeader title="Dashboard" action={<span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{periodoLabel}</span>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Receita Realizada" val={fmt(realRec)} color={TEAL} sub={periodoLabel} />
        <KpiCard label="Despesa Realizada" val={fmt(realDesp)} color={RED} sub={periodoLabel} />
        <KpiCard label="Resultado" val={fmt(resultado)} color={resultado >= 0 ? TEAL : RED} sub={margem + ' de margem'} />
        <KpiCard label="Receita Prevista" val={fmt(prevRec)} color={BLUE} sub="Não realizado ainda" />
        <KpiCard label="A Receber (total)" val={fmt(aReceber)} color={TEAL_D} />
        <KpiCard label="A Pagar (total)" val={fmt(aPagar)} color={AMBER} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Receita vs Despesa — {periodoLabel}</div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={chartData} barGap={3} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-tertiary)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={60}
                tickFormatter={v => 'R$' + Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(v)} />
              <Tooltip formatter={(v, n) => [fmt(v), n]} labelStyle={{ fontWeight: 500 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Receita" fill={TEAL} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Despesa" fill={RED} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Próximos vencimentos</div>
          {proximos.length === 0 && <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Nenhum vencimento pendente.</div>}
          {proximos.map(l => {
            const dias = diffDays(today(), l.dt_caixa_prevista);
            return (
              <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.descricao}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 }}>em {dias}d · {fmtDate(l.dt_caixa_prevista)}</div>
                </div>
                <div style={{ textAlign: 'right', marginLeft: 10, flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: l.tipo === 'receita' ? TEAL_D : RED }}>{fmt(l.valor)}</div>
                  <span style={S.tag(l.tipo === 'receita' ? TEAL_L : RED_L, l.tipo === 'receita' ? TEAL_D : RED)}>{l.tipo === 'receita' ? 'Receber' : 'Pagar'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// LANÇAMENTOS
// ═══════════════════════════════════════════════════════
// ── Bloco de Estrutura de Custos (usado no form de Lançamentos) ──
function CostBlock({ form, setF, calcCustos, plano }) {
  const custos = calcCustos(form);
  const despConta = plano.filter(p => p.tipo === 'despesa');
  const nAtivos = [form.comissao_ativo, form.imposto_ativo].filter(Boolean).length;

  const Row = ({ id, label, children }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--color-border-tertiary)', flexWrap: 'wrap' }}>
      <label htmlFor={id} style={{ fontWeight: 500, fontSize: 13, minWidth: 80, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
        <input type="checkbox" id={id}
          checked={id === 'chk-com' ? !!form.comissao_ativo : id === 'chk-imp' ? !!form.imposto_ativo : !!form.boleto_ativo}
          onChange={e => setF(id === 'chk-com' ? 'comissao_ativo' : id === 'chk-imp' ? 'imposto_ativo' : 'boleto_ativo', e.target.checked)}
          style={{ width: 15, height: 15, cursor: 'pointer', accentColor: TEAL }} />
        {label}
      </label>
      {children}
    </div>
  );

  return (
    <div style={{ marginTop: 4, padding: 14, background: 'var(--color-background-secondary)', borderRadius: 8, border: '1px solid var(--color-border-tertiary)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>
        Estrutura de Custos
      </div>

      {/* Comissão */}
      <Row id="chk-com" label="Comissão">
        {form.comissao_ativo && <>
          <input type="number" value={form.comissao_pct || ''} onChange={e => setF('comissao_pct', e.target.value)}
            style={{ ...S.inp, width: 70 }} placeholder="%" min="0" max="100" step="0.1" />
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>%</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: RED, minWidth: 90 }}>= {fmt(custos.comissao)}</span>
          <select value={form.comissao_conta_id || ''} onChange={e => setF('comissao_conta_id', e.target.value)}
            style={{ ...S.inp, flex: 1, minWidth: 160, fontSize: 11 }}>
            <option value="">Conta despesa...</option>
            {despConta.map(p => <option key={p.id} value={p.id}>{p.cod} — {p.nome}</option>)}
          </select>
        </>}
      </Row>

      {/* Imposto */}
      <Row id="chk-imp" label="Imposto">
        {form.imposto_ativo && <>
          <input type="number" value={form.imposto_pct || ''} onChange={e => setF('imposto_pct', e.target.value)}
            style={{ ...S.inp, width: 70 }} placeholder="%" min="0" max="100" step="0.1" />
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>%</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: RED, minWidth: 90 }}>= {fmt(custos.imposto)}</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>→ 2.1 Impostos · lançado 1x no mês de competência</span>
        </>}
      </Row>

      {/* Resumo */}
      {custos.total > 0 && (
        <div style={{ marginTop: 12, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div><span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Custo total: </span><strong style={{ color: RED }}>{fmt(custos.total)}</strong></div>
          <div><span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Margem: </span><strong style={{ color: custos.margem >= 0 ? TEAL_D : RED }}>{custos.margem.toFixed(1)}%</strong></div>
          {nAtivos > 0 && <span style={{ fontSize: 11, color: BLUE }}>⚡ {nAtivos} lançamento(s) de despesa serão criados na DRE</span>}
        </div>
      )}
    </div>
  );
}

function Lancamentos({ lancamentos, clientes, plano, currentUser, addAudit, saveLanc }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [filter, setFilter] = useState({ tipo: '', status: '', mes: '' });
  const [parcelar, setParcelar] = useState(false);
  const [numParcelas, setNumParcelas] = useState(2);
  const [primeiraData, setPrimeiraData] = useState('');
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const emptyForm = { tipo: 'receita', status: 'previsto', descricao: '', conta_id: '', cliente_id: '', valor: '', dt_competencia: today(), dt_caixa_prevista: '', dt_caixa_realizada: '',
    comissao_ativo: false, comissao_pct: '', comissao_conta_id: '',
    imposto_ativo: false, imposto_pct: '',
  };

  // Encontra contas do plano por prefixo de código
  const contaByPrefix = (prefix) => plano.find(p => p.cod?.startsWith(prefix) && p.tipo === 'despesa');

  // Calcula custo total estruturado
  const calcCustos = (f) => {
    const v = +f.valor || 0;
    const comissao = f.comissao_ativo ? +(v * (+f.comissao_pct || 0) / 100).toFixed(2) : 0;
    const imposto  = f.imposto_ativo  ? +(v * (+f.imposto_pct  || 0) / 100).toFixed(2) : 0;
    const total = comissao + imposto;
    const margem = v > 0 ? ((v - total) / v * 100) : 0;
    return { comissao, imposto, total, margem };
  };

  const addMonths = (dateStr, n) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    d.setMonth(d.getMonth() + n);
    return d.toISOString().slice(0, 10);
  };

  const onSave = async () => {
    if (!form.descricao?.trim() || !form.valor || !form.conta_id || !form.dt_competencia)
      return alert('Preencha: Descrição, Conta, Valor e Data de Competência.');

    const custos = calcCustos(form);


    // Comissão: prazo de caixa baseado na conta escolhida
    const buildComissao = (receitaId, descBase, valorBase, dtVcto, status, clienteId) => {
      if (!form.comissao_ativo || !+form.comissao_pct) return [];
      const valor = +(valorBase * (+form.comissao_pct) / 100).toFixed(2);
      if (!valor) return [];
      const conta = plano.find(p => p.id === form.comissao_conta_id) || contaByPrefix('3.2') || plano.find(p => p.tipo === 'despesa');
      const prazo = conta?.prazo_meses || 0;
      const dtCaixa = prazo > 0 ? addMonths(dtVcto, prazo) : dtVcto;
      return [{ id: uid(), tipo: 'despesa', descricao: `Comissão ${form.comissao_pct}% — ${descBase}`, conta_id: conta?.id || '', valor, custo: 0, dt_competencia: dtVcto, dt_caixa_prevista: dtCaixa, dt_caixa_realizada: '', status, cliente_id: clienteId, criado_por: currentUser.name, origem_id: receitaId }];
    };

    // Imposto: competência = mês da NF (dtVcto), caixa = dtVcto + prazo da conta 2.1
    const buildImposto = (descBase, valorBase, dtVcto, status, clienteId) => {
      if (!form.imposto_ativo || !+form.imposto_pct) return [];
      const valor = +(valorBase * (+form.imposto_pct) / 100).toFixed(2);
      if (!valor) return [];
      const conta = contaByPrefix('2.1') || plano.find(p => p.tipo === 'despesa');
      const prazo = conta?.prazo_meses ?? 1; // padrão 1 mês para impostos
      const dtCaixa = addMonths(dtVcto, prazo);
      return [{ id: uid(), tipo: 'despesa', descricao: `Imposto ${form.imposto_pct}% — ${descBase}`, conta_id: conta?.id || '', valor, custo: 0, dt_competencia: dtVcto, dt_caixa_prevista: dtCaixa, dt_caixa_realizada: '', status, cliente_id: clienteId, criado_por: currentUser.name }];
    };

    if (parcelar) {
      if (!primeiraData) return alert('Informe a data de vencimento da primeira parcela.');
      const n = +numParcelas || 2;
      const valorParcela = +(+form.valor / n).toFixed(2);
      const novos = Array.from({ length: n }, (_, i) => {
        const id = uid();
        const dtVcto = addMonths(primeiraData, i);
        // Cada parcela tem sua própria competência (mês da NF) e vencimento
        const rec = { ...form, id, descricao: `${form.descricao} (${i + 1}/${n})`, valor: valorParcela, custo: +(custos.total / n).toFixed(2), dt_competencia: dtVcto, dt_caixa_prevista: dtVcto, dt_caixa_realizada: '', status: 'previsto', criado_por: currentUser.name };
        const comissoes = buildComissao(id, `${form.descricao} (${i+1}/${n})`, valorParcela, dtVcto, 'previsto', form.cliente_id);
        const impostos  = buildImposto(`${form.descricao} (${i+1}/${n})`, valorParcela, dtVcto, 'previsto', form.cliente_id);
        return [rec, ...comissoes, ...impostos];
      }).flat();
      await saveLanc([...lancamentos, ...novos]);
      await addAudit('Criou lançamento parcelado', 'Lançamento', `${form.descricao} — ${n}x de ${fmt(valorParcela)}`);
    } else {
      const id = form.id || uid();
      const item = { ...form, id, valor: +form.valor || 0, custo: +custos.total.toFixed(2), criado_por: currentUser.name };
      const isNew = !form.id;
      const dtVcto = form.dt_caixa_prevista || form.dt_competencia;
      const comissoes = isNew ? buildComissao(id, form.descricao, item.valor, dtVcto, form.status, form.cliente_id) : [];
      const impostos  = isNew ? buildImposto(form.descricao, item.valor, dtVcto, form.status, form.cliente_id) : [];
      const base = isNew ? [...lancamentos, item] : lancamentos.map(l => l.id === item.id ? item : l);
      await saveLanc([...base, ...comissoes, ...impostos]);
      const nd = comissoes.length + impostos.length;
      await addAudit(isNew ? 'Criou lançamento' : 'Editou lançamento', 'Lançamento', item.descricao + (nd ? ` + ${nd} despesa(s) vinculada(s)` : ''));
    }
    setModal(false); setParcelar(false);
  };

  const onDel = async (id, desc) => {
    if (!confirm(`Excluir "${desc}"?`)) return;
    await saveLanc(lancamentos.filter(l => l.id !== id));
    await addAudit('Excluiu lançamento', 'Lançamento', desc);
  };

  const onBaixa = async (l) => {
    await saveLanc(lancamentos.map(x => x.id === l.id ? { ...x, dt_caixa_realizada: today(), status: 'realizado' } : x));
    await addAudit('Baixou lançamento', 'Lançamento', l.descricao);
  };

  const filtered = lancamentos
    .filter(l => (!filter.tipo || l.tipo === filter.tipo) && (!filter.status || l.status === filter.status) && (!filter.mes || mk(l.dt_competencia) === filter.mes))
    .sort((a, b) => (b.dt_competencia || '').localeCompare(a.dt_competencia || ''));

  const valorParcela = parcelar && form.valor && numParcelas ? +((+form.valor) / numParcelas).toFixed(2) : null;

  return (
    <div>
      <PageHeader title="Lançamentos" action={
        <button onClick={() => { setForm(emptyForm); setParcelar(false); setPrimeiraData(''); setModal(true); }} style={S.btn(TEAL)}>+ Novo Lançamento</button>
      } />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['', 'Todos'], ['receita', 'Receitas'], ['despesa', 'Despesas']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(f => ({ ...f, tipo: v }))}
            style={S.sm(filter.tipo === v ? TEAL : 'var(--color-background-primary)', filter.tipo === v ? '#fff' : 'var(--color-text-secondary)')}>{l}</button>
        ))}
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} style={{ ...S.inp, width: 135, padding: '5px 10px', fontSize: 12 }}>
          <option value="">Todos status</option>
          <option value="previsto">Previsto</option>
          <option value="realizado">Realizado</option>
        </select>
        <input type="month" value={filter.mes} onChange={e => setFilter(f => ({ ...f, mes: e.target.value }))} style={{ ...S.inp, width: 145, padding: '5px 10px', fontSize: 12 }} />
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginLeft: 4 }}>{filtered.length} registros</span>
      </div>

      <div style={S.card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Descrição','Tipo','Conta','Cliente','Valor','Competência','Vencimento','Baixa','Status','Ações'].map(h =>
                <th key={h} style={S.TH}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <EmptyRow cols={10} msg="Nenhum lançamento encontrado. Clique em '+ Novo Lançamento' para começar." />}
              {filtered.map(l => {
                const cli   = clientes.find(c => c.id === l.cliente_id);
                const conta = plano.find(p => p.id === l.conta_id);
                const venc  = !l.dt_caixa_realizada && l.dt_caixa_prevista && l.dt_caixa_prevista < today();
                return (
                  <tr key={l.id}>
                    <td style={S.TD}><span style={{ fontWeight: 500 }}>{l.descricao}</span></td>
                    <td style={S.TD}><span style={S.tag(l.tipo === 'receita' ? TEAL_L : RED_L, l.tipo === 'receita' ? TEAL_D : RED)}>{l.tipo === 'receita' ? 'Receita' : 'Despesa'}</span></td>
                    <td style={{ ...S.TD, fontSize: 12, color: 'var(--color-text-secondary)' }}>{conta?.nome || '—'}</td>
                    <td style={{ ...S.TD, fontSize: 12 }}>{cli?.nome || '—'}</td>
                    <td style={{ ...S.TD, fontWeight: 600, color: l.tipo === 'receita' ? TEAL_D : RED }}>{fmt(l.valor)}</td>
                    <td style={{ ...S.TD, fontSize: 12 }}>{fmtDate(l.dt_competencia)}</td>
                    <td style={{ ...S.TD, fontSize: 12, color: venc ? RED : undefined }}>{fmtDate(l.dt_caixa_prevista)}{venc && ' ⚠'}</td>
                    <td style={{ ...S.TD, fontSize: 12 }}>{fmtDate(l.dt_caixa_realizada)}</td>
                    <td style={S.TD}><span style={S.tag(l.status === 'realizado' ? GREEN_L : AMBER_L, l.status === 'realizado' ? GREEN : AMBER)}>{l.status === 'realizado' ? 'Realizado' : 'Previsto'}</span></td>
                    <td style={S.TD}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {!l.dt_caixa_realizada && <button onClick={() => onBaixa(l)} title="Dar baixa" style={S.sm(TEAL_L, TEAL_D)}>✓</button>}
                        <button onClick={() => { setForm({ ...l }); setParcelar(false); setModal(true); }} style={S.sm('var(--color-background-secondary)', 'var(--color-text-secondary)')}>✎</button>
                        <button onClick={() => onDel(l.id, l.descricao)} style={S.sm(RED_L, RED)}>✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title={form.id ? 'Editar Lançamento' : 'Novo Lançamento'} onClose={() => { setModal(false); setParcelar(false); }} width={580}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Descrição *" col="1 / -1">
              <input value={form.descricao || ''} onChange={e => setF('descricao', e.target.value)} style={S.inp} autoFocus />
            </Field>
            <Field label="Tipo *">
              <select value={form.tipo || 'receita'} onChange={e => { setF('tipo', e.target.value); setF('conta_id', ''); }} style={S.inp}>
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
              </select>
            </Field>
            <Field label="Conta (Plano de Contas) *">
              <select value={form.conta_id || ''} onChange={e => {
                const id = e.target.value;
                setF('conta_id', id);
                const conta = plano.find(p => p.id === id);
                if (conta?.prazo_meses > 0 && form.dt_competencia) {
                  setF('dt_caixa_prevista', addMonths(form.dt_competencia, conta.prazo_meses));
                }
              }} style={S.inp}>
                <option value="">Selecione...</option>
                {plano.filter(p => p.tipo === (form.tipo || 'receita')).map(p =>
                  <option key={p.id} value={p.id}>{p.cod} — {p.nome}{p.prazo_meses > 0 ? ` (+${p.prazo_meses}m caixa)` : ''}</option>)}
              </select>
            </Field>
            <Field label="Cliente">
              <select value={form.cliente_id || ''} onChange={e => setF('cliente_id', e.target.value)} style={S.inp}>
                <option value="">— Nenhum —</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Field>
            <Field label={parcelar ? 'Valor Total (R$) *' : 'Valor (R$) *'}>
              <input type="number" value={form.valor || ''} onChange={e => setF('valor', e.target.value)} style={S.inp} min="0" step="0.01" />
            </Field>
          </div>

          {/* ── Estrutura de Custos (só para Receitas) ── */}
          {form.tipo === 'receita' && <CostBlock form={form} setF={setF} calcCustos={calcCustos} plano={plano} />}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <Field label="Data de Competência *">
              <input type="date" value={form.dt_competencia || ''} onChange={e => setF('dt_competencia', e.target.value)} style={S.inp} />
            </Field>
            {!parcelar && (
              <Field label="Vencimento (Caixa Previsto)">
                <input type="date" value={form.dt_caixa_prevista || ''} onChange={e => setF('dt_caixa_prevista', e.target.value)} style={S.inp} />
              </Field>
            )}
            {!parcelar && (
              <Field label="Data de Receb. / Pagamento">
                <input type="date" value={form.dt_caixa_realizada || ''} onChange={e => { setF('dt_caixa_realizada', e.target.value); if (e.target.value) setF('status', 'realizado'); }} style={S.inp} />
              </Field>
            )}
            {!parcelar && (
              <Field label="Status">
                <select value={form.status || 'previsto'} onChange={e => setF('status', e.target.value)} style={S.inp}>
                  <option value="previsto">Previsto</option>
                  <option value="realizado">Realizado</option>
                </select>
              </Field>
            )}
          </div>

          {/* Parcelamento */}
          {!form.id && (
            <div style={{ marginTop: 16, padding: 14, background: parcelar ? TEAL_L : 'var(--color-background-secondary)', borderRadius: 8, border: `1px solid ${parcelar ? TEAL : 'var(--color-border-tertiary)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: parcelar ? 14 : 0 }}>
                <input type="checkbox" id="parcelar" checked={parcelar} onChange={e => setParcelar(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: TEAL }} />
                <label htmlFor="parcelar" style={{ fontWeight: 500, cursor: 'pointer', color: TEAL_D, fontSize: 13 }}>
                  Parcelar este lançamento
                </label>
              </div>
              {parcelar && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Número de parcelas">
                    <input type="number" value={numParcelas} onChange={e => setNumParcelas(Math.max(2, Math.min(48, +e.target.value)))} style={S.inp} min="2" max="48" />
                  </Field>
                  <Field label="Vencimento da 1ª parcela">
                    <input type="date" value={primeiraData} onChange={e => setPrimeiraData(e.target.value)} style={S.inp} />
                  </Field>
                  {valorParcela && (
                    <div style={{ gridColumn: '1 / -1', background: '#fff', borderRadius: 6, padding: '10px 14px', border: `1px solid ${TEAL_L}` }}>
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Serão criados </span>
                      <strong style={{ color: TEAL_D }}>{numParcelas} lançamentos</strong>
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}> de </span>
                      <strong style={{ color: TEAL_D }}>{fmt(valorParcela)}</strong>
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}> com vencimento mensal a partir de {fmtDate(primeiraData || today())}.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
            <button onClick={() => { setModal(false); setParcelar(false); }} style={S.btn('var(--color-background-secondary)', 'var(--color-text-primary)')}>Cancelar</button>
            <button onClick={onSave} style={S.btn(TEAL)}>
              {parcelar ? `Gerar ${numParcelas} Parcelas` : 'Salvar Lançamento'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// CLIENTES
// ═══════════════════════════════════════════════════════
function Clientes({ clientes, lancamentos, currentUser, addAudit, saveCli }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const onSave = async () => {
    if (!form.nome?.trim()) return alert('Nome é obrigatório.');
    const item = { ...form, id: form.id || uid() };
    const isNew = !form.id;
    await saveCli(isNew ? [...clientes, item] : clientes.map(c => c.id === item.id ? item : c));
    await addAudit(isNew ? 'Criou cliente' : 'Editou cliente', 'Cliente', item.nome);
    setModal(false);
  };

  const onDel = async (id, nome) => {
    if (!confirm(`Excluir "${nome}"?`)) return;
    await saveCli(clientes.filter(c => c.id !== id));
    await addAudit('Excluiu cliente', 'Cliente', nome);
  };

  return (
    <div>
      <PageHeader title="Clientes" action={
        <button onClick={() => { setForm({ tipo: 'retainer', status: 'ativo' }); setModal(true); }} style={S.btn(TEAL)}>+ Novo Cliente</button>
      } />
      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Nome / Razão Social','CNPJ','Tipo','Retainer Mensal','Dia Vcto','Contato','Status',''].map(h => <th key={h} style={S.TH}>{h}</th>)}</tr></thead>
          <tbody>
            {clientes.length === 0 && <EmptyRow cols={8} msg="Nenhum cliente cadastrado. Clique em '+ Novo Cliente'." />}
            {clientes.map(c => {
              const tot = lancamentos.filter(l => l.cliente_id === c.id && l.tipo === 'receita' && l.status === 'realizado').reduce((s, l) => s + l.valor, 0);
              return (
                <tr key={c.id}>
                  <td style={S.TD}>
                    <div style={{ fontWeight: 500 }}>{c.nome}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{fmt(tot)} faturado</div>
                  </td>
                  <td style={{ ...S.TD, fontSize: 12 }}>{c.cnpj || '—'}</td>
                  <td style={S.TD}><span style={S.tag(c.tipo === 'retainer' ? BLUE_L : AMBER_L, c.tipo === 'retainer' ? BLUE : AMBER)}>{c.tipo === 'retainer' ? 'Retainer' : 'Avulso'}</span></td>
                  <td style={{ ...S.TD, fontWeight: 500 }}>{c.valor_retainer ? fmt(c.valor_retainer) : '—'}</td>
                  <td style={{ ...S.TD, fontSize: 12 }}>{c.dia_vencimento ? `Dia ${c.dia_vencimento}` : '—'}</td>
                  <td style={{ ...S.TD, fontSize: 12 }}>{c.contato || '—'}</td>
                  <td style={S.TD}><span style={S.tag(c.status === 'ativo' ? GREEN_L : 'var(--color-background-secondary)', c.status === 'ativo' ? GREEN : 'var(--color-text-secondary)')}>{c.status === 'ativo' ? 'Ativo' : 'Inativo'}</span></td>
                  <td style={S.TD}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => { setForm({ ...c }); setModal(true); }} style={S.sm('var(--color-background-secondary)', 'var(--color-text-secondary)')}>✎</button>
                      <button onClick={() => onDel(c.id, c.nome)} style={S.sm(RED_L, RED)}>✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={form.id ? 'Editar Cliente' : 'Novo Cliente'} onClose={() => setModal(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Nome / Razão Social *" col="1 / -1">
              <input value={form.nome || ''} onChange={e => setF('nome', e.target.value)} style={S.inp} autoFocus />
            </Field>
            <Field label="CNPJ">
              <input value={form.cnpj || ''} onChange={e => setF('cnpj', e.target.value)} style={S.inp} placeholder="00.000.000/0001-00" />
            </Field>
            <Field label="Tipo de Contrato">
              <select value={form.tipo || 'retainer'} onChange={e => setF('tipo', e.target.value)} style={S.inp}>
                <option value="retainer">Retainer / Mensalidade</option>
                <option value="avulso">Projeto Avulso</option>
              </select>
            </Field>
            {form.tipo === 'retainer' && <>
              <Field label="Valor Retainer (R$/mês)">
                <input type="number" value={form.valor_retainer || ''} onChange={e => setF('valor_retainer', +e.target.value)} style={S.inp} min="0" step="0.01" />
              </Field>
              <Field label="Dia de Vencimento">
                <input type="number" value={form.dia_vencimento || ''} onChange={e => setF('dia_vencimento', e.target.value)} style={S.inp} min="1" max="31" />
              </Field>
            </>}
            <Field label="Contato (e-mail / WhatsApp)" col="1 / -1">
              <input value={form.contato || ''} onChange={e => setF('contato', e.target.value)} style={S.inp} />
            </Field>
            <Field label="Status">
              <select value={form.status || 'ativo'} onChange={e => setF('status', e.target.value)} style={S.inp}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 22, justifyContent: 'flex-end' }}>
            <button onClick={() => setModal(false)} style={S.btn('var(--color-background-secondary)', 'var(--color-text-primary)')}>Cancelar</button>
            <button onClick={onSave} style={S.btn(TEAL)}>Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// PLANO DE CONTAS
// ═══════════════════════════════════════════════════════
function PlanoContas({ plano, currentUser, addAudit, savePlano }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const onSave = async () => {
    if (!form.nome?.trim() || !form.cod?.trim()) return alert('Código e Nome são obrigatórios.');
    const item = { ...form, id: form.id || uid(), prazo_meses: +form.prazo_meses || 0 };
    const isNew = !form.id;
    const next = isNew ? [...plano, item] : plano.map(p => p.id === item.id ? item : p);
    await savePlano(next.sort((a, b) => a.cod.localeCompare(b.cod)));
    await addAudit(isNew ? 'Criou conta' : 'Editou conta', 'Plano de Contas', `${item.cod} ${item.nome}`);
    setModal(false);
  };

  const onDel = async (id, nome) => {
    if (!confirm(`Excluir "${nome}"?`)) return;
    await savePlano(plano.filter(p => p.id !== id));
    await addAudit('Excluiu conta', 'Plano de Contas', nome);
  };

  const grupos = [...new Set(plano.map(p => p.grupo))];

  const renderSide = (tipo) => {
    const items = plano.filter(p => p.tipo === tipo).sort((a, b) => a.cod.localeCompare(b.cod));
    const byGrupo = {};
    items.forEach(p => { if (!byGrupo[p.grupo]) byGrupo[p.grupo] = []; byGrupo[p.grupo].push(p); });
    return Object.entries(byGrupo).map(([grupo, contas]) => (
      <div key={grupo} style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: tipo === 'receita' ? TEAL_D : RED, background: tipo === 'receita' ? TEAL_L : RED_L, borderRadius: 5, padding: '4px 10px', marginBottom: 2 }}>{grupo}</div>
        {contas.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', borderBottom: '0.5px solid var(--color-border-tertiary)', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', width: 36, flexShrink: 0 }}>{p.cod}</span>
            <span style={{ flex: 1, fontSize: 13 }}>{p.nome}</span>
            {(p.prazo_meses > 0) && (
              <span title="Prazo médio de caixa" style={{ fontSize: 10, fontWeight: 600, color: BLUE, background: BLUE_L, borderRadius: 4, padding: '2px 7px', flexShrink: 0 }}>
                +{p.prazo_meses}m
              </span>
            )}
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => { setForm({ ...p }); setModal(true); }} style={S.sm('var(--color-background-secondary)', 'var(--color-text-secondary)')}>✎</button>
              <button onClick={() => onDel(p.id, p.nome)} style={S.sm(RED_L, RED)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    ));
  };

  return (
    <div>
      <PageHeader title="Plano de Contas" action={
        <button onClick={() => { setForm({ tipo: 'receita', cod: '', nome: '', grupo: '', prazo_meses: 0 }); setModal(true); }} style={S.btn(TEAL)}>+ Nova Conta</button>
      } />

      <div style={{ ...S.card, marginBottom: 16, fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13 }}>ℹ️</span>
        <span>O campo <strong>Prazo de Caixa</strong> (badge <span style={{ color: BLUE }}>+1m</span>) define quantos meses após a competência o valor entra/sai do caixa. Ex: Impostos = +1 mês, Pessoal = +1 mês.</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={S.card}>
          <div style={{ fontSize: 14, fontWeight: 600, color: TEAL_D, marginBottom: 14 }}>Receitas</div>
          {renderSide('receita')}
        </div>
        <div style={S.card}>
          <div style={{ fontSize: 14, fontWeight: 600, color: RED, marginBottom: 14 }}>Custos e Despesas</div>
          {renderSide('despesa')}
        </div>
      </div>

      {modal && (
        <Modal title={form.id ? 'Editar Conta' : 'Nova Conta'} onClose={() => setModal(false)} width={420}>
          <div style={{ display: 'grid', gap: 12 }}>
            <Field label="Tipo">
              <select value={form.tipo || 'receita'} onChange={e => setF('tipo', e.target.value)} style={S.inp}>
                <option value="receita">Receita</option>
                <option value="despesa">Despesa / Custo</option>
              </select>
            </Field>
            <Field label="Código *">
              <input value={form.cod || ''} onChange={e => setF('cod', e.target.value)} style={S.inp} placeholder="ex: 1.6" autoFocus />
            </Field>
            <Field label="Nome da Conta *">
              <input value={form.nome || ''} onChange={e => setF('nome', e.target.value)} style={S.inp} />
            </Field>
            <Field label="Grupo">
              <input list="grupos-dl" value={form.grupo || ''} onChange={e => setF('grupo', e.target.value)} style={S.inp} placeholder="ex: Receita Operacional" />
              <datalist id="grupos-dl">{grupos.map(g => <option key={g} value={g} />)}</datalist>
            </Field>
            <Field label="Prazo de Caixa (meses após competência)">
              <input type="number" value={form.prazo_meses || 0} onChange={e => setF('prazo_meses', e.target.value)}
                style={S.inp} min="0" max="12" step="1" />
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                0 = mesmo mês · 1 = mês seguinte (impostos, pessoal) · 2 = dois meses depois
              </div>
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
            <button onClick={() => setModal(false)} style={S.btn('var(--color-background-secondary)', 'var(--color-text-primary)')}>Cancelar</button>
            <button onClick={onSave} style={S.btn(TEAL)}>Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// DRE
// ═══════════════════════════════════════════════════════
function DRE({ lancamentos, plano, periodo }) {
  const [startMonth, setStartMonth] = useState(periodo.start);
  const [endMonth, setEndMonth]     = useState(periodo.end);
  const [view, setView]             = useState('realizado');
  const [showAV, setShowAV]         = useState(true);
  const [showAH, setShowAH]         = useState(true);
  useEffect(() => { setStartMonth(periodo.start); setEndMonth(periodo.end); }, [periodo.start, periodo.end]);

  const monthRange = useMemo(() => buildMonthRange(startMonth, endMonth), [startMonth, endMonth]);
  const sf = view === 'realizado' ? 'realizado' : null; // statusFilter

  // Sum a group of plano accounts for a month
  const sumG = (grupo, month, tipo_filter) =>
    plano.filter(p => p.grupo === grupo && (!tipo_filter || p.tipo === tipo_filter))
      .reduce((s, p) => s + lancamentos.filter(l =>
        l.conta_id === p.id && mk(l.dt_competencia) === month && (!sf || l.status === sf)
      ).reduce((ss, l) => ss + l.valor, 0), 0);

  const sumConta = (id, month) =>
    lancamentos.filter(l => l.conta_id === id && mk(l.dt_competencia) === month && (!sf || l.status === sf))
      .reduce((s, l) => s + l.valor, 0);

  // Sequential computation per month → all DRE lines
  const compute = (month) => {
    const recBruta   = sumG('Receita Operacional', month);
    const deducoes   = sumG('Deduções sobre Vendas', month);
    const recLiq     = recBruta - deducoes;
    const cvs        = sumG('Custos Variáveis', month);
    const lucroBruto = recLiq - cvs;
    const despVar    = sumG('Despesas Variáveis', month);
    const margContrib = lucroBruto - despVar;
    const despFix    = sumG('Despesas Fixas', month);
    const ebitda     = margContrib - despFix;
    const outrasRec  = sumG('Outras Receitas e Despesas', month, 'receita');
    const outrasDes  = sumG('Outras Receitas e Despesas', month, 'despesa');
    const antesIR    = ebitda + outrasRec - outrasDes;
    const ir         = sumG('IR e CSLL', month);
    const resLiq     = antesIR - ir;
    const pe         = (recBruta > 0 && margContrib > 0) ? despFix / (margContrib / recBruta) : 0;
    return { recBruta, deducoes, recLiq, cvs, lucroBruto, despVar, margContrib, despFix, ebitda, outrasRec, outrasDes, antesIR, ir, resLiq, pe };
  };

  const allVals = useMemo(() => {
    const out = {};
    for (const m of monthRange) out[m] = compute(m);
    return out;
  }, [lancamentos, monthRange, view, plano]);

  // Account-level values
  const contaVal = (id, month) => sumConta(id, month);

  // CSV export
  const exportCSV2 = () => {
    const g = (grupo, tipo_f) => plano.filter(p => p.grupo === grupo && (!tipo_f || p.tipo === tipo_f));
    const rows = [['Linha DRE', ...monthRange.map(ml), 'Total']];
    const addRow = (label, fn, isMargin) => {
      const vals = monthRange.map(fn);
      const total = isMargin ? null : vals.reduce((a, b) => a + b, 0);
      rows.push([label, ...vals.map(v => isMargin ? v.toFixed(1) + '%' : v), total ?? '']);
    };
    const addConta = (p) => addRow(`  ${p.cod} ${p.nome}`, m => contaVal(p.id, m), false);
    const addTotal = (label, key) => addRow(label, m => allVals[m]?.[key] ?? 0, false);
    const addMarg  = (label, num, den) => addRow(label, m => {
      const d = allVals[m]?.[den] ?? 0;
      return d !== 0 ? (allVals[m]?.[num] ?? 0) / d * 100 : 0;
    }, true);
    rows.push(['1. RECEITA OPERACIONAL BRUTA']);
    g('Receita Operacional').forEach(addConta);
    addTotal('RECEITA OPERACIONAL BRUTA', 'recBruta');
    rows.push(['2. DEDUÇÕES SOBRE VENDAS']);
    g('Deduções sobre Vendas').forEach(addConta);
    addTotal('RECEITA LÍQUIDA', 'recLiq');
    rows.push(['3. CUSTOS VARIÁVEIS (CVS)']);
    g('Custos Variáveis').forEach(addConta);
    addTotal('LUCRO BRUTO', 'lucroBruto');
    addMarg('Margem Bruta %', 'lucroBruto', 'recBruta');
    rows.push(['4. DESPESAS VARIÁVEIS']);
    g('Despesas Variáveis').forEach(addConta);
    addTotal('MARGEM DE CONTRIBUIÇÃO', 'margContrib');
    addMarg('Margem de Contribuição %', 'margContrib', 'recBruta');
    rows.push(['5. DESPESAS FIXAS (G&A)']);
    g('Despesas Fixas').forEach(addConta);
    addTotal('EBITDA', 'ebitda');
    addMarg('Margem EBITDA %', 'ebitda', 'recBruta');
    rows.push(['6. OUTRAS RECEITAS E DESPESAS']);
    g('Outras Receitas e Despesas').forEach(addConta);
    addTotal('RESULTADO ANTES DO IR', 'antesIR');
    rows.push(['7. IR E CSLL']);
    g('IR e CSLL').forEach(addConta);
    addTotal('RESULTADO LÍQUIDO', 'resLiq');
    addMarg('Margem Líquida %', 'resLiq', 'recBruta');
    exportCSV(rows, `DRE_Pruma_${startMonth}_${endMonth}.csv`);
  };

  // Render helpers
  const fmtPct = v => v === 0 ? '—' : (v > 0 ? '' : '') + v.toFixed(1) + '%';
  const fmtAH  = (cur, prev) => prev !== 0 ? (cur - prev) / Math.abs(prev) * 100 : null;
  const btnToggle = (active, label, fn, color = BLUE) =>
    <button onClick={fn} style={S.sm(active ? color : 'var(--color-background-primary)', active ? '#fff' : 'var(--color-text-secondary)')}>{label}</button>;

  const DARK_HDR = '#111827';

  // Section themes
  const secTheme = {
    'Receita Operacional':        { bg: TEAL_L, color: TEAL_D },
    'Deduções sobre Vendas':      { bg: RED_L,  color: RED },
    'Custos Variáveis':           { bg: RED_L,  color: RED },
    'Despesas Variáveis':         { bg: RED_L,  color: RED },
    'Despesas Fixas':             { bg: RED_L,  color: RED },
    'Outras Receitas e Despesas': { bg: BLUE_L, color: BLUE },
    'IR e CSLL':                  { bg: AMBER_L,color: AMBER },
  };

  const renderSection = (num, label, grupo, tipo_f, totalKey, totalLabel, marginKey, marginLabel, highlight) => {
    const contas = plano.filter(p => p.grupo === grupo && (!tipo_f || p.tipo === tipo_f)).sort((a,b) => a.cod.localeCompare(b.cod));
    const theme = secTheme[grupo] || { bg: BLUE_L, color: BLUE };
    const totalVals = monthRange.map(m => allVals[m]?.[totalKey] ?? 0);
    const grandTotal = totalVals.reduce((a,b) => a+b, 0);
    const totalRB = monthRange.reduce((s,m) => s + (allVals[m]?.recBruta ?? 0), 0);

    return [
      // Section header
      <tr key={`sec-${grupo}`}>
        <td colSpan={monthRange.length + 2 + (showAV ? 1 : 0)} style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: theme.color, background: theme.bg, textTransform: 'uppercase', position: 'sticky', left: 0 }}>
          {num}. {label}
        </td>
      </tr>,
      // Account rows
      ...contas.map(p => {
        const mv = monthRange.map(m => contaVal(p.id, m));
        const tot = mv.reduce((a,b) => a+b, 0);
        return (
          <tr key={p.id} style={{ background: 'var(--color-background-primary)' }}>
            <td style={{ ...S.TD, fontSize: 12, paddingLeft: 24, color: 'var(--color-text-secondary)', position: 'sticky', left: 0, background: 'var(--color-background-primary)' }}>{p.cod}  {p.nome}</td>
            {mv.map((v, i) => {
              const prev = i > 0 ? contaVal(p.id, monthRange[i-1]) : null;
              const ah = prev !== null ? fmtAH(v, prev) : null;
              return <td key={monthRange[i]} style={{ ...S.TD, textAlign: 'right', fontSize: 12, background: 'var(--color-background-primary)' }}>
                <div>{v ? fmt(v) : '—'}</div>
                {showAH && ah !== null && <div style={{ fontSize: 9, color: ah >= 0 ? TEAL_D : RED }}>{ah >= 0 ? '▲' : '▼'} {Math.abs(ah).toFixed(1)}%</div>}
              </td>;
            })}
            <td style={{ ...S.TD, textAlign: 'right', fontSize: 12, fontWeight: 500, background: 'var(--color-background-primary)' }}>{tot ? fmt(tot) : '—'}</td>
            {showAV && <td style={{ ...S.TD, textAlign: 'right', fontSize: 10, color: BLUE, background: 'var(--color-background-primary)' }}>{totalRB > 0 ? fmtPct(tot/totalRB*100) : '—'}</td>}
          </tr>
        );
      }),
      // Total row
      <tr key={`tot-${totalKey}`} style={{ background: highlight ? TEAL_L : 'var(--color-background-secondary)', borderTop: '1px solid var(--color-border-tertiary)' }}>
        <td style={{ ...S.TD, fontWeight: highlight ? 800 : 700, fontSize: highlight ? 14 : 13, color: DARK, position: 'sticky', left: 0, background: highlight ? TEAL_L : 'var(--color-background-secondary)', paddingLeft: 12 }}>{totalLabel}</td>
        {totalVals.map((v, i) => {
          const prev = i > 0 ? (allVals[monthRange[i-1]]?.[totalKey] ?? 0) : null;
          const ah = prev !== null ? fmtAH(v, prev) : null;
          const rb = allVals[monthRange[i]]?.recBruta ?? 0;
          const av = rb > 0 ? v / rb * 100 : null;
          return <td key={monthRange[i]} style={{ ...S.TD, textAlign: 'right', fontWeight: 700, color: v >= 0 ? TEAL_D : RED, background: highlight ? TEAL_L : 'var(--color-background-secondary)' }}>
            <div style={{ fontSize: highlight ? 14 : 13 }}>{v ? fmt(v) : '—'}</div>
            {showAV && av !== null && <div style={{ fontSize: 9, color: BLUE }}>{fmtPct(av)}</div>}
            {showAH && ah !== null && <div style={{ fontSize: 9, color: ah >= 0 ? TEAL_D : RED }}>{ah >= 0 ? '▲' : '▼'}{Math.abs(ah).toFixed(1)}%</div>}
          </td>;
        })}
        <td style={{ ...S.TD, textAlign: 'right', fontWeight: 800, color: grandTotal >= 0 ? TEAL_D : RED, background: highlight ? TEAL_L : 'var(--color-background-secondary)', fontSize: highlight ? 14 : 13 }}>{grandTotal ? fmt(grandTotal) : '—'}</td>
        {showAV && <td style={{ ...S.TD, textAlign: 'right', fontSize: 10, color: BLUE, background: highlight ? TEAL_L : 'var(--color-background-secondary)' }}>{totalRB > 0 ? fmtPct(grandTotal/totalRB*100) : '—'}</td>}
      </tr>,
      // Margin row (if requested)
      ...(marginKey ? [
        <tr key={`marg-${marginKey}`} style={{ background: 'var(--color-background-secondary)' }}>
          <td style={{ ...S.TD, fontSize: 11, fontStyle: 'italic', color: BLUE, paddingLeft: 16, position: 'sticky', left: 0, background: 'var(--color-background-secondary)' }}>{marginLabel}</td>
          {monthRange.map((m, i) => {
            const v = allVals[m]?.[totalKey] ?? 0;
            const rb = allVals[m]?.recBruta ?? 0;
            const pct = rb > 0 ? v / rb * 100 : 0;
            return <td key={m} style={{ ...S.TD, textAlign: 'right', fontSize: 11, color: pct >= 0 ? TEAL_D : RED, fontWeight: 600, background: 'var(--color-background-secondary)' }}>{fmtPct(pct)}</td>;
          })}
          <td style={{ ...S.TD, textAlign: 'right', fontSize: 11, color: grandTotal >= 0 ? TEAL_D : RED, fontWeight: 600, background: 'var(--color-background-secondary)' }}>{totalRB > 0 ? fmtPct(grandTotal/totalRB*100) : '—'}</td>
          {showAV && <td />}
        </tr>
      ] : []),
    ];
  };

  return (
    <div>
      <PageHeader title="DRE — Demonstrativo de Resultado" action={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>De:</span>
          <input type="month" value={startMonth} onChange={e => setStartMonth(e.target.value)} style={{ ...S.inp, width: 130, padding: '6px 10px', fontSize: 12 }} />
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Até:</span>
          <input type="month" value={endMonth} onChange={e => setEndMonth(e.target.value)} style={{ ...S.inp, width: 130, padding: '6px 10px', fontSize: 12 }} />
          <button onClick={exportCSV2} style={S.btn(TEAL_D)}>↓ CSV</button>
        </div>
      } />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {btnToggle(view === 'realizado', 'Realizado', () => setView('realizado'), TEAL)}
        {btnToggle(view === 'orcado', 'Orçado (Total)', () => setView('orcado'), TEAL)}
        <div style={{ width: 1, height: 16, background: 'var(--color-border-tertiary)' }} />
        {btnToggle(showAV, 'AV% ' + (showAV ? '✓' : ''), () => setShowAV(v => !v))}
        {btnToggle(showAH, 'AH% ' + (showAH ? '✓' : ''), () => setShowAH(v => !v))}
        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>AV% = % da Receita Bruta · AH% = variação vs mês anterior</span>
      </div>

      <div style={{ ...S.card, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: monthRange.length * 140 + 260 }}>
          <thead>
            <tr>
              <th style={{ ...S.TH, textAlign: 'left', minWidth: 250, position: 'sticky', left: 0, background: DARK_HDR, zIndex: 2 }}>Conta</th>
              {monthRange.map(m => <th key={m} style={{ ...S.TH, textAlign: 'center', minWidth: 130, background: mk(today()) === m ? `${TEAL}BB` : DARK_HDR }}>{ml(m)}{mk(today()) === m ? ' ●' : ''}</th>)}
              <th style={{ ...S.TH, textAlign: 'right', background: '#0a1628', minWidth: 120 }}>Total</th>
              {showAV && <th style={{ ...S.TH, textAlign: 'right', background: '#0a1628', fontSize: 9, color: TEAL }}>AV%</th>}
            </tr>
          </thead>
          <tbody>
            {renderSection('1', 'RECEITA OPERACIONAL BRUTA',  'Receita Operacional',        null,      'recBruta',    'RECEITA OPERACIONAL BRUTA', null, null, false)}
            {renderSection('2', 'DEDUÇÕES SOBRE VENDAS',       'Deduções sobre Vendas',     null,      'recLiq',      'RECEITA LÍQUIDA',           null, null, false)}

            {/* Margem Receita Líquida standalone */}
            <tr style={{ background: 'var(--color-background-secondary)' }}>
              <td style={{ ...S.TD, fontSize: 11, fontStyle: 'italic', color: BLUE, paddingLeft: 16, position: 'sticky', left: 0, background: 'var(--color-background-secondary)' }}>Margem Receita Líquida %</td>
              {monthRange.map(m => { const v = allVals[m]; const pct = v?.recBruta > 0 ? v.recLiq/v.recBruta*100 : 0; return <td key={m} style={{ ...S.TD, textAlign: 'right', fontSize: 11, color: pct >= 0 ? TEAL_D : RED, fontWeight: 600, background: 'var(--color-background-secondary)' }}>{fmtPct(pct)}</td>; })}
              <td style={{ ...S.TD, textAlign: 'right', fontSize: 11, color: TEAL_D, background: 'var(--color-background-secondary)' }}>
                {(() => { const rb = monthRange.reduce((s,m)=>s+(allVals[m]?.recBruta??0),0); const rl = monthRange.reduce((s,m)=>s+(allVals[m]?.recLiq??0),0); return rb > 0 ? fmtPct(rl/rb*100) : '—'; })()}
              </td>
              {showAV && <td />}
            </tr>

            {renderSection('3', 'CUSTOS VARIÁVEIS (CVS)',       'Custos Variáveis',          null,      'lucroBruto',  'LUCRO BRUTO',               'lucroBruto', 'Margem Bruta %', false)}
            {renderSection('4', 'DESPESAS VARIÁVEIS (SG&A)',    'Despesas Variáveis',        null,      'margContrib', 'MARGEM DE CONTRIBUIÇÃO',    'margContrib', 'Margem de Contribuição %', false)}
            {renderSection('5', 'DESPESAS FIXAS (G&A)',         'Despesas Fixas',            null,      'ebitda',      'EBITDA',                    'ebitda', 'Margem EBITDA %', true)}
            {renderSection('6', 'OUTRAS RECEITAS E DESPESAS',   'Outras Receitas e Despesas',null,      'antesIR',     'RESULTADO ANTES DO IR',     null, null, false)}
            {renderSection('7', 'IR E CSLL',                    'IR e CSLL',                 null,      'resLiq',      'RESULTADO LÍQUIDO',         'resLiq', 'Margem Líquida %', true)}

            {/* Ponto de Equilíbrio */}
            <tr style={{ background: AMBER_L, borderTop: '2px solid var(--color-border-tertiary)' }}>
              <td style={{ ...S.TD, fontWeight: 700, color: AMBER, paddingLeft: 12, position: 'sticky', left: 0, background: AMBER_L }}>PONTO DE EQUILÍBRIO (R$)</td>
              {monthRange.map(m => {
                const v = allVals[m];
                const pe = v?.pe ?? 0;
                return <td key={m} style={{ ...S.TD, textAlign: 'right', fontWeight: 700, color: AMBER, background: AMBER_L }}>
                  <div>{pe ? fmt(pe) : '—'}</div>
                  {v?.recBruta > 0 && <div style={{ fontSize: 9, color: AMBER }}>{pe < v.recBruta ? '✓ Atingido' : '✗ Não atingido'}</div>}
                </td>;
              })}
              <td style={{ ...S.TD, background: AMBER_L }} />
              {showAV && <td style={{ ...S.TD, background: AMBER_L }} />}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// FLUXO DE CAIXA
// ═══════════════════════════════════════════════════════
function FluxoCaixa({ lancamentos, plano, periodo }) {
  const [startMonth, setStartMonth] = useState(periodo.start);
  const [endMonth, setEndMonth]     = useState(periodo.end);
  const [saldo0, setSaldo0]         = useState('0');
  const [showPrev, setShowPrev]     = useState(true); // mostrar previsto
  useEffect(() => { setStartMonth(periodo.start); setEndMonth(periodo.end); }, [periodo.start, periodo.end]);

  const monthRange = useMemo(() => buildMonthRange(startMonth, endMonth), [startMonth, endMonth]);

  const OPERACIONAL_GRUPOS   = ['Receita Operacional', 'Deduções sobre Vendas', 'Custos Variáveis', 'Despesas Variáveis', 'Despesas Fixas', 'IR e CSLL', 'Outras Receitas e Despesas'];
  const INVESTIMENTO_GRUPOS  = ['Atividade de Investimento'];
  const FINANCIAMENTO_GRUPOS = ['Atividade de Financiamento'];

  // Soma por conta individual, separando realizado e previsto
  // Para previsto: usa dt_caixa_prevista se definida, senão aplica prazo_meses sobre dt_competencia
  const sumConta = (contaId, month) => {
    const conta = plano.find(p => p.id === contaId);
    const prazo = conta?.prazo_meses || 0;
    const ls = lancamentos.filter(l => l.conta_id === contaId);
    const real = ls.filter(l =>
      l.status === 'realizado' && mk(l.dt_caixa_realizada) === month
    ).reduce((s,l) => s+l.valor, 0);
    const prev = ls.filter(l => {
      if (l.status !== 'previsto') return false;
      const dtCaixa = l.dt_caixa_prevista
        ? mk(l.dt_caixa_prevista)
        : shiftMonth(mk(l.dt_competencia), prazo);
      return dtCaixa === month;
    }).reduce((s,l) => s+l.valor, 0);
    return { real, prev, total: real + (showPrev ? prev : 0) };
  };

  // Contas ativas de um conjunto de grupos
  const contasDe = (grupos, tipo_f) =>
    plano.filter(p => grupos.includes(p.grupo) && (!tipo_f || p.tipo === tipo_f))
      .sort((a,b) => a.cod.localeCompare(b.cod));

  // Soma de um grupo de contas num mês
  const sumGrupo = (grupos, tipo_f, month) =>
    contasDe(grupos, tipo_f).reduce((s,p) => {
      const v = sumConta(p.id, month);
      return s + v.total;
    }, 0);

  const fcData = useMemo(() => {
    let saldo = +saldo0 || 0;
    return monthRange.map(m => {
      const recOp  = sumGrupo(OPERACIONAL_GRUPOS, 'receita', m);
      const despOp = sumGrupo(OPERACIONAL_GRUPOS, 'despesa', m);
      const resOp  = recOp - despOp;
      const entInv = sumGrupo(INVESTIMENTO_GRUPOS, 'receita', m);
      const saiInv = sumGrupo(INVESTIMENTO_GRUPOS, 'despesa', m);
      const resInv = entInv - saiInv;
      const entFin = sumGrupo(FINANCIAMENTO_GRUPOS, 'receita', m);
      const saiFin = sumGrupo(FINANCIAMENTO_GRUPOS, 'despesa', m);
      const resFin = entFin - saiFin;
      const geracao = resOp + resInv + resFin;
      const si = saldo;
      const sf = saldo + geracao;
      saldo = sf;
      return { m, recOp, despOp, resOp, entInv, saiInv, resInv, entFin, saiFin, resFin, geracao, si, sf };
    });
  }, [lancamentos, monthRange, saldo0, plano, showPrev]);

  const totalFor = key => fcData.reduce((s,r) => s + (r[key]||0), 0);

  // Renderiza seção com contas detalhadas
  const FCSection = ({ title, grupos, resKey, resLabel, bg, color }) => {
    const recContas  = contasDe(grupos, 'receita');
    const despContas = contasDe(grupos, 'despesa');
    const allContas  = [...recContas, ...despContas];
    // Filtra só contas com algum movimento no período
    const ativas = allContas.filter(p => monthRange.some(m => {
      const v = sumConta(p.id, m); return v.real + v.prev > 0;
    }));

    return (
      <>
        <tr style={{ background: bg }}>
          <td colSpan={monthRange.length + 2} style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color, textTransform: 'uppercase', position: 'sticky', left: 0 }}>{title}</td>
        </tr>
        {ativas.map(p => {
          const isDesp = p.tipo === 'despesa';
          const totPeriodo = monthRange.reduce((s,m) => s + sumConta(p.id, m).total, 0);
          return (
            <tr key={p.id} style={{ background: 'var(--color-background-primary)' }}>
              <td style={{ ...S.TD, fontSize: 11, paddingLeft: 24, color: 'var(--color-text-secondary)', position: 'sticky', left: 0, background: 'var(--color-background-primary)' }}>
                {p.cod} — {p.nome}
              </td>
              {monthRange.map(m => {
                const v = sumConta(p.id, m);
                const tot = v.real + (showPrev ? v.prev : 0);
                return (
                  <td key={m} style={{ ...S.TD, textAlign: 'right', fontSize: 11 }}>
                    {v.real > 0 && <div style={{ color: isDesp ? RED : TEAL_D, fontWeight: 500 }}>{fmt(v.real)}</div>}
                    {showPrev && v.prev > 0 && <div style={{ color: 'var(--color-text-secondary)', fontSize: 10 }}>+{fmt(v.prev)} prev</div>}
                    {tot === 0 && <span style={{ color: 'var(--color-text-secondary)' }}>—</span>}
                  </td>
                );
              })}
              <td style={{ ...S.TD, textAlign: 'right', fontSize: 11, fontWeight: 600, color: isDesp ? RED : TEAL_D }}>{totPeriodo ? fmt(totPeriodo) : '—'}</td>
            </tr>
          );
        })}
        {ativas.length === 0 && (
          <tr><td colSpan={monthRange.length + 2} style={{ ...S.TD, fontSize: 11, color: 'var(--color-text-secondary)', paddingLeft: 24, fontStyle: 'italic' }}>Nenhum lançamento no período</td></tr>
        )}
        <tr style={{ background: 'var(--color-background-secondary)', borderTop: '1px solid var(--color-border-tertiary)' }}>
          <td style={{ ...S.TD, fontWeight: 700, paddingLeft: 12, position: 'sticky', left: 0, background: 'var(--color-background-secondary)' }}>{resLabel}</td>
          {fcData.map(r => (
            <td key={r.m} style={{ ...S.TD, textAlign: 'right', fontWeight: 700, color: r[resKey] >= 0 ? TEAL_D : RED, background: 'var(--color-background-secondary)' }}>
              {fmt(r[resKey])}
            </td>
          ))}
          <td style={{ ...S.TD, textAlign: 'right', fontWeight: 800, color: totalFor(resKey) >= 0 ? TEAL_D : RED, background: 'var(--color-background-secondary)' }}>
            {fmt(totalFor(resKey))}
          </td>
        </tr>
      </>
    );
  };

  const SaldoRow = ({ label, fkey, highlight }) => (
    <tr style={{ background: highlight ? TEAL_L : 'var(--color-background-secondary)', borderTop: highlight ? '2px solid var(--color-border-tertiary)' : 'none' }}>
      <td style={{ ...S.TD, fontWeight: highlight ? 800 : 600, fontSize: highlight ? 14 : 13, color: highlight ? TEAL_D : DARK, paddingLeft: 12, position: 'sticky', left: 0, background: highlight ? TEAL_L : 'var(--color-background-secondary)' }}>{label}</td>
      {fcData.map(r => (
        <td key={r.m} style={{ ...S.TD, textAlign: 'right', fontWeight: highlight ? 800 : 600, fontSize: highlight ? 14 : 13, color: r[fkey] >= 0 ? TEAL_D : RED, background: highlight ? TEAL_L : 'var(--color-background-secondary)' }}>
          {fmt(r[fkey])}
        </td>
      ))}
      <td style={{ ...S.TD, textAlign: 'right', fontWeight: 800, color: TEAL_D, background: highlight ? TEAL_L : 'var(--color-background-secondary)' }}>—</td>
    </tr>
  );

  return (
    <div>
      <PageHeader title="Fluxo de Caixa" action={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>De:</span>
          <input type="month" value={startMonth} onChange={e => setStartMonth(e.target.value)} style={{ ...S.inp, width: 130, padding: '6px 10px', fontSize: 12 }} />
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Até:</span>
          <input type="month" value={endMonth} onChange={e => setEndMonth(e.target.value)} style={{ ...S.inp, width: 130, padding: '6px 10px', fontSize: 12 }} />
        </div>
      } />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ ...S.card, padding: '10px 16px', display: 'flex', gap: 12, alignItems: 'center', margin: 0, flex: 1 }}>
          <label style={{ ...S.lbl, marginBottom: 0, whiteSpace: 'nowrap', fontSize: 12 }}>Saldo Inicial (R$):</label>
          <input type="number" value={saldo0} onChange={e => setSaldo0(e.target.value)} style={{ ...S.inp, width: 160 }} />
        </div>
        <button onClick={() => setShowPrev(v => !v)}
          style={S.sm(showPrev ? BLUE : 'var(--color-background-primary)', showPrev ? '#fff' : 'var(--color-text-secondary)')}>
          {showPrev ? '👁 Realizado + Previsto' : '👁 Só Realizado'}
        </button>
      </div>

      <div style={{ ...S.card, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: monthRange.length * 140 + 260 }}>
          <thead>
            <tr>
              <th style={{ ...S.TH, textAlign: 'left', minWidth: 250, position: 'sticky', left: 0, background: '#111827', zIndex: 2 }}>Conta / Linha</th>
              {monthRange.map(m => <th key={m} style={{ ...S.TH, textAlign: 'center', minWidth: 130, background: mk(today()) === m ? `${TEAL}BB` : '#111827' }}>{ml(m)}{mk(today()) === m ? ' ●' : ''}</th>)}
              <th style={{ ...S.TH, textAlign: 'right', background: '#0a1628', minWidth: 120 }}>Total Período</th>
            </tr>
          </thead>
          <tbody>
            <FCSection title="Atividades Operacionais" grupos={OPERACIONAL_GRUPOS}
              resKey="resOp" resLabel="= RESULTADO OPERACIONAL" bg={TEAL_L} color={TEAL_D} />

            <FCSection title="Atividades de Investimento" grupos={INVESTIMENTO_GRUPOS}
              resKey="resInv" resLabel="= RESULTADO DE INVESTIMENTOS" bg={BLUE_L} color={BLUE} />

            <FCSection title="Atividades de Financiamento" grupos={FINANCIAMENTO_GRUPOS}
              resKey="resFin" resLabel="= RESULTADO DE FINANCIAMENTOS" bg={AMBER_L} color={AMBER} />

            <tr><td colSpan={monthRange.length + 2} style={{ padding: '10px 12px 4px', fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: TEAL_D, background: TEAL_L, textTransform: 'uppercase' }}>Síntese</td></tr>
            <SaldoRow label="Saldo Inicial"    fkey="si"      highlight={false} />
            <SaldoRow label="Geração de Caixa" fkey="geracao" highlight={false} />
            <SaldoRow label="SALDO FINAL"      fkey="sf"      highlight={true}  />
          </tbody>
        </table>
      </div>

      <div style={{ ...S.card, marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Evolução do Saldo Final</div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={fcData.map(r => ({ name: ml(r.m), Operacional: +r.resOp.toFixed(2), 'Saldo Final': +r.sf.toFixed(2) }))}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-tertiary)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={70} tickFormatter={v => Intl.NumberFormat('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' }).format(v)} />
            <Tooltip formatter={(v, n) => [fmt(v), n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area dataKey="Operacional" stroke={TEAL} fill={TEAL_L} strokeWidth={2} />
            <Area dataKey="Saldo Final" stroke={BLUE} fill={BLUE_L} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}



// ═══════════════════════════════════════════════════════
// CONTAS A RECEBER / PAGAR
// ═══════════════════════════════════════════════════════
function ContasReceberPagar({ lancamentos, clientes, plano, currentUser, addAudit, saveLanc, periodo }) {
  const [tab, setTab] = useState('receber');
  const isRec = tab === 'receber';
  const tipo = isRec ? 'receita' : 'despesa';

  const items = lancamentos
    .filter(l => l.tipo === tipo && !l.dt_caixa_realizada)
    .map(l => ({ ...l, atraso: l.dt_caixa_prevista ? diffDays(l.dt_caixa_prevista, today()) : null }))
    .sort((a, b) => (a.dt_caixa_prevista || '9999').localeCompare(b.dt_caixa_prevista || '9999'));

  const total = items.reduce((s, l) => s + l.valor, 0);
  const vencidos = items.filter(l => l.atraso > 0);
  const aging = [
    { label: 'Venc. +90d', fil: vencidos.filter(l => l.atraso > 90),          color: RED },
    { label: '61–90 dias', fil: vencidos.filter(l => l.atraso > 60 && l.atraso <= 90), color: '#C15A14' },
    { label: '31–60 dias', fil: vencidos.filter(l => l.atraso > 30 && l.atraso <= 60), color: AMBER },
    { label: '0–30 dias',  fil: vencidos.filter(l => l.atraso >= 0 && l.atraso <= 30), color: GREEN },
    { label: 'A Vencer',  fil: items.filter(l => !l.atraso || l.atraso < 0),   color: BLUE },
  ];

  const baixar = async (l) => {
    await saveLanc(lancamentos.map(x => x.id === l.id ? { ...x, dt_caixa_realizada: today(), status: 'realizado' } : x));
    await addAudit('Baixou título', isRec ? 'C.Receber' : 'C.Pagar', l.descricao);
  };

  return (
    <div>
      <PageHeader title="Contas a Receber / Pagar" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['receber', 'A Receber'], ['pagar', 'A Pagar']].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            style={S.btn(tab === v ? (v === 'receber' ? TEAL : RED) : 'var(--color-background-primary)', tab === v ? '#fff' : 'var(--color-text-secondary)')}>{l}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16 }}>
        {aging.map(a => (
          <div key={a.label} style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 5 }}>{a.label}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: a.color }}>{fmt(a.fil.reduce((s,l) => s + l.valor, 0))}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{a.fil.length} título(s)</div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{items.length} título(s) em aberto</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: isRec ? TEAL_D : RED }}>{fmt(total)}</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Descrição','Cliente','Conta','Valor','Vencimento','Situação','Ação'].map(h => <th key={h} style={S.TH}>{h}</th>)}</tr></thead>
          <tbody>
            {items.length === 0 && <EmptyRow cols={7} msg={`Nenhum título ${isRec ? 'a receber' : 'a pagar'}.`} />}
            {items.map(l => {
              const cli   = clientes.find(c => c.id === l.cliente_id);
              const conta = plano.find(p => p.id === l.conta_id);
              const venc  = l.atraso > 0;
              return (
                <tr key={l.id}>
                  <td style={S.TD}>{l.descricao}</td>
                  <td style={{ ...S.TD, fontSize: 12 }}>{cli?.nome || '—'}</td>
                  <td style={{ ...S.TD, fontSize: 11, color: 'var(--color-text-secondary)' }}>{conta?.nome || '—'}</td>
                  <td style={{ ...S.TD, fontWeight: 600, color: isRec ? TEAL_D : RED }}>{fmt(l.valor)}</td>
                  <td style={{ ...S.TD, fontSize: 12, color: venc ? RED : undefined }}>{fmtDate(l.dt_caixa_prevista)}</td>
                  <td style={S.TD}>
                    {l.atraso != null
                      ? venc
                        ? <span style={S.tag(RED_L, RED)}>{l.atraso}d em atraso</span>
                        : <span style={S.tag(GREEN_L, GREEN)}>{Math.abs(l.atraso)}d para vencer</span>
                      : <span style={S.tag('var(--color-background-secondary)', 'var(--color-text-secondary)')}>Sem vcto</span>}
                  </td>
                  <td style={S.TD}>
                    <button onClick={() => baixar(l)} style={S.sm(isRec ? TEAL_L : AMBER_L, isRec ? TEAL_D : AMBER)}>Baixar ✓</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// RELATÓRIO DE VENDAS POR SERVIÇO
// ═══════════════════════════════════════════════════════
function RelatorioVendas({ lancamentos, clientes, plano, periodo: globalPeriodo }) {
  const periodoMeses = buildMonthRange(globalPeriodo.start, globalPeriodo.end);

  const receitas = lancamentos.filter(l => l.tipo === 'receita' && periodoMeses.includes(mk(l.dt_competencia)));

  const byServico = plano.filter(p => p.tipo === 'receita').map(p => {
    const items = receitas.filter(l => l.conta_id === p.id);
    const total  = items.reduce((s, l) => s + l.valor, 0);
    const custo  = items.reduce((s, l) => s + (l.custo || 0), 0);
    const meses  = new Set(items.map(l => mk(l.dt_competencia)));
    return { nome: p.nome, total, custo, margem: total > 0 ? (total - custo) / total * 100 : 0, ticket: meses.size > 0 ? total / meses.size : 0, qtd: items.length };
  }).filter(r => r.total > 0).sort((a, b) => b.total - a.total);

  const byCliente = clientes.map(c => {
    const items = receitas.filter(l => l.cliente_id === c.id);
    const total  = items.reduce((s, l) => s + l.valor, 0);
    const custo  = items.reduce((s, l) => s + (l.custo || 0), 0);
    const meses  = new Set(items.map(l => mk(l.dt_competencia)));
    return { nome: c.nome, tipo: c.tipo, total, custo, margem: total > 0 ? (total - custo) / total * 100 : 0, ticket: meses.size > 0 ? total / meses.size : 0 };
  }).filter(r => r.total > 0).sort((a, b) => b.total - a.total);

  const totalGeral = receitas.reduce((s, l) => s + l.valor, 0);
  const custoGeral = receitas.reduce((s, l) => s + (l.custo || 0), 0);
  const margemGeral = totalGeral > 0 ? (totalGeral - custoGeral) / totalGeral * 100 : 0;

  const margemColor = m => m >= 60 ? TEAL_D : m >= 35 ? AMBER : RED;

  const chartData = periodoMeses.map(m => ({
    name: ml(m),
    MRR: +lancamentos.filter(l => l.tipo === 'receita' && mk(l.dt_competencia) === m).reduce((s, l) => s + l.valor, 0).toFixed(2),
  }));

  return (
    <div>
      <PageHeader title="Vendas por Serviço" action={<span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{ml(globalPeriodo.start)} — {ml(globalPeriodo.end)}</span>} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Receita Total" val={fmt(totalGeral)} color={TEAL} />
        <KpiCard label="Custo Total" val={fmt(custoGeral)} color={RED} />
        <KpiCard label="Margem Média" val={margemGeral.toFixed(1) + '%'} color={margemColor(margemGeral)} sub={`Margem bruta — ${receitas.length} lançamentos`} />
      </div>

      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Receita mensal — últimos 6 meses</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-tertiary)" /><XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={65} tickFormatter={v => 'R$' + Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(v)} /><Tooltip formatter={v => [fmt(v), 'Receita']} /><Bar dataKey="MRR" fill={TEAL} radius={[4,4,0,0]} /></BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Por Tipo de Serviço</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Serviço','Total','Custo','Margem','Ticket/Mês'].map(h => <th key={h} style={S.TH}>{h}</th>)}</tr></thead>
            <tbody>
              {byServico.length === 0 && <EmptyRow cols={5} msg="Nenhuma receita no período." />}
              {byServico.map(r => (
                <tr key={r.nome}>
                  <td style={{ ...S.TD, fontSize: 12, fontWeight: 500 }}>{r.nome}</td>
                  <td style={{ ...S.TD, fontWeight: 600, color: TEAL_D }}>{fmt(r.total)}</td>
                  <td style={{ ...S.TD, fontSize: 12, color: RED }}>{fmt(r.custo)}</td>
                  <td style={S.TD}><span style={{ fontWeight: 700, color: margemColor(r.margem) }}>{r.margem.toFixed(1)}%</span></td>
                  <td style={{ ...S.TD, fontSize: 12 }}>{fmt(r.ticket)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Por Cliente</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Cliente','Total','Custo','Margem','Ticket/Mês'].map(h => <th key={h} style={S.TH}>{h}</th>)}</tr></thead>
            <tbody>
              {byCliente.length === 0 && <EmptyRow cols={5} msg="Nenhuma receita no período." />}
              {byCliente.map(r => (
                <tr key={r.nome}>
                  <td style={S.TD}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{r.nome}</div>
                    <span style={S.tag(r.tipo === 'retainer' ? BLUE_L : AMBER_L, r.tipo === 'retainer' ? BLUE : AMBER)}>{r.tipo === 'retainer' ? 'Retainer' : 'Avulso'}</span>
                  </td>
                  <td style={{ ...S.TD, fontWeight: 600, color: TEAL_D }}>{fmt(r.total)}</td>
                  <td style={{ ...S.TD, fontSize: 12, color: RED }}>{fmt(r.custo)}</td>
                  <td style={S.TD}><span style={{ fontWeight: 700, color: margemColor(r.margem) }}>{r.margem.toFixed(1)}%</span></td>
                  <td style={{ ...S.TD, fontSize: 12 }}>{fmt(r.ticket)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// CICLO FINANCEIRO
// ═══════════════════════════════════════════════════════
function CicloFinanceiro({ lancamentos, clientes, plano, periodo }) {
  const periodoMeses = buildMonthRange(periodo.start, periodo.end);
  const realizadas = tipo => lancamentos.filter(l =>
    l.tipo === tipo && l.status === 'realizado' && l.dt_competencia && l.dt_caixa_realizada &&
    periodoMeses.includes(mk(l.dt_competencia))
  );

  const avgDias = items => {
    const vals = items.map(l => diffDays(l.dt_competencia, l.dt_caixa_realizada)).filter(d => d !== null && d >= 0);
    return vals.length ? +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : 0;
  };

  const pmrGeral = avgDias(realizadas('receita'));
  const pmpGeral = avgDias(realizadas('despesa'));
  const ciclo = +(pmrGeral - pmpGeral).toFixed(1);

  const byCliente = clientes.map(c => {
    const items = realizadas('receita').filter(l => l.cliente_id === c.id);
    return { nome: c.nome, pmr: avgDias(items), qtd: items.length };
  }).filter(r => r.qtd > 0).sort((a, b) => b.pmr - a.pmr);

  const byServico = plano.filter(p => p.tipo === 'receita').map(p => {
    const items = realizadas('receita').filter(l => l.conta_id === p.id);
    return { nome: p.nome, pmr: avgDias(items), qtd: items.length };
  }).filter(r => r.qtd > 0).sort((a, b) => b.pmr - a.pmr);

  const ms = getMonths(6, -5);
  const chartData = ms.map(m => {
    const rec  = realizadas('receita').filter(l => mk(l.dt_caixa_realizada) === m);
    const desp = realizadas('despesa').filter(l => mk(l.dt_caixa_realizada) === m);
    return { name: ml(m), PMR: avgDias(rec), PMP: avgDias(desp) };
  });

  const pmrColor = pmrGeral <= 30 ? TEAL : pmrGeral <= 60 ? AMBER : RED;
  const cicloSub = ciclo <= 0
    ? '✓ Você recebe antes de pagar — saudável'
    : ciclo <= 30
    ? 'Ciclo curto — atenção ao capital'
    : '⚠ Ciclo longo — risco de caixa negativo';

  const diasRow = (label, val, color) => (
    <tr>
      <td style={{ ...S.TD, fontSize: 12, fontWeight: 500 }}>{label}</td>
      <td style={{ ...S.TD, fontWeight: 700, color }}>{val.toFixed(1)} dias</td>
    </tr>
  );

  return (
    <div>
      <PageHeader title="Ciclo Financeiro" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="PMR — Prazo Médio de Recebimento" val={pmrGeral.toFixed(1) + ' dias'} color={pmrColor} sub="Média: emissão → recebimento" />
        <KpiCard label="PMP — Prazo Médio de Pagamento" val={pmpGeral.toFixed(1) + ' dias'} color={BLUE} sub="Média: competência → pagamento" />
        <KpiCard label="Ciclo Financeiro (PMR − PMP)" val={(ciclo >= 0 ? '+' : '') + ciclo + ' dias'} color={ciclo <= 0 ? TEAL : ciclo <= 30 ? AMBER : RED} sub={cicloSub} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>PMR por Cliente</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Cliente','PMR','Títulos'].map(h => <th key={h} style={S.TH}>{h}</th>)}</tr></thead>
            <tbody>
              {byCliente.length === 0 && <EmptyRow cols={3} msg="Sem recebimentos realizados ainda." />}
              {byCliente.map(r => (
                <tr key={r.nome}>
                  <td style={{ ...S.TD, fontSize: 12, fontWeight: 500 }}>{r.nome}</td>
                  <td style={S.TD}><span style={{ fontWeight: 700, color: r.pmr <= 30 ? TEAL_D : r.pmr <= 60 ? AMBER : RED }}>{r.pmr.toFixed(1)} dias</span></td>
                  <td style={{ ...S.TD, fontSize: 12, color: 'var(--color-text-secondary)' }}>{r.qtd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>PMR por Tipo de Serviço</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Serviço','PMR','Títulos'].map(h => <th key={h} style={S.TH}>{h}</th>)}</tr></thead>
            <tbody>
              {byServico.length === 0 && <EmptyRow cols={3} msg="Sem dados realizados ainda." />}
              {byServico.map(r => (
                <tr key={r.nome}>
                  <td style={{ ...S.TD, fontSize: 12, fontWeight: 500 }}>{r.nome}</td>
                  <td style={S.TD}><span style={{ fontWeight: 700, color: r.pmr <= 30 ? TEAL_D : r.pmr <= 60 ? AMBER : RED }}>{r.pmr.toFixed(1)} dias</span></td>
                  <td style={{ ...S.TD, fontSize: 12, color: 'var(--color-text-secondary)' }}>{r.qtd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Evolução mensal — PMR vs PMP (dias)</div>
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-tertiary)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v + 'd'} />
            <Tooltip formatter={(v, n) => [v.toFixed(1) + ' dias', n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="PMR" stroke={AMBER} fill={AMBER_L} strokeWidth={2.5} dot={{ r: 4, fill: AMBER }} />
            <Area type="monotone" dataKey="PMP" stroke={BLUE}  fill={BLUE_L}  strokeWidth={2.5} dot={{ r: 4, fill: BLUE }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// CONCILIAÇÃO BANCÁRIA
// ═══════════════════════════════════════════════════════
function Conciliacao({ lancamentos, clientes, plano, currentUser, addAudit, saveLanc }) {
  const [rows, setRows]         = useState([]);
  const [err, setErr]           = useState('');
  const [novoForm, setNovoForm] = useState(null);
  const [fonte, setFonte]       = useState('arquivo'); // 'arquivo' | 'asaas'

  // Asaas state
  const [asaasStart, setAsaasStart] = useState(getMonths(1, -1)[0] + '-01');
  const [asaasEnd, setAsaasEnd]     = useState(today());
  const [asaasLoading, setAsaasLoading] = useState(false);
  const [asaasStatus, setAsaasStatus]   = useState(''); // mensagem de progresso

  // ── Parsers ──────────────────────────────────────────
  const parseCSV = (text) => {
    // Remove BOM e normaliza quebras de linha
    text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = text.trim().split('\n').filter(l => l.trim() && !l.startsWith('//') && !l.startsWith('#'));
    if (lines.length < 2) return [];

    // Auto-detecta separador: ; ou ,
    const sep = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ',';

    // Identifica colunas pelo cabeçalho
    const hdr = lines[0].split(sep).map(h => h.trim().replace(/["']/g, '').toLowerCase());
    const findCol = (...names) => { for (const n of names) { const i = hdr.findIndex(h => h.includes(n)); if (i >= 0) return i; } return -1; };
    const dc = Math.max(0, findCol('data', 'date', 'dt'));
    const hc = Math.max(1, findCol('histórico', 'historico', 'descri', 'memo', 'title', 'detail', 'lançamento', 'lancamento', 'transacao'));
    const vc = Math.max(2, findCol('valor', 'amount', 'value', 'crédito', 'debito', 'montante', 'credit', 'debit'));

    const parseDate = (raw) => {
      if (!raw) return '';
      raw = raw.replace(/["']/g, '').trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
      const parts = raw.split(/[\/\-\.]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`;
        if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
        if (parts[2].length === 2) return `20${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
      }
      return raw;
    };

    const parseVal = (raw) => {
      if (!raw) return 0;
      raw = raw.replace(/["'\s]/g, '');
      if (/^-?[\d.]+,\d{1,2}$/.test(raw)) return parseFloat(raw.replace(/\./g,'').replace(',','.'));
      if (/^-?[\d,]+\.\d{1,2}$/.test(raw)) return parseFloat(raw.replace(/,/g,''));
      return parseFloat(raw.replace(',','.')) || 0;
    };

    return lines.slice(1).map(line => {
      const cols = line.split(sep).map(c => c.trim());
      if (cols.length < 2) return null;
      const data = parseDate(cols[dc]);
      const historico = (cols[hc] || '').replace(/["']/g, '').trim();
      const val = parseVal(cols[vc]);
      if (!historico || !data) return null;
      return { id: uid(), data, historico, valor: Math.abs(val), tipo: val >= 0 ? 'credito' : 'debito' };
    }).filter(r => r && r.historico && r.valor > 0);
  };

  const parseOFX = (text) => {
    return text.split('<STMTTRN>').slice(1).map(stmt => {
      const get = tag => { const m = stmt.match(new RegExp('<' + tag + '>([^<\n]+)')); return m ? m[1].trim() : ''; };
      const dr = get('DTPOSTED');
      const val = parseFloat(get('TRNAMT')) || 0;
      return { id: uid(), data: dr ? `${dr.slice(0,4)}-${dr.slice(4,6)}-${dr.slice(6,8)}` : '', historico: get('MEMO') || get('NAME'), valor: Math.abs(val), tipo: val >= 0 ? 'credito' : 'debito' };
    }).filter(r => r.historico && r.valor > 0);
  };

  // ── Auto-match: encontra o melhor lançamento para cada transação ──
  const findMatch = (ext, lancs) => {
    const tipo = ext.tipo === 'credito' ? 'receita' : 'despesa';
    const candidates = lancs.filter(l =>
      l.tipo === tipo &&
      !l.dt_caixa_realizada &&
      Math.abs(l.valor - ext.valor) < 0.02
    );
    if (!candidates.length) return null;

    const scored = candidates.map(l => {
      let score = 60; // valor bate = base

      // Proximidade de data (usa dt_caixa_prevista)
      if (l.dt_caixa_prevista && ext.data) {
        const days = Math.abs(diffDays(l.dt_caixa_prevista, ext.data) ?? 99);
        score += days === 0 ? 30 : days <= 3 ? 22 : days <= 7 ? 14 : days <= 15 ? 8 : days <= 30 ? 3 : 0;
      }

      // Similaridade de descrição (palavras com 4+ letras)
      const extWords = ext.historico.toLowerCase().split(/\W+/).filter(w => w.length >= 4);
      const descWords = l.descricao.toLowerCase().split(/\W+/).filter(w => w.length >= 4);
      const hits = descWords.filter(w => extWords.some(ew => ew.includes(w) || w.includes(ew)));
      score += hits.length * 8;

      return { ...l, _score: score };
    });

    const best = scored.sort((a, b) => b._score - a._score)[0];
    return best._score >= 60 ? best : null; // exige no mínimo valor batendo
  };

  // ── Importar do Asaas via Netlify Function ────────────
  const importarAsaas = async () => {
    setAsaasLoading(true); setErr(''); setAsaasStatus('Conectando ao Asaas...');
    let allRows = [], offset = 0, hasMore = true;

    try {
      while (hasMore) {
        const params = new URLSearchParams({
          startDate: asaasStart,
          finishDate: asaasEnd,
          offset: String(offset),
          limit: '100',
        });

        setAsaasStatus(`Buscando transações (${offset > 0 ? offset + ' importadas' : 'início'})...`);

        const res = await fetch(`/.netlify/functions/asaas?${params}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || `Erro ${res.status}`);
        }

        const transactions = data.data || [];
        const mapped = transactions.map(t => ({
          id: uid(),
          data: t.date,
          historico: t.description || t.type || 'Movimentação Asaas',
          valor: Math.abs(t.value),
          tipo: t.value >= 0 ? 'credito' : 'debito',
          asaasId: t.id,
          asaasType: t.type,
        }));

        allRows = [...allRows, ...mapped];
        hasMore = data.hasMore === true;
        offset += transactions.length;

        if (transactions.length === 0) break;
      }

      if (allRows.length === 0) {
        setAsaasStatus('');
        return setErr('Nenhuma movimentação encontrada no período selecionado.');
      }

      // Auto-match
      const withMatches = allRows.map(ext => ({
        ...ext,
        conciliado: false,
        lancamento_id: null,
        sugestao: findMatch(ext, lancamentos),
      }));

      setRows(withMatches);
      setAsaasStatus(`✓ ${allRows.length} transações importadas do Asaas.`);
    } catch (e) {
      const msg = e.message || String(e);
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setErr('Não foi possível conectar. Verifique se a Netlify Function está ativa e a variável ASAAS_API_KEY configurada.');
      } else {
        setErr(`Erro Asaas: ${msg}`);
      }
      setAsaasStatus('');
    } finally {
      setAsaasLoading(false);
    }
  };
  const onFile = e => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = ''; // allow re-import same file
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = file.name.toLowerCase().endsWith('.ofx') ? parseOFX(ev.target.result) : parseCSV(ev.target.result);
        if (!parsed.length) return setErr('Nenhuma transação reconhecida. Verifique o formato (CSV: Data;Histórico;Valor;Saldo ou OFX padrão).');
        const withMatches = parsed.map(ext => ({
          ...ext,
          conciliado: false,
          lancamento_id: null,
          sugestao: findMatch(ext, lancamentos), // auto-match
        }));
        setRows(withMatches); setErr('');
      } catch { setErr('Erro ao processar o arquivo.'); }
    };
    reader.readAsText(file, 'ISO-8859-1');
  };

  // ── Confirmar conciliação ─────────────────────────────
  const confirmar = async (extId, lancId) => {
    const ext = rows.find(r => r.id === extId);
    if (!lancId || !ext) return;
    setRows(prev => prev.map(r => r.id === extId ? { ...r, conciliado: true, lancamento_id: lancId, sugestao: null } : r));
    await saveLanc(lancamentos.map(l => l.id === lancId ? { ...l, dt_caixa_realizada: ext.data, status: 'realizado' } : l));
    await addAudit('Conciliou extrato', 'Conciliação', ext.historico);
  };

  const ignorarSugestao = (extId) => {
    setRows(prev => prev.map(r => r.id === extId ? { ...r, sugestao: null } : r));
  };

  // ── Criar lançamento direto da conciliação ────────────
  const [criarForm, setCriarForm] = useState({ tipo: 'receita', conta_id: '', descricao: '', dt_competencia: '' });
  const setC = (k, v) => setCriarForm(f => ({ ...f, [k]: v }));

  const abrirCriar = (ext) => {
    setCriarForm({
      tipo: ext.tipo === 'credito' ? 'receita' : 'despesa',
      conta_id: '',
      descricao: ext.historico,
      dt_competencia: ext.data,
      cliente_id: '',
      custo: '',
    });
    setNovoForm(ext.id);
  };

  const salvarNovo = async () => {
    const ext = rows.find(r => r.id === novoForm);
    if (!criarForm.conta_id || !criarForm.descricao) return alert('Preencha Descrição e Conta.');
    const item = {
      ...criarForm,
      id: uid(),
      valor: ext.valor,
      custo: +criarForm.custo || 0,
      dt_caixa_prevista: ext.data,
      dt_caixa_realizada: ext.data,
      status: 'realizado',
      criado_por: currentUser.name,
    };
    const newLancs = [...lancamentos, item];
    await saveLanc(newLancs);
    setRows(prev => prev.map(r => r.id === ext.id ? { ...r, conciliado: true, lancamento_id: item.id, sugestao: null } : r));
    await addAudit('Criou lançamento via conciliação', 'Conciliação', item.descricao);
    setNovoForm(null);
  };

  // ── Stats ─────────────────────────────────────────────
  const conciliadas = rows.filter(r => r.conciliado).length;
  const comSugestao = rows.filter(r => !r.conciliado && r.sugestao).length;
  const pendentes   = rows.filter(r => !r.conciliado && !r.sugestao).length;

  return (
    <div>
      <PageHeader title="Conciliação Bancária" />

      {/* Import */}
      <div style={{ ...S.card, marginBottom: 16 }}>
        {/* Tabs: Arquivo vs Asaas */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[['arquivo','📂 CSV / OFX'], ['asaas','⚡ Importar do Asaas']].map(([v, l]) => (
            <button key={v} onClick={() => { setFonte(v); setErr(''); }}
              style={S.sm(fonte === v ? (v === 'asaas' ? BLUE : TEAL) : 'var(--color-background-secondary)', fonte === v ? '#fff' : 'var(--color-text-secondary)')}>
              {l}
            </button>
          ))}
        </div>

        {fonte === 'arquivo' ? (
          <>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
              Aceita <strong>CSV</strong> (Data;Histórico;Valor;Saldo) e <strong>OFX</strong>. O sistema tenta fazer o match automático com lançamentos existentes.
            </div>
            <input type="file" accept=".csv,.ofx,.txt" onChange={onFile} style={{ fontSize: 13 }} />
          </>
        ) : (
          <>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
              Busca suas movimentações financeiras diretamente do Asaas via API.
              <br />
              <strong>Pré-requisito:</strong> configure <code style={{ background: 'var(--color-background-secondary)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>ASAAS_API_KEY</code> nas variáveis de ambiente do Netlify (Site → Environment variables).
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={S.lbl}>Data inicial</label>
                <input type="date" value={asaasStart} onChange={e => setAsaasStart(e.target.value)} style={{ ...S.inp, width: 150 }} />
              </div>
              <div>
                <label style={S.lbl}>Data final</label>
                <input type="date" value={asaasEnd} onChange={e => setAsaasEnd(e.target.value)} style={{ ...S.inp, width: 150 }} />
              </div>
              <button onClick={importarAsaas} disabled={asaasLoading}
                style={{ ...S.btn(asaasLoading ? 'var(--color-background-secondary)' : BLUE), cursor: asaasLoading ? 'wait' : 'pointer' }}>
                {asaasLoading ? '⏳ Importando...' : '⬇ Importar movimentações'}
              </button>
            </div>
            {asaasStatus && <div style={{ fontSize: 12, color: BLUE, marginTop: 10, fontWeight: 500 }}>{asaasStatus}</div>}
          </>
        )}

        {err && <div style={{ color: RED, fontSize: 12, marginTop: 10 }}>{err}</div>}
        {rows.length > 0 && (
          <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: GREEN }}>✓ {conciliadas} conciliadas</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: BLUE }}>◎ {comSugestao} com sugestão</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: AMBER }}>◌ {pendentes} sem match</span>
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <div style={S.card}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Data','Histórico do Extrato','Tipo','Valor','Match / Ação','Status'].map(h =>
                <th key={h} style={S.TH}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const isCriar = novoForm === r.id;
                const contasFiltradas = plano.filter(p => p.tipo === criarForm.tipo);
                return (
                  <>
                    <tr key={r.id} style={{ background: r.conciliado ? GREEN_L : r.sugestao ? BLUE_L : 'var(--color-background-primary)' }}>
                      <td style={{ ...S.TD, fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(r.data)}</td>
                      <td style={{ ...S.TD, fontSize: 12, maxWidth: 200 }}>{r.historico}</td>
                      <td style={S.TD}>
                        <span style={S.tag(r.tipo === 'credito' ? TEAL_L : RED_L, r.tipo === 'credito' ? TEAL_D : RED)}>
                          {r.tipo === 'credito' ? 'Crédito' : 'Débito'}
                        </span>
                      </td>
                      <td style={{ ...S.TD, fontWeight: 600, color: r.tipo === 'credito' ? TEAL_D : RED }}>{fmt(r.valor)}</td>
                      <td style={S.TD}>
                        {r.conciliado ? (
                          <span style={{ fontSize: 12, color: GREEN, fontWeight: 500 }}>✓ Conciliado</span>
                        ) : r.sugestao ? (
                          /* Auto-match suggestion */
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <div style={{ background: BLUE_L, borderRadius: 6, padding: '4px 10px', fontSize: 11 }}>
                              <span style={{ color: BLUE, fontWeight: 600 }}>Sugestão: </span>
                              <span style={{ color: 'var(--color-text-primary)' }}>{r.sugestao.descricao}</span>
                              <span style={{ color: 'var(--color-text-secondary)' }}> · {fmt(r.sugestao.valor)}</span>
                            </div>
                            <button onClick={() => confirmar(r.id, r.sugestao.id)} style={S.sm(TEAL_L, TEAL_D)}>Confirmar ✓</button>
                            <button onClick={() => ignorarSugestao(r.id)} style={S.sm('var(--color-background-secondary)', 'var(--color-text-secondary)')}>Ignorar</button>
                          </div>
                        ) : (
                          /* Manual match + create */
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                            <select defaultValue="" onChange={ev => ev.target.value && confirmar(r.id, ev.target.value)}
                              style={{ ...S.inp, width: 200, padding: '4px 8px', fontSize: 11 }}>
                              <option value="">Vincular a lançamento...</option>
                              {lancamentos.filter(l => l.tipo === (r.tipo === 'credito' ? 'receita' : 'despesa') && !l.dt_caixa_realizada)
                                .map(l => <option key={l.id} value={l.id}>{l.descricao} — {fmt(l.valor)}</option>)}
                            </select>
                            <button onClick={() => abrirCriar(r)} style={S.sm(AMBER_L, AMBER)}>
                              {isCriar ? '↑ Fechar' : '+ Criar Lançamento'}
                            </button>
                          </div>
                        )}
                      </td>
                      <td style={S.TD}>
                        {r.conciliado
                          ? <span style={S.tag(GREEN_L, GREEN)}>Conciliado</span>
                          : r.sugestao
                          ? <span style={S.tag(BLUE_L, BLUE)}>Sugestão</span>
                          : <span style={S.tag(AMBER_L, AMBER)}>Pendente</span>}
                      </td>
                    </tr>

                    {/* Mini-form inline para criar lançamento */}
                    {isCriar && (
                      <tr key={`${r.id}-form`}>
                        <td colSpan={6} style={{ padding: '0 0 2px 0', background: AMBER_L }}>
                          <div style={{ padding: '16px 20px', background: 'var(--color-background-primary)', margin: '0 2px 2px', borderRadius: 8 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: AMBER, marginBottom: 14 }}>
                              Criar lançamento para: <span style={{ color: 'var(--color-text-primary)' }}>{r.historico}</span> · <span style={{ color: r.tipo === 'credito' ? TEAL_D : RED }}>{fmt(r.valor)}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, alignItems: 'end' }}>
                              <div>
                                <label style={S.lbl}>Tipo</label>
                                <select value={criarForm.tipo} onChange={e => setC('tipo', e.target.value)} style={S.inp}>
                                  <option value="receita">Receita</option>
                                  <option value="despesa">Despesa</option>
                                </select>
                              </div>
                              <div>
                                <label style={S.lbl}>Conta *</label>
                                <select value={criarForm.conta_id} onChange={e => setC('conta_id', e.target.value)} style={S.inp}>
                                  <option value="">Selecione...</option>
                                  {contasFiltradas.map(p => <option key={p.id} value={p.id}>{p.cod} — {p.nome}</option>)}
                                </select>
                              </div>
                              <div style={{ gridColumn: 'span 2' }}>
                                <label style={S.lbl}>Descrição *</label>
                                <input value={criarForm.descricao} onChange={e => setC('descricao', e.target.value)} style={S.inp} />
                              </div>
                              <div>
                                <label style={S.lbl}>Data de Competência</label>
                                <input type="date" value={criarForm.dt_competencia} onChange={e => setC('dt_competencia', e.target.value)} style={S.inp} />
                              </div>
                              <div>
                                <label style={S.lbl}>Cliente</label>
                                <select value={criarForm.cliente_id} onChange={e => setC('cliente_id', e.target.value)} style={S.inp}>
                                  <option value="">— Nenhum —</option>
                                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                </select>
                              </div>
                              {criarForm.tipo === 'receita' && (
                                <div>
                                  <label style={S.lbl}>Custo (para margem)</label>
                                  <input type="number" value={criarForm.custo} onChange={e => setC('custo', e.target.value)} style={S.inp} min="0" step="0.01" />
                                </div>
                              )}
                              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', gridColumn: criarForm.tipo === 'receita' ? 'auto' : 'span 2' }}>
                                <button onClick={salvarNovo} style={{ ...S.btn(TEAL), flex: 1 }}>Criar e Conciliar ✓</button>
                                <button onClick={() => setNovoForm(null)} style={S.btn('var(--color-background-secondary)', 'var(--color-text-secondary)')}>✕</button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// LOG DE AUDITORIA
// ═══════════════════════════════════════════════════════
function LogAuditoria({ auditLog, users }) {
  const [userFilter, setUserFilter] = useState('');
  const filtered = auditLog.filter(e => !userFilter || e.userId === userFilter);

  return (
    <div>
      <PageHeader title="Log de Auditoria" />
      <div style={S.card}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <label style={{ ...S.lbl, marginBottom: 0, fontSize: 13 }}>Filtrar por usuário:</label>
          <select value={userFilter} onChange={e => setUserFilter(e.target.value)} style={{ ...S.inp, width: 200, padding: '6px 10px', fontSize: 13 }}>
            <option value="">Todos os usuários</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{filtered.length} registros</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Data / Hora','Usuário','Ação','Entidade','Detalhes'].map(h => <th key={h} style={S.TH}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.length === 0 && <EmptyRow cols={5} msg="Nenhum registro de auditoria ainda." />}
            {filtered.map(e => {
              const user = users.find(u => u.id === e.userId);
              return (
                <tr key={e.id}>
                  <td style={{ ...S.TD, fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(e.ts).toLocaleString('pt-BR')}</td>
                  <td style={S.TD}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: user?.color || '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{user?.initials || '?'}</div>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{e.userName}</span>
                    </div>
                  </td>
                  <td style={{ ...S.TD, fontSize: 12 }}>{e.action}</td>
                  <td style={S.TD}><span style={S.tag('var(--color-background-secondary)', 'var(--color-text-secondary)')}>{e.entity}</span></td>
                  <td style={{ ...S.TD, fontSize: 12, color: 'var(--color-text-secondary)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.details}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// BARRA DE PERÍODO GLOBAL
// ═══════════════════════════════════════════════════════
function PeriodoBar({ periodo, setPeriodo }) {
  const monthRange = buildMonthRange(periodo.start, periodo.end);
  const inp = { background: 'rgba(255,255,255,.08)', border: '0.5px solid rgba(255,255,255,.2)', borderRadius: 6, color: '#fff', padding: '4px 10px', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' };

  const setQuick = (offset, count) => {
    const ms = getMonths(count, offset);
    setPeriodo({ start: ms[0], end: ms[ms.length - 1] });
  };

  const shortcuts = [
    { label: '1M',  title: 'Este mês',         fn: () => setQuick(0, 1) },
    { label: '3M',  title: 'Últimos 3 meses',  fn: () => setQuick(-2, 3) },
    { label: '6M',  title: 'Últimos 6 meses',  fn: () => setQuick(-5, 6) },
    { label: '12M', title: 'Últimos 12 meses', fn: () => setQuick(-11, 12) },
    { label: 'Ano', title: `${new Date().getFullYear()}`, fn: () => setPeriodo({ start: `${new Date().getFullYear()}-01`, end: today().slice(0, 7) }) },
  ];

  const active = shortcuts.find(s => {
    const test = getMonths(parseInt(s.label) || 12, s.label === 'Ano' ? -(new Date().getMonth()) : -(parseInt(s.label)-1));
    if (s.label === 'Ano') return periodo.start === `${new Date().getFullYear()}-01`;
    if (!parseInt(s.label)) return false;
    const ms = getMonths(parseInt(s.label), -(parseInt(s.label)-1));
    return periodo.start === ms[0] && periodo.end === ms[ms.length-1];
  })?.label;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 24px', background: '#0a1832', borderBottom: '0.5px solid rgba(0,196,216,.18)', flexWrap: 'wrap', flexShrink: 0 }}>
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', color: TEAL, whiteSpace: 'nowrap' }}>PERÍODO</span>
      <input type="month" value={periodo.start} onChange={e => setPeriodo(p => ({ ...p, start: e.target.value }))} style={inp} />
      <span style={{ color: 'rgba(255,255,255,.35)', fontSize: 14 }}>→</span>
      <input type="month" value={periodo.end} onChange={e => setPeriodo(p => ({ ...p, end: e.target.value }))} style={inp} />
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', whiteSpace: 'nowrap' }}>
        {monthRange.length} {monthRange.length === 1 ? 'mês' : 'meses'}
      </span>
      <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,.1)', margin: '0 2px' }} />
      {shortcuts.map(s => (
        <button key={s.label} onClick={s.fn} title={s.title}
          style={{ background: active === s.label ? `${TEAL}33` : 'rgba(255,255,255,.06)', border: `0.5px solid ${active === s.label ? TEAL : 'rgba(255,255,255,.14)'}`, borderRadius: 5, color: active === s.label ? TEAL : 'rgba(255,255,255,.5)', padding: '3px 9px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: active === s.label ? 600 : 400 }}>
          {s.label}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// APP PRINCIPAL
// ═══════════════════════════════════════════════════════
export default function PrumaFinanceiro() {
  const [loading, setLoading]       = useState(true);
  const [users, setUsers]           = useState(U0);
  const [currentUser, setCurrentUser] = useState(null);
  const [settingPin, setSettingPin] = useState(false);
  const [page, setPage]             = useState('dashboard');
  const [lancamentos, setLancamentos] = useState([]);
  const [clientes, setClientes]     = useState([]);
  const [plano, setPlano]           = useState(P0);
  const [extratos, setExtratos]     = useState([]);
  const [auditLog, setAuditLog]     = useState([]);
  const [periodo, setPeriodo]       = useState({ start: getMonths(6, -5)[0], end: today().slice(0, 7) });

  useEffect(() => {
    (async () => {
      const [u, l, c, p, e, a] = await Promise.all([
        stLoad(K.users, U0), stLoad(K.lanc, []), stLoad(K.cli, []),
        stLoad(K.plano, P0),  stLoad(K.ext, []), stLoad(K.audit, []),
      ]);
      setUsers(u); setLancamentos(l); setClientes(c);
      setPlano(p); setExtratos(e);   setAuditLog(a);
      setLoading(false);
    })();
  }, []);

  const addAudit = async (action, entity, details = '') => {
    if (!currentUser) return;
    const entry = { id: uid(), ts: new Date().toISOString(), userId: currentUser.id, userName: currentUser.name, action, entity, details };
    const next = [entry, ...auditLog].slice(0, 500);
    setAuditLog(next);
    await stSave(K.audit, next);
  };

  const saveLanc   = async it => { setLancamentos(it); await stSave(K.lanc,   it); };
  const saveCli    = async it => { setClientes(it);    await stSave(K.cli,    it); };
  const savePlano  = async it => { setPlano(it);       await stSave(K.plano,  it); };
  const saveUsers_ = async it => { setUsers(it);       await stSave(K.users,  it); };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: 'var(--color-text-secondary)', fontSize: 14 }}>
      Carregando dados compartilhados...
    </div>
  );

  if (!currentUser) return (
    <LoginScreen users={users} onLogin={user => {
      if (!user.pin) { setCurrentUser(user); setSettingPin(true); }
      else setCurrentUser(user);
    }} />
  );

  if (settingPin) return (
    <PinSetupScreen user={currentUser} onSave={async pin => {
      const next = users.map(u => u.id === currentUser.id ? { ...u, pin: hashPin(pin) } : u);
      await saveUsers_(next);
      setCurrentUser({ ...currentUser, pin: hashPin(pin) });
      setSettingPin(false);
      await addAudit('Configurou PIN', 'Usuário', currentUser.name);
    }} />
  );

  const shared = { lancamentos, clientes, plano, extratos, auditLog, users, currentUser, periodo, addAudit, saveLanc, saveCli, savePlano };

  // Pages that should NOT show the period bar
  const noPeriodo = ['clientes', 'plano', 'conciliacao', 'audit'];

  return (
    <div style={{ display: 'flex', fontFamily: 'var(--font-sans)', minHeight: '100vh' }}>
      <Sidebar page={page} setPage={p => { setPage(p); }} user={currentUser} onLogout={() => setCurrentUser(null)} />
      <div style={{ flex: 1, background: 'var(--color-background-secondary)', overflowY: 'auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {!noPeriodo.includes(page) && <PeriodoBar periodo={periodo} setPeriodo={setPeriodo} />}
        <div style={{ padding: 24, maxWidth: 1200, flex: 1 }}>
          {page === 'dashboard'   && <Dashboard   {...shared} />}
          {page === 'lancamentos' && <Lancamentos  {...shared} />}
          {page === 'clientes'    && <Clientes     {...shared} />}
          {page === 'plano'       && <PlanoContas  {...shared} />}
          {page === 'dre'         && <DRE          {...shared} />}
          {page === 'fluxo'       && <FluxoCaixa   {...shared} />}
          {page === 'crp'         && <ContasReceberPagar {...shared} />}
          {page === 'vendas'      && <RelatorioVendas   {...shared} />}
          {page === 'ciclo'       && <CicloFinanceiro   {...shared} />}
          {page === 'conciliacao' && <Conciliacao  {...shared} />}
          {page === 'audit'       && <LogAuditoria {...shared} />}
        </div>
      </div>
    </div>
  );
}
