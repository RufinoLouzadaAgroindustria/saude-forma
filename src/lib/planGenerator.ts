import { supabase } from './supabaseClient';
import { MetasCalculadas } from './nutritionEngine';

export async function gerarPlanoInicialUsuario(
  userId: string,
  metas: MetasCalculadas,
  localTreino: 'casa' | 'academia' | 'parque',
  restricoesSaude: string[] = []
) {
  const { data: alimentosBase } = await supabase.from('alimentos').select('*');
  if (!alimentosBase || alimentosBase.length === 0) return;

  const buscarAlimento = (nomeParcial: string) =>
    alimentosBase.find((a) =>
      a.nome.toLowerCase().includes(nomeParcial.toLowerCase())
    );

  const gramasFrangoAlmocoeJantar = Math.round(
    ((metas.proteinas_g * 0.65) / 2 / 32) * 100
  );
  const gramasArrozAlmocoeJantar = Math.round(
    ((metas.carboidratos_g * 0.55) / 2 / 28.1) * 100
  );
  const gramasAveiaCafe = Math.round(((metas.carboidratos_g * 0.25) / 66.6) * 100);

  const estruturaRefeicoes = [
    {
      tipo_refeicao: 'cafe_manha',
      horario_sugerido: '08:00:00',
      ordem: 1,
      itens: [
        { alimento: buscarAlimento('Ovo de galinha'), gramas: 100 },
        { alimento: buscarAlimento('Aveia em flocos'), gramas: Math.max(20, gramasAveiaCafe) },
        { alimento: buscarAlimento('Banana prata'), gramas: 65 },
      ],
    },
    {
      tipo_refeicao: 'almoco',
      horario_sugerido: '12:30:00',
      ordem: 2,
      itens: [
        { alimento: buscarAlimento('Peito de frango'), gramas: Math.max(80, gramasFrangoAlmocoeJantar) },
        { alimento: buscarAlimento('Arroz integral') || buscarAlimento('Arroz branco'), gramas: Math.max(60, gramasArrozAlmocoeJantar) },
        { alimento: buscarAlimento('Feijão carioca'), gramas: 80 },
        { alimento: buscarAlimento('Brócolis'), gramas: 60 },
      ],
    },
    {
      tipo_refeicao: 'lanche',
      horario_sugerido: '16:30:00',
      ordem: 3,
      itens: [
        { alimento: buscarAlimento('Iogurte natural'), gramas: 160 },
        { alimento: buscarAlimento('Maçã fuji'), gramas: 130 },
        { alimento: buscarAlimento('Castanha-do-pará'), gramas: 8 },
      ],
    },
    {
      tipo_refeicao: 'jantar',
      horario_sugerido: '20:00:00',
      ordem: 4,
      itens: [
        { alimento: buscarAlimento('Filé de tilápia') || buscarAlimento('Peito de frango'), gramas: Math.max(80, gramasFrangoAlmocoeJantar) },
        { alimento: buscarAlimento('Batata-doce') || buscarAlimento('Batata inglesa'), gramas: Math.max(80, gramasArrozAlmocoeJantar) },
        { alimento: buscarAlimento('Alface'), gramas: 50 },
        { alimento: buscarAlimento('Tomate'), gramas: 45 },
      ],
    },
  ];

  for (const ref of estruturaRefeicoes) {
    const { data: refCriada } = await supabase
      .from('refeicoes_plano')
      .insert({
        usuario_id: userId,
        tipo_refeicao: ref.tipo_refeicao,
        horario_sugerido: ref.horario_sugerido,
        ordem: ref.ordem,
      })
      .select('id')
      .single();

    if (refCriada) {
      const itensValidos = ref.itens
        .filter((i) => i.alimento !== undefined)
        .map((i) => ({
          refeicao_id: refCriada.id,
          alimento_id: i.alimento.id,
          quantidade_gramas: i.gramas,
          concluido_hoje: false,
        }));

      if (itensValidos.length > 0) {
        await supabase.from('itens_refeicao').insert(itensValidos);
      }
    }
  }

  const { data: todosExercicios } = await supabase.from('exercicios').select('*');
  if (!todosExercicios || todosExercicios.length === 0) return;

  const exerciciosSeguros = todosExercicios.filter((ex) => {
    const equipamentoOk =
      localTreino === 'academia'
        ? true
        : ex.equipamento_necessario === 'peso_corporal';

    const contra: string[] = ex.contraindicacoes || [];
    const temConflito = contra.some((c) => restricoesSaude.includes(c));

    return equipamentoOk && !temConflito;
  });

  const gruposAlvo = ['pernas', 'peito', 'costas', 'core', 'cardio'];
  const selecionados = gruposAlvo
    .map((grupo) => exerciciosSeguros.find((ex) => ex.grupo_muscular === grupo))
    .filter(Boolean);

  if (selecionados.length > 0) {
    const { data: treinoCriado } = await supabase
      .from('treinos_usuario')
      .insert({
        usuario_id: userId,
        titulo: 'Treino A • Adaptação Corpo Inteiro',
        dia_semana: 1,
        fase_periodizacao: 'adaptacao',
      })
      .select('id')
      .single();

    if (treinoCriado) {
      const itensTreino = selecionados.map((ex) => ({
        treino_id: treinoCriado.id,
        exercicio_id: ex.id,
        series: 3,
        repeticoes_alvo: '12-15',
        descanso_segundos: 60,
        carga_atual_kg: 0,
      }));

      await supabase.from('itens_treino').insert(itensTreino);
    }
  }
}
