import argparse
from config_hit import CFG_HIT
from create_client import create_client
import hashlib, os, json
from xml.dom.minidom import parseString

parser = argparse.ArgumentParser()
parser.add_argument("--exp", type=str, required=True, help="experiment name")
parser.add_argument("--task_type", type=str, required=True, help="TUTORIAL or MAIN")

args = parser.parse_args()
assert args.task_type in ["TUTORIAL", "MAIN"]
annotators_dir = f"../experiments/{args.exp}/annotators"
_, client = create_client(task_type=args.task_type)


reviewable_hits = client.list_reviewable_hits()

for reviewable_hit in reviewable_hits["HITs"]:
    hit_id = reviewable_hit["HITId"]
    hit = client.get_hit(HITId=hit_id)
    print('Hit {} status: {}'.format(hit_id, hit['HIT']['HITStatus']))

    response = client.list_assignments_for_hit(
        HITId=hit_id,
        AssignmentStatuses=['Submitted', 'Approved'],
        MaxResults=20
    )

    assignments = response["Assignments"]


    counter = 0
    response_fields = ['feedback_code']

    for assignment in assignments:
        if assignment['AssignmentStatus'] == 'Approved':
            print("This HIT has already been approved.")
        elif assignment['AssignmentStatus'] == 'Submitted':
            annotator_id = assignment['WorkerId']
            assignment_id = assignment['AssignmentId']
            hit_id = assignment['HITId']

            annotator_profile_path = f"{annotators_dir}/{annotator_id}.json"
            print(annotator_profile_path)
            assert os.path.exists(annotator_profile_path), "annotator data not found with ID: " + annotator_id

            with open(annotator_profile_path, "r") as f:
                annotator_profile = json.load(f)

            # TODO: how to review/evaluate/analyze/approve answers
            # TODO: modify if we have more than one textbox from mturk; maybe we have a second textbox for feedback

            answer_xml = parseString(assignment['Answer'])
            answer = answer_xml.getElementsByTagName('FreeText')

            response_dict = {}
            for a, r in zip(answer, response_fields):
                only_answer = " ".join(t.nodeValue for t in a.childNodes if t.nodeType == t.TEXT_NODE)
                response_dict[r] = only_answer

            for hits in annotator_profile["submissions"]:
                if (hits["assignment_id"]==assignment_id) and (hits["hit_id"]==hit_id):
                    hits['survey_response'] = response_dict

            with open(annotator_profile_path, "w") as f:
                json.dump(annotator_profile, f)

            counter+=1

            # TODO: what if code is wrong
            code = (str(hit_id) + str(assignment_id) + str(annotator_id) + "corefAnnotatn").encode('utf-8')
            code = hashlib.sha256(code).hexdigest()

            submitted_code = only_answer.split('|')[1].strip(" ")
            if submitted_code != code:
                print('code mismatch')
                print('submitted: ', submitted_code)
                print('actual: ', code)
                #continue

            # Approve the assignment (if it hasn't already been approved)
            #print('Approving Assignment {}'.format(assignment_id))
            #client.approve_assignment(AssignmentId=assignment_id)
    print("updated feedback for {} assignments".format(counter))