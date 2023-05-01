import React, { Component } from "react";
import Sent from "./Sent";
import { Modal } from "react-bootstrap";
import "./Document.css";

class Document extends Component {

    render() {
        return (
            <div
                onContextMenu={e => {
                    e.preventDefault();
                }}
            >
                <div className="annotation-text">
                <Modal.Dialog scrollable="true" className="annotation__text">
                    <Modal.Body >
                            {this.props.currDocument.map((sent, sentIndex) => (
                                <Sent
                                    showHints={this.props.showHints}
                                    showAnnotations={this.props.showAnnotations}
                                    activeTarget={this.props.activeTarget}
                                    activeCandidate={this.props.activeCandidate}
                                    actionClick={currSpan => this.props.actionClick(currSpan)}
                                    actionRightClick={currSpan => this.props.actionRightClick(currSpan)}
                                    actionHover={(currSpan, enter) => this.props.actionHover(currSpan, enter)}
                                    key={sentIndex}
                                    sentIndex={sentIndex}
                                    entity={this.props.entity}
                                    sentence={sent}
                                    annotations={
                                        this.props.annotations.length > sentIndex
                                            ? this.props.annotations[sentIndex]
                                            : {}
                                    }
                                    targets={this.props.targets[sentIndex]}
                                />
                            ))}
                        <div
                            style={{ float: "left", clear: "both" }}
                            ref={el => {
                                this.messagesEnd = el;
                            }}
                        ></div>
                    </Modal.Body>
                </Modal.Dialog>
            </div>
            </div>
        );
    }
}

export default Document;
