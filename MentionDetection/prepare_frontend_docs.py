from mention_detection_stanza import *
from process_ontonotes import *
from visualize_ontonotes_token import *
from utils import *
import time

from spacy.tokenizer import Tokenizer
from spacy.lang.en import English
nlp = English()
# Create a blank Tokenizer with just the English vocab
tokenizer = Tokenizer(nlp.vocab)

# Construction 2
from spacy.lang.en import English
nlp = English()
# Create a Tokenizer with the default settings for English
# including punctuation rules and exceptions
simple_tokenizer = nlp.tokenizer

def get_docchunk_names(doc_id, idx, dataset='on'):
    if dataset=='on':
        doc_name_toks = doc_id.split('/')
        doc_folder = 'on_'+doc_name_toks[0]+'_'+doc_name_toks[-1]
        doc_name = 'on_'+doc_name_toks[0]+'_'+doc_name_toks[-1]+'_'+str(idx)+'.json' 
    if dataset=='lb':
        doc_folder = 'lb_'+doc_id
        doc_name = 'lb_'+doc_id+'_'+str(idx)+'.json'
    if dataset=='pc':
        doc_folder = 'pc_'+doc_id
        doc_name = 'pc_'+doc_id+'_'+str(idx)+'.json'
    if dataset=='pd':
        doc_name_toks = doc_id.split('/')
        doc_folder = 'pd_'+doc_name_toks[0]+'_'+doc_name_toks[-1]
        doc_name = 'pd_'+doc_name_toks[0]+'_'+doc_name_toks[-1]+'_'+str(idx)+'.json'
    return doc_folder, doc_name

def update_head_mention_spans(gold_docs, visualize=True, base_gold_path=None, base_system_path=None):
    
    for g_doc in gold_docs:
        doc_name = g_doc['docid_partnum']
        part_number = g_doc['docid_partnum'][1]
        doc_id = g_doc['docid_partnum'][0].split('_')[-1]
        system_doc = {'docid_partnum':'', 'sentences':[]}
        
        for sentence in g_doc['sentences']:
            g = DepGraph(sentence['sent_string'])
    
            #gold mentions
            sentence['head_mention_spans'] = {}
            mentions_string = sentence['mentions_string']
            for m, v in mentions_string.items():
                [ent_id, [start, end]] = v
                [char_start, char_end] = token2char(start, end, sentence['tokens'])
                head_text, head_span = g.get_head_word_char_span([char_start, char_end])
                sentence['head_mention_spans'][str([ent_id, [char_start, char_end]])] = (head_text, tuple(head_span))
            assert len(sentence['mentions_string'])==len(sentence['head_mention_spans']), print('assertion error', sentence['mentions_string'], sentence['head_mention_spans'])
            

            #system predicted mentions
            sentence['system_mentions_string'] = {}
            sentence['system_tokens'] = list(g.word_dict.values())
            m_text, m_span = g.find_mentions()
            for t, i in zip(m_text, m_span):
                if t not in sentence['system_mentions_string'].keys():
                    sentence['system_mentions_string'][t] = [[-1, [i[0], i[1]]]]
                else:
                    sentence['system_mentions_string'][t].append([-1, [i[0], i[1]]])
                
            r_dict = {'tokens':sentence['system_tokens'],\
                      'mentions':list(sentence['system_mentions_string'].values()),\
                      'sent_string':sentence['sent_string']}
            
            system_doc['sentences'].append(r_dict)
            
            #system predicted head mentions
            sentence['system_head_mention_spans'] = {}
            mentions_string = sentence['system_mentions_string']
            for m, v in mentions_string.items():
                for vi in v:
                    [ent_id, [start, end]] = vi
                    head_text, head_span = g.get_head_word_char_span([start, end])
                    sentence['system_head_mention_spans'][str([ent_id, [start, end]])] = (head_text, tuple(head_span))    
        
            #common head mentions
            s = set(list(sentence['system_head_mention_spans'].values()))
            g = set(list(sentence['head_mention_spans'].values()))
            common = list(s.intersection(g))
            
            head_mention_spans_inverse = {v:k for k, v in sentence['head_mention_spans'].items()}
            system_head_mention_spans_inverse = {v:k for k, v in sentence['system_head_mention_spans'].items()}
            
            sentence['common_head_mention_spans'] = {}
            for span in common:
                [ent_id, [_, _]] = eval(head_mention_spans_inverse[span])
                [_, [start, end]] = eval(system_head_mention_spans_inverse[span])
                
                #gold_entid, system_spans
                sentence['common_head_mention_spans'][span] = [ent_id, [start, end]]
            
        if (visualize==True):
            #visualize gold
            gold_save_path = os.path.join(base_gold_path, 'on_'+str(doc_id)+'_'+str(part_number)+'_gold.html')
            viewannotations([g_doc], gold_save_path)

            #visualize system
            system_save_path = os.path.join(base_system_path, 'on_'+str(doc_id)+'_'+str(part_number)+'_stanza.html')
            viewannotationschar([system_doc], system_save_path)
    return gold_docs


