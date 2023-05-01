export class Span {
    constructor(wordIndex, sentIndex, spanLeft, spanRight) {
        this.wordIndex = wordIndex;
        this.sentIndex = sentIndex;
        this.spanLeft = spanLeft;
        this.spanRight = spanRight;
        this.length = spanRight - spanLeft;
        this.key = "sent_" + sentIndex + "_left_" + spanLeft + "_right_" + spanRight;
        this.equals = (spanSecond) => {
            return (
                this.spanLeft === spanSecond.spanLeft &&
                this.spanRight === spanSecond.spanRight &&
                this.sentIndex === spanSecond.sentIndex
            );
        };
        this.isStranger = (spanSecond) => {
            // These spans have no intersection with the current span
            return (
                spanSecond.spanRight <= this.spanLeft ||
                spanSecond.spanLeft >= this.spanRight
            );
        };
        this.isChild = (spanSecond) => {
            // Check whether this span is strictly within spanSecond
            return (
                spanSecond.spanLeft <= this.spanLeft &&
                spanSecond.spanRight >= this.spanRight &&
                spanSecond.length > this.length
            );
        };
        this.isParent = (spanSecond) => {
            // Check whether spanSecond is strictly within this span
            return (
                spanSecond.spanLeft >= this.spanLeft &&
                spanSecond.spanRight <= this.spanRight &&
                spanSecond.length < this.length
            );
        };
    }
}

export let buildSpanFromOffsets = (sentIndex, wordIndex, word) => {
    return new Span(wordIndex, sentIndex, wordIndex + word.left_offset, wordIndex + word.right_offset);
}

export let getSpanFamily = (currSpan, currDoc) => {
    let sentIndex = currSpan.sentIndex;
    let allSpans = currDoc[sentIndex].map((word, wordIndex) => {
        return {
            wordIndex: wordIndex,
            span: buildSpanFromOffsets(sentIndex, wordIndex, word),
            left_offset:word.left_offset,
            right_offset:word.right_offset
        }
    });

    // These are the words which only belong to the current span
    let currentIndices = allSpans.filter((localSpan) => currSpan.equals(localSpan.span));
    // These are words unrelated to the current span
    let strangerIndices = allSpans.filter((localSpan) => currSpan.isStranger(localSpan.span));
    // These are the words which belong to a span which is a parent of the current span
    let parentIndices = allSpans.filter((localSpan) => currSpan.isChild(localSpan.span));
    // These are the words which belong to a span which is a child of the current span
    let childrenIndices = allSpans.filter((localSpan) => currSpan.isParent(localSpan));

    let keepIndices = (localSpan) => localSpan.wordIndex;
    let keepLeftOffsets = (localSpan) => localSpan.left_offset;
    let keepRightOffsets = (localSpan) => localSpan.right_offset;
    
    return {
        currentIndices: currentIndices.map(keepIndices),
        parentIndices: parentIndices.map(keepIndices),
        childrenIndices: childrenIndices.map(keepIndices),
        strangerIndices: strangerIndices.map(keepIndices),
        currentLeftOffsets:currentIndices.map(keepLeftOffsets),
        currentRightOffsets:currentIndices.map(keepRightOffsets)
    }
}
