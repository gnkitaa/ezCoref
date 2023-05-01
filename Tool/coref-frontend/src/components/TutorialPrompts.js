import React from "react";
import { useState } from "react";
import { Card, Nav } from "react-bootstrap";
import "./AnnotationPage.css";
import {Tabs, Tab} from 'react-bootstrap';

export function TutorialPrompt(props) {
	
		let step = props.step
		let tutorialMode = props.tutorialMode
		if (tutorialMode === 'left_click') 
			return <LeftClickPrompt step={props.step} keyboardTutorial={props.keyboardTutorial}/>
		else if (tutorialMode === 'double_left_click') 
			return <DoubleLeftClickPrompt step={props.step} keyboardTutorial={props.keyboardTutorial}/>
		else if (tutorialMode === 'next_target') 
			return <NextTargetPrompt step={props.step} keyboardTutorial={props.keyboardTutorial}/>
		else if (tutorialMode === 'previous_target') 
			return <PreviousTargetPrompt step={props.step} keyboardTutorial={props.keyboardTutorial}/>
		else if (tutorialMode === 'overwrite_span') 
			return <OverwriteSpanPrompt step={props.step} keyboardTutorial={props.keyboardTutorial}/>
		else if (tutorialMode === 'reassign_deselect_span') 
			return <ReassignDeselectSpanPrompt step={props.step} keyboardTutorial={props.keyboardTutorial}/>
		else if (tutorialMode === 'correcting_mistake_1') 
			return <CorrectingMistake1 step={props.step} keyboardTutorial={props.keyboardTutorial}/>
		else if (tutorialMode === 'correcting_mistake_2') 
			return <CorrectingMistake2 step={props.step} keyboardTutorial={props.keyboardTutorial}/>
		else if (tutorialMode === 'nested_span_1') 
			return <NestedSpanPrompt1 step={props.step} keyboardTutorial={props.keyboardTutorial}/>
		else if (tutorialMode === 'nested_span_2') 
			return <NestedSpanPrompt2 step={props.step} keyboardTutorial={props.keyboardTutorial}/>
		else if (tutorialMode === 'examples')
			return <ExamplePrompts/>
		else
			return null	
}

export function LeftClickPrompt(props) {
		const [key, setKey] = useState('mouse');
		let step = props.step
		let instructions = [
			
			<Card className="text-center">
				<Card.Body>
					<h5>
						Step 1 of 2
					</h5>
					<hr/>
						<div>
							<p>
								<b>Observe</b> how the border around <b>"Mary"</b> is <b>flashing.</b> This means the span <b>"Mary"</b> is <b>the current target.</b>
							</p>
							<p>
								<b>Click</b> on all the spans that refer to the target <b>"Mary."</b>
							</p>
						</div> 
				</Card.Body>	
			</Card>,
			<Card className="text-center">
				<Card.Body>
					<h5>
						Step 1 of 2
					</h5>
					<hr/>
						<div>
							<p>
								<b>Observe</b> how the border around <b>"Mary"</b> is <b>flashing.</b> This means the span <b>"Mary"</b> is <b>the current target.</b>
							</p>
							<p>
								<b>Click</b> on all the spans that refer to the target <b>"Mary."</b>
							</p>
						</div> 
				</Card.Body>	
			</Card>,
			<Card className="text-center">
				<Card.Body>
					<h5>
						Step 2 of 2
					</h5>
					<hr/>
						<div>
							<p>
								<b>Observe</b> how now <b>"Mary,"</b> <b>"She,"</b> and <b>"her"</b> form one cluster (share the same ID). 
							</p>
							<p>
								Click on the <b>Continue</b> button below to complete the task.
							</p>
						</div> 
				</Card.Body>	
			</Card>
		].slice(0, step+1)

		return(
			
				<div>
					<h4>Select Spans (Task 1 of 10)</h4>
					<hr />
							
				<p>{instructions[step]}
				</p>
				</div>
		)
}

