import { buildSpanFromOffsets, getSpanFamily } from "./spanUtils.js";

export let colors = [
    "blue",
    "green",
    "pink",
    "orange",
    "purple",
    "teal",
    "tan",
    "red",
    "cobalt",
    "brown",
    "slate",
    "fuchsia",
    "gray"
];

export let addPreExistingAnnotations = (currDocument, annotations) => {
		for (let sentIndex = 0; sentIndex < annotations.length; ++sentIndex) {
				for (const [key, val] of Object.entries(annotations[sentIndex])) {
						currDocument[sentIndex][key[0]].colorIndex = val
				}
		}
		return currDocument
}

export let sameAnnotations = (a, b) => {
    let sameListDict = (a, b) => {
        if (Object.keys(a).length !== Object.keys(b).length) return false
        for (const [key, val] of Object.entries(a)) {
						if (b[key].length !== val.length) return false
            for (let i = 0; i < val.length; ++i) {
                if (b[key][i] !== val[i]){
                    return false;
                } 
            }
        }
        return true;
    };

    b = b.filter(function(el) {
        return el != null;
    });

    if (a.length !== b.length) return false

    for (let i = 0; i < a.length; ++i) {
        if (!sameListDict(a[i], b[i])) {
            return false;
        }
    }
    return true;
};

export let cyclePointer = (pointer, total) => {
    if (pointer < 0) {
        return total - 1;
    } 
    else if (pointer >= total) {
        return 0;
    } 
    else {
        return pointer;
    }
};

export let alignPointer = (pointer, spanList, targetSpan) => {
    spanList.forEach((span, index) => {
        if (span.equals(targetSpan)) pointer = index;
    });
    return pointer;
};

export let getEntitySpans = (candidateList, currDoc, currentEntity) => {
    let entityFilter = x => x.colorIndex.indexOf(currentEntity) !== -1;
    return candidateList.filter(candidateSpan =>
        entityFilter(currDoc[candidateSpan.sentIndex][candidateSpan.wordIndex])
    );
};

//AG : what is duplicate spans?
export let addDuplicateSpans = (currSpan, candidateList, currDoc, entity) => {
    let originalSpan = [currSpan];
    // If this is un-clicking a word, do no bubble event to duplicate strings
    if (isSpanClicked(currSpan, currDoc, entity)) {
        return originalSpan;
    }
    let duplicateSpans = findExactStringSpans(currSpan, candidateList, currDoc);
    // Among the duplicate spans, remove the ones which are already clicked
    duplicateSpans = duplicateSpans.filter(x => !isSpanClicked(x, currDoc, -1));

    // Commented this code for now, which finds spans with same entity and removes them
    // It's probably a less annoying this way
    //
    // let duplicateSpansClicked = getEntitySpans(
    //     duplicateSpans, currDoc, entity
    // );
    // duplicateSpans = duplicateSpans.filter((x) => !duplicateSpansClicked.includes(x));

    return originalSpan.concat(duplicateSpans);
};

//AG : auto annotate spans with exact same string
export let findExactStringSpans = (currSpan, candidateList, currDoc) => {
    let exactStringMatch = (spanOne, spanTwo) => {
        let spanDataOne = currDoc[spanOne.sentIndex].slice(
            spanOne.spanLeft,
            spanOne.spanRight
        );
        let spanDataTwo = currDoc[spanTwo.sentIndex].slice(
            spanTwo.spanLeft,
            spanTwo.spanRight
        );
        let wordOne = spanDataOne.map(wordData => wordData.word).join(" ");
        let wordTwo = spanDataTwo.map(wordData => wordData.word).join(" ");
        let posOne = spanDataOne.map(wordData => wordData.pos);
        let posTwo = spanDataOne.map(wordData => wordData.pos);
        return (
            wordOne === wordTwo &&
            wordOne !== "I" &&
            wordTwo !== "I" &&
            wordOne !== "my" &&
            wordTwo !== "my" &&
            wordOne !== "your" &&
            wordTwo !== "your" &&
            wordOne !== "you" &&
            wordTwo !== "you" &&
            !(posOne.length === 1 && posOne[0] === "PRON") &&
            !(posTwo.length === 1 && posTwo[0] === "PRON") &&
            !spanOne.equals(spanTwo)
        );
    };
    return candidateList.filter(candidateSpan =>
        exactStringMatch(currSpan, candidateSpan)
    );
};

