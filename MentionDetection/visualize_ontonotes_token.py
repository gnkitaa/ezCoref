import json, os

formatting = """
<meta charset="utf-8"> 
<style>
.sentid { font-size: 100%; }
.mention { font-size: 100%; }
.entid { position: relative; top: 0.5em; font-size: 95%; font-family: helvetica,sans-serif;}
.ner { color: #555; font-size: 110%; }
.nertype { font-size: 80%; font-style: italic; vertical-align: sub; font-family: helvetica,sans-serif; }

.pos_PRP { font-weight: bold; }
.pos_PRP_DOLLAR_ { font-weight: bold; }

/* Dark2 from http://colorbrewer2.org/ */
.c0 { color: rgb(27,158,119); } 
.c1 { color: rgb(217,95,2); }
.c2 { color: rgb(117,112,179); }
.c3 { color: rgb(255, 0, 0); }
.c4 { color: rgb(102,166,30); }
.c5 { color: rgb(230,171,2); }
.c6 { color: rgb(166,118,29); }
.c7 { color: rgb(102,102,102); }
.c8 { color: rgb(112, 61, 61);}
.c9 { color: rgb(0, 71, 171);}
.c10 { color: rgb(202, 44, 146);}
.c11 { color: rgb(0, 128, 128);}
</style>
"""

#green, orange, purpule, red, light green, yellow, dark yellow, black, brown, blue, fushcia, teal

import sys,json,cgi
import html
import more_itertools as mit
NUM_COLORS = 11

def start_mention(mention):
    (entid, (s, e)) = mention
    print("<span class='mention c%s'>[</span>" % (entid % NUM_COLORS))
        
def end_mention(mention):
    (entid, (s, e)) = mention
    print("<span class='mention c%s'>]<span class='entid c%s'>e%s</span></span>" % (entid % NUM_COLORS, entid % NUM_COLORS, entid))

def sortkey(key):
    (typ, info) = key
    prio = 0 if typ=='mention' else 10
    s,e = info[1]
    # longer comes first
    return (prio, -(e-s))

def startsort(items):
    return sorted(items, key=sortkey)
def endsort(items):
    return sorted(items, key=sortkey, reverse=True)

def pos_css(pos):
    pos = pos.replace("$","_DOLLAR_")
    return pos


def viewannotations(docs, save_path):
    '''docs: OntoNotes style document with mentions'''
    htmlfile = open(save_path, 'w')
    htmlfile.write(formatting)
    
    entity_dict = {}
    for sentid, sent in enumerate(docs[0]['sentences']):
        for ment in sent['mentions']:
            entid, (start,end) = ment
            if entid not in entity_dict:
                entity_dict[entid] = [(sentid, start, end)]
            else:
                entity_dict[entid].append((sentid, start, end))
                
    #print(entity_dict)
                
    for sentid, sent in enumerate(docs[0]['sentences']):
        T = len(sent['tokens'])
        index_starts = [ [] for t in range(T) ]
        index_ends = [ [] for t in range(T+1) ]
        for ment in sent['mentions']:
            entid, (start,end) = ment
            ment = (entid, (start,end))
            #print(start, end, len(index_starts), len(index_ends), T, sent['tokens'], ment)
            index_starts[start].append(('mention', ment) )
            index_ends[end].append( ('mention',ment) )
        
        htmlfile.write("<div class='sentid'><h3>S%s</h3></div>" % sentid)
        htmlfile.write("<div class='sentence'>")

        currently_activated = set()

        for t in range(T):
            for item in startsort(index_starts[t]):
                if item[0]=='mention': 
                    entid, (s, e) = item[1]
                    if str(entid).startswith('N'):
                        htmlfile.write("<span class='mention c%s'>[</span>\n" % (NUM_COLORS))
                    else:
                        htmlfile.write("<span class='mention c%s'>[</span>\n" % (entid % NUM_COLORS))
                currently_activated.add(item[1])
                
            htmlfile.write("<span class='token'>%s</span>\n" % (html.escape(sent['tokens'][t])))
           
            for item in endsort(index_ends[t+1]):
                if item[0]=='mention': 
                    (entid, (s, e)) = item[1]
                    if entid==-1:
                         htmlfile.write("<span class='mention c%s'>]</span>\n" % (entid % NUM_COLORS))
                    elif str(entid).startswith('N'):
                        htmlfile.write("<span class='mention c%s'>]<span class='entid c%s'>e%s</span></span>\n" % (NUM_COLORS, NUM_COLORS, 'NR'))
                    elif len(entity_dict[entid])==1:
                        htmlfile.write("<span class='mention c%s'>]<span class='entid c%s'>e%s</span></span>\n" % (entid % NUM_COLORS, entid % NUM_COLORS, 'S'))
                        #print(entity_dict[entid])
                    else:
                        htmlfile.write("<span class='mention c%s'>]<span class='entid c%s'>e%s</span></span>\n" % (entid % NUM_COLORS, entid % NUM_COLORS, entid))
                currently_activated.remove(item[1])
        htmlfile.write("</div>")
        htmlfile.write("</div>")
    htmlfile.close()