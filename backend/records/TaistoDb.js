
import Immutable, {
    Map
} from "immutable";

export default class extends Immutable.Record({
    nextMatrixId: 1,
    nextConPortId: 1,
    nextCpuPortId: 1,
	matrixs: new Map(),
    conPorts: new Map(),
    cpuPorts: new Map()
}) {


}