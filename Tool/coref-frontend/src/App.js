import React from "react";
import "./App.css";
import AnnotationPage from "./components/AnnotationPage";
import { Route } from "react-router-dom";
import AnnotatorSignIn from "./AnnotatorSignIn";
import Tutorial from "./components/Tutorial"

function App() {
    return (
        <div>
            <Route exact path="/passage" component={AnnotationPage} />
            <Route exact path="/tutorial" component={Tutorial} />
        </div>
    );
}

export default App;
