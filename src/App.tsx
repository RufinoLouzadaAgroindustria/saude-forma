import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Onboarding } from './components/Onboarding';
import { DashboardHoje } from './components/DashboardHoje';
import { TelaAlimentacao } from './components/TelaAlimentacao';
import { TelaTreinos } from './components/TelaTreinos';
import { TelaAdmin } from './components/TelaAdmin';
import {
  calcularMetasNutricionais,
  PerfilUsuario,
} from './lib/nutritionEngine';

type AbaAtiva = 'hoje' | 'alimentacao' | 'treinos' | 'evolucao' | 'admin';
type ObjetivoUsuario = 'perda_peso' | 'recomposicao' | 'manutencao';
type SexoBiologico = 'masculino' | 'feminino';

interface PerfilEditavel {
  peso_inicial_kg: string;
  altura_cm: string;
  nivel_atividade: string;
  objetivo: ObjetivoUsuario;
  sexo_biologico: SexoBiologico;
  data_nascimento: string;
}

const PERFIL_VAZIO: PerfilEditavel = {
  peso_inicial_kg: '', altura_cm: '', nivel_atividade: '1.375',
  objetivo: 'perda_peso', sexo_biologico: 'feminino', data_nascimento: '',
};

export function App() {
  const [session, setSession] = useState<any>(null);
  const [perfilCompleto, setPerfilCompleto] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('hoje');
  const [carregandoApp, setCarregandoApp] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: sessao } }: any) => {
      setSession(sessao);
      if (sessao?.user) void verificarPerfilUsuario(sessao.user.id);
      else setCarregandoApp(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, sessao: any) => {
      setSession(sessao);
      if (sessao?.user) void verificarPerfilUsuario(sessao.user.id);
      else {
        setPerfilCompleto(null);
        setIsAdmin(false);
        setAbaAtiva('hoje');
        setCarregandoApp(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const verificarPerfilUsuario = async (userId: string) => {
    setCarregandoApp(true);
    const { data } = await supabase
      .from('usuarios')
      .select('id, is_admin')
      .eq('id', userId)
      .maybeSingle();
    setPerfilCompleto(!!data);
    setIsAdmin(data?.is_admin === true);
    setCarregandoApp(false);
  };

  if (carregandoApp) {
    return <div className="flex min-h-screen items-center justify-center text-sm font-medium text-slate-500">Carregando...</div>;
  }
  if (!session) return <TelaAutenticacao />;
  if (perfilCompleto === false) {
    return <Onboarding userId={session.user.id} userEmail={session.user.email || ''} onComplete={() => setPerfilCompleto(true)} />;
  }

  const sair = () => setAbaAtiva('hoje');
  const abas = [
    { id: 'hoje' as const, rotulo: 'Hoje', icone: '🏠' },
    { id: 'alimentacao' as const, rotulo: 'Alimentação', icone: '🥗' },
    { id: 'treinos' as const, rotulo: 'Treinos', icone: '💪' },
    { id: 'evolucao' as const, rotulo: 'Evolução', icone: '📈' },
    ...(isAdmin ? [{ id: 'admin' as const, rotulo: 'Admin', icone: '⚙️' }] : []),
  ];
  const abaAtual = abaAtiva === 'admin' && !isAdmin ? 'hoje' : abaAtiva;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main>
        {abaAtual === 'hoje' && <DashboardHoje userId={session.user.id} />}
        {abaAtual === 'alimentacao' && <TelaAlimentacao userId={session.user.id} />}
        {abaAtual === 'treinos' && <TelaTreinos userId={session.user.id} />}
        {abaAtual === 'evolucao' && <TelaEvolucao userId={session.user.id} onLogout={sair} />}
        {abaAtual === 'admin' && isAdmin && <TelaAdmin />}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white">
        <div className={`mx-auto grid h-16 max-w-md ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'}`}>
          {abas.map((aba) => (
            <button key={aba.id} type="button" onClick={() => setAbaAtiva(aba.id)} className={`flex flex-col items-center justify-center space-y-1 transition-colors ${abaAtual === aba.id ? 'font-bold text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <span className="text-lg leading-none">{aba.icone}</span>
              <span className="text-[11px]">{aba.rotulo}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function TelaAutenticacao() {
  const [modoCadastro, setModoCadastro] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setMensagem('');
    try {
      const { error } = modoCadastro
        ? await supabase.auth.signUp({ email, password: senha })
        : await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) throw error;
      if (modoCadastro) setMensagem('Conta criada com sucesso! Se não entrar automaticamente, faça login abaixo.');
    } catch (error: any) {
      setMensagem(error.message || 'Erro ao autenticar. Verifique seus dados.');
    } finally { setLoading(false); }
  };
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-slate-50 p-4">
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="space-y-1 text-center">
          <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Saúde & Forma</span>
          <h1 className="text-2xl font-bold text-slate-800">{modoCadastro ? 'Criar sua conta' : 'Bem-vindo de volta'}</h1>
          <p className="text-sm text-slate-500">Nutrição e condicionamento físico adaptados a você</p>
        </header>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">E-mail<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3" /></label>
          <label className="block text-sm font-medium text-slate-700">Senha<input type="password" required minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3" /></label>
          {mensagem && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{mensagem}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-emerald-600 py-3.5 font-semibold text-white disabled:opacity-50">{loading ? 'Aguarde...' : modoCadastro ? 'Cadastrar e Começar' : 'Entrar'}</button>
        </form>
        <div className="text-center"><button type="button" onClick={() => { setModoCadastro(!modoCadastro); setMensagem(''); }} className="text-sm font-medium text-emerald-700 hover:underline">{modoCadastro ? 'Já tem uma conta? Faça login' : 'Ainda não tem conta? Cadastre-se'}</button></div>
      </div>
    </div>
  );
}

function TelaEvolucao({ userId, onLogout }: { userId: string; onLogout: () => void }) {
  const [pesoAtual, setPesoAtual] = useState('');
  const [cinturaAtual, setCinturaAtual] = useState('');
  const [historico, setHistorico] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [perfilAberto, setPerfilAberto] = useState(false);
  const [perfil, setPerfil] = useState<PerfilEditavel>(PERFIL_VAZIO);
  const [carregandoPerfil, setCarregandoPerfil] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [erroPerfil, setErroPerfil] = useState('');

  const carregarHistorico = async () => {
    const { data } = await supabase.from('logs_evolucao').select('data_registro, peso_kg, cintura_cm, treino_concluido').eq('usuario_id', userId).not('peso_kg', 'is', null).order('data_registro', { ascending: false }).limit(10);
    if (data) setHistorico(data);
  };
  useEffect(() => { void carregarHistorico(); }, [userId]);

  const carregarPerfil = async () => {
    setCarregandoPerfil(true); setErroPerfil('');
    const { data, error } = await supabase.from('usuarios').select('peso_inicial_kg, altura_cm, nivel_atividade, objetivo, sexo_biologico, data_nascimento').eq('id', userId).maybeSingle();
    if (error || !data) { setErroPerfil('Não foi possível carregar seus dados de perfil.'); setCarregandoPerfil(false); return; }
    setPerfil({ peso_inicial_kg: String(data.peso_inicial_kg ?? ''), altura_cm: String(data.altura_cm ?? ''), nivel_atividade: String(data.nivel_atividade ?? 1.375), objetivo: data.objetivo ?? 'perda_peso', sexo_biologico: data.sexo_biologico ?? 'feminino', data_nascimento: data.data_nascimento ?? '' });
    setCarregandoPerfil(false);
  };
  const salvarPesagem = async (event: React.FormEvent) => {
    event.preventDefault(); if (!pesoAtual) return; setSalvando(true);
    const { error } = await supabase.from('logs_evolucao').upsert({ usuario_id: userId, data_registro: new Date().toISOString().split('T')[0], peso_kg: Number(pesoAtual), cintura_cm: cinturaAtual ? Number(cinturaAtual) : null }, { onConflict: 'usuario_id,data_registro' });
    setSalvando(false);
    if (error) alert('Não foi possível salvar suas medidas.'); else { setPesoAtual(''); setCinturaAtual(''); void carregarHistorico(); }
  };
  const salvarPerfil = async (event: React.FormEvent) => {
    event.preventDefault(); setSalvandoPerfil(true); setErroPerfil('');
    try {
      const pesoKg = Number(perfil.peso_inicial_kg); const alturaCm = Number(perfil.altura_cm); const nivelAtividade = Number(perfil.nivel_atividade); const nascimento = new Date(`${perfil.data_nascimento}T12:00:00`);
      if (!Number.isFinite(pesoKg) || pesoKg <= 0 || !Number.isFinite(alturaCm) || alturaCm <= 0 || !Number.isFinite(nivelAtividade) || !perfil.data_nascimento || Number.isNaN(nascimento.getTime())) throw new Error('Preencha todos os dados com valores válidos.');
      const hoje = new Date(); let idade = hoje.getFullYear() - nascimento.getFullYear(); if (hoje.getMonth() < nascimento.getMonth() || (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate())) idade--; idade = Math.max(14, idade);
      const metas = calcularMetasNutricionais({ peso_kg: pesoKg, altura_cm: alturaCm, nivel_atividade: nivelAtividade, objetivo: perfil.objetivo, sexo_biologico: perfil.sexo_biologico, idade } as PerfilUsuario);
      const { error: perfilError } = await supabase.from('usuarios').update({ peso_inicial_kg: pesoKg, altura_cm: alturaCm, nivel_atividade: nivelAtividade, objetivo: perfil.objetivo, sexo_biologico: perfil.sexo_biologico, data_nascimento: perfil.data_nascimento }).eq('id', userId);
      if (perfilError) throw perfilError;
      const { error: desativarError } = await supabase.from('metas_nutricionais').update({ ativo: false }).eq('usuario_id', userId).eq('ativo', true);
      if (desativarError) throw desativarError;
      const { error: inserirError } = await supabase.from('metas_nutricionais').insert({ usuario_id: userId, calorias_diarias: metas.calorias_diarias, proteinas_g: metas.proteinas_g, carboidratos_g: metas.carboidratos_g, gorduras_g: metas.gorduras_g, agua_ml: metas.agua_ml, ativo: true });
      if (inserirError) throw inserirError;
      alert('Perfil atualizado e metas recalculadas com sucesso.'); setPerfilAberto(false);
    } catch (error: any) { setErroPerfil(error.message || 'Não foi possível recalcular suas metas.'); }
    finally { setSalvandoPerfil(false); }
  };

  return (
    <div className="mx-auto min-h-screen max-w-md space-y-4 bg-slate-50 p-4 pb-24">
      <header className="flex items-center justify-between pt-2"><div><h1 className="text-2xl font-bold text-slate-800">Sua Evolução</h1><p className="text-sm text-slate-500">Acompanhe medidas e constância</p></div><button onClick={onLogout} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100">Sair</button></header>
      <form onSubmit={salvarPesagem} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-800">Registrar Medidas de Hoje</h2><div className="grid grid-cols-2 gap-3"><label className="text-xs text-slate-500">Peso (kg)<input type="number" step="0.1" required value={pesoAtual} onChange={(e) => setPesoAtual(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm" /></label><label className="text-xs text-slate-500">Cintura (cm - opcional)<input type="number" step="0.5" value={cinturaAtual} onChange={(e) => setCinturaAtual(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm" /></label></div><button disabled={salvando} className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white disabled:opacity-50">{salvando ? 'Salvando...' : 'Salvar Registro'}</button></form>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><button type="button" aria-expanded={perfilAberto} onClick={() => { const abrir = !perfilAberto; setPerfilAberto(abrir); if (abrir) void carregarPerfil(); }} className="flex w-full items-center justify-between p-5 text-left"><span className="font-semibold text-slate-800">Editar Meu Perfil e Recalcular Metas</span><span className="text-emerald-700">{perfilAberto ? '−' : '+'}</span></button>{perfilAberto && <div className="border-t border-slate-100 p-5">{carregandoPerfil ? <p className="text-center text-sm text-slate-500">Carregando perfil...</p> : <form onSubmit={salvarPerfil} className="space-y-3">{erroPerfil && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{erroPerfil}</p>}<label className="block text-xs text-slate-500">Peso atual (kg)<input required type="number" min="1" step="0.1" value={perfil.peso_inicial_kg} onChange={(e) => setPerfil({ ...perfil, peso_inicial_kg: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5" /></label><label className="block text-xs text-slate-500">Altura (cm)<input required type="number" min="1" value={perfil.altura_cm} onChange={(e) => setPerfil({ ...perfil, altura_cm: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5" /></label><label className="block text-xs text-slate-500">Data de nascimento<input required type="date" value={perfil.data_nascimento} onChange={(e) => setPerfil({ ...perfil, data_nascimento: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5" /></label><label className="block text-xs text-slate-500">Sexo biológico<select value={perfil.sexo_biologico} onChange={(e) => setPerfil({ ...perfil, sexo_biologico: e.target.value as SexoBiologico })} className="mt-1 w-full rounded-xl border bg-white p-2.5"><option value="feminino">Feminino</option><option value="masculino">Masculino</option></select></label><label className="block text-xs text-slate-500">Nível de atividade<select value={perfil.nivel_atividade} onChange={(e) => setPerfil({ ...perfil, nivel_atividade: e.target.value })} className="mt-1 w-full rounded-xl border bg-white p-2.5"><option value="1.2">Sedentário</option><option value="1.375">Levemente ativo</option><option value="1.55">Moderadamente ativo</option><option value="1.725">Muito ativo</option></select></label><label className="block text-xs text-slate-500">Objetivo<select value={perfil.objetivo} onChange={(e) => setPerfil({ ...perfil, objetivo: e.target.value as ObjetivoUsuario })} className="mt-1 w-full rounded-xl border bg-white p-2.5"><option value="perda_peso">Perder peso</option><option value="recomposicao">Recomposição corporal</option><option value="manutencao">Manutenção</option></select></label><button disabled={salvandoPerfil} className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white disabled:opacity-50">{salvandoPerfil ? 'Salvando e recalculando...' : 'Salvar e Recalcular Metas'}</button></form>}</div>}</section>
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-800">Histórico Recente</h2>{historico.length === 0 ? <p className="text-xs text-slate-500">Nenhum registro de peso lançado ainda.</p> : <div className="divide-y divide-slate-100">{historico.map((item) => <div key={item.data_registro} className="flex items-center justify-between py-2.5 text-sm"><span className="text-slate-600">{new Date(item.data_registro + 'T12:00:00').toLocaleDateString('pt-BR')}</span><span className="font-semibold text-slate-800">{item.peso_kg} kg{item.cintura_cm && <span className="ml-2 text-xs font-normal text-slate-500">({item.cintura_cm} cm)</span>}</span></div>)}</div>}</section>
    </div>
  );
}

export default App;
