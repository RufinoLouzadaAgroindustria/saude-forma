import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface DashboardProps {
  userId: string;
}

interface MetasResumo {
  calorias_diarias: number;
  proteinas_g: number;
  carboidratos_g: number;
  gorduras_g: number;
  agua_ml: number;
}

export function DashboardHoje({ userId }: DashboardProps) {
  const [nome, setNome] = useState('');
  const [metas, setMetas] = useState<MetasResumo | null>(null);
  const [aguaHoje, setAguaHoje] = useState(0);
  const [treinoConcluido, setTreinoConcluido] = useState(false);

  const hojeStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    carregarDados();
  }, [userId]);

  const carregarDados = async () => {
    const { data: user } = await supabase
      .from('usuarios')
      .select('nome')
      .eq('id', userId)
      .single();
    if (user?.nome) setNome(user.nome.split(' ')[0]);

    const { data: meta } = await supabase
      .from('metas_nutricionais')
      .select('calorias_diarias, proteinas_g, carboidratos_g, gorduras_g, agua_ml')
      .eq('usuario_id', userId)
      .eq('ativo', true)
      .order('data_inicio', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (meta) setMetas(meta);

    const { data: log } = await supabase
      .from('logs_evolucao')
      .select('agua_consumida_ml, treino_concluido')
      .eq('usuario_id', userId)
      .eq('data_registro', hojeStr)
      .maybeSingle();

    if (log) {
      setAguaHoje(log.agua_consumida_ml || 0);
      setTreinoConcluido(log.treino_concluido || false);
    }
  };

  const adicionarAgua = async (ml: number) => {
    const novoTotal = aguaHoje + ml;
    setAguaHoje(novoTotal);

    await supabase.from('logs_evolucao').upsert(
      {
        usuario_id: userId,
        data_registro: hojeStr,
        agua_consumida_ml: novoTotal,
        treino_concluido: treinoConcluido,
      },
      { onConflict: 'usuario_id,data_registro' }
    );
  };

  const alternarTreino = async () => {
    const novoStatus = !treinoConcluido;
    setTreinoConcluido(novoStatus);

    await supabase.from('logs_evolucao').upsert(
      {
        usuario_id: userId,
        data_registro: hojeStr,
        agua_consumida_ml: aguaHoje,
        treino_concluido: novoStatus,
      },
      { onConflict: 'usuario_id,data_registro' }
    );
  };

  if (!metas) {
    return <div className="p-6 text-center text-slate-500">Carregando seu painel...</div>;
  }

  const percentualAgua = Math.min(100, Math.round((aguaHoje / metas.agua_ml) * 100));

  return (
    <div className="min-h-screen bg-slate-50 pb-24 max-w-md mx-auto p-4 space-y-4">
      <header className="pt-2 pb-1">
        <p className="text-sm text-slate-500">Resumo de Hoje</p>
        <h1 className="text-2xl font-bold text-slate-800">Olá, {nome}</h1>
      </header>

      <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-baseline mb-4">
          <h2 className="font-semibold text-slate-800">Meta Nutricional</h2>
          <span className="text-2xl font-bold text-emerald-600">
            {metas.calorias_diarias} <span className="text-sm font-normal text-slate-500">kcal</span>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-50 p-3 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Proteínas</p>
            <p className="font-bold text-slate-800">{metas.proteinas_g}g</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Carboidratos</p>
            <p className="font-bold text-slate-800">{metas.carboidratos_g}g</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Gorduras</p>
            <p className="font-bold text-slate-800">{metas.gorduras_g}g</p>
          </div>
        </div>
      </section>

      <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold text-slate-800">Hidratação</h2>
          <span className="text-sm font-medium text-blue-600">
            {aguaHoje} / {metas.agua_ml} ml
          </span>
        </div>

        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${percentualAgua}%` }}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => adicionarAgua(250)}
            className="flex-1 py-2.5 bg-blue-50 text-blue-700 font-semibold rounded-xl hover:bg-blue-100 text-sm"
          >
            + 250 ml (Copo)
          </button>
          <button
            onClick={() => adicionarAgua(500)}
            className="flex-1 py-2.5 bg-blue-50 text-blue-700 font-semibold rounded-xl hover:bg-blue-100 text-sm"
          >
            + 500 ml (Garrafa)
          </button>
        </div>
      </section>

      <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Atividade Física
            </span>
            <h2 className="font-bold text-slate-800 text-lg">Treino do Dia</h2>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-medium">
            30 min
          </span>
        </div>

        <button
          onClick={alternarTreino}
          className={`w-full py-3.5 rounded-xl font-semibold transition-colors ${
            treinoConcluido
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {treinoConcluido ? 'Treino Concluído Hoje' : 'Marcar Treino como Concluído'}
        </button>
      </section>
    </div>
  );
}
