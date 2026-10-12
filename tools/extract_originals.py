import json,re
from pathlib import Path
import pdfplumber

def clean(s):
    s=re.sub(r'\s+',' ',s).strip()
    # Layout extraction inserts spurious spacing around hyphens and punctuation.
    s=re.sub(r'\s+([?.,;:])',r'\1',s)
    s=re.sub(r'(\w)\s+-\s*(\w)',r'\1-\2',s)
    return s


def extract_originals(source, manifest):
    bank=[]
    for week in range(1,12):
        src=next(item for item in manifest if item['week']==week and item['kind']=='assignment')
        pdf=pdfplumber.open(source/f'Week {week}'/src['file'])
        for pno,page in enumerate(pdf.pages,1):
            text=page.extract_text()
            words=page.extract_words()
            tops={int(w['text'][:-1]):w['top'] for w in words if re.fullmatch(r'\d+\.',w['text'])}
            blocks=list(re.finditer(r'^\s*(\d+)\.\s+(.*?)(?=^\s*\d+\.\s+|\Z)',text,re.S|re.M))
            for block in blocks:
                num=int(block[1]); content=block[2]
                ymin=tops[num]-1
                ymax=min([t for n,t in tops.items() if n>num],default=page.height)
                bold=clean(''.join(c['text'] for c in page.chars if ymin<=c['top']<ymax and 'bold' in c['fontname'].lower()))
                parts=re.split(r'^\s*([a-d])\.\s+',content,flags=re.M)
                assert len(parts)==9,(week,num,parts)
                question=clean(parts[0]); options=[clean(parts[i+1]) for i in [1,3,5,7]]
                matches=[i for i,o in enumerate(options) if re.sub(r'\W','',o) in re.sub(r'\W','',bold)]
                assert len(matches)==1,(week,num,matches,options,bold)
                bank.append(dict(id=f'w{week:02}-a{num:02}',week=week,source='assignment',number=num,question=question,options=options,answer=matches[0],topic='Assignment review',explanation=f'The supplied solution marks option {"ABCD"[matches[0]]}: {options[matches[0]]}',reference=dict(file=src['file'],page=pno,excerpt=options[matches[0]]),keyMethod='PDF bold answer'))
        assert len([q for q in bank if q['week']==week])==8
    
    week12=[
    (1,1,'Which of the following is a motivational component of meaning in life?',['Coherence','Purpose','Significance','Mattering'],1),
    (2,1,"'Life has meaning under all circumstances, even the most miserable ones'. This statement is associated with...........................",['Cognitive therapy','Mindfulness-based therapy','Behavioral therapy','Logotherapy'],3),
    (3,1,'How is significance or mattering defined in the context of meaning in life?',['A value-laden evaluation of daily activities',"Worthwhileness and value of one’s life",'A measure of achievements and success','A focus on personal desires and wishes'],1),
    (4,1,'How do the dimensions of comprehension, purpose, and mattering influence each other?',['They have no mutual influence.','A high level in one dimension leads to low levels in others.','Low levels in one may lead to low levels in others, and vice versa','They have unpredictable relationships.'],2),
    (5,2,'What did Frankl believe is the last of human freedoms, even in the most challenging circumstances?',['Freedom to pursue material success','Freedom to avoid suffering','Freedom to achieve external goals',"Freedom to choose one's attitude in any given circumstance"],3),
    (6,2,'What is one way Frankl suggested individuals can discover meaning in life?',['Creating a work or doing a deed','Avoiding all forms of suffering','Pursuing external achievements only','Experiencing natural beauty without any action'],0),
    (7,2,'Why might satisfaction from extrinsic goals not last?',['Extrinsic goals are inherently unsatisfying.','People quickly adapt to extrinsic goals.','Satisfaction from extrinsic goals is dependent on external factors.',"Extrinsic goals are not valued by one's culture."],1),
    (8,2,'How do intrinsic goals differ from extrinsic goals in terms of their relationship to cultural beliefs and norms?',['Both intrinsic and extrinsic goals are strongly shaped by cultural beliefs and norms.','Intrinsic goals are more influenced by cultural beliefs, while extrinsic goals are less influenced by cultural beliefs and norms.','Extrinsic goals are strongly shaped by cultural beliefs and norms, while intrinsic goals emerge from natural growth tendencies.','Cultural beliefs have no impact on the content of either intrinsic or extrinsic goals.'],2)
    ]
    for num,page,q,opts,a in week12:
        bank.append(dict(id=f'w12-a{num:02}',week=12,source='assignment',number=num,question=q,options=opts,answer=a,topic='Assignment review',explanation=f'The supplied solution selects option {"ABCD"[a]}: {opts[a]}',reference=dict(file='Solution 12.pdf',page=page,excerpt=opts[a]),keyMethod='Visually transcribed selected radio button'))
    
    return bank
