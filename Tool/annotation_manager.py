from datetime import datetime
import json
import pickle
import os
import numpy as np


class AnnotationManager(object):
	"""
	Each doc is split into multiple chunks. Each chunk is assigned to multiple different annotators.
	Solution:
	   A HIT corresponds to a chunk. Launch n_chunks HITs.
	   Each HIT has multiple mturk assignments, giving us multiple annotations for each chunk.
	   Potential shortcoming: A worker can accept any HIT and see a random chunk from the middle of a document.
	Outputs:
	- experiments
		- AnnotationMngr.pkl
			- self.docs_dir = ...
			- self.docs = [{"doc_name": str, "chunk_names": [str], "n_chunks": int}]
			- self.unassociated_chunks = [(doc_i, chunk_j)] # a list of chunks not associated with HITs
			- self.hit_id_to_chunk = {hit_id: (doc_i, chunk_j)}
		- annotators
			- annotator_id.json {
					"tutorial": [{}],
					"submissions": [{}],
				}
		- annotations
			- doc
				- doc_idx.json [{}]
	"""

	def __init__(self, exp_name, exp_dir, tutorial_config, docs_dir, n_assignments_per_chunk):

		# annotation manager config
		self.exp_name = exp_name
		self.annotation_mngr_path = os.path.join(exp_dir, 'AnnotationMngr.pkl')
		self.annotators_dir = '/home/ankita/CoreferenceOracleVersion/Coreference/experiments/oracle/annotators' #os.path.join(exp_dir, "annotators")
		os.makedirs(self.annotators_dir, exist_ok=True)
		self.annotations_dir = os.path.join(exp_dir, "annotations")
		self.tutorial_config = tutorial_config
		self.docs_dir = docs_dir
		self.n_assignments_per_chunk = n_assignments_per_chunk

		# docs and chunks
		# input directory structure: docs_dir/doc/doc_#.json
		self.docs = []
		self.n_chunks = 0
		for doc_name in os.listdir(docs_dir):
			doc_dir = os.path.join(docs_dir, doc_name)
			if not os.path.isdir(doc_dir): continue

			chunk_names = [chunk_name for chunk_name in os.listdir(doc_dir) if chunk_name.endswith('.json')]
			chunk_suffixes = [int(chunk_name.split('_')[-1][:-5]) for chunk_name in chunk_names]
			chunk_names = [chunk_name for _, chunk_name in sorted(zip(chunk_suffixes, chunk_names), key=lambda p: p[0])]

			if chunk_names:
				doc = {
					"doc_name": doc_name,
					"chunk_names": chunk_names,
					"n_chunks": len(chunk_names),
				}
				self.docs.append(doc)
				self.n_chunks += doc["n_chunks"]

		# tracking progress
		self.unassociated_chunks = [(i, j) for i in range(len(self.docs)) for j in range(self.docs[i]["n_chunks"])]
		self.hit_id_to_chunk = {}

		self.save_annotation_mngr()

	def save_annotation_mngr(self):
		# save this class, which includes metadata
		with open(self.annotation_mngr_path, 'wb') as f:
			pickle.dump(self, f)


	def create_annotator(self, hit_id, assignment_id, annotator_id, annotations, start_time, end_time):

		annotator_profile_path = os.path.join(self.annotators_dir, annotator_id+'.json')
		if os.path.exists(annotator_profile_path):
			print('Annotator profile exists.')
			with open(annotator_profile_path, "r") as f:
				annotator_profile = json.load(f)
		else:
			print('Creating annotator profile.')
			annotator_profile = {"annotator_id": annotator_id, "tutorial": [], "submissions": []}

		if "tutorial" not in annotator_profile:
			annotator_profile["tutorial"] = []
            
		annotator_profile["tutorial"].append({
			"hit_id": hit_id, "assignment_id": assignment_id, "annotations": annotations,
			"start_time": start_time, "end_time": end_time
		})

		print('Saving annotator profile: ', annotator_profile)
		with open(annotator_profile_path, "w") as f:
			json.dump(annotator_profile, f)
            


	def get_chunk(self, hit_id):

		if hit_id in self.hit_id_to_chunk:
			i, j = self.hit_id_to_chunk[hit_id]
		else:
			random_id = np.random.randint(0, len(self.unassociated_chunks))
			i, j = self.unassociated_chunks.pop(random_id)
			self.hit_id_to_chunk[hit_id] = (i, j)
			self.save_annotation_mngr()

		with open(os.path.join(
				self.docs_dir,
				self.docs[i]["doc_name"],
				self.docs[i]["chunk_names"][j]
		), 'r') as f:
			doc = json.load(f)     

		return {"doc_id": i, "chunk_id": j, "doc": doc}

	def debug_chunk(self, doc, chunk):

		chunk_file = os.path.join(self.docs_dir, doc, chunk)
		if not os.path.exists(chunk_file): return None
		with open(chunk_file, 'r') as f:
			return json.load(f)

	def submit_annotations(self, hit_id, assignment_id, annotator_id, doc_id, chunk_id, annotations, start_time, end_time):

		# update annotator profile
		annotator_profile_path = os.path.join(self.annotators_dir, annotator_id+'.json')
        
		if not os.path.exists(annotator_profile_path):
			annotator_profile = {'annotator_id':annotator_id, 'tutorial': [], 'submissions':[]}
		else:
			with open(annotator_profile_path, "r") as f:
				annotator_profile = json.load(f)
                
		date_time = datetime.utcnow().strftime("%d/%m/%Y %H:%M:%S")
		if "submissions" not in annotator_profile:
			annotator_profile["submissions"] = []
		annotator_profile["submissions"].append({
			"doc_id": doc_id,
			"doc_name": self.docs[doc_id]["doc_name"],
			"chunk_id": chunk_id,
			"hit_id": hit_id,
			"assignment_id": assignment_id,
			"start_time": start_time,
			"end_time":  end_time,
		})
		with open(annotator_profile_path, "w") as f:
			json.dump(annotator_profile, f)

		# save annotations
		chunk_annotations_path = os.path.join(
				self.annotations_dir,
				self.docs[doc_id]["doc_name"],
				self.docs[doc_id]["chunk_names"][chunk_id]
		)
		if os.path.exists(chunk_annotations_path):
			with open(chunk_annotations_path, "r") as f:
				chunk_annotations = json.load(f)
		else:
			chunk_annotations = []

		chunk_annotations.append({
			"annotations": annotations,
			"annotator_id": annotator_id,
			"hit_id": hit_id,
			"assignment_id": assignment_id,
			"start_time": start_time,
			"end_time":  end_time,
		})
		os.makedirs(os.path.dirname(chunk_annotations_path), exist_ok=True)
		with open(chunk_annotations_path, "w") as f:
			json.dump(chunk_annotations, f)