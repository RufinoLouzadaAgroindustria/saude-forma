import { supabase } from './supabaseClient';
import { MetasCalculadas } from './nutritionEngine';

export type EstiloCardapio = 'tradicional' | 'pratico' | 'economico';

type LocalTreino = 'casa' | 'academia' | 'parque';

export async function gerarPlanoInicialUsuario(
  userId: string,
  metas: MetasCalculadas,
  localTreino: LocalTreino,
  restricoesSaude: string[] = [],
  estiloCardapio: EstiloCardapio = 'tradicional'
) {
  const { data: alimentosBase, error: erroAlimentos } = await supabase
    .from('alimentos')
    .select('*');
  if (erroAlimentos) throw erroAlimentos;
  if (!alimentosBase || alimentosBase.length === 0) {
    throw new Error('Não há alimentos cadastrados para gerar o cardápio.');
  }

  const buscarAlimento = (...nomesParciais: string[]) =>
    nomesParciais
      .map((nomeParcial) =>
        alimentosBase.find((alimento) =>
          alimento.nome.toLowerCase().includes(nomeParcial.toLowerCase())
        )
      )
      .find(Boolean);

  const gramasProteina = Math.max(80, Math.round((metas.proteinas_g * 0.65 * 100) / 2 / 32));
  const gramasCarboidrato = Math.max(60, Math.round((metas.carboidratos_g * 0.55 * 100) / 2 / 28.1));
  const gramasAveia = Math.max(20, Math.round((metas.carboidratos_g * 0.25 * 100) / 66.6));

  const refeicoesPorEstilo = {
    tradicional: [
      {
        tipo_refeicao: 'cafe_manha', horario_sugerido: '08:00:00', ordem: 1,
        itens: [
          { alimento: buscarAlimento('Ovo de galinha'), gramas: 100 },
          { alimento: buscarAlimento('Banana prata', 'Banana'), gramas: 65 },
          { alimento: buscarAlimento('Aveia em flocos', 'Aveia'), gramas: gramasAveia },
        ],
      },
      {
        tipo_refeicao: 'almoco', horario_sugerido: '12:30:00', ordem: 2,
        itens: [
          { alimento: buscarAlimento('Arroz integral', 'Arroz branco'), gramas: gramasCarboidrato },
          { alimento: buscarAlimento('Feijão carioca', 'Feijão'), gramas: 80 },
          { alimento: buscarAlimento('Peito de frango', 'Frango'), gramas: gramasProteina },
          { alimento: buscarAlimento('Brócolis', 'Abobrinha', 'Cenoura'), gramas: 80 },
        ],
      },
      {
        tipo_refeicao: 'lanche', horario_sugerido: '16:30:00', ordem: 3,
        itens: [
          { alimento: buscarAlimento('Iogurte natural', 'Iogurte'), gramas: 160 },
          { alimento: buscarAlimento('Maçã fuji', 'Maçã'), gramas: 130 },
        ],
      },
      {
        tipo_refeicao: 'jantar', horario_sugerido: '20:00:00', ordem: 4,
        itens: [
          { alimento: buscarAlimento('Arroz integral', 'Arroz branco'), gramas: gramasCarboidrato },
          { alimento: buscarAlimento('Feijão carioca', 'Feijão'), gramas: 80 },
          { alimento: buscarAlimento('Filé de tilápia', 'Tilápia', 'Peito de frango', 'Frango'), gramas: gramasProteina },
          { alimento: buscarAlimento('Alface', 'Tomate', 'Brócolis'), gramas: 80 },
        ],
      },
    ],
    pratico: [
      {
        tipo_refeicao: 'cafe_manha', horario_sugerido: '08:00:00', ordem: 1,
        itens: [
          { alimento: buscarAlimento('Ovo de galinha'), gramas: 100 },
          { alimento: buscarAlimento('Aveia em flocos', 'Aveia'), gramas: gramasAveia },
          { alimento: buscarAlimento('Banana prata', 'Banana'), gramas: 100 },
        ],
      },
      {
        tipo_refeicao: 'almoco', horario_sugerido: '12:30:00', ordem: 2,
        itens: [
          { alimento: buscarAlimento('Peito de frango', 'Frango'), gramas: gramasProteina },
          { alimento: buscarAlimento('Batata-doce', 'Batata doce'), gramas: gramasCarboidrato },
          { alimento: buscarAlimento('Brócolis', 'Legumes', 'Cenoura'), gramas: 80 },
        ],
      },
      {
        tipo_refeicao: 'lanche', horario_sugerido: '16:30:00', ordem: 3,
        itens: [
          { alimento: buscarAlimento('Iogurte natural', 'Iogurte'), gramas: 170 },
          { alimento: buscarAlimento('Banana prata', 'Banana'), gramas: 65 },
        ],
      },
      {
        tipo_refeicao: 'jantar', horario_sugerido: '20:00:00', ordem: 4,
        itens: [
          { alimento: buscarAlimento('Peito de frango', 'Frango'), gramas: gramasProteina },
          { alimento: buscarAlimento('Batata-doce', 'Batata doce'), gramas: gramasCarboidrato },
          { alimento: buscarAlimento('Ovo de galinha'), gramas: 50 },
        ],
      },
    ],
    economico: [
      {
        tipo_refeicao: 'cafe_manha', horario_sugerido: '08:00:00', ordem: 1,
        itens: [
          { alimento: buscarAlimento('Ovo de galinha'), gramas: 100 },
          { alimento: buscarAlimento('Banana prata', 'Banana'), gramas: 100 },
        ],
      },
      {
        tipo_refeicao: 'almoco', horario_sugerido: '12:30:00', ordem: 2,
        itens: [
          { alimento: buscarAlimento('Arroz branco', 'Arroz'), gramas: gramasCarboidrato },
          { alimento: buscarAlimento('Feijão carioca', 'Feijão'), gramas: 100 },
          { alimento: buscarAlimento('Patinho', 'Peito de frango', 'Frango'), gramas: gramasProteina },
        ],
      },
      {
        tipo_refeicao: 'lanche', horario_sugerido: '16:30:00', ordem: 3,
        itens: [
          { alimento: buscarAlimento('Banana prata', 'Banana'), gramas: 100 },
          { alimento: buscarAlimento('Maçã fuji', 'Maçã'), gramas: 130 },
        ],
      },
      {
        tipo_refeicao: 'jantar', horario_sugerido: '20:00:00', ordem: 4,
        itens: [
          { alimento: buscarAlimento('Arroz branco', 'Arroz'), gramas: gramasCarboidrato },
          { alimento: buscarAlimento('Feijão carioca', 'Feijão'), gramas: 100 },
          { alimento: buscarAlimento('Patinho', 'Peito de frango', 'Frango'), gramas: gramasProteina },
        ],
      },
    ],
  } satisfies Record<EstiloCardapio, {
    tipo_refeicao: string;
    horario_sugerido: string;
    ordem: number;
    itens: { alimento: (typeof alimentosBase)[number] | undefined; gramas: number }[];
  }[]>;

  const { data: refeicoesExistentes, error: erroBuscaRefeicoes } = await supabase
    .from('refeicoes_plano')
    .select('id')
    .eq('usuario_id', userId);
  if (erroBuscaRefeicoes) throw erroBuscaRefeicoes;

  const idsRefeicoes = (refeicoesExistentes || []).map((refeicao) => refeicao.id);
  if (idsRefeicoes.length > 0) {
    const { error: erroItens } = await supabase
      .from('itens_refeicao')
      .delete()
      .in('refeicao_id', idsRefeicoes);
    if (erroItens) throw erroItens;

    const { error: erroDelecaoRefeicoes } = await supabase
      .from('refeicoes_plano')
      .delete()
      .eq('usuario_id', userId);
    if (erroDelecaoRefeicoes) throw erroDelecaoRefeicoes;
  }

  for (const refeicao of refeicoesPorEstilo[estiloCardapio]) {
    const { data: refeicaoCriada, error: erroCriacao } = await supabase
      .from('refeicoes_plano')
      .insert({
        usuario_id: userId,
        tipo_refeicao: refeicao.tipo_refeicao,
        horario_sugerido: refeicao.horario_sugerido,
        ordem: refeicao.ordem,
      })
      .select('id')
      .single();
    if (erroCriacao) throw erroCriacao;

    const itensValidos = refeicao.itens
      .filter((item) => item.alimento !== undefined)
      .map((item) => ({
        refeicao_id: refeicaoCriada.id,
        alimento_id: item.alimento!.id,
        quantidade_gramas: item.gramas,
        concluido_hoje: false,
      }));

    if (itensValidos.length > 0) {
      const { error: erroInsercaoItens } = await supabase
        .from('itens_refeicao')
        .insert(itensValidos);
      if (erroInsercaoItens) throw erroInsercaoItens;
    }
  }

  const { data: treinoExistente, error: erroBuscaTreino } = await supabase
    .from('treinos_usuario')
    .select('id')
    .eq('usuario_id', userId)
    .limit(1)
    .maybeSingle();
  if (erroBuscaTreino) throw erroBuscaTreino;
  if (treinoExistente) return;

  const { data: todosExercicios, error: erroExercicios } = await supabase
    .from('exercicios')
    .select('*');
  if (erroExercicios) throw erroExercicios;
  if (!todosExercicios || todosExercicios.length === 0) return;

  const exerciciosSeguros = todosExercicios.filter((exercicio) => {
    const equipamentoOk =
      localTreino === 'academia' || exercicio.equipamento_necessario === 'peso_corporal';
    const contraindicacoes: string[] = exercicio.contraindicacoes || [];
    return equipamentoOk && !contraindicacoes.some((item) => restricoesSaude.includes(item));
  });

  const gruposAlvo = ['pernas', 'peito', 'costas', 'core', 'cardio'];
  const selecionados = gruposAlvo
    .map((grupo) => exerciciosSeguros.find((exercicio) => exercicio.grupo_muscular === grupo))
    .filter(Boolean);

  if (selecionados.length > 0) {
    const { data: treinoCriado, error: erroCriacaoTreino } = await supabase
      .from('treinos_usuario')
      .insert({
        usuario_id: userId,
        titulo: 'Treino A • Adaptação Corpo Inteiro',
        dia_semana: 1,
        fase_periodizacao: 'adaptacao',
      })
      .select('id')
      .single();
    if (erroCriacaoTreino) throw erroCriacaoTreino;

    const itensTreino = selecionados.map((exercicio) => ({
      treino_id: treinoCriado.id,
      exercicio_id: exercicio!.id,
      series: 3,
      repeticoes_alvo: '12-15',
      descanso_segundos: 60,
      carga_atual_kg: 0,
    }));
    const { error: erroInsercaoTreino } = await supabase
      .from('itens_treino')
      .insert(itensTreino);
    if (erroInsercaoTreino) throw erroInsercaoTreino;
  }
}