export function DoubleLeftClickPrompt(props) {
		let step = props.step
		const [key, setKey] = useState('mouse');
		let instructions = [
				<Card className="text-center">
					<Card.Body>
						<h5>Step 1 of 4</h5>
						<hr/>
						<div><br/>
						<p>
							Here, the span <b>"Mark"</b> was accidentally marked as referring to <b>"Mary."</b>
						</p>
						<p>
							<b>Click</b> on the span <b>"Mark"</b> to deselect it. 	
						</p></div>
					</Card.Body>	
				</Card>,
				<Card className="text-center">
					<Card.Body>
					<h5>Step 2 of 4</h5>
					<hr/>
					<div>
						<p><b>Observe</b> that the label around <b>"Mark"</b> is no longer there.</p>
						<p>Click on the <b>Continue</b> button below to move to the next step.</p>
					</div>
					</Card.Body>	
				</Card>,
				<Card className="text-center">
					<Card.Body>
					<h5>Step 3 of 4</h5>
					<hr/>
					<div>
						<p>Note that it is <b>NOT</b> possible to <b>deselect the current target.</b> </p>
						<p>Try deselecting the current target <b>"Mary"</b> by <b>clicking</b> on it.</p>
					</div>
					</Card.Body>	
				</Card>,
				<Card className="text-center">
					<Card.Body>
					<h5>Step 4 of 4</h5>
					<hr/>
					<div>
						<p><b>Observe</b> how <b>"Mary"</b> still <b>remains selected.</b></p>
						<p>Click on the <b>Continue</b> button below to move to complete the task.</p>
					</div>
					</Card.Body>	
				</Card>
		].slice(0, step+1)
		return(
				<div>
				<h4>Deselect Spans (Task 2 of 10)</h4>
				<hr />
				<p>{instructions[step]}
				</p>
				</div>
		)
}


export function NextTargetPrompt(props) {
		let step = props.step
		const [key, setKey] = useState('mouse');
		let instructions = [
			<Card className="text-center">
			<Card.Body>
				<h5>Step 1 of 6</h5>
				<hr/>
					<div><br/><p>
						<b>Select</b> all the spans that refer to <b>"Robert."</b>
					</p></div>
				</Card.Body>
			</Card>,
			<Card className="text-center">
			<Card.Body>
				<h5>Step 1 of 6</h5>
				<hr/>
					<div><br/><p>
						<b>Select</b> all the spans that refer to <b>"Robert."</b>
					</p></div>
			</Card.Body>
			</Card>,
			<Card className="text-center">
			<Card.Body>
				<h5>Step 2 of 6</h5>
				<hr/>
					<div><br/><p>
					<b>Observe</b> how <b>"Robert,"</b> <b>"He,"</b> and <b>"him"</b> form one cluster (share the same ID). <br/>
					Click on the <b>Continue</b> button below to move to complete the next step.
					</p></div>
			</Card.Body>
			</Card>,
			<Card className="text-center">
			<Card.Body>
				<h5>Step 3 of 6</h5>
				<hr/>
				<div><br/><p>
					<b>Click</b> the <b>Next Target</b> button to move on to the next target, <b>"Alice."</b><br/>
					The <b>next target</b> is always the <b>next unannotated span.</b>
				</p></div>
				</Card.Body>
			</Card>,
			<Card className="text-center">
			<Card.Body>
				<h5>Step 4 of 6</h5>
				<hr/>
					<div><br/><p>
						<b>Observe</b> that the <b>flashing box</b> is now around <b>"Alice."</b><br/>
						Click on the <b>Continue</b> button below to move to complete the next step.
					</p></div>
				</Card.Body>
			</Card>,
			<Card className="text-center">
			<Card.Body>
				<h5>Step 5 of 6</h5>
				<hr/>
					<div><br/><p>
						<b>Select</b> on <b>all the spans</b> that refer to <b>"Alice."</b>
					</p></div>
				</Card.Body>
			</Card>,
			<Card className="text-center">
			<Card.Body>
				<h5>Step 5 of 6</h5>
				<hr/>
					<div><br/><p>
						<b>Select</b> on <b>all the spans</b> that refer to <b>"Alice."</b>
					</p></div>
				</Card.Body>
			</Card>,
			<Card className="text-center">
				<Card.Body>
				<h5>Step 6 of 6</h5>
				<hr/>
					<div><br/><p>
						<b>Observe</b> how <b>"Alice," "her,"</b> and <b>"Alice"</b> form one cluster (share the same ID).<br/>
						Click on the <b>Continue</b> button below to move to complete the next step.
					</p></div>
				</Card.Body>
			</Card>
		].slice(0, step+1)

		return(
				<div>
					<h4>Moving to the Next Target (Task 3 of 10) </h4>
					<hr />
						<p>{instructions[step]}
						</p>
				</div>
		)
}

