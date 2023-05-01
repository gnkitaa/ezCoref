
import React, { Component } from "react";
import Document from "./Document";
import "bootstrap/dist/css/bootstrap.css";
import KeyboardEventHandler from "react-keyboard-event-handler";

import {
    Dropdown,
    DropdownButton,
    Alert,
    Row,
    Col,
    Modal,
    Button, 
} from "react-bootstrap";

//If free_annotation_sample, tutorialStep is not incremented for handleClick, handleCreateTarget and handleChangeTarget.


import {TutorialPrompt} from "./TutorialPrompts.js";

import {
    handleMouseEvents,
    extractNextPassage,
    isSpanClicked,
    getBiggestEntity,
    isSpanSkipped,
    cyclePointer,
    getEntitySpans,
    colors,
    addDuplicateSpans,
    alignPointer,
    checkForTargetOrCandidate,
    handleLeftClicks,
    handleSkipClicks,
    handleRightClicks,
    allSpansMarked,
	addPreExistingAnnotations,
} from "./utils.js";

import { getOperation } from "./operationUtils.js";

import {
    TutorialIntroductionModal,
    TutorialLeftClick,
    TutorialDoubleLeftClick,
    TutorialNextTarget,
    TutorialEditPreviousSpans,
    TutorialOverwriteSpans,
    TutorialReassignDeselectSpans,
    TutorialMistakes1,
    TutorialMistakes2,
    TutorialNestedSpans1,
    TutorialNestedSpans2,
    TutorialMouseDone,
    TutorialMechanicsDone,
    Example1,
    TutorialExamplesDone,
    DoneModal,
    ConsentModal,
    printElement
} from "./TutorialModalsPrompts.js";


import Toggle from "react-toggle";
import "react-toggle/style.css";
import "./AnnotationPage.css";
import "./NounChunk.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
    faUndo,
    faRedo,
    faArrowLeft,
    faArrowRight,
    faCommentsDollar,
    fas
} from "@fortawesome/free-solid-svg-icons";



let messages = {
    END_OF_DOCUMENT: "Done with document, refresh to continue.",
    END_OF_DOCUMENT_CLICK: "Document complete, please don't annotate. Refresh instead.",
    SINGLE_ENTITY: "Only a single entity is in use.",
    ENTITY_NOT_SELECTED: "Current span is not selected.",
    CLICK_AFTER: "Please don't mark/unmark spans without seeing annotations.",
    CLICK_ON_SPANS: "Please click on spans with boxes around them.",
    NEXT_PASSAGE: "Moving to next passage.",
    CREATE_TARGET: "Creating a new target with entity ",
    PREVIOUS_TARGET: "Moving to the previous target.",
    NEXT_TARGET: "Moving to the next target.",
    SWITCH_ENTITY: "Switched to entity ",
    TOGGLE_HINT_ON: "Toggled candidate span markers on.",
    TOGGLE_HINT_OFF: "Toggled candidate span markers off.",
    TOGGLE_ANNOT_ON: "Toggled annotation marks on.",
    TOGGLE_ANNOT_OFF: "Toggled annotation marks off.",
    FIRST_TARGET: "You are on the first target.",
    END_OF_PASSAGE: "Passage complete. Review & press 'Continue' to move on.",
    UNDO_SINGLE: "Nothing to undo.",
    REDO_LAST: "Nothing to redo.",
    UNDO: "Un-did the previous operation '",
    REDO: "Re-did the next operation '",
    RIGHT_CLICK_EMPTY: "Please don't right-click unmarked spans.",
    SPANS_MISSING: "Some spans have not been annotated.",
    SUBMIT_DISABLED: "Complete annotations for all spans before submitting.",
    CLICK_ON_ACTIVE: "Please click on spans other than the active target."
};

let port = '8852';

class Tutorial extends Component {
    constructor(props) {
        super(props);
        this.ats = [];
        let debug = false;
        const start_event = new Date();
        
		this.state = {
            learnedTarget: false,
            document: [],
            tutorialExercisePass:  0,
            currDocument: [],
            pointer: 0,
            currentMaxTarget: 0,
            targetPointer: 0,
            candidatePointer: 0,
            numSents: 4,
            annotations: {},
            targets: [[2, 4]],
            targetList: [],
            candidateList: [],
            entity: 0,
            debug: debug,
            doneWithPassage: false,
            documentComplete: false,
            showHints: true,
            showAnnotations: true,
            currentMessage: "",
            currentMessageType: "danger",
            operationStack: [],
            operationPointer: -1,
            handleNextPassageModalShow: false,
            nextPassageCode: "",
            email: "",
            callGenerateCode: true,
            callhandleSubmit: true,
            showConsent:true,
            showTutorialIntroduction: false,
            annotationToolTipId: 0,
            moveToNext:false,
            free_annotation_passage: false,
            starttime: start_event.toUTCString(),
            endtime: ""
		};

        this.examples = ['example_2', 'example_3', 'example_4']
        let index=30; //30;
        this.examples_index = {
            'example_1':index,
            'example_2':index+3,
            'example_3':index+6, 
            'example_4':index+9
        };

        this.qc_examples_index = {
            'example_5':index+12
        };

        this.handleClick = this.handleClick.bind(this);
    }

