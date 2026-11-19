import { BannerAnuncio } from './BannerAnuncio';
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

  useEffect(() => { void carregarTreino(); }, [userId]);
  useEffect(() => {
    if (!cronometroAtivo || tempoRestante === null) return;
    if (tempoRestante <= 0) { setCronometroAtivo(false); setTempoRestante(null); return; }
    const timer = setInterval(() => setTempoRestante((prev) => prev !== null ? prev - 1 : null), 1000);
    return () => clearInterval(timer);
  }, [cronometroAtivo, tempoRestante]);

  const carregarTreino = async () => {
    setLoading(true);
    const { data: treino } = await supabase.from('treinos_usuario').select(`id, titulo, itens_treino (id, series, repeticoes_alvo, descanso_segundos, carga_atual_kg, exercicios (*))`).eq('usuario_id', userId).limit(1).maybeSingle();
    if (treino) { setTituloTreino(treino.titulo); setItens((treino.itens_treino as unknown as ItemTreinoDetalhado[]) || []); }
    else { setTituloTreino(''); setItens([]); }
    setLoading(false);
  };
  const formatarTempo = (segundos: number) => `${Math.floor(segundos / 60).toString().padStart(2, '0')}:${(segundos % 60).toString().padStart(2, '0')}`;
  const concluirSerie = () => {
    const exercicioAtual = itens[indiceAtual]; if (!exercicioAtual) return;
    if (serieAtual < exercicioAtual.series) { setSerieAtual((prev) => prev + 1); setTempoRestante(exercicioAtual.descanso_segundos); setCronometroAtivo(true); }
    else if (indiceAtual < itens.length - 1) { setIndiceAtual((prev) => prev + 1); setSerieAtual(1); setTempoRestante(exercicioAtual.descanso_segundos); setCronometroAtivo(true); }
    else { setTreinoFinalizado(true); setCronometroAtivo(false); }
  };
  const registrarConclusaoNoBanco = async (relatouDor: boolean) => {
    const { error } = await supabase.from('logs_evolucao').upsert({ usuario_id: userId, data_registro: new Date().toISOString().split('T')[0], treino_concluido: true, percepcao_esforco: esforcoPercebido, relato_dor: relatouDor }, { onConflict: 'usuario_id,data_registro' });
    alert(error ? 'Não foi possível registrar seu treino. Tente novamente.' : relatouDor ? 'Treino salvo. Registramos seu aviso de desconforto para adaptar os próximos exercícios.' : 'Parabéns! Treino concluído e registrado na sua evolução.');
  };

  if (loading) return <div className="p-6 text-center text-slate-500">Preparando sua rotina de treino...</div>;
  if (itens.length === 0) return <div className="p-6 text-center text-slate-500">Nenhum treino configurado ainda.</div>;
  if (treinoFinalizado) return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-slate-50 p-4"><div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-600">✓</div><h2 className="text-2xl font-bold text-slate-800">Treino Concluído!</h2><p className="text-sm text-slate-500">Como você avalia o esforço deste treino hoje? (1 = Muito leve, 10 = Exaustivo)</p><input type="range" min="1" max="10" value={esforcoPercebido} onChange={(e) => setEsforcoPercebido(Number(e.target.value))} className="w-full accent-emerald-600" /><p className="text-lg font-bold text-emerald-700">Nível {esforcoPercebido} / 10</p><button onClick={() => void registrarConclusaoNoBanco(false)} className="w-full rounded-xl bg-emerald-600 py-3.5 font-semibold text-white">Salvar e Finalizar sem Dor</button><button onClick={() => void registrarConclusaoNoBanco(true)} className="w-full rounded-xl border border-amber-200 bg-amber-50 py-3 text-sm font-medium text-amber-800">Finalizar e Reportar Desconforto Articular</button></div></div>
  );

  const itemAtual = itens[indiceAtual];
  const videoUrl = itemAtual.exercicios.video_url?.trim();
  const isVideo = videoUrl ? /\.mp4(?:$|[?#])/i.test(videoUrl) : false;
  const progressoGeral = Math.round(((indiceAtual + 1) / itens.length) * 100);

  return (
    <div className="mx-auto min-h-screen max-w-md space-y-4 bg-slate-50 p-4 pb-24">
      <header className="pt-2"><div className="mb-1 flex items-center justify-between"><span className="text-xs font-semibold uppercase text-emerald-600">Exercício {indiceAtual + 1} de {itens.length}</span><span className="text-xs text-slate-500">{tituloTreino}</span></div><div className="h-2 w-full overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progressoGeral}%` }} /></div></header>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className={`relative flex h-48 flex-col items-center justify-center overflow-hidden p-4 text-center ${videoUrl ? 'bg-slate-900' : 'bg-slate-800 text-white'}`}>
          {videoUrl ? (isVideo ? <video src={videoUrl} controls playsInline className="absolute inset-0 h-full w-full object-contain" aria-label={`Demonstração de ${itemAtual.exercicios.nome}`} /> : <img src={videoUrl} alt={`Demonstração de ${itemAtual.exercicios.nome}`} className="absolute inset-0 h-full w-full object-contain" />) : <><span className="mb-1 text-xs font-semibold uppercase tracking-widest text-emerald-400">{itemAtual.exercicios.grupo_muscular}</span><p className="text-lg font-bold">{itemAtual.exercicios.nome}</p><p className="mt-2 text-xs text-slate-400">(Espaço reservado para GIF / Vídeo demonstrativo)</p></>}
          {videoUrl && <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-slate-900/70 px-2 py-1 text-left text-white"><span className="block text-[10px] uppercase text-emerald-300">{itemAtual.exercicios.grupo_muscular}</span><span className="text-xs font-semibold">{itemAtual.exercicios.nome}</span></div>}
        </div>
        <div className="space-y-4 p-5"><div className="grid grid-cols-2 gap-3 text-center"><div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><p className="text-xs font-medium text-emerald-700">Série Atual</p><p className="text-xl font-bold text-emerald-900">{serieAtual} de {itemAtual.series}</p></div><div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="text-xs font-medium text-slate-500">Repetições Alvo</p><p className="text-xl font-bold text-slate-800">{itemAtual.repeticoes_alvo}</p></div></div><div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5"><p className="mb-1 text-xs font-bold text-slate-700">Dicas de Execução e Postura:</p><p className="text-xs leading-relaxed text-slate-600">{itemAtual.exercicios.instrucoes_postura}</p></div>
          {tempoRestante !== null ? <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-4"><div><p className="text-xs font-semibold text-blue-700">Tempo de Descanso</p><p className="text-2xl font-bold text-blue-900">{formatarTempo(tempoRestante)}</p></div><div className="flex gap-2"><button onClick={() => setCronometroAtivo(!cronometroAtivo)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">{cronometroAtivo ? 'Pausar' : 'Retomar'}</button><button onClick={() => { setCronometroAtivo(false); setTempoRestante(null); }} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700">Pular</button></div></div> : <button onClick={concluirSerie} className="w-full rounded-xl bg-emerald-600 py-4 font-bold text-white shadow-sm transition-colors hover:bg-emerald-700">Concluir Série {serieAtual}</button>}
        </div>
      </section>
<BannerAnuncio local="treinos" />
    </div>
  );
}
