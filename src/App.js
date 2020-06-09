import React from "react";
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
  return (
    <div className="App">
      <Tree tree={rootTree} />
    </div>
  );
}

export default App;
