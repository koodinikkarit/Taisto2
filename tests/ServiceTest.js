
import TaistoService from "../backend/TaistoService";

var abc = String.fromCharCode(65, 65, 65, 0, 0, 0, 0, 0, 0, 0, 0, 0);
console.log(abc);

var service = new TaistoService();

service.connectMarix("192.168.180.201", 5555, "Testimatti", 16, 16);

service.listen();

var matti = service.db.matrixs.get(1);

console.log(matti.toJS());

matti.setVideoConnection(1, 10);