import {
  flowRendererV2,
  flowStyles
} from "./chunk-2KJI6OQF.js";
import {
  flowDb,
  parser$1
} from "./chunk-6F6H23U2.js";
import "./chunk-WKR2CXFY.js";
import "./chunk-7JSP3WU7.js";
import "./chunk-5BKX7J26.js";
import "./chunk-53OMPJRB.js";
import "./chunk-EEJNJ7DW.js";
import "./chunk-BRSKLZW4.js";
import {
  require_dayjs_min,
  require_dist,
  setConfig
} from "./chunk-GLVI7ZRI.js";
import {
  __toESM
} from "./chunk-USJHI7ER.js";

// node_modules/mermaid/dist/flowDiagram-v2-fe64f300.js
var import_dayjs = __toESM(require_dayjs_min(), 1);
var import_sanitize_url = __toESM(require_dist(), 1);
var diagram = {
  parser: parser$1,
  db: flowDb,
  renderer: flowRendererV2,
  styles: flowStyles,
  init: (cnf) => {
    if (!cnf.flowchart) {
      cnf.flowchart = {};
    }
    cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
    setConfig({ flowchart: { arrowMarkerAbsolute: cnf.arrowMarkerAbsolute } });
    flowRendererV2.setConf(cnf.flowchart);
    flowDb.clear();
    flowDb.setGen("gen-2");
  }
};
export {
  diagram
};
//# sourceMappingURL=flowDiagram-v2-fe64f300-FNIEBLPZ.js.map
