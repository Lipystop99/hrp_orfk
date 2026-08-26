
let docket = [];

function toggleNav(){
  const n = document.getElementById("mainNav");
  if(n) n.classList.toggle("open");
}
function fmtFt(v){ return Number(v||0).toLocaleString("hu-HU") + " Ft"; }
function fmtJail(min,max){
  min=Number(min||0); max=Number(max||0);
  if(!min && !max) return "—";
  if(min===max) return min+" perc";
  return min+"–"+max+" perc";
}
function fmtFine(min,max){
  min=Number(min||0); max=Number(max||0);
  if(!min && !max) return "—";
  if(min===max) return fmtFt(min);
  return fmtFt(min)+" – "+fmtFt(max);
}

function initLaw(){
  if(typeof HRP_OFFENCES==="undefined") return;
  const list=document.getElementById("lawList");
  if(!list) return;

  const select=document.getElementById("lawCategory");
  [...new Set(HRP_OFFENCES.map(x=>x.category))].forEach(cat=>{
    const o=document.createElement("option"); o.value=cat; o.textContent=cat; select.appendChild(o);
  });
  document.getElementById("lawSearch").addEventListener("input",renderLaw);
  select.addEventListener("change",renderLaw);
  renderLaw();
  renderDocket();
}
function renderLaw(){
  const list=document.getElementById("lawList");
  const q=(document.getElementById("lawSearch").value||"").trim().toLowerCase();
  const cat=document.getElementById("lawCategory").value;
  const filtered=HRP_OFFENCES.filter(x=>{
    const hay=[x.code,x.title,x.abbr,x.description,x.category].join(" ").toLowerCase();
    return (cat==="ALL"||x.category===cat) && (!q||hay.includes(q));
  });
  document.getElementById("visibleCount").textContent=filtered.length;
  list.innerHTML="";
  if(!filtered.length){ list.innerHTML='<div class="empty">Nincs a feltételeknek megfelelő tétel.</div>'; return; }

  let lastCat="";
  filtered.forEach((x,idx)=>{
    if(x.category!==lastCat){
      lastCat=x.category;
      const h=document.createElement("div"); h.className="law-category"; h.textContent=lastCat; list.appendChild(h);
    }
    const card=document.createElement("article");
    card.className="law-card";
    const hasPenalty=x.fineMax||x.jailMax;
    card.innerHTML=`
      <div class="law-code">${x.code}${x.abbr ? `<small>${x.abbr}</small>`:""}</div>
      <div class="law-copy">
        <h3>${escapeHtml(x.title)}</h3>
        ${x.description ? `<p>${escapeHtml(x.description)}</p>`:""}
        <div class="law-meta">
          <span>💰 ${fmtFine(x.fineMin,x.fineMax)}</span>
          <span>🔒 ${fmtJail(x.jailMin,x.jailMax)}</span>
        </div>
      </div>
      <button class="add-btn" ${hasPenalty?"":"disabled"} title="Hozzáadás">+</button>`;
    if(hasPenalty) card.querySelector(".add-btn").onclick=()=>addDocket(x);
    list.appendChild(card);
  });
}
function escapeHtml(s){
  return String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
}
function addDocket(item){
  docket.push({...item,_id:Date.now()+Math.random()});
  renderDocket();
}
function removeDocket(id){ docket=docket.filter(x=>x._id!==id); renderDocket(); }
function clearDocket(){ docket=[]; renderDocket(); }
function renderDocket(){
  const el=document.getElementById("docketList"); if(!el) return;
  if(!docket.length) el.innerHTML='<div class="empty">Nincs kiválasztott tétel.</div>';
  else el.innerHTML=docket.map(x=>`
    <div class="docket-row">
      <div><b>${escapeHtml(x.code)} ${escapeHtml(x.title)}</b><small>${fmtFine(x.fineMin,x.fineMax)} • ${fmtJail(x.jailMin,x.jailMax)}</small></div>
      <button onclick="removeDocket(${x._id})">×</button>
    </div>`).join("");

  const sums=docket.reduce((a,x)=>({
    fmin:a.fmin+(x.fineMin||0), fmax:a.fmax+(x.fineMax||0),
    jmin:a.jmin+(x.jailMin||0), jmax:a.jmax+(x.jailMax||0)
  }),{fmin:0,fmax:0,jmin:0,jmax:0});
  [["fineMinTotal",fmtFt(sums.fmin)],["fineMaxTotal",fmtFt(sums.fmax)],
   ["jailMinTotal",sums.jmin+" perc"],["jailMaxTotal",sums.jmax+" perc"]].forEach(([id,v])=>{
      const n=document.getElementById(id); if(n)n.textContent=v;
   });
}
async function copyDocket(){
  if(!docket.length) return alert("Nincs kiválasztott vádpont.");
  const sums=docket.reduce((a,x)=>({
    fmin:a.fmin+(x.fineMin||0), fmax:a.fmax+(x.fineMax||0),
    jmin:a.jmin+(x.jailMin||0), jmax:a.jmax+(x.jailMax||0)
  }),{fmin:0,fmax:0,jmin:0,jmax:0});
  let out="=== HomeRP ORFK / MDC VÁDJEGYZÉK ===\n";
  docket.forEach(x=>out+=`${x.code} ${x.title} | ${fmtFine(x.fineMin,x.fineMax)} | ${fmtJail(x.jailMin,x.jailMax)}\n`);
  out+=`----------------------------------\nBírság: ${fmtFt(sums.fmin)} – ${fmtFt(sums.fmax)}\nFogda: ${sums.jmin}–${sums.jmax} perc`;
  try{ await navigator.clipboard.writeText(out); alert("MDC adatlap a vágólapra másolva."); }
  catch(e){ prompt("Másold ki az adatlapot:",out); }
}
function demoLogin(e){
  e.preventDefault();
  const box=document.getElementById("loginNotice");
  box.classList.remove("hidden");
  box.textContent="Demo mód: a frontend működik, de valódi azonosításhoz PHP/Node + adatbázis szükséges.";
}
document.addEventListener("DOMContentLoaded",()=>{
  initLaw();
  const c=document.getElementById("offenceCount");
  if(c && typeof HRP_OFFENCES!=="undefined") c.textContent=HRP_OFFENCES.length;
});
