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
}

export function BannerAnuncio({ local }: { local: LocalAnuncio }) {
  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);

  useEffect(() => {
    carregarAnuncio();
  }, [local]);

  const carregarAnuncio = async () => {
    const { data } = await supabase
      .from('anuncios')
      .select('id, titulo, descricao, texto_botao, link_destino, imagem_url')
      .eq('local_exibicao', local)
      .eq('ativo', true)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) setAnuncio(data);
  };

  const handleClique = async () => {
    if (!anuncio) return;
    await supabase.rpc('registrar_clique_anuncio', { p_anuncio_id: anuncio.id });
    window.open(anuncio.link_destino, '_blank', 'noopener,noreferrer');
  };

  if (!anuncio) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-white/80 px-2 py-0.5 rounded-md border border-emerald-100">
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
          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
            {anuncio.descricao}
          </p>
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
