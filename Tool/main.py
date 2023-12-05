import argparse
import sys
sys.path.append('./mturk')
sys.path.append('./Tutorial_B3')
sys.path.append('./Tutorial_B3/')
import json
import os
import pickle
import hashlib
from flask import request, Response, Flask
app = Flask(__name__)
from annotation_manager import AnnotationManager
from config_exp import CFG_EXP
from config_hit import CFG_HIT, CFG_QUALIFICATION
from create_client import create_client
from score import get_score


EXP_NAME = "test"

########## Setup ##########
CFG_EXP = CFG_EXP[EXP_NAME]

os.makedirs(CFG_EXP['EXPERIMENT_DIR'], exist_ok=True)
print('experiment directory: ', CFG_EXP['EXPERIMENT_DIR'])
print('the directory exists? ', os.path.exists(CFG_EXP['EXPERIMENT_DIR']))


annotation_mngr_path = os.path.join(CFG_EXP['EXPERIMENT_DIR'], 'AnnotationMngr.pkl')
if not os.path.exists(annotation_mngr_path):
    print('Creating an annotation manager...')
    annotation_manager = AnnotationManager(
        EXP_NAME, CFG_EXP['EXPERIMENT_DIR'], CFG_EXP['TUTORIAL_CONFIG'], CFG_EXP['DOCS_DIR'],
        CFG_EXP['N_ASSIGNMENTS_PER_CHUNK'],
    )
else:
    print('Loading existing annotation manager...')
    with open(annotation_mngr_path, 'rb') as f:
        annotation_manager = pickle.load(f)

print("Backend Launched Successfully!")

########## Inferface #########
@app.route('/passage', methods=["GET"])
def get_passage():
    global annotation_manager

    #AG: request.args is the parsed URL parameters (the part in the URL after the question mark).
    hit_id = request.args.get('hitId')
    assignment_id = request.args.get('assignmentId')
    annotator_id = request.args.get('workerId')
    debug_doc = request.args.get('debugDoc')
    debug_chunk = request.args.get('debugChunk')

    resp = {'docId': None, 'chunkId': None, 'doc': None, 'annotations': {}, 'pointer': 0}
    if debug_doc != 'undefined' and debug_chunk!='undefined':
        print('Get passage to observe spans!')
        print('debug chunk', debug_chunk)
        chunk_file = debug_chunk + '.json'
        resp["doc"] = annotation_manager.debug_chunk(debug_doc, chunk_file)
        

    elif annotator_id != 'undefined' and hit_id != 'undefined' and assignment_id != 'undefined':
        print('Get passage!')
        print('hit_id', hit_id)
        print('assignment_id', assignment_id)
        print('annotator_id', annotator_id)

        chunk = annotation_manager.get_chunk(hit_id)
        resp['docId'], resp['chunkId'], resp['doc'] = chunk["doc_id"], chunk["chunk_id"], chunk["doc"]
    
    
    resp = Response(json.dumps(resp))
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp


@app.route("/annotations", methods=["GET", "POST"])
def submit_annotations():
    global annotation_manager

    hit_id = request.args.get('hitId')
    assignment_id = request.args.get('assignmentId')
    annotator_id = request.args.get('workerId')

    if annotator_id != 'undefined' and hit_id != 'undefined' and assignment_id != 'undefined':
        body = json.loads(request.form['json'])
        doc_id = body["docId"]
        chunk_id = body["chunkId"]
        task_type = body["task_type"]
        annotations = body["annotations"]
        start_time = body["start_time"]
        end_time = body["end_time"]

        #AG: backend is correctly receiving ids and annotations.
        print('Submit annotations!')
        print('hit_id', hit_id)
        print('assignment_id', assignment_id)
        print('annotator_id', annotator_id)
        print('doc_id', doc_id)
        print('chunk_id', chunk_id)
        print('task_type', task_type)
        print('annotations', annotations)
        print('start time used for the hit (seconds) calculated by the frontend', start_time)
        print('end time used for the hit (seconds) calculated by the frontend', end_time)

        _, client = create_client(task_type=task_type)
        if task_type.upper() == "TUTORIAL":
            print("calling create_annotator")
            annotation_manager.create_annotator(
                hit_id, assignment_id, annotator_id, annotations, start_time, end_time
            )
            client.associate_qualification_with_worker(
                QualificationTypeId=CFG_HIT["TUTORIAL"]["PREV_WORKER_QUALIFICATION"],
                WorkerId=annotator_id,
                IntegerValue=1,
                SendNotification=False,
            ) # if the worker fails to submit the HIT, (s)he will still be prevented from accessing new tutorial HITs
            tutorial_score = get_score(annotations)
            if tutorial_score>=CFG_EXP['TUTORIAL_SCORE_THRESHOLD']:
                print(f'This annotator passed tutorial with score={tutorial_score}. Assigning main qualification.')
                client.associate_qualification_with_worker(
                    QualificationTypeId=CFG_QUALIFICATION["ID_1"],
                    WorkerId=annotator_id,
                    IntegerValue=1,
                    SendNotification=False,
                )
                client.associate_qualification_with_worker(
                    QualificationTypeId=CFG_QUALIFICATION["ID_2"],
                    WorkerId=annotator_id,
                    IntegerValue=1,
                    SendNotification=True,
                )
                client.notify_workers(
                    Subject=CFG_QUALIFICATION["QUALIFIED"]["EMAIL_SUBJECT"],
                    MessageText=CFG_QUALIFICATION["QUALIFIED"]["EMAIL_MSG"],
                    WorkerIds=[annotator_id],
                )
            else:
                print(f'This annotator failed tutorial with score={tutorial_score}. Not assigning main qualification.')
        else:
            annotation_manager.submit_annotations(
                hit_id, assignment_id, annotator_id, doc_id, chunk_id, annotations, start_time, end_time
            )

    resp = Response()
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp


