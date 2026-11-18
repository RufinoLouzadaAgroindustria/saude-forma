import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AlimentoLista {
  id: number;
  nome: string;
  grupo_alimentar: string;
}

interface ItemListaCompras {
  quantidade_gramas: number;
  alimentos: AlimentoLista | AlimentoLista[] | null;
}

interface RefeicaoListaCompras {
  itens_refeicao: ItemListaCompras[];
}

interface AlimentoAgregado {
  id: number;
  nome: string;
  quantidadeGramas: number;
  corredor: string;
}

interface ListaComprasModalProps {
  userId: string;
  onClose: () => void;
}

const CORREDORES = [
  'Hortifrúti e Folhosos',
  'Açougue',
  'Peixaria e Laticínios',
  'Mercearia e Grãos',
] as const;

function identificarCorredor(alimento: AlimentoLista): string {
  const texto = `${alimento.nome} ${alimento.grupo_alimentar}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (/peix|pescad|salmao|tilapia|atum|sardinha|fruto do mar|latic|leite|queijo|iogurte|requeij|coalhada/.test(texto)) {
    return 'Peixaria e Laticínios';
  }
  if (/acougue|carne|bovino|suino|porco|frango|ave|peru|linguica/.test(texto)) {
    return 'Açougue';
  }
  if (/horti|folhos|fruta|verdura|legume|vegetal|hortal|salada|folha|banana|maca|tomate|alface|brocolis|cenoura|batata|cebola|alho/.test(texto)) {
    return 'Hortifrúti e Folhosos';
  }
  return 'Mercearia e Grãos';
}

export function ListaComprasModal({ userId, onClose }: ListaComprasModalProps) {
  const [alimentos, setAlimentos] = useState<AlimentoAgregado[]>([]);
  const [itensMarcados, setItensMarcados] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let cancelado = false;

    const carregarLista = async () => {
      setLoading(true);
      setErro('');

      const { data, error } = await supabase
        .from('refeicoes_plano')
        .select(
          `
          itens_refeicao (
            quantidade_gramas,
            alimentos (*)
          )
        `
        )
        .eq('usuario_id', userId);

      if (cancelado) return;

      if (error) {
        setErro('Não foi possível carregar sua lista de compras. Tente novamente.');
        setLoading(false);
        return;
      }

      const totais = new Map<number, AlimentoAgregado>();
      (data as unknown as RefeicaoListaCompras[] | null)?.forEach((refeicao) => {
        refeicao.itens_refeicao?.forEach((item) => {
          const alimento = Array.isArray(item.alimentos)
            ? item.alimentos[0]
            : item.alimentos;
          if (!alimento) return;

          const quantidadeSemanal = Number(item.quantidade_gramas) * 7;
          const existente = totais.get(alimento.id);
          if (existente) {
            existente.quantidadeGramas += quantidadeSemanal;
          } else {
            totais.set(alimento.id, {
              id: alimento.id,
              nome: alimento.nome,
              quantidadeGramas: quantidadeSemanal,
              corredor: identificarCorredor(alimento),
            });
          }
        });
      });

      setAlimentos(
        Array.from(totais.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      );
      setLoading(false);
    };

    carregarLista();
    return () => {
      cancelado = true;
    };
  }, [userId]);

  const alimentosPorCorredor = useMemo(
    () =>
      CORREDORES.map((corredor) => ({
        corredor,
        alimentos: alimentos.filter((alimento) => alimento.corredor === corredor),
      })).filter((grupo) => grupo.alimentos.length > 0),
    [alimentos]
  );

  const alternarMarcacao = (id: number) => {
    setItensMarcados((atuais) => {
      const novos = new Set(atuais);
      if (novos.has(id)) novos.delete(id);
      else novos.add(id);
      return novos;
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="lista-compras-titulo"
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-xl sm:rounded-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 id="lista-compras-titulo" className="text-lg font-bold text-slate-800">
              Lista de Compras
            </h2>
            <p className="text-xs text-slate-500">Quantidades para 7 dias</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar lista de compras"
            className="rounded-lg p-2 font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Preparando sua lista de compras...
            </p>
          ) : erro ? (
            <p role="alert" className="py-8 text-center text-sm text-rose-600">
              {erro}
            </p>
          ) : alimentos.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Nenhum alimento encontrado no seu plano alimentar.
            </p>
          ) : (
            alimentosPorCorredor.map(({ corredor, alimentos: itens }) => (
              <section key={corredor}>
                <h3 className="mb-2 text-sm font-bold text-emerald-800">{corredor}</h3>
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                  {itens.map((alimento) => {
                    const marcado = itensMarcados.has(alimento.id);
                    return (
                      <li key={alimento.id} className="flex items-center gap-3 p-3">
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={() => alternarMarcacao(alimento.id)}
                          aria-label={`Marcar ${alimento.nome} como comprado`}
                          className="h-5 w-5 accent-emerald-600"
                        />
                        <span className={`flex-1 text-sm ${marcado ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                          {alimento.nome}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {Math.round(alimento.quantidadeGramas)} g
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
