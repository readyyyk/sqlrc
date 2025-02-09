#! /usr/bin/env node
// by @readyyyk
var le=Object.create;var I=Object.defineProperty;var ce=Object.getOwnPropertyDescriptor;var pe=Object.getOwnPropertyNames;var me=Object.getPrototypeOf,ue=Object.prototype.hasOwnProperty;var fe=(t,e,s,o)=>{if(e&&typeof e=="object"||typeof e=="function")for(let n of pe(e))!ue.call(t,n)&&n!==s&&I(t,n,{get:()=>e[n],enumerable:!(o=ce(e,n))||o.enumerable});return t};var C=(t,e,s)=>(s=t!=null?le(me(t)):{},fe(e||!t||!t.__esModule?I(s,"default",{value:t,enumerable:!0}):s,t));var h=C(require("node:fs"),1),O=C(require("node:path"),1),B=t=>{let e=h.default.readFileSync(t,"utf-8");return JSON.parse(e)},z=(t,e)=>{let s=O.default.resolve(e,t.schema),o=t.queries.map(r=>O.default.resolve(e,r)),n=h.default.readFileSync(s,"utf-8"),a=o.map(r=>h.default.readFileSync(r,"utf-8"));return{schame:n,queries:a}},q=(t,e)=>{h.default.existsSync(e)||h.default.mkdirSync(O.default.dirname(e),{recursive:!0}),h.default.writeFileSync(e,t)};var P=["one","many","exec"],J=t=>P.includes(t),F=["TEXT","INTEGER"],X=t=>F.includes(t),Te=["int","string"];var $=Te,Z=t=>$.includes(t);var R={TEXT:"string",INTEGER:"int"},K={string:"string",int:"int"};var ye="CREATE",H=/(TABLE|table)\s+(\w+)/g,ge=2,G=t=>{let e=t.replaceAll(/--[^\n]*\n/g,`
`).split(ye).map(a=>a.trim()).filter(Boolean),s=e.map(a=>{let r=H.exec(a);return H.lastIndex=0,r}).map((a,r)=>{if(a===null)throw new Error(`Cant find table name in declaration: 
`+e[r]);return a[ge]}),o=e.map(a=>a.split("(").slice(1).join("(").split(/\)[^\)]*;$/)[0].split(/, *\n/).map(r=>r.trim()).filter(Boolean).map(r=>{let l=r.split(" ")[0],i=r.split(" ")[1];if(r.search("NOT NULL")===-1&&r.search("PRIMARY KEY")===-1&&console.warn("[WARN]: Nullable field found. NULL state is not handled in output code. Read github.com/re-worthy/sqlrc"),!X(i))throw new Error(`Unsupported column type. 
Got: `+i+`
Allowed are: `+JSON.stringify(F));return{name:l,type:i}})),n={};for(let a=0;a<s.length;a++){let r=s[a],l=o[a];for(let i of l)n[r]||(n[r]={}),n[r][i.name]={type:i.type}}return n};var de="--@",Ee=";",w=t=>{let e=t.split(de).map(n=>n.trim()).filter(Boolean),s=e.map(n=>n.split(Ee)).flat().map(n=>n.trim()).filter(Boolean);if(e.length!==s.length)throw new Error("You can use only one query per method. Consider using `Subqueries` or `CTEs`");let o=[];for(let n of s){let[a,...r]=n.split(`
`),l=r.map(T=>T.trimEnd()).filter(Boolean).join(`
`),[i,c,u]=a.split(":");if(!J(u))throw new Error(`Invalid query return type. 
Got: `+u+`
Allowed are: `+JSON.stringify(P));o.push({sql:l,name:c,type:u})}return o};var V=/(\<\@)([^:]+):([^\@]+)(\@\>)/g,he=2,Re=3,b=t=>{let e={queryToken:t,params:{},resultSql:""};e.resultSql=t.sql.replaceAll(V,"?");let s=e.queryToken.sql.matchAll(V),o=0;for(let n of s){let a=n[he],r=n[Re];if(!Z(r))throw new Error(`Invalid own type. 
Got: `+r+`
Allowed are: `+JSON.stringify($));e.params[a]={name:a,type:r,positions:e.params[a]?.positions?e.params[a].positions.concat(o):[o]},o++}return e};var ee="insert into ",te="update ",re="delete from ",ne=t=>{let e=t.toLowerCase(),s=e.indexOf(ee),o=e.indexOf(te),n=e.indexOf(re);if(s!==-1)return t.slice(s+ee.length).split(" ")[0];if(o!==-1)return t.slice(o+te.length).split(" ")[0];if(n!==-1)return t.slice(n+re.length).split(" ")[0];throw new Error("Cant get table from sql: "+t)};var xe=t=>{t=t.replace(/ as /i," ");let e=t.split(" ");if(e.length===1)return{[e[0]]:e[0]};let s=e.at(-1),o=e.slice(0,-1).join(" ");return{[s]:o}},v=t=>t.reduce((e,s)=>({...e,...xe(s)}),{}),se="returning",_e=(t,e)=>{let s=e.toLowerCase().lastIndexOf(se);if(s===-1)return;let o=e.slice(s+se.length).split(",").map(r=>r.trim()),n=ne(e),a=v(o);for(let[r,l]of Object.entries(a)){let i=l;if(!/^(\*|[a-zA-Z_0-9]+)$/.test(i)){let c=i.match(/(^|\s)(\*|[a-zA-Z_0-9]+)($|\s)/m);if(!c)throw new Error("Field name not found in: "+i);i=c?.[1]}t.result[n]||(t.result[n]=[]),t.result[n].push({tableField:i,returningName:r})}},oe="select",ae="from",Ne=(t,e)=>{let s=e.toLowerCase().indexOf(oe),o=e.toLowerCase().indexOf(ae),a=e.slice(s+oe.length,o).split(",").map(E=>E.trim()).filter(Boolean),r=v(a),l=/(^|\s)join($|\s)/gmi,i=6,c=/(^|\s)on($|\s)/gmi,u=Array.from(e.matchAll(l)),T=Array.from(e.matchAll(c));if(u.length!==T.length)throw new Error(`Undefined behaviour. Contact gh@readyyyk. Different number of matches for JOIN and ON keywords in sql: 
`+e);let f=[],N=0;for(;N<u.length;){let E=u[N],x=T[N];f.push(e.slice(E.index+i,x.index)),N++}let L=e.slice(o+ae.length).trim().split(/\s/),M=L[0];L.length>3&&L[1].toLowerCase()==="as"&&(M=L.slice(0,3).join(" ")),f.push(M);let S=v(f);if(Object.entries(S).length===1){for(let[E,x]of Object.entries(r)){let p=x,d=Object.entries(S)[0][1];if(!/^(\*|[a-zA-Z_0-9]+)$/.test(p)){let g=p.match(/(^|\s)([a-zA-Z_0-9]+\.)?(\*|[a-zA-Z_0-9]+)($|\s)/m);if(!g)throw new Error("Field name not found in: "+p);p=g?.[3]}t.result[d]||(t.result[d]=[]),t.result[d].push({tableField:p,returningName:p==="*"?p:E})}return}for(let[E,x]of Object.entries(r)){let p=x,d=Object.entries(S)[0][1];if(!/^(\*|[a-zA-Z_0-9]+)$/.test(p)){let g=p.match(/(^|\s)([a-zA-Z_0-9]+\.)?(\*|[a-zA-Z_0-9]+)($|\s)/m);if(!g)throw new Error("Field name not found in: "+p);p=g?.[3],console.assert(!!g?.[3],"Cant find field, value: ",g?.[3],`
matched value: `,g);let ie=g[2].slice(0,-1);d=S[ie]}t.result[d]||(t.result[d]=[]),t.result[d].push({tableField:p,returningName:p==="*"?p:E})}},Q=t=>{let e={...t,result:{}},s=t.resultSql.replaceAll(/--.+[\n\r]/g,"");return s.toLowerCase().startsWith("select")?Ne(e,s):_e(e,s),e};var m=t=>t[0].toUpperCase()+t.slice(1),Le=t=>String(t).split(`
`).map(e=>e.trimStart()).join(`
`),y=(t,...e)=>{let s=t.reduce((o,n,a)=>o+n+(e[a]?String(e[a]):""),"");return Le(s)};var W=(t,e,s)=>{let o=y`
        package ${e}

        import "database/sql"

        type Queries struct {
            DB sql.DB
        }`.slice(1);for(let n in t){let a=t[n],r=m(n);s&&r.at(-1)?.toLowerCase()==="s"&&(r=r.slice(0,-1));let l=`
type ${r} struct {`;for(let[i,c]of Object.entries(a))l+=`
${m(i)} ${R[c.type]} \`db:"${i}"\``;l+=`
}
`,o+=`
`+l}return o};var D=(t,e)=>{throw new Error("Not implemented")};var j=(t,e)=>{let s="",n=Object.entries(t.params).reduce((r,[l,i])=>{for(let c of i.positions)r[c]=l;return r},[]).map(r=>"arg."+m(r)).join(", "),a=m(t.queryToken.name);return s+=y`\n
    func (q *Queries) ${a}(ctx context.Context, arg ${e.paramsName}) (*${e.resultName}, error) {
      row := q.DB.QueryRowContext(ctx, ${e.sqlName}, ${n}) 
      var i ${e.resultName}
        err := row.Scan(
          ${Object.keys(e.resultFields).map(r=>`&i.${r},`).join(`
`)}
        )
        return &i, err
    }`,s};var Y=(t,e)=>{let s="",n=Object.entries(t.params).reduce((r,[l,i])=>{for(let c of i.positions)r[c]=l;return r},[]).map(r=>"arg."+m(r)).join(", "),a=m(t.queryToken.name);return s+=y`\n
        func (q *Queries) ${a}(ctx context.Context, arg ${e.paramsName}) (*[]${e.resultName}, error) {
            rows, err := q.DB.QueryContext(ctx, ${e.sqlName}, ${n})
            if err != nil {
                return nil, err
            }
            defer rows.Close()
            var items []${e.resultName}
            for rows.Next() {
                var i ${e.resultName}
                if err := rows.Scan(
                    ${Object.keys(e.resultFields).map(r=>`&i.${r},`).join(`
`)}
                ); err != nil {
                    return nil, err
                }
                items = append(items, i)
            }
            if err := rows.Close(); err != nil {
                return nil, err
            }
            if err := rows.Err(); err != nil {
                return nil, err
            }
            return &items, nil
        }`,s};var A=require("console"),Se=(t,e)=>{let s={};for(let o of Object.keys(t)){let n=t[o];for(let a of n)if(a.tableField==="*"){(0,A.assert)(!!e[o],"Cant find schema for table: "+o);let r=e[o];for(let[l,i]of Object.entries(r))s[m(l)]=R[i.type]}else{(0,A.assert)(!!e[o]?.[a.tableField]?.type,`Cant find type for table: ${o}, column: ${a.tableField}`);let r=e[o][a.tableField].type;(0,A.assert)(!!R[r],`Cant find golang type for sql type: ${r}`);let l=R[r],i=a.returningName.indexOf(".")!==-1?a.returningName.slice(a.returningName.indexOf(".")+1):a.returningName;s[m(i)]=l}}return s},U=(t,e,s)=>{let o=y`
        package ${s}
  
        import (
            "context"
        )`.slice(1);for(let n of t){o+=`


// ${n.queryToken.name}`;let a=n.queryToken.name+"Sql";o+=`
const ${a} = \`
${n.resultSql}
\``;let r=m(n.queryToken.name)+"Params",l=Object.entries(n.params).map(([u,T])=>`${m(u)} ${K[T.type]}`);o+=y`\n
            type ${r} struct {
                ${l.join(`
`)}
            }`;let i=m(n.queryToken.name)+"Result",c=Se(n.result,e);switch(o+=y`\n
            type ${i} struct {
                ${Object.entries(c).map(([u,T])=>u+" "+T).join(`
`)}
            }`,n.queryToken.type){case"many":o+=Y(n,{sqlName:a,paramsName:r,resultName:i,resultFields:c});break;case"one":o+=j(n,{sqlName:a,paramsName:r,resultName:i,resultFields:c});break;case"exec":o+=D(n,{sqlName:a,paramsName:r,resultName:i,resultFields:c});break;default:throw new Error("Got invalid query return type (for sqlrc)")}}return o};var _=C(require("node:path"),1),k=require("node:process");console.log("sqlRc");console.log("CLI tool that uses SQL to create Golang structs and queries");console.log("--cfg <string>","Path to config");k.argv[2]!=="--cfg"&&process.exit(1);k.argv[3]||process.exit(1);console.log(`
Started...`);try{let t=_.default.resolve(process.cwd(),k.argv[3]),e=_.default.dirname(t),s=B(t),o=z(s,e),n=G(o.schame),a=W(n,s.pakage.name,s.remove_trailing_s),r=_.default.resolve(e,s.pakage.path,"schema.go");q(a,r),console.log("\u2705 Wrote schema to "+r);let u=o.queries.map(f=>w(f)).map(f=>f.map(b)).map(f=>f.map(Q)).map(f=>U(f,n,s.pakage.name)),T=_.default.resolve(e,s.pakage.path,"query.go");q(u[0],T),console.log("\u2705 Wrote query to "+r)}catch(t){console.error(t),process.exit(1)}
