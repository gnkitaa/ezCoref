import stanza
from collections import defaultdict
# nlp = stanza.Pipeline(lang='en', processors='tokenize, mwt, pos, lemma, depparse', tokenize_pretokenized=True)
nlp = stanza.Pipeline(lang='en', processors='tokenize, mwt, pos, lemma, depparse')
from merge_intervals import *

#AG: Stanza may split a single input sentence into two, the token indices will be adjusted accordingly, with tokens in second sentence starting from 0, but the character ndices follow original input text sentence.

class DepGraph:
    def __init__(self, text):
        self.graph = {}  #{sentid: graph} #defaultdict(dict)
        self.paths = {}  #{sentid: list}
        self.text = text
        self.doc = nlp(text)
        self.word_dict = {}
        self.pos_dict = {}
        self.char_span_dict = {}
        self.mentions = []
        self.buildgraph()
        self.merger = Merger()
    
    def addEdge(self, s_id, u, v, rel):
        '''adds edge u->v with relation rel'''
        if(u in self.graph[s_id].keys()):
            self.graph[s_id][u][v] = (rel)
        else:
            self.graph[s_id][u] = {} 
            self.graph[s_id][u][v] = (rel)
            
    def addinfo(self, s, u, word, pos, start, end):
        self.word_dict[(s, u)] = word
        self.pos_dict[(s, u)] = pos
        self.char_span_dict[(s, u)] = [start, end]
        
    def buildgraph(self):
        for s_id, sentence in enumerate(self.doc.sentences):
            self.graph[s_id] = defaultdict(dict)
            for word in sentence.words:
                parent_index = word.head
                word_index = word.id
                relation = word.deprel
                self.addEdge(s_id, parent_index, word_index, relation)
                self.addinfo(s_id, word_index, word.text, word.pos, word.start_char, word.end_char)
            self.find_paths(s_id)
        
    def find_paths(self, s_id):
        self.paths[s_id] = []
        self.depthFirst(s_id, 0, -1, [])
        list_of_paths = self.paths[s_id]
        self.paths[s_id] = {}
        for p in list_of_paths:
            self.paths[s_id][p[-1]]  = p
        
    def depthFirst(self, s_id, currentVertex, previousVertex, visited):
        visited.append(currentVertex)
        for neighbour in self.graph[s_id][currentVertex]:
            if neighbour not in visited:
                self.depthFirst(s_id, neighbour, currentVertex, visited.copy())
        self.paths[s_id].append(visited)
        
    def noun_phrase(self, sent_id, currentVertex, visited, whitelist=None):
        conj_allowed = True
        
        if whitelist==None:
            whitelist = ['compound', 'flat', 'fixed', 'det', 'amod', 'nummod', 'nmod:poss', 'nmod']
        else:
            if 'conj' not in whitelist:
                conj_allowed = False

        visited.append(currentVertex)
        
        if len(self.graph[sent_id][currentVertex])==0:
            start_span = self.char_span_dict[(sent_id, currentVertex)][0]
            end_span = self.char_span_dict[(sent_id, currentVertex)][1]
            return [start_span, end_span]
        
        start = self.char_span_dict[(sent_id, currentVertex)][0]
        end = self.char_span_dict[(sent_id, currentVertex)][1]
        
        for child in self.graph[sent_id][currentVertex].keys():
            if child not in visited:
                relation = self.graph[sent_id][currentVertex][child]
                if conj_allowed and relation=='conj' and self.pos_dict[(sent_id, child)] in ['PRON', 'NOUN', 'PROPN', 'NUM']:
                    [start_new, end_new] = self.noun_phrase(sent_id, child, visited.copy())
                    start = min(start_new, start)
                    end = max(end_new, end)
                elif relation!='conj' and relation in whitelist:
                    [start_new, end_new] = self.noun_phrase(sent_id, child, visited.copy())
                    start = min(start_new, start)
                    end = max(end_new, end)
        
        return [start, end]
    
    def get_head_word_char_span(self, mention_spans):
        '''mention_spans: [start:end], character spans'''
        min_path_len = 1e10 #inf
        
        lca_span = mention_spans
        lca_text = self.text[mention_spans[0]:mention_spans[1]] #self.word_dict[mention_spans[-1]-1]
        
        for s_id, sent in enumerate(self.doc.sentences):
            for word in sent.words:
                if word.start_char>=mention_spans[1] or word.end_char<=mention_spans[0]:
                    continue
                path = self.paths[s_id][word.id]
                if len(path)<min_path_len:
                    min_path_len = len(path)
                    lca_span = [word.start_char, word.end_char]
                    lca_text = word.text
        return lca_text, lca_span
    
    def deduplicate(self, mentions, mentions_spans):
        mention_heads = {}
        for m, s in zip(mentions, mentions_spans):
            head_text, head_span = self.get_head_word_char_span(s)
            if tuple(head_span) in mention_heads.keys():
                mention_heads[tuple(head_span)].append((m, s))
            else:
                mention_heads[tuple(head_span)] = [(m, s)]
        
        mentions = []
        mentions_spans = []
        for v in mention_heads.values():
            max_text = ''
            max_span = ''
            max_len = 0
            
            for vi in v:
                vi_text = vi[0]
                vi_span = vi[1]
                if len(vi_text)>max_len:
                    max_text = vi_text
                    max_span = vi_span
                    
            mentions.append(max_text)
            mentions_spans.append(max_span)
        return mentions
    
    def format_str(self, text):
        '''1. remove spaces before punctuation marks [,.?!%.-]
           2. remove space after -
        '''
        text = re.sub(r'\s([-,?.!%\"](?:\s|$))', r'\1', text)
        text = re.sub(r'([-](?:|$))\s', r'\1', text).strip()
        text = re.sub(r'-LRB-', r'( ', text).strip()
        text = re.sub(r'-RRB-', r') ', text).strip()
        text = re.sub(r'-LCB-', r'{ ', text).strip()
        text = re.sub(r'-RCB-', r'} ', text).strip()
        text = re.sub(r'-LSB-', r'[ ', text).strip()
        text = re.sub(r'-RSB-', r'] ', text).strip()
        return text
    
    def find_mentions(self):
        mentions_dict = {}
        for s_id, sentence in enumerate(self.doc.sentences):
            for word in sentence.words:
                if word.pos not in ['PRON', 'NOUN', 'PROPN', 'NUM']:
                    continue
                mention_char_span = self.noun_phrase(s_id, word.id, [])
                if(len(mention_char_span)!=0):
                    mentions_dict[(mention_char_span[0], mention_char_span[1])] = self.text[mention_char_span[0]:mention_char_span[1]]
        
        #merge overlapping spans
        mentions_keys = self.merger.merge(list(mentions_dict.keys())) 
        mentions = []
        mentions_spans = []
        for k in mentions_keys:
            if (k[0], k[1]) in mentions_dict.keys():
                mentions.append(mentions_dict[(k[0], k[1])])
                mentions_spans.append((k[0], k[1]))
            else:
                mentions.append(self.text[k[0]:k[1]-1])
                mentions_spans.append((k[0], k[1]))
            
  
        #head word based de-duplication
        mentions = self.deduplicate(mentions, mentions_spans)


 
        # Rule 1: add the token heading a cordinated phrase and its children to the list of mentions
        # example, if text = '''Bob, John, and Mary saw him.''', add "Bob", "John" and "Mary" to list of mentions
        conjunct_whitelist = ['compound', 'flat', 'fixed', 'amod', 'nummod', 'nmod:poss', 'nmod']
        
        for s_id, sentence in enumerate(self.doc.sentences):
            for word in sentence.words:
                if (word.pos in ['NOUN', 'PROPN', 'PRON']):
                    for child in self.graph[s_id][word.id]:
                        relation = self.graph[s_id][word.id][child]
                        if relation=='conj' and self.pos_dict[(s_id, word.id)] in ['NOUN', 'PROPN', 'PRON']:  
                            #parent of conj
                            
                            mention_char_span = self.noun_phrase(s_id, word.id, [], conjunct_whitelist)
                            if(len(mention_char_span)!=0):
                                conjunct_text = self.text[mention_char_span[0]:mention_char_span[1]]
                                conjunct_span = (mention_char_span[0], mention_char_span[1])
                                #print('word_text: ', word.text)
                                #print('conjunct_text: ', conjunct_text)
                            else:
                                conjunct_text = word.text
                                conjunct_span = (word.start_char, word.end_char)
                            if conjunct_span not in mentions:
                                mentions.append(conjunct_text)
                                mentions_spans.append(conjunct_span)
                            
                            #child of conj
                            if self.pos_dict[(s_id, child)] in ['NOUN', 'PROPN', 'PRON']:
                                child_mention_char_span = self.noun_phrase(s_id, child, [], conjunct_whitelist)
                                if(len(child_mention_char_span)!=0):
                                    conjunct_child_text = self.text[child_mention_char_span[0]:child_mention_char_span[1]]
                                    conjunct_child_span = (child_mention_char_span[0], child_mention_char_span[1])
                                    #print('child_word_text: ', self.word_dict[(s_id, child)])
                                    #print('child_conjunct_text: ', conjunct_child_text)
                                else:
                                    conjunct_child_text = self.word_dict[(s_id, child)]
                                    conjunct_child_span = (self.char_span_dict[(s_id, child)][0], self.char_span_dict[(s_id, child)][1])
                                if conjunct_child_span not in mentions:
                                    mentions.append(conjunct_child_text)
                                    mentions_spans.append(conjunct_child_span)
                                    
        #Rule 2: add child of nmod:poss relation, to include possesive pronouns, names as mentions 
        for s_id, sentence in enumerate(self.doc.sentences):
            for word in sentence.words:
                if (word.pos in ['PRON', 'NOUN', 'PROPN'] and word.deprel in ["nmod:poss", "nmod"]):
                    mention_char_span = self.noun_phrase(s_id, word.id, [])
                    if(len(mention_char_span)!=0):
                        mentions.append(self.text[mention_char_span[0]:mention_char_span[1]])
                        mentions_spans.append((mention_char_span[0], mention_char_span[1]))
                    else:
                        mentions.append(word.text)
                        mentions_spans.append((word.start_char, word.end_char))
                        
   
        #Rule 3: parent--compound-->child, if parent is NN and child is proper noun, include child as mention
        for s_id, sentence in enumerate(self.doc.sentences):
            for word in sentence.words:
                parent = sentence.words[word.head-1]
                if (word.pos in ['PROPN'] and parent.pos in ['NOUN'] and word.deprel in ["compound", "flat", "fixed"]):
                    mention_char_span = self.noun_phrase(s_id, word.id, [])
                    if(len(mention_char_span)!=0):
                        mentions.append(self.text[mention_char_span[0]:mention_char_span[1]])
                        mentions_spans.append((mention_char_span[0], mention_char_span[1]))
                    else:
                        mentions.append(word.text)
                        mentions_spans.append((word.start_char, word.end_char))

        return mentions, mentions_spans
    
    
    def copular_mentions(self):
        copular_heads = []
        for sent_id, sent in enumerate(self.doc.sentences):
            for word in sent.words:
                word_id = word.id
                for child in self.graph[sent_id][word_id].keys():
                    relation = self.graph[sent_id][word_id][child]
                    if relation=='cop' and word.pos in ['NOUN', 'ADJ', 'PROPN', 'PRON']:
                        copular_heads.append((sent_id, word))

        copula_mention_pairs = []               
        for (sent_id, word) in copular_heads:
            sent = self.doc.sentences[sent_id]
            #exlude PP
            if 'case' in self.graph[sent_id][word.id].values():
                continue
                
            #look for subject  
            for child in self.graph[sent_id][word.id].keys():
                relation = self.graph[sent_id][word.id][child]
                child_pos = self.pos_dict[(sent_id, child)]
                if relation in ['nsubj'] and child_pos in ['PROPN', 'NOUN', 'PRON']:
                    word_span = (word.start_char, word.end_char)
                    child_char_span = self.char_span_dict[(sent_id, child)]
                    child_span = (child_char_span[0], child_char_span[1])
                    copula_mention_pairs.append([word_span, child_span])
        return copula_mention_pairs