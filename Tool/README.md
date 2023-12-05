# ezCoref Annotation Tool
Welcome to our coreference annotation tool.


## Outline

- [Setup](#setup)
- [Data Preparation](#data-preparation)
- [Annotation Directory](#prepare-a-directory-to-save-annotations)
- [Running Backend](#running-backend)
- [Running Frontend](#running-frontend)
- [Integration with AMT](#integration-with-amt)


## Setup

We recommend setting up a Conda environment:

```bash
conda create --name ezcoref python=3.6 conda-build
```

Then, install required packages:

```bash
pip install -r requirements.txt
```

Next, call `conda develop .` from the root of this repository.

Then, download the spaCy's model for English by running 

```
python -m spacy download en_core_web_lg 
```

If you are working with other langauges, please download the respective model.

## Data Preparation
- Save the documents to annotated at: `Tool/static/data/main/`.
- Make a seperate folder for each dataset. Make a .json file within dataset folder for each document to be annotated. If each document is longer than 150 words, split the document into chunks and create a .json file for each chunk. 
- The structure of json file is as follows: 
[
    {
        "doc_id": "11_alices_adventures_in_wonderland_brat_0",
        "sent_id": 0,
        "targets": [],
        "chunk_id": 0,
        "tokens": [
                      {
                        "word": "Alice",
                        "left_offset": 0,
                        "right_offset": 1,
                        "candidate": true,
                        "target": true,
                        "pos": "PROPN"
                      },
                      {
                        "word": "ate",
                        "left_offset": 0,
                        "right_offset": 1,
                        "candidate": false,
                        "target": false,
                        "pos": "VERB"
                      },
                      {
                        "word": "apple",
                        "left_offset": 0,
                        "right_offset": 1,
                        "candidate": true,
                        "target": true,
                        "pos": "NOUN"
                      }
                 ]
   }
   
   {
    "doc_id": "11_alices_adventures_in_wonderland_brat_0",
    "sent_id": 1,
    "targets": [],
    "chunk_id": 0,
    "tokens": [
                      {
                        "word": "She",
                        "left_offset": 0,
                        "right_offset": 1,
                        "candidate": true,
                        "target": true,
                        "pos": "PRON"
                      },
                      {
                        "word": "drank",
                        "left_offset": 0,
                        "right_offset": 1,
                        "candidate": false,
                        "target": false,
                        "pos": "VERB"
                      },
                      {
                        "word": "her",
                        "left_offset": 0,
                        "right_offset": 1,
                        "candidate": true,
                        "target": true,
                        "pos": "PRON"
                      },
                      {
                        "word": "tea",
                        "left_offset": -1,
                        "right_offset": 1,
                        "candidate": true,
                        "target": true,
                        "pos": "NOUN"
                      }
             ]
    }
    
]

Each sentence is represented by a dictionary. Each sentence contains a list of tokens. Each token specifies word text to show on interface, its part of speech tag, the boundary spans (left and right offsets) and whether this token should be considered as mention or not. A token can be part of longer span, in which case the offsets are relative to the first token of the span (e.g., see the span 'her tea' in above example).

Note: ezCoref tool is not dependent on any particular mention detection algorithm and thus any custom algorithm and tokenizer can be supported. 

If you would like to use the mention detection algorithm used in the paper, refer to section 'Mention detector'

## Mention Detector

## Prepare a directory to save annotations
For any new experiment, the annotations are saved under `experiments/exp_name` directory. Create an empty folder with name `exp_name` in the `experiments directory`. Make sure that this folder is empty before running a new annotation round. For instance, you can use the following command to create a `test` folder.

- `mkdir -r experiments/test`


## Specify configurations
Specify the configurations of your experiment in the `config_exp.py` file. 

Create a new entry in the `config_exp.py` with `exp_name` as the key and following values, specifying configurations for the experiment. For instance, for `exp_name`=`test`

CFG_EXP['test'] = {
    "EXPERIMENT_DIR":           './experiments/test', # absolute path
    'TUTORIAL_CONFIG':          'static/data/tutorial/tutorial_config.json', #path to tutorial config directory
    'DOCS_DIR':                 'static/data/main', # path to documents which are to be annotated 
    'N_ASSIGNMENTS_PER_CHUNK':  3 #number of annotations to collect per document
}


## Run Backend
- Create a tmux session by running the command:`tmux new -s backend`.
- In the `waitress_server.py` file, set the backend port, e.g. `8000`, and change the 'host' to the name of the server, where you wish to launch the annotation tool (e.g. `xyz.abc.edu`). 
- In the `main.py` file, specify `EXP_NAME` (e.g., `test`).
- To run the backend, use the command: `python waitress_server.py`.
- You can detach from the tmux session by using `ctrl+b` then `d`. Running the backend in a tmux session will ensure your backend keeps running. You can also attach the backend session back later by the command: `tmux a -t backend`.

The Flask app is run via the `main.py` file, which contains functions to interact with the frontend.


## Run Frontend
- Create another tmux session by running the command: `tmux new -s frontend`. 
- Change the server name and port in the following files, to match the server name (e.g. `xyz.abc.edu`) and port (e.g. `8000`) used when running backend.  
---`coref-frontend/src/components/Tutorial.js`
---`coref-frontend/src/components/AnnotationPage.js`

- Specify the port to host the frontend (e.g. `8001`) in `coref-frontend/package.json` file on line 25.
- To launch the frontend, navigate to `coref-frontend` directory and run `npm install` followed by `npm start`. 
- Detach from the tmux session by using `ctrl+b` then `d`.
- The frontend will be available at `http://servername:frontend_port`, e.g. `http://xyz.abc.edu:8001`.
- The interactive tutorial will be available at `http://servername:frontend_port/tutorial`, e.g. `http://xyz.abc.edu:8001/tutorial`.
- A new passage to annotate can be accessed at `http://servername:frontend_port/passage`, e.g. `http://xyz.abc.edu:8001/passage`.


## Amazon Mechanical Turk (MTurk)
The `mturk` folder provides python scripts related to MTurk. 
For more details, refer to the `Developer Guide` and `API Reference` [documents](https://docs.aws.amazon.com/mturk/index.html) 
and how to use MTurk via python API [here](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/mturk.html).

We have provided sample XML files to launch a annotation task on AMT (for both tutorial and main annotation task). 
- Before creating new HITs (Human Intelligence Tasks) at the MTurk crowdsourcing marketplace, modify the server and port in `mturk/*.xml` (line 58) to point to the correct path at which the tool is running.
- Modify `mturk/config_hit.py` to specify various parameters, like cost per HIT, approval criteria, qualification ids etc. Make sure qualifications are properly assigned.
- To launch tutorial HITs, in the mturk directory, adjust qualifications in `create_hit.py` and run
```
python create_hit.py --exp {EXP_NAME} --task_type {TUTORIAL/MAIN}
```
- To review tutorial HIT and obtain user feedback, run
```
python review_assignments.py --exp {EXP_NAME} --task_type {TUTORIAL/MAIN} --hit_id hit_id_string
```
- Check saved tutorial annotations and user feedback at: `experiments/{EXP_NAME}/annotators`.


## Collected Annotations 
- All the annotations are saved in the `experiments/exp_name` directory. 
- After an annotation round is completed, this directory will contain
    - `AnnotationMngr.pkl`: A pickle file that stores the annotation status.
    - `annotators`: This folder saves annotator profiles. The tool maintains a dictionary for each annotator with keys: "annotator_id", "submissions", "tutorial".
    - `annotations`: The mention-level annotations collected for each document.
- `annotators` and `annotations` are managed by the `AnnotationManager` class in `annotation_manager.py`.
- Tip: In case you are collecting new annotations and you are allowing annotators from previous annotation rounds, make sure that the annotator profiles of such annotators are included in the `experiments/exp_name` directory before running the annotation round. 
- `send_texts` uses the annotator info to decide which texts to send to the frontend.
- `receive_annotations` receives annotations from the frontend and saves them.
