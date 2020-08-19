import React from "react"
import ReactDOM from "react-dom"

const HelloMessage = (props) => {
    return <div>Hello { props.name }</div>
}

var mountNode = document.getElementById("app")
ReactDOM.render(<HelloMessage name="World" />, mountNode)