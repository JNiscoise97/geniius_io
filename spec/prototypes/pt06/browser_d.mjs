import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
const [browser,profile,url]=process.argv.slice(2);
const child=spawn(browser,['--headless=new','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-background-networking','about:blank'],{stdio:'ignore',windowsHide:true});
let ws;let next=0;const pending=new Map();const cases=[];let fatal=null;let version;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function assert(ok,label){if(!ok)throw Error(label)}
async function send(method,params={}){const id=++next;return await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method))},15000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}))})}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
async function until(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await delay(30)}throw Error('Condition timeout '+expression)}
async function key(key,code){await send('Input.dispatchKeyEvent',{type:'rawKeyDown',key,code,windowsVirtualKeyCode:key==='Tab'?9:13});if(key==='Enter')await send('Input.dispatchKeyEvent',{type:'char',key,code,text:'\r',windowsVirtualKeyCode:13});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:key==='Tab'?9:13})}
async function load(){await send('Page.navigate',{url});await until("document.readyState==='complete' && !!document.getElementById('send')")}
async function test(id,label,fn){try{const evidence=await fn();cases.push({id,label,status:'PASS',evidence})}catch(e){cases.push({id,label,status:'FAIL',error:String(e)})}}
try{
let port;
for(let i=0;i<100;i++){try{port=(await readFile(profile+'/DevToolsActivePort','utf8')).split('\n')[0];break}catch{}await delay(100)}
assert(port,'Browser debugging port unavailable');
version=await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
const page=await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`,{method:'PUT'})).json();
ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
ws.onmessage=event=>{const m=JSON.parse(event.data);const p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}};
await send('Page.enable');await send('Accessibility.enable');await load();
await test('PT06-D01','Noms et rôles dans arbre d’accessibilité',async()=>{
const tree=await send('Accessibility.getFullAXTree');const names=tree.nodes.filter(n=>!n.ignored).map(n=>({role:n.role?.value,name:n.name?.value}));
assert(names.some(n=>n.role==='textbox'&&n.name==='Référence de la contribution'),'input label');assert(names.some(n=>n.role==='textbox'&&n.name==='Texte de votre contribution'),'textarea label');assert(names.some(n=>n.role==='button'&&n.name==='Envoyer la contribution'),'button name');return {names};});
await test('PT06-D02','Ordre clavier et focus matérialisé',async()=>{
await load();const focus=[];for(let i=0;i<4;i++){await key('Tab','Tab');focus.push(await evaluate("({id:document.activeElement.id,outline:getComputedStyle(document.activeElement).outlineWidth})"))}
assert(focus.map(f=>f.id).join(',')==='skip,origin,delta,send','tab order');assert(focus.every(f=>parseFloat(f.outline)>=3),'focus outline');return {focus};});
await test('PT06-D03','Erreur annoncée structurellement et focus sur résumé',async()=>{
await evaluate("localStorage.clear();document.getElementById('delta').value='';document.getElementById('send').focus()");await key('Enter','Enter');await until("!document.getElementById('errors').hidden");
const e=await evaluate("({focus:document.activeElement.id,role:document.getElementById('errors').getAttribute('role'),invalid:document.getElementById('origin').getAttribute('aria-invalid'),text:document.getElementById('errors').textContent})");assert(e.focus==='errors'&&e.role==='alert'&&e.invalid==='true','error semantics');return e;});
await test('PT06-D04','Dépôt au clavier et statut de réception',async()=>{
await evaluate("document.getElementById('origin').focus()");await send('Input.insertText',{text:'op-accessible'});await key('Tab','Tab');await send('Input.insertText',{text:'synthetic own contribution'});await key('Tab','Tab');await key('Enter','Enter');
await until("document.getElementById('status').textContent.includes('Contribution reçue')");const ax=await send('Accessibility.getFullAXTree');assert(ax.nodes.some(n=>!n.ignored&&n.role?.value==='status'),'status AX');
return await evaluate("({status:document.getElementById('status').textContent,live:document.getElementById('status').getAttribute('aria-live'),saved:localStorage.getItem('pt06-own-delta')})");});
await test('PT06-D05','Refus API : erreur et texte local conservé',async()=>{
await evaluate("fetch('/control/revoke',{method:'POST'}).then(r=>r.text())");await evaluate("document.getElementById('send').focus()");await key('Enter','Enter');await until("!document.getElementById('errors').hidden");
const result=await evaluate("({focus:document.activeElement.id,text:document.getElementById('errors').textContent,saved:localStorage.getItem('pt06-own-delta')})");assert(result.focus==='errors'&&result.saved==='synthetic own contribution','recovery text');return result;});
await test('PT06-D06','Reflow à largeur 320 CSS px',async()=>{
await send('Emulation.setDeviceMetricsOverride',{width:320,height:800,deviceScaleFactor:1,mobile:false});const result=await evaluate("({width:innerWidth,scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})");assert(result.scroll<=result.client,'horizontal overflow');return result;});
}catch(e){fatal=String(e)}finally{
if(ws?.readyState===1){try{await send('Browser.close')}catch{}ws.close()}
for(let i=0;i<30&&child.exitCode===null;i++)await delay(100);
if(child.exitCode===null)child.kill();
}
console.log(JSON.stringify({cases,fatal,browser_version:version?.Browser,browser_closed:child.exitCode!==null}));
process.exitCode=fatal||cases.length!==6||cases.some(c=>c.status!=='PASS')?1:0;
