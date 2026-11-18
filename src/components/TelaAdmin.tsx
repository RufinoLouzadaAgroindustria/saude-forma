import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Exercicio {
  id: number;
  nome: string;
  grupo_muscular: string;
  video_url: string | null;
  instrucoes_postura: string;
}

interface AlimentoForm {
  nome: string;
  grupo_alimentar: string;
  calorias_100g: string;
  proteinas_100g: string;
  carboidratos_100g: string;
  gorduras_100g: string;
  medida_caseira_nome: string;
  medida_caseira_gramas: string;
}

const ALIMENTO_VAZIO: AlimentoForm = {
  nome: '',
  grupo_alimentar: '',
  calorias_100g: '',
  proteinas_100g: '',
  carboidratos_100g: '',
  gorduras_100g: '',
  medida_caseira_nome: '',
  medida_caseira_gramas: '',
};

export function TelaAdmin() {
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [novoExercicio, setNovoExercicio] = useState({
    nome: '', grupo_muscular: '', video_url: '', instrucoes_postura: '',
  });
  const [novoAlimento, setNovoAlimento] = useState<AlimentoForm>(ALIMENTO_VAZIO);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const carregarExercicios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('exercicios')
      .select('id, nome, grupo_muscular, video_url, instrucoes_postura')
      .order('nome', { ascending: true });
    if (error) setErro('Não foi possível carregar os exercícios.');
    else setExercicios((data || []) as Exercicio[]);
    setLoading(false);
  };

  useEffect(() => {
    void carregarExercicios();
  }, []);

  const atualizarExercicio = (id: number, campo: keyof Exercicio, valor: string) => {
    setExercicios((atuais) => atuais.map((exercicio) =>
      exercicio.id === id ? { ...exercicio, [campo]: valor } : exercicio
    ));
  };

  const salvarExercicio = async (exercicio: Exercicio) => {
    setSalvando(true);
    setErro('');
    setSucesso('');
    const { error } = await supabase
      .from('exercicios')
      .update({
        nome: exercicio.nome.trim(),
        grupo_muscular: exercicio.grupo_muscular.trim(),
        video_url: exercicio.video_url?.trim() || null,
        instrucoes_postura: exercicio.instrucoes_postura.trim(),
      })
      .eq('id', exercicio.id);
    if (error) setErro('Não foi possível salvar o exercício.');
    else setSucesso('Exercício atualizado.');
    setSalvando(false);
  };

  const criarExercicio = async (event: React.FormEvent) => {
    event.preventDefault();
    setSalvando(true);
    setErro('');
    setSucesso('');
    const { error } = await supabase.from('exercicios').insert({
      nome: novoExercicio.nome.trim(),
      grupo_muscular: novoExercicio.grupo_muscular.trim(),
      video_url: novoExercicio.video_url.trim() || null,
      instrucoes_postura: novoExercicio.instrucoes_postura.trim(),
    });
    if (error) setErro('Não foi possível criar o exercício. Verifique os dados e tente novamente.');
    else {
      setNovoExercicio({ nome: '', grupo_muscular: '', video_url: '', instrucoes_postura: '' });
      setSucesso('Exercício criado.');
      await carregarExercicios();
    }
    setSalvando(false);
  };

  const criarAlimento = async (event: React.FormEvent) => {
    event.preventDefault();
    setSalvando(true);
    setErro('');
    setSucesso('');
    const { error } = await supabase.from('alimentos').insert({
      nome: novoAlimento.nome.trim(),
      grupo_alimentar: novoAlimento.grupo_alimentar.trim(),
      calorias_100g: Number(novoAlimento.calorias_100g),
      proteinas_100g: Number(novoAlimento.proteinas_100g),
      carboidratos_100g: Number(novoAlimento.carboidratos_100g),
      gorduras_100g: Number(novoAlimento.gorduras_100g),
      medida_caseira_nome: novoAlimento.medida_caseira_nome.trim(),
      medida_caseira_gramas: Number(novoAlimento.medida_caseira_gramas),
    });
    if (error) setErro('Não foi possível cadastrar o alimento. Verifique os dados e tente novamente.');
    else {
      setNovoAlimento(ALIMENTO_VAZIO);
      setSucesso('Alimento cadastrado.');
    }
    setSalvando(false);
  };

  const campoTexto = (label: string, value: string, onChange: (value: string) => void, multiline = false) => (
    <label className="block space-y-1 text-xs font-medium text-slate-600">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="w-full rounded-lg border border-slate-300 p-2 text-sm" />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-300 p-2 text-sm" />
      )}
    </label>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24">
      <div className="mx-auto max-w-3xl space-y-5">
        <header>
          <h1 className="text-2xl font-bold text-slate-800">Painel Administrativo</h1>
          <p className="text-sm text-slate-500">Gerencie exercícios e alimentos do catálogo.</p>
        </header>

        {(erro || sucesso) && (
          <p role={erro ? 'alert' : 'status'} className={`rounded-xl p-3 text-sm ${erro ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {erro || sucesso}
          </p>
        )}

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">Exercícios</h2>
          <form onSubmit={criarExercicio} className="space-y-3 rounded-xl bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-700">Adicionar exercício</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {campoTexto('Nome', novoExercicio.nome, (value) => setNovoExercicio({ ...novoExercicio, nome: value }))}
              {campoTexto('Grupo muscular', novoExercicio.grupo_muscular, (value) => setNovoExercicio({ ...novoExercicio, grupo_muscular: value }))}
            </div>
            {campoTexto('URL de vídeo ou imagem (opcional)', novoExercicio.video_url, (value) => setNovoExercicio({ ...novoExercicio, video_url: value }))}
            {campoTexto('Instruções de postura', novoExercicio.instrucoes_postura, (value) => setNovoExercicio({ ...novoExercicio, instrucoes_postura: value }), true)}
            <button disabled={salvando} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Criar exercício</button>
          </form>

          {loading ? <p className="text-sm text-slate-500">Carregando exercícios...</p> : exercicios.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum exercício cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {exercicios.map((exercicio) => (
                <form key={exercicio.id} onSubmit={(event) => { event.preventDefault(); void salvarExercicio(exercicio); }} className="space-y-3 rounded-xl border border-slate-200 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {campoTexto('Nome', exercicio.nome, (value) => atualizarExercicio(exercicio.id, 'nome', value))}
                    {campoTexto('Grupo muscular', exercicio.grupo_muscular, (value) => atualizarExercicio(exercicio.id, 'grupo_muscular', value))}
                  </div>
                  {campoTexto('URL de vídeo ou imagem', exercicio.video_url || '', (value) => atualizarExercicio(exercicio.id, 'video_url', value))}
                  {campoTexto('Instruções de postura', exercicio.instrucoes_postura || '', (value) => atualizarExercicio(exercicio.id, 'instrucoes_postura', value), true)}
                  <button disabled={salvando} className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">Salvar exercício</button>
                </form>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">Adicionar alimento</h2>
          <form onSubmit={criarAlimento} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {campoTexto('Nome', novoAlimento.nome, (value) => setNovoAlimento({ ...novoAlimento, nome: value }))}
              {campoTexto('Grupo alimentar', novoAlimento.grupo_alimentar, (value) => setNovoAlimento({ ...novoAlimento, grupo_alimentar: value }))}
              {campoTexto('Calorias por 100 g', novoAlimento.calorias_100g, (value) => setNovoAlimento({ ...novoAlimento, calorias_100g: value }))}
              {campoTexto('Proteínas por 100 g', novoAlimento.proteinas_100g, (value) => setNovoAlimento({ ...novoAlimento, proteinas_100g: value }))}
              {campoTexto('Carboidratos por 100 g', novoAlimento.carboidratos_100g, (value) => setNovoAlimento({ ...novoAlimento, carboidratos_100g: value }))}
              {campoTexto('Gorduras por 100 g', novoAlimento.gorduras_100g, (value) => setNovoAlimento({ ...novoAlimento, gorduras_100g: value }))}
              {campoTexto('Nome da medida caseira', novoAlimento.medida_caseira_nome, (value) => setNovoAlimento({ ...novoAlimento, medida_caseira_nome: value }))}
              {campoTexto('Gramas da medida caseira', novoAlimento.medida_caseira_gramas, (value) => setNovoAlimento({ ...novoAlimento, medida_caseira_gramas: value }))}
            </div>
            <button disabled={salvando} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Cadastrar alimento</button>
          </form>
        </section>
      </div>
    </div>
  );
}