let updateAnnotations = (annotations, wordIndex, left, right, sentIndex, entity) => {
    let tuple = String([wordIndex, wordIndex+left, wordIndex+right]);

    if (entity === -1) {
        annotations[sentIndex][tuple] =  []
        return annotations
    }

    if (annotations.hasOwnProperty(sentIndex)) {
        if (annotations[sentIndex].hasOwnProperty(tuple)) {
            annotations[sentIndex][tuple].push(entity);
        } 
        else {
            annotations[sentIndex][tuple] = [entity];
        }
    } 
    else {
        // notation explanation: https://stackoverflow.com/questions/11508463/javascript-set-object-key-by-variable
        annotations[sentIndex] = { [tuple]: [entity] };
    }
    return annotations;
};

export let checkForTargetOrCandidate = (currSpan, currDoc) => {
    let currWord = currDoc[currSpan.sentIndex][currSpan.wordIndex];
    // Check whether a single token is in the span is a target or a candidate token
    return currWord.target || currWord.candidate;
};

export let isSpanClicked = (currSpan, currDoc, entity) => {
    let currWord = currDoc[currSpan.sentIndex][currSpan.wordIndex]; //AG: use for undo
    // Check whether a single token is in the span is a target or a candidate token
    return isClicked(currWord, entity);
};

export let isSpanSkipped = (currSpan, currDoc) => {
    let currWord = currDoc[currSpan.sentIndex][currSpan.wordIndex];
    // Check whether a single token is in the span is a target or a candidate token
    return currWord.skipped;
};

export let allSpansMarked = (candidateList, currDocument) => {
    let tempSpan;
    let allowSubmit=true;
    for (let i = 0; i < candidateList.length; i++) {
        tempSpan = candidateList[i];
        if (!isSpanClicked(tempSpan, currDocument, -1)){
            allowSubmit=false;
        }
    }
    if(allowSubmit===true){
        console.log('all spans have been marked.');
    }
    return allowSubmit;
};

// Given a passage like document, produce a ordered list of tuples where
// the first element is the sentence index and the second element is the
// word index.
export let createSpanList = (passage, filterFunction) => {
    let spanList = [];
    for (let i = 0; i < passage.length; ++i) {
        let spanTable = new Set();
        for (let j = 0; j < passage[i].length; ++j) {
            if (!filterFunction(passage[i][j])) continue;
            let localSpan = buildSpanFromOffsets(i, j, passage[i][j]);
            if (spanTable.has(localSpan.key)) continue;
            spanTable.add(localSpan.key);
            spanList.push(localSpan);
        }
    }
    return spanList;
};

export let handleMouseEvents = (
    currSpan,
    currDoc,
    annotations,
    operation,
    metadata = {},
    spansClicked = []
) => {
    //AG : what is span family? 
    let spanFamily = getSpanFamily(currSpan, currDoc);

    let sentIndex = currSpan.sentIndex;
    let entityListEdited = [];

    if (operation === "hover") {
        // Set the hover value for every element of the active span
        spanFamily.currentIndices.forEach(index => {
            currDoc[sentIndex][index].hover = metadata.enter;
        });
        // Set the hover value to the opposite for every element of the parent span
        spanFamily.parentIndices.forEach(index => {
            currDoc[sentIndex][index].hover = !metadata.enter;
        });
        // Quick and dirty solution to remove weird hover residues
        // This case is very rare though
        spanFamily.strangerIndices.forEach(index => {
            currDoc[sentIndex][index].hover = false;
        });
    } 
    
    //AG : what is metadata?
    else if (operation === "leftClick") {
        for (let idx = 0; idx < spanFamily.currentIndices.length; idx++){
            let index = spanFamily.currentIndices[idx];
            let entity = metadata.entity;
            entityListEdited = [metadata.entity];

            if (typeof currDoc[sentIndex][index].colorIndex === "undefined") {
                currDoc[sentIndex][index].colorIndex = [entity];
            } 
            else {
                let id = currDoc[sentIndex][index].colorIndex.indexOf(entity);
                if (id === -1) {
                    // If entity not already marked in span, add it
                    //AG : Undo operation does unassignment and not revert to previously marked entity
                    currDoc[sentIndex][index].colorIndex = [entity];
                    //currDoc[sentIndex][index].colorIndex.push(entity);
                } 
                else {
                    // If entity already present in span, remove it
                    // AG : Why is this needed?
                    currDoc[sentIndex][index].colorIndex.splice(id, 1);
                }
            }
            // If the current token has been skipped, reactivate it
            //AG : What is this skip logic? Related to skipclick? 
            currDoc[sentIndex][index].skipped = false;

            // If no entities are left, reflect this in the annotation list
            //AG : where is this used?
            if (!isClicked(currDoc[sentIndex][index], -1)) entity = -1;

            let left_offset = spanFamily.currentLeftOffsets[idx];
            let right_offset = spanFamily.currentRightOffsets[idx];

            annotations = updateAnnotations(
                annotations,
                index,
                left_offset,
                right_offset,
                sentIndex,
                Number(entity)
            );
        }
    } 
    else if (operation === "rightClick" || operation === "skipClick") {
        // make a copy of colorIndex
        entityListEdited = currDoc[sentIndex][spanFamily.currentIndices[0]].colorIndex.slice();
        for (let idx = 0; idx < spanFamily.currentIndices.length; idx++){
            let index = spanFamily.currentIndices[idx];
            currDoc[sentIndex][index].colorIndex = [];
            
            // If the activeTarget was right-clicked, mark it as skipped
            if (operation === "skipClick")
                currDoc[sentIndex][index].skipped = true;
            
            let left_offset = spanFamily.currentLeftOffsets[idx];
            let right_offset = spanFamily.currentRightOffsets[idx];
            annotations = updateAnnotations(annotations, left_offset, right_offset, index, sentIndex, -1);
        }
    }

    spansClicked.push({
        span: currSpan,
        entities: entityListEdited
    });

    return {
        currDoc: currDoc,
        annotations: annotations,
        spansClicked: spansClicked
    };
};

