/* global d3 */
import React, { useEffect, useRef, useState } from "react";
import "./App.css";

// https://github.com/jasondavies/newick.js
function parseNewick(s) {
  var ancestors = [];
  var tree = {};
  var tokens = s.split(/\s*(;|\(|\)|,|:)\s*/);
  var subtree;
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    switch (token) {
      case "(": // new branchset
        subtree = {};
        tree.branchset = [subtree];
        ancestors.push(tree);
        tree = subtree;
        break;
      case ",": // another branch
        subtree = {};
        ancestors[ancestors.length - 1].branchset.push(subtree);
        tree = subtree;
        break;
      case ")": // optional name next
        tree = ancestors.pop();
        break;
      case ":": // optional length next
        break;
      default:
        var x = tokens[i - 1];
        if (x === ")" || x === "(" || x === ",") {
          tree.name = token;
        } else if (x === ":") {
          tree.length = parseFloat(token);
        }
    }
  }
  return tree;
}

const TreeOfLife = () => {
  const [data, setData] = useState();
  const ref = useRef();
  useEffect(() => {
    (async () => {
      const result = await fetch("life.txt");
      const text = await result.text();
      const tree = parseNewick(text);
      setData(tree);
    })();
  }, [setData]);

  useEffect(() => {
    const width = 954;
    const outerRadius = width / 2;
    const innerRadius = outerRadius - 170;
    const legend = (svg) => {
      const g = svg
        .selectAll("g")
        .data(color.domain())
        .join("g")
        .attr(
          "transform",
          (d, i) => `translate(${-outerRadius},${-outerRadius + i * 20})`
        );

      g.append("rect").attr("width", 18).attr("height", 18).attr("fill", color);

      g.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", "0.35em")
        .text((d) => d);
    };

    const cluster = d3
      .cluster()
      .size([360, innerRadius])
      .separation((a, b) => 1);

    const color = d3
      .scaleOrdinal()
      .domain(["Bacteria", "Eukaryota", "Archaea"])
      .range(d3.schemeCategory10);

    // Compute the maximum cumulative length of any node in the tree.
    function maxLength(d) {
      return d.data.length + (d.children ? d3.max(d.children, maxLength) : 0);
    }
    // Set the radius of each node by recursively summing and scaling the distance from the root.
    function setRadius(d, y0, k) {
      d.radius = (y0 += d.data.length) * k;
      if (d.children) d.children.forEach((d) => setRadius(d, y0, k));
    }
    // Set the color of each node by recursively inheriting.
    function setColor(d) {
      var name = d.data.name;
      d.color =
        color.domain().indexOf(name) >= 0
          ? color(name)
          : d.parent
          ? d.parent.color
          : null;
      if (d.children) d.children.forEach(setColor);
    }
    function linkVariable(d) {
      return linkStep(d.source.x, d.source.radius, d.target.x, d.target.radius);
    }
    function linkConstant(d) {
      return linkStep(d.source.x, d.source.y, d.target.x, d.target.y);
    }
    function linkExtensionVariable(d) {
      return linkStep(d.target.x, d.target.radius, d.target.x, innerRadius);
    }
    function linkExtensionConstant(d) {
      return linkStep(d.target.x, d.target.y, d.target.x, innerRadius);
    }
    function linkStep(startAngle, startRadius, endAngle, endRadius) {
      const c0 = Math.cos((startAngle = ((startAngle - 90) / 180) * Math.PI));
      const s0 = Math.sin(startAngle);
      const c1 = Math.cos((endAngle = ((endAngle - 90) / 180) * Math.PI));
      const s1 = Math.sin(endAngle);
      return (
        "M" +
        startRadius * c0 +
        "," +
        startRadius * s0 +
        (endAngle === startAngle
          ? ""
          : "A" +
            startRadius +
            "," +
            startRadius +
            " 0 0 " +
            (endAngle > startAngle ? 1 : 0) +
            " " +
            startRadius * c1 +
            "," +
            startRadius * s1) +
        "L" +
        endRadius * c1 +
        "," +
        endRadius * s1
      );
    }
    if (!data) {
      return;
    }

    const root = d3
      .hierarchy(data, (d) => d.branchset)
      .sum((d) => (d.branchset ? 0 : 1))
      .sort(
        (a, b) =>
          a.value - b.value || d3.ascending(a.data.length, b.data.length)
      );

    cluster(root);
    setRadius(root, (root.data.length = 0), innerRadius / maxLength(root));
    setColor(root);

    const svg = d3
      .create("svg")
      .attr("viewBox", [-outerRadius, -outerRadius, width, width])
      .attr("font-family", "sans-serif")
      .attr("font-size", 10);

    svg.append("g").call(legend);

    svg.append("style").text(`

  .link--active {
    stroke: #000 !important;
    stroke-width: 1.5px;
  }

  .link-extension--active {
    stroke-opacity: .6;
  }

  .label--active {
    font-weight: bold;
  }

  `);

    const linkExtension = svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-opacity", 0.25)
      .selectAll("path")
      .data(root.links().filter((d) => !d.target.children))
      .join("path")
      .each(function (d) {
        d.target.linkExtensionNode = this;
      })
      .attr("d", linkExtensionConstant);

    const link = svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#000")
      .selectAll("path")
      .data(root.links())
      .join("path")
      .each(function (d) {
        d.target.linkNode = this;
      })
      .attr("d", linkConstant)
      .attr("stroke", (d) => d.target.color);

    svg
      .append("g")
      .selectAll("text")
      .data(root.leaves())
      .join("text")
      .attr("dy", ".31em")
      .attr(
        "transform",
        (d) =>
          `rotate(${d.x - 90}) translate(${innerRadius + 4},0)${
            d.x < 180 ? "" : " rotate(180)"
          }`
      )
      .attr("text-anchor", (d) => (d.x < 180 ? "start" : "end"))
      .text((d) => d.data.name.replace(/_/g, " "))
      .on("mouseover", mouseovered(true))
      .on("mouseout", mouseovered(false));

    function update(checked) {
      const t = d3.transition().duration(750);
      linkExtension
        .transition(t)
        .attr("d", checked ? linkExtensionVariable : linkExtensionConstant);
      link.transition(t).attr("d", checked ? linkVariable : linkConstant);
    }

    function mouseovered(active) {
      return function (d) {
        d3.select(this).classed("label--active", active);
        d3.select(d.linkExtensionNode)
          .classed("link-extension--active", active)
          .raise();
        do {
          d3.select(d.linkNode).classed("link--active", active).raise();
        } while ((d = d.parent));
      };
    }

    const chart = Object.assign(svg.node(), { update });
    if (ref.current) {
      ref.current.appendChild(chart);
    }
  }, [data]);

  if (!data) {
    return null;
  }

  return <div ref={ref} />;
};

function App() {
  return (
    <div className="App">
      <TreeOfLife />
    </div>
  );
}

export default App;
