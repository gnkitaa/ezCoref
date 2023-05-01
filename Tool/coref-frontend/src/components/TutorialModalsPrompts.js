import React from "react";
import { Modal, Button, Image } from "react-bootstrap";
import corefs from './corefs.jpg'
import "./AnnotationPage.css";


window.onload = function(){
	if (document.getElementById("btnPrint")){
		document.getElementById("btnPrint").onclick = function () {
			printElement(document.getElementById("printThis"));
		}
	}
}


export function printElement(elem){
	var domClone = elem.cloneNode(true);
	
	var $printSection = document.getElementById("printSection");
	
	if (!$printSection) {
		var $printSection = document.createElement("div");
		$printSection.id = "printSection";
		document.body.appendChild($printSection);
	}
	
	$printSection.innerHTML = "";
	$printSection.appendChild(domClone);
	window.print();
}


export function ConsentModal(props) {
	return (
	<Modal show={props.show} scrollable={true} id="printThis">
		<Modal.Header>
			<Modal.Title>Consent Form</Modal.Title>
		</Modal.Header>
		<Modal.Body>
			<p>You are being invited to participate in a research study titled <b>Coreference Annotation Task</b>.</p>
			
			<p>This study is being conducted by Brendan O’Connor, Mohit Iyyer, and Ankita Gupta from the University of Massachusetts Amherst.
			You are being invited for the study through the Amazon Mechanical Turk platform.</p>
			
			<p><b>Why are we doing this research study?</b><br/>
			The purpose of this research study is to better understand coreference resolution and collect a dataset to advance the development of models for coreference resolution.</p>
 
 			<p>
			<b>Who can participate in this research study?</b><br/>
 			Any adult worker on the Amazon Mechanical Turk platform who speaks English (task restricted to users from U.S., Canada, New Zealand, Australia, U.K), has an approval rate of 99% or above and has completed at least 10,000 tasks prior to this study.
 			</p>
 			
			<p>
			<b>What will I be asked to do and how much time will it take?</b><br/>
 			If you agree to take part in this study, you will be asked to complete this paid tutorial. The tutorial will familiarize you with the platform and the concept of coreferences. Upon successful completion of the tutorial, you will be granted access to another AMT task containing the link to the main annotation task. In the main task, the annotation interface will show you documents (one at a time) with spans of text marked for the annotations. You will be asked to mark spans that refer to the same entity (e.g., “Mark” and “he”).  A single document will take 20-30 minutes to complete. You will be given a choice of how many documents you want to annotate (by accepting new Human Intelligence Task (HIT) at AMT) subject to availability. For each HIT, you will be provided with a code that must be entered on the HIT page of AMT in order to submit the HIT successfully. You will be compensated for every HIT submitted successfully.   
  			</p>

			<p>
			<b>Will being in this research study help me in any way?</b><br/>
			You may not directly benefit from this research; however, we hope that your participation in the study may be useful to you in learning about coreferences.
			</p>

			<p>
			<b>What are my risks of being in this research study?</b><br/>
			We believe there are minimal risks associated with this research study; however, a risk of breach of confidentiality always exists, and we have taken the steps to minimize this risk as outlined below.
 			</p>

			<p>
			<b>How will my personal information be protected?</b><br/>
			To the best of our ability, your answers in this study will remain confidential.  Collected personal information will be anonymized and stored on a password-protected server in NLP research lab at UMass Amherst, accessible only by the researchers.  The data will be analyzed by researchers on password-protected research lab computers.  The data will be kept indefinitely, and a de-identified version of the data may be shared for research purposes.
			</p>											
			
			<p>
			<b>Will I be given any money or other compensation for being in this research study?</b><br/>
			You will be compensated in the standard manner through the Amazon Mechanical Turk crowdsourcing platform, with the amount specified in the Amazon Mechanical Turk interface.
			</p>

			<p>
			<b>What happens if I say yes, but I change my mind later?</b><br/>
			You do not have to participate in this study if you do not want to. If you agree to be in the study, but later change your mind, you may drop out at any time. There are no penalties or consequences of any kind if you decide that you do not want to participate.
			</p>

			<p>
			<b>Who can I talk to if I have questions?</b><br/>
			If you have questions about this project or if you have a research-related problem, you may contact the researcher <a href="mailto:ankitagupta@cs.umass.edu"><i>Ankita Gupta</i></a>, and faculty sponsor <a href="mailto:brenocon@cs.umass.edu"><i>Brendan O'Connor</i></a>.<br/>
			<br/>
			If you have any questions concerning your rights as a research subject, you may contact the <i>University of Massachusetts Amherst Human Research Protection Office (HRPO)</i> at (413) 545-3428 or <a href="mailto:humansubjects@ora.umass.edu">humansubjects@ora.umass.edu</a>.
			</p>

			
			<p>
				<b>By accepting this task, you are indicating that you are at least 18 years old, have read this consent form and agree to participate in this research study.</b> 
			</p>

			<p>
			Please print a copy of this page for your records.
			</p>
		</Modal.Body>
		<Modal.Footer>
			<Button variant="secondary" id="btnPrint" type="button" class="btn btn-default">
				Print
			</Button>

			<Button variant="secondary" onClick={props.closeAndNext}>
				I agree.
			</Button>
			
		</Modal.Footer>
	</Modal>
	);
}