    generateCode() {
        if(this.state.callGenerateCode==false){
            return;
        }
        let vars = this.getUrlVals();
        let workerId = vars.workerId;
        let assignmentId = vars.assignmentId;
        let hitId = vars.hitId;

        //AG: when this url is accessed by frontend, any function in the backend with /code argument in app route decorator gets invoked. 
        let url =
            "http://azkaban.cs.umass.edu:"+port+"/code?hitId=" +
            hitId +
            "&assignmentId=" +
            assignmentId+
            "&workerId="+
            workerId;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                let code = data["code"];
                this.setState({ nextPassageCode: code });
        });
        this.setState({
            callGenerateCode: false,
        });
	}

    executeOperation = operation => {
        let operationType = operation.operationType;
        let operationMetadata = operation.operationMetadata;
        let updatedState = {
          currDoc: this.state.currDocument,
          annotations: this.state.annotations,
          spansClicked: []
        };
        // NOTE: The first two operations have been disabled in the current interface.
        if (operation.operationType === "previousTarget") {
          this.handleChangeTarget("previous", false);
        } 
        else if (operation.operationType === "nextTarget") {
          this.handleChangeTarget("next", false);
        } 
        else if (operation.operationType === "leftClick") {
          // While this is not the most optimal usage of handleLeftClicks,
          // it is the most general use-case. This setup allows it to
          // works with inverse operations of RightClick and SkipClick.
          operationMetadata.spansClicked.forEach(currSpanClicked => {
            currSpanClicked.entities.forEach(entity => {
              updatedState = handleLeftClicks(
                [currSpanClicked.span],
                updatedState,
                entity
              );
            });
          });
    
          this.setState({
            currDocument: updatedState.currDoc,
            annotations: updatedState.annotations
          });
        } 
        else if (operationType === "createTarget") {
          let candidatePointer = alignPointer(
            this.state.candidatePointer,
            this.state.candidateList,
            this.state.targetList[operationMetadata.nextTargetPointer]
          );
          updatedState = handleLeftClicks(
            operationMetadata.spansClicked.map(x => x.span),
            updatedState,
            operationMetadata.nextEntity
          );
          this.setState({
            targetPointer: operationMetadata.nextTargetPointer,
            currentMaxTarget: operationMetadata.nextMaxTarget,
            entity: operationMetadata.nextEntity,
            candidatePointer: candidatePointer,
            doneWithPassage: operationMetadata.doneWithPassage,
            currDocument: updatedState.currDoc,
            annotations: updatedState.annotations
          });
        } 
        else if (operationType === "deleteTarget") {
          let candidatePointer = alignPointer(
            this.state.candidatePointer,
            this.state.candidateList,
            this.state.targetList[operationMetadata.prevTargetPointer]
          );
          updatedState = handleLeftClicks(
            operationMetadata.spansClicked.map(x => x.span),
            updatedState,
            operationMetadata.nextEntity
          );
          this.setState({
            targetPointer: operationMetadata.prevTargetPointer,
            currentMaxTarget: operationMetadata.prevMaxTarget,
            entity: operationMetadata.prevEntity,
            candidatePointer: candidatePointer,
            doneWithPassage: false,
            currDocument: updatedState.currDoc,
            annotations: updatedState.annotations
          });
        }
    };

    handleChangeOperation = changeType => {
        let operationStack = this.state.operationStack;
        let operationPointer = this.state.operationPointer;

        console.log('handleChangeOperation');

        if (operationPointer === -1 && changeType === "undo") {
            // This is the edge case where undo is disabled.
            this.setState({
                currentMessage: messages.UNDO_SINGLE,
                currentMessageType: "danger"
            });
            return;
        } 
        else if (operationPointer === operationStack.length - 1 && changeType === "redo") {
            // This is the edge case where redo is disabled.
            this.setState({
                currentMessage: messages.REDO_LAST,
                currentMessageType: "danger"
            });
            return;
        }

        // Perform the undo or redo as necessary
        if (changeType === "undo") {
            let currentOperation = operationStack[operationPointer];
            operationPointer--;
            this.executeOperation(currentOperation.operation.inverse);

            let currentMessage=messages.UNDO + currentOperation.operation.name + "'";
            let doneWithPassage = allSpansMarked(this.state.candidateList, this.state.currDocument);
            if (doneWithPassage===true){
                currentMessage = currentMessage+'. '+messages.END_OF_PASSAGE;
            }

            let metadata = currentOperation.operation.operationMetadata;

            this.setState({
                operationPointer: operationPointer,
                currentMessage:currentMessage,
                currentMessageType: "info",
                doneWithPassage: metadata.prevDoneWithPassage,
                moveToNext:metadata.prevMoveToNext,
                tutorialExercisePass:metadata.prevTutorialExercisePass,
                tutorialStep: metadata.prevTutorialStep
            });
        } 
        else {
            operationPointer++;
            let currentOperation = operationStack[operationPointer];
            this.executeOperation(currentOperation.operation);

            let currentMessage=messages.REDO + currentOperation.operation.name + "'";
            let doneWithPassage = allSpansMarked(this.state.candidateList, this.state.currDocument);

            if (doneWithPassage===true){
                currentMessage = currentMessage+'. '+messages.END_OF_PASSAGE;
            }

            let metadata = currentOperation.operation.operationMetadata;

            this.setState({
                operationPointer: operationPointer,
                currentMessage:currentMessage,
                currentMessageType: "info",
                doneWithPassage: metadata.nextDoneWithPassage,
                moveToNext:metadata.nextMoveToNext,
                tutorialExercisePass:metadata.nextTutorialExercisePass,
                tutorialStep: metadata.nextTutorialStep
            });
        }
    };

    handleHover = (currSpan, enter) => {
        let currDoc = this.state.currDocument;

        // Do nothing if the current span is not a target or a candidate
        if (!checkForTargetOrCandidate(currSpan, currDoc)) return;

        let updatedState = handleMouseEvents(
            currSpan,
            this.state.currDocument,
            this.state.annotations,
            "hover",
            { enter: enter }
        );
        this.setState({
            currDocument: updatedState.currDoc,
            annotations: updatedState.annotations
        });
    };

	handleClickEdgeCases = (currSpan, clickType) => {
				
        if (this.state.documentComplete) {
            this.setState({
                currentMessage: messages.END_OF_DOCUMENT_CLICK,
                currentMessageType: "danger"
            });
            return true;
        }
        if (!this.state.showAnnotations) {
            this.setState({
                showAnnotations: true,
                currentMessage: messages.CLICK_AFTER,
                currentMessageType: "danger"
            });
            return true;
        }
        // Do nothing if the current span is not a target or a candidate
        if (!checkForTargetOrCandidate(currSpan, this.state.currDocument)) {
            this.setState({
                currentMessage: messages.CLICK_ON_SPANS,
                currentMessageType: "danger"
            });
            return true;
        }
        // Do nothing if a right click is called on a span which has no entity in it
        if (
            !isSpanClicked(currSpan, this.state.currDocument, -1) &&
            clickType === "rightClick"
        ) {
            this.setState({
                currentMessage: messages.RIGHT_CLICK_EMPTY,
                currentMessageType: "danger"
            });
            return true;
        }
        return false;
	};

	validClick = (currSpan, entity, clickType) => {
        console.log(currSpan, entity, clickType);

        if (this.state.free_annotation_passage===true){
            return true;
        }
        let step = this.state.tutorialStep
        let validMoves = this.state.validMoves

        let validWordIndex = validMoves.step[step].validWordIndex 
        let validSentIndex = validMoves.step[step].validSentIndex
        let validClickType = validMoves.step[step].validClickType
        let validEntity = validMoves.step[step].validEntity

        //AG: Allow selection of a span belonging to same cluster in any order
        let wordflag = false;
        let sentflag = false;
        let index = -1;
        if (Array.isArray(validWordIndex)){
            wordflag = validWordIndex.includes(currSpan.wordIndex);

            let previously_clicked = this.state.document[currSpan.sentIndex][currSpan.wordIndex].colorIndex.indexOf(entity);
    
            if(wordflag===true & previously_clicked!==-1){
                wordflag=false;
            }

            if (Array.isArray(validSentIndex)){
                index = validWordIndex.indexOf(currSpan.wordIndex);
                sentflag = (validSentIndex[index]===currSpan.sentIndex);
            }
            else{
                sentflag = (validSentIndex===currSpan.sentIndex);
            }
        }
        else{
            wordflag = (currSpan.wordIndex === validWordIndex);
            sentflag = (validSentIndex===currSpan.sentIndex);
        }
        return (clickType === validClickType) &&
                (wordflag) && 
                (sentflag) &&
                (entity === validEntity)
	}

    handleTutorialVariables = ()=> {
        let nextTutorialStep = (this.state.free_annotation_passage===true)?this.state.tutorialStep: this.state.tutorialStep+1;
        let nextTutorialExercisePass = (this.state.tutorialStep === this.state.validMoves.step.length-1)? this.state.tutorialExercisePass+1: this.state.tutorialExercisePass;
        let nextMoveToNext = this.state.moveToNext;
        let nextDoneWithPassage = this.state.doneWithPassage;

        if(this.state.free_annotation_passage===false){
            if (this.state.validMoves.step[this.state.tutorialStep].continue===1){
                nextMoveToNext = true;
            }
            nextDoneWithPassage = allSpansMarked(this.state.candidateList, this.state.currDocument);
        }
        else{
            nextDoneWithPassage = allSpansMarked(this.state.candidateList, this.state.currDocument);
            nextMoveToNext = nextDoneWithPassage;
        }
        
        
        this.state.tutorialExercisePass = nextTutorialExercisePass;
        this.state.doneWithPassage = nextDoneWithPassage;
        this.state.tutorialStep = nextTutorialStep;
        this.state.moveToNext = nextMoveToNext;

        this.setState({
            tutorialExercisePass: nextTutorialExercisePass,
            doneWithPassage: nextDoneWithPassage,
            tutorialStep: nextTutorialStep,
            moveToNext: nextMoveToNext
        });
    }

	handleClick = (currSpan, entity, clickType, fromKeyPress) => {
        if (this.state.free_annotation_passage===false && this.state.moveToNext===true){
            alert("Wrong move! You have completed all the steps in this task. \n Click on Continue button to move on.");
            return;
        }
        
        // Do nothing if the current span is not a target or a candidate
        if (!checkForTargetOrCandidate(currSpan, this.state.currDocument)) {
            alert(messages.CLICK_ON_SPANS)
            return;
        }

        if (!this.validClick(currSpan, entity, clickType)) { // if it is not a valid click
            let step = this.state.tutorialStep;
            console.log('step: '+step);
            //let validWordIndex = validMoves.step[step].validWordIndex; //validWordIndex is the index of the word that we are currently working with for a specific passage
            if(this.state.tutorialExercisePass === this.examples_index['example_1'] && step === 0){ //its and them are both not selected
                alert("Oh Snap!  That is the Wrong Move." + "\n" + "Hint: 'he' is a coreference to 'John'")
            }
            else if(this.state.tutorialExercisePass === this.examples_index['example_1'] && step === 2){ //its and them are both not selected
                alert("Oh Snap!  That is the Wrong Move." + "\n" + "Hint: 'him' is a coreference to 'Fred'")
            }
            else if(this.state.tutorialExercisePass === this.examples_index['example_2'] && (step === 0 || step===1)){ //its and them are both not selected
                alert("Oh Snap!  That is the Wrong Move." + "\n" + "Hint: 'It' and 'Its' are coreferences to 'This dog'")
            }
            else if(this.state.tutorialExercisePass === this.examples_index['example_2'] && step === 3){ //them is not selected
                alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: 'this game' is a coreference to 'catch'")
            }
            else if(this.state.tutorialExercisePass === this.examples_index['example_3'] && (step === 0 || step===1)){
                alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: 'Mackenzie' and 'he' are coreferences to 'Director Mackenzie'")
            }
            else if(this.state.tutorialExercisePass === this.examples_index['example_3'] && step === 3){
                alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: 'this time' is a coreference to 'last two years'")
            }
            else if(this.state.tutorialExercisePass === this.examples_index['example_3'] && step === 5){
                alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: 'the movie' is a coreference to 'Young Adam'")
            }
            else if(this.state.tutorialExercisePass === this.examples_index['example_4'] && step === 0){
                alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: 'Its' is a coreference to 'The building'")
            }
            else if(this.state.tutorialExercisePass === this.examples_index['example_4'] && step === 2){
                alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: 'I' written in the fourth sentence is a coreference of 'I' in the first sentence")
            }
            else if(this.state.tutorialExercisePass === this.examples_index['example_4'] && step === 7){
                alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: 'The office' has the coreference 'there' in the fourth sentence")
            }
            else if(this.state.tutorialExercisePass === this.examples_index['example_4'] && step === 5){
                alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: This is a generic (impersonal) 'you.' It does not have any coreferences because it does not refer to specific people. We should move onto the next target.")
            }
            else if(this.state.tutorialExercisePass === this.examples_index['example_1'] ||
                this.state.tutorialExercisePass === this.examples_index['example_2'] ||
                this.state.tutorialExercisePass === this.examples_index['example_3'] ||
                this.state.tutorialExercisePass === this.examples_index['example_4']){
                alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: there are no other coreferences for this particular target. We should move onto the next target.")
            }
            else{
                alert("Wrong move try again!")
            }
            return
        }
				
        if (this.handleClickEdgeCases(currSpan, clickType)) return;

        // AG: if activetarget is left/right-clicked, do nothing
        let activeTarget = this.state.targetList[this.state.targetPointer];
        if (activeTarget.equals(currSpan)){

            this.handleTutorialVariables();

            let currentMessage = "";
            if(this.state.tutorialExercisePass>this.examples_index['example_1']-1){
                currentMessage=messages.CLICK_ON_ACTIVE;
                if (allSpansMarked(this.state.candidateList, this.state.currDocument)){
                    currentMessage = currentMessage+'\n'+messages.END_OF_PASSAGE;
                }
            }

            this.setState({
                currentMessage: currentMessage,
                currentMessageType: "info",
            });
            return;
        }

        let oldentity;
        let inversespansClicked;
        let currDoc = this.state.currDocument;
        let updatedState = {
            currDoc: currDoc,
            annotations: this.state.annotations,
            spansClicked: []
        };

        if (clickType === "leftClick") {
            //AG: store the old entity if already annotated span
            if (currDoc[currSpan.sentIndex][currSpan.wordIndex].colorIndex.length!==0) {
                let id = currDoc[currSpan.sentIndex][currSpan.wordIndex].colorIndex.indexOf(entity);
                if (id === -1) {
                    oldentity = currDoc[currSpan.sentIndex][currSpan.wordIndex].colorIndex[0];
                }
            }
        
            let allSpans = [currSpan];
            updatedState = handleLeftClicks(allSpans, updatedState, entity);

            let operationPointer = this.state.operationPointer;
            let operationStack = this.state.operationStack;
            operationStack = operationStack.slice(0, operationPointer + 1);
            
            if (typeof oldentity !== 'undefined'){
                inversespansClicked = [];
                inversespansClicked.push({
                  span: updatedState.spansClicked[0].span,
                  entities: [oldentity]
                });
            }

            let prevTutorialStep = this.state.tutorialStep;
            let prevTutorialExercisePass = this.state.tutorialExercisePass;
            let prevMoveToNext = this.state.moveToNext;
            let prevDoneWithPassage = this.state.doneWithPassage;

            this.handleTutorialVariables();

            let currentMessage = "";
            if(this.state.tutorialExercisePass>this.examples_index['example_1']-1){
                currentMessage = "";
                if (allSpansMarked(this.state.candidateList, this.state.currDocument)){
                    currentMessage = messages.END_OF_PASSAGE;
                }
                else{
                    if(this.state.operationPointer>=this.state.targetList.length && this.state.doneWithPassage===false){
                    currentMessage = messages.SPANS_MISSING+' '+messages.SUBMIT_DISABLED;;
                    }
                }
            }

            operationStack.push({
                operation: getOperation(clickType, 
                  {spansClicked: updatedState.spansClicked,
                    prevTutorialExercisePass:prevTutorialExercisePass,
                    nextTutorialExercisePass:this.state.tutorialExercisePass,
                    prevTutorialStep:prevTutorialStep,
                    nextTutorialStep:this.state.tutorialStep,
                    prevMoveToNext: prevMoveToNext,
                    nextMoveToNext: this.state.moveToNext,
                    prevDoneWithPassage: prevDoneWithPassage,
                    nextDoneWithPassage: this.state.doneWithPassage}, 
                  {spansClicked: inversespansClicked}),
                chainNext: false,
                chainPrevious: false
            });
            operationPointer++;
      
            this.setState({
                currDocument: updatedState.currDoc,
                annotations: updatedState.annotations,
                currentMessage: currentMessage,
                currentMessageType: "info",
                operationStack: operationStack,
                operationPointer: operationPointer
            });   
            
        } 
    };

    handleSubmit=() => {
        if (this.state.callhandleSubmit===false){
            return;
        }
        let vars = this.getUrlVals();
        let workerId = vars.workerId;
        let assignmentId = vars.assignmentId;
        let hitId = vars.hitId;

        let arr = this.state.annotations;
        //let docId = this.passageId;
        //let chunkId = this.chunkId;

        let docId = 1;
        let chunkId = 0;
        
        const event = new Date();
        this.state.endtime = event.toUTCString();

        let obj = {
            docId: docId,
            chunkId: chunkId,
            annotations: arr,
            task_type: 'TUTORIAL',
            start_time: this.state.starttime,
            end_time: this.state.endtime
        };
        

        let url =
            "http://azkaban.cs.umass.edu:"+port+"/annotations?hitId=" +
            hitId +
            "&assignmentId=" +
            assignmentId+
            "&workerId="+
            workerId;

        //let url = "http://azkaban.cs.umass.edu:"+port+"/annotations";


        let data = new FormData();
        data.append("json", JSON.stringify(obj));
        fetch(url, {
            method: "POST",
            body: data,
            mode: 'no-cors'
        });
        this.setState({
            callhandleSubmit: false,
        });
    };

    handleNextPassageModalClose = () => {
        this.setState({
            handleNextPassageModalShow: !this.state.handleNextPassageModalShow
        });
    };

    showCode = () => {
        //console.log('called show code');
        this.generateCode();
    };

    getNextPassageCode = () => {
        if (this.state.nextPassageCode === "") {
            return null;
        } else {
            return (
                <div>
                    <p>
                        <b>Code: </b>
                        {this.state.nextPassageCode}
                    </p>
                </div>
            );
        }
    };

    enteredCertificate = e => {
        let written = false;
        if (
            e.target.value ===
            "I have completed this task to the best of my ability"
        ) {
            written = true;
        }
        this.setState({ certificate: written });
    };

    handleNextPassageModal = (props) => {
        if (props.show) {
            props.giveQualification()
        }
        return (
            <Modal show={props.show} className={{ width: "500px" }}>
            <Modal.Header closeButton>
                <Modal.Title>
                    Congratulations! 
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                    You have finished the tutorial and all the examples!
                    You are now ready for the real task!
                    Please type the following to retrieve your confrimation
                    code: "I have completed this task to the best of my
                    ability" Please the code and paste it back into
                    mechanical turk and submit your HIT.
                </p>
                <p>
                    Your HITs will not be recorded or approved if you do not
                    complete this step.
                </p>
                {props.getNextPassageCode()}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={props.showCode}>
                    Get Code
                </Button>
            </Modal.Footer>
            </Modal>
        );
    };

	handleChangeTarget = (operation, updateOperationStack = true, fromKeyPress) => {

        if (this.state.documentComplete) {
            this.setState({
                currentMessage: messages.END_OF_DOCUMENT_CLICK,
                currentMessageType: "danger"
            });
            return;
        }
        let currDoc = this.state.currDocument;
        let targetList = this.state.targetList;
        let targetPointer = this.state.targetPointer;

        // Only one span exists, can't move around
        if (this.state.currentMaxTarget === 0) {
            this.setState({
                currentMessage: messages.FIRST_TARGET,
                currentMessageType: "danger"
            });
            return;
        }

        if (operation === "next") {
            targetPointer = targetPointer + 1;
        } 
        else if(operation=== "previous") {
            targetPointer = targetPointer - 1;
        }

        targetPointer = cyclePointer(
            targetPointer,
            this.state.currentMaxTarget + 1
        );

        let targetSpan = targetList[targetPointer];
        let candidatePointer = alignPointer(
            this.state.candidatePointer,
            this.state.candidateList,
            targetList[targetPointer]
        );


        let newEntity = this.state.entity;
        if (isSpanClicked(targetSpan, currDoc, -1)) {

            let targetEntity = this.state.document[targetSpan.sentIndex][targetSpan.wordIndex].colorIndex[0];

            if (!this.validClick(targetSpan, targetEntity, 'leftClick')) { // if it is not a valid click
                let step = this.state.tutorialStep;
                console.log('step: '+step);
                //let validWordIndex = validMoves.step[step].validWordIndex; //validWordIndex is the index of the word that we are currently working with for a specific passage
                if(this.state.tutorialExercisePass === this.examples_index['example_1'] && step === 0){ //its and them are both not selected
                    alert("Oh Snap!  That is the Wrong Move." + "\n" + "Hint: 'he' is a coreference to 'John'")
                }
                else if(this.state.tutorialExercisePass === this.examples_index['example_1'] && step === 2){ //its and them are both not selected
                    alert("Oh Snap!  That is the Wrong Move." + "\n" + "Hint: 'him' is a coreference to 'Fred'")
                }
                else if(this.state.tutorialExercisePass === this.examples_index['example_2'] && (step === 0 || step===1)){ //its and them are both not selected
                    alert("Oh Snap!  That is the Wrong Move." + "\n" + "Hint: 'It' and 'Its' are coreferences to 'This dog'")
                }
                else if(this.state.tutorialExercisePass === this.examples_index['example_2'] && step === 3){ //them is not selected
                    alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: 'this game' is a coreference to 'catch'")
                }
                else if(this.state.tutorialExercisePass === this.examples_index['example_3'] && (step === 0 || step===1)){
                    alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: 'Mackenzie' and 'he' are coreferences to 'Director Mackenzie'")
                }
                else if(this.state.tutorialExercisePass === this.examples_index['example_3'] && step === 3){
                    alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: 'this time' is a coreference to 'last two years'")
                }
                else if(this.state.tutorialExercisePass === this.examples_index['example_3'] && step === 5){
                    alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: 'the movie' is a coreference to 'Young Adam'")
                }
                else if(this.state.tutorialExercisePass === this.examples_index['example_4'] && step === 0){
                    alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: 'Its' is a coreference to 'The building'")
                }
                else if(this.state.tutorialExercisePass === this.examples_index['example_4'] && step === 2){
                    alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: 'I' written in the fourth sentence is a coreference of 'I' in the first sentence")
                }
                else if(this.state.tutorialExercisePass === this.examples_index['example_4'] && step === 7){
                    alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: 'The office' has the coreference 'there' in the fourth sentence")
                }
                else if(this.state.tutorialExercisePass === this.examples_index['example_4'] && step === 5){
                    alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: This is a generic (impersonal) 'you.' It does not have any coreferences because it does not refer to specific people. We should move onto the next target.")
                }
                else if(this.state.tutorialExercisePass === this.examples_index['example_1'] ||
                    this.state.tutorialExercisePass === this.examples_index['example_2'] ||
                    this.state.tutorialExercisePass === this.examples_index['example_3'] ||
                    this.state.tutorialExercisePass === this.examples_index['example_4']){
                    alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: there are no other coreferences for this particular target. We should move onto the next target.")
                }
                else{
                    alert("Wrong move try again!")
                }
                return
            }

            let colorIndex = currDoc[targetSpan.sentIndex][targetSpan.wordIndex].colorIndex;
            newEntity = colorIndex[colorIndex.length - 1];
            let operationPointer = this.state.operationPointer;
            let operationStack = this.state.operationStack;

            this.handleTutorialVariables();

            let currentMessage = "";
            if(this.state.tutorialExercisePass>this.examples_index['example_1']-1){
                currentMessage=(operation === "next")? messages.NEXT_TARGET : messages.PREVIOUS_TARGET;
                if (allSpansMarked(this.state.candidateList, this.state.currDocument)){
                    currentMessage = currentMessage+' '+messages.END_OF_PASSAGE;
                }
                else if(this.state.doneWithPassage){
                    currentMessage = currentMessage+' '+messages.SPANS_MISSING+' '+messages.SUBMIT_DISABLED;
                }
            }

            this.setState({
              currentMessage:currentMessage,
              currentMessageType: "info",
              entity: newEntity,
              candidatePointer: candidatePointer,
              targetPointer: targetPointer,
              operationPointer: operationPointer,
              operationStack: operationStack
            });

          }
        //AG: If the flashing span is empty, assign a new entity id.
        else{
            this.handleCreateTarget(false, targetPointer=targetPointer);
        }
    };

    handleCreateTargetEdgeCases = () => {
        
        if (this.state.documentComplete) {
            this.setState({
                currentMessage: messages.END_OF_DOCUMENT_CLICK,
                currentMessageType: "danger"
            });
            console.log('edge case');
            return true;
        }
        if (this.state.doneWithPassage) {
            if (allSpansMarked(this.state.candidateList, this.state.currDocument)){
              this.setState({
                currentMessage: messages.END_OF_PASSAGE,
                currentMessageType: "info"
              });
              console.log('edge case');
              return true;
            }
            else{
              this.setState({
                currentMessage: messages.SPANS_MISSING+' '+messages.SUBMIT_DISABLED,
                currentMessageType: "info"
              });
              return false;
            }
        }
    };

    handleCreateTarget = (chainPrevious = false, targetPointer=-1) => {
        
        if (this.state.free_annotation_passage===false && this.state.moveToNext===true){
            alert("Wrong move! You have completed all the steps in this task. \n Click on Continue button to move on.");
            return;
        }

        if (this.handleCreateTargetEdgeCases()) {
            return;
        }

        //AG: check if the current flashing span is empty, if true: assign a new id
        if(targetPointer!==-1){
            console.log('targetPointer!==-1');
            let currDoc = this.state.currDocument;
            let targetList = this.state.targetList;
            let prevEntity = this.state.entity;
        
            let currentMaxTarget = this.state.currentMaxTarget;
            let prevTargetPointer = this.state.targetPointer;
            let operationPointer = this.state.operationPointer;
            let operationStack = this.state.operationStack;
            operationStack = operationStack.slice(0, operationPointer + 1);
    
            let newEntity = getBiggestEntity(currDoc) + 1;
            let allSpans = [targetList[targetPointer]];
    
            let updatedState = {
                currDoc: currDoc,
                annotations: this.state.annotations,
                spansClicked: []
            };
    
            updatedState = handleLeftClicks(allSpans, updatedState, newEntity);
    
            let candidatePointer = alignPointer(
                this.state.candidatePointer,
                this.state.candidateList,
                targetList[targetPointer]
            );
            
            let nextMaxTarget = Math.max(targetPointer, currentMaxTarget);
            let prevTutorialStep = this.state.tutorialStep;
            let prevTutorialExercisePass = this.state.tutorialExercisePass;
            let prevMoveToNext = this.state.moveToNext;
            let prevDoneWithPassage = this.state.doneWithPassage;

            this.handleTutorialVariables();

            console.log('prevTutorialStep: ' +prevTutorialStep);
            console.log('nextTutorialStep: '+this.state.tutorialStep);

            let currentMessage = "";
            if(this.state.tutorialExercisePass>this.examples_index['example_1']-1){
                currentMessage = messages.CREATE_TARGET + newEntity;
                if (this.state.doneWithPassage===true){
                    currentMessage = currentMessage +'. '+messages.END_OF_PASSAGE;
                }
            }

            

            let operation = getOperation("createTarget", {
                prevTargetPointer: prevTargetPointer,
                nextTargetPointer: targetPointer,
                spansClicked: updatedState.spansClicked,
                prevEntity: prevEntity,
                nextEntity: newEntity,
                prevMaxTarget: currentMaxTarget,
                nextMaxTarget: nextMaxTarget,
                prevTutorialExercisePass:prevTutorialExercisePass,
                nextTutorialExercisePass:this.state.tutorialExercisePass,
                prevTutorialStep:prevTutorialStep,
                nextTutorialStep:this.state.tutorialStep,
                prevMoveToNext: prevMoveToNext,
                nextMoveToNext: this.state.moveToNext,
                prevDoneWithPassage: prevDoneWithPassage,
                nextDoneWithPassage: this.state.doneWithPassage
            });
    
            operationStack.push({
                operation,
                chainNext: false,
                chainPrevious: chainPrevious
            });
    
            operationPointer++;
      
            this.setState({
                targetPointer: targetPointer,
                candidatePointer: candidatePointer,
                entity: newEntity,
                currDocument: updatedState.currDoc,
                annotations: updatedState.annotations,
                currentMessage: currentMessage,
                currentMessageType: "info",
                currentMaxTarget: nextMaxTarget,
                operationStack: operationStack,
                operationPointer: operationPointer
            });      
        }
        else{
            console.log('targetPointer==-1');
            let currDoc = this.state.currDocument;
            let targetList = this.state.targetList;
            let prevEntity = this.state.entity;

            let currentMaxTarget = this.state.currentMaxTarget;
            let targetPointer = this.state.targetPointer;
            let prevTargetPointer = this.state.targetPointer;

            // Check if "Create" is happening on a skipped entity which is not the latest
            // Activate the entity if that's the case
            let prevSkipped = targetPointer < currentMaxTarget && isSpanSkipped(targetList[targetPointer], currDoc);

            if (!prevSkipped) {
                // Move the target pointer to the currentMaxTarget
                targetPointer = currentMaxTarget;
                // Wait till a target is found which is not clicked/skipped
                while (targetPointer < targetList.length) {
                    let nextTarget = targetList[targetPointer];
                    if (
                        !isSpanClicked(nextTarget, currDoc, -1) &&
                        !isSpanSkipped(nextTarget, currDoc)
                    ) {
                        break;
                    }
                    targetPointer++;
                }
            }

            let operationPointer = this.state.operationPointer;
            let operationStack = this.state.operationStack;
            operationStack = operationStack.slice(0, operationPointer + 1);

            if (targetPointer === targetList.length) {
                console.log('targetPointer === targetList.length');
                let operation = getOperation("createTarget", {
                    prevTargetPointer: prevTargetPointer,
                    nextTargetPointer: targetList.length - 1,
                    doneWithPassage: allSpansMarked(this.state.candidateList, this.state.currDocument),
                    spansClicked: [],
                    prevEntity: prevEntity,
                    nextEntity: prevEntity,
                    prevMaxTarget: currentMaxTarget,
                    nextMaxTarget: targetList.length - 1
                });
          
                operationStack.push({
                    operation,
                    chainNext: false,
                    chainPrevious: chainPrevious
                });
        
                operationPointer++;
                let currentMessage = "";
                if(this.state.tutorialExercisePass>this.examples_index['example_1']-1){
                    if (allSpansMarked(this.state.candidateList, this.state.currDocument)){
                        currentMessage = messages.END_OF_PASSAGE;
                    }
                    else{
                        currentMessage = messages.SPANS_MISSING;
                    }
                }

                this.setState({
                    targetPointer: targetList.length - 1,
                    currentMaxTarget: targetList.length - 1,
                    currentMessage: currentMessage,
                    currentMessageType: "info",
                    operationPointer: operationPointer,
                    operationStack: operationStack,
                    doneWithPassage: allSpansMarked(this.state.candidateList, this.state.currDocument),
                });
                
                this.state.doneWithPassage = allSpansMarked(this.state.candidateList, this.state.currDocument);
                if (this.state.free_annotation_passage===true){
                    this.state.moveToNext=this.state.doneWithPassage;
                    this.setState({
                        moveToNext: this.state.doneWithPassage,
                    }); 
                }
            } 
            else {
                console.log('targetPointer !== targetList.length');
                let newEntity = getBiggestEntity(currDoc) + 1;
                let currSpan = targetList[targetPointer]

                //AG: If the leftClick is not a valid move, why check leftClick for handleCreateTarget? 
                if (!this.validClick(currSpan, newEntity, 'leftClick')) { // if it is not a valid click
                    let step = this.state.tutorialStep;
                    console.log('step: '+step);
                    //let validWordIndex = validMoves.step[step].validWordIndex; //validWordIndex is the index of the word that we are currently working with for a specific passage
                    if(this.state.tutorialExercisePass === this.examples_index['example_1'] && step === 0){ //its and them are both not selected
                        alert("Oh Snap!  That is the Wrong Move." + "\n" + "Hint: 'he' is a coreference to 'John'")
                    }
                    else if(this.state.tutorialExercisePass === this.examples_index['example_1'] && step === 2){ //its and them are both not selected
                        alert("Oh Snap!  That is the Wrong Move." + "\n" + "Hint: 'him' is a coreference to 'Fred'")
                    }
                    else if(this.state.tutorialExercisePass === this.examples_index['example_2'] && (step === 0 || step===1)){ //its and them are both not selected
                        alert("Oh Snap!  That is the Wrong Move." + "\n" + "Hint: 'It' and 'Its' are coreferences to 'This dog'")
                    }
                    else if(this.state.tutorialExercisePass === this.examples_index['example_2'] && step === 3){ //them is not selected
                        alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: 'this game' is a coreference to 'catch'")
                    }
                    else if(this.state.tutorialExercisePass === this.examples_index['example_3'] && (step === 0 || step===1)){
                        alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: 'Mackenzie' and 'he' are coreferences to 'Director Mackenzie'")
                    }
                    else if(this.state.tutorialExercisePass === this.examples_index['example_3'] && step === 3){
                        alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: 'this time' is a coreference to 'last two years'")
                    }
                    else if(this.state.tutorialExercisePass === this.examples_index['example_3'] && step === 5){
                        alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: 'the movie' is a coreference to 'Young Adam'")
                    }
                    else if(this.state.tutorialExercisePass === this.examples_index['example_4'] && step === 0){
                        alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: 'Its' is a coreference to 'The building'")
                    }
                    else if(this.state.tutorialExercisePass === this.examples_index['example_4'] && step === 2){
                        alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: 'I' written in the fourth sentence is a coreference of 'I' in the first sentence")
                    }
                    else if(this.state.tutorialExercisePass === this.examples_index['example_4'] && step === 7){
                        alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: 'The office' has the coreference 'there' in the fourth sentence")
                    }
                    else if(this.state.tutorialExercisePass === this.examples_index['example_4'] && step === 5){
                        alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: This is a generic (impersonal) 'you.' It does not have any coreferences because it does not refer to specific people. We should move onto the next target.")
                    }
                    else if(this.state.tutorialExercisePass === this.examples_index['example_1'] ||
                        this.state.tutorialExercisePass === this.examples_index['example_2'] ||
                        this.state.tutorialExercisePass === this.examples_index['example_3'] ||
                        this.state.tutorialExercisePass === this.examples_index['example_4']){
                        alert("Oh Snap!  That is the wrong move." + "\n" + "Hint: there are no other coreferences for this particular target. We should move onto the next target.")
                    }
                    else{
                        alert("Wrong move try again!")
                    }
                    return
                }

                let allSpans = [currSpan]; 
                let updatedState = {
                    currDoc: currDoc,
                    annotations: this.state.annotations,
                    spansClicked: []
                };

                updatedState = handleLeftClicks(allSpans, updatedState, newEntity);

                let candidatePointer = alignPointer(
                    this.state.candidatePointer,
                    this.state.candidateList,
                    targetList[targetPointer]
                );

                let nextMaxTarget = Math.max(targetPointer, currentMaxTarget);
                let prevTutorialStep = this.state.tutorialStep;
                let prevTutorialExercisePass = this.state.tutorialExercisePass;
                let prevMoveToNext = this.state.moveToNext;
                let prevDoneWithPassage = this.state.doneWithPassage;

                this.handleTutorialVariables();

                console.log('prevTutorialStep: ' +prevTutorialStep);
                console.log('nextTutorialStep: '+this.state.tutorialStep);
                
                let currentMessage = "";
                if(this.state.tutorialExercisePass>this.examples_index['example_1']-1){
                    currentMessage = messages.CREATE_TARGET + newEntity;
                    if (this.state.doneWithPassage===true){
                        currentMessage = currentMessage +'. '+messages.END_OF_PASSAGE;
                    }
                }

                let operation = getOperation("createTarget", {
                    prevTargetPointer: prevTargetPointer,
                    nextTargetPointer: targetPointer,
                    spansClicked: updatedState.spansClicked,
                    prevEntity: prevEntity,
                    nextEntity: newEntity,
                    prevMaxTarget: currentMaxTarget,
                    nextMaxTarget: nextMaxTarget,
                    prevTutorialExercisePass:prevTutorialExercisePass,
                    nextTutorialExercisePass:this.state.tutorialExercisePass,
                    prevTutorialStep:prevTutorialStep,
                    nextTutorialStep:this.state.tutorialStep,
                    prevMoveToNext: prevMoveToNext,
                    nextMoveToNext: this.state.moveToNext,
                    prevDoneWithPassage: prevDoneWithPassage,
                    nextDoneWithPassage: this.state.doneWithPassage
                });
    
                operationStack.push({
                    operation,
                    chainNext: false,
                    chainPrevious: chainPrevious
                });
        
                operationPointer++;
      
                this.setState({
                    targetPointer: targetPointer,
                    candidatePointer: candidatePointer,
                    entity: newEntity,
                    currDocument: updatedState.currDoc,
                    annotations: updatedState.annotations,
                    currentMessage: currentMessage,
                    currentMessageType: "info",
                    currentMaxTarget: nextMaxTarget,
                    operationStack: operationStack,
                    operationPointer: operationPointer
                });  
            }
        }
    };

    changeEntity = newEntityId => {
        this.setState({
            entity: newEntityId,
            currentMessage: messages.SWITCH_ENTITY + newEntityId,
            currentMessageType: "info"
        });
        document.activeElement.blur();
    };

    handleKeyPress = key => {
        // No point in doing anything in this extreme case
		if (this.state.targetList.length === 0){
            console.log('returning');
            return;
        }

        if (key==="d"){
            if(!(this.state.targetPointer === this.state.currentMaxTarget)){
                                        this.handleChangeTarget("next");
            }
            else{ this.handleCreateTarget();
            }
            document.activeElement.blur();
        };
        
        if (key==="a"){
            this.handleChangeTarget("previous");
            document.activeElement.blur();
        };
        
        if (key==="ctrl+z"){
            this.handleChangeOperation("undo");
            document.activeElement.blur();
        };
        
        if (key==="ctrl+y"){
            this.handleChangeOperation("redo");
            document.activeElement.blur();
        };

    };

    getEntitySummary = () => {
        let currentEntity = this.state.entity;
        let currDoc = this.state.currDocument;
        let allEntitySpans = getEntitySpans(
            this.state.candidateList,
            currDoc,
            currentEntity
        );
        // Find the strings in each of the spans and filter duplicates
        let finalWordList = [];
        allEntitySpans.forEach(currSpan => {
            let words = [];
            for (
                let wordIndex = currSpan.spanLeft;
                wordIndex < currSpan.spanRight;
                wordIndex++
            ) {
                words.push(currDoc[currSpan.sentIndex][wordIndex].word);
            }
            finalWordList.push(words.join(" "));
        });
        let uniqueWords = [...new Set(finalWordList)];
        uniqueWords.sort();

        let spanHTML = [];
        let entityColor = colors[currentEntity % colors.length];
        for (let index = 0; index < Math.min(uniqueWords.length, 15); index++) {
            spanHTML.push(
                <div className="entity-summary">
                    <span className={"highlight " + entityColor}>
                        <span className={"highlight__label"}>
                            <strong> {currentEntity} </strong>
                        </span>
                        <span className="highlight__content">
                            {uniqueWords[index]}
                        </span>
                    </span>
                    <br />
                </div>
            );
        }
        return spanHTML;
	};

	setValidMoves = (tutorialMode, step) => {
        let url = "http://azkaban.cs.umass.edu:"+port+"/tutorial?tutorialexcercise=" + tutorialMode;
        console.log(url);
        fetch(url)
            .then(u => u.json())
                .then(json => {
                    //console.log(json['sents']);
                    let validMoves = json["validMoves"];
                    //console.log("validMoves");
                    //console.log(validMoves);
                    this.setState({
                        validMoves: validMoves,
                        tutorialStep: 0, 
                    });
                 });
	}

	setClickTutorialPassage = (tutorialMode, step=0, targetPointer=0, entity=0, candidatePointerVal=0) => {
        //console.log(tutorialMode)
        
        if (tutorialMode === undefined) {
            return
        }
        let url = "http://azkaban.cs.umass.edu:"+port+"/tutorial?tutorialexcercise=" + tutorialMode;
		//console.log(url);
        fetch(url)
            .then(u => u.json())
                .then(json => {
                        let contextSents = json["sents"];
                        let sameAnnots = json["annots"];
                        let chunks = json["targets"];
                        let annots = json["preAnnots"]; 

                        console.log(tutorialMode);
                        console.log(annots);

                        let nextPassage = extractNextPassage(contextSents, annots, 0);

                        console.log(nextPassage);

                        let candidatePointer = candidatePointerVal;

                        if (nextPassage.targetList.length > 0) {
                            candidatePointer = alignPointer(
                                    candidatePointer,
                                    nextPassage.candidateList,
                                    nextPassage.targetList[0]
                            );
                        }

                        //AG: pass user-specified candidate pointer
                        if(candidatePointerVal!==0){
                            candidatePointer = candidatePointerVal;
                        }

                        console.log('nextPassage.pointer: '+nextPassage.pointer);
                        console.log('candidatePointer: '+candidatePointer);
                        
                        console.log(annots);
                        contextSents = addPreExistingAnnotations(contextSents, annots);
                        console.log(contextSents);
                        this.setState({
                                targetPointer: targetPointer,
                                truthAnnots: sameAnnots,
                                document: contextSents,
                                currDocument: nextPassage.currDoc,
                                targets: chunks,
                                pointer: nextPassage.pointer,
                                candidateList: nextPassage.candidateList,
                                targetList: nextPassage.targetList,
                                operationStack: [],
                                operationPointer: -1,
                                currentMaxTarget: targetPointer,
                                annotations: nextPassage.newAnnotations,
                                candidatePointer: candidatePointer,
                                currentMessage: "",
                                entity: entity,
                                movetoNext:false,
                        });

                        console.log(this.state.targetList[this.state.targetPointer]);
                        console.log(this.state.candidateList[this.state.candidatePointer]);
               
                });
                
                //console.log(this.state.tutorialExercisePass);
	};

	getUrlVals = () => {
        var vars = {};
        var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(
            m,
            key,
            value
        ) {
            vars[key] = value;
        });
        return vars;
	}

	giveQualification = () => {
        let obj = {
            workerId: this.getUrlVals().workerId
        };
        console.log("giving qualification to:", obj.workerId)

        let data = new FormData();
        data.append("json", JSON.stringify(obj));

        let url = "http://azkaban.cs.umass.edu:"+port+"/qualification"
        fetch(url, {
            method: "POST",
            body: data
		})
	}

    handleMoveToNextTask = () =>{
        this.state.moveToNext = false; //by default, click on Continue button should deactivate it for next time
        
        //when reached last step of task or this is free annotation passage
        if((this.state.tutorialStep===this.state.validMoves.step.length) || (this.state.free_annotation_passage===true)){
            this.setState({
                tutorialExercisePass: this.state.tutorialExercisePass+1,
                moveToNext: false
            });
        }
        else{
            let tutorialStep=this.state.tutorialStep;
            if (this.state.free_annotation_passage===false){
                tutorialStep = tutorialStep+1;
            }
            this.state.tutorialStep = tutorialStep;
            this.setState({
                tutorialStep: this.state.tutorialStep,
            });
            
            // //this is corner case: at very last step, user has to click continue button twice.
            // if(this.state.tutorialStep===this.state.validMoves.step.length){
            //     console.log('match found, updating exercisePass count');
            //     this.state.moveToNext = true;
            //     this.setState({
            //         tutorialExercisePass: this.state.tutorialExercisePass+1,
            //         moveToNext:true
            //     });
            // }
        }
    }

	render() {
        let biggestEntity = getBiggestEntity(this.state.currDocument);
        let entityList = [];
        let num_guided_examples = 4;
        if (biggestEntity >= 0)
            entityList = [...Array(biggestEntity + 1).keys()];

        return (
			<div>
                
                <ConsentModal
                    show={this.state.showConsent}
                    closeAndNext={() =>
                        this.setState({
                            showConsent: false,
                            showTutorialIntroduction: true
                        })
                    }
                />

                <TutorialIntroductionModal
                    show={this.state.showTutorialIntroduction}
                    closeAndNext={() =>
                        this.setState({
                            showTutorialIntroduction: false,
                            showTutorialClick: true
                        })
                    }
                />
                
				<TutorialLeftClick
                    //This is the introductory modal setting up the user for left-click task
					keyboardTutorial={this.state.keyboardTutorial}
                    show={this.state.showTutorialClick}
                    closeAndNext={() => {
                        this.setClickTutorialPassage('left_click', 0);
                        this.setValidMoves('left_click', 0);
                        this.setState({ 
                            showTutorialClick: false,
                            showClickPrompt: true,
                            tutorialMode: 'left_click',
                            prevAnnots: this.state.annotations,
                            movetoNext:false,
                        }); 
                        console.log(this.state.annotations);
                    }}
                />
                
              
                <TutorialDoubleLeftClick
					keyboardTutorial={this.state.keyboardTutorial}
                    show={this.state.tutorialExercisePass === 2}    //should be 2
                    closeAndNext={() => {
                        this.setClickTutorialPassage('double_left_click', 0);
						this.setValidMoves('double_left_click', 0);
                        this.setState({
                            tutorialExercisePass: this.state.tutorialExercisePass+1,
                            truthAnnots: [{0: [0]}, {0: [], 2: []}],
                            tutorialMode: 'double_left_click',
                            entity: 0,
                            movetoNext:false,
                        });
                        console.log('DoubleLeftModal');
                        console.log(this.state.annotations);
                    }}
                />

                <TutorialNextTarget
					keyboardTutorial={this.state.keyboardTutorial}
                    show={this.state.tutorialExercisePass === 5}     
                    closeAndNext={() => {
                        this.setClickTutorialPassage('next_target');
                        this.setValidMoves('next_target', 0);
                        this.setState({
                            tutorialExercisePass: this.state.tutorialExercisePass+1,
                            tutorialMode: 'next_target',
                            prevAnnots: this.state.annotations,
                            learnedTarget: true,
                            movetoNext:false,
						});
                        console.log('EditNextModal');
                        console.log(this.state.annotations);
                    }}
                />

                
                <TutorialEditPreviousSpans
					keyboardTutorial={this.state.keyboardTutorial}
                    show={this.state.tutorialExercisePass === 8}     
                    closeAndNext={() => {
                        this.setClickTutorialPassage('previous_target', 0, 1, 1, 1, 1);
                        this.setValidMoves('previous_target', 0);
                        this.setState({
                                targetPointer: 1,
                                tutorialExercisePass: this.state.tutorialExercisePass+1,
                                truthAnnots: [{0: [0], 2: [1]}, {0: [], 3: []}],
                                tutorialMode: 'previous_target',
                                entity: 1,
                                movetoNext:false,
                        });
                        console.log('EditPreviousModal');
                        console.log(this.state.annotations);
                    }}
                /> 

                
                <TutorialOverwriteSpans
					keyboardTutorial={this.state.keyboardTutorial}
                    show={this.state.tutorialExercisePass === 11}     //should be 11
                    closeAndNext={() => {
                        this.setClickTutorialPassage('overwrite_span');
                        this.setValidMoves('overwrite_span', 0);
                        this.setState({
                                targetPointer: 0,
                                tutorialExercisePass: this.state.tutorialExercisePass+1,
                                tutorialMode: 'overwrite_span',
                                movetoNext:false,
                        });
                        console.log('OverwriteModal');
                        console.log(this.state.annotations);
                    }}
                />

                <TutorialReassignDeselectSpans
					keyboardTutorial={this.state.keyboardTutorial}
                    show={this.state.tutorialExercisePass === 14}     
                    closeAndNext={() => {
                        this.setClickTutorialPassage('reassign_deselect_span');
                        this.setValidMoves('reassign_deselect_span', 0);
                        this.setState({
                                targetPointer: 0,
                                tutorialExercisePass: this.state.tutorialExercisePass+1,
                                tutorialMode: 'reassign_deselect_span',
                                movetoNext:false,
                        });
                    }}
                />

                <TutorialNestedSpans1
					keyboardTutorial={this.state.keyboardTutorial}        
                    show={this.state.tutorialExercisePass === 17}     
                    closeAndNext={() => {
                        this.setClickTutorialPassage('nested_span_1', 0);
                        this.setValidMoves('nested_span_1', 0);
                        this.setState({
                                targetPointer: 0,
                                tutorialExercisePass: this.state.tutorialExercisePass+1,
                                tutorialMode: 'nested_span_1',
                                movetoNext:false,
                        });
                    }}
                />

                <TutorialNestedSpans2
					keyboardTutorial={this.state.keyboardTutorial} 
                    show={this.state.tutorialExercisePass === 20}     
                    closeAndNext={() => {
                        this.setClickTutorialPassage('nested_span_2', 0);
                        this.setValidMoves('nested_span_2', 0);
                        this.setState({
                                targetPointer: 0,
                                tutorialExercisePass: this.state.tutorialExercisePass+1,
                                tutorialMode: 'nested_span_2',
                                movetoNext:false,
                        });
                    }}
                />


                <TutorialMistakes1
					keyboardTutorial={this.state.keyboardTutorial}   
                    show={this.state.tutorialExercisePass === 23}
                    //show={this.state.showTutorialClick}
                    closeAndNext={() => {
                        this.setClickTutorialPassage('correcting_mistake_1',0, 6,1,6);
                        this.setValidMoves('correcting_mistake_1', 0);
                        this.setState({
                                //showTutorialClick: false, 
                                //showClickPrompt: true,
                                targetPointer: 0,
                                tutorialExercisePass: this.state.tutorialExercisePass+1,
                                tutorialMode: 'correcting_mistake_1',
                                movetoNext:false,
                        });
                    }}
                /> 

                <TutorialMistakes2
					keyboardTutorial={this.state.keyboardTutorial}  
                    show={this.state.tutorialExercisePass === 26}
                    //show={this.state.showTutorialClick}      
                    closeAndNext={() => {
                        this.setClickTutorialPassage('correcting_mistake_2', 0, 10, 4, 10);
                        this.setValidMoves('correcting_mistake_2', 0);
                        this.setState({
                                //showTutorialClick: false, 
                                //showClickPrompt: true,
                                targetPointer: 0,
                                tutorialExercisePass: this.state.tutorialExercisePass+1,
                                tutorialMode: 'correcting_mistake_2',
                                moveToNext: false
                        });
                    }}
                />  
                
				<TutorialMechanicsDone 
                    //First example: dog_catch 
                    //show={this.state.showTutorialClick} 
					show={this.state.tutorialExercisePass === this.examples_index['example_1']-1}	
                    closeAndNext={() => {
                        this.setClickTutorialPassage('example_1');
                        this.setValidMoves('example_1', 0);
                        this.setState({
                            showTutorialClick: false, 
                            showClickPrompt: true, 
                            tutorialMode: 'examples',
                            tutorialExercisePass: this.state.tutorialExercisePass+1,
                            moveToNext: false,
                            free_annotation_passage: false
                        });
                    }}
				/>

				<div>{this.examples.map((e, eIndex) => ( 
                    <Example1 
                        done={eIndex === this.examples.length}
                        show={this.state.tutorialExercisePass === 3*eIndex + this.examples_index['example_1']+2}	//3 steps for each exercise, 2 + 1(next task button)
                        closeAndNext={() => {
                                console.log(3*eIndex + this.examples_index['example_1']+2, this.state.tutorialExercisePass)
                                if(e==='example_3'){
                                    this.setClickTutorialPassage(e, 0, 0, 0, 1);
                                    this.setValidMoves(e, 0);
                                    this.setState({
                                        tutorialExercisePass: this.state.tutorialExercisePass+1,
                                        moveToNext: false,
                                        free_annotation_passage: false,
                                        targetPointer: 0
                                    });
                                }
                                else{
                                    this.setClickTutorialPassage(e);
                                    this.setValidMoves(e, 0);
                                    this.setState({
                                        tutorialExercisePass: this.state.tutorialExercisePass+1,
                                        moveToNext: false,
                                        free_annotation_passage: false
                                    });
                                }
                                
                        }}
                    />		
                ))}
                </div>
               

                <TutorialExamplesDone 
                    //Quality control example: example_5 
                    //show={this.state.showTutorialClick} 
                    //show={this.state.tutorialExercisePass === 0}	
					show={this.state.tutorialExercisePass === this.qc_examples_index['example_5']-1}	
                    closeAndNext={() => {
                        this.setClickTutorialPassage('example_5');
                        this.setValidMoves('example_5', 0);
                        this.setState({
                            showTutorialClick: false, 
                            showClickPrompt: true, 
                            tutorialMode: 'examples',
                            tutorialExercisePass: this.state.tutorialExercisePass+1,
                            moveToNext: false,
                            free_annotation_passage: true
                        });
                    }}
				/> 

                <DoneModal
                    show={this.state.tutorialExercisePass === this.qc_examples_index['example_5']+1}
                    giveQualification={this.giveQualification}
                    getNextPassageCode={this.getNextPassageCode}  
                    showCode={this.showCode}
                    handleSubmit={this.handleSubmit}
                />

                {/*<DoneModal
                    show={this.state.tutorialExercisePass === 2}
                    giveQualification={this.giveQualification}
                    getNextPassageCode={this.getNextPassageCode}  
                    showCode={this.showCode}
                    handleSubmit={this.handleSubmit}
                />*/}
				

                <div className="container-fluid">
                    <Row>
                        <KeyboardEventHandler
                            handleKeys={[
                                "a",
                                "d",
                                "ctrl+z",
                                "ctrl+y"
                            ]}
                            onKeyEvent={(key, e) => {
                                e.preventDefault();
                                this.handleKeyPress(key);
                            }}
                        />
					</Row>
                    <Row>
                        <Col md={{ order: 1, span: 2 }} xs={{ order: 1 }}>
                            <div className="div-center-parent-alert">
                                {
                                <Alert
                                    className="div-center-child"
                                    variant={
                                    this.state.currentMessage.length > 0
                                        ? this.state.currentMessageType
                                        : "success"
                                    }
                                >
                                    {this.state.currentMessage.length > 0
                                    ? this.state.currentMessage
                                    : "Happy Annotating!"}
                                </Alert>
                                }
                            </div>
                        </Col>
                        <Col md={{ order: 2, span: 8 }} xs={{ order: 2 }}>
                            {
                                this.state.showClickPrompt ?
                                <div>
                                    <TutorialPrompt
                                        keyboardTutorial={this.state.keyboardTutorial}
                                        tutorialMode={this.state.tutorialMode}
                                        step={this.state.tutorialStep}
                                    />
                                </div> 
                                : null
                            }
                        </Col>
                        <Col md={{ order: 3, span: 2 }} xs={{ order: 3 }}></Col>
                    </Row>
                    <Row>
                    <Col md={{ order: 1, span: 2 }} xs={{ order: 1 }}>
                        <div id="annotatingList" class="div-center-parent">
                            <span>Currently Annotating <br /> Entity {this.state.entity} </span>
                        </div>
                        <div id="list">{this.getEntitySummary()}</div>
                    </Col>
                    <Col md={{ order: 2, span: 8 }} xs={{ order: 2 }}>
                        <div class="flex-container" id="mainDoc" className="toggle-div-center">
                            <button id="prevTarg"
                                disabled={this.state.targetPointer === 0}
                                onClick={() => {
                                    this.handleChangeTarget("previous");
                                    document.activeElement.blur();
                                }}
                                type="submit"
                                className="btn"
                                title="Switch to previous existing target (Keyboard: p)"
                            >
                            <FontAwesomeIcon icon={faArrowLeft} />
                            <a>  Previous Target</a>
                            </button>

                            &nbsp;
                            &nbsp;

                            <button id="nextTarg"
                                disabled={
                                    // this.state.doneWithPassage ||
                                    this.state.documentComplete
                                    // !this.state.learnedTarget
                                }
                                onClick={() => {
                                    if(!(this.state.targetPointer === this.state.currentMaxTarget)){
                                        console.log('handleChangeTarget');
                                        this.handleChangeTarget("next");
                                    }
                                    else{
                                        console.log('handleCreateTarget');
                                        this.handleCreateTarget();
                                    }
                                    document.activeElement.blur();
                                }}
                                type="submit"
                                className="btn"
                                title="Switch to the next existing target (Keyboard: n)"
                            >
                                <a>Next Target  </a>
                                <FontAwesomeIcon icon={faArrowRight} />
                            </button>
                
                            <button id="Undo"
                                disabled={(this.state.operationPointer === -1) || (this.state.tutorialExercisePass<this.examples_index['example_1'])}
                                onClick={() => {
                                    this.handleChangeOperation("undo");
                                    document.activeElement.blur();
                                }}
                                type="submit"
                                className="btn"
                                title="Undo the latest action (Keyboard: Ctrl+Z)"
                            >
                                <FontAwesomeIcon icon={faUndo} />
                            </button>

                            &nbsp;

                            <button id="Redo"
                                disabled={
                                    (this.state.operationPointer === this.state.operationStack.length - 1) ||
                                    (this.state.tutorialExercisePass<this.examples_index['example_1'])
                                }
                                onClick={() => {
                                    this.handleChangeOperation("redo");
                                    document.activeElement.blur();
                                }}
                                type="submit"
                                className="btn"
                                title="Redo the latest action (Keyboard: Ctrl+Y)"
                            >
                                <FontAwesomeIcon icon={faRedo} />
                            </button>
                        </div>
                        <br/>
                        <Document
                            actionClick={currSpan =>
                                this.handleClick(
                                    currSpan,
                                    this.state.entity,
                                    "leftClick"
                                )
                            }

                            actionRightClick={currSpan =>
                                this.handleClick(
                                    currSpan,
                                    this.state.entity,
                                    "rightClick"
                                )
                            }

                            actionHover={(currSpan, enter) =>
                                this.handleHover(currSpan, enter)
                            }

                            showHints={this.state.showHints}

                            showAnnotations={this.state.showAnnotations}

                            activeTarget={
                                this.state.targetList.length === 0
                                    ? null
                                    : this.state.targetList[
                                            this.state.targetPointer
                                        ]
                            }

                            activeCandidate={
                                this.state.candidateList.length === 0
                                    ? null
                                    : this.state.candidateList[
                                            this.state.candidatePointer
                                        ]
                            }

                            currDocument={this.state.currDocument}
                            numSents={this.state.numSents}
                            annotations={this.state.annotations}
                            setAnnotations={a => this.setAnnotations(a)}
                            targets={this.state.targets}
                            entity={this.state.entity}
                            handleKeyPress={k => this.handleKeyPress(k)}
                        />  
                   
                        <div class="flex-container" className="toggle-div" id="toggle-buttons">
                            <button title="moveNext" id="moveNext"
                                disabled={!this.state.moveToNext}
                                onClick={() => {
                                    if (this.state.moveToNext) {
                                        this.handleMoveToNextTask();
                                    }
                                    document.activeElement.blur();
                                    }
                                }
                                type="submit"
                                className="btn"
                                >
                                <a>Continue</a>
                            </button>
                        </div>
                    </Col>
                    <Col md={{ order: 3, span: 2 }} xs={{ order: 3 }}>
                            <div>
                                <div> <span> </span></div>
                                <div class="flex-container"><span><h5>Shortcuts</h5></span></div>
                                <table class="table table-striped" id="keys">
                                    <thead>
                                        <tr>
                                        <th>Function</th>
                                        <th>Key</th>
                                        </tr>
                                    </thead>
                                    <tr>
                                        <td>Previous Target</td>
                                        <td><b>a</b></td>
                                    </tr>
                                    <tr>
                                        <td>Next Target</td>
                                        <td><b>d</b></td>
                                    </tr>
                                    <tr>
                                        <td>Undo </td>
                                        <td><b>Ctrl + Z</b></td>
                                    </tr>
                                    <tr>
                                        <td>Redo </td>
                                        <td><b>Ctrl + Y</b></td>
                                    </tr>
                                </table>
                            </div>
                        </Col>
                    </Row>
                </div>
            </div>
        );
    }
}

export default Tutorial;
