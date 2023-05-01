import sys
sys.path.append('./')
from typing import Any, Dict, List, Tuple
from collections import Counter
import numpy as np
import json, os
import more_itertools as mit
from scipy.optimize import linear_sum_assignment


def muc(clusters, mention_to_gold):
    """
    Counts the mentions in each predicted cluster which need to be re-allocated in
    order for each predicted cluster to be contained by the respective gold cluster.
    <https://aclweb.org/anthology/M/M95/M95-1005.pdf>
    """
    true_p, all_p = 0, 0
    for cluster in clusters:
        all_p += len(cluster) - 1
        true_p += len(cluster)
        linked = set()
        for mention in cluster:
            if mention in mention_to_gold:
                linked.add(mention_to_gold[mention])
            else:
                true_p -= 1
        true_p -= len(linked)
    return true_p, all_p

def b_cubed(clusters, mention_to_gold):
    """
    Averaged per-mention precision and recall.
    <https://pdfs.semanticscholar.org/cfe3/c24695f1c14b78a5b8e95bcbd1c666140fd1.pdf>
    """
    numerator, denominator = 0, 0
    for cluster in clusters:
#         if len(cluster) == 1:
#             continue
        gold_counts = Counter()
        correct = 0
        for mention in cluster:
            if mention in mention_to_gold:
                gold_counts[tuple(mention_to_gold[mention])] += 1
        for cluster2, count in gold_counts.items():
            #if len(cluster2) != 1:
            correct += count * count
        numerator += correct / float(len(cluster))
        denominator += len(cluster)
    return numerator, denominator

def phi4(gold_clustering, predicted_clustering):
    """
    Subroutine for ceafe. Computes the mention F measure between gold and
    predicted mentions in a cluster.
    """
    return (
        2
        * len([mention for mention in gold_clustering if mention in predicted_clustering])
        / (len(gold_clustering) + len(predicted_clustering))
    )
    
def ceafe(clusters, gold_clusters):
    """
    Computes the Constrained Entity-Alignment F-Measure (CEAF) for evaluating coreference.
    Gold and predicted mentions are aligned into clusterings which maximise a metric - in
    this case, the F measure between gold and predicted clusters.
    <https://www.semanticscholar.org/paper/On-Coreference-Resolution-Performance-Metrics-Luo/de133c1f22d0dfe12539e25dda70f28672459b99>
    """
    #clusters = [cluster for cluster in clusters if len(cluster) != 1]
    scores = np.zeros((len(gold_clusters), len(clusters)))
    for i, gold_cluster in enumerate(gold_clusters):
        for j, cluster in enumerate(clusters):
            scores[i, j] = phi4(gold_cluster, cluster)
    row, col = linear_sum_assignment(-scores)
    similarity = sum(scores[row, col])
    return similarity, len(clusters), similarity, len(gold_clusters)


def get_clusters(sentences, annotations, mention2annotation, mention2span):
    mention2annotationinverse = {v:k for k,v in mention2annotation.items()}
    mentions = {}
    for idx, anno in enumerate(annotations):
        for k, v in anno.items():
            k = k.split(',')[0] #token id
            if (idx, int(k)) in mention2annotationinverse.keys():
                mention_id = mention2annotationinverse[(idx, int(k))]
                cluster_id = v[-1]
                mentions[mention_id] = (cluster_id, mention2span[mention_id])
    
    clusters = {}
    for m in mentions.keys():
        cluster_id = mentions[m][0]
        if cluster_id not in clusters.keys():
            clusters[cluster_id] = [m]
        else:
            clusters[cluster_id].append(m)

    return list(clusters.values())


def process_clusters(gold_clusters):
    gold_clusters = [tuple(m for m in gc) for gc in gold_clusters]
    mention_to_gold = {}
    for gold_cluster in gold_clusters:
        for mention in gold_cluster:
            mention_to_gold[mention] = gold_cluster
    return gold_clusters, mention_to_gold

def get_f1(precision_numerator, precision_denominator, recall_numerator, recall_denominator):
    precision = get_precision(precision_numerator, precision_denominator)
    recall = get_recall(recall_numerator, recall_denominator)
    return 0 if precision + recall == 0 else 2 * precision * recall / (precision + recall)

def get_recall(recall_numerator, recall_denominator):
    if recall_denominator == 0:
        return 0
    else:
        return recall_numerator / recall_denominator

def get_precision(precision_numerator, precision_denominator):
    if precision_denominator == 0:
        return 0
    else:
        return precision_numerator / precision_denominator


def compute_metrics(doc, sys_annotations, gold_annotations, mention2annotation, mention2span):
    predicted_cluster = get_clusters(doc, sys_annotations, mention2annotation, mention2span)
    gold_cluster = get_clusters(doc, gold_annotations, mention2annotation, mention2span)
    
    #print(predicted_cluster)

    gold_clusters, mention_to_gold = process_clusters(gold_cluster)
    pred_clusters, mention_to_pred = process_clusters(predicted_cluster)

    p_num, p_den = muc(pred_clusters, mention_to_gold)
    r_num, r_den = muc(gold_clusters, mention_to_pred)
    muc_score = get_f1(p_num, p_den, r_num, r_den)
    #print('MUC: ', muc_score)

    p_num, p_den = b_cubed(pred_clusters, mention_to_gold)
    r_num, r_den = b_cubed(gold_clusters, mention_to_pred)
    b_cubed_score = get_f1(p_num, p_den, r_num, r_den)
    #print('B3: ', b_cubed_score)

    p_num, p_den, r_num, r_den = ceafe(pred_clusters, gold_clusters)
    ceaf_score = get_f1(p_num, p_den, r_num, r_den)
    #print('CEAF: ', ceaf_score)
    
    return muc_score, b_cubed_score, ceaf_score



with open('./tutorial_example_5.json', "r") as f:
    example_5 = json.load(f)
    
with open('./gold_annotations.txt', 'r') as f:
    gold_annotations = eval(f.read())
    
with open('./mention2annotations.txt', 'r') as f:
    mention2annotation = eval(f.read())
    
with open('./mention2spans.txt', 'r') as f:
    mention2span = eval(f.read())

def get_score(annotations):
    muc_score, b_cubed_score, ceaf_score = compute_metrics(example_5['sents'], annotations, gold_annotations, mention2annotation, mention2span)
    return b_cubed_score