import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
const firebaseConfig = {"apiKey": "AIzaSyCLJz-EC_mfIlB_cDFnmYwM_aWPICF0kbs", "authDomain": "pescaria-9327b.firebaseapp.com", "projectId": "pescaria-9327b", "storageBucket": "pescaria-9327b.firebasestorage.app", "messagingSenderId": "862603556027", "appId": "1:862603556027:web:208e383a43c0592b8f659e", "measurementId": "G-ZCGFX028G1"};
const app = initializeApp(firebaseConfig);
try{getAnalytics(app)}catch(e){}
const auth=getAuth(app), db=getFirestore(app);
const googleProvider=new GoogleAuthProvider(); googleProvider.addScope("profile"); googleProvider.addScope("email");
let authReady=false, currentFirebaseUser=null;
function providerName(u){const p=u?.providerData?.[0]?.providerId||"";return p==="google.com"?"Google":p==="password"?"E-mail":"Login"}
function gameState(){return{currentPhase:window.currentPhase??(typeof currentPhase!=="undefined"?currentPhase:1),coins:window.coins??(typeof coins!=="undefined"?coins:0),score:window.score??(typeof score!=="undefined"?score:0),bestScore:Number(localStorage.getItem("pescaria_best_score")||"0")||0,updatedAtLocal:new Date().toISOString()}}
async function savePlayer(user){if(!user)return;const data={uid:user.uid,name:user.displayName||"Jogador",email:user.email||"",photoURL:user.photoURL||"",provider:providerName(user),isAnonymous:false,game:gameState(),updatedAt:serverTimestamp()};const ref=doc(db,"players",user.uid);const snap=await getDoc(ref);if(snap.exists())await updateDoc(ref,data);else await setDoc(ref,{...data,createdAt:serverTimestamp(),firstLoginAt:serverTimestamp(),inventory:{},purchases:{},ranking:{}});localStorage.setItem("pescaria_player",JSON.stringify({uid:data.uid,name:data.name,email:data.email,photoURL:data.photoURL,provider:data.provider}));window.currentPlayer=data}
function setAuthGate(ok){document.body.classList.toggle("player-authenticated",!!ok);const b=document.getElementById("startBtn")||document.querySelector(".start-btn");if(b)b.dataset.requiresLogin=ok?"0":"1"}
function updateUI(user){const row=document.getElementById("firebaseProfileRow"),buttons=document.getElementById("firebaseLoginButtons"),photo=document.getElementById("firebaseProfilePhoto"),name=document.getElementById("firebaseProfileName"),email=document.getElementById("firebaseProfileEmail");if(!row||!buttons)return;if(user){row.classList.add("logged");buttons.style.display="none";if(photo)photo.src=user.photoURL||"./assets/fish-normal.png";if(name)name.textContent=user.displayName||"Jogador";if(email)email.textContent=user.email||providerName(user)}else{row.classList.remove("logged");buttons.style.display="flex"}setAuthGate(!!user)}
async function loginGoogle(){try{const r=await signInWithPopup(auth,googleProvider);await savePlayer(r.user);updateUI(r.user)}catch(e){alert("Não foi possível fazer login com Google: "+(e.message||e))}}
async function createEmailAccount(){try{const name=(document.getElementById("emailLoginName")?.value||"").trim(),email=(document.getElementById("emailLoginEmail")?.value||"").trim(),password=document.getElementById("emailLoginPassword")?.value||"";if(!name)return alert("Digite o nome do jogador.");if(!email)return alert("Digite o e-mail.");if(password.length<6)return alert("A senha precisa ter no mínimo 6 caracteres.");const r=await createUserWithEmailAndPassword(auth,email,password);await updateProfile(r.user,{displayName:name});await savePlayer(r.user);updateUI(r.user)}catch(e){alert("Não foi possível criar a conta: "+(e.message||e))}}
async function loginEmail(){try{const email=(document.getElementById("emailLoginEmail")?.value||"").trim(),password=document.getElementById("emailLoginPassword")?.value||"";if(!email)return alert("Digite o e-mail.");if(!password)return alert("Digite a senha.");const r=await signInWithEmailAndPassword(auth,email,password);await savePlayer(r.user);updateUI(r.user)}catch(e){alert("Não foi possível entrar: "+(e.message||e))}}
function bindLoginButtons(){const g=document.getElementById("loginGoogleBtn"),c=document.getElementById("createEmailAccountBtn"),e=document.getElementById("loginEmailBtn"),s=document.getElementById("firebaseLogoutBtn");if(g&&!g.__b){g.__b=1;g.onclick=loginGoogle}if(c&&!c.__b){c.__b=1;c.onclick=createEmailAccount}if(e&&!e.__b){e.__b=1;e.onclick=loginEmail}if(s&&!s.__b){s.__b=1;s.onclick=async()=>{await signOut(auth);localStorage.removeItem("pescaria_player");window.currentPlayer=null;updateUI(null)}}const start=document.getElementById("startBtn")||document.querySelector(".start-btn");if(start&&!start.__authGateBound){start.__authGateBound=1;start.addEventListener("click",ev=>{if(!authReady||!currentFirebaseUser){ev.preventDefault();ev.stopImmediatePropagation();alert("Faça login com Google ou crie uma conta com e-mail e senha para jogar.");return false}},true)}}
document.addEventListener("DOMContentLoaded",bindLoginButtons);window.addEventListener("load",bindLoginButtons);
onAuthStateChanged(auth,async user=>{authReady=true;currentFirebaseUser=user;updateUI(user);if(user){try{await savePlayer(user)}catch(e){console.warn(e)}}});
window.savePescariaPlayerProgress=async()=>{if(auth.currentUser)await savePlayer(auth.currentUser)};
window.getPescariaFirebaseUser=()=>auth.currentUser;window.isPescariaPlayerLoggedIn=()=>!!auth.currentUser;

