
import Immutable, {
    Map
} from "immutable";

export default class extends Immutable.Record({
	matrixs: new Map(),
    conPorts: new Map(),
    cpuPorts: new Map()
}) {


}