@app.route("/code", methods=["GET"])
def generate_code():
    hit_id = request.args.get('hitId')
    assignment_id = request.args.get('assignmentId')
    annotator_id = request.args.get('workerId')

    resp = {'code': None}
    if annotator_id != 'undefined' and hit_id != 'undefined' and assignment_id != 'undefined':
        code = (str(hit_id) + str(assignment_id) + str(annotator_id) + "corefAnnotatn").encode('utf-8')
        resp['code'] = hashlib.sha256(code).hexdigest()

        #AG: backend is correctly receiving ids and generating a code.
        print('Generate code!')
        print('hit_id', hit_id)
        print('assignment_id',assignment_id)
        print('annotator_id', annotator_id)
        print('code', code)
    
    resp = Response(json.dumps(resp))
    resp.headers['Access-Control-Allow-Origin'] = '*'

    return resp


@app.route('/tutorial', methods=['GET'])
def tutorial():
    tutorial_exercise = request.args.get('tutorialexcercise')

    tutorial_config = json.load(open(CFG_EXP['TUTORIAL_CONFIG']))

    tutorial_passage = None
    if tutorial_exercise == "left_click":
        tutorial_passage = json.load(
            open(tutorial_config['TUTORIAL_LEFT_CLICK_PATH']))
    elif tutorial_exercise == "double_left_click":
        tutorial_passage = json.load(
            open(tutorial_config['TUTORIAL_DOUBLE_LEFT_CLICK_PATH']))
    elif tutorial_exercise == "right_click":
        tutorial_passage = json.load(
            open(tutorial_config['TUTORIAL_RIGHT_CLICK_PATH']))
    elif tutorial_exercise == "next_target":
        tutorial_passage = json.load(
            open(tutorial_config['TUTORIAL_NEXT_TARGET_PATH']))
    elif tutorial_exercise == "previous_target":
        tutorial_passage = json.load(
            open(tutorial_config['TUTORIAL_PREVIOUS_TARGET_PATH']))
    elif tutorial_exercise == "overwrite_span":
        tutorial_passage = json.load(
            open(tutorial_config['TUTORIAL_OVERWRITE_SPAN_PATH']))
    elif tutorial_exercise == "reassign_deselect_span":
        tutorial_passage = json.load(
            open(tutorial_config['TUTORIAL_REASSIGN_DESELECT_DIFFERENCE_PATH']))
    elif tutorial_exercise == "correcting_mistake_1":
        tutorial_passage = json.load(
            open(tutorial_config['TUTORIAL_CORRECTING_MISTAKE_1_PATH']))
    elif tutorial_exercise == "correcting_mistake_2":
        tutorial_passage = json.load(
            open(tutorial_config['TUTORIAL_CORRECTING_MISTAKE_2_PATH']))
    elif tutorial_exercise == "nested_span_1":
        tutorial_passage = json.load(
            open(tutorial_config['TUTORIAL_NESTED_SPAN_1_PATH']))
    elif tutorial_exercise == "nested_span_2":
        tutorial_passage = json.load(
            open(tutorial_config['TUTORIAL_NESTED_SPAN_2_PATH']))
    elif tutorial_exercise == "example_1":
        tutorial_passage = json.load(
            open(tutorial_config['EXAMPLE_1']))
    elif tutorial_exercise == "example_2":
        tutorial_passage = json.load(
            open(tutorial_config['EXAMPLE_2']))
    elif tutorial_exercise == "example_3":
        tutorial_passage = json.load(
            open(tutorial_config['EXAMPLE_3']))
    elif tutorial_exercise == "example_4":
        tutorial_passage = json.load(
            open(tutorial_config['EXAMPLE_4']))
    elif tutorial_exercise == "example_5":
        tutorial_passage = json.load(
            open(tutorial_config['EXAMPLE_5']))
    elif tutorial_exercise == "views_bad":
        tutorial_passage = json.load(
            open(tutorial_config['EXAMPLE_VIEWS_BAD']))
    elif tutorial_exercise == "olympic_games":
        tutorial_passage = json.load(
            open(tutorial_config['EXAMPLE_OLYMPIC_GAMES']))
    elif tutorial_exercise == "washington":
        tutorial_passage = json.load(
            open(tutorial_config['EXAMPLE_WASHINGTON']))
    elif tutorial_exercise == "new_york":
        tutorial_passage = json.load(open(tutorial_config['EXAMPLE_NEW_YORK']))
    elif tutorial_exercise == "trump":
        tutorial_passage = json.load(open(tutorial_config['EXAMPLE_TRUMP']))
    elif tutorial_exercise == "orwell":
        tutorial_passage = json.load(open(tutorial_config['EXAMPLE_ORWELL']))
    elif tutorial_exercise == "potter":
        tutorial_passage = json.load(open(tutorial_config['EXAMPLE_POTTER']))

    resp = Response(json.dumps(tutorial_passage))
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp