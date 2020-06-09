import React from "react";
import {parse} from 'newick-js'
import logo from "./logo.svg";
import "./App.css";
const rootTree = {
  name: "Mammal Ancestor",
  children: [
    {
      name: "Primate ancestor",
      children: [{ name: "Human" }, { name: "Ape" }],
    },
    { name: "Rodent ancestor", children: [{ name: "Mouse" }, { name: "Rat" }] },
  ],
};

function Tree(props) {
  const { tree, layer = 1 } = props;

  const { name, children } = tree;
  console.log(name, layer);

  return (
    <div>
      <h1 style={{ fontSize: 150 - layer * 40 }}>{name}</h1>
      {children
        ? children.map((child) => <Tree tree={child} layer={layer + 1} />)
        : null}
    </div>
  );
}

function App() {

  const result = parse("(Pongo:15.76,(Gorilla:9.06,(Pan:6.65,Homo:6.65):2.41)Homininae:6.70)Hominidae:4.43;");

  console.log(result)

  return (
    <div className="App">
      <Tree tree={rootTree} />
    </div>
  );
}

export default App;
