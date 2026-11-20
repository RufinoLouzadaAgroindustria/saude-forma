import { supabase } from './supabaseClient';
import { MetasCalculadas } from './nutritionEngine';

export type EstiloCardapio = 'tradicional' | 'pratico' | 'economico' | 'vegano';

export async function gerarPlanoInicialUsuario(
  userId: string,
  metas: MetasCalculadas,
  localTreino: 'casa' | 'academia' | 'parque',
  restricoesSaude: string[] = [],
  estiloCardapio: EstiloCardapio = 'tradicional'
) {
  const { data: alimentosBase } = await supabase.from('alimentos').select('*');
  if (!alimentosBase || alimentosBase.length === 0) return;

  const buscarAlimento = (nomeParcial: string) =>
    alimentosBase.find((a) =>
      a.nome.toLowerCase().includes(nomeParcial.toLowerCase())
    );

  const sortear = <T,>(opcoes: T[]): T =>
    opcoes[Math.floor(Math.random() * opcoes.length)];

  await supabase.from('refeicoes_plano').delete().eq('usuario_id', userId);

  const pAlvo = Math.max(80, Math.round(((metas.proteinas_g * 0.65) / 2 / 30) * 100));
  const cAlvo = Math.max(70, Math.round(((metas.carboidratos_g * 0.55) / 2 / 28) * 100));
  const cCafe = Math.max(30, Math.round(((metas.carboidratos_g * 0.25) / 60) * 100));

  let estruturaRefeicoes: {
    tipo_refeicao: string;
    horario_sugerido: string;
    ordem: number;
    itens: { alimento: any; gramas: number }[];
  }[] = [];

  if (estiloCardapio === 'vegano') {
    const cafeOpcoes = [
      [
        { alimento: buscarAlimento('Bebida vegetal de soja'), gramas: 200 },
        { alimento: buscarAlimento('Aveia em flocos'), gramas: cCafe },
        { alimento: buscarAlimento('Morango fresco') || buscarAlimento('Banana prata'), gramas: 100 },
        { alimento: buscarAlimento('Semente de chia'), gramas: 15 },
      ],
      [
        { alimento: buscarAlimento('Tapioca'), gramas: 70 },
        { alimento: buscarAlimento('Tofu mexido') || buscarAlimento('Tofu firme'), gramas: 85 },
        { alimento: buscarAlimento('Abacate fresco'), gramas: 45 },
      ],
      [
        { alimento: buscarAlimento('Cuscuz de milho'), gramas: 120 },
        { alimento: buscarAlimento('Pasta de amendoim'), gramas: 20 },
        { alimento: buscarAlimento('Mamão papaia') || buscarAlimento('Maçã fuji'), gramas: 150 },
      ],
      [
        { alimento: buscarAlimento('Pão integral'), gramas: 50 },
        { alimento: buscarAlimento('Tahine') || buscarAlimento('Pasta de amendoim'), gramas: 15 },
        { alimento: buscarAlimento('Banana prata'), gramas: 80 },
      ],
    ];

    const almocoOpcoes = [
      [
        { alimento: buscarAlimento('Grão-de-bico cozido'), gramas: Math.round(pAlvo * 1.3) },
        { alimento: buscarAlimento('Quinoa cozida') || buscarAlimento('Arroz integral'), gramas: cAlvo },
        { alimento: buscarAlimento('Brócolis'), gramas: 70 },
        { alimento: buscarAlimento('Cenoura'), gramas: 50 },
      ],
      [
        { alimento: buscarAlimento('Proteína texturizada de soja'), gramas: pAlvo },
        { alimento: buscarAlimento('Mandioca') || buscarAlimento('Batata-doce'), gramas: Math.round(cAlvo * 1.2) },
        { alimento: buscarAlimento('Espinafre'), gramas: 60 },
        { alimento: buscarAlimento('Tomate'), gramas: 50 },
      ],
      [
        { alimento: buscarAlimento('Lentilha cozida'), gramas: Math.round(pAlvo * 1.3) },
        { alimento: buscarAlimento('Arroz integral') || buscarAlimento('Arroz branco'), gramas: cAlvo },
        { alimento: buscarAlimento('Abobrinha'), gramas: 70 },
        { alimento: buscarAlimento('Rúcula') || buscarAlimento('Alface'), gramas: 45 },
      ],
      [
        { alimento: buscarAlimento('Hambúrguer caseiro de grão-de-bico') || buscarAlimento('Tofu firme'), gramas: Math.round(pAlvo * 1.2) },
        { alimento: buscarAlimento('Abóbora cabotiá') || buscarAlimento('Inhame'), gramas: Math.round(cAlvo * 1.3) },
        { alimento: buscarAlimento('Vagem'), gramas: 60 },
        { alimento: buscarAlimento('Azeite de oliva'), gramas: 10 },
      ],
    ];

    const lancheOpcoes = [
      [
        { alimento: buscarAlimento('Banana prata'), gramas: 90 },
        { alimento: buscarAlimento('Pasta de amendoim'), gramas: 20 },
        { alimento: buscarAlimento('Aveia em flocos'), gramas: 25 },
      ],
      [
        { alimento: buscarAlimento('Bebida vegetal de soja'), gramas: 200 },
        { alimento: buscarAlimento('Manga palmer') || buscarAlimento('Maçã fuji'), gramas: 120 },
        { alimento: buscarAlimento('Nozes') || buscarAlimento('Castanha-do-pará'), gramas: 12 },
      ],
      [
        { alimento: buscarAlimento('Edamame'), gramas: 100 },
        { alimento: buscarAlimento('Abacate fresco'), gramas: 40 },
      ],
      [
        { alimento: buscarAlimento('Granola sem açúcar'), gramas: 35 },
        { alimento: buscarAlimento('Morango fresco') || buscarAlimento('Mamão papaia'), gramas: 120 },
        { alimento: buscarAlimento('Semente de linhaça'), gramas: 10 },
      ],
    ];

    const jantarOpcoes = [
      [
        { alimento: buscarAlimento('Tofu firme'), gramas: Math.round(pAlvo * 1.2) },
        { alimento: buscarAlimento('Batata-doce') || buscarAlimento('Inhame'), gramas: Math.round(cAlvo * 1.2) },
        { alimento: buscarAlimento('Couve-flor') || buscarAlimento('Brócolis'), gramas: 70 },
      ],
      [
        { alimento: buscarAlimento('Ervilha fresca') || buscarAlimento('Lentilha cozida'), gramas: Math.round(pAlvo * 1.3) },
        { alimento: buscarAlimento('Macarrão integral') || buscarAlimento('Cuscuz de milho'), gramas: cAlvo },
        { alimento: buscarAlimento('Abobrinha'), gramas: 70 },
        { alimento: buscarAlimento('Azeite de oliva'), gramas: 10 },
      ],
      [
        { alimento: buscarAlimento('Feijão preto') || buscarAlimento('Feijão carioca'), gramas: Math.round(pAlvo * 1.4) },
        { alimento: buscarAlimento('Arroz integral'), gramas: cAlvo },
        { alimento: buscarAlimento('Beterraba') || buscarAlimento('Tomate'), gramas: 55 },
      ],
    ];

    estruturaRefeicoes = [
      { tipo_refeicao: 'cafe_manha', horario_sugerido: '08:00:00', ordem: 1, itens: sortear(cafeOpcoes) },
      { tipo_refeicao: 'almoco', horario_sugerido: '12:30:00', ordem: 2, itens: sortear(almocoOpcoes) },
      { tipo_refeicao: 'lanche', horario_sugerido: '16:30:00', ordem: 3, itens: sortear(lancheOpcoes) },
      { tipo_refeicao: 'jantar', horario_sugerido: '20:00:00', ordem: 4, itens: sortear(jantarOpcoes) },
    ];
  } else if (estiloCardapio === 'economico') {
    const cafeOpcoes = [
      [
        { alimento: buscarAlimento('Ovo de galinha'), gramas: 100 },
        { alimento: buscarAlimento('Cuscuz de milho') || buscarAlimento('Aveia em flocos'), gramas: 100 },
        { alimento: buscarAlimento('Banana prata'), gramas: 80 },
      ],
      [
        { alimento: buscarAlimento('Pão francês'), gramas: 50 },
        { alimento: buscarAlimento('Ovo de galinha'), gramas: 100 },
        { alimento: buscarAlimento('Mamão papaia') || buscarAlimento('Laranja pera'), gramas: 130 },
      ],
      [
        { alimento: buscarAlimento('Aveia em flocos'), gramas: cCafe },
        { alimento: buscarAlimento('Banana prata'), gramas: 90 },
        { alimento: buscarAlimento('Pasta de amendoim'), gramas: 15 },
      ],
    ];

    const almocoOpcoes = [
      [
        { alimento: buscarAlimento('Peito de frango'), gramas: pAlvo },
        { alimento: buscarAlimento('Arroz branco'), gramas: cAlvo },
        { alimento: buscarAlimento('Feijão carioca'), gramas: 90 },
        { alimento: buscarAlimento('Cenoura'), gramas: 50 },
      ],
      [
        { alimento: buscarAlimento('Sobrecoxa de frango') || buscarAlimento('Peito de frango'), gramas: pAlvo },
        { alimento: buscarAlimento('Arroz branco'), gramas: cAlvo },
        { alimento: buscarAlimento('Feijão preto') || buscarAlimento('Feijão carioca'), gramas: 90 },
        { alimento: buscarAlimento('Chuchu') || buscarAlimento('Abobrinha'), gramas: 60 },
      ],
      [
        { alimento: buscarAlimento('Carne moída de músculo') || buscarAlimento('Ovo de galinha'), gramas: pAlvo },
        { alimento: buscarAlimento('Mandioca') || buscarAlimento('Arroz branco'), gramas: cAlvo },
        { alimento: buscarAlimento('Beterraba') || buscarAlimento('Tomate'), gramas: 60 },
      ],
    ];

    const lancheOpcoes = [
      [
        { alimento: buscarAlimento('Banana prata'), gramas: 90 },
        { alimento: buscarAlimento('Aveia em flocos'), gramas: 30 },
      ],
      [
        { alimento: buscarAlimento('Maçã fuji'), gramas: 130 },
        { alimento: buscarAlimento('Pasta de amendoim'), gramas: 15 },
      ],
      [
        { alimento: buscarAlimento('Milho verde cozido') || buscarAlimento('Cuscuz de milho'), gramas: 100 },
        { alimento: buscarAlimento('Laranja pera') || buscarAlimento('Melão amarelo'), gramas: 130 },
      ],
    ];

    const jantarOpcoes = [
      [
        { alimento: buscarAlimento('Peito de frango'), gramas: pAlvo },
        { alimento: buscarAlimento('Batata inglesa') || buscarAlimento('Mandioca'), gramas: Math.round(cAlvo * 1.2) },
        { alimento: buscarAlimento('Alface'), gramas: 50 },
        { alimento: buscarAlimento('Tomate'), gramas: 50 },
      ],
      [
        { alimento: buscarAlimento('Ovo de galinha'), gramas: 150 },
        { alimento: buscarAlimento('Arroz branco'), gramas: cAlvo },
        { alimento: buscarAlimento('Feijão carioca'), gramas: 80 },
        { alimento: buscarAlimento('Abobrinha'), gramas: 60 },
      ],
    ];

    estruturaRefeicoes = [
      { tipo_refeicao: 'cafe_manha', horario_sugerido: '08:00:00', ordem: 1, itens: sortear(cafeOpcoes) },
      { tipo_refeicao: 'almoco', horario_sugerido: '12:30:00', ordem: 2, itens: sortear(almocoOpcoes) },
      { tipo_refeicao: 'lanche', horario_sugerido: '16:30:00', ordem: 3, itens: sortear(lancheOpcoes) },
      { tipo_refeicao: 'jantar', horario_sugerido: '20:00:00', ordem: 4, itens: sortear(jantarOpcoes) },
    ];
  } else {
    const cafeOpcoes = [
      [
        { alimento: buscarAlimento('Ovo de galinha'), gramas: 100 },
        { alimento: buscarAlimento('Aveia em flocos'), gramas: cCafe },
        { alimento: buscarAlimento('Morango fresco') || buscarAlimento('Banana prata'), gramas: 90 },
      ],
      [
        { alimento: buscarAlimento('Ovo de galinha'), gramas: 100 },
        { alimento: buscarAlimento('Cuscuz de milho'), gramas: 110 },
        { alimento: buscarAlimento('Abacate fresco'), gramas: 35 },
      ],
      [
        { alimento: buscarAlimento('Iogurte natural'), gramas: 160 },
        { alimento: buscarAlimento('Tapioca'), gramas: 70 },
        { alimento: buscarAlimento('Queijo minas frescal') || buscarAlimento('Banana prata'), gramas: 50 },
      ],
      [
        { alimento: buscarAlimento('Pão integral'), gramas: 50 },
        { alimento: buscarAlimento('Ricota fresca') || buscarAlimento('Ovo de galinha'), gramas: 60 },
        { alimento: buscarAlimento('Mamão papaia') || buscarAlimento('Melão amarelo'), gramas: 140 },
      ],
    ];

    const almocoOpcoes = [
      [
        { alimento: buscarAlimento('Peito de frango'), gramas: pAlvo },
        { alimento: buscarAlimento('Arroz integral') || buscarAlimento('Arroz branco'), gramas: cAlvo },
        { alimento: buscarAlimento('Feijão carioca'), gramas: 80 },
        { alimento: buscarAlimento('Brócolis'), gramas: 60 },
      ],
      [
        { alimento: buscarAlimento('Patinho bovino'), gramas: pAlvo },
        { alimento: buscarAlimento('Arroz branco'), gramas: cAlvo },
        { alimento: buscarAlimento('Feijão preto') || buscarAlimento('Feijão carioca'), gramas: 80 },
        { alimento: buscarAlimento('Abobrinha'), gramas: 60 },
      ],
      [
        { alimento: buscarAlimento('Filé de salmão') || buscarAlimento('Filé de tilápia'), gramas: pAlvo },
        { alimento: buscarAlimento('Quinoa cozida') || buscarAlimento('Batata-doce'), gramas: Math.round(cAlvo * 1.1) },
        { alimento: buscarAlimento('Vagem') || buscarAlimento('Cenoura'), gramas: 60 },
        { alimento: buscarAlimento('Rúcula') || buscarAlimento('Alface'), gramas: 45 },
      ],
      [
        { alimento: buscarAlimento('Sobrecoxa de frango') || buscarAlimento('Peito de frango'), gramas: pAlvo },
        { alimento: buscarAlimento('Mandioca') || buscarAlimento('Inhame'), gramas: Math.round(cAlvo * 1.2) },
        { alimento: buscarAlimento('Couve-flor') || buscarAlimento('Brócolis'), gramas: 65 },
        { alimento: buscarAlimento('Azeite de oliva'), gramas: 10 },
      ],
    ];

    const lancheOpcoes = [
      [
        { alimento: buscarAlimento('Iogurte natural'), gramas: 160 },
        { alimento: buscarAlimento('Manga palmer') || buscarAlimento('Maçã fuji'), gramas: 120 },
        { alimento: buscarAlimento('Castanha-do-pará'), gramas: 8 },
      ],
      [
        { alimento: buscarAlimento('Banana prata'), gramas: 85 },
        { alimento: buscarAlimento('Pasta de amendoim'), gramas: 15 },
        { alimento: buscarAlimento('Granola sem açúcar') || buscarAlimento('Aveia em flocos'), gramas: 25 },
      ],
      [
        { alimento: buscarAlimento('Queijo cottage') || buscarAlimento('Ricota fresca'), gramas: 60 },
        { alimento: buscarAlimento('Abacaxi pérola') || buscarAlimento('Melão amarelo'), gramas: 130 },
        { alimento: buscarAlimento('Nozes') || buscarAlimento('Amêndoas'), gramas: 10 },
      ],
    ];

    const jantarOpcoes = [
      [
        { alimento: buscarAlimento('Filé de tilápia') || buscarAlimento('Peito de frango'), gramas: pAlvo },
        { alimento: buscarAlimento('Batata-doce') || buscarAlimento('Inhame'), gramas: Math.round(cAlvo * 1.1) },
        { alimento: buscarAlimento('Alface'), gramas: 50 },
        { alimento: buscarAlimento('Tomate'), gramas: 45 },
      ],
      [
        { alimento: buscarAlimento('Carne moída de músculo') || buscarAlimento('Patinho bovino'), gramas: pAlvo },
        { alimento: buscarAlimento('Abóbora cabotiá') || buscarAlimento('Mandioca'), gramas: Math.round(cAlvo * 1.2) },
        { alimento: buscarAlimento('Espinafre') || buscarAlimento('Brócolis'), gramas: 60 },
      ],
      [
        { alimento: buscarAlimento('Peito de frango'), gramas: pAlvo },
        { alimento: buscarAlimento('Macarrão integral') || buscarAlimento('Arroz integral'), gramas: cAlvo },
        { alimento: buscarAlimento('Pepino') || buscarAlimento('Tomate'), gramas: 60 },
        { alimento: buscarAlimento('Azeite de oliva'), gramas: 10 },
      ],
    ];

    estruturaRefeicoes = [
      { tipo_refeicao: 'cafe_manha', horario_sugerido: '08:00:00', ordem: 1, itens: sortear(cafeOpcoes) },
      { tipo_refeicao: 'almoco', horario_sugerido: '12:30:00', ordem: 2, itens: sortear(almocoOpcoes) },
      { tipo_refeicao: 'lanche', horario_sugerido: '16:30:00', ordem: 3, itens: sortear(lancheOpcoes) },
      { tipo_refeicao: 'jantar', horario_sugerido: '20:00:00', ordem: 4, itens: sortear(jantarOpcoes) },
    ];
  }

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

  const { data: treinoExistente } = await supabase
    .from('treinos_usuario')
    .select('id')
    .eq('usuario_id', userId)
    .limit(1)
    .maybeSingle();

  if (treinoExistente) return;

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
