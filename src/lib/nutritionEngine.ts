export interface PerfilUsuario {
  sexo_biologico: 'masculino' | 'feminino';
  peso_kg: number;
  altura_cm: number;
  idade: number;
  nivel_atividade: number;
  objetivo: 'perda_peso' | 'recomposicao' | 'manutencao';
}

export interface MetasCalculadas {
  tmb: number;
  get: number;
  calorias_diarias: number;
  proteinas_g: number;
  carboidratos_g: number;
  gorduras_g: number;
  agua_ml: number;
}

export interface Alimento {
  id: number;
  nome: string;
  grupo_alimentar: string;
  calorias_100g: number;
  proteinas_100g: number;
  carboidratos_100g: number;
  gorduras_100g: number;
  medida_caseira_nome: string;
  medida_caseira_gramas: number;
}

export interface ResultadoSubstituicao {
  alimento_substituto: Alimento;
  nova_quantidade_gramas: number;
  medida_caseira_equivalente: string;
  calorias_resultantes: number;
}

export function calcularMetasNutricionais(perfil: PerfilUsuario): MetasCalculadas {
  const baseTmb =
    10 * perfil.peso_kg + 6.25 * perfil.altura_cm - 5 * perfil.idade;
  const tmb =
    perfil.sexo_biologico === 'masculino' ? baseTmb + 5 : baseTmb - 161;

  const get = tmb * perfil.nivel_atividade;

  let caloriasAlvo = get;
  if (perfil.objetivo === 'perda_peso') {
    caloriasAlvo = get * 0.82;
  } else if (perfil.objetivo === 'recomposicao') {
    caloriasAlvo = get * 0.90;
  }

  const pisoSeguranca = perfil.sexo_biologico === 'masculino' ? 1500 : 1200;
  const caloriasDiarias = Math.round(Math.max(caloriasAlvo, pisoSeguranca));

  const proteinas_g = Math.round(perfil.peso_kg * 1.8);
  const gorduras_g = Math.round(perfil.peso_kg * 0.8);

  const caloriasProteinas = proteinas_g * 4;
  const caloriasGorduras = gorduras_g * 9;
  const caloriasRestantes = Math.max(
    0,
    caloriasDiarias - (caloriasProteinas + caloriasGorduras)
  );
  const carboidratos_g = Math.round(caloriasRestantes / 4);
  const agua_ml = Math.round(perfil.peso_kg * 35);

  return {
    tmb: Math.round(tmb),
    get: Math.round(get),
    calorias_diarias: caloriasDiarias,
    proteinas_g,
    carboidratos_g,
    gorduras_g,
    agua_ml,
  };
}

export function calcularSubstituicaoAlimento(
  alimentoOriginal: Alimento,
  gramasOriginal: number,
  alimentoNovo: Alimento
): ResultadoSubstituicao {
  const caloriasTotaisOriginal =
    (alimentoOriginal.calorias_100g / 100) * gramasOriginal;

  const densidadeCaloricaNovo =
    alimentoNovo.calorias_100g > 0 ? alimentoNovo.calorias_100g : 1;

  const novaQuantidadeGramas = Math.max(
    1,
    Math.round((caloriasTotaisOriginal / densidadeCaloricaNovo) * 100)
  );

  const gramasMedida =
    alimentoNovo.medida_caseira_gramas > 0
      ? alimentoNovo.medida_caseira_gramas
      : 100;

  const qtdMedidas =
    Math.round((novaQuantidadeGramas / gramasMedida) * 2) / 2;

  const medidaFormatada =
    qtdMedidas > 0 && alimentoNovo.medida_caseira_nome
      ? `${qtdMedidas}x ${alimentoNovo.medida_caseira_nome}`
      : `${novaQuantidadeGramas}g`;

  const caloriasResultantes = Math.round(
    (alimentoNovo.calorias_100g / 100) * novaQuantidadeGramas
  );

  return {
    alimento_substituto: alimentoNovo,
    nova_quantidade_gramas: novaQuantidadeGramas,
    medida_caseira_equivalente: medidaFormatada,
    calorias_resultantes: caloriasResultantes,
  };
}
