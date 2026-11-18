import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { Onboarding } from './components/Onboarding';
import { DashboardHoje } from './components/DashboardHoje';
import { TelaAlimentacao } from './components/TelaAlimentacao';
import { TelaTreinos } from './components/TelaTreinos';
import {
  calcularMetasNutricionais,
  PerfilUsuario,
} from './lib/nutritionEngine';

type AbaAtiva = 'hoje' | 'alimentacao' | 'treinos' | 'evolucao';
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
  peso_inicial_kg: '',
  altura_cm: '',
  nivel_atividade: '1.375',
  objetivo: 'perda_peso',
  sexo_biologico: 'feminino',
  data_nascimento: '',
};

export function App() {
  const [session, setSession] = useState<any>(null);
  const [perfilCompleto, setPerfilCompleto] = useState<boolean | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('hoje');
  const [carregandoApp, setCarregandoApp] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
      if (session?.user) {
        verificarPerfilUsuario(session.user.id);
      } else {
        setCarregandoApp(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
      if (session?.user) {
        verificarPerfilUsuario(session.user.id);
      } else {
        setPerfilCompleto(null);
        setCarregandoApp(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const verificarPerfilUsuario = async (userId: string) => {
    setCarregandoApp(true);
    const { data } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    setPerfilCompleto(!!data);
    setCarregandoApp(false);
  };

  if (carregandoApp) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <TelaAutenticacao />;
  }

  if (perfilCompleto === false) {
    return (
      <Onboarding
        userId={session.user.id}
        userEmail={session.user.email || ''}
        onComplete={() => setPerfilCompleto(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main>
        {abaAtiva === 'hoje' && <DashboardHoje userId={session.user.id} />}
        {abaAtiva === 'alimentacao' && (
          <TelaAlimentacao userId={session.user.id} />
        )}
        {abaAtiva === 'treinos' && <TelaTreinos userId={session.user.id} />}
        {abaAtiva === 'evolucao' && <TelaEvolucao userId={session.user.id} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40">
        <div className="max-w-md mx-auto grid grid-cols-4 h-16">
          <BotaoMenu
            ativo={abaAtiva === 'hoje'}
            onClick={() => setAbaAtiva('hoje')}
            rotulo="Hoje"
            icone="🏠"
          />
          <BotaoMenu
            ativo={abaAtiva === 'alimentacao'}
            onClick={() => setAbaAtiva('alimentacao')}
            rotulo="Alimentação"
            icone="🥗"
          />
          <BotaoMenu
            ativo={abaAtiva === 'treinos'}
            onClick={() => setAbaAtiva('treinos')}
            rotulo="Treinos"
            icone="💪"
          />
          <BotaoMenu
            ativo={abaAtiva === 'evolucao'}
            onClick={() => setAbaAtiva('evolucao')}
            rotulo="Evolução"
            icone="📈"
          />
        </div>
      </nav>
    </div>
  );
}

function BotaoMenu({
  ativo,
  onClick,
  rotulo,
  icone,
}: {
  ativo: boolean;
  onClick: () => void;
  rotulo: string;
  icone: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
        ativo ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <span className="text-lg leading-none">{icone}</span>
      <span className="text-[11px]">{rotulo}</span>
    </button>
  );
}

function TelaAutenticacao() {
  const [modoCadastro, setModoCadastro] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensagem('');

    try {
      if (modoCadastro) {
        const { error } = await supabase.auth.signUp({ email, password: senha });
        if (error) throw error;
        setMensagem('Conta criada com sucesso! Se não entrar automaticamente, faça login abaixo.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setMensagem(err.message || 'Erro ao autenticar. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center p-4 max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
        <div className="text-center space-y-1">
          <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">
            Saúde & Forma
          </span>
          <h1 className="text-2xl font-bold text-slate-800">
            {modoCadastro ? 'Criar sua conta' : 'Bem-vindo de volta'}
          </h1>
          <p className="text-sm text-slate-500">
            Nutrição e condicionamento físico adaptados a você
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {mensagem && (
            <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
              {mensagem}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading
              ? 'Aguarde...'
              : modoCadastro
              ? 'Cadastrar e Começar'
              : 'Entrar'}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setModoCadastro(!modoCadastro);
              setMensagem('');
            }}
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            {modoCadastro
              ? 'Já tem uma conta? Faça login'
              : 'Ainda não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TelaEvolucao({ userId }: { userId: string }) {
  const [pesoAtual, setPesoAtual] = useState('');
  const [cinturaAtual, setCinturaAtual] = useState('');
  const [historico, setHistorico] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [perfilAberto, setPerfilAberto] = useState(false);
  const [perfil, setPerfil] = useState<PerfilEditavel>(PERFIL_VAZIO);
  const [carregandoPerfil, setCarregandoPerfil] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [erroPerfil, setErroPerfil] = useState('');

  useEffect(() => {
    carregarHistorico();
  }, [userId]);

  const carregarHistorico = async () => {
    const { data } = await supabase
      .from('logs_evolucao')
      .select('data_registro, peso_kg, cintura_cm, treino_concluido')
      .eq('usuario_id', userId)
      .not('peso_kg', 'is', null)
      .order('data_registro', { ascending: false })
      .limit(10);

    if (data) setHistorico(data);
  };

  const carregarPerfil = async () => {
    setCarregandoPerfil(true);
    setErroPerfil('');
    const { data, error } = await supabase
      .from('usuarios')
      .select('peso_inicial_kg, altura_cm, nivel_atividade, objetivo, sexo_biologico, data_nascimento')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      setErroPerfil('Não foi possível carregar seus dados de perfil.');
      setCarregandoPerfil(false);
      return;
    }

    setPerfil({
      peso_inicial_kg: String(data.peso_inicial_kg ?? ''),
      altura_cm: String(data.altura_cm ?? ''),
      nivel_atividade: String(data.nivel_atividade ?? 1.375),
      objetivo: data.objetivo ?? 'perda_peso',
      sexo_biologico: data.sexo_biologico ?? 'feminino',
      data_nascimento: data.data_nascimento ?? '',
    });
    setCarregandoPerfil(false);
  };

  const alternarEdicaoPerfil = () => {
    const vaiAbrir = !perfilAberto;
    setPerfilAberto(vaiAbrir);
    if (vaiAbrir) carregarPerfil();
  };

  const registrarPesagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pesoAtual) return;

    setSalvando(true);
    const hojeStr = new Date().toISOString().split('T')[0];

    await supabase.from('logs_evolucao').upsert(
      {
        usuario_id: userId,
        data_registro: hojeStr,
        peso_kg: Number(pesoAtual),
        cintura_cm: cinturaAtual ? Number(cinturaAtual) : null,
      },
      { onConflict: 'usuario_id,data_registro' }
    );

    setPesoAtual('');
    setCinturaAtual('');
    setSalvando(false);
    carregarHistorico();
  };

  const salvarPerfilERecalcular = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoPerfil(true);
    setErroPerfil('');

    try {
      const pesoKg = Number(perfil.peso_inicial_kg);
      const alturaCm = Number(perfil.altura_cm);
      const nivelAtividade = Number(perfil.nivel_atividade);
      const dataNascimento = new Date(`${perfil.data_nascimento}T12:00:00`);
      if (
        !Number.isFinite(pesoKg) || pesoKg <= 0 ||
        !Number.isFinite(alturaCm) || alturaCm <= 0 ||
        !Number.isFinite(nivelAtividade) || nivelAtividade <= 0 ||
        !perfil.data_nascimento || Number.isNaN(dataNascimento.getTime())
      ) {
        throw new Error('Preencha todos os dados com valores válidos.');
      }

      const hoje = new Date();
      let idade = hoje.getFullYear() - dataNascimento.getFullYear();
      const diferencaMes = hoje.getMonth() - dataNascimento.getMonth();
      if (diferencaMes < 0 || (diferencaMes === 0 && hoje.getDate() < dataNascimento.getDate())) {
        idade -= 1;
      }
      idade = Math.max(14, idade);

      const perfilCalc: PerfilUsuario = {
        peso_kg: pesoKg,
        altura_cm: alturaCm,
        nivel_atividade: nivelAtividade,
        objetivo: perfil.objetivo,
        sexo_biologico: perfil.sexo_biologico,
        idade,
      };
      const metas = calcularMetasNutricionais(perfilCalc);

      const { error: erroAtualizacao } = await supabase
        .from('usuarios')
        .update({
          peso_inicial_kg: pesoKg,
          altura_cm: alturaCm,
          nivel_atividade: nivelAtividade,
          objetivo: perfil.objetivo,
          sexo_biologico: perfil.sexo_biologico,
          data_nascimento: perfil.data_nascimento,
        })
        .eq('id', userId);
      if (erroAtualizacao) throw erroAtualizacao;

      const { error: erroDesativacao } = await supabase
        .from('metas_nutricionais')
        .update({ ativo: false })
        .eq('usuario_id', userId)
        .eq('ativo', true);
      if (erroDesativacao) throw erroDesativacao;

      const { error: erroNovaMeta } = await supabase
        .from('metas_nutricionais')
        .insert({
          usuario_id: userId,
          calorias_diarias: metas.calorias_diarias,
          proteinas_g: metas.proteinas_g,
          carboidratos_g: metas.carboidratos_g,
          gorduras_g: metas.gorduras_g,
          agua_ml: metas.agua_ml,
          ativo: true,
        });
      if (erroNovaMeta) throw erroNovaMeta;

      alert('Perfil atualizado e metas recalculadas com sucesso.');
      setPerfilAberto(false);
    } catch (error: any) {
      setErroPerfil(error.message || 'Não foi possível atualizar o perfil e as metas.');
    } finally {
      setSalvandoPerfil(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 max-w-md mx-auto p-4 space-y-4">
      <header className="pt-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sua Evolução</h1>
          <p className="text-sm text-slate-500">Acompanhe medidas e constância</p>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            localStorage.clear();
            window.location.href = '/';
          }}
          className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-100"
        >
          Sair
        </button>
      </header>

      <form
        onSubmit={registrarPesagem}
        className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3"
      >
        <h2 className="font-semibold text-slate-800">Registrar Medidas de Hoje</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Peso (kg)</label>
            <input
              type="number"
              step="0.1"
              required
              value={pesoAtual}
              onChange={(e) => setPesoAtual(e.target.value)}
              placeholder="Ex: 74.5"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Cintura (cm - opcional)
            </label>
            <input
              type="number"
              step="0.5"
              value={cinturaAtual}
              onChange={(e) => setCinturaAtual(e.target.value)}
              placeholder="Ex: 82"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={salvando}
          className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl text-sm hover:bg-emerald-700"
        >
          {salvando ? 'Salvando...' : 'Salvar Registro'}
        </button>
      </form>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <button
          type="button"
          aria-expanded={perfilAberto}
          onClick={alternarEdicaoPerfil}
          className="flex w-full items-center justify-between p-5 text-left"
        >
          <span className="font-semibold text-slate-800">Editar Meu Perfil e Recalcular Metas</span>
          <span className="text-emerald-700" aria-hidden="true">{perfilAberto ? '−' : '+'}</span>
        </button>

        {perfilAberto && (
          <div className="border-t border-slate-100 p-5">
            {carregandoPerfil ? (
              <p className="text-center text-sm text-slate-500">Carregando seu perfil...</p>
            ) : (
              <form onSubmit={salvarPerfilERecalcular} className="space-y-3">
                {erroPerfil && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{erroPerfil}</p>}
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Peso atual (kg)</label>
                  <input type="number" min="1" step="0.1" required value={perfil.peso_inicial_kg} onChange={(e) => setPerfil({ ...perfil, peso_inicial_kg: e.target.value })} className="w-full rounded-xl border border-slate-300 p-2.5 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Altura (cm)</label>
                  <input type="number" min="1" step="1" required value={perfil.altura_cm} onChange={(e) => setPerfil({ ...perfil, altura_cm: e.target.value })} className="w-full rounded-xl border border-slate-300 p-2.5 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Data de nascimento</label>
                  <input type="date" required value={perfil.data_nascimento} onChange={(e) => setPerfil({ ...perfil, data_nascimento: e.target.value })} className="w-full rounded-xl border border-slate-300 p-2.5 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Sexo biológico</label>
                  <select value={perfil.sexo_biologico} onChange={(e) => setPerfil({ ...perfil, sexo_biologico: e.target.value as SexoBiologico })} className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm">
                    <option value="feminino">Feminino</option>
                    <option value="masculino">Masculino</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Nível de atividade</label>
                  <select value={perfil.nivel_atividade} onChange={(e) => setPerfil({ ...perfil, nivel_atividade: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm">
                    <option value="1.2">Sedentário</option>
                    <option value="1.375">Levemente ativo</option>
                    <option value="1.55">Moderadamente ativo</option>
                    <option value="1.725">Muito ativo</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Objetivo</label>
                  <select value={perfil.objetivo} onChange={(e) => setPerfil({ ...perfil, objetivo: e.target.value as ObjetivoUsuario })} className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm">
                    <option value="perda_peso">Perder peso</option>
                    <option value="recomposicao">Recomposição corporal</option>
                    <option value="manutencao">Manutenção</option>
                  </select>
                </div>
                <button type="submit" disabled={salvandoPerfil || carregandoPerfil} className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                  {salvandoPerfil ? 'Salvando e recalculando...' : 'Salvar e Recalcular Metas'}
                </button>
              </form>
            )}
          </div>
        )}
      </section>

      <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
        <h2 className="font-semibold text-slate-800">Histórico Recente</h2>
        {historico.length === 0 ? (
          <p className="text-xs text-slate-500">
            Nenhum registro de peso lançado ainda.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {historico.map((item) => (
              <div
                key={item.data_registro}
                className="py-2.5 flex justify-between items-center text-sm"
              >
                <span className="text-slate-600">
                  {new Date(item.data_registro + 'T12:00:00').toLocaleDateString(
                    'pt-BR'
                  )}
                </span>
                <div className="font-semibold text-slate-800">
                  {item.peso_kg} kg
                  {item.cintura_cm && (
                    <span className="text-xs font-normal text-slate-500 ml-2">
                      ({item.cintura_cm} cm)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