export function PreviousTargetPrompt(props) {
		let step = props.step
		const [key, setKey] = useState('mouse');
		let instructions = [
			<Card className="text-center">
			<Card.Body>
				<h5>Step 1 of 4</h5>
				<hr/>
					<div><br/>
						<p>Notice how <b>"Fred"</b> was mistakenly marked as referring to <b>"Robert."</b></p>
						<p>Navigate to <b>"Robert"</b> by clicking on the <b>Previous Target</b> button.</p>
						<p><b>Click</b> on <b>"Fred"</b> to deselect it.</p>
					</div>
				</Card.Body>
			</Card>,
			<Card className="text-center">
			<Card.Body>
				<h5>Step 1 of 4</h5>
				<hr/>
					<div><br/>
						<p>Notice how <b>"Fred"</b> was mistakenly marked as referring to <b>"Robert."</b></p>
						<p>Navigate to <b>"Robert"</b> by clicking on the <b>Previous Target</b> button.</p>
						<p><b>Click</b> on <b>"Fred"</b> to deselect it.</p>
					</div>
				</Card.Body>
			</Card>,
			<Card className="text-center">
			<Card.Body>
				<h5>Step 2 of 4</h5>
				<hr/>
					<div><br/>
						<p><b>Observe</b> how the label around <b>"Fred"</b> is no longer there.</p>
						<p>Click on the <b>Continue</b> button below to move to the next step.</p>
					</div>
				</Card.Body>
			</Card>,
			<Card className="text-center">
			<Card.Body>
				<h5>Step 3 of 4</h5>
				<hr/>
					<div><br/>
						<p>Similarly, you can <b>deselect</b> span(s) mistakenly marked as referring to <b>"Alice."</b></p>
						<p>Navigate to <b>"Alice"</b> by using the <b>Next Target</b> button</p>
						<p> Deselect <b>"he"</b> which was mistakenly assigned to <b>"Alice."</b></p>
					</div>
				</Card.Body>
			</Card>,
			<Card className="text-center">
			<Card.Body>
				<h5>Step 3 of 4</h5>
				<hr/>
					<div><br/>
						<p>Similarly, you can <b>deselect</b> span(s) mistakenly marked as referring to <b>"Alice."</b></p>
						<p>Navigate to <b>"Alice"</b> by using the <b>Next Target</b> button</p>
						<p> Deselect <b>"he"</b> which was mistakenly assigned to <b>"Alice."</b></p>
					</div>
				</Card.Body>
			</Card>,
			<Card className="text-center">
			<Card.Body>
				<h5>Step 4 of 4</h5>
				<hr/>
					<div><br/>
						<p><b>Observe</b> how the label around <b>"he"</b> is no longer there.</p>
						<p>Click on the <b>Continue</b> button below to complete the task.</p>
					</div>
				</Card.Body>
			</Card>
		].slice(0, step+1)

		return(
				<div>
				<h4>Moving Between Targets (Task 4 of 10)</h4>
				<hr />
				
				<p>{instructions[step]}
				</p>
		</div>
		)
}


