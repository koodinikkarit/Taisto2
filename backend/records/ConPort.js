import Immutable from "immutable";

import {
    db
} from "../TaistoService";

export default class extends Immutable.Record({
	id: null,
    slug: "",
    matrixId: "",
    portNum: null
}) {

    setValue(cpuId) {
        var matrix = this.matrix;
        var cpuPort = db.cpuPorts.get(cpuId);
        if (matrix && cpuPort) {
            matrix.setVideoConnection(this.portNum, cpuPort.portNum);
        }
    }

    turnOffPort() {
        var matrix = this.matrix;
        if (matrix) {
            matrix.turnOffVideoConnection(this.portNum);
        }
    }

    get matrix() {
        return db.matrixs.get(this.matrixId);
    }
}