export function TutorialIntroductionModal(props) {
		return (
        <Modal show={props.show} scrollable={true}>
            <Modal.Header>
                <Modal.Title>Coreference Tutorial Mode</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
					Welcome to the coreference tutorial mode. Here you will learn how to use the interface efficiently to label text for coreferences. 
                </p>
                <p>
					What are <b>coreferences</b>? <br></br>A coreference is when <b>two words</b> or <b>spans</b> (sequence of words) refer to <b>the same thing</b>.
				</p>
				<p>
					In the examples below, the following words are coreferences (they refer to the same “thing”): <br></br>
					(1) <b>"John"</b> and <b>"He"</b><br></br>
					(2) <b>"Robert"</b> and <b>"He"</b> <br></br>
					(3) <b>"Alice"</b> and <b>"Her"</b>
				</p>
					<Image src={corefs} width="350" height="350" fluid />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={props.closeAndNext}>
                    Let's get started.
                </Button>
            </Modal.Footer>
        </Modal>
    );
}



export function TutorialLeftClick(props) {
		let title = (
			<div>  	
			<p>Task Instructions</p>
			</div>
		)
		let body = ( 
				<div>  	
					<h5><center><b>Select Spans</b></center></h5>
					<center><p>For this task, <b>a target</b> will be <b>flashing</b>.  Your job is to select <b>all the spans</b> that refer to this target.</p></center>	 
				</div>
		)

		return (
        <Modal show={props.show} className="left">
            <Modal.Header>
                <Modal.Title style={{fontSize: 20}}>{title}</Modal.Title>
            </Modal.Header>

			<Modal.Body>
				{body} 
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={props.closeAndNext}
                >
                Try it out
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export function TutorialDoubleLeftClick(props) {
	let title = (
		<div>  	
		<p>Task Instructions</p>
		</div>
	)
		let body = (
				<div>
					<h5><center><b>Deselect Spans</b></center></h5>
						<center>
							<p>Sometimes you may accidentally select a span that you did not intend to select. In this task, your job is to <b>deselect</b> a specific span in order to undo a previous selection.</p>
						</center>	
				</div>
		)

    return (
        <Modal show={props.show} className="left">
            <Modal.Header>
                <Modal.Title style={{fontSize: 20}}>{title}</Modal.Title>
            </Modal.Header>
			<Modal.Body>
				{body}
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={props.closeAndNext}
                >
                Try it out
                </Button>
            </Modal.Footer>
        </Modal>
    );

}

export function TutorialNextTarget(props) {
	let title = (
		<div>  	
		<p>Task Instructions</p>
		</div>
	)
		let body = (
				<div>
					<h5><center><b>Next Target</b></center></h5>
						<center>
							<p>
							In this task, you will be asked to annotate spans for two targets. Once you have selected <b>all the spans</b> that refer to <b>the current target,</b> you can move on to the next one by clicking the <b>Next Target</b> button.
							</p>
						</center>
				</div>
		)
    return (
        <Modal show={props.show} className="left">
            <Modal.Header>
			<Modal.Title style={{fontSize: 20}}>{title}</Modal.Title>
            </Modal.Header>
			<Modal.Body>
				{body}
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={props.closeAndNext}
                >
                    Try it out
                </Button>
            </Modal.Footer>
        </Modal>
    );
}


export function TutorialEditPreviousSpans(props) {
	let title = (
		<div>  	
		<p>Task Instructions</p>
		</div>
	)
		let body = (
			<div>
				<h5><center><b>Moving Between Targets</b></center></h5>
					<center>
						<p>
						Sometimes, you may want to <b>go back</b> and <b>edit</b> the annotations on <b>previous targets.</b> In this task, your job is to use the <b>Previous Target </b> and <b>Next Target</b> buttons to edit previous and next targets, respectively.
						</p>
					</center>
				</div>
				
		)

    return (
        <Modal show={props.show} className="left">
            <Modal.Header>
			<Modal.Title style={{fontSize: 20}}>{title}</Modal.Title>
            </Modal.Header>
			<Modal.Body>
				{body}
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={props.closeAndNext}
                >
                    Try it out
                </Button>
            </Modal.Footer>
        </Modal>
		);
}

export function TutorialOverwriteSpans(props) {
	let title = (
		<div>  	
		<p>Task Instructions</p>
		</div>
	)
	let body = (
		<div>
			<h5><center><b>Reassigning a Span</b></center></h5>
				<center>
					<p>
					Sometimes, you may decide to <b>reassign</b> a span to a new target. In this task, your job is to create a new target and assign a previously annotated span to this new target.
					</p>
				</center>
			</div>
			
	)

return (
	<Modal show={props.show} className="left">
		<Modal.Header>
			<Modal.Title>{title}</Modal.Title>
		</Modal.Header>
					<Modal.Body>
							{body}
		</Modal.Body>
		<Modal.Footer>
			<Button
				variant="secondary"
				onClick={props.closeAndNext}
			>
				Try it out
			</Button>
		</Modal.Footer>
	</Modal>
	);
}

export function TutorialReassignDeselectSpans(props) {
	let title = (
		<div>  	
		<p>Task Instructions</p>
		</div>
	)
	let body = (
		<div>
			<h5><center><b>Reassign vs. Deselect</b></center></h5>
				<center>
					<p>
					In this task, you will learn the <b>difference</b> between <b>deselecting</b> a previously annotated span and <b>reassigning</b> a previously annotated span to another target (changing the ID).
					</p>
				</center>
			</div>
			
	)

return (
	<Modal show={props.show} className="left">
		<Modal.Header>
			<Modal.Title>{title}</Modal.Title>
		</Modal.Header>
					<Modal.Body>
							{body}
		</Modal.Body>
		<Modal.Footer>
			<Button
				variant="secondary"
				onClick={props.closeAndNext}
			>
				Try it out
			</Button>
		</Modal.Footer>
	</Modal>
	);
}

export function TutorialMistakes1(props) {
	let title = (
		<div>  	
		<p>Task Instructions</p>
		</div>
	)
	let body = (
		<div>
			<h5><center><b>Correcting Mistakes I</b></center></h5>
				<center>
					<p>
					In this task, you will learn how to correct some common mistakes.
					</p>
				</center>
			</div>
			
	)

return (
	<Modal show={props.show} className="left">
		<Modal.Header>
			<Modal.Title>{title}</Modal.Title>
		</Modal.Header>
					<Modal.Body>
							{body}
		</Modal.Body>
		<Modal.Footer>
			<Button
				variant="secondary"
				onClick={props.closeAndNext}
			>
				Try it out
			</Button>
		</Modal.Footer>
	</Modal>
	);
}

export function TutorialMistakes2(props) {
	let title = (
		<div>  	
		<p>Task Instructions</p>
		</div>
	)
	let body = (
		<div>
			<h5><center><b>Correcting Mistakes II</b></center></h5>
				<center>
					<p>
					In this task, you will learn how to correct some more mistakes.
					</p>
				</center>
			</div>
			
	)

return (
	<Modal show={props.show} className="left">
		<Modal.Header>
			<Modal.Title>{title}</Modal.Title>
		</Modal.Header>
					<Modal.Body>
							{body}
		</Modal.Body>
		<Modal.Footer>
			<Button
				variant="secondary"
				onClick={props.closeAndNext}
			>
				Try it out
			</Button>
		</Modal.Footer>
	</Modal>
	);
}

export function TutorialNestedSpans1(props) {
	let title = (
		<div>  	
		<p>Task Instructions</p>
		</div>
	)
	let body = (
		<div>
			<h5><center><b>Nested Spans I</b></center></h5>
				<center>
					<p>
					Sometimes you will see <b>nested spans</b> (one span in another span). In this task, your goal is to assign labels to the nested spans.
					</p>
				</center>
			</div>
			
	)

return (
	<Modal show={props.show} className="left">
		<Modal.Header>
			<Modal.Title>{title}</Modal.Title>
		</Modal.Header>
					<Modal.Body>
							{body}
		</Modal.Body>
		<Modal.Footer>
			<Button
				variant="secondary"
				onClick={props.closeAndNext}
			>
				Try it out
			</Button>
		</Modal.Footer>
	</Modal>
	);
}

export function TutorialNestedSpans2(props) {
	let title = (
		<div>  	
		<p>Task Instructions</p>
		</div>
	)
	let body = (
		<div>
			<h5><center><b>Nested Spans II</b></center></h5>
				<center>
					<p>
					In the previous task you saw nested spans which referred to <b>the same</b> person. This is <b>NOT</b> always the case. In this task, you will be asked to annotate nested spans which do not refer to the same thing.
					</p>
				</center>
			</div>
			
	)

return (
	<Modal show={props.show} className="left">
		<Modal.Header>
			<Modal.Title>{title}</Modal.Title>
		</Modal.Header>
					<Modal.Body>
							{body}
		</Modal.Body>
		<Modal.Footer>
			<Button
				variant="secondary"
				onClick={props.closeAndNext}
			>
				Try it out
			</Button>
		</Modal.Footer>
	</Modal>
	);
}




export function TutorialMechanicsDone(props) {
		return (
        <Modal show={props.show} className="left">
            <Modal.Header>
                <Modal.Title>Done with the basics</Modal.Title>
            </Modal.Header>
						<Modal.Body>
							{/* <h4>Miscellanious actions:</h4>
							<p>
									To make your task easier, we have provided you with helpful tools:
									<ol>
											<li><b>Create New Target:</b> You can create a new target no matter what entity you are currently on by clicking the provided plus button</li>
											<li><b>Undo and Redo:</b> You can undo and redo <b>any</b> action you make using the undo and redo arrow buttons</li>
											<li><b>Toggle Hints/Annotations:</b> For better readability you can toggle hints and annotations</li>
									</ol>
							</p> */}
							<h5>Next Steps:</h5>
							<p>
							We have written more passage examples to help you practice.
							</p>
							<h7><b>Tips</b></h7>
							<p>
							You can undo and redo any action you take using the undo <Image src={require('./Undo.png')} width="30" height="30" fluid /> and redo <Image src={require('./Redo.png')} width="30" height="30" fluid /> buttons.
							</p>
							<p>You can use <b>"a"</b> and <b>"d"</b> keys on your keyboard instead of <b>Previous Target</b> and <b>Next Target</b> buttons, if you prefer.</p>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={props.closeAndNext}
								>
								Start doing examples.
                </Button>
            </Modal.Footer>
        </Modal>
			
		)
}

export function TutorialExamplesDone(props) {
	return (
	<Modal show={props.show} className="left">
		<Modal.Header>
			<Modal.Title>Completed Guided Examples</Modal.Title>
		</Modal.Header>
					<Modal.Body>
						<h5>Next Steps:</h5>
						<p>
							Congratulations! You have completed all guided examples. In the <b>last task</b>, you will be asked to annotate one passage (~150 words). Please note that <i>no hints</i> will be provided during this annotation. 
						</p>
						<p>Depending on your performance in this task, you might be invited to participate in our "Large-Scale Coreference Annotation Task" which we are planning to launch in the next few months. </p> 

		</Modal.Body>
		<Modal.Footer>
			<Button
				variant="secondary"
				onClick={props.closeAndNext}
							>
							Start doing examples.
			</Button>
		</Modal.Footer>
	</Modal>
		
	)
}

export function Example1(props) {
		let doneBody = (
				<div>
						<p>Congratulations you have finished the tutorial and all the examples!</p>
						<p>You are now ready for the real task!</p>	
				</div>
		)
		let body = props.done ? doneBody : <p></p>
		return (

        <Modal show={props.show} className="left">
            <Modal.Header>
                <Modal.Title>Nice!</Modal.Title>
            </Modal.Header>
						<Modal.Body>
						<p>Let's move onto the next annotation example.</p>
								{body}
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={props.closeAndNext}
								>
										Next example.
                </Button>
            </Modal.Footer>
        </Modal>
			
		)
}

export function Done(props) {
	if (props.show) {
		props.giveQualification()
	}
	return (

	<Modal show={props.show} className="left">
		<Modal.Header>
			<Modal.Title>Nice!</Modal.Title>
		</Modal.Header>
			<Modal.Body>
				<p>Congratulations you have finished the tutorial and all the examples!</p>
				<p>You are now ready for the real task!</p>	
			</Modal.Body>
		<Modal.Footer>
		</Modal.Footer>
	</Modal>
		
	)
}

export function DoneModal(props){
	if (props.show) {
		//props.giveQualification()
		props.handleSubmit()
		props.showCode()
	}
	return (
		<Modal show={props.show} className={{ width: "500px" }}>
		<Modal.Header>
			<Modal.Title>
				Tutorial Completed
			</Modal.Title>
		</Modal.Header>
		<Modal.Body>
			<p>Congratulations! You have successfully completed the tutorial!</p>
			<p>Copy the <b>Code</b> below and go back to <b>Amazon Mechanical Turk.</b>  </p>
			<p>You will need to <b>enter this code</b> in order to <b>submit your HIT.</b></p>
			<p><b>IMPORTANT! </b>Your HIT will <b>NOT</b> be recorded or approved if you do not complete this step. </p>
			{props.getNextPassageCode()}
		</Modal.Body>
		</Modal>
	);
};



