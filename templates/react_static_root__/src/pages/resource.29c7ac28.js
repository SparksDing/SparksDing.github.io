(window.webpackJsonp=window.webpackJsonp||[]).push([[13],{104:function(e,a,t){"use strict";t.r(a),t.d(a,"default",(function(){return E}));var n=t(0),r=t.n(n),o=t(9),l=t(206),c=t(231),i=t(233),s=t(235),d=t(230),m=t(232),u=t(236),b=t(183),p=t(210),f=Object(o.a)((function(e){return{head:{backgroundColor:e.palette.text.disabled,color:e.palette.common.white},body:{fontSize:14}}}))(s.a),v=Object(o.a)((function(e){return{root:{"&:nth-of-type(odd)":{backgroundColor:e.palette.action.hover}}}}))(u.a),g=[{id:1,name:"数据资源名",link:"数据资源链接"},{id:2,name:"数据资源名",link:"数据资源链接"},{id:3,name:"数据资源名",link:"数据资源链接"},{id:4,name:"数据资源名",link:"数据资源链接"},{id:5,name:"数据资源名",link:"数据资源链接"}],y=Object(l.a)({table:{minWidth:700},root:{display:"flex",flexDirection:"column",justifyContent:"space-around",alignItems:"center",width:"100%"},table_container:{width:"80%",padding:"30px"},contact:{width:"100%",display:"flex",justifyContent:"space-around",backgroundColor:"#303440"},contact_item:{display:"flex",flexDirection:"column",alignItems:"center",padding:"20px"}});function E(){var e=y();return r.a.createElement("div",{className:e.root},r.a.createElement("div",{className:e.table_container},r.a.createElement(d.a,{component:b.a},r.a.createElement(c.a,{className:e.table,"aria-label":"customized table"},r.a.createElement(m.a,null,r.a.createElement(u.a,null,r.a.createElement(f,null,"id"),r.a.createElement(f,{align:"right"},"name"),r.a.createElement(f,{align:"right"},"link"))),r.a.createElement(i.a,null,g.map((function(e){return r.a.createElement(v,{key:e.id},r.a.createElement(f,null,e.id),r.a.createElement(f,{align:"right"},e.name),r.a.createElement(f,{align:"right"},e.link))})))))),r.a.createElement("div",{className:e.contact},r.a.createElement("div",{className:e.contact_item},r.a.createElement("div",null,r.a.createElement(p.a,{style:{color:"#5B5D62"}},"Copyright © 2022 南京理工大学智能媒体分析实验室. All rights reserved.")),r.a.createElement("div",null,r.a.createElement(p.a,{gutterBottom:!0,style:{color:"#5B5D62"}},"Theme: ColorMag by ThemeGrill. Powered by WordPress.")))))}},230:function(e,a,t){"use strict";var n=t(1),r=t(3),o=t(0),l=(t(2),t(5)),c=t(9),i=o.forwardRef((function(e,a){var t=e.classes,c=e.className,i=e.component,s=void 0===i?"div":i,d=Object(r.a)(e,["classes","className","component"]);return o.createElement(s,Object(n.a)({ref:a,className:Object(l.a)(t.root,c)},d))}));a.a=Object(c.a)({root:{width:"100%",overflowX:"auto"}},{name:"MuiTableContainer"})(i)},231:function(e,a,t){"use strict";var n=t(3),r=t(1),o=t(0),l=(t(2),t(5)),c=t(9),i=t(225),s=o.forwardRef((function(e,a){var t=e.classes,c=e.className,s=e.component,d=void 0===s?"table":s,m=e.padding,u=void 0===m?"normal":m,b=e.size,p=void 0===b?"medium":b,f=e.stickyHeader,v=void 0!==f&&f,g=Object(n.a)(e,["classes","className","component","padding","size","stickyHeader"]),y=o.useMemo((function(){return{padding:u,size:p,stickyHeader:v}}),[u,p,v]);return o.createElement(i.a.Provider,{value:y},o.createElement(d,Object(r.a)({role:"table"===d?null:"table",ref:a,className:Object(l.a)(t.root,c,v&&t.stickyHeader)},g)))}));a.a=Object(c.a)((function(e){return{root:{display:"table",width:"100%",borderCollapse:"collapse",borderSpacing:0,"& caption":Object(r.a)({},e.typography.body2,{padding:e.spacing(2),color:e.palette.text.secondary,textAlign:"left",captionSide:"bottom"})},stickyHeader:{borderCollapse:"separate"}}}),{name:"MuiTable"})(s)},232:function(e,a,t){"use strict";var n=t(1),r=t(3),o=t(0),l=(t(2),t(5)),c=t(9),i=t(224),s={variant:"head"},d=o.forwardRef((function(e,a){var t=e.classes,c=e.className,d=e.component,m=void 0===d?"thead":d,u=Object(r.a)(e,["classes","className","component"]);return o.createElement(i.a.Provider,{value:s},o.createElement(m,Object(n.a)({className:Object(l.a)(t.root,c),ref:a,role:"thead"===m?null:"rowgroup"},u)))}));a.a=Object(c.a)({root:{display:"table-header-group"}},{name:"MuiTableHead"})(d)},233:function(e,a,t){"use strict";var n=t(1),r=t(3),o=t(0),l=(t(2),t(5)),c=t(9),i=t(224),s={variant:"body"},d=o.forwardRef((function(e,a){var t=e.classes,c=e.className,d=e.component,m=void 0===d?"tbody":d,u=Object(r.a)(e,["classes","className","component"]);return o.createElement(i.a.Provider,{value:s},o.createElement(m,Object(n.a)({className:Object(l.a)(t.root,c),ref:a,role:"tbody"===m?null:"rowgroup"},u)))}));a.a=Object(c.a)({root:{display:"table-row-group"}},{name:"MuiTableBody"})(d)}}]);