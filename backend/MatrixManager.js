var nextMatrixId = 1;
var nextConPortId = 1;
var nextCpuPortId = 1;

var matrixs = [];
var conPorts = [];
var cpuPorts = [];

var videoConnections = { };
var kwmConnections = { }

function createMatrix(ip, slug, port, cons, cpus) {
    var id = nextMatrixId++;
    var newMatrix = {
        id,
        slug,
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
            portNum: i+1,
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
            portNum: i+1,
            matrix
        };
        ports.push(cpuPort);
        cpuPorts.push(cpuPort);
    }
    return ports;
}

createMatrix("192.168.180.19", "matriisi1", 5555, 16, 16);
createMatrix("192.168.180.20", "matriisi2", 5555, 16, 16);
 
export const fetchMatrix = (slug) => {
    var matrix;
    matrixs.some(m => {
        if (m.slug === slug) {
             matrix = m;
             return true;
        }
    });
    return matrix;
}

export const fetchMatrixById = (id) => {
    return matrixs.find(p => {
        if (p.id == id) {
            return p;
        }
    })
}

exports.fetchMatrixs = function () {
    return matrixs;
}

exports.fetchConPorts = function () {
    return conPorts;
}

exports.fetchCpuPorts = function () {
    return cpuPorts;
}

export const setVideoConnection = (con, cpu) => {
    videoConnections[con] = cpu;
}

export const setKwmConnection = (con, cpu) => {
    kwmConnections[con] = cpu;
}

export const turnOffVideoConnection = (con) => {
    videoConnections[con] = null;
}

export const turnOffKwmConnection = (cpu) => {
    kwmConnections[cpu] = null;
}

export const getVideoConnections = () => {
    return videoConnections;
}

export const getKwmConnections = () => {
    return kwmConnections;
}

export const editMatrix = (props) => {
    var matrix = matrixs.find(p => p.id == props.id);
    if (matrix) {
        if (props.slug) {
            matrix.slug = props.slug;
        }
        if (props.ip) {
            matrix.ip = props.ip;
        }
        if (props.port) {
            matrix.port = props.port;
        }
        if (props.conPortAmount) {
            matrix.conPortAmount = props.conPortAmount;
        }
        if (props.cpuPortAmount) {
            matrix.cpuPortAmount = props.cpuPortAmount;
        }
        return matrix;
    }
}

export const editConPort = (props) => {
    var conPort = conPorts.find(p => p.id == props.id);
    if (conPort) {
        if (props.slug) {
            conPort.slug = props.slug;
        }
        return conPort;
    }
}

export const editCpuPort = (props) => {
    var cpuPort = cpuPorts.find(p => p.id == props.id);
    if (cpuPort) {
        if (props.slug) {
            cpuPort.slug = props.slug;
        }
        return cpuPort;
    }
}