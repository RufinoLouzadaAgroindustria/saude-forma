import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export type LocalAnuncio = 'dashboard' | 'alimentacao' | 'treinos' | 'lista_compras';

interface Anuncio {
  id: number;
  titulo: string;
  descricao: string;
  texto_botao: string;
  link_destino: string;
  imagem_url?: string;
  local_exibicao?: string;
}

export function BannerAnuncio({ local }: { local: LocalAnuncio }) {
  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);
  const [erroBusca, setErroBusca] = useState<string>('');

  useEffect(() => {
    carregarAnuncio();
  }, [local]);

  const carregarAnuncio = async () => {
    const { data, error } = await supabase
      .from('anuncios')
      .select('*')
      .eq('ativo', true);

    if (error) {
      setErroBusca(error.message);
      return;
    }

    if (data && data.length > 0) {
      const doLocal = data.find(
        (a: any) =>
          String(a.local_exibicao || '').trim().toLowerCase() ===
          local.toLowerCase()
      );
      setAnuncio(doLocal || data[0]);
    }
  };

  const handleClique = async () => {
    if (!anuncio) return;
    await supabase.rpc('registrar_clique_anuncio', { p_anuncio_id: anuncio.id });
    window.open(anuncio.link_destino, '_blank', 'noopener,noreferrer');
  };

  if (erroBusca) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
        Aviso banner: {erroBusca}
      </div>
    );
  }

  if (!anuncio) return null;

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-100">
          Patrocinado
        </span>
      </div>

      <div className="flex items-center gap-3">
        {anuncio.imagem_url && (
          <img
            src={anuncio.imagem_url}
            alt={anuncio.titulo}
            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-emerald-100 bg-white"
          />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-slate-800 leading-snug">
            {anuncio.titulo}
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">{anuncio.descricao}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleClique}
        className="w-full py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
      >
        {anuncio.texto_botao || 'Conhecer Oferta'}
      </button>
    </div>
  );
}
