import React from "react";
import { Modal, Button, Image } from "react-bootstrap";
import corefs from './corefs.jpg'
import "./AnnotationPage.css";


export function MainIntroductionModal(props) {
	return (
	<Modal show={props.show} scrollable={true}>
		<Modal.Header>
			<Modal.Title>Coreference Annotation Task</Modal.Title>
		</Modal.Header>
		<Modal.Body>
			<p>
			Welcome to the coreference annotation task. If you need to review the tutorial, follow this <a href="https://docs.google.com/presentation/d/1IlGuQtW_S07xzZWbYZj1Gi4VcZY9-dCO_4C7P8lKD2c/edit?usp=sharing" target="_blank" ><u>link</u></a> before you begin. 
			</p>
			<p>
			
			</p>
		</Modal.Body>
		<Modal.Footer>
			<Button variant="secondary" onClick={props.closeAndNext}>
				Let's get started.
			</Button>
		</Modal.Footer>
	</Modal>
);
}