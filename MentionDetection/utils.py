def get_pairs(test_list):
    res = [(a, b) for idx, a in enumerate(test_list) for b in test_list[idx + 1:]]
    return res

def flatten_list(regular_list):
    return [item for sublist in regular_list for item in sublist]

def length_of_span(span):
    [eid, [s, e]] = span
    key = e-s
    return key

def get_inverse_dict(input_dict):
    '''returns {v:[k1, k2...]}, where ki are all keys with same value'''
    inverse_dict = {}
    for k, v in input_dict.items():
        if v not in inverse_dict.keys():
            inverse_dict[v] = [k]
        else:
            inverse_dict[v].append(k)
    return inverse_dict

def get_decision_matrix(crowd_annotations):
    if len(crowd_annotations)!=3:
        return []
    annotator2mentionpairs = {}
    mentions = flatten_list(crowd_annotations[0])
    all_possible_mention_pairs = get_pairs(mentions)
    
    for idx, ca in enumerate(crowd_annotations):
        pairs = []
        for cluster in ca:
            pairs+=get_pairs(cluster)
        annotator2mentionpairs[idx] = pairs
        
    matrix = np.zeros((3, len(all_possible_mention_pairs)))
    for idx in range(3):
        for p_idx, p in enumerate(all_possible_mention_pairs):
            if p in annotator2mentionpairs[idx]:
                matrix[idx, p_idx] = 1
    return matrix

def back_to_viz_anno(mv_anno):
    anno_viz = {}
    for cluster_id, cluster in enumerate(mv_anno):
        for mention in cluster:
            (sentid, start, end) = mention_maps['1023_bleak_house_brat_0_0.json'][mention] 
            if str(sentid) in anno_viz.keys():
                anno_viz[str(sentid)][str(sentid)+','+str(start)+','+str(end)] = [cluster_id]
            else:
                anno_viz[str(sentid)] = {str(sentid)+','+str(start)+','+str(end): [cluster_id]}
    return anno_viz


import re
    
def format_str(text):
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
    
def token2char(token_start, token_end, tokens):
    string = format_str(" ".join(tokens))
    prefix = format_str(" ".join(tokens[0:token_start]))
    mention = format_str(" ".join(tokens[token_start:token_end]))
    
    char_start = len(prefix)
    char_end = len(prefix)+len(mention)
    
    # +1 for space
    if len(prefix)!=0:
        char_start = char_start+1 
        char_end = char_end+1

    return [char_start, char_end]