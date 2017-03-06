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

    setValue(conNum) {
        var matrix = this.matrix;
        if (matrix) {
            matrix.setKwmConnection(this.portNum, conNum);
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