export let handleLeftClicks = (allSpans, updatedState, entity) => {
    //AG : leftclick needs for loop and rightclick does not?
    allSpans.forEach(span => {
        updatedState = handleMouseEvents(
            span,
            updatedState.currDoc,
            updatedState.annotations,
            "leftClick",
            { entity: entity },
            updatedState.spansClicked
        );
    });
    return updatedState;
};

export let handleRightClicks = (span, updatedState) => {
    updatedState = handleMouseEvents(
        span,
        updatedState.currDoc,
        updatedState.annotations,
        "rightClick",
        {},
        updatedState.spansClicked
    );
    return updatedState;
};

export let handleSkipClicks = (skipSpan, otherSpans, updatedState, entity) => {
    updatedState = handleMouseEvents(
        skipSpan,
        updatedState.currDoc,
        updatedState.annotations,
        "skipClick",
        {},
        updatedState.spansClicked
    );
    
    otherSpans.forEach(span => {
        updatedState = handleMouseEvents(
            span,
            updatedState.currDoc,
            updatedState.annotations,
            "leftClick",
            { entity: entity },
            updatedState.spansClicked
        );
    });
    return updatedState;
};

export let extractNextPassage = (document, annotations, startPointer) => {
    let nWords = 0;
    let numTargets = 0;
    let currPointer = startPointer;
    // Current filtering criteria is minimum length chunk satisfying
    // 1) number of words >= 100
    // 2) number of targets >= 5

    while (nWords < 500 || numTargets < 5) {
        nWords += document[currPointer].length;
        numTargets += document[currPointer].filter(word => word.target).length;
        currPointer += 1;
        if (currPointer === document.length) {
            break;
        }
    }

    let currDoc = document.slice(startPointer, currPointer);
    let targetList = createSpanList(currDoc, x => x.candidate && x.target);
    let candidateList = createSpanList(currDoc, x => x.candidate);

    // Simulate a left-click, but don't update the state just yet
    let entity = getBiggestEntity(currDoc) + 1;
    let allSpans = [targetList[0]];
    
    // let allSpans = addDuplicateSpans(
    //     targetList[0],
    //     candidateList,
    //     currDoc,
    //     entity
    // );

    let updatedState = {
        currDoc: currDoc,
        annotations: annotations,
        spansClicked: []
    };
    updatedState = handleLeftClicks(allSpans, updatedState, entity);

    return {
        currDoc: updatedState.currDoc,
        targetList: targetList,
        candidateList: candidateList,
        pointer: currPointer,
        newAnnotations: updatedState.annotations
    };
};

export let isClicked = (word, entity) => {
		if (entity === -1) {
			return word.colorIndex.length > 0 
		} 
        else 
        {
        return word.colorIndex.indexOf(entity) !== -1;
    }
};

//AG : biggest entity? Not sure, check where used 
export let getBiggestEntity = currDoc => {
    let biggestEntity = -1;
    for (let sentIndex = 0; sentIndex < currDoc.length; sentIndex++) {
        for (
            let wordIndex = 0;
            wordIndex < currDoc[sentIndex].length;
            wordIndex++
        ) {
            if (currDoc[sentIndex][wordIndex].colorIndex === undefined)
                continue;
            let currColorIndex = currDoc[sentIndex][wordIndex].colorIndex;
            for (
                let entityIndex = 0;
                entityIndex < currColorIndex.length;
                entityIndex++
            ) 
            {
                if (currColorIndex[entityIndex] > biggestEntity) {
                    biggestEntity = currColorIndex[entityIndex];
                }
            }
        }
    }
    return biggestEntity;
};

//AG : what is the basic data structure of currDoc?
