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

    setValue(conId) {
        var matrix = this.matrix;
        var conPort = db.conPorts.get(conId);
        if (matrix && conPort) {
            matrix.setKwmConnection(this.portNum, conPort.portNum);
        }
    }

    turnOffPort() {
        var matrix = this.matrix;
        if (matrix) {
            matrix.turnOffKwmConnection(this.portNum);
        }
    }

    get matrix() {
       return db.matrixs.get(this.matrixId);
    }
}