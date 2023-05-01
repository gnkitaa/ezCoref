import os
here = os.path.dirname(os.path.realpath(__file__))

CFG_QUALIFICATION = {
    "ID_1": ""
    "ID_2": ""
    "QUALIFIED": {
        "VALUE":            1,
        "EMAIL_SUBJECT":    "Coreference Annotation Qualification",
        "EMAIL_MSG":        "Congratulations! You have successfully completed the coreference annotation tutorial. You are now qualified and can access multiple HITs titled “Large-scale Coreference Annotation Task” or “Large-scale Coreference Annotation Task” (paid $1 per HIT).", 
    },
    "UNQUALIFIED": {
        "VALUE":            0,
    }
}

CFG_HIT = {
    "AWS_ACCESS_KEY_ID":            "", 
    "AWS_SECRET_ACCESS_KEY":        "", 
    "PERCENTAGE_APPROVED":          99,  
    "HITS_APPROVED":                10000, 
    "WORKER_LOCATIONS":             ["US", "CA", "NZ", "AU", "GB"],
}

# tutorial hits
CFG_HIT["TUTORIAL"] = {
    "CREATE_HITS_IN_LIVE":          True,  # True means really launching, False means free sandbox testing
    "QUESTION_PATH":                f"{here}/prompt_tutorial.xml", #ToDo: change name of task in xml file
    "TITLE":                        "Coreference Tutorial", 
    "KEYWORDS":                     "coreference, annotation",
    "DESCRIPTION":                  "Label words and phrases that refer to the same person or object",
    "LIVE_REWARD":                  "4.50",
    "SANDBOX_REWARD":               "0.01", # dummy
    "N_HITS":                       1,
    "MAX_ASSIGNMENTS":              9, 
    "LIFE_TIME_IN_SECS":            100*86400, 
    "ASSIGNMENT_DURATION_IN_SECS":  7200,   # 2 hour
    "AUTO_APPROVAL_DELAY_IN_SECS":  86400,  # 1 day [86400: 1 day]
    "PREV_WORKER_QUALIFICATION":    "",
}


# main hits
CFG_HIT["MAIN"] = {
    "CREATE_HITS_IN_LIVE":          True,  # True means really launching, False means free sandbox testing
    "QUESTION_PATH":                f"{here}/prompt_main.xml", #ToDo: change name of task in xml file
    "TITLE":                        "Large-scale Coreference Annotation Task",
    "KEYWORDS":                     "coreference, sentence, annotation",
    "DESCRIPTION":                  "Label words and phrases that refer to the same person or object",
    "LIVE_REWARD":                  "1.00",
    "SANDBOX_REWARD":               "0.01", # dummy
    "MAX_ASSIGNMENTS":              5, #5
    "LIFE_TIME_IN_SECS":            100*86400, #100 days, 604800, # 604800=7 days, life of a HIT on MTURK market
    "ASSIGNMENT_DURATION_IN_SECS":  3600, #3600,   # 1 hour
    "AUTO_APPROVAL_DELAY_IN_SECS":  86400, # 1 day
    "NEW_HIT_EMAIL_SUBJECT":        "Coreference Annotation New HITs Available", #This is not being used currently
    "NEW_HIT_EMAIL_MSG":            '''Thank you for participating in the Large-scale Coreference Annotation project! We have just launched NEW HITs (paid $1 per HIT). Look for "Large-scale Coreference Annotation Task." Please note that you are one of a small number of people invited to participate in this study!''',  # TODO email message sent when new HITs are released, #This is not being used currently
}