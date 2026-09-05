import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9900 + Math.floor(Math.random() * 50);
const wait = ms => new Promise(r => setTimeout(r, ms));
async function targets() { return (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); }
const chrome = spawn(CHROME, ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--window-size=1280,1000',`--remote-debugging-port=${PORT}`,'--user-data-dir='+fs.mkdtempSync('rct-'),'about:blank'], { stdio:'ignore' });
try {
  let t=[]; for(let i=0;i<40;i++){ try{ t=await targets(); if(t.length) break; }catch{} await wait(500); }
  const page=t.find(x=>x.type==='page');
  const ws=new WebSocket(page.webSocketDebuggerUrl);
  const pend=new Map(); let mid=0;
  ws.onmessage=e=>{const m=JSON.parse(e.data); if(pend.has(m.id)){const p=pend.get(m.id);pend.delete(m.id);m.error?p.rej(new Error(m.error.message)):p.res(m.result);}};
  await new Promise(r=>ws.onopen=r);
  const send=(method,params={})=>new Promise((res,rej)=>{const id=++mid;pend.set(id,{res,rej});ws.send(JSON.stringify({id,method,params}));});
  await send('Page.enable'); await send('Runtime.enable');
  const ev = async (x) => (await send('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true})).result?.value;

  await send('Page.navigate',{url:'https://www.dawnwire.com/products/makeup-organizer-with-led-mirror-cosmetic-display-cases-off-white'});
  await wait(9000);
  // What links exist that point to amazon or go/product?
  const info = await ev(`JSON.stringify({
    h1: document.querySelector('h1')?.textContent?.slice(0,60),
    allAmazon: [...document.querySelectorAll('a[href*="amazon"]')].map(a=>({t:(a.textContent||'').trim().slice(0,30), h:a.href.slice(0,120)})).slice(0,5),
    allGo: [...document.querySelectorAll('a[href*="go/product"], a[href*="cloak"], button')].filter(a=>/go\/product|check|price|amazon/i.test(a.textContent||'')||/go\/product/.test(a.href||'')).map(a=>({t:(a.textContent||'').trim().slice(0,40), h:(a.href||'').slice(0,140), tag:a.tagName})).slice(0,8)
  })`);
  console.log('PAGE INFO:', info);
  // Try clicking first "Check Price"-ish CTA via DOM click
  const clicked = await ev(`(() => {
    const candidates = [...document.querySelectorAll('a')].filter(a => /go\/product|amazon\.com\/dp/i.test(a.href||'') && /check|price|amazon|view/i.test(a.textContent||''));
    if (!candidates.length) return 'no candidate';
    window.__final='';
    candidates[0].click();
    return 'clicked: '+candidates[0].href.slice(0,150);
  })()`);
  console.log('CLICK:', clicked);
  await wait(9000);
  console.log('FINAL LOCATION:', await ev('location.href'));
  console.log('RESULT:', await ev(`location.href.includes('amazon.com') ? 'at amazon, tag=' + location.href.includes('tag=dawnwire-20') : 'still on dawnwire'`));
  ws.close();
} finally { chrome.kill(); }
