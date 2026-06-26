(function(){
  let lastSubmittedScore = 0;
  function getScore(){
    try{
      const vals=[window.phaseScoreBeforeConversion,window.finalScore,window.score,window.currentScore];
      for(const v of vals){const n=Number(v);if(Number.isFinite(n)&&n>0)return n}
      const text=document.body.innerText||"";
      const m=text.match(/Pontuação da fase:\s*([0-9]+)/i);
      if(m)return Number(m[1]);
    }catch(e){}
    return 0;
  }
  function submit(){
    const score=getScore();
    if(!score||score===lastSubmittedScore)return;
    lastSubmittedScore=score;
    if(typeof window.submitPescariaWorldScore==="function"){
      window.submitPescariaWorldScore(score,{phase:window.currentPhase||1,coins:window.coins||0});
    }
  }
  function renderRanking(){
    if(typeof window.renderPescariaWorldRanking==="function"){
      window.renderPescariaWorldRanking();
    }
  }
  const observer=new MutationObserver(()=>{
    const text=document.body.innerText||"";
    if(/Missão concluída|Missão não concluída|Pontuação da fase/i.test(text))setTimeout(submit,250);
    if(/Ranking/i.test(text))setTimeout(renderRanking,250);
  });
  document.addEventListener("DOMContentLoaded",()=>observer.observe(document.body,{childList:true,subtree:true,characterData:true}));
  window.addEventListener("load",()=>setTimeout(renderRanking,800));
})();
