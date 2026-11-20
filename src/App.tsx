import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { Onboarding } from './components/Onboarding';
import { DashboardHoje } from './components/DashboardHoje';
import { TelaAlimentacao } from './components/TelaAlimentacao';
import { TelaTreinos } from './components/TelaTreinos';
import { TelaAdmin } from './components/TelaAdmin';

type AbaAtiva = 'hoje' | 'alimentacao' | 'treinos' | 'evolucao' | 'admin';

export function App() {
  const [session, setSession] = useState<any>(null);
  const [perfilCompleto, setPerfilCompleto] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
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
        setIsAdmin(false);
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
    setIsAdmin(!!data?.is_admin);
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
        {abaAtiva === 'admin' && isAdmin && <TelaAdmin />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40">
        <div
          className={`max-w-md mx-auto grid h-16 ${
            isAdmin ? 'grid-cols-5' : 'grid-cols-4'
          }`}
        >
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
          {isAdmin && (
            <BotaoMenu
              ativo={abaAtiva === 'admin'}
              onClick={() => setAbaAtiva('admin')}
              rotulo="Admin"
              icone="⚙️"
            />
          )}
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
  const [manterConectado, setManterConectado] = useState(true);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensagem('');

    try {
            if (modoCadastro) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
        });
        if (error) throw error;

        if (!data?.session) {
          await supabase.auth.signInWithPassword({
            email,
            password: senha,
          });
        }

        localStorage.setItem('saude_forma_manter_conectado', 'true');
        window.location.reload();
      } else {

function TelaEvolucao({ userId }: { userId: string }) {
  const [pesoAtual, setPesoAtual] = useState('');
  const [cinturaAtual, setCinturaAtual] = useState('');
  const [historico, setHistorico] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);

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

  const registrarPesagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pesoAtual) return;

    setSalvando(true);
    const hojeStr = new Date().toISOString().split('T');

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

   const sairDaConta = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 max-w-md mx-auto p-4 space-y-4">
      <header className="pt-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sua Evolução</h1>
          <p className="text-sm text-slate-500">Acompanhe medidas e constância</p>
        </div>
        <button
          onClick={sairDaConta}
          className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-100"
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
}

export default App;

