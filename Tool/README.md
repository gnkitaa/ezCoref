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



## Prepare a directory to save annotations
For any new experiment, the annotations are saved under `experiments/exp_name` directory. Make sure that this directory is empty before running a new annotation round.

After an annotation round is completed, this directory will contain
- `annotator manager pickle file`: A pickle file that stores the annotation status.
- `annotator profiles`: The tool maintains a dictionary for each annotator with keys: "annotator_id", "submissions", "tutorial"
- `annotations`: The mention-level annotations

In case you are collecting new annotations and you are allowing annotators from previous annotation rounds, make sure that the annotator profiles of such annotators are included in the `experiments/exp_name` directory before running the annotation round. 


## Run Backend
- Create a tmux session by `tmux new -s backend`.
- `waitress_server.py`: set the backend port, e.g. `8000`, and
change the host to the server name, e.g. `azkaban.cs.umass.edu`. 
- In `main.py`, set `EXP_NAME`; in `config_exp.py`, set the experiment config.
- Run the backend by `python waitress_server.py`.
- `ctrl+b` then `d` to detach from the tmux session. 
To attach back later, `tmux a -t backend`.

The Flask app is run out of `main.py`, 
which has functions for interacting with the frontend.
`send_texts` uses the annotator info to decide which texts to send to the frontend.
`receive_annotations` receives annotations from the frontend and saves them.
Annotators and annotations are managed by the `AnnotationManager` class in `annotation_manager.py`.

## Run Frontend
- Create another tmux session by `tmux new -s frontend`. 
- `coref-frontend/src/components/{Tutorial,AnnotationPage}.js`: 
change all urls according to the backend server and port. 
- `coref-frontend/package.json`: set the port for the frontend, e.g. `8001`.
- For development, In `coref-frontend`, `npm install` and `npm start` to start development. 
The frontend is available at `http://SERVER:FRONTEND_PORT`, e.g. `http://azkaban.cs.umass.edu:8001`.
- For launching, In `coref-frontend` run following commands: npm run build, npx serve -s build -l 8001
- Detach from the tmux session.

## Amazon Mechanical Turk (MTurk)
`mturk` contains MTurk-related python scripts. 
The `Developer Guide` and `API Reference` [documents](https://docs.aws.amazon.com/mturk/index.html) 
how to programmatically use MTurk. The python API is 
[here](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/mturk.html).

- Before creating new HITs (Human Intelligence Tasks) in the MTurk crowdsourcing marketplace,
 change the server and port in `mturk/*.xml` and modify `mturk/config_hit.py`.
- Make sure qualifications are properly assigned.
- To launch tutorial HITs, in the mturk directory, adjust qualifications and so forth in `create_hit.py` and run
```
python create_hit.py --exp {EXP_NAME} --task_type {TUTORIAL/MAIN}
```
- To review tutorial HIT and obtain user feedback, run
```
python review_assignments.py --exp {EXP_NAME} --task_type {TUTORIAL/MAIN} --hit_id hit_id_string
```
- Check saved tutorial annotations and user feedback at: `experiments/{EXP_NAME}/annotators`.
