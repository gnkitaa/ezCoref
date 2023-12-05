
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
  Table,
  Modal,
  Button
} from "react-bootstrap";

import "./NounChunk.css";

import {
  handleMouseEvents,
  extractNextPassage,
  isSpanClicked,
  getBiggestEntity,
  isSpanSkipped,
  allSpansMarked,
  cyclePointer,
  getEntitySpans,
  colors,
  addDuplicateSpans,
  alignPointer,
  checkForTargetOrCandidate,
  handleLeftClicks,
  handleSkipClicks,
  handleRightClicks
} from "./utils.js";

import Toggle from "react-toggle";
import "react-toggle/style.css";
import "./AnnotationPage.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";


import {
  faUndo,
  faRedo,
  faArrowLeft,
  faPlus,
  faArrowRight,
  faCommentsDollar
} from "@fortawesome/free-solid-svg-icons";

import {
  MainIntroductionModal
} from "./AnnotationPageModalsPromots.js";

import { getOperation } from "./operationUtils.js";

let messages = {
  END_OF_DOCUMENT: "Done with document, refresh to continue.",
  END_OF_DOCUMENT_CLICK: "Document complete, please don't annotate. Refresh instead.",
  SINGLE_ENTITY: "Only a single entity is in use.",
  ENTITY_NOT_SELECTED: "Current span is not selected.",
  CLICK_AFTER: "Please don't mark/unmark spans without seeing annotations.",
  CLICK_ON_SPANS: "Please click on spans with boxes around them.",
  CLICK_ON_ACTIVE: "Please click on spans other than the active target.",
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
  END_OF_PASSAGE: "Passage complete. Review & press 'Submit' to move on.",
  UNDO_SINGLE: "Nothing to undo.",
  REDO_LAST: "Nothing to redo.",
  UNDO: "Un-did the previous operation '",
  REDO: "Re-did the next operation '",
  RIGHT_CLICK_EMPTY: "Please don't right-click unmarked spans.",
  SPANS_MISSING: "Some spans have not been annotated.",
  SUBMIT_DISABLED: "Complete annotations for all spans before submitting."
};

let port = '8853';
let server = 'http://xyz.abc.edu'

class AnnotationPage extends Component {
  constructor(props) {
    super(props);
    this.ats = [];
    let debug = false;
    const start_event = new Date();

    this.state = {
      document: [],
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
      showIntroduction: true,
      callGenerateCode: true,
      starttime: start_event.toUTCString(),
      endtime: ""
    };

    console.log('Page');
    console.log(props);

    this.handleClick = this.handleClick.bind(this);
  }

  documentToString = document => {
    let documentString = "";
    for (let i = 0; i < document.length; ++i) {
      for (let j = 0; j < document[i].length; ++j) {
        documentString += document[i][j].word;
      }
    }
    return documentString;
  };

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
        server+":"+port+"/code?hitId=" +
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

