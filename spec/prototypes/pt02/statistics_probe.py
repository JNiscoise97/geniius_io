"""Diagnostic reproductible, sans seuil de conformité NF10 ni preuve d'équivalence."""
from concurrent.futures import ThreadPoolExecutor
import math
import random
import statistics

def percentile(values,p):
    ordered=sorted(values)
    return ordered[max(0,math.ceil(len(ordered)*p)-1)]

def exercise(admin,server,harness):
    results=[]
    for concurrency in (1,4):
        def pair(index):
            paths=['/object/2','/object/999']
            random.Random(20261013+index).shuffle(paths)
            answers={path:harness.request(server,path) for path in paths}
            hidden=answers['/object/2'];absent=answers['/object/999']
            assert hidden['status']==absent['status']==404
            assert hidden['headers']==absent['headers'] and hidden['body']==absent['body']
            return {'index':index,'hidden_ms':hidden['duration_ns']/1_000_000,
                    'absent_ms':absent['duration_ns']/1_000_000}
        with ThreadPoolExecutor(max_workers=concurrency) as pool:
            samples=list(pool.map(pair,range(32)))
        train=samples[:16];test=samples[16:]
        hidden_median=statistics.median(x['hidden_ms'] for x in train)
        absent_median=statistics.median(x['absent_ms'] for x in train)
        threshold=(hidden_median+absent_median)/2
        direction=hidden_median>=absent_median
        def predicts_hidden(ms):return (ms>=threshold)==direction
        correct=sum(predicts_hidden(x['hidden_ms'])+ (not predicts_hidden(x['absent_ms'])) for x in test)
        differences=[x['hidden_ms']-x['absent_ms'] for x in samples]
        observed=abs(statistics.mean(differences))
        rng=random.Random(20261013+concurrency)
        trials=1999
        exceed=sum(abs(statistics.mean(d*(1 if rng.getrandbits(1) else -1) for d in differences))>=observed
                   for _ in range(trials))
        result={'concurrency':concurrency,'pairs':len(samples),'seed':20261013,
                'samples':samples,'hidden_median_ms':statistics.median(x['hidden_ms'] for x in samples),
                'absent_median_ms':statistics.median(x['absent_ms'] for x in samples),
                'hidden_p95_ms':percentile([x['hidden_ms'] for x in samples],.95),
                'absent_p95_ms':percentile([x['absent_ms'] for x in samples],.95),
                'mean_paired_difference_ms':statistics.mean(differences),
                'permutation_p_exploratory':(exceed+1)/(trials+1),
                'classifier_train_pairs':16,'classifier_test_observations':32,
                'classifier_threshold_ms':threshold,'classifier_hidden_if_ge_threshold':direction,
                'classifier_correct':correct,'classifier_accuracy':correct/32,
                'NF10_conforme':False,
                'interpretation':'Diagnostic seulement ; absence de différence détectée ne prouve pas équivalence. '
                                 'Coûts Docker/psql, corrélation sous charge et petit échantillon limitent la portée.'}
        harness.event('diagnostic_statistique',result=result)
        results.append(result)
    return results