export function OverwriteSpanPrompt(props) {
	let step = props.step
	const [key, setKey] = useState('mouse');
	let instructions = [
		<Card className="text-center">
		<Card.Body>
			<h5>Step 1 of 2</h5>
			<hr/>
					<div><br/><p>Notice, how the span <b>"her"</b> has been wrongly assigned to <b>"Robert."</b></p>
					<p>Click the <b>"Next Target"</b> button to create a new target <b>"Alice,"</b></p>
					<p> Then <b>click</b> on the span <b>"her"</b> to correctly reassign it to <b>"Alice."</b></p>
					</div>
			</Card.Body>
		</Card>,
		<Card className="text-center">
		<Card.Body>
			<h5>Step 1 of 2</h5>
			<hr/>
					<div><br/><p>Notice, how the span <b>"her"</b> has been wrongly assigned to <b>"Robert."</b></p>
					<p>Click the <b>"Next Target"</b> button to create a new target <b>"Alice."</b></p>
					<p> Then <b>click</b> on the span <b>"her"</b> to correctly reassign it to <b>"Alice."</b></p>
					</div>
			</Card.Body>
		</Card>,
		<Card className="text-center">
		<Card.Body>
			<h5>Step 2 of 2</h5>
			<hr/>
			<div><br/>
				<p><b>Observe</b> how the annotation for span <b>"her"</b> changes to a new ID (the same as "Alice").</p>
				<p>Click on the <b>Continue</b> button below to complete the task.</p>
			</div>
		</Card.Body>
		</Card>
	].slice(0, step+1)

	return(
			<div>
			<h4>Reassigning a Span (Task 5 of 10)</h4>
			<hr />
			
			<p>{instructions[step]}
			</p>
	</div>
	)
}

export function ReassignDeselectSpanPrompt(props) {
	let step = props.step
	const [key, setKey] = useState('mouse');
	let instructions = [
		<Card className="text-center">
		<Card.Body>
			<h5>Step 1 of 4</h5>
			<hr/>
				<div><br/>
					<p>
						Notice how <b>"Robert"</b> is now the <b>current target.</b>
					</p>
					<p>You can <b>deselect</b> any span that currently refers to <b>"Robert"</b> by clicking on it.</p>
					<p>
						<b>Click</b> on <b>"her"</b> to deselect it.
					</p>
				</div>
			</Card.Body>
		</Card>,
		<Card className="text-center">
		<Card.Body>
			<h5>Step 2 of 4</h5>
			<hr/>
				<div><br/>
					<p><b>Observe</b> how the label around <b>"her"</b> is no longer there.</p>

					<p>Click on the <b>Continue</b> button below to move to the next step.</p>
				</div>
			</Card.Body>
		</Card>,
		<Card className="text-center">
		<Card.Body>
			<h5>Step 3 of 4</h5>
			<hr/>
				<div><br/>
					<p>Notice how <b>"Robert"</b> is still the <b>current target.</b> </p>

					<p>You can <b>reassign</b> to <b>"Robert"</b> any span that currently refers to <b>another target</b> (NOT "Robert") by <b>clicking</b> on it. 
</p>
					<p>This span will be reassigned to <b>"Robert"</b> (current target).</p>

					<p><b>Click</b> on <b>"him"</b> to correctly reassign it to <b>"Robert."</b> </p>
				</div>
			</Card.Body>
		</Card>,
		<Card className="text-center">
		<Card.Body>
			<h5>Step 4 of 4</h5>
			<hr/>
				<div><br/>
					<p><b>Observe</b> how <b>"him"</b> is now assigned to <b>"Robert."</b></p>

					<p>Click on the <b>Continue</b> button below to complete the task.</p>
				</div>
			</Card.Body>
		</Card>
	].slice(0, step+1)

	return(
			<div>
			<h4>Reassigning and Deselecting Spans (Task 6 of 10)</h4>
			<hr />
			<p>{instructions[step]}
			</p>
	</div>
	)
}


