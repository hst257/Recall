"""Rebuild the reviewed bank from unchanged source PDFs and authored question seeds."""
import argparse
from pypdf import PdfReader
from extract_originals import extract_originals
import json,re,hashlib
from pathlib import Path

site=Path(__file__).resolve().parents[1]
authoring=site/'tools'/'authoring'
args=argparse.ArgumentParser(description=__doc__)
args.add_argument('--source',required=True,help='Folder containing Week 1 through Week 12')
source=Path(args.parse_args().source)
manifest=json.loads((authoring/'sources.json').read_text(encoding='utf8'))
notes={}
for item in manifest:
    path=source/f"Week {item['week']}"/item['file']
    if not path.is_file():raise SystemExit(f'Missing source PDF: {path}')
    if hashlib.sha256(path.read_bytes()).hexdigest()!=item['sha256']:
        raise SystemExit(f'Source changed: {path}. Review the extraction, keys, seeds, and manifest before rebuilding.')
    if item['kind']=='notes':
        notes[item['week']]={'file':item['file'],'pages':[p.extract_text(extraction_mode='layout') for p in PdfReader(path).pages]}

def normalize(s):return re.sub(r'\s+',' ',s).strip()
def evidence(week,page,cue):
    d=notes[week]
    text=normalize(d['pages'][page-1]); cue=normalize(cue)
    at=text.casefold().find(cue.casefold())
    assert at>=0,(week,page,cue)
    boundary=text.rfind('. ',0,at)
    start=boundary+2 if boundary>=0 else 0
    end=text.find('. ',at+len(cue))
    if end<0:end=len(text)
    if end-start<120:
        after=text.find('. ',end+2)
        if after>=0:end=after
    excerpt=text[start:end+1]
    if len(excerpt)>1100:
        start=max(start,at-150);end=min(len(text),at+750)
        excerpt=('…' if start else '')+text[start:end]+('…' if end<len(text) else '')
    return dict(file=d['file'],page=page,excerpt=excerpt)

questions=extract_originals(source,manifest)
by_id={q['id']:q for q in questions}
for line in (authoring/'assignment-explanations.txt').read_text(encoding='utf8').splitlines():
    week,num,page,cue,explanation=line.split('|')
    q=by_id[f'w{int(week):02}-a{int(num):02}']
    q['explanation']=explanation
    q['notesReference']=evidence(int(week),int(page),cue)
assert all('notesReference' in q for q in questions)
titles=['Stress & its physiology','Stress, health & trauma','Growth, hardiness & control','Coping & defense mechanisms','Relaxation & mindfulness','Well-being & resilience','The psychology of happiness','Sustainable happiness','Gratitude, kindness & comparison','Strengths & flow','Self-actualization & motivation','Meaning & life goals']
for week in range(1,13):
    seeds=authoring/f'seeds-{week:02}.txt'
    if not seeds.exists():continue
    for number,line in enumerate(seeds.read_text(encoding='utf8').splitlines(),1):
        if not line.strip():continue
        fields=line.split('|');assert len(fields)==9,(week,number,len(fields))
        page,topic,q,correct,d1,d2,d3,exp,cue=fields
        opts=[correct,d1,d2,d3];a=(number*7+week*3)%4
        opts=opts[-a:]+opts[:-a] if a else opts
        questions.append(dict(id=f'w{week:02}-n{number:03}',week=week,source='notes',number=number,topic=topic,question=q,options=opts,answer=a,explanation=exp,reference=evidence(week,int(page),cue),keyMethod='Authored from supplied lecture notes'))

# These source caveats preserve the official key while making overlapping options visible.
caveats={
'w04-a06':'The supplied key marks D. Option B is also a partial description; D includes the fuller wording in the notes. The original options are preserved.',
'w04-a07':'The supplied key marks C. Option D is also consistent with the defense hierarchy taught in the notes. The original wording and key are preserved.',
'w07-a08':'This tests the historical positivity-ratio claim quoted by the course. Treat it as course recall, not a universal emotional target.',
'w08-a06':'This is a variance estimate reported in the course, not the proportion of an individual’s happiness controlled by circumstances.',
'w11-a04':'The term neurosis is preserved from the course’s Rogers discussion. This question tests that supplied terminology.',
'w12-a06':'The supplied solution selects A. The notes also describe experiencing beauty as a route to meaning, so D may appear plausible depending on the interpretation of “without any action”. The original key is preserved.'}
for q in questions:
    if q['id'] in caveats:q['sourceNote']=caveats[q['id']]
    if q['source']=='notes' and q['topic']=='Course research claim':q['sourceNote']='This is a historical course claim; the question asks what the supplied notes report.'
    if q['source']=='notes' and q['topic']=='Course model estimates':q['sourceNote']='The notes criticize the pie chart: estimates across people are not an individual formula, the factors interact, and percentages are approximate.'

questions.sort(key=lambda q:(q['week'],q['source']!='assignment',q['number']))
out=site/'data';out.mkdir(parents=True,exist_ok=True)
bank=dict(schemaVersion=1,bankVersion='2026-10-12.1',course='Psychology of Stress, Health and Well-Being',courseCode='NOC26 HS169',weeks=[dict(number=i+1,title=t) for i,t in enumerate(titles)],questions=questions)
(out/'bank.json').write_text(json.dumps(bank,ensure_ascii=False,indent=2),encoding='utf8')
print('Total',len(questions),'assignments',sum(q['source']=='assignment' for q in questions),'notes',sum(q['source']=='notes' for q in questions))
for week in range(1,13):
    qs=[q for q in questions if q['week']==week and q['source']=='notes']
    print(week,len(qs),'pages',sorted(set(q['reference']['page'] for q in qs)))
