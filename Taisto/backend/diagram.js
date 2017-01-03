var nextDiagramId = 1;
var nextDiagramScreenId = 1;

var diagrams = [];
var diagramScreens = [];

var fetchConPorts = require("./matrix").fetchConPorts;
var fetchCpuPorts = require("./matrix").fetchCpuPorts;

var cons = fetchConPorts();
var cpus = fetchCpuPorts();

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function createDiagram(name, screens) {
    var newDiagram = {
        id: nextDiagramId++,
        name
    };
    newDiagram.diagramScreens = createDiagramScreens(screens, newDiagram);
    diagrams.push(newDiagram);
}

function createDiagramScreens(screenCount, diagram) {
    var screens = [];
    for (var i = 0; i < screenCount; i++) {
        var newScreen = {
            id: nextDiagramScreenId,
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
    for (var i = 0; i < count.lenght; i++) {
        ports.push(getRandomInt(0, cpus.length));
    }
    return ports;
}

createDiagram("Ylasali", 7);
createDiagram("Alasali", 3);


exports.fetchDiagrams = function () {
    return diagrams;
}