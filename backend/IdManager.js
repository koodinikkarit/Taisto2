function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
}

function b64DecodeUnicode(str) {
    return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

exports.createIdForMatrix = function (matrixId) {

}

exports.createIdForConPort = function (conPortId) {

}

exports.createIdForCpuPort = function (cpuPortId) {

}

exports.convertToMatrixId = function (id) {

}

exports.convertToConPortId = function (id) {

}

exports.convertToCpuPortId = function (id) {
    
}