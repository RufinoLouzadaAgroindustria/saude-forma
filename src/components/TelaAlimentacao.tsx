import { BannerAnuncio } from './BannerAnuncio';
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ListaComprasModal } from './ListaComprasModal';
import {
  Alimento,
  calcularSubstituicaoAlimento,
  MetasCalculadas,
  ResultadoSubstituicao,
} from '../lib/nutritionEngine';
import { EstiloCardapio, gerarPlanoInicialUsuario } from '../lib/planGenerator';

interface ItemRefeicaoDetalhado {
  id: string;
  quantidade_gramas: number;
  concluido_hoje: boolean;
  alimentos: Alimento;
}

interface RefeicaoComItens {
  id: string;
  tipo_refeicao: string;
  horario_sugerido: string;
  ordem: number;
  itens_refeicao: ItemRefeicaoDetalhado[];
}

interface TelaAlimentacaoProps {
  userId: string;
}

const NOMES_REFEICOES: Record<string, string> = {
  cafe_manha: 'Café da Manhã',
  almoco: 'Almoço',
  lanche: 'Lanche da Tarde',
  jantar: 'Jantar',
};

export function TelaAlimentacao({ userId }: TelaAlimentacaoProps) {
  const [refeicoes, setRefeicoes] = useState<RefeicaoComItens[]>([]);
  const [loading, setLoading] = useState(true);
  const [gerandoCardapio, setGerandoCardapio] = useState(false);
  const [estiloCardapio, setEstiloCardapio] = useState<EstiloCardapio>('tradicional');
  const [metasAtivas, setMetasAtivas] = useState<MetasCalculadas | null>(null);
  const [localTreino, setLocalTreino] = useState<'casa' | 'academia' | 'parque'>('casa');
  const [restricoesSaude, setRestricoesSaude] = useState<string[]>([]);
  const [erroGeracao, setErroGeracao] = useState('');

  const [modalAberto, setModalAberto] = useState(false);
  const [listaComprasAberta, setListaComprasAberta] = useState(false);
  const [itemSelecionado, setItemSelecionado] =
    useState<ItemRefeicaoDetalhado | null>(null);
  const [opcoesSubstituicao, setOpcoesSubstituicao] = useState<
    ResultadoSubstituicao[]
  >([]);
  const [carregandoOpcoes, setCarregandoOpcoes] = useState(false);

  useEffect(() => {
    void carregarDados();
  }, [userId]);

  const carregarDados = async () => {
    setLoading(true);
    const [resultadoRefeicoes, resultadoUsuario, resultadoMetas] = await Promise.all([
      supabase
        .from('refeicoes_plano')
        .select(`
          id,
          tipo_refeicao,
          horario_sugerido,
          ordem,
          itens_refeicao (
            id,
            quantidade_gramas,
            concluido_hoje,
            alimentos (*)
          )
        `)
        .eq('usuario_id', userId)
        .order('ordem', { ascending: true }),
      supabase
        .from('usuarios')
        .select('local_treino, restricoes_saude')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('metas_nutricionais')
        .select('tmb, get, calorias_diarias, proteinas_g, carboidratos_g, gorduras_g, agua_ml')
        .eq('usuario_id', userId)
        .eq('ativo', true)
        .order('data_inicio', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (!resultadoRefeicoes.error && resultadoRefeicoes.data) {
      setRefeicoes(resultadoRefeicoes.data as unknown as RefeicaoComItens[]);
    }
    if (resultadoUsuario.data) {
      setLocalTreino(resultadoUsuario.data.local_treino || 'casa');
      setRestricoesSaude(resultadoUsuario.data.restricoes_saude || []);
    }
    if (resultadoMetas.data) {
      setMetasAtivas(resultadoMetas.data as MetasCalculadas);
    }
    setLoading(false);
  };

  const gerarNovoCardapio = async () => {
    if (!metasAtivas) {
      setErroGeracao('Não encontramos metas nutricionais ativas. Atualize seu perfil e tente novamente.');
      return;
    }

    setGerandoCardapio(true);
    setErroGeracao('');
    try {
      await gerarPlanoInicialUsuario(
        userId,
        metasAtivas,
        localTreino,
        restricoesSaude,
        estiloCardapio
      );
      await carregarDados();
    } catch (error) {
      console.error('Erro ao gerar cardápio:', error);
      setErroGeracao('Não foi possível gerar o cardápio. Tente novamente.');
    } finally {
      setGerandoCardapio(false);
    }
  };

  const alternarConclusaoItem = async (
    itemId: string,
    statusAtual: boolean
  ) => {
    const novoStatus = !statusAtual;

    setRefeicoes((prev) =>
      prev.map((ref) => ({
        ...ref,
        itens_refeicao: ref.itens_refeicao.map((item) =>
          item.id === itemId ? { ...item, concluido_hoje: novoStatus } : item
        ),
      }))
    );

    await supabase
      .from('itens_refeicao')
      .update({ concluido_hoje: novoStatus })
      .eq('id', itemId);
  };

  const abrirModalTroca = async (item: ItemRefeicaoDetalhado) => {
    setItemSelecionado(item);
    setModalAberto(true);
    setCarregandoOpcoes(true);

    const { data: alimentosMesmoGrupo } = await supabase
      .from('alimentos')
      .select('*')
      .eq('grupo_alimentar', item.alimentos.grupo_alimentar)
      .neq('id', item.alimentos.id);

    if (alimentosMesmoGrupo) {
      const calculados = alimentosMesmoGrupo.map((novoAlimento: Alimento) =>
        calcularSubstituicaoAlimento(
          item.alimentos,
          item.quantidade_gramas,
          novoAlimento
        )
      );
      setOpcoesSubstituicao(calculados);
    }

    setCarregandoOpcoes(false);
  };

  const confirmarSubstituicao = async (escolha: ResultadoSubstituicao) => {
    if (!itemSelecionado) return;

    const { error } = await supabase
      .from('itens_refeicao')
      .update({
        alimento_id: escolha.alimento_substituto.id,
        quantidade_gramas: escolha.nova_quantidade_gramas,
      })
      .eq('id', itemSelecionado.id);

    if (!error) {
      setModalAberto(false);
      setItemSelecionado(null);
      await carregarDados();
    }
  };

  const formatarMedidaCaseira = (alimento: Alimento, gramas: number) => {
    if (!alimento.medida_caseira_gramas || alimento.medida_caseira_gramas <= 0) {
      return `${gramas}g`;
    }
    const qtd = Math.round((gramas / alimento.medida_caseira_gramas) * 2) / 2;
    return qtd > 0
      ? `${qtd}x ${alimento.medida_caseira_nome} (${gramas}g)`
      : `${gramas}g`;
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-500">
        Carregando seu plano alimentar...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 max-w-md mx-auto p-4 space-y-4">
      <header className="flex items-start justify-between gap-3 pt-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Alimentação</h1>
          <p className="text-sm text-slate-500">
            Marque o que já consumiu ou toque em trocar para adaptar
          </p>
        </div>
        <button
          type="button"
          onClick={() => setListaComprasAberta(true)}
          className="shrink-0 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          Lista de Compras
        </button>
      </header>

      <section className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm space-y-3">
        <div>
          <h2 className="font-semibold text-slate-800">Seu cardápio, do seu jeito</h2>
          <p className="mt-1 text-xs text-slate-500">Escolha um estilo para gerar novas refeições diárias.</p>
        </div>
        <div className="grid-cols-2 sm:grid-cols-4">
          {([
            ['tradicional', 'Tradicional'],
            ['pratico', 'Prático / Rápido'],
            ['economico', 'Econômico'],
            ['vegano', 'Vegano'],
          ] as const).map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              aria-pressed={estiloCardapio === valor}
              onClick={() => setEstiloCardapio(valor)}
              className={`rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors ${
                estiloCardapio === valor
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={gerarNovoCardapio}
          disabled={gerandoCardapio || !metasAtivas}
          className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {gerandoCardapio ? 'Gerando cardápio...' : 'Gerar Novo Cardápio'}
        </button>
        {erroGeracao && <p role="alert" className="text-xs text-rose-600">{erroGeracao}</p>}
      </section>

      {refeicoes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Nenhuma refeição configurada. Escolha um estilo acima para gerar seu cardápio.
        </div>
      ) : refeicoes.map((refeicao) => {
        const caloriasRefeicao = refeicao.itens_refeicao.reduce((acc, item) => {
          return (
            acc +
            Math.round(
              (item.alimentos.calorias_100g / 100) * item.quantidade_gramas
            )
          );
        }, 0);

        return (
          <section
            key={refeicao.id}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-slate-800">
                  {NOMES_REFEICOES[refeicao.tipo_refeicao] || refeicao.tipo_refeicao}
                </h2>
                {refeicao.horario_sugerido && (
                  <span className="text-xs text-slate-500">
                    Sugestão: {refeicao.horario_sugerido.slice(0, 5)}
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                {caloriasRefeicao} kcal
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {refeicao.itens_refeicao.map((item) => {
                const kcalItem = Math.round(
                  (item.alimentos.calorias_100g / 100) * item.quantidade_gramas
                );

                return (
                  <div
                    key={item.id}
                    className="p-4 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={item.concluido_hoje}
                        onChange={() => alternarConclusaoItem(item.id, item.concluido_hoje)}
                        className="mt-1 w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                      />
                      <div className={item.concluido_hoje ? 'opacity-50 line-through' : ''}>
                        <p className="font-semibold text-slate-800 text-sm">{item.alimentos.nome}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatarMedidaCaseira(item.alimentos, item.quantidade_gramas)}{' '}
                          • {kcalItem} kcal
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => abrirModalTroca(item)}
                      className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl transition-colors shrink-0"
                    >
                      Trocar
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
<BannerAnuncio local="alimentacao" />
      {listaComprasAberta && (
        <ListaComprasModal userId={userId} onClose={() => setListaComprasAberta(false)} />
      )}

      {modalAberto && itemSelecionado && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-xl">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Substituir Alimento</h3>
                <p className="text-xs text-slate-500">
                  Atual: {itemSelecionado.alimentos.nome} ({itemSelecionado.quantidade_gramas}g)
                </p>
              </div>
              <button onClick={() => setModalAberto(false)} className="p-2 text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {carregandoOpcoes ? (
                <p className="text-center text-sm text-slate-500 py-6">Calculando porções equivalentes...</p>
              ) : opcoesSubstituicao.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-6">Nenhuma opção equivalente cadastrada neste grupo.</p>
              ) : (
                opcoesSubstituicao.map((opcao) => (
                  <div key={opcao.alimento_substituto.id} className="border border-slate-200 rounded-xl p-3.5 flex justify-between items-center gap-3 hover:border-emerald-400 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{opcao.alimento_substituto.nome}</p>
                      <p className="text-xs font-bold text-emerald-700 mt-0.5">
                        {opcao.medida_caseira_equivalente} ({opcao.nova_quantidade_gramas}g)
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Aprox. {opcao.calorias_resultantes} kcal</p>
                    </div>
                    <button onClick={() => confirmarSubstituicao(opcao)} className="bg-emerald-600 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl hover:bg-emerald-700 shrink-0">
                      Selecionar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