  componentDidMount() {
    if (this.state.debug) {
      console.log("debug");
      return;
    }

    let vars = this.getUrlVals();
    let workerId = vars.workerId;
    let assignmentId = vars.assignmentId;
    let hitId = vars.hitId;
    let debugDoc = vars.debugDoc;
    let debugChunk = vars.debugChunk;

    //AG: reading from this url
    let url =
            server+":"+port+"/passage?hitId=" +
            hitId +
            "&assignmentId=" +
            assignmentId+
            "&workerId="+
            workerId+
            "&debugDoc="+
            debugDoc+
            "&debugChunk="+
            debugChunk;
    
    console.log(url);

    fetch(url)
      .then(u => u.json())
      .then(json => {
        
        this.passageId = json["docId"];
        this.chunkId = json["chunkId"];
        let pointer = json["pointer"] * this.state.numSents;
        let annots = json["annotations"];

        let contextSents = [];
        let chunks = [];

        for (let i = 0; i < json["doc"].length; i++) {
          let tokens = json["doc"][i]["tokens"];
          for (let j = 0; j < tokens.length; j++) {
            tokens[j].skipped = false;
            if (tokens[j].colorIndex === undefined) {
              tokens[j].colorIndex = [];
            }
          }
          contextSents.push(tokens);
          chunks.push(json["doc"][i]["targets"]);
        }

        console.log(pointer);
        console.log(contextSents.length);

        if (pointer >= contextSents.length) {
          this.setState({
            document: contextSents,
            // Show last four sentences by default
            currDocument: contextSents.splice(
              contextSents.length - 4,
              contextSents.length
            ),
            targets: chunks,
            annotations: annots,
            pointer: pointer,
            candidateList: [],
            targetList: [],
            operationStack: [],
            operationPointer: -1,
            documentComplete: true,
            currentMessage: messages.END_OF_DOCUMENT,
            currentMessageType: "info"
          });
          console.log('pointer: '+pointer);
          console.log('contextlength: '+contextSents.length);
        } 
        else {
          console.log('pointer: '+pointer);
          console.log('contextlength: '+contextSents.length);

          let nextPassage = extractNextPassage(contextSents, annots, pointer);
          let candidatePointer = 0;
          if (nextPassage.targetList.length > 0) {
            candidatePointer = alignPointer(
              candidatePointer,
              nextPassage.candidateList,
              nextPassage.targetList[0]
            );
          }

          this.setState({
            document: contextSents,
            currDocument: nextPassage.currDoc,
            targets: chunks,
            pointer: nextPassage.pointer,
            candidateList: nextPassage.candidateList,
            targetList: nextPassage.targetList,
            operationStack: [],
            operationPointer: -1,
            currentMaxTarget: 0,
            annotations: nextPassage.newAnnotations,
            candidatePointer: candidatePointer,
            currentMessage: "",
            entity: 0
          });
        }
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
    else if (operation.operationType === "rightClick") {
      // When a right click is done on Redo, only one span will be affected
      updatedState = handleRightClicks(
        operationMetadata.spansClicked[0].span,
        updatedState
      );
      this.setState({
        currDocument: updatedState.currDoc,
        annotations: updatedState.annotations
      });
    } 
    else if (operationType === "skipClick") {
      let spansClicked = operationMetadata.spansClicked;
      let skipSpan = spansClicked[0].span;
      let otherSpans = spansClicked.slice(1).map(span => span.span);

      updatedState = handleSkipClicks(
        skipSpan,
        otherSpans,
        updatedState,
        spansClicked.length > 1 ? spansClicked[1].entities[0] : null
      );
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

    // This is the edge case where undo is disabled.
    if (operationPointer === -1 && changeType === "undo") {
      this.setState({
        currentMessage: messages.UNDO_SINGLE,
        currentMessageType: "danger"
      });
      return;
    } 
    // This is the edge case where redo is disabled.
    else if (
      operationPointer === operationStack.length - 1 &&
      changeType === "redo"
    ) {
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
      if (allSpansMarked(this.state.candidateList, this.state.currDocument)){
          currentMessage = currentMessage+'. '+messages.END_OF_PASSAGE;
      }

      this.setState({
        operationPointer: operationPointer,
        currentMessage: currentMessage,
        currentMessageType: "info",
        doneWithPassage: allSpansMarked(this.state.candidateList, this.state.currDocument),
      });

      // To handle the case of chaining of skipClick & createTarget
      if (
        currentOperation.chainPrevious &&
        operationStack[operationPointer].chainNext
      ) {
        currentOperation = operationStack[operationPointer];
        operationPointer--;
        this.setState({
          operationPointer: operationPointer,
          currentMessage:
            this.state.currentMessage +
            ", '" +
            currentOperation.operation.name +
            "'",
          currentMessageType: "info"
        });
        this.executeOperation(currentOperation.operation.inverse);
      }
    } 
    else {
      operationPointer++;
      let currentOperation = operationStack[operationPointer];
      this.executeOperation(currentOperation.operation);

      let currentMessage=messages.REDO + currentOperation.operation.name + "'";
      if (allSpansMarked(this.state.candidateList, this.state.currDocument)){
          currentMessage = currentMessage+'. '+messages.END_OF_PASSAGE;
      }

      this.setState({
        operationPointer: operationPointer,
        currentMessage: currentMessage,
        currentMessageType: "info",
        doneWithPassage: allSpansMarked(this.state.candidateList, this.state.currDocument),
      });
      

      if (
        currentOperation.chainNext &&
        operationStack[operationPointer + 1].chainPrevious
      ) {
        operationPointer++;
        currentOperation = operationStack[operationPointer];
        this.setState({
          operationPointer: operationPointer,
          currentMessage:
            this.state.currentMessage +
            ", '" +
            currentOperation.operation.name +
            "'",
          currentMessageType: "info"
        });
        this.executeOperation(currentOperation.operation);
      }
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


  handleClick = (currSpan, entity, clickType) => {
    if (this.handleClickEdgeCases(currSpan, clickType)) return;

    // AG: if activetarget is left/right-clicked, do nothing
    let activeTarget = this.state.targetList[this.state.targetPointer];
    if (activeTarget.equals(currSpan)){
      let currentMessage=messages.CLICK_ON_ACTIVE;
      if (allSpansMarked(this.state.candidateList, this.state.currDocument)){
          currentMessage = currentMessage+' '+messages.END_OF_PASSAGE;
      }
      this.setState({
        currentMessage: currentMessage,
        currentMessageType: "info",
        doneWithPassage: allSpansMarked(this.state.candidateList, this.state.currDocument),
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
      console.log('checking re-write condition');
      if (currDoc[currSpan.sentIndex][currSpan.wordIndex].colorIndex.length!==0) {
        console.log("newdentity : " +entity);
        let id = currDoc[currSpan.sentIndex][currSpan.wordIndex].colorIndex.indexOf(entity);
        if (id === -1) {
            oldentity = currDoc[currSpan.sentIndex][currSpan.wordIndex].colorIndex[0];
            console.log("oldentity : " +oldentity);
        }
      }

      let allSpans = [currSpan];
      updatedState = handleLeftClicks(allSpans, updatedState, entity);

      let operationPointer = this.state.operationPointer;
      let operationStack = this.state.operationStack;
      // Update stack of click operations for undo/redo
      operationStack = operationStack.slice(0, operationPointer + 1);

      //AG: metadata is list of all spans that were clicked, clickType is left, right or skip
      //pass state of old object and pass diff key in the dict

      if (typeof oldentity !== 'undefined'){
        inversespansClicked = [];
        inversespansClicked.push({
          span: updatedState.spansClicked[0].span,
          entities: [oldentity]
        });

      }

      operationStack.push({
        operation: getOperation(clickType, 
          {
          spansClicked: updatedState.spansClicked
          }, 
          {
          spansClicked: inversespansClicked
          }),
        chainNext: false,
        chainPrevious: false
      });
      operationPointer++;

      //AG: check if all spans have been annotated, if yes, mark doneWithPassage:true
      let currentMessage = "";
      if (allSpansMarked(this.state.candidateList, this.state.currDocument)){
          currentMessage = messages.END_OF_PASSAGE;
      }
      else{
          if(this.state.doneWithPassage){
            currentMessage = messages.SPANS_MISSING+' '+messages.SUBMIT_DISABLED;;
          }
      }

      this.setState({
        currDocument: updatedState.currDoc,
        annotations: updatedState.annotations,
        currentMessage: currentMessage,
        operationStack: operationStack,
        operationPointer: operationPointer,
        doneWithPassage: allSpansMarked(this.state.candidateList, this.state.currDocument),
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
    let docId = this.passageId;
    let chunkId = this.chunkId;

    //let docId = 1;
    //let chunkId = 0;
    
    const event = new Date();
    this.state.endtime = event.toUTCString();

    let obj = {
        docId: docId,
        chunkId: chunkId,
        annotations: arr,
        task_type: 'MAIN',
        start_time: this.state.starttime,
        end_time: this.state.endtime
    };
    

    let url =
        server+":"+port+"/annotations?hitId=" +
        hitId +
        "&assignmentId=" +
        assignmentId+
        "&workerId="+
        workerId;


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

  emailWritten = e => {
    this.setState({ email: e.target.value });
  };

  showCode = () => {
    this.generateCode();
  };

  handleNextPassageInter = () => {
    this.setState({
      email: "",
      nextPassageCode: "",
      submittedCode: false,
      validCode: undefined
    });
    this.handleNextPassage();
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


  handleNextPassageModal = () => {
    if (this.state.handleNextPassageModalShow===true){
      this.handleSubmit();
      this.showCode();
    }
    return (
      <Modal
        show={this.state.handleNextPassageModalShow}
        className={{ width: "500px" }}
      >
      <Modal.Header>
        <Modal.Title>
          HIT Completed
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Congratulations! You have successfully completed the HIT!</p>
        <p>Copy the <b>Code</b> below and go back to <b>Amazon Mechanical Turk.</b>  </p>
        <p>You will need to <b>enter this code</b> in order to <b>submit your HIT.</b></p>
        <p><b>IMPORTANT!</b> Your HIT will <b>NOT</b> be recorded or approved if you do not complete this step. </p>
        {this.getNextPassageCode()}
        <p>You can complete more HITs with the same title, if available.</p>
      </Modal.Body>
      </Modal>
    );
  };

  handleNextPassage = () => {
    this.handleNextPassageModalClose();
    this.handleSubmit();
    
    if (this.state.pointer === this.state.document.length) {
      this.setState({
        documentComplete: true,
        operationStack: [],
        operationPointer: -1,
        currentMessage: messages.END_OF_DOCUMENT,
        currentMessageType: "info"
      });
      return;
    }

    let nextPassage = extractNextPassage(
      this.state.document,
      this.state.annotations,
      this.state.pointer
    );

    // TODO :- handle case where nextPassage.pointer crosses document length
    // maybe refresh page?

    let candidatePointer = 0;
    if (nextPassage.targetList.length > 0) {
      candidatePointer = alignPointer(
        candidatePointer,
        nextPassage.candidateList,
        nextPassage.targetList[0]
      );
    }

    this.setState({
      oldPointer: this.state.pointer,
      pointer: nextPassage.pointer,
      currDocument: nextPassage.currDoc,
      targetList: nextPassage.targetList,
      candidateList: nextPassage.candidateList,
      annotations: nextPassage.newAnnotations,
      targetPointer: 0,
      currentMaxTarget: 0,
      operationStack: [],
      operationPointer: -1,
      candidatePointer: candidatePointer,
      doneWithPassage: false,
      currentMessage: messages.NEXT_PASSAGE,
      currentMessageType: "info",
      entity: 0
    });
  };

  handleChangeTarget = (operation, updateOperationStack = true) => {
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
    else if (operation === "previous"){
      targetPointer = targetPointer - 1;
    }

    //AG: boundary check for target pointer
    targetPointer = cyclePointer(
      targetPointer,
      this.state.currentMaxTarget + 1
    );
    
    //AG: the current flashing span
    let targetSpan = targetList[targetPointer];

    //AG : returns the index of the current flashing span. Why is this not same as targetPointer?
    let candidatePointer = alignPointer(
      this.state.candidatePointer,
      this.state.candidateList,
      targetList[targetPointer]
    );
    
    //AG: entity of previous flashing span
    let newEntity = this.state.entity;

    //AG: If the flashing span already contains an entity id, update newEntity variable to be this id.
    if (isSpanClicked(targetSpan, currDoc, -1)) {
      let colorIndex = currDoc[targetSpan.sentIndex][targetSpan.wordIndex].colorIndex;
      newEntity = colorIndex[colorIndex.length - 1];
      let operationPointer = this.state.operationPointer;
      let operationStack = this.state.operationStack;

      let currentMessage=operation === "next" ? messages.NEXT_TARGET : messages.PREVIOUS_TARGET;
      if (allSpansMarked(this.state.candidateList, this.state.currDocument)){
          currentMessage = currentMessage+' '+messages.END_OF_PASSAGE;
      }
      else if(this.state.doneWithPassage){
          currentMessage = currentMessage+' '+messages.SPANS_MISSING+' '+messages.SUBMIT_DISABLED;
      }

      this.setState({
        currentMessage:currentMessage,
        currentMessageType: "info",
        entity: newEntity,
        candidatePointer: candidatePointer,
        targetPointer: targetPointer,
        operationPointer: operationPointer,
        operationStack: operationStack,
        doneWithPassage: allSpansMarked(this.state.candidateList, this.state.currDocument),
      });
    }
    //AG: If the flashing span is empty, assign a new entity id.
    else{
      console.log('found an empty span. Creating a new entity.')
      this.handleCreateTarget(false, targetPointer);
    }
  };

  handleCreateTargetEdgeCases = () => {
    if (this.state.documentComplete) {
      this.setState({
        currentMessage: messages.END_OF_DOCUMENT_CLICK,
        currentMessageType: "danger"
      });
      return true;
    }
    if (this.state.doneWithPassage) {
      if (allSpansMarked(this.state.candidateList, this.state.currDocument)){
        this.setState({
          currentMessage: messages.END_OF_PASSAGE,
          currentMessageType: "info"
        });
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

  handleCreateTarget = (chainPrevious = false, targetPointer = -1) => {
    if (this.handleCreateTargetEdgeCases()) return;

    //AG: check if the current flashing span is empty, if true: assign a new id
    if(targetPointer!==-1){
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

      let operation = getOperation("createTarget", {
        prevTargetPointer: prevTargetPointer,
        nextTargetPointer: targetPointer,
        doneWithPassage: false,
        spansClicked: updatedState.spansClicked,
        prevEntity: prevEntity,
        nextEntity: newEntity,
        prevMaxTarget: currentMaxTarget,
        nextMaxTarget: nextMaxTarget
      });

      operationStack.push({
        operation,
        chainNext: false,
        chainPrevious: chainPrevious
      });

      operationPointer++;

      let currentMessage = messages.CREATE_TARGET + newEntity;

      if (allSpansMarked(this.state.candidateList, this.state.currDocument)){
          currentMessage = currentMessage +'. '+messages.END_OF_PASSAGE;
      }

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
        operationPointer: operationPointer,
        doneWithPassage: allSpansMarked(this.state.candidateList, this.state.currDocument),
      });      
    }
    //AG: normal case, previous code
    else{
      // Check if "Create" is happening on a skipped entity which is not the latest
      // Activate the entity if that's the case
      let currDoc = this.state.currDocument;
      let targetList = this.state.targetList;
      let prevEntity = this.state.entity;
      targetPointer = this.state.targetPointer;
      let currentMaxTarget = this.state.currentMaxTarget;
      let prevTargetPointer = this.state.targetPointer;

      
      let prevSkipped =
        targetPointer < currentMaxTarget &&
        isSpanSkipped(targetList[targetPointer], currDoc);

      if (!prevSkipped) {
        // Move the target pointer to the currentMaxTarget
        targetPointer = currentMaxTarget;
        // Wait till a target is found which is not clicked/skipped
        while (targetPointer < targetList.length) {
          let nextTarget = targetList[targetPointer];
          if (
            !isSpanClicked(nextTarget, currDoc, -1) &&
            !isSpanSkipped(nextTarget, currDoc)
          ) 
          {
            break;
          }
          targetPointer++;
        }
      }

      let operationPointer = this.state.operationPointer;
      let operationStack = this.state.operationStack;
      operationStack = operationStack.slice(0, operationPointer + 1);

      if (targetPointer === targetList.length) {
        let operation = getOperation("createTarget", {
          prevTargetPointer: prevTargetPointer,
          nextTargetPointer: targetList.length - 1,
          doneWithPassage: true,
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
        let currentMessage;
        if (allSpansMarked(this.state.candidateList, this.state.currDocument)){
            currentMessage = messages.END_OF_PASSAGE;
        }
        else{
          currentMessage = messages.SPANS_MISSING;
        }

        this.setState({
          targetPointer: targetList.length - 1,
          currentMaxTarget: targetList.length - 1,
          doneWithPassage: true,
          currentMessage: currentMessage,
          currentMessageType: "info",
          operationPointer: operationPointer,
          operationStack: operationStack,
          doneWithPassage: allSpansMarked(this.state.candidateList, this.state.currDocument),
        });

      }  
      else {
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

        let operation = getOperation("createTarget", {
          prevTargetPointer: prevTargetPointer,
          nextTargetPointer: targetPointer,
          doneWithPassage: false,
          spansClicked: updatedState.spansClicked,
          prevEntity: prevEntity,
          nextEntity: newEntity,
          prevMaxTarget: currentMaxTarget,
          nextMaxTarget: nextMaxTarget
        });

        operationStack.push({
          operation,
          chainNext: false,
          chainPrevious: chainPrevious
        });

        operationPointer++;

        let currentMessage=messages.CREATE_TARGET + newEntity;
        if (allSpansMarked(this.state.candidateList, this.state.currDocument)){
            currentMessage = currentMessage+'. '+messages.END_OF_PASSAGE;
        }

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
          operationPointer: operationPointer,
          doneWithPassage: allSpansMarked(this.state.candidateList, this.state.currDocument),
        });
    }


    }
  };

  handleHintsToggle = e => {
    this.setState({
      showHints: !this.state.showHints,
      currentMessage: this.state.showHints
        ? messages.TOGGLE_HINT_OFF
        : messages.TOGGLE_HINT_ON,
      currentMessageType: "info"
    });
  };

  handleAnnotationsToggle = e => {
    this.setState({
      showAnnotations: !this.state.showAnnotations,
      currentMessage: this.state.showAnnotations
        ? messages.TOGGLE_ANNOT_OFF
        : messages.TOGGLE_ANNOT_ON,
      currentMessageType: "info"
    });
  };

  changeEntity = newEntityId => {
    let currentMaxTarget = this.state.currentMaxTarget;
    let targetPointer = this.state.targetPointer;
    let prevTargetPointer = this.state.targetPointer;
    let currentEntity = this.state.entity;

    this.setState({
      entity: newEntityId,
      currentMessage: messages.SWITCH_ENTITY + newEntityId,
      currentMessageType: "info",
      //targetPointer: newEntityId
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
    let currentEntity = this.state.entity; //whatever entity we are on
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
            <span className="highlight__content">{uniqueWords[index]}</span>
          </span>
          <br />
        </div>
      );
    }
    let entity = this.state.entity;
    let targetPointer = this.state.targetPointer;
    return spanHTML;
  };

  render() {
    let biggestEntity = getBiggestEntity(this.state.currDocument);
    let entityList = [];
    let targetPointer = this.state.targetPointer;
    if (biggestEntity >= 0) entityList = [...Array(biggestEntity + 1).keys()];
    console.log('rendered AnnotationPage')

    return (
      <div>
        <MainIntroductionModal
          show={this.state.showIntroduction}
          closeAndNext={() =>
              this.setState({
                  showIntroduction: false
              })
          }
        />
        <div>{this.handleNextPassageModal()}</div>
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
          <div class="header-row">
            <Row>
              <Col md={{ order: 2, span: 11 }} xs={{ order: 1 }}>
                <div class="coref-header">
                  <b>coref</b>
                </div>
              &nbsp; &nbsp;
              <div class="coref-logo">
                  <img
                    className="mb-4"
                    src="https://cdn.shopify.com/s/files/1/1061/1924/products/Writing_Hand_Emoji_Icon_ios10_large.png"
                    alt=""
                    width="7%"
                    height="7%"
                  />
                </div>
              </Col>
            </Row>
          </div>
          <hr />
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

              <div id="annotatingList">
                  <span>Currently Annotating <br /> Entity {this.state.entity} </span>
              </div>
              <div id="list">{this.getEntitySummary()}</div>
            </Col>
            <Col md={{ order: 2, span: 7 }} xs={{ order: 2 }}>
              <div class="flex-container" id="mainDoc" className="toggle-div-center">

                <button title="Switch to previous existing target (Keyboard: p)" id="prevTarg"
                  disabled={this.state.targetPointer === 0}
                  onClick={() => {
                    this.handleChangeTarget("previous");
                    document.activeElement.blur();
                  }}
                  type="submit"
                  className="btn"
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  <a>  Previous Target</a>
                </button>

                &nbsp;
                &nbsp;

								<button title="Switch to the next existing target (Keyboard: n)" id="nextTarg"
                  disabled={
                    this.state.documentComplete
                  }
                  onClick={() => {
                    console.log(this.state.targetPointer);
                    console.log(this.state.currentMaxTarget);
                    if (!(this.state.targetPointer === this.state.currentMaxTarget)) {
                      this.handleChangeTarget("next");
                    }
                    else {
                      console.log('creating new target');
                      this.handleCreateTarget();
                    }
                    document.activeElement.blur();
                  }}
                  type="submit"
                  className="btn"
                >
                  <a>Next Target  </a>
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>
                
                &nbsp;
                &nbsp;

                <button title="Undo the latest action (Keyboard: Ctrl+Z)" id="Undo"
                  disabled={this.state.operationPointer === -1}
                  onClick={() => {
                    this.handleChangeOperation("undo");
                    document.activeElement.blur();
                  }}
                  type="submit"
                  className="btn"
                >
                  <FontAwesomeIcon icon={faUndo} />
                </button>
                &nbsp;
                <button title="Redo the latest action (Keyboard: Ctrl+Y)" id="Redo"
                  disabled={
                    this.state.operationPointer ===
                    this.state.operationStack.length - 1
                  }
                  onClick={() => {
                    this.handleChangeOperation("redo");
                    document.activeElement.blur();
                  }}
                  type="submit"
                  className="btn"

                >
                  <FontAwesomeIcon icon={faRedo} />
                </button>
              </div>

              <div id="doc">
                <Document
                  actionClick={currSpan =>
                    this.handleClick(currSpan, this.state.entity, "leftClick")
                  }
                  actionRightClick={currSpan =>
                    this.handleClick(currSpan, this.state.entity, "rightClick")
                  }
                  actionHover={(currSpan, enter) =>
                    this.handleHover(currSpan, enter)
                  }
                  showHints={this.state.showHints}
                  showAnnotations={this.state.showAnnotations}
                  activeTarget={
                    this.state.targetList.length === 0
                      ? null
                      : this.state.targetList[this.state.targetPointer]
                  }
                  activeCandidate={
                    this.state.candidateList.length === 0
                      ? null
                      : this.state.candidateList[this.state.candidatePointer]
                  }
                  currDocument={this.state.currDocument}
                  numSents={this.state.numSents}
                  annotations={this.state.annotations}
                  setAnnotations={a => this.setAnnotations(a)}
                  targets={this.state.targets}
                  entity={this.state.entity}
                  handleKeyPress={k => this.handleKeyPress(k)}
                />
              </div>

              <div className="toggle-div" id="toggle-buttons">
                &nbsp; &nbsp;&nbsp;
                
                <button title="Submit" id="submitPassage"
                  disabled={
                    !this.state.doneWithPassage
                  }
                  onClick={() => {
                      if (this.state.doneWithPassage) {
                        this.handleNextPassageModalClose();
                      }
                      document.activeElement.blur();
                    }
                  }
                  type="submit"
                  className="btn"
                >
                  <a>Submit </a>
                </button>

              </div>

            </Col>
            <Col md={{ order: 3, span: 3 }} xs={{ order: 3 }}>
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
                  <div> <h5> <a href="https://docs.google.com/presentation/d/1IlGuQtW_S07xzZWbYZj1Gi4VcZY9-dCO_4C7P8lKD2c/edit?usp=sharing" target="_blank"><u>Link to Tutorial</u></a> </h5></div>
             
                </div>
            </Col>
          </Row>
        </div>
      </div>
    );
  }
}

export default AnnotationPage;
