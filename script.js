function normalizza(s){ return (s||"").toString().toLowerCase(); }

function chiave(r, k){
  if(k==="categoria") return [r.categoria_rank, r.genere_rank, normalizza(r.atleta)];
  if(k==="genere") return [r.genere_rank, r.categoria_rank, normalizza(r.atleta)];
  if(k==="pettorale") return [r.pettorale ?? 9999, normalizza(r.atleta)];
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
      html += `<tr class="equipaggio-riga"><td colspan="5">${nome} <span style="font-weight:400;color:var(--testo-tenue)">— ${membri[0].categoria} · ${membri[0].genere_equipaggio||"?"}${membri[0].barca ? " · "+membri[0].barca : ""}</span></td></tr>`;
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

/* Classifica "semplice" (1x, categorie giovanili): una riga per atleta, con
   posizione assoluta e di categoria, ordinabile su qualunque colonna. */
function inizializzaClassificaSemplice(dati, opt){
  dati = dati || [];
  const corpo = document.querySelector(opt.tabellaId + " tbody");
  const conteggio = document.getElementById(opt.conteggioId);
  const filtro = document.getElementById(opt.filtroId);
  const vuoto = document.querySelector(opt.tabellaId).nextElementSibling;
  let ordineChiave = "pos_assoluta", ordineAsc = true;

  function chiaveClassifica(r, k){
    if(k==="pos_assoluta") return [r.pos_assoluta ?? 9999, normalizza(r.atleta)];
    if(k==="pos_categoria") return [r.categoria_rank, r.pos_categoria ?? 9999, normalizza(r.atleta)];
    return chiave(r, k);
  }

  function disegna(){
    const q = normalizza(filtro.value);
    let righe = dati.filter(r => normalizza(r.atleta+" "+r.societa+" "+r.categoria+" "+r.genere).includes(q));
    righe.sort((a,b)=>confronta(chiaveClassifica(a,ordineChiave), chiaveClassifica(b,ordineChiave)));
    if(!ordineAsc) righe.reverse();
    corpo.innerHTML = righe.map(r =>
      `<tr><td>${r.pettorale ?? ""}</td><td>${r.pos_assoluta ?? ""}</td><td>${r.pos_categoria ?? ""}</td><td>${r.atleta}</td><td>${r.categoria}</td><td>${r.genere||""}</td><td>${r.bandiera||""}</td><td>${r.societa}</td><td>${r.tempo||""}</td></tr>`
    ).join("");
    conteggio.textContent = dati.length===0 ? (opt.messaggioSeVuoto || "risultati non ancora disponibili") :
      righe.length + " atleti" + (righe.length!==dati.length ? " (su "+dati.length+")" : "");
    vuoto.textContent = dati.length===0 ? (opt.messaggioSeVuoto || "Risultati non ancora disponibili.") : "Nessun risultato per questa ricerca.";
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

/* Classifica per equipaggi (8+): come inizializzaTabellaEquipaggi, ma con
   posizione assoluta/di categoria e tempo mostrati sull'intestazione di ogni
   equipaggio, e la lista ordinata per piazzamento invece che per categoria. */
function inizializzaClassificaEquipaggi(dati, opt){
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
      const pa = ra.pos_assoluta ?? 9999, pb = rb.pos_assoluta ?? 9999;
      return pa - pb || a.localeCompare(b,"it");
    });
    let html = "";
    let nCrew = 0, nAtleti = 0;
    nomi.forEach(nome=>{
      const membri = equipaggi[nome];
      const combacia = q==="" || normalizza(nome+" "+membri.map(m=>m.atleta+" "+m.societa).join(" ")).includes(q);
      if(!combacia) return;
      nCrew++;
      const r0 = membri[0];
      html += `<tr class="equipaggio-riga"><td colspan="5">${r0.pos_assoluta ?? "–"}° ass. / ${r0.pos_categoria ?? "–"}° cat. — ${r0.pettorale ? "pett. "+r0.pettorale+" — " : ""}${nome} <span style="font-weight:400;color:var(--testo-tenue)">— ${r0.categoria} · ${r0.genere_equipaggio||"?"} · ${r0.tempo||""}</span></td></tr>`;
      membri.forEach(m=>{
        nAtleti++;
        html += `<tr><td></td><td class="posto">${m.posto}</td><td>${m.atleta}</td><td>${m.bandiera||""}</td><td>${m.societa}</td></tr>`;
      });
    });
    corpo.innerHTML = html;
    conteggio.textContent = nCrew===0 ? (opt.messaggioSeVuoto || "risultati non ancora disponibili") : nCrew + " equipaggi, " + nAtleti + " posti barca";
    vuoto.textContent = opt.messaggioSeVuoto || "Risultati non ancora disponibili.";
    vuoto.style.display = nAtleti ? "none" : "block";
  }
  filtro.addEventListener("input", disegna);
  disegna();
}


