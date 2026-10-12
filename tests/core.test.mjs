import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {emptyProgress,isWeak,grade,recordAttempt,poolFor,makeSession,summarize,finishSession,validateBank,validateProgress,sessionSettingsError,resolveRoute,localDateStamp} from '../core.js';
const bank=validateBank(JSON.parse(fs.readFileSync(new URL('../data/bank.json',import.meta.url),'utf8')));
const byId=new Map(bank.questions.map(q=>[q.id,q]));
const config={weeks:[1],sources:['assignment'],filter:'all',count:'all',mode:'practice',minutes:20,shuffle:false,shuffleOptions:false};
const pool=poolFor(bank.questions,config,emptyProgress());
test('bank has 96 faithful keyed assignments and 504 grounded notes questions',()=>{
  assert.equal(bank.questions.length,600);
  const keys=['CCBCCCBC','CCCCBCBB','BCDBACBC','BCCBBDCB','BCCBBBCB','CACBBCCB','DBCBBBBC','ABCABBCC','BADADCAB','CDBBBCBC','CBCBDCCB','BDBCDABC'];
  for(let week=1;week<=12;week++){
    const original=bank.questions.filter(q=>q.week===week&&q.source==='assignment');
    assert.equal(original.length,8);assert.equal(original.map(q=>'ABCD'[q.answer]).join(''),keys[week-1]);
    assert.ok(bank.questions.some(q=>q.week===week&&q.source==='notes'));
  }
  for(const q of bank.questions){assert.equal(q.options.length,4);assert.equal(new Set(q.options.map(o=>o.toLowerCase())).size,4);assert.ok(q.reference.page>=1);assert.ok(q.explanation.length>20);if(q.source==='assignment')assert.ok(q.notesReference);}
});
test('wrong, unset, and valid option indices grade correctly',()=>{
  assert.equal(grade(pool[0],pool[0].answer),true);assert.equal(grade(pool[0],undefined),false);assert.equal(grade(pool[0],String(pool[0].answer)),false);assert.equal(grade(pool[0],-1),false);
});
test('two consecutive correct answers clear a weak question; another miss restores it',()=>{
  const p=emptyProgress(),id=pool[0].id;recordAttempt(p,id,false);assert.ok(isWeak(p.questions[id]));recordAttempt(p,id,true);assert.ok(isWeak(p.questions[id]));recordAttempt(p,id,true);assert.equal(isWeak(p.questions[id]),false);recordAttempt(p,id,false);assert.ok(isWeak(p.questions[id]));assert.equal(p.questions[id].attempts,4);
});
test('week, source, unseen, saved, and weak filters compose',()=>{
  const p=emptyProgress();recordAttempt(p,pool[0].id,false);p.questions[pool[0].id].bookmarked=true;
  assert.deepEqual(poolFor(bank.questions,{...config,filter:'weak'},p).map(q=>q.id),[pool[0].id]);
  assert.deepEqual(poolFor(bank.questions,{...config,filter:'saved'},p).map(q=>q.id),[pool[0].id]);
  assert.equal(poolFor(bank.questions,{...config,filter:'unseen'},p).length,7);assert.equal(poolFor(bank.questions,{...config,weeks:[]},p).length,0);
});
test('question and option shuffling retain original answer identities',()=>{
  const s=makeSession(pool,{...config,count:'3',shuffle:true,shuffleOptions:true},()=>0.2,1000);
  assert.equal(s.ids.length,3);assert.equal(new Set(s.ids).size,3);
  for(const id of s.ids){assert.deepEqual([...s.orders[id]].sort(),[0,1,2,3]);s.answers[id]=byId.get(id).answer;}
  assert.equal(summarize(s,byId).correct,3);
});
test('checked answers count once; finish grades unchecked answers and skips; finish is idempotent',()=>{
  const p=emptyProgress(),s=makeSession(pool,{...config,count:'3'},Math.random,1000);
  s.answers[s.ids[0]]=pool[0].answer;recordAttempt(p,s.ids[0],true);s.checked[s.ids[0]]=true;
  s.answers[s.ids[1]]=(pool[1].answer+1)%4;
  const r=finishSession(p,s,byId,2000);assert.deepEqual(r,{correct:1,wrong:1,skipped:1,total:3,percent:33});
  assert.equal(p.questions[s.ids[0]].attempts,1);assert.ok(isWeak(p.questions[s.ids[2]]));finishSession(p,s,byId,3000);assert.equal(p.sessions.length,1);assert.equal(p.questions[s.ids[1]].attempts,1);assert.equal(p.active,null);
});
test('exam recovery preserves deadline, answers, flags, and shuffled order',()=>{
  const p=emptyProgress();p.active=makeSession(pool,{...config,mode:'exam',minutes:5,shuffleOptions:true},()=>0.3,10000);
  p.active.answers[pool[0].id]=pool[0].answer;p.active.flags.push(pool[0].id);
  const restored=validateProgress(JSON.parse(JSON.stringify(p)),byId);
  assert.equal(restored.active.deadline,310000);assert.deepEqual(restored.active.answers,p.active.answers);assert.deepEqual(restored.active.orders,p.active.orders);assert.deepEqual(restored.active.flags,p.active.flags);
});
test('malformed imports reject counters and repeated option identities',()=>{
  const p=emptyProgress();recordAttempt(p,pool[0].id,true);p.questions[pool[0].id].misses=2;assert.throws(()=>validateProgress(p,byId));
  const q=emptyProgress();q.active=makeSession(pool,config);q.active.orders[pool[0].id]=[0,0,2,3];assert.throws(()=>validateProgress(q,byId));
});
test('fake checked exam answers cannot bypass attempt recording',()=>{
  const p=emptyProgress();p.active=makeSession(pool,{...config,mode:'exam'});p.active.checked[pool[0].id]=true;assert.throws(()=>validateProgress(p,byId));
});
test('valid checked practice answers survive backup round trips',()=>{
  const p=emptyProgress();p.active=makeSession(pool,config);p.active.answers[pool[0].id]=pool[0].answer;recordAttempt(p,pool[0].id,true);p.active.checked[pool[0].id]=true;
  const restored=validateProgress(JSON.parse(JSON.stringify(p)),byId);finishSession(restored,restored.active,byId);assert.equal(restored.questions[pool[0].id].attempts,1);
});

