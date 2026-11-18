import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { calcularMetasNutricionais, PerfilUsuario } from '../lib/nutritionEngine';
import { gerarPlanoInicialUsuario } from '../lib/planGenerator';

interface OnboardingProps {
  userId: string;
  userEmail: string;
  onComplete: () => void;
}

type ObjetivoTipo = 'perda_peso' | 'recomposicao' | 'manutencao';

export function Onboarding({ userId, userEmail, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [nome, setNome] = useState('');
  const [sexo, setSexo] = useState<'masculino' | 'feminino'>('feminino');
  const [dataNascimento, setDataNascimento] = useState('1990-01-01');
  const [alturaCm, setAlturaCm] = useState(168);
  const [pesoKg, setPesoKg] = useState(75);
  const [pesoMetaKg, setPesoMetaKg] = useState(65);
  const [nivelAtividade, setNivelAtividade] = useState(1.375);
  const [objetivo, setObjetivo] = useState<ObjetivoTipo>('perda_peso');
  const [localTreino, setLocalTreino] = useState<'casa' | 'academia' | 'parque'>('casa');
  const [restricoesSaude, setRestricoesSaude] = useState<string[]>([]);

  const alternarRestricao = (item: string) => {
    setRestricoesSaude((prev) =>
      prev.includes(item) ? prev.filter((r) => r !== item) : [...prev, item]
    );
  };

  const calcularIdade = (dataNasc: string) => {
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return Math.max(14, idade);
  };

  const handleFinalizar = async () => {
    setLoading(true);
    try {
      const idade = calcularIdade(dataNascimento);
      const perfilCalc: PerfilUsuario = {
        sexo_biologico: sexo,
        peso_kg: pesoKg,
        altura_cm: alturaCm,
        idade,
        nivel_atividade: nivelAtividade,
        objetivo,
      };

      const metas = calcularMetasNutricionais(perfilCalc);

      const { error: userError } = await supabase.from('usuarios').upsert({
        id: userId,
        nome: nome.trim(),
        email: userEmail,
        data_nascimento: dataNascimento,
        sexo_biologico: sexo,
        altura_cm: alturaCm,
        peso_inicial_kg: pesoKg,
        peso_meta_kg: pesoMetaKg,
        nivel_atividade: nivelAtividade,
        objetivo,
        local_treino: localTreino,
        restricoes_saude: restricoesSaude,
      });

      if (userError) throw userError;

      const { error: metaError } = await supabase.from('metas_nutricionais').insert({
        usuario_id: userId,
        calorias_diarias: metas.calorias_diarias,
        proteinas_g: metas.proteinas_g,
        carboidratos_g: metas.carboidratos_g,
        gorduras_g: metas.gorduras_g,
        agua_ml: metas.agua_ml,
        ativo: true,
      });

      if (metaError) throw metaError;

      await gerarPlanoInicialUsuario(userId, metas, localTreino, restricoesSaude);
      onComplete();
    } catch (err) {
      console.error('Erro ao salvar onboarding:', err);
      alert('Não foi possível salvar seus dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center p-4 max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm font-medium text-emerald-600">Passo {step} de 3</span>
          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: ((step / 3) * 100) + '%' }} />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Vamos conhecer você</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Seu Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Ana Silva"
                className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sexo Biológico</label>
              <select
                value={sexo}
                onChange={(e) => setSexo(e.target.value as 'masculino' | 'feminino')}
                className="w-full p-3 border border-slate-300 rounded-xl bg-white"
              >
                <option value="feminino">Feminino</option>
                <option value="masculino">Masculino</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data de Nascimento</label>
              <input
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl"
              />
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!nome.trim()}
              className="w-full mt-4 bg-emerald-600 text-white font-semibold py-3.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50"
            >
              Continuar
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Medidas e Objetivo</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Altura (cm)</label>
                <input
                  type="number"
                  value={alturaCm}
                  onChange={(e) => setAlturaCm(Number(e.target.value))}
                  className="w-full p-3 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Peso Atual (kg)</label>
                <input
                  type="number"
                  value={pesoKg}
                  onChange={(e) => setPesoKg(Number(e.target.value))}
                  className="w-full p-3 border border-slate-300 rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Peso Desejado (kg)</label>
              <input
                type="number"
                value={pesoMetaKg}
                onChange={(e) => setPesoMetaKg(Number(e.target.value))}
                className="w-full p-3 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Objetivo Principal</label>
              <select
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value as ObjetivoTipo)}
                className="w-full p-3 border border-slate-300 rounded-xl bg-white"
              >
                <option value="perda_peso">Perder peso com saúde</option>
                <option value="recomposicao">Definir e ganhar massa magra</option>
                <option value="manutencao">Manter peso e melhorar disposição</option>
              </select>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3.5 border border-slate-300 rounded-xl font-medium text-slate-600"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-2/3 bg-emerald-600 text-white font-semibold py-3.5 rounded-xl hover:bg-emerald-700"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Sua Rotina e Cuidados</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nível de Atividade Diária</label>
              <select
                value={nivelAtividade}
                onChange={(e) => setNivelAtividade(Number(e.target.value))}
                className="w-full p-3 border border-slate-300 rounded-xl bg-white"
              >
                <option value={1.2}>Sedentário (trabalho sentado, sem exercícios)</option>
                <option value={1.375}>Levemente ativo (1 a 3 treinos/semana)</option>
                <option value={1.55}>Moderadamente ativo (3 a 5 treinos/semana)</option>
                <option value={1.725}>Muito ativo (6 a 7 treinos intensos)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Onde prefere treinar?</label>
              <select
                value={localTreino}
                onChange={(e) => setLocalTreino(e.target.value as 'casa' | 'academia' | 'parque')}
                className="w-full p-3 border border-slate-300 rounded-xl bg-white"
              >
                <option value="casa">Em Casa (Peso corporal)</option>
                <option value="academia">Academia Completa</option>
                <option value="parque">Parque / Ar livre</option>
              </select>
            </div>
            <div>
Sensibilidade Articular (Opcional)
                {['lesao_joelho', 'lombar', 'lesao_ombro', 'punho'].map((id) => (
                  <label key={id} className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-xl text-xs">
                    <input
                      type="checkbox"
                      checked={restricoesSaude.includes(id)}
                      onChange={() => alternarRestricao(id)}
                      className="accent-emerald-600"
                    />
                    <span>{id === 'lesao_joelho' ? 'Joelhos' : id === 'lombar' ? 'Lombar' : id === 'lesao_ombro' ? 'Ombros' : 'Punhos'}</span>
                  </label>
                ))}
              </div>
            </div>
                        <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 py-3.5 border border-slate-300 rounded-xl font-medium text-slate-600"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleFinalizar}
                disabled={loading}
                className="w-2/3 bg-emerald-600 text-white font-semibold py-3.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? 'Gerando Plano...' : 'Criar Meu Plano'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
