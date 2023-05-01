import "bootstrap/dist/css/bootstrap.css";
import { Redirect } from "react-router-dom";
import React, { Component } from "react";
import "./AnnotatorSignIn.css";

function getUrlVals() {
  var vars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(
    m,
    key,
    value
  ) {
    vars[key] = value;
  });

  console.log(parts)
  return vars;
}

 export let hashCode = (s) => {
    var hash = 0,
      i,
      chr;
    if (s.length === 0) return hash;
    for (i = 0; i < s.length; i++) {
      chr = s.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

class Annotator extends Component {
  constructor(props) {
    super(props);

    this.state = { email: "", toContext: false, workerId: "" };
    this.emailWritten = this.emailWritten.bind(this);
  }


  handleStart = () => {
    var id = hashCode(this.state["email"]);
    this.setState({ toContext: true, hash_id: id});
  };

  emailWritten(e) {
    this.setState({ email: e.target.value });
  }

  workerIdWritten = e => {
    this.setState({ workerId: e.target.value });
  };

  render() {
    if (this.state.toContext === true) {
      console.log(this.state["hash_id"]);
      console.log('redirecting')
      return (
        <Redirect
          to={{
            pathname: "/context?id=" + this.state["hash_id"],
            state: {
              id: this.state.email,
              workerid: this.state.workerId,
              hash: this.state["hash_id"],
              hitId: getUrlVals().hitId,
              workerId: getUrlVals().workerId,
            }
          }}
        />
      );
    }
    return (
      <body className="text-center">
        <form className="form-signin">
          <h1 className="h3 mb-3 font-weight-normal">Coref Annotation</h1>
          <p>Please enter your email and worker id:</p>
          <img
            className="mb-4"
            src="https://cdn.shopify.com/s/files/1/1061/1924/products/Writing_Hand_Emoji_Icon_ios10_large.png"
            alt=""
            width="72"
            height="72"
          />
          <input
            onChange={this.emailWritten}
            type="email"
            id="inputEmail"
            className="form-control"
            placeholder="email"
            required
            autofocus
          />
          <br />
          <button
            disabled={!this.state.email}
            onClick={this.handleStart}
            className="btn btn-lg btn-primary btn-block"
            type="submit"
          >
          Start
          </button>
          <br />
          <p>HIT Id: {getUrlVals().hitId}</p>
          <p>Worker Id: {getUrlVals().workerId}</p>
        </form>
      </body>
    );
  }
}

export default Annotator;
