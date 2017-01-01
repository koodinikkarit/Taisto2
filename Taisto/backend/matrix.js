var nextMatrixId = 1;
var nextConPortId = 1;
var nextCpuPortId = 1;

var matrixs = [];
var conPorts = [];
var cpuPorts = [];



function createMatrix(ip, port, cons, cpus) {
    var id = nextMatrixId++;
    var newMatrix = {
        id,
        ip,
        port
    };
    newMatrix.conPorts = createConsForMatrix(cons, newMatrix);
    newMatrix.cpuPorts = createCpusForMatrix(cpus, newMatrix);
    matrixs.push(newMatrix);
}

function createConsForMatrix(count, matrix) {
    var ports = [];
    for (var i = 0; i < count; i++) {
        var conPort = {
            id: nextConPortId++,
            conNum: i+1,
            matrix
        }
        ports.push(conPort);
        conPorts.push(conPort);
    }
    return ports;
}

function createCpusForMatrix(count, matrix) {
    var ports = [];
    for (var i = 0; i < count; i++) {
        var cpuPort = {
            id: nextCpuPortId++,
            cpuNum: i+1,
            matrix
        };
        ports.push(cpuPort);
        cpuPorts.push(cpuPort);
    }
    return ports;
}

createMatrix("192.168.180.19", 5555, 16, 16);
createMatrix("192.168.180.20", 5555, 16, 16);


exports.fetchMatrixs = function () {
    return matrixs;
}

exports.fetchConPorts = function () {
    return conPorts;
}

exports.fetchCpuPorts = function () {
    return cpuPorts;
}