test('practice and missed-question retry ignore an invalid hidden exam duration',()=>{
  for(const minutes of [0,NaN,1.5,241]){
    const practice={...config,minutes};
    assert.equal(sessionSettingsError(practice),'');
    assert.equal(makeSession(pool,practice).deadline,null);
    assert.match(sessionSettingsError({...practice,mode:'exam'}),/minutes/);
    assert.throws(()=>makeSession(pool,{...practice,mode:'exam'}),/minutes/);
  }
  for(const minutes of [1,240])assert.equal(sessionSettingsError({...config,mode:'exam',minutes}),'');
  assert.throws(()=>makeSession([],config),/No questions/);
  assert.throws(()=>makeSession(pool,{...config,count:0}),/at least one/);
});

test('routes restore bookmarked views and handle unavailable session screens',()=>{
  for(const name of ['home','bank','progress'])assert.equal(resolveRoute(`#${name}`,null),name);
  assert.equal(resolveRoute('',null),'home');
  assert.equal(resolveRoute('#unknown',null),'home');
  assert.equal(resolveRoute('#quiz',null),'home');
  assert.equal(resolveRoute('#results',null),'progress');
  const s=makeSession(pool,config);
  assert.equal(resolveRoute('#quiz',s),'quiz');
  s.completedAt=2000;
  assert.equal(resolveRoute('#quiz',s),'results');
  assert.equal(resolveRoute('#results',s),'results');
});

test('an expired exam recovered hours later ends at the original deadline',()=>{
  const p=emptyProgress();p.active=makeSession(pool,{...config,mode:'exam',minutes:1},Math.random,1000);
  p.active.answers[pool[0].id]=pool[0].answer;
  const recovered=validateProgress(JSON.parse(JSON.stringify(p)),byId);
  const s=recovered.active;
  const r=finishSession(recovered,s,byId,3600000);
  assert.equal(r.correct,1);
  assert.equal(r.skipped,7);
  assert.equal(s.completedAt,61000);
  assert.equal(recovered.sessions[0].duration,60);
  assert.equal(recovered.questions[pool[0].id].lastAt,61000);
  finishSession(recovered,s,byId,7200000);
  assert.equal(recovered.sessions.length,1);
});

test('early exam submission retains its actual completion time',()=>{
  const p=emptyProgress(),s=makeSession(pool,{...config,mode:'exam',minutes:1},Math.random,1000);
  finishSession(p,s,byId,11000);
  assert.equal(p.sessions[0].duration,10);
  assert.equal(s.completedAt,11000);
});

test('imports reject impossible deadlines and inconsistent history scores',()=>{
  for(const deadline of [1000,999,61000.5,1000+241*60000]){
    const p=emptyProgress();p.active=makeSession(pool,{...config,mode:'exam',minutes:1},Math.random,1000);
    p.active.deadline=deadline;
    assert.throws(()=>validateProgress(p,byId),/deadline/);
  }
  const p=emptyProgress(),s=makeSession(pool,config,Math.random,1000);
  finishSession(p,s,byId,2000);
  p.sessions[0].percent=50;
  assert.throws(()=>validateProgress(p,byId),/history/);
  p.sessions[0].percent=0;p.sessions[0].correct=.5;p.sessions[0].skipped-=.5;
  assert.throws(()=>validateProgress(p,byId),/history/);
});

test('backup filenames use the local calendar day around midnight',()=>{
  assert.equal(localDateStamp(new Date(2026,9,12,0,30)),'2026-10-12');
  assert.equal(localDateStamp(new Date(2026,0,1,23,59)),'2026-01-01');
});
