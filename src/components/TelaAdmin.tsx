import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type AbaAdmin = 'exercicios' | 'alimentos' | 'anuncios';

export function TelaAdmin() {
  const [aba, setAba] = useState<AbaAdmin>('exercicios');

  // Estados de Exercícios
  const [exercicios, setExercicios] = useState<any[]>([]);
  const [editandoEx, setEditandoEx] = useState<any | null>(null);
  const [novoEx, setNovoEx] = useState({
    nome: '',
    grupo_muscular: 'pernas',
    equipamento_necessario: 'peso_corporal',
    video_url: '',
    instrucoes_postura: '',
  });

  // Estados de Alimentos
  const [novoAlimento, setNovoAlimento] = useState({
    nome: '',
    grupo_alimentar: 'proteina',
    calorias_100g: '',
    proteinas_100g: '',
    carboidratos_100g: '',
    gorduras_100g: '',
    medida_caseira_nome: 'porção média',
    medida_caseira_gramas: '100',
  });

  // Estados de Anunciantes
  const [anuncios, setAnuncios] = useState<any[]>([]);
  const [novoAnuncio, setNovoAnuncio] = useState({
    titulo: '',
    descricao: '',
    texto_botao: 'Pedir no WhatsApp',
    link_destino: '',
    imagem_url: '',
    local_exibicao: 'lista_compras',
  });

  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarExercicios();
    carregarAnuncios();
  }, []);

  const carregarExercicios = async () => {
    const { data } = await supabase
      .from('exercicios')
      .select('*')
      .order('nome', { ascending: true });
    if (data) setExercicios(data);
  };

  const carregarAnuncios = async () => {
    const { data } = await supabase
      .from('anuncios')
      .select('*')
      .order('id', { ascending: false });
    if (data) setAnuncios(data);
  };

  const salvarEdicaoExercicio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editandoEx) return;
    setSalvando(true);
    await supabase
      .from('exercicios')
      .update({
        nome: editandoEx.nome,
        grupo_muscular: editandoEx.grupo_muscular,
        video_url: editandoEx.video_url || null,
        instrucoes_postura: editandoEx.instrucoes_postura,
      })
      .eq('id', editandoEx.id);

    setEditandoEx(null);
    setSalvando(false);
    carregarExercicios();
  };

  const criarNovoExercicio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoEx.nome) return;
    setSalvando(true);
    await supabase.from('exercicios').insert({
      ...novoEx,
      video_url: novoEx.video_url || null,
    });
    setNovoEx({
      nome: '',
      grupo_muscular: 'pernas',
      equipamento_necessario: 'peso_corporal',
      video_url: '',
      instrucoes_postura: '',
    });
    setSalvando(false);
    carregarExercicios();
  };

  const criarNovoAlimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoAlimento.nome) return;
    setSalvando(true);
    await supabase.from('alimentos').insert({
      nome: novoAlimento.nome,
      grupo_alimentar: novoAlimento.grupo_alimentar,
      calorias_100g: Number(novoAlimento.calorias_100g),
      proteinas_100g: Number(novoAlimento.proteinas_100g),
      carboidratos_100g: Number(novoAlimento.carboidratos_100g),
      gorduras_100g: Number(novoAlimento.gorduras_100g),
      medida_caseira_nome: novoAlimento.medida_caseira_nome,
      medida_caseira_gramas: Number(novoAlimento.medida_caseira_gramas),
    });
    setNovoAlimento({
      nome: '',
      grupo_alimentar: 'proteina',
      calorias_100g: '',
      proteinas_100g: '',
      carboidratos_100g: '',
      gorduras_100g: '',
      medida_caseira_nome: 'porção média',
      medida_caseira_gramas: '100',
    });
    setSalvando(false);
    alert('Alimento cadastrado com sucesso!');
  };

  const criarNovoAnuncio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoAnuncio.titulo || !novoAnuncio.link_destino) return;
    setSalvando(true);
    await supabase.from('anuncios').insert({
      titulo: novoAnuncio.titulo,
      descricao: novoAnuncio.descricao,
      texto_botao: novoAnuncio.texto_botao || 'Saiba mais',
      link_destino: novoAnuncio.link_destino,
      imagem_url: novoAnuncio.imagem_url || null,
      local_exibicao: novoAnuncio.local_exibicao,
      ativo: true,
    });
    setNovoAnuncio({
      titulo: '',
      descricao: '',
      texto_botao: 'Pedir no WhatsApp',
      link_destino: '',
      imagem_url: '',
      local_exibicao: 'lista_compras',
    });
    setSalvando(false);
    carregarAnuncios();
  };

  const alternarStatusAnuncio = async (id: number, ativoAtual: boolean) => {
    await supabase
      .from('anuncios')
      .update({ ativo: !ativoAtual })
      .eq('id', id);
    carregarAnuncios();
  };

  const excluirAnuncio = async (id: number) => {
    if (!confirm('Deseja realmente excluir este anúncio?')) return;
    await supabase.from('anuncios').delete().eq('id', id);
    carregarAnuncios();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 max-w-md mx-auto p-4 space-y-4">
      <header className="pt-2">
        <h1 className="text-2xl font-bold text-slate-800">Painel Admin</h1>
        <p className="text-sm text-slate-500">
          Gestão de exercícios, alimentos e anunciantes
        </p>
      </header>

      <div className="grid grid-cols-3 gap-2 bg-white p-1.5 rounded-2xl border border-slate-200">
        {[
          { id: 'exercicios', label: 'Exercícios' },
          { id: 'alimentos', label: 'Alimentos' },
          { id: 'anuncios', label: 'Anunciantes' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setAba(tab.id as AbaAdmin)}
            className={`py-2 text-xs font-semibold rounded-xl transition-colors ${
              aba === tab.id
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {aba === 'exercicios' && (
        <div className="space-y-4">
          {editandoEx && (
            <form
              onSubmit={salvarEdicaoExercicio}
              className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-3"
            >
              <h2 className="font-bold text-sm text-emerald-900">
                Editando: {editandoEx.nome}
              </h2>
              <input
                type="text"
                required
                value={editandoEx.nome}
                onChange={(e) =>
                  setEditandoEx({ ...editandoEx, nome: e.target.value })
                }
                placeholder="Nome do exercício"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm"
              />
              <input
                type="text"
                value={editandoEx.video_url || ''}
                onChange={(e) =>
                  setEditandoEx({ ...editandoEx, video_url: e.target.value })
                }
                placeholder="URL da imagem/GIF/MP4 (ex: /exercicios/agachamento.png)"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm"
              />
              <textarea
                rows={2}
                value={editandoEx.instrucoes_postura || ''}
                onChange={(e) =>
                  setEditandoEx({
                    ...editandoEx,
                    instrucoes_postura: e.target.value,
                  })
                }
                placeholder="Instruções de postura"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditandoEx(null)}
                  className="w-1/3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="w-2/3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
                >
                  {salvando ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          )}

          <form
            onSubmit={criarNovoExercicio}
            className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3"
          >
            <h2 className="font-semibold text-sm text-slate-800">
              + Novo Exercício
            </h2>
            <input
              type="text"
              required
              value={novoEx.nome}
              onChange={(e) => setNovoEx({ ...novoEx, nome: e.target.value })}
              placeholder="Nome do exercício"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={novoEx.grupo_muscular}
                onChange={(e) =>
                  setNovoEx({ ...novoEx, grupo_muscular: e.target.value })
                }
                className="p-2.5 border border-slate-300 rounded-xl text-xs bg-white"
              >
                <option value="pernas">Pernas</option>
                <option value="peito">Peito</option>
                <option value="costas">Costas</option>
                <option value="ombros">Ombros</option>
                <option value="core">Core / Abdômen</option>
                <option value="cardio">Cardio</option>
              </select>
              <select
                value={novoEx.equipamento_necessario}
                onChange={(e) =>
                  setNovoEx({
                    ...novoEx,
                    equipamento_necessario: e.target.value,
                  })
                }
                className="p-2.5 border border-slate-300 rounded-xl text-xs bg-white">
              <select
                value={novoEx.equipamento_necessario}
                onChange={(e) =>
                  setNovoEx({
                    ...novoEx,
                    equipamento_necessario: e.target.value,
                  })
                }
                className="p-2.5 border border-slate-300 rounded-xl text-xs bg-white"
              >
                <option value="peso_corporal">Peso Corporal</option>
                <option value="halteres">Halteres</option>
                <option value="academia">Academia</option>
              </select>
            </div>
            <input
              type="text"
              value={novoEx.video_url}
              onChange={(e) =>
                setNovoEx({ ...novoEx, video_url: e.target.value })
              }
              placeholder="URL da imagem ou vídeo (opcional)"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
            />
            <button
              type="submit"
              disabled={salvando}
              className="w-full py-2.5 bg-emerald-600 text-white font-semibold rounded-xl text-xs"
            >
              Cadastrar Exercício
            </button>
          </form>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
            <h2 className="font-semibold text-sm text-slate-800">
              Exercícios Cadastrados ({exercicios.length})
            </h2>
            <div className="divide-y divide-slate-100">
              {exercicios.map((ex) => (
                <div
                  key={ex.id}
                  className="py-2.5 flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {ex.nome}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {ex.grupo_muscular} •{' '}
                      {ex.video_url ? 'Com mídia' : 'Sem imagem'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditandoEx(ex)}
                    className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg"
                  >
                    Editar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {aba === 'alimentos' && (
        <form
          onSubmit={criarNovoAlimento}
          className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3"
        >
          <h2 className="font-semibold text-sm text-slate-800">
            + Cadastrar Novo Alimento
          </h2>
          <input
            type="text"
            required
            value={novoAlimento.nome}
            onChange={(e) =>
              setNovoAlimento({ ...novoAlimento, nome: e.target.value })
            }
            placeholder="Nome do alimento (ex: Queijo Minas Frescal)"
            className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
          />
          <select
            value={novoAlimento.grupo_alimentar}
            onChange={(e) =>
              setNovoAlimento({
                ...novoAlimento,
                grupo_alimentar: e.target.value,
              })
            }
            className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white"
          >
            <option value="proteina">Proteína</option>
            <option value="carboidrato">Carboidrato</option>
            <option value="gordura">Gordura / Oleaginosa</option>
            <option value="vegetal">Vegetal / Hortaliça</option>
            <option value="fruta">Fruta</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="0.1"
              required
              value={novoAlimento.calorias_100g}
              onChange={(e) =>
                setNovoAlimento({
                  ...novoAlimento,
                  calorias_100g: e.target.value,
                })
              }
              placeholder="Calorias (100g)"
              className="p-2.5 border border-slate-300 rounded-xl text-xs"
            />
            <input
              type="number"
              step="0.1"
              required
              value={novoAlimento.proteinas_100g}
              onChange={(e) =>
                setNovoAlimento({
                  ...novoAlimento,
                  proteinas_100g: e.target.value,
                })
              }
              placeholder="Proteínas g (100g)"
              className="p-2.5 border border-slate-300 rounded-xl text-xs"
            />
            <input
              type="number"
              step="0.1"
              required
              value={novoAlimento.carboidratos_100g}
              onChange={(e) =>
                setNovoAlimento({
                  ...novoAlimento,
                  carboidratos_100g: e.target.value,
                })
              }
              placeholder="Carboidratos g (100g)"
              className="p-2.5 border border-slate-300 rounded-xl text-xs"
            />
            <input
              type="number"
              step="0.1"
              required
              value={novoAlimento.gorduras_100g}
              onChange={(e) =>
                setNovoAlimento({
                  ...novoAlimento,
                  gorduras_100g: e.target.value,
                })
              }
              placeholder="Gorduras g (100g)"
              className="p-2.5 border border-slate-300 rounded-xl text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={salvando}
            className="w-full py-2.5 bg-emerald-600 text-white font-semibold rounded-xl text-xs"
          >
            Salvar Alimento
          </button>
        </form>
      )}

      {aba === 'anuncios' && (
        <div className="space-y-4">
          <form
            onSubmit={criarNovoAnuncio}
            className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3"
          >
            <h2 className="font-semibold text-sm text-slate-800">
              + Cadastrar Anunciante / Parceiro
            </h2>
            <input
              type="text"
              required
              value={novoAnuncio.titulo}
              onChange={(e) =>
                setNovoAnuncio({ ...novoAnuncio, titulo: e.target.value })
              }
              placeholder="Título (ex: Hortifrúti Serra Verde • 10% OFF)"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
            />
            <textarea
              rows={2}
              required
              value={novoAnuncio.descricao}
              onChange={(e) =>
                setNovoAnuncio({ ...novoAnuncio, descricao: e.target.value })
              }
              placeholder="Descrição curta da oferta ou cupom"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={novoAnuncio.texto_botao}
                onChange={(e) =>
                  setNovoAnuncio({
                    ...novoAnuncio,
                    texto_botao: e.target.value,
                  })
                }
                placeholder="Texto do botão"
                className="p-2.5 border border-slate-300 rounded-xl text-xs"
              />
              <select
                value={novoAnuncio.local_exibicao}
                onChange={(e) =>
                  setNovoAnuncio({
                    ...novoAnuncio,
                    local_exibicao: e.target.value,
                  })
                }
                className="p-2.5 border border-slate-300 rounded-xl text-xs bg-white"
              >
                <option value="lista_compras">Lista de Compras</option>
                <option value="dashboard">Tela Hoje</option>
                <option value="alimentacao">Tela Alimentação</option>
                <option value="treinos">Tela Treinos</option>
              </select>
            </div>
            <input
              type="url"
              required
              value={novoAnuncio.link_destino}
              onChange={(e) =>
                setNovoAnuncio({
                  ...novoAnuncio,
                  link_destino: e.target.value,
                })
              }
              placeholder="Link de destino (WhatsApp wa.me ou site)"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
            />
            <input
              type="text"
              value={novoAnuncio.imagem_url}
              onChange={(e) =>
                setNovoAnuncio({ ...novoAnuncio, imagem_url: e.target.value })
              }
              placeholder="URL da logo/imagem do parceiro (opcional)"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
            />
            <button
              type="submit"
              disabled={salvando}
              className="w-full py-2.5 bg-emerald-600 text-white font-semibold rounded-xl text-xs"
            >
              {salvando ? 'Publicando...' : 'Publicar Anúncio'}
            </button>
          </form>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <h2 className="font-semibold text-sm text-slate-800">
              Campanhas Cadastradas ({anuncios.length})
            </h2>
            {anuncios.length === 0 ? (
              <p className="text-xs text-slate-500">
                Nenhum anúncio cadastrado ainda.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {anuncios.map((ad) => (
<span
className={inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-md mr-2 ${ ad.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500' }}
>
{ad.ativo ? 'Ativo' : 'Pausado'}


{ad.local_exibicao}


{ad.titulo}




{ad.cliques || 0}

cliques

<button
type="button"
onClick={() => alternarStatusAnuncio(ad.id, ad.ativo)}
className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
>
{ad.ativo ? 'Pausar' : 'Ativar'}

<button
type="button"
onClick={() => excluirAnuncio(ad.id)}
className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
>
Excluir



))}

)}


)}

);
}
