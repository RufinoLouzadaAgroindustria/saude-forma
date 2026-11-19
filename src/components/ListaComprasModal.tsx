import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BannerAnuncio } from './BannerAnuncio';

interface ItemConsolidado {
  alimento_id: number;
  nome: string;
  setor: string;
  total_gramas_semana: number;
  comprado: boolean;
}

interface ListaComprasModalProps {
  userId: string;
  aberto: boolean;
  onFechar: () => void;
}

const MAPA_SETORES: Record<string, string> = {
  vegetal: 'Hortifrúti e Folhosos',
  fruta: 'Hortifrúti e Folhosos',
  proteina: 'Açougue, Peixaria e Laticínios',
  carboidrato: 'Mercearia, Grãos e Padaria',
  gordura: 'Mercearia e Oleaginosas',
};

export function ListaComprasModal({
  userId,
  aberto,
  onFechar,
}: ListaComprasModalProps) {
  const [itens, setItens] = useState<ItemConsolidado[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (aberto) {
      gerarListaSemanal();
      setCopiado(false);
    }
  }, [aberto, userId]);

  const gerarListaSemanal = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('refeicoes_plano')
      .select(
        'itens_refeicao ( quantidade_gramas, alimentos ( id, nome, grupo_alimentar ) )'
      )
      .eq('usuario_id', userId);

    if (!error && data) {
      const mapaAgrupado = new Map<number, ItemConsolidado>();

      data.forEach((refeicao: any) => {
        refeicao.itens_refeicao?.forEach((item: any) => {
          const alimento = item.alimentos;
          if (!alimento) return;

          const gramasSemanais = Math.round(item.quantidade_gramas * 7);
          const existente = mapaAgrupado.get(alimento.id);

          if (existente) {
            existente.total_gramas_semana += gramasSemanais;
          } else {
            mapaAgrupado.set(alimento.id, {
              alimento_id: alimento.id,
              nome: alimento.nome,
              setor: MAPA_SETORES[alimento.grupo_alimentar] || 'Outros Itens',
              total_gramas_semana: gramasSemanais,
              comprado: false,
            });
          }
        });
      });

      const listaOrdenada = Array.from(mapaAgrupado.values()).sort((a, b) =>
        a.setor.localeCompare(b.setor)
      );
      setItens(listaOrdenada);
    }
    setLoading(false);
  };

  const alternarItemComprado = (alimentoId: number) => {
    setItens((prev) =>
      prev.map((item) =>
        item.alimento_id === alimentoId
          ? { ...item, comprado: !item.comprado }
          : item
      )
    );
  };

  const formatarPesoMercado = (gramas: number) => {
    if (gramas >= 1000) {
      return (gramas / 1000).toFixed(2).replace('.', ',') + ' kg';
    }
    return gramas + ' g';
  };

  const copiarListaTexto = () => {
    const pendentes = itens.filter((i) => !i.comprado);
    if (pendentes.length === 0) return;

    const linhas = pendentes.map(
      (i) => `- ${i.nome}: ${formatarPesoMercado(i.total_gramas_semana)}`
    );
    const textoCompleto =
      'Lista de Compras da Semana (Saúde & Forma):\n\n' + linhas.join('\n');

    navigator.clipboard.writeText(textoCompleto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  if (!aberto) return null;

  const setores = Array.from(new Set(itens.map((i) => i.setor)));

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-xl">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-slate-800">
              Lista de Compras (7 Dias)
            </h3>
            <p className="text-xs text-slate-500">
              Quantidades somadas do seu cardápio atual
            </p>
          </div>
          <button
            onClick={onFechar}
            className="p-2 text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-5 flex-1">
          <BannerAnuncio local="lista_compras" />

          {loading ? (
            <p className="text-center text-sm text-slate-500 py-8">
              Calculando quantidades da semana...
            </p>
          ) : itens.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-8">
              Nenhum alimento encontrado no seu cardápio.
            </p>
          ) : (
            setores.map((setor) => (
              <div key={setor} className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                  {setor}
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl px-3">
                  {itens
                    .filter((i) => i.setor === setor)
                    .map((item) => (
                      <label
                        key={item.alimento_id}
                        className="py-3 flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={item.comprado}
                            onChange={() =>
                              alternarItemComprado(item.alimento_id)
                            }
                            className="w-5 h-5 accent-emerald-600 rounded"
                          />
                          <span
                            className={
                              'text-sm font-medium ' +
                              (item.comprado
                                ? 'line-through text-slate-400'
                                : 'text-slate-800')
                            }
                          >
                            {item.nome}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg shrink-0">
                          {formatarPesoMercado(item.total_gramas_semana)}
                        </span>
                      </label>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>

        {itens.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
            <button
              type="button"
              onClick={copiarListaTexto}
              className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl text-sm hover:bg-emerald-700 transition-colors"
            >
              {copiado
                ? 'Lista copiada! Cole no seu WhatsApp'
                : 'Copiar Lista para o WhatsApp'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