export function CorrectingMistake1(props) {
	let step = props.step
	const [key, setKey] = useState('mouse');
	let instructions = [
		<Card className="text-center">
		
		<Card.Body>
			<h5>Step 1 of 3</h5>
			<hr/>
				<div><br/>
				<p><b>"Dog," "It," "It"</b> and <b>"the dog"</b> are currently forming <b>one cluster</b> (share the same ID).</p>

				<p>You have noticed that the second <b>"It"</b>  refers to something else (neither "dog" nor "Alice").</p>

				<p>First, <b>deselect</b> the second <b>"It."</b></p>		

				<p>Note that you can do that because <b>"It"</b> shares the ID with the current target ー <b>"the dog."</b></p>
				</div>
			</Card.Body>
		</Card>,
		<Card className="text-center">
		<Card.Body>
			<h5>Step 2 of 3</h5>
			<hr/>
			<div><br/>
			<p>
				Now navigate to <b>"It"</b> by clicking the <b>Previous Target</b> button.
			</p>
			</div>
		</Card.Body>
		</Card>,
		<Card className="text-center">
		<Card.Body>
			<h5>Step 2 of 3</h5>
			<hr/>
			<div><br/>
			<p>
				Now navigate to <b>"It"</b> by clicking the <b>Previous Target</b> button.
			</p>
			</div>
		</Card.Body>
		</Card>,
		<Card className="text-center">
		<Card.Body>
			<h5>Step 2 of 3</h5>
			<hr/>
			<div><br/>
			<p>
				Now navigate to <b>"It"</b> by clicking the <b>Previous Target</b> button.
			</p>
			</div>
		</Card.Body>
		</Card>,
		<Card className="text-center">
			<Card.Body>
				<h5>Step 3 of 3</h5>
				<hr/>
				<div><br/>
				<p>
					<p><b>Observe</b> how <b>"It"</b> is now a new target. </p>
					<p>It has its own ID; forms a cluster different from "Alice" or "dog." </p>
					<p>Click on the <b>Continue</b> button below to complete the task.</p>
				</p>
				</div>
			</Card.Body>
		</Card>
	].slice(0, step+1)

	return(
			<div>
			<h4>Correcting Mistakes I (Task 9 of 10)</h4>
			<hr />
			
			<p>{instructions[step]}
			</p>
	</div>
	)
}

export function CorrectingMistake2(props) {
	let step = props.step
	const [key, setKey] = useState('mouse');
	let instructions = [
		<Card className="text-center">
		<Card.Body>
			<h5>Step 1 of 2</h5>
			<hr/>
				<div><br/>
					<p>Notice how <b>"she"</b> was mistakenly assigned to <b>"Fred."</b></p>
					<p>You need to reassign it to <b>"Alice."</b></p>
					<p>Navigate to the <b>first span</b> with the <b>same ID</b> as <b>"Alice"</b> (here "her").</p>
 					<p>Then click on "<b>she"</b> to reassign it to the <b>"Alice"</b> cluster.</p>
				</div>
			</Card.Body>
		</Card>,
		<Card className="text-center">
		<Card.Body>
			<h5>Step 1 of 2</h5>
			<hr/>
				<div><br/>
					<p>Notice how <b>"she"</b> was mistakenly assigned to <b>"Fred."</b></p>
					<p>You need to reassign it to <b>"Alice."</b></p>
					<p>Navigate to the <b>first span</b> with the <b>same ID</b> as <b>"Alice"</b> (here "her").</p>
 					<p>Then click on "<b>she"</b> to reassign it to the <b>"Alice"</b> cluster.</p>
				</div>
			</Card.Body>
		</Card>,
		<Card className="text-center">
		<Card.Body>
			<h5>Step 1 of 2</h5>
			<hr/>
				<div><br/>
					<p>Notice how <b>"she"</b> was mistakenly assigned to <b>"Fred."</b></p>
					<p>You need to reassign it to <b>"Alice."</b></p>
					<p>Navigate to the <b>first span</b> with the <b>same ID</b> as <b>"Alice"</b> (here "her").</p>
 					<p>Then click on "<b>she"</b> to reassign it to the <b>"Alice"</b> cluster.</p>
				</div>
			</Card.Body>
		</Card>,
		<Card className="text-center">
		<Card.Body>
			<h5>Step 2 of 2</h5>
			<hr/>
			<div><br/>
				<p>
					<b>Observe</b> how the <b>ID changes</b> to the same as <b>"Alice."</b>
				</p>
				<p>Click on the <b>Continue</b> button below to complete the task.</p>
			</div>
		</Card.Body>
		</Card>
	].slice(0, step+1)

	return(
			<div>
			<h4>Correcting Mistakes II (Task 10 of 10)</h4>
			<hr />
			<p>{instructions[step]}
			</p>
	</div>
	)
}