/* RANKING MUNDIAL FIRESTORE */
async function submitWorldRankingScore(finalScore, extra = {}) {
  const user = auth.currentUser;
  if (!user) return;
  const numericScore = Number(finalScore || 0);
  if (!Number.isFinite(numericScore) || numericScore <= 0) return;

  const scoreRef = doc(db, "scores", user.uid);
  const existing = await getDoc(scoreRef);
  const previousBest = existing.exists() ? Number(existing.data().score || 0) : 0;

  if (!existing.exists() || numericScore > previousBest) {
    await setDoc(scoreRef, {
      uid: user.uid,
      name: user.displayName || (window.currentPlayer && window.currentPlayer.name) || "Jogador",
      email: user.email || "",
      photoURL: user.photoURL || "",
      score: numericScore,
      phase: extra.phase || window.currentPhase || 1,
      coins: extra.coins || window.coins || 0,
      provider: providerName(user),
      updatedAt: serverTimestamp(),
      createdAt: existing.exists() ? existing.data().createdAt || serverTimestamp() : serverTimestamp()
    }, { merge: true });
  }

  if (typeof savePlayer === "function") await savePlayer(user);
}

async function loadWorldRanking(limitCount = 100) {
  const q = query(collection(db, "scores"), orderBy("score", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap, index) => {
    const data = docSnap.data() || {};
    return {
      position: index + 1,
      uid: data.uid || docSnap.id,
      name: data.name || "Jogador",
      photoURL: data.photoURL || "",
      score: Number(data.score || 0),
      phase: data.phase || 1
    };
  });
}

async function renderWorldRankingIntoGame() {
  try {
    const rows = await loadWorldRanking(100);
    const list = document.getElementById("rankingList") || document.querySelector(".ranking-list") || document.querySelector(".map-ranking-list");
    if (!list) return;

    list.querySelectorAll(".ranking-row, .world-ranking-row, .world-ranking-badge").forEach(el => el.remove());

    const badge = document.createElement("div");
    badge.className = "world-ranking-badge";
    badge.textContent = "🌎 Ranking mundial";
    list.appendChild(badge);

    rows.slice(0, 10).forEach(row => {
      const div = document.createElement("div");
      div.className = "ranking-row world-ranking-row";
      div.innerHTML = `<span class="ranking-pos">${row.position}.</span><span class="ranking-name">${row.name}</span><span class="ranking-score">${row.score}</span>`;
      list.appendChild(div);
    });
  } catch (error) {
    console.warn("Erro ao carregar ranking mundial:", error);
  }
}

window.submitPescariaWorldScore = submitWorldRankingScore;
window.loadPescariaWorldRanking = loadWorldRanking;
window.renderPescariaWorldRanking = renderWorldRankingIntoGame;
