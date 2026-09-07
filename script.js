function normalizza(s){ return (s||"").toString().toLowerCase(); }

function chiave(r, k){
  if(k==="categoria") return [r.categoria_rank, r.genere_rank, normalizza(r.atleta)];
  if(k==="genere") return [r.genere_rank, r.categoria_rank, normalizza(r.atleta)];
  return normalizza(r[k]);
}
function confronta(a, b){
  if(Array.isArray(a)){
    for(let i=0;i<a.length;i++){ if(a[i]<b[i]) return -1; if(a[i]>b[i]) return 1; }
    return 0;
  }
  return a<b ? -1 : a>b ? 1 : 0;
}

/* Tabella "semplice": una riga per persona, ordinabile cliccando le intestazioni.
   Usata dalla pagina 1x e dalla pagina delle categorie giovanili. */
function inizializzaTabellaSemplice(dati, opt){
  dati = dati || [];
  const corpo = document.querySelector(opt.tabellaId + " tbody");
  const conteggio = document.getElementById(opt.conteggioId);
  const filtro = document.getElementById(opt.filtroId);
  const vuoto = document.querySelector(opt.tabellaId).nextElementSibling;
  let ordineChiave = "categoria", ordineAsc = true;

  function disegna(){
    const q = normalizza(filtro.value);
    let righe = dati.filter(r => normalizza(r.atleta+" "+r.societa+" "+r.categoria+" "+r.genere).includes(q));
    righe.sort((a,b)=>confronta(chiave(a,ordineChiave), chiave(b,ordineChiave)));
    if(!ordineAsc) righe.reverse();
    corpo.innerHTML = righe.map(r =>
      `<tr><td>${r.atleta}</td><td>${r.categoria}</td><td>${r.genere||""}</td><td>${r.bandiera||""}</td><td>${r.societa}</td></tr>`
    ).join("");
    conteggio.textContent = dati.length===0 ? (opt.messaggioSeVuoto || "nessun iscritto per ora") :
      righe.length + " iscritti" + (righe.length!==dati.length ? " (su "+dati.length+")" : "");
    vuoto.textContent = dati.length===0 ? (opt.messaggioSeVuoto || "Nessun iscritto per ora.") : "Nessun risultato per questa ricerca.";
    vuoto.style.display = righe.length ? "none" : "block";
  }
  filtro.addEventListener("input", disegna);
  document.querySelectorAll(opt.tabellaId + ' thead th').forEach(th=>{
    th.addEventListener("click", ()=>{
      const c = th.dataset.key;
      if(!c) return;
      ordineAsc = (c===ordineChiave) ? !ordineAsc : true;
      ordineChiave = c;
      disegna();
    });
  });
  disegna();
}

/* Tabella raggruppata per equipaggio (8+): il filtro tiene l'equipaggio intero
   se un membro qualsiasi combacia con la ricerca. */
function inizializzaTabellaEquipaggi(dati, opt){
  dati = dati || [];
  const corpo = document.querySelector(opt.tabellaId + " tbody");
  const conteggio = document.getElementById(opt.conteggioId);
  const filtro = document.getElementById(opt.filtroId);
  const vuoto = document.querySelector(opt.tabellaId).nextElementSibling;

  function disegna(){
    const q = normalizza(filtro.value);
    const equipaggi = {};
    dati.forEach(r=>{ (equipaggi[r.equipaggio] ||= []).push(r); });
    const nomi = Object.keys(equipaggi).sort((a,b)=>{
      const ra = equipaggi[a][0], rb = equipaggi[b][0];
      const ka = [ra.categoria_rank, ra.genere_rank, a.toLowerCase()];
      const kb = [rb.categoria_rank, rb.genere_rank, b.toLowerCase()];
      for(let i=0;i<ka.length;i++){ if(ka[i]<kb[i]) return -1; if(ka[i]>kb[i]) return 1; }
      return 0;
    });
    let html = "";
    let nCrew = 0, nAtleti = 0;
    nomi.forEach(nome=>{
      const membri = equipaggi[nome];
      const combacia = q==="" || normalizza(nome+" "+membri.map(m=>m.atleta+" "+m.societa).join(" ")).includes(q);
      if(!combacia) return;
      nCrew++;
      html += `<tr class="equipaggio-riga"><td colspan="5">${nome} <span style="font-weight:400;color:var(--testo-tenue)">— ${membri[0].categoria} · ${membri[0].genere_equipaggio||"?"}</span></td></tr>`;
      membri.forEach(m=>{
        nAtleti++;
        html += `<tr><td></td><td class="posto">${m.posto}</td><td>${m.atleta}</td><td>${m.bandiera||""}</td><td>${m.societa}</td></tr>`;
      });
    });
    corpo.innerHTML = html;
    conteggio.textContent = nCrew + " equipaggi, " + nAtleti + " posti barca";
    vuoto.style.display = nAtleti ? "none" : "block";
  }
  filtro.addEventListener("input", disegna);
  disegna();
}
