import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { storage } from "./storage.js";

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
  plano: 'pf_plano', ext: 'pf_ext', audit: 'pf_audit',
};

const U0 = [
  { id: 'kelly',   name: 'Kelly Lima',        initials: 'KL', color: TEAL,  pin: null },
  { id: 'marcelo', name: 'Marcelo Mattioli',   initials: 'MM', color: BLUE,  pin: null },
  { id: 'diogo',   name: 'Diogo Arado',        initials: 'DA', color: AMBER, pin: null },
];

const P0 = [
  { id: 'r1', cod: '1.1', nome: 'Retainer / Mensalidade',   grupo: 'Receita Operacional',   tipo: 'receita' },
  { id: 'r2', cod: '1.2', nome: 'Diagnóstico Financeiro',   grupo: 'Receita Operacional',   tipo: 'receita' },
  { id: 'r3', cod: '1.3', nome: 'Implantação / Projeto',    grupo: 'Receita Operacional',   tipo: 'receita' },
  { id: 'r4', cod: '1.4', nome: 'Mentoria / Advisory',      grupo: 'Receita Operacional',   tipo: 'receita' },
  { id: 'r5', cod: '1.5', nome: 'Outras Receitas',          grupo: 'Receita Operacional',   tipo: 'receita' },
  { id: 'd1', cod: '2.1', nome: 'Pessoal',                  grupo: 'Custos Operacionais',   tipo: 'despesa' },
  { id: 'd2', cod: '2.2', nome: 'Ocupação',                 grupo: 'Custos Operacionais',   tipo: 'despesa' },
  { id: 'd3', cod: '2.3', nome: 'Tecnologia',               grupo: 'Despesas Operacionais', tipo: 'despesa' },
  { id: 'd4', cod: '2.4', nome: 'Marketing e Vendas',       grupo: 'Despesas Operacionais', tipo: 'despesa' },
  { id: 'd5', cod: '2.5', nome: 'Impostos e Taxas',         grupo: 'Despesas Operacionais', tipo: 'despesa' },
  { id: 'd6', cod: '2.6', nome: 'Financeiro',               grupo: 'Despesas Financeiras',  tipo: 'despesa' },
  { id: 'd7', cod: '2.7', nome: 'Despesas Gerais',          grupo: 'Despesas Operacionais', tipo: 'despesa' },
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
const getMonths = (count, offset = 0) => {
  const r = [], d = new Date();
  for (let i = offset; i < offset + count; i++) {
    const t = new Date(d.getFullYear(), d.getMonth() + i, 1);
    r.push(t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0'));
  }
  return r;
};

// ═══════════════════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════════════════
const stLoad = async (key, def) => {
  try { const r = await storage.get(key); return r ? JSON.parse(r.value) : def; }
  catch { return def; }
};
const stSave = async (key, val) => {
  try { await storage.set(key, JSON.stringify(val)); } catch {}
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
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ ...S.card, width, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--color-text-secondary)', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
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
function Dashboard({ lancamentos, clientes }) {
  const cur = today().slice(0, 7);
  const realRec  = lancamentos.filter(l => l.tipo === 'receita'  && l.status === 'realizado' && mk(l.dt_competencia) === cur).reduce((s, l) => s + l.valor, 0);
  const realDesp = lancamentos.filter(l => l.tipo === 'despesa'  && l.status === 'realizado' && mk(l.dt_competencia) === cur).reduce((s, l) => s + l.valor, 0);
  const prevRec  = lancamentos.filter(l => l.tipo === 'receita'  && l.status === 'previsto'  && mk(l.dt_competencia) === cur).reduce((s, l) => s + l.valor, 0);
  const aReceber = lancamentos.filter(l => l.tipo === 'receita'  && !l.dt_caixa_realizada).reduce((s, l) => s + l.valor, 0);
  const aPagar   = lancamentos.filter(l => l.tipo === 'despesa'  && !l.dt_caixa_realizada).reduce((s, l) => s + l.valor, 0);
  const resultado = realRec - realDesp;

  const ms = getMonths(6, -5);
  const chartData = ms.map(m => ({
    name: ml(m),
    Receita: +lancamentos.filter(l => l.tipo === 'receita' && l.status === 'realizado' && mk(l.dt_competencia) === m).reduce((s, l) => s + l.valor, 0).toFixed(2),
    Despesa: +lancamentos.filter(l => l.tipo === 'despesa' && l.status === 'realizado' && mk(l.dt_competencia) === m).reduce((s, l) => s + l.valor, 0).toFixed(2),
  }));

  const proximos = lancamentos
    .filter(l => !l.dt_caixa_realizada && l.dt_caixa_prevista && l.dt_caixa_prevista >= today())
    .sort((a, b) => a.dt_caixa_prevista.localeCompare(b.dt_caixa_prevista))
    .slice(0, 7);

  return (
    <div>
      <PageHeader title="Dashboard" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Receita Realizada (mês)" val={fmt(realRec)} color={TEAL} />
        <KpiCard label="Despesa Realizada (mês)" val={fmt(realDesp)} color={RED} />
        <KpiCard label="Resultado (mês)" val={fmt(resultado)} color={resultado >= 0 ? TEAL : RED} sub={resultado >= 0 ? 'Lucro ✓' : 'Prejuízo'} />
        <KpiCard label="Receita Prevista (mês)" val={fmt(prevRec)} color={BLUE} sub="Não realizado ainda" />
        <KpiCard label="A Receber" val={fmt(aReceber)} color={TEAL_D} />
        <KpiCard label="A Pagar" val={fmt(aPagar)} color={AMBER} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Receita vs Despesa — últimos 6 meses</div>
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
function Lancamentos({ lancamentos, clientes, plano, currentUser, addAudit, saveLanc }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [filter, setFilter] = useState({ tipo: '', status: '', mes: '' });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const emptyForm = { tipo: 'receita', status: 'previsto', descricao: '', conta_id: '', cliente_id: '', valor: '', custo: '', dt_competencia: today(), dt_caixa_prevista: '', dt_caixa_realizada: '' };

  const onSave = async () => {
    if (!form.descricao?.trim() || !form.valor || !form.conta_id || !form.dt_competencia)
      return alert('Preencha: Descrição, Conta, Valor e Data de Competência.');
    const item = { ...form, id: form.id || uid(), valor: +form.valor || 0, custo: +form.custo || 0, criado_por: currentUser.name };
    const isNew = !form.id;
    await saveLanc(isNew ? [...lancamentos, item] : lancamentos.map(l => l.id === item.id ? item : l));
    await addAudit(isNew ? 'Criou lançamento' : 'Editou lançamento', 'Lançamento', item.descricao);
    setModal(false);
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

  return (
    <div>
      <PageHeader title="Lançamentos" action={
        <button onClick={() => { setForm(emptyForm); setModal(true); }} style={S.btn(TEAL)}>+ Novo Lançamento</button>
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
                        <button onClick={() => { setForm({ ...l }); setModal(true); }} style={S.sm('var(--color-background-secondary)', 'var(--color-text-secondary)')}>✎</button>
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
        <Modal title={form.id ? 'Editar Lançamento' : 'Novo Lançamento'} onClose={() => setModal(false)}>
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
              <select value={form.conta_id || ''} onChange={e => setF('conta_id', e.target.value)} style={S.inp}>
                <option value="">Selecione...</option>
                {plano.filter(p => p.tipo === (form.tipo || 'receita')).map(p =>
                  <option key={p.id} value={p.id}>{p.cod} — {p.nome}</option>)}
              </select>
            </Field>
            <Field label="Cliente">
              <select value={form.cliente_id || ''} onChange={e => setF('cliente_id', e.target.value)} style={S.inp}>
                <option value="">— Nenhum —</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Field>
            <Field label="Valor (R$) *">
              <input type="number" value={form.valor || ''} onChange={e => setF('valor', e.target.value)} style={S.inp} min="0" step="0.01" />
            </Field>
            {form.tipo === 'receita' && (
              <Field label="Custo do serviço (R$) — para margem">
                <input type="number" value={form.custo || ''} onChange={e => setF('custo', e.target.value)} style={S.inp} min="0" step="0.01" />
              </Field>
            )}
            <Field label="Data de Competência *">
              <input type="date" value={form.dt_competencia || ''} onChange={e => setF('dt_competencia', e.target.value)} style={S.inp} />
            </Field>
            <Field label="Vencimento (Caixa Previsto)">
              <input type="date" value={form.dt_caixa_prevista || ''} onChange={e => setF('dt_caixa_prevista', e.target.value)} style={S.inp} />
            </Field>
            <Field label="Data de Receb. / Pagamento">
              <input type="date" value={form.dt_caixa_realizada || ''} onChange={e => { setF('dt_caixa_realizada', e.target.value); if (e.target.value) setF('status', 'realizado'); }} style={S.inp} />
            </Field>
            <Field label="Status">
              <select value={form.status || 'previsto'} onChange={e => setF('status', e.target.value)} style={S.inp}>
                <option value="previsto">Previsto</option>
                <option value="realizado">Realizado</option>
              </select>
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 22, justifyContent: 'flex-end' }}>
            <button onClick={() => setModal(false)} style={S.btn('var(--color-background-secondary)', 'var(--color-text-primary)')}>Cancelar</button>
            <button onClick={onSave} style={S.btn(TEAL)}>Salvar Lançamento</button>
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
    const item = { ...form, id: form.id || uid() };
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
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', width: 36, flexShrink: 0 }}>{p.cod}</span>
            <span style={{ flex: 1, fontSize: 13 }}>{p.nome}</span>
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
        <button onClick={() => { setForm({ tipo: 'receita', cod: '', nome: '', grupo: '' }); setModal(true); }} style={S.btn(TEAL)}>+ Nova Conta</button>
      } />
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
function DRE({ lancamentos, plano }) {
  const [mes, setMes] = useState(today().slice(0, 7));

  const sumContas = (contas, statusFilter) =>
    contas.reduce((s, p) => {
      return s + lancamentos.filter(l =>
        l.conta_id === p.id && mk(l.dt_competencia) === mes && (!statusFilter || l.status === statusFilter)
      ).reduce((ss, l) => ss + l.valor, 0);
    }, 0);

  const G = grupo => plano.filter(p => p.grupo === grupo);
  const dreRows = [
    { section: 'Receitas',             contas: plano.filter(p => p.tipo === 'receita') },
    { label: 'RECEITA BRUTA',          compute: st => sumContas(plano.filter(p => p.tipo === 'receita'), st), total: true, positive: true },
    { section: 'Custos Operacionais',  contas: G('Custos Operacionais') },
    { label: 'LUCRO BRUTO',            compute: st => sumContas(plano.filter(p => p.tipo === 'receita'), st) - sumContas(G('Custos Operacionais'), st), total: true, positive: true },
    { section: 'Despesas Operacionais',contas: G('Despesas Operacionais') },
    { label: 'EBITDA',                 compute: st => sumContas(plano.filter(p => p.tipo === 'receita'), st) - sumContas(G('Custos Operacionais'), st) - sumContas(G('Despesas Operacionais'), st), total: true, positive: true },
    { section: 'Despesas Financeiras', contas: G('Despesas Financeiras') },
    { label: 'RESULTADO LÍQUIDO',      compute: st => sumContas(plano.filter(p => p.tipo === 'receita'), st) - sumContas(plano.filter(p => p.tipo === 'despesa'), st), total: true, positive: true, highlight: true },
  ];

  const secColor = { 'Receitas': TEAL_D, 'Custos Operacionais': RED, 'Despesas Operacionais': RED, 'Despesas Financeiras': RED };
  const secBg    = { 'Receitas': TEAL_L, 'Custos Operacionais': RED_L, 'Despesas Operacionais': RED_L, 'Despesas Financeiras': RED_L };

  return (
    <div>
      <PageHeader title="DRE — Demonstrativo de Resultado" action={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Período:</span>
          <input type="month" value={mes} onChange={e => setMes(e.target.value)} style={{ ...S.inp, width: 148, padding: '7px 10px', fontSize: 13 }} />
        </div>
      } />

      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...S.TH, width: '38%' }}>Conta</th>
              <th style={{ ...S.TH, textAlign: 'right' }}>Orçado (Total)</th>
              <th style={{ ...S.TH, textAlign: 'right' }}>Realizado</th>
              <th style={{ ...S.TH, textAlign: 'right' }}>Variação</th>
            </tr>
          </thead>
          <tbody>
            {dreRows.map((row, i) => {
              if (row.section) return (
                <tr key={i}>
                  <td colSpan={4} style={{ padding: '10px 12px 4px', fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: secColor[row.section] || 'var(--color-text-secondary)', textTransform: 'uppercase', background: secBg[row.section] || 'transparent', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                    {row.section.includes('Despesas') || row.section.includes('Custos') ? '(-)  ' : '(+)  '}{row.section}
                  </td>
                </tr>
              );
              if (row.contas) return row.contas.sort((a,b) => a.cod.localeCompare(b.cod)).map(p => {
                const orc = sumContas([p], null), real = sumContas([p], 'realizado'), var_ = real - orc;
                return (
                  <tr key={p.id}>
                    <td style={{ ...S.TD, paddingLeft: 24, fontSize: 12 }}>{p.nome}</td>
                    <td style={{ ...S.TD, textAlign: 'right', fontSize: 12 }}>{fmt(orc)}</td>
                    <td style={{ ...S.TD, textAlign: 'right', fontSize: 12 }}>{fmt(real)}</td>
                    <td style={{ ...S.TD, textAlign: 'right', fontSize: 12, color: var_ >= 0 ? TEAL_D : RED }}>{var_ >= 0 ? '+' : ''}{fmt(var_)}</td>
                  </tr>
                );
              });
              if (row.label) {
                const orc = row.compute(null), real = row.compute('realizado'), var_ = real - orc;
                const color = real >= 0 ? TEAL_D : RED;
                return (
                  <tr key={i} style={{ background: row.highlight ? `${TEAL}11` : 'var(--color-background-secondary)' }}>
                    <td style={{ ...S.TD, fontWeight: row.highlight ? 800 : 700, fontSize: row.highlight ? 14 : 13, borderTop: '1px solid var(--color-border-tertiary)' }}>{row.label}</td>
                    <td style={{ ...S.TD, textAlign: 'right', fontWeight: 700, color, borderTop: '1px solid var(--color-border-tertiary)' }}>{fmt(orc)}</td>
                    <td style={{ ...S.TD, textAlign: 'right', fontWeight: 700, color, borderTop: '1px solid var(--color-border-tertiary)' }}>{fmt(real)}</td>
                    <td style={{ ...S.TD, textAlign: 'right', fontSize: 12, color: var_ >= 0 ? TEAL_D : RED, borderTop: '1px solid var(--color-border-tertiary)' }}>{var_ >= 0 ? '+' : ''}{fmt(var_)}</td>
                  </tr>
                );
              }
              return null;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// FLUXO DE CAIXA
// ═══════════════════════════════════════════════════════
function FluxoCaixa({ lancamentos }) {
  const [saldo0, setSaldo0] = useState('0');
  const [view, setView] = useState('realizado');
  const ms = getMonths(6, -3);

  const getVal = (tipo, m) => lancamentos.filter(l => {
    const dateCaixa = view === 'realizado' ? l.dt_caixa_realizada : (l.dt_caixa_realizada || l.dt_caixa_prevista);
    return l.tipo === tipo && mk(dateCaixa) === m && (view === 'projetado' || l.status === 'realizado');
  }).reduce((s, l) => s + l.valor, 0);

  let saldo = +saldo0 || 0;
  const rows = ms.map(m => {
    const ent = getVal('receita', m), sai = getVal('despesa', m), liq = ent - sai;
    const sf = saldo + liq;
    const r = { m, ent, sai, liq, si: saldo, sf };
    saldo = sf;
    return r;
  });

  const chartData = rows.map(r => ({ name: ml(r.m), Entradas: +r.ent.toFixed(2), Saídas: +r.sai.toFixed(2), 'Saldo Final': +r.sf.toFixed(2) }));

  return (
    <div>
      <PageHeader title="Fluxo de Caixa" action={
        <div style={{ display: 'flex', gap: 6 }}>
          {['realizado', 'projetado'].map(v => (
            <button key={v} onClick={() => setView(v)} style={S.sm(view === v ? TEAL : 'var(--color-background-primary)', view === v ? '#fff' : 'var(--color-text-secondary)')}>
              {v === 'realizado' ? 'Realizado' : 'Projetado'}
            </button>
          ))}
        </div>
      } />

      <div style={{ ...S.card, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
        <label style={{ ...S.lbl, marginBottom: 0, whiteSpace: 'nowrap', fontSize: 13 }}>Saldo Inicial (R$):</label>
        <input type="number" value={saldo0} onChange={e => setSaldo0(e.target.value)} style={{ ...S.inp, width: 180 }} />
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Carry-forward automático mês a mês</span>
      </div>

      <div style={S.card}>
        <div style={{ overflowX: 'auto', marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 650 }}>
            <thead>
              <tr>
                <th style={S.TH}>Mês</th>
                <th style={{ ...S.TH, textAlign: 'right' }}>Saldo Inicial</th>
                <th style={{ ...S.TH, textAlign: 'right', color: TEAL_D }}>(+) Entradas</th>
                <th style={{ ...S.TH, textAlign: 'right', color: RED }}>(-) Saídas</th>
                <th style={{ ...S.TH, textAlign: 'right' }}>Líquido</th>
                <th style={{ ...S.TH, textAlign: 'right' }}>Saldo Final</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.m} style={{ background: mk(today()) === r.m ? 'var(--color-background-secondary)' : 'transparent' }}>
                  <td style={{ ...S.TD, fontWeight: mk(today()) === r.m ? 600 : 400 }}>{ml(r.m)}{mk(today()) === r.m && <span style={{ fontSize: 10, color: TEAL_D, marginLeft: 6 }}>atual</span>}</td>
                  <td style={{ ...S.TD, textAlign: 'right', fontSize: 12 }}>{fmt(r.si)}</td>
                  <td style={{ ...S.TD, textAlign: 'right', fontWeight: 500, color: TEAL_D }}>{fmt(r.ent)}</td>
                  <td style={{ ...S.TD, textAlign: 'right', fontWeight: 500, color: RED }}>({fmt(r.sai)})</td>
                  <td style={{ ...S.TD, textAlign: 'right', fontWeight: 500, color: r.liq >= 0 ? TEAL_D : RED }}>{fmt(r.liq)}</td>
                  <td style={{ ...S.TD, textAlign: 'right', fontWeight: 700, color: r.sf >= 0 ? TEAL_D : RED }}>{fmt(r.sf)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-tertiary)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={70}
              tickFormatter={v => Intl.NumberFormat('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' }).format(v)} />
            <Tooltip formatter={(v, n) => [fmt(v), n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area dataKey="Entradas"    stroke={TEAL} fill={TEAL_L} strokeWidth={2} />
            <Area dataKey="Saídas"      stroke={RED}  fill={RED_L}  strokeWidth={1.5} />
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
function ContasReceberPagar({ lancamentos, clientes, plano, currentUser, addAudit, saveLanc }) {
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
function RelatorioVendas({ lancamentos, clientes, plano }) {
  const [periodo, setPeriodo] = useState('');

  const receitas = lancamentos.filter(l => l.tipo === 'receita' && (!periodo || mk(l.dt_competencia) === periodo));

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

  const chartMs = getMonths(6, -5);
  const chartData = chartMs.map(m => ({
    name: ml(m),
    MRR: +lancamentos.filter(l => l.tipo === 'receita' && mk(l.dt_competencia) === m).reduce((s, l) => s + l.valor, 0).toFixed(2),
  }));

  return (
    <div>
      <PageHeader title="Vendas por Serviço" action={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Período:</span>
          <input type="month" value={periodo} onChange={e => setPeriodo(e.target.value)} style={{ ...S.inp, width: 148, padding: '7px 10px', fontSize: 13 }} />
          {periodo && <button onClick={() => setPeriodo('')} style={S.sm('var(--color-background-secondary)', 'var(--color-text-secondary)')}>× Limpar</button>}
        </div>
      } />

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
function CicloFinanceiro({ lancamentos, clientes, plano }) {
  const realizadas = tipo => lancamentos.filter(l =>
    l.tipo === tipo && l.status === 'realizado' && l.dt_competencia && l.dt_caixa_realizada
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
function Conciliacao({ lancamentos, currentUser, addAudit, saveLanc }) {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');

  const parseCSV = (text) => {
    const lines = text.trim().split('\n').filter(l => l.trim());
    return lines.slice(1).map(line => {
      const cols = line.split(';').map(c => c.trim().replace(/"/g, ''));
      const dateStr = cols[0]?.includes('/') ? cols[0].split('/').reverse().join('-') : cols[0];
      const val = parseFloat((cols[2] || '0').replace(/\./g,'').replace(',', '.')) || 0;
      return { id: uid(), data: dateStr, historico: cols[1] || '', valor: Math.abs(val), tipo: val >= 0 ? 'credito' : 'debito', conciliado: false, lancamento_id: null };
    }).filter(r => r.historico);
  };

  const parseOFX = (text) => {
    const stmts = text.split('<STMTTRN>').slice(1);
    return stmts.map(stmt => {
      const get = tag => { const m = stmt.match(new RegExp('<' + tag + '>([^<\n]+)')); return m ? m[1].trim() : ''; };
      const dr = get('DTPOSTED');
      const val = parseFloat(get('TRNAMT')) || 0;
      return { id: uid(), data: dr ? `${dr.slice(0,4)}-${dr.slice(4,6)}-${dr.slice(6,8)}` : '', historico: get('MEMO') || get('NAME'), valor: Math.abs(val), tipo: val >= 0 ? 'credito' : 'debito', conciliado: false, lancamento_id: null };
    }).filter(r => r.historico);
  };

  const onFile = e => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = file.name.toLowerCase().endsWith('.ofx') ? parseOFX(ev.target.result) : parseCSV(ev.target.result);
        if (!parsed.length) setErr('Nenhuma transação reconhecida. Verifique o formato (CSV: Data;Histórico;Valor;Saldo ou OFX padrão).');
        else { setRows(parsed); setErr(''); }
      } catch { setErr('Erro ao processar o arquivo.'); }
    };
    reader.readAsText(file, 'ISO-8859-1');
  };

  const vincular = async (extId, lancId) => {
    const ext = rows.find(r => r.id === extId);
    const updated = rows.map(r => r.id === extId ? { ...r, lancamento_id: lancId, conciliado: !!lancId } : r);
    setRows(updated);
    if (lancId && ext) {
      await saveLanc(lancamentos.map(l => l.id === lancId ? { ...l, dt_caixa_realizada: ext.data, status: 'realizado' } : l));
      await addAudit('Conciliou extrato', 'Conciliação', `${ext.historico} → lançamento ${lancId}`);
    }
  };

  const pendentes = lancamentos.filter(l => !l.dt_caixa_realizada);
  const conciliadas = rows.filter(r => r.conciliado).length;

  return (
    <div>
      <PageHeader title="Conciliação Bancária" />

      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Importar Extrato</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
          Aceita <strong>CSV</strong> (formato: Data;Histórico;Valor;Saldo — padrão da maioria dos bancos brasileiros) e <strong>OFX</strong> (Open Financial Exchange).
        </div>
        <input type="file" accept=".csv,.ofx,.txt" onChange={onFile} style={{ fontSize: 13 }} />
        {err && <div style={{ color: RED, fontSize: 12, marginTop: 8 }}>{err}</div>}
        {rows.length > 0 && <div style={{ fontSize: 12, color: TEAL_D, marginTop: 8, fontWeight: 500 }}>{rows.length} transações importadas · {conciliadas} conciliadas · {rows.length - conciliadas} pendentes</div>}
      </div>

      {rows.length > 0 && (
        <div style={S.card}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Data','Histórico','Tipo','Valor','Vincular a Lançamento','Status'].map(h => <th key={h} style={S.TH}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={{ background: r.conciliado ? GREEN_L : 'transparent' }}>
                  <td style={{ ...S.TD, fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(r.data)}</td>
                  <td style={{ ...S.TD, fontSize: 12, maxWidth: 220 }}>{r.historico}</td>
                  <td style={S.TD}><span style={S.tag(r.tipo === 'credito' ? TEAL_L : RED_L, r.tipo === 'credito' ? TEAL_D : RED)}>{r.tipo === 'credito' ? 'Crédito' : 'Débito'}</span></td>
                  <td style={{ ...S.TD, fontWeight: 600, color: r.tipo === 'credito' ? TEAL_D : RED }}>{fmt(r.valor)}</td>
                  <td style={S.TD}>
                    {r.conciliado
                      ? <span style={{ fontSize: 12, color: GREEN }}>✓ Conciliado</span>
                      : (
                        <select defaultValue="" onChange={ev => vincular(r.id, ev.target.value)} style={{ ...S.inp, width: 240, padding: '4px 8px', fontSize: 11 }}>
                          <option value="">Selecione um lançamento...</option>
                          {pendentes.filter(l => l.tipo === (r.tipo === 'credito' ? 'receita' : 'despesa')).map(l =>
                            <option key={l.id} value={l.id}>{l.descricao} — {fmt(l.valor)}</option>
                          )}
                        </select>
                      )}
                  </td>
                  <td style={S.TD}>
                    {r.conciliado
                      ? <span style={S.tag(GREEN_L, GREEN)}>Conciliado</span>
                      : <span style={S.tag(AMBER_L, AMBER)}>Pendente</span>}
                  </td>
                </tr>
              ))}
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

  const shared = { lancamentos, clientes, plano, extratos, auditLog, users, currentUser, addAudit, saveLanc, saveCli, savePlano };

  return (
    <div style={{ display: 'flex', fontFamily: 'var(--font-sans)', minHeight: '100vh' }}>
      <Sidebar page={page} setPage={p => { setPage(p); }} user={currentUser} onLogout={() => setCurrentUser(null)} />
      <div style={{ flex: 1, background: 'var(--color-background-secondary)', overflowY: 'auto', minHeight: '100vh' }}>
        <div style={{ padding: 24, maxWidth: 1200 }}>
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
