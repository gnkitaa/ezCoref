from create_client import create_client
_, client = create_client()
    
WORKER_IDS = []

for worker in WORKER_IDS:
    response = client.disassociate_qualification_from_worker(
        WorkerId=worker,
        QualificationTypeId='',
        Reason='Tutorial Participation Required.'
    )
    print(response)