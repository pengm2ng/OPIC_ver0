const cards=window.OPIC_CARDS;
const state=JSON.parse(localStorage.getItem("opic-state")||'{"results":{},"favorites":[],"dark":false}');
let quiz=[],qIndex=0,revealed=false;
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
function save(){localStorage.setItem("opic-state",JSON.stringify(state))}
function result(id){return state.results[id]||{correct:0,wrong:0}}
function markText(card){return card.korean.replace(card.target,`<span class="target">${card.target}</span>`)}
function stats(){
 let c=0,w=0;Object.values(state.results).forEach(x=>{c+=x.correct||0;w+=x.wrong||0});
 $("#statTotal").textContent=cards.length;$("#statWrong").textContent=cards.filter(x=>result(x.id).wrong>0).length;
 $("#statCorrect").textContent=(c+w?Math.round(c/(c+w)*100):0)+"%";$("#settingsTotal").textContent=cards.length+"개";
}
function showView(id,title){
 $$(".view").forEach(v=>v.classList.toggle("active",v.id===id));
 $$(".bottom-nav button[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===id));
 $("#pageTitle").textContent=title||({homeView:"오늘의 학습",listView:"전체 카드",wrongView:"오답노트",settingsView:"설정"}[id]||"문맥 시험");
 if(id==="listView") renderList(); if(id==="wrongView") renderWrong(); window.scrollTo(0,0)
}
function categories(){
 const map=new Map(cards.map(c=>[c.category,c.categoryName]));
 $("#categoryChips").innerHTML=[...map].map(([k,v])=>`<button class="chip" data-cat="${k}">${v}</button>`).join("");
 $("#categoryFilter").innerHTML='<option value="all">전체 카테고리</option>'+[...map].map(([k,v])=>`<option value="${k}">${v}</option>`).join("");
 $$(".chip").forEach(b=>b.onclick=()=>startQuiz(cards.filter(c=>c.category===b.dataset.cat),20));
}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function startQuiz(pool,count=20){
 if(!pool.length){alert("해당 카드가 아직 없어요.");return}
 quiz=shuffle(pool).slice(0,Math.min(count,pool.length));qIndex=0;showView("quizView","문맥 시험");renderQuiz()
}
function renderQuiz(){
 const c=quiz[qIndex];if(!c)return;revealed=false;
 $("#quizCategory").textContent=c.categoryName;$("#quizCount").textContent=`${qIndex+1}/${quiz.length}`;
 $("#progressBar").style.width=`${(qIndex+1)/quiz.length*100}%`;
 $("#koreanSentence").innerHTML=markText(c);$("#answerWord").textContent=c.answer;
 $("#englishSentence").textContent=c.english;$("#answerNote").textContent=c.note;
 $("#answerArea").classList.add("hidden");$("#gradeRow").classList.add("hidden");$("#revealBtn").classList.remove("hidden");
 $("#favoriteBtn").classList.toggle("on",state.favorites.includes(c.id));$("#favoriteBtn").textContent=state.favorites.includes(c.id)?"★":"☆";
}
function reveal(){revealed=true;$("#answerArea").classList.remove("hidden");$("#gradeRow").classList.remove("hidden");$("#revealBtn").classList.add("hidden")}
function grade(ok){
 const c=quiz[qIndex];state.results[c.id]=result(c.id);state.results[c.id][ok?"correct":"wrong"]++;
 save();stats(); if(qIndex<quiz.length-1){qIndex++;renderQuiz()}else{alert("시험이 끝났어요!");showView("homeView")}
}
function listHTML(arr){return arr.map(c=>{const r=result(c.id);return `<article class="list-card">
 <div class="top"><small>${c.categoryName}</small><div>${state.favorites.includes(c.id)?"★ ":""}${r.wrong?`<span class="badge-wrong">오답 ${r.wrong}</span>`:""}</div></div>
 <p>${markText(c)}</p><b>${c.answer}</b><div class="eng">${c.english}</div></article>`}).join("")}
function renderList(){
 const q=$("#searchInput").value.trim().toLowerCase(),cat=$("#categoryFilter").value,st=$("#statusFilter").value;
 const arr=cards.filter(c=>(cat==="all"||c.category===cat)&&(!q||[c.korean,c.target,c.answer,c.english].join(" ").toLowerCase().includes(q))&&
 (st==="all"||(st==="wrong"&&result(c.id).wrong>0)||(st==="favorite"&&state.favorites.includes(c.id))||(st==="unseen"&&!state.results[c.id])));
 $("#listCount").textContent=`${arr.length}개 표현`;$("#cardList").innerHTML=listHTML(arr)
}
function renderWrong(){
 const arr=cards.filter(c=>result(c.id).wrong>0).sort((a,b)=>result(b.id).wrong-result(a.id).wrong);
 $("#wrongEmpty").classList.toggle("hidden",arr.length>0);$("#wrongContent").classList.toggle("hidden",!arr.length);
 $("#wrongTotal").textContent=arr.length+"개";$("#wrongList").innerHTML=listHTML(arr)
}
$$(".bottom-nav button[data-view]").forEach(b=>b.onclick=()=>showView(b.dataset.view));
$("#navQuiz").onclick=()=>startQuiz(cards,20);$("#startDaily").onclick=()=>startQuiz(cards,20);
$$(".quick").forEach(b=>b.onclick=()=>{let p=cards;if(b.dataset.mode==="wrong")p=cards.filter(c=>result(c.id).wrong>0);
 if(b.dataset.mode==="favorite")p=cards.filter(c=>state.favorites.includes(c.id));
 if(b.dataset.mode==="hard")p=[...cards].sort((a,b)=>result(b.id).wrong-result(a.id).wrong).filter(c=>result(c.id).wrong>0);
 startQuiz(p,20)});
$("#seeAllCategories").onclick=()=>showView("listView");
$("#quizBack").onclick=()=>showView("homeView");$("#revealBtn").onclick=reveal;$("#flashcard").onclick=e=>{if(!revealed&&e.target.id!=="favoriteBtn")reveal()};
$("#correctBtn").onclick=()=>grade(true);$("#wrongBtn").onclick=()=>grade(false);
$("#prevBtn").onclick=()=>{if(qIndex>0){qIndex--;renderQuiz()}};$("#nextBtn").onclick=()=>{if(qIndex<quiz.length-1){qIndex++;renderQuiz()}};
$("#favoriteBtn").onclick=e=>{e.stopPropagation();const id=quiz[qIndex].id;state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];save();renderQuiz()};
$("#searchInput").oninput=renderList;$("#categoryFilter").onchange=renderList;$("#statusFilter").onchange=renderList;
$("#startWrong").onclick=()=>startQuiz(cards.filter(c=>result(c.id).wrong>0),50);
$("#themeBtn").onclick=()=>{state.dark=!state.dark;document.body.classList.toggle("dark",state.dark);save()};
$("#exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="opic-context-backup.json";a.click()};
$("#importInput").onchange=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{Object.assign(state,JSON.parse(rd.result));save();location.reload()}catch{alert("올바른 백업 파일이 아니에요.")}};rd.readAsText(f)};
$("#resetBtn").onclick=()=>{if(confirm("학습 기록과 오답, 즐겨찾기를 모두 초기화할까요?")){localStorage.removeItem("opic-state");location.reload()}};
if(state.dark)document.body.classList.add("dark");categories();stats();
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");