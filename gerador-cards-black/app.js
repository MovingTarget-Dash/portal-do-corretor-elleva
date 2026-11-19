// Gerador de cards Black Elleva — Stories 1080x1920
const W = 1080, H = 1920;
const BG = '#0a0c10';
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const $ = id => document.getElementById(id);

// Nomes de exibição que diferem da tabela (acentos etc.)
const NOMES = { 17148: 'Paseo Cittá' };

// Tipos já liberados (validação por partes)
const TIPOS_ATIVOS = ['Apartamento', 'Casa', 'Condomínio', 'Terreno'];

const assets = {};
function loadImg(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Falha ao carregar ' + src)); i.src = src; });
}

// ---------- formatação ----------
function trimNum(n, dec) { return n.toFixed(dec).replace(/\.?0+$/, '').replace('.', ','); }
function fmtValor(v) {
  if (!v) return ''; // campo em branco na tabela = fica em branco no card
  if (v >= 1e6) return 'R$ ' + trimNum(v / 1e6, 3) + ' mi';
  return 'R$ ' + trimNum(v / 1e3, 2) + ' mil';
}
const ABREV = { Apartamento: 'AP', Casa: 'Casa', Condomínio: 'Cond', Terreno: 'Terreno' };
// <código>_<tipo abrev>_<nome como na tabela>_Black
function nomeArquivo(im) {
  const nome = (im.condominio || im.bairro || '').replace(/[\\/:*?"<>|]/g, '').trim();
  return `${im.codigo}_${ABREV[im.tipo] || im.tipo}_${nome}_Black`;
}
function nomeDe(im) { return NOMES[im.codigo] || im.condominio || im.bairro || ''; }
function areaDe(im) { return (im.area || '').replace(/\s/g, ''); }

// ---------- desenho ----------
function txt(s, x, y, font, color, ls = 0, align = 'left') {
  ctx.font = font; ctx.fillStyle = color; ctx.letterSpacing = ls + 'px'; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}
function width(s, font, ls = 0) { ctx.font = font; ctx.letterSpacing = ls + 'px'; return ctx.measureText(s).width; }

function drawCover(img, x, y, w, h) {
  const r = Math.max(w / img.width, h / img.height);
  const dw = img.width * r, dh = img.height * r;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function draw(im, foto) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);

  // foto + degradê
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 1100); ctx.clip();
  if (foto) drawCover(foto, 0, 0, W, 1100);
  ctx.restore();
  const g = ctx.createLinearGradient(0, 700, 0, 1100);
  g.addColorStop(0, 'rgba(10,12,16,0)'); g.addColorStop(1, 'rgba(10,12,16,1)');
  ctx.fillStyle = g; ctx.fillRect(0, 700, W, 400);

  // moldura fina
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(64.5, 63.5, 949, 987);

  // selo
  ctx.drawImage(assets.selo, 245 - 139, 1014 - 139, 278, 278);

  // linha de dados
  const dados = [im.codigo, areaDe(im), im.dorm ? im.dorm + ' dorm' : null].filter(Boolean).join(' | ');
  txt(dados, 1013, 1139, '300 34px Raleway', '#d9dbe0', 6.5, 'right');

  // tipo + nome
  const rotulo = im.tipo === 'Terreno' && im.condominio ? 'TERRENO | CONDOMÍNIO' : im.tipo.toUpperCase();
  txt(rotulo, 108, 1226, '300 32px Raleway', '#b7bac2', 9);
  let nome = nomeDe(im), size = 96;
  while (width(nome, `italic 500 ${size}px "Playfair Display"`) > 900 && size > 40) size -= 2;
  txt(nome, 108, 1325, `italic 500 ${size}px "Playfair Display"`, '#fff');

  // DE ... POR
  const vAnt = fmtValor(im.valorAnterior), fAnt = '700 58px Raleway';
  if (!vAnt) { // sem valor anterior na tabela: some a caixa "DE", fica só o "POR" (posição do modelo)
    txt('POR', 563, 1436, 'italic 500 46px "Playfair Display"', '#fff');
  } else {
    const boxR = Math.max(541, 215 + width(vAnt, fAnt) + 26);
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.5; ctx.strokeRect(108.5, 1370.5, boxR - 108, 96);
    txt('DE', 135, 1436, 'italic 500 46px "Playfair Display"', '#fff');
    txt(vAnt, 215, 1437, fAnt, '#fff');
    txt('POR', boxR + 22, 1436, 'italic 500 46px "Playfair Display"', '#fff');
  }

  // preço atual
  ctx.fillStyle = '#fff'; ctx.fillRect(374, 1486, 631, 133);
  txt(fmtValor(im.valor), 689, 1583, '700 86px Raleway', BG, 0, 'center');

  // rodapé
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(97, 1659, 886, 1.5);
  ctx.drawImage(assets.logo, 300, 1668);
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(541, 1688, 1.5, 52);
  txt('CURADORIA BLACK', 581, 1712, '700 24px Raleway', '#fff', 5);
  txt('2026 | Gravataí/RS', 581, 1735, '400 22px Raleway', '#d9dbe0', 4.5);
}

// ---------- app ----------
let atual = null, fotoImg = null, fotoUpload = null;
// Casa sem nome em "Condominio" = tipo Casa (nome do card = Bairro).
// Casa COM nome em "Condominio" = tipo Condomínio (nome do card = Condominio).
window.IMOVEIS.forEach(i => { i.condominio = i.condominio ? i.condominio.trim() : null; if (i.tipo === 'Casa' && i.condominio) i.tipo = 'Condomínio'; });
const lista = window.IMOVEIS.filter(i => TIPOS_ATIVOS.includes(i.tipo));

async function carregarFoto(cod) {
  if (fotoUpload) return fotoUpload;
  try { return await loadImg(`fotos/${cod}.jpg`); } catch { return null; }
}

async function render() {
  const im = lista.find(i => i.codigo == $('cod').value);
  atual = im;
  $('info').innerHTML = `<b>${nomeDe(im)}</b><br>Tipo: ${im.tipo} · ${areaDe(im)} · ${im.dorm} dorm<br>De ${fmtValor(im.valorAnterior) || '(em branco)'} por <b>${fmtValor(im.valor) || '(em branco)'}</b>`;
  fotoImg = await carregarFoto(im.codigo);
  $('msg').textContent = fotoImg ? '' : `Sem foto em fotos/${im.codigo}.jpg — envie uma foto abaixo.`;
  draw(im, fotoImg);
}

(async function init() {
  await Promise.all([
    document.fonts.load('300 34px Raleway'), document.fonts.load('400 22px Raleway'), document.fonts.load('700 24px Raleway'),
    document.fonts.load('italic 500 46px "Playfair Display"'),
  ]);
  assets.selo = await loadImg('assets/selo-black-elleva.png');
  assets.logo = await loadImg('assets/logo-elleva.png');
  $('cod').innerHTML = lista.map(i => `<option value="${i.codigo}">${i.codigo} — ${ABREV[i.tipo]} — ${nomeDe(i)}</option>`).join('');
  $('cod').addEventListener('change', () => { fotoUpload = null; $('foto').value = ''; render(); });
  $('foto').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    fotoUpload = await loadImg(URL.createObjectURL(f)); render();
  });
  $('dl').addEventListener('click', () => {
    cv.toBlob(b => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(b);
      a.download = nomeArquivo(atual) + '.png'; a.click();
    }, 'image/png');
  });
  render();
})();
