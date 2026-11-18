import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface ExercicioDetalhes {
  id: number;
  nome: string;
  grupo_muscular: string;
  instrucoes_postura: string;
  video_url?: string;
}

interface ItemTreinoDetalhado {
  id: string;
  series: number;
  repeticoes_alvo: string;
  descanso_segundos: number;
  carga_atual_kg: number;
  exercicios: ExercicioDetalhes;
}

interface TelaTreinosProps {
  userId: string;
}

export function TelaTreinos({ userId }: TelaTreinosProps) {
  const [tituloTreino, setTituloTreino] = useState('');
  const [itens, setItens] = useState<ItemTreinoDetalhado[]>([]);
  const [loading, setLoading] = useState(true);

  const [indiceAtual, setIndiceAtual] = useState(0);
  const [serieAtual, setSerieAtual] = useState(1);
  const [tempoRestante, setTempoRestante] = useState<number | null>(null);
  const [cronometroAtivo, setCronometroAtivo] = useState(false);
  const [treinoFinalizado, setTreinoFinalizado] = useState(false);
  const [esforcoPercebido, setEsforcoPercebido] = useState(7);

  useEffect(() => {
    carregarTreino();
  }, [userId]);

  useEffect(() => {
    if (!cronometroAtivo || tempoRestante === null) return;

    if (tempoRestante <= 0) {
      setCronometroAtivo(false);
      setTempoRestante(null);
      return;
    }

    const timer = setInterval(() => {
      setTempoRestante((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [cronometroAtivo, tempoRestante]);

  const carregarTreino = async () => {
    setLoading(true);
    const { data: treino } = await supabase
      .from('treinos_usuario')
      .select(
        `
        id,
        titulo,
        itens_treino (
          id,
          series,
          repeticoes_alvo,
          descanso_segundos,
          carga_atual_kg,
          exercicios (*)
        )
      `
      )
      .eq('usuario_id', userId)
      .limit(1)
      .maybeSingle();

    if (treino) {
      setTituloTreino(treino.titulo);
      setItens((treino.itens_treino as unknown as ItemTreinoDetalhado[]) || []);
    }
    setLoading(false);
  };

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const concluirSerie = () => {
    const exercicioAtual = itens[indiceAtual];
    if (!exercicioAtual) return;

    if (serieAtual < exercicioAtual.series) {
      setSerieAtual((prev) => prev + 1);
      setTempoRestante(exercicioAtual.descanso_segundos);
      setCronometroAtivo(true);
    } else if (indiceAtual < itens.length - 1) {
      setIndiceAtual((prev) => prev + 1);
      setSerieAtual(1);
      setTempoRestante(exercicioAtual.descanso_segundos);
      setCronometroAtivo(true);
    } else {
      setTreinoFinalizado(true);
      setCronometroAtivo(false);
    }
  };

  const registrarConclusaoNoBanco = async (relatouDor: boolean) => {
    const hojeStr = new Date().toISOString().split('T')[0];

    await supabase.from('logs_evolucao').upsert(
      {
        usuario_id: userId,
        data_registro: hojeStr,
        treino_concluido: true,
        percepcao_esforco: esforcoPercebido,
        relato_dor: relatouDor,
      },
      { onConflict: 'usuario_id,data_registro' }
    );

    alert(
      relatouDor
        ? 'Treino salvo. Registramos seu aviso de desconforto para adaptar os próximos exercícios.'
        : 'Parabéns! Treino concluído e registrado na sua evolução.'
    );
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-500">
        Preparando sua rotina de treino...
      </div>
    );
  }

  if (itens.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500">
        Nenhum treino configurado ainda.
      </div>
    );
  }

  if (treinoFinalizado) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 max-w-md mx-auto flex flex-col justify-center">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Treino Concluído!</h2>
          <p className="text-sm text-slate-500">
            Como você avalia o esforço deste treino hoje? (1 = Muito leve, 10 = Exaustivo)
          </p>

          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="10"
              value={esforcoPercebido}
              onChange={(e) => setEsforcoPercebido(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <p className="font-bold text-emerald-700 text-lg">
              Nível {esforcoPercebido} / 10
            </p>
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              onClick={() => registrarConclusaoNoBanco(false)}
              className="w-full py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700"
            >
              Salvar e Finalizar sem Dor
            </button>
            <button
              onClick={() => registrarConclusaoNoBanco(true)}
              className="w-full py-3 bg-amber-50 text-amber-800 border border-amber-200 font-medium rounded-xl text-sm hover:bg-amber-100"
            >
              Finalizar e Reportar Desconforto Articular
            </button>
          </div>
        </div>
      </div>
    );
  }

  const itemAtual = itens[indiceAtual];
  const progressoGeral = Math.round(((indiceAtual + 1) / itens.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 max-w-md mx-auto p-4 space-y-4">
      <header className="pt-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-emerald-600 uppercase">
            Exercício {indiceAtual + 1} de {itens.length}
          </span>
          <span className="text-xs text-slate-500">{tituloTreino}</span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progressoGeral}%` }}
          />
        </div>
      </header>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 h-48 flex flex-col items-center justify-center text-white p-4 text-center">
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-1">
            {itemAtual.exercicios.grupo_muscular}
          </span>
          <p className="text-lg font-bold">{itemAtual.exercicios.nome}</p>
          <p className="text-xs text-slate-400 mt-2">
            (Espaço reservado para GIF / Vídeo demonstrativo)
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
              <p className="text-xs text-emerald-700 font-medium">Série Atual</p>
              <p className="text-xl font-bold text-emerald-900">
                {serieAtual} de {itemAtual.series}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
              <p className="text-xs text-slate-500 font-medium">Repetições Alvo</p>
              <p className="text-xl font-bold text-slate-800">
                {itemAtual.repeticoes_alvo}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <p className="text-xs font-bold text-slate-700 mb-1">
              Dicas de Execução e Postura:
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              {itemAtual.exercicios.instrucoes_postura}
            </p>
          </div>

          {tempoRestante !== null ? (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-700">
                  Tempo de Descanso
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatarTempo(tempoRestante)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCronometroAtivo(!cronometroAtivo)}
                  className="px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg"
                >
                  {cronometroAtivo ? 'Pausar' : 'Retomar'}
                </button>
                <button
                  onClick={() => {
                    setCronometroAtivo(false);
                    setTempoRestante(null);
                  }}
                  className="px-3 py-2 bg-white text-blue-700 border border-blue-200 text-xs font-semibold rounded-lg"
                >
                  Pular
                </button>
              </div>
           </div>
          ) : (
            <button
              onClick={concluirSerie}
              className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-sm transition-colors"
            >
              Concluir Série {serieAtual}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