/* Start list "semplice" (1x, categorie giovanili): come la tabella iscritti,
   con la colonna pettorale in più e ordinata per pettorale di default. */
function inizializzaStartListSemplice(dati, opt){
  dati = dati || [];
  const corpo = document.querySelector(opt.tabellaId + " tbody");
  const conteggio = document.getElementById(opt.conteggioId);
  const filtro = document.getElementById(opt.filtroId);
  const vuoto = document.querySelector(opt.tabellaId).nextElementSibling;
  let ordineChiave = "pettorale", ordineAsc = true;

  function disegna(){
    const q = normalizza(filtro.value);
    let righe = dati.filter(r => normalizza(r.atleta+" "+r.societa+" "+r.categoria+" "+r.genere).includes(q));
    righe.sort((a,b)=>confronta(chiave(a,ordineChiave), chiave(b,ordineChiave)));
    if(!ordineAsc) righe.reverse();
    corpo.innerHTML = righe.map(r =>
      `<tr><td>${r.pettorale ?? ""}</td><td>${r.atleta}</td><td>${r.categoria}</td><td>${r.genere||""}</td><td>${r.bandiera||""}</td><td>${r.societa}</td></tr>`
    ).join("");
    conteggio.textContent = dati.length===0 ? (opt.messaggioSeVuoto || "start list non ancora disponibile") :
      righe.length + " iscritti" + (righe.length!==dati.length ? " (su "+dati.length+")" : "");
    vuoto.textContent = dati.length===0 ? (opt.messaggioSeVuoto || "Start list non ancora disponibile.") : "Nessun risultato per questa ricerca.";
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

/* Start list per equipaggi (8+): come la tabella iscritti raggruppata, ma
   ordinata per pettorale e con il pettorale mostrato sull'intestazione. */
function inizializzaStartListEquipaggi(dati, opt){
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
      const pa = ra.pettorale ?? 9999, pb = rb.pettorale ?? 9999;
      return pa - pb || a.localeCompare(b,"it");
    });
    let html = "";
    let nCrew = 0, nAtleti = 0;
    nomi.forEach(nome=>{
      const membri = equipaggi[nome];
      const combacia = q==="" || normalizza(nome+" "+membri.map(m=>m.atleta+" "+m.societa).join(" ")).includes(q);
      if(!combacia) return;
      nCrew++;
      const r0 = membri[0];
      html += `<tr class="equipaggio-riga"><td colspan="5">${r0.pettorale ? "Pett. "+r0.pettorale+" — " : ""}${nome} <span style="font-weight:400;color:var(--testo-tenue)">— ${r0.categoria} · ${r0.genere_equipaggio||"?"}</span></td></tr>`;
      membri.forEach(m=>{
        nAtleti++;
        html += `<tr><td></td><td class="posto">${m.posto}</td><td>${m.atleta}</td><td>${m.bandiera||""}</td><td>${m.societa}</td></tr>`;
      });
    });
    corpo.innerHTML = html;
    conteggio.textContent = nCrew===0 ? (opt.messaggioSeVuoto || "start list non ancora disponibile") : nCrew + " equipaggi, " + nAtleti + " posti barca";
    vuoto.textContent = opt.messaggioSeVuoto || "Start list non ancora disponibile.";
    vuoto.style.display = nAtleti ? "none" : "block";
  }
  filtro.addEventListener("input", disegna);
  disegna();
}
