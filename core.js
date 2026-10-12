export const STORAGE_KEY = 'recall.hs169.v1';
export const emptyProgress = () => ({version:1, questions:{}, sessions:[], active:null});
export const isWeak = p => Boolean(p && p.misses>0 && p.streak<2);
export function localDateStamp(date=new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function grade(question, answer) { return Number.isInteger(answer) && answer===question.answer; }
export function recordAttempt(progress, id, correct, now=Date.now()) {
  const old=progress.questions[id] || {attempts:0,correct:0,misses:0,streak:0,bookmarked:false};
  progress.questions[id]={...old,attempts:old.attempts+1,correct:old.correct+(correct?1:0),misses:old.misses+(correct?0:1),streak:correct?old.streak+1:0,lastCorrect:correct,lastAt:now};
}
export function poolFor(bank, settings, progress) {
  return bank.filter(q=>settings.weeks.includes(q.week) && settings.sources.includes(q.source) && (
    settings.filter==='all' || settings.filter==='weak' && isWeak(progress.questions[q.id]) ||
    settings.filter==='unseen' && !(progress.questions[q.id]?.attempts>0) ||
    settings.filter==='saved' && progress.questions[q.id]?.bookmarked));
}
export function shuffled(items, rng=Math.random) {
  const a=[...items]; for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a;
}
export function sessionSettingsError(settings) {
  if(!['practice','exam'].includes(settings.mode))return 'Choose a valid session mode.';
  if(settings.count!=='all'&&(!Number.isInteger(Number(settings.count))||Number(settings.count)<1))return 'Choose at least one question.';
  if(settings.mode==='exam'&&(!Number.isInteger(Number(settings.minutes))||Number(settings.minutes)<1||Number(settings.minutes)>240))return 'Choose a whole number of minutes from 1 to 240.';
  return '';
}
export function resolveRoute(hash, session) {
  const name=hash.replace(/^#/, '')||'home';
  if(name==='quiz')return session ? (session.completedAt?'results':'quiz') : 'home';
  if(name==='results')return session?.completedAt ? 'results' : 'progress';
  return ['home','bank','progress'].includes(name) ? name : 'home';
}
export function makeSession(pool, settings, rng=Math.random, now=Date.now()) {
  const error=sessionSettingsError(settings);
  if(error)throw Error(error);
  if(!pool.length)throw Error('No questions match that selection.');
  const chosen=(settings.shuffle ? shuffled(pool,rng) : [...pool]).slice(0,settings.count==='all'?pool.length:Number(settings.count));
  return {id:globalThis.crypto?.randomUUID?.() || `${now}-${rng()}`, mode:settings.mode, ids:chosen.map(q=>q.id),
    orders:Object.fromEntries(chosen.map(q=>[q.id,settings.shuffleOptions?shuffled(q.options.map((_,i)=>i),rng):q.options.map((_,i)=>i)])),
    answers:{},checked:{},flags:[],index:0,startedAt:now,deadline:settings.mode==='exam'?now+Number(settings.minutes)*60000:null,completedAt:null,settings:{...settings}};
}
export function summarize(session, byId) {
  let correct=0,wrong=0,skipped=0;
  for(const id of session.ids) {
    const a=session.answers[id];
    if(!Number.isInteger(a)) skipped++; else if(grade(byId.get(id),a))correct++; else wrong++;
  }
  return {correct,wrong,skipped,total:session.ids.length,percent:Math.round(correct/session.ids.length*100)};
}
export function finishSession(progress, session, byId, now=Date.now()) {
  if(session.completedAt) return summarize(session,byId);
  // An exam ends at its deadline even if the browser reopens much later.
  if(session.mode==='exam')now=Math.min(now,session.deadline);
  for(const id of session.ids) {
    if(!session.checked[id]) {recordAttempt(progress,id,grade(byId.get(id),session.answers[id]),now);session.checked[id]=true;}
  }
  session.completedAt=now;
  const result=summarize(session,byId);
  progress.sessions.unshift({id:session.id,mode:session.mode,...result,completedAt:now,duration:Math.max(0,Math.round((now-session.startedAt)/1000)),weeks:session.settings.weeks});
  progress.sessions=progress.sessions.slice(0,100);
  progress.active=null;
  return result;
}
export function validateBank(data) {
  if(!data || data.schemaVersion!==1 || !Array.isArray(data.questions) || !Array.isArray(data.weeks))throw Error('Unsupported question bank.');
  const ids=new Set();
  for(const q of data.questions) {
    if(typeof q.id!=='string'||ids.has(q.id)||!Number.isInteger(q.week)||!['assignment','notes'].includes(q.source)||typeof q.question!=='string'||!q.question.trim()||!Array.isArray(q.options)||q.options.length<2||q.options.some(x=>typeof x!=='string'||!x.trim())||!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.options.length||!q.explanation||!q.reference?.file||!Number.isInteger(q.reference.page)||!q.reference.excerpt)throw Error(`Invalid question: ${q.id||'unknown'}`);
    ids.add(q.id);
  }
  return data;
}
export function validateProgress(input, byId) {
  if(!input || input.version!==1 || typeof input.questions!=='object' || !input.questions || Array.isArray(input.questions)||!Array.isArray(input.sessions))throw Error('This is not a Recall progress backup.');
  const clean=emptyProgress();
  for(const [id,p] of Object.entries(input.questions)) {
    if(!byId.has(id))continue;
    if(!p||['attempts','correct','misses','streak'].some(k=>!Number.isSafeInteger(p[k])||p[k]<0)||p.correct+p.misses!==p.attempts||p.streak>p.correct||typeof p.bookmarked!=='boolean')throw Error('Invalid question progress.');
    clean.questions[id]={attempts:p.attempts,correct:p.correct,misses:p.misses,streak:p.streak,bookmarked:p.bookmarked,lastAt:Number.isFinite(p.lastAt)?p.lastAt:0,lastCorrect:p.lastCorrect===true};
  }
  clean.sessions=input.sessions.slice(0,100).map(s=>{
    if(!s || typeof s.id!=='string'||!['practice','exam'].includes(s.mode)||['correct','wrong','skipped','total','percent','duration','completedAt'].some(k=>!Number.isSafeInteger(s[k])||s[k]<0)||s.total<1||s.correct+s.wrong+s.skipped!==s.total||s.percent!==Math.round(s.correct/s.total*100)||!Array.isArray(s.weeks)||s.weeks.some(w=>!Number.isInteger(w)||w<1||w>12))throw Error('Invalid session history.');
    return {id:s.id,mode:s.mode,correct:s.correct,wrong:s.wrong,skipped:s.skipped,total:s.total,percent:s.percent,duration:s.duration,completedAt:s.completedAt,weeks:s.weeks};
  });
  if(input.active) {
    const s=input.active;
    if(!s || typeof s.id!=='string'||!['practice','exam'].includes(s.mode)||!Array.isArray(s.ids)||!s.ids.length||new Set(s.ids).size!==s.ids.length||s.ids.some(id=>!byId.has(id))||!Number.isInteger(s.index)||s.index<0||s.index>=s.ids.length||!Number.isFinite(s.startedAt)||s.mode==='exam'&&!Number.isFinite(s.deadline)||s.completedAt||!s.answers||!s.checked||!s.orders||!Array.isArray(s.flags)||!s.settings||!Array.isArray(s.settings.weeks))throw Error('Invalid active session.');
    const answers={},checked={},orders={};
    if(!Number.isSafeInteger(s.startedAt)||s.startedAt<0||s.mode==='exam'&&(!Number.isSafeInteger(s.deadline)||s.deadline<=s.startedAt||s.deadline-s.startedAt>240*60000))throw Error('Invalid exam deadline.');
    for(const id of s.ids) {
      const n=byId.get(id).options.length, a=s.answers[id], order=s.orders[id];
      if(a!==undefined&&(!Number.isInteger(a)||a<0||a>=n)||!Array.isArray(order)||order.length!==n||new Set(order).size!==n||order.some(i=>!Number.isInteger(i)||i<0||i>=n))throw Error('Invalid session answers.');
      if(a!==undefined)answers[id]=a;
      if(s.checked[id]===true){
        if(s.mode!=='practice'||a===undefined||!clean.questions[id]?.attempts)throw Error('Invalid checked answer.');
        checked[id]=true;
      }
      orders[id]=order;
    }
    clean.active={id:s.id,mode:s.mode,ids:[...s.ids],index:s.index,startedAt:s.startedAt,deadline:s.mode==='exam'?s.deadline:null,completedAt:null,answers,checked,orders,flags:s.flags.filter(id=>s.ids.includes(id)),settings:{weeks:s.settings.weeks.filter(w=>Number.isInteger(w)&&w>=1&&w<=12)}};
  }
  return clean;
}
