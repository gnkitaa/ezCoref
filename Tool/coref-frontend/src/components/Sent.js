import React, { Component } from "react";
import "./NounChunk.css";
import { isClicked, colors } from "./utils.js";
import { buildSpanFromOffsets } from "./spanUtils.js";

class Sent extends Component {
  isActiveTarget(currSpan) {
    let activeTarget = this.props.activeTarget;
    if (activeTarget === null) {
      return false;
    } else {
      return activeTarget.equals(currSpan);
    }
  }

  isActiveCandidate(currSpan) {
    let activeCandidate = this.props.activeCandidate;
    if (activeCandidate === null) {
      return false;
    } else {
      return activeCandidate.equals(currSpan);
    }
  }

  createColorSpanList = () => {
    let word_list = this.props.sentence;
    let colorSpanList = [];

    for (let i = 0; i <= word_list.length; ++i) {
      colorSpanList.push([]);
    }

    let spanTable = new Set();

    for (let i = 0; i < word_list.length; ++i) {
      let currSpan = buildSpanFromOffsets(
        this.props.sentIndex,
        i,
        word_list[i]
      );

      let skip = false;
      let clicked = isClicked(word_list[i], -1);
      let style = "";
      let innerStyle = "";

      if (clicked && this.props.showAnnotations) {
        let n = word_list[i].colorIndex.length - 1;
        let nModulo = word_list[i].colorIndex[n] % colors.length;
        style = "highlight " + colors[nModulo];
      } else {
        style = "highlight__content";
        if (
          word_list[i].candidate &&
          !word_list[i].skipped &&
          this.props.showHints
        )
          style += " candidate";
        else if (
          word_list[i].candidate &&
          word_list[i].skipped &&
          this.props.showAnnotations
        )
          style += " skipped_candidate";
        else style += " candidate-off";
      }

      if (this.isActiveTarget(currSpan)) {
        style += " active_target_blink";
      }

      if (this.isActiveCandidate(currSpan)) {
        innerStyle += " active_candidate";
      }

      if (word_list[i].hover) style += " active";

      // This prevents colorSpanList from getting duplicate entries
      if (spanTable.has(currSpan.key)) continue;
      spanTable.add(currSpan.key);

      colorSpanList[currSpan.spanLeft].push({
        action: "<span>",
        length: currSpan.length,
        style: style,
        innerStyle: innerStyle,
        skip: skip,
        colorIndex: word_list[i].colorIndex,
        clicked: clicked
      });
      colorSpanList[currSpan.spanRight].push({
        span: currSpan,
        action: "</span>",
        length: currSpan.length,
        style: style,
        innerStyle: innerStyle,
        skip: skip,
        colorIndex: word_list[i].colorIndex,
        clicked: clicked
      });
    }

    for (let i = 0; i < colorSpanList.length; ++i) {
      colorSpanList[i].sort((a, b) => {
        if (a.action === "<span>" && b.action === "</span>") {
          // a = <span> should always lie after b = </span>
          return 1;
        } else if (a.action === "</span>" && b.action === "</span>") {
          // For </span> tags we want the longer spans to come after
          return Math.sign(a.length - b.length);
        } else if (a.action === "<span>" && b.action === "<span>") {
          // For <span> tags we want the longer spans to come before
          return Math.sign(b.length - a.length);
        } else {
          // b = <span> should always lie after a = </span>
          return -1;
        }
      });
    }

    return colorSpanList;
  };

  outputSent = () => {
    let word_list = this.props.sentence;
    let colorSpanList = this.createColorSpanList();
    let stack = [[]];
    let new_elem = null;
    for (let i = 0; i <= word_list.length; ++i) {
      if (colorSpanList[i].length > 0) {
        for (let j = 0; j < colorSpanList[i].length; ++j) {
          if (colorSpanList[i][j].action === "<span>") {
            stack.push([]);
          } else {
            let currSpan = colorSpanList[i][j].span;
            new_elem = stack.pop();
            let label = colorSpanList[i][j].colorIndex.join(", "); //first colorIndex is 0

            stack[stack.length - 1].push(
              <span
                key={i.toString() + "_" + j.toString()}
                className={colorSpanList[i][j].style}
                onClick={e => {
                  e.stopPropagation();
                  this.props.actionClick(currSpan);
                }}
                onMouseEnter={e => {
                  this.props.actionHover(currSpan, true);
                }}
                onMouseLeave={e => {
                  this.props.actionHover(currSpan, false);
                }}
                onContextMenu={e => {
                  e.stopPropagation();
                  e.preventDefault();
                  this.props.actionRightClick(currSpan);
                  return false;
                }}
              >
                {colorSpanList[i][j].clicked && this.props.showAnnotations ? (
                  <span className={"highlight__label"}>
                    <strong>{label}</strong>
                  </span>
                ) : null}
                <span
                  className={colorSpanList[i][j].innerStyle + " inner_style"}
                >
                  {new_elem}
                </span>
              </span>
            );
          }
        }
      }
      if (i < word_list.length) {
        stack[stack.length - 1].push(
          <span
            className={"highlight__content"}
            key={word_list[i].word + "_" + i.toString()}
          >
            {word_list[i].word}
          </span>
        );
        if (i === 0 && word_list[i].word === word_list[i].speaker + ":") {
          stack[stack.length - 1] = <b>{stack[stack.length - 1]} </b>;
        }
      }
    }

    return <span className="highlight__content"> {stack.pop()} </span>;
  };

  render() {
    return (
      <div>
        <span
          className="highlight-container highlight__content"
          style={{ cursor: "pointer" }}
        >
          {this.outputSent()}
        </span>
        <br />
      </div>
    );
  }
}

export default Sent;