def get_chunk_indices(frontend_doc):
    '''atleast 150'''
    token_dict = {}
    for idx, sent in enumerate(frontend_doc):
        tokens = sent['tokens']
        token_dict[idx] = len(tokens)
        
    chunk_indices = [0]
    idx, count = 0, 0
    while(idx<len(token_dict)):
        if(count>150):
            count = 0
            chunk_indices.append(idx)
        count = count+token_dict[idx]
        idx+=1
    if len(token_dict) not in chunk_indices:
        chunk_indices.append(len(token_dict))
    return chunk_indices


def construct_tok_dict(word, left_offset, right_offset, pos, candidate=False, target=False):
    return {'word':word,\
            'left_offset':left_offset,\
            'right_offset':right_offset,\
            'candidate':candidate,\
            'target':target,\
            'pos':pos}


def get_sentences_for_frontend(sent):
    new_sent = []
    if len(sent['sent_string'])==0:
        return []
    
    sentence_tokens = []
    for token in simple_tokenizer(sent['sent_string']):
        sentence_tokens.append(token.text)
        
    for word in sentence_tokens:
        new_sent.append(construct_tok_dict(word, 0, 1, 'pos', candidate=False, target=False))
    
    
    system_mentions_string_inverse = {}
    for k, v in sent['system_mentions_string'].items():
        for vi in v:
            system_mentions_string_inverse[str(vi)] = k
            
    list_of_mention_spans = list(sent['system_mentions_string'].values())
    list_of_mention_spans = flatten_list(list_of_mention_spans)
    list_of_mention_spans = sorted(list_of_mention_spans, key=length_of_span, reverse=True)
                
    for char_mention_span in list_of_mention_spans:
        mention_text = system_mentions_string_inverse[str(char_mention_span)]    
        mention_tokens = []
        for token in simple_tokenizer(mention_text):
            mention_tokens.append(token.text)

        new_chunk = []
        [entid, [char_start, char_end]] = char_mention_span

        left_offset = 0
        right_offset = len(mention_tokens)
        for m_tok in mention_tokens:
            new_chunk.append(construct_tok_dict(m_tok, left_offset,\
                                                right_offset, 'pos',\
                                                candidate=True, target=True))
            left_offset-=1
            right_offset-=1

        start_idxs = find_sublist_idx(sentence_tokens, mention_tokens)
        
        for occurrence in start_idxs:
            new_sent[occurrence:occurrence+len(mention_tokens)] = new_chunk         
    return new_sent

def find_sublist_idx(sentence_tokens, mention_tokens):
    mention_len = len(mention_tokens)
    sentence_len = len(sentence_tokens)
    mention_occurrences = []
    for i in range(sentence_len):
        if sentence_tokens[i: min(i+mention_len, sentence_len)]==mention_tokens:
            mention_occurrences.append(i)
    return mention_occurrences
