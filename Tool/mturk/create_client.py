import boto3
from config_hit import CFG_HIT

def create_client(task_type="MAIN"):
    cfg_hit = CFG_HIT["TUTORIAL"] if task_type == "TUTORIAL" else CFG_HIT["MAIN"]

    if cfg_hit["CREATE_HITS_IN_LIVE"]:
        mturk_environment = {
            "endpoint": "https://mturk-requester.us-east-1.amazonaws.com",
            "preview": "https://www.mturk.com/mturk/preview",
            "manage": "https://requester.mturk.com/mturk/manageHITs",
            "reward": cfg_hit["LIVE_REWARD"],
        }
    else:
        mturk_environment = {
            "endpoint": "https://mturk-requester-sandbox.us-east-1.amazonaws.com",
            "preview": "https://workersandbox.mturk.com/mturk/preview",
            "manage": "https://requestersandbox.mturk.com/mturk/manageHITs",
            "reward": cfg_hit["SANDBOX_REWARD"],
        }

    # get client and check balance
    session = boto3.Session(profile_name=None)
    client = session.client(
        service_name='mturk',
        region_name='us-east-1',
        endpoint_url=mturk_environment['endpoint'],
        aws_access_key_id=CFG_HIT["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=CFG_HIT["AWS_SECRET_ACCESS_KEY"],
    )
    print("Your account balance is {}".format(client.get_account_balance()['AvailableBalance']))
    
    return mturk_environment, client