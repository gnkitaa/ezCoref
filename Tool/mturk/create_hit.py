import sys
sys.path.append('../')
import argparse, os, pickle
from config_hit import CFG_QUALIFICATION, CFG_HIT
from create_client import create_client
from annotation_manager import AnnotationManager

parser = argparse.ArgumentParser()
parser.add_argument("--exp", type=str, required=True, help="experiment name")
parser.add_argument("--task_type", type=str, required=True, help="TUTORIAL or MAIN")
args = parser.parse_args()

annotation_mngr_path = f"../experiments/{args.exp}/AnnotationMngr.pkl"
assert os.path.exists(annotation_mngr_path)
assert args.task_type in ["TUTORIAL", "MAIN"]
cfg_hit = CFG_HIT[args.task_type]
mturk_environment, client = create_client(args.task_type)

if args.task_type == "TUTORIAL":
    n_hits = cfg_hit["N_HITS"]
else:
    with open(annotation_mngr_path, 'rb') as f:      
        annotation_manager = pickle.load(f)
        n_hits = annotation_manager.n_chunks


worker_requirements = [
    {
        'QualificationTypeId': '000000000000000000L0',
        'Comparator': 'GreaterThanOrEqualTo',
        'IntegerValues': [CFG_HIT["PERCENTAGE_APPROVED"]],
        'RequiredToPreview': False,
    }, # percent assignments approved
    {
        'QualificationTypeId': '00000000000000000040',
        'Comparator': 'GreaterThanOrEqualTo',
        'IntegerValues': [CFG_HIT["HITS_APPROVED"]],
        'RequiredToPreview': False,
    }, # number of hits approved
    {
        'QualificationTypeId': '00000000000000000071',
        'Comparator': 'In',
        'LocaleValues': [{'Country': ct} for ct in CFG_HIT["WORKER_LOCATIONS"]],
        'RequiredToPreview': True,
    }, # locale: https://docs.aws.amazon.com/AWSMechTurk/latest/AWSMturkAPI/ApiReference_LocaleDataStructureArticle.html
]


#Need to uncomment these for actual run
if args.task_type == "TUTORIAL":
    #Tutorial Participated should be false.
    worker_requirements.append({
        'QualificationTypeId': CFG_HIT["TUTORIAL"]['PREV_WORKER_QUALIFICATION'], 
        'Comparator': 'DoesNotExist',
        'RequiredToPreview': True,
    })

        
if args.task_type == "MAIN":
    worker_requirements.append({
        'QualificationTypeId': CFG_QUALIFICATION["ID_1"],
        'Comparator': 'EqualTo',
        'IntegerValues': [CFG_QUALIFICATION["QUALIFIED"]["VALUE"]],
        'RequiredToPreview': False,
    })
    
    worker_requirements.append({
        'QualificationTypeId': CFG_QUALIFICATION["ID_2"],
        'Comparator': 'EqualTo',
        'IntegerValues': [CFG_QUALIFICATION["QUALIFIED"]["VALUE"]],
        'RequiredToPreview': False,
    })

# create hit, data structure described here
#https://docs.aws.amazon.com/AWSMechTurk/latest/AWSMturkAPI/ApiReference_HITDataStructureArticle.html
for i in range(n_hits):
    response = client.create_hit(
        MaxAssignments=cfg_hit["MAX_ASSIGNMENTS"],
        AutoApprovalDelayInSeconds=cfg_hit["AUTO_APPROVAL_DELAY_IN_SECS"],
        LifetimeInSeconds=cfg_hit["LIFE_TIME_IN_SECS"],
        AssignmentDurationInSeconds=cfg_hit["ASSIGNMENT_DURATION_IN_SECS"],
        Reward=mturk_environment["reward"],
        Title=cfg_hit["TITLE"],
        Keywords=cfg_hit["KEYWORDS"],
        Description=cfg_hit["DESCRIPTION"],
        Question=open(cfg_hit["QUESTION_PATH"], "r").read(),
        QualificationRequirements=worker_requirements,
    )

    hit_id = response['HIT']['HITId']
    print(f"\nCreated HIT {i+1}: {hit_id}\n")

hit_type_id = response['HIT']['HITTypeId']
print(f"Work the HIT: {mturk_environment['preview']}?groupId={hit_type_id}\n")

print(f"Results: {mturk_environment['manage']}\n")
print("-"*100)


#notify qualified workers when new hits are available
if args.task_type == "MAIN":
    granted_qualifications = client.list_workers_with_qualification_type(
        QualificationTypeId=CFG_QUALIFICATION["ID_1"],
    )['Qualifications']
    
    for granted_qualification in granted_qualifications:
        if granted_qualification['IntegerValue'] == CFG_QUALIFICATION["QUALIFIED"]["VALUE"]:
            client.notify_workers(
                Subject=CFG_HIT["MAIN"]["NEW_HIT_EMAIL_SUBJECT"],
                MessageText=CFG_HIT["MAIN"]["NEW_HIT_EMAIL_MSG"],
                WorkerIds=[granted_qualification['WorkerId']],
             )
