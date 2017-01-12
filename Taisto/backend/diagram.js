var nextDiagramId = 1;
var nextDiagramScreenId = 1;

var diagrams = [];
var diagramScreens = [];

import {
    fetchConPorts,
    fetchCpuPorts
} from "./MatrixManager";

var cons = fetchConPorts();
var cpus = fetchCpuPorts();

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function createDiagram(slug, screens) {
    var newDiagram = {
        id: nextDiagramId++,
        slug
    };
    newDiagram.diagramScreens = createDiagramScreens(screens, newDiagram);
    diagrams.push(newDiagram);
}

function createDiagramScreens(screenCount, diagram) {
    var screens = [];
    for (var i = 0; i < screenCount; i++) {
        var newScreen = {
            id: nextDiagramScreenId++,
            conPort: cons[getRandomInt(0, cons.length)],
            cpuPorts: chooseRandomCpus(10)
        };
        diagramScreens.push(newScreen);   
        screens.push(newScreen);
    }
    return screens;
}

function chooseRandomCpus(count) {
    var ports = [];
    for (var i = 0; i < count; i++) {
        ports.push(cpus[getRandomInt(0, cpus.length)]);
    }
    return ports;
}

createDiagram("ylasali", 7);
createDiagram("alasali", 3);


exports.fetchDiagrams = function () {
    return diagrams;
}

export const fetchDiagram = (slug) => {
    var diagram;
    diagrams.forEach(d => {
        if (d.slug == slug) {
            diagram = d;
            return true;
        }
    });
    return diagram;
}