export function NestedSpanPrompt1(props) {
	let step = props.step
	const [key, setKey] = useState('mouse');
	let instructions = [
		<Card className="text-center">
		<Card.Body>
			<h5>Step 1 of 2</h5>
			<hr/>
				<div><br/>
					<p>Notice how <b>"Samaranch"</b> is the <b>current target,</b> and it is nested within the <b>"President Samaranch"</b> span.</p>

					<p>Both <b>"Samaranch"</b> and <b>"President Samaranch"</b> are valid for annotation.</p>

					<p><b>Click</b> on all spans that refer to <b>"Samaranch."</b> This includes the <b>"President Samaranch"</b> span.</p>
				</div>
			</Card.Body>
		</Card>,
		<Card className="text-center">
		<Card.Body>
			<h5>Step 1 of 2</h5>
			<hr/>
				<div><br/>
					<p>Notice how <b>"Samaranch"</b> is the <b>current target,</b> and it is nested within the <b>"President Samaranch"</b> span.</p>

					<p>Both <b>"Samaranch"</b> and <b>"President Samaranch"</b> are valid for annotation.</p>

					<p><b>Click</b> on all spans that refer to <b>"Samaranch."</b> This includes the <b>"President Samaranch"</b> span.</p>
				</div>
			</Card.Body>
		</Card>,
		<Card className="text-center">
		<Card.Body>
			<h5>Step 2 of 2</h5>
			<hr/>
				<div><br/>
					<p><b>Observe</b> how both <b>"Samaranch"</b> and <b>"President Samaranch"</b> get assigned the same ID.</p>
					<p>Click on the <b>Continue</b> button below to complete the task.</p>
				</div>
			</Card.Body>
		</Card>
	].slice(0, step+1)

	return(
			<div>
			<h4>Nested Spans I (Task 7 of 10)</h4>
			<hr />
			
			<p>{instructions[step]}
			</p>
	</div>
	)
}

export function NestedSpanPrompt2(props) {
	let step = props.step
	const [key, setKey] = useState('mouse');
	let instructions = [
		<Card className="text-center">
		<Card.Body>
			<h5>Step 1 of 2</h5>
			<hr/>
				<div><br/>
					<p>In the example below <b>"its"</b> and <b>"its owner"</b> do <b>NOT</b> refer to the same thing.</p>

					<p>Mark <b>all</b> spans that refer to <b>"dog"</b> first. </p>

					<p>Then mark the <b>remaining span</b>  as a new cluster by moving to the next target. </p>
				</div>
			</Card.Body>
		</Card>,
		<Card className="text-center">
		<Card.Body>
			<h5>Step 1 of 2</h5>
			<hr/>
				<div><br/>
					<p>In the example below <b>"its"</b> and <b>"its owner"</b> do <b>NOT</b> refer to the same thing.</p>

					<p>Mark <b>all</b> spans that refer to <b>"dog"</b> first. </p>

					<p>Then mark the <b>remaining span</b>  as a new cluster by moving to the next target. </p>
				</div>
			</Card.Body>
		</Card>,
		<Card className="text-center">
		<Card.Body>
			<h5>Step 2 of 2</h5>
			<hr/>
				<div><br/>
					<p><b>Observe</b> how <b>"its"</b> and <b>"its owner"</b> have different IDs.</p>
					<p>Click on the <b>Continue</b> button below to complete the task.</p>
				</div>
			</Card.Body>
		</Card>
	].slice(0, step+1)

	return(
			<div>
			<h4>Nested Spans II (Task 8 of 10)</h4>
			<hr />
			
			<p>{instructions[step]}
			</p>
	</div>
	)
}

export function ExamplePrompts(props) {
		let step = props.step;
		return (
				<div>
						<h4>Annotation Examples Task</h4>
						<hr/>
						<h4>Remember:</h4>
						<li>
							If the <b>current target</b> does NOT have any coreferences go to the <b>next target.</b>
						</li>
						<li>
							You <b>should</b> annotate <b>all the spans</b> that refer to the <b>current target</b> before moving onto the next target.
						</li>
						<li>
							Once you have finished annotating the current passage, click on the <b>Continue</b> button to move on to the next passage.
						</li>
						<br/>
				</div>
				
		)
}
