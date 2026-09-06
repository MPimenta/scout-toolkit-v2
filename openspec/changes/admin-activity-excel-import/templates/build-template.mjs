import XLSX from 'xlsx';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), 'atividades-import.xlsx');

const headers = [
  'nome',
  'descricao',
  'materiais',
  'duracao_minutos',
  'tamanho_grupo',
  'esforco',
  'local',
  'faixa_etaria',
  'tipo',
  'objetivos',
  'ods',
  'imagem_url',
  'publicada',
];

const example = [
  'Jogo da bandeira (exemplo)',
  'Dois grupos tentam capturar a bandeira do outro sem serem apanhados.',
  'Duas bandeiras ou lenços, cones para marcar o campo',
  30,
  'Médio (7-15)',
  'Baixo',
  'Exterior',
  'Escoteiros (10-14)',
  'Jogo',
  'SOCIAL_TEAM; LEADERSHIP_DECISION',
  '4; 17',
  '',
  'sim',
];

const valores = [
  ['campo', 'valor_aceite', 'chave_ou_codigo', 'notas'],
  ['tamanho_grupo', 'Pequeno (2-6)', 'small', 'Usa a etiqueta ou a chave'],
  ['tamanho_grupo', 'Médio (7-15)', 'medium', ''],
  ['tamanho_grupo', 'Grande (16+)', 'large', ''],
  ['esforco', 'Baixo', 'low', ''],
  ['esforco', 'Médio', 'medium', ''],
  ['esforco', 'Alto', 'high', ''],
  ['local', 'Interior', 'inside', ''],
  ['local', 'Exterior', 'outside', ''],
  ['faixa_etaria', 'Lobitos (6-10)', 'cub_scouts', 'Obrigatório no par de duplicado'],
  ['faixa_etaria', 'Escoteiros (10-14)', 'scouts', ''],
  ['faixa_etaria', 'Exploradores (14-17)', 'adventurers', ''],
  ['faixa_etaria', 'Caminheiros (17-21)', 'rovers', ''],
  ['faixa_etaria', 'Dirigentes (21+)', 'leaders', ''],
  ['tipo', 'Jogo', 'Jogo', 'Nome exacto do tipo existente'],
  ['tipo', 'Quebra-Gelo', 'Quebra-Gelo', ''],
  ['tipo', 'Desafio', 'Desafio', ''],
  ['tipo', 'Reflexão', 'Reflexão', ''],
  ['tipo', 'Criatividade', 'Criatividade', ''],
  ['tipo', 'Cooperação', 'Cooperação', ''],
  ['tipo', 'Liderança', 'Liderança', ''],
  ['tipo', 'Aventura', 'Aventura', ''],
  ['tipo', 'Serviço', 'Serviço', ''],
  ['tipo', 'Técnica', 'Técnica', ''],
  ['objetivos', 'Comunicação Eficaz', 'SOCIAL_COMM', 'Área Competências Sociais; separar com ;'],
  ['objetivos', 'Trabalho em Equipa', 'SOCIAL_TEAM', ''],
  ['objetivos', 'Empatia', 'SOCIAL_EMPATHY', ''],
  ['objetivos', 'Tomada de Decisão', 'LEADERSHIP_DECISION', 'Área Liderança'],
  ['objetivos', 'Responsabilidade', 'LEADERSHIP_RESPONSIBILITY', ''],
  ['objetivos', 'Motivação', 'LEADERSHIP_MOTIVATION', ''],
  ['objetivos', 'Pensamento Criativo', 'CREATIVITY_THINKING', 'Área Criatividade'],
  ['objetivos', 'Expressão Artística', 'CREATIVITY_ART', ''],
  ['objetivos', 'Resolução de Problemas', 'CREATIVITY_PROBLEM', ''],
  ['objetivos', 'Consciência Ambiental', 'CITIZENSHIP_ENVIRONMENT', 'Área Cidadania'],
  ['objetivos', 'Participação Cívica', 'CITIZENSHIP_PARTICIPATION', ''],
  ['objetivos', 'Direitos e Deveres', 'CITIZENSHIP_RIGHTS', ''],
  ['objetivos', 'Primeiros Socorros', 'TECHNICAL_FIRST_AID', 'Área Competências Técnicas'],
  ['objetivos', 'Nós e Amarrações', 'TECHNICAL_KNOTS', ''],
  ['objetivos', 'Orientação', 'TECHNICAL_ORIENTEERING', ''],
  ['ods', 'Erradicar a Pobreza', '1', 'Usa o número na coluna ods'],
  ['ods', 'Fome Zero', '2', ''],
  ['ods', 'Saúde de Qualidade', '3', ''],
  ['ods', 'Educação de Qualidade', '4', ''],
  ['ods', 'Igualdade de Género', '5', ''],
  ['ods', 'Água Potável e Saneamento', '6', ''],
  ['ods', 'Energias Renováveis e Acessíveis', '7', ''],
  ['ods', 'Trabalho Digno e Crescimento Económico', '8', ''],
  ['ods', 'Indústria, Inovação e Infraestruturas', '9', ''],
  ['ods', 'Reduzir as Desigualdades', '10', ''],
  ['ods', 'Cidades e Comunidades Sustentáveis', '11', ''],
  ['ods', 'Produção e Consumo Sustentáveis', '12', ''],
  ['ods', 'Ação Climática', '13', ''],
  ['ods', 'Proteger a Vida Marinha', '14', ''],
  ['ods', 'Proteger a Vida Terrestre', '15', ''],
  ['ods', 'Paz, Justiça e Instituições Eficazes', '16', ''],
  ['ods', 'Parcerias para a Implementação dos Objetivos', '17', ''],
  ['publicada', 'sim', 'true', 'Vazio = sim'],
  ['publicada', 'nao', 'false', ''],
  ['duracao_minutos', 'número inteiro ≥ 1', '', 'Ex.: 15, 30, 90'],
  ['imagem_url', 'https://…', '', 'Opcional; só HTTPS'],
];

const instrucoes = [
  ['Instruções'],
  [''],
  ['1. Preenche a folha Atividades. Não renomes os cabeçalhos.'],
  ['2. Uma linha = uma atividade para uma faixa etária.'],
  ['3. objetivos: códigos da folha Valores, separados por ponto e vírgula. Ex.: SOCIAL_TEAM; CREATIVITY_ART'],
  ['4. ods: números 1 a 17, separados por ponto e vírgula. Ex.: 4; 13'],
  ['5. tipo, tamanho_grupo, esforco, local e faixa_etaria: usa a etiqueta ou a chave da folha Valores.'],
  ['6. Um nome igual na mesma faixa etária é um repetido e será ignorado na importação.'],
  ['7. O mesmo nome noutra faixa etária é aceite.'],
  ['8. Apaga a linha de exemplo antes de importar, ou o nome de exemplo entra no catálogo.'],
  ['9. A importação (ainda por implementar) será em Administração → Atividades.'],
];

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(
  workbook,
  XLSX.utils.aoa_to_sheet([headers, example]),
  'Atividades'
);
XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(valores), 'Valores');
XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(instrucoes), 'Instruções');

mkdirSync(dirname(out), { recursive: true });
XLSX.writeFile(workbook, out);
console.log(out);
