// Isolated design preview: edit the original Markdown while showing the SAME
// native preview nodes and renderer. No second card renderer or HTML round trip.
(() => {
  const source = els.content;
  const pages = els.pages;
  const pagesHome = document.createComment('classic native pages');
  pages.before(pagesHome);
  const surface = document.createElement('section');
  surface.className = 'preview-native-surface';
  surface.setAttribute('aria-label','沉浸写作卡片');
  surface.hidden = true;
  source.after(surface);
  const status = document.createElement('p');
  status.className = 'preview-writing-status';status.hidden = true;
  status.innerHTML = '<strong>点进卡片直接写 · 内容自动续页</strong><span role="status"></span>';
  surface.before(status);
  const zoomBar=document.createElement('div');zoomBar.className='preview-zoom-bar';zoomBar.hidden=true;
  zoomBar.innerHTML='<label for="previewCardZoom">卡片缩放</label><input id="previewCardZoom" type="range" min="10" max="100" step="1" value="35" aria-label="卡片缩放比例"><output id="previewCardZoomValue" for="previewCardZoom">35%</output>';
  surface.append(zoomBar);
  const zoomInput=zoomBar.querySelector('input'),zoomOutput=zoomBar.querySelector('output');
  let fitCards=true,zoomPercent=35;
  const zoomStorageKey='writeThenPublishPreviewCardZoom.v1';
  try{const preference=JSON.parse(localStorage.getItem(zoomStorageKey)||'null');if(preference?.mode==='manual'&&Number.isFinite(preference.percent)){fitCards=false;zoomPercent=Math.max(10,Math.min(100,preference.percent));zoomInput.value=String(zoomPercent);}}catch{}
  function saveZoom(){try{localStorage.setItem(zoomStorageKey,JSON.stringify({mode:fitCards?'auto':'manual',percent:zoomPercent}));}catch{}}
  const actions = document.querySelector('.preview-topbar .topbar-actions');
  const actionsHome = document.createComment('classic native download actions');actions.before(actionsHome);
  const articleSettings = els.articleSettings;
  const settingsHome = document.createComment('classic article settings');articleSettings.before(settingsHome);
  const articleButton = document.createElement('button');
  articleButton.type='button';articleButton.className='secondary-button';articleButton.textContent='长文排版';
  articleButton.setAttribute('popovertarget','previewArticleTools');articleButton.hidden=true;
  document.querySelector('.brand-actions').append(articleButton);
  const articlePanel=document.createElement('section');articlePanel.id='previewArticleTools';
  articlePanel.className='preview-tools-popover';articlePanel.setAttribute('popover','auto');articlePanel.setAttribute('aria-label','长文排版设置');
  document.body.append(articlePanel);
  articlePanel.addEventListener('toggle',()=>{
    if(!articlePanel.matches(':popover-open'))return;
    const r=articleButton.getBoundingClientRect();
    articlePanel.style.left=`${Math.max(12,Math.min(r.left,innerWidth-articlePanel.offsetWidth-12))}px`;
    articlePanel.style.top=`${r.bottom+8}px`;articlePanel.style.maxHeight=`${Math.max(140,innerHeight-r.bottom-20)}px`;
  });
  const measure=document.createElement('canvas').getContext('2d');
  let mode='classic';
  let editing=false;
  let pointerStart=null;
  let dragSelection=null;
  let scrollToCaret=false;
  let refreshFrame=0;
  let layoutRevision=0;
  let caretProbeSequence=0;
  let pendingCaretProbe='';
  let cachedCaretProbe=null;
  let lastCaretGeometry=null;
  let preferredCaretX=null;
  function sizeCards(){
    if(state.appMode==='article')return;
    const host=mode==='immersive'?surface:pagesHome.parentElement;
    const style=getComputedStyle(host),width=Math.max(1,host.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight));
    const height=Math.max(120,host.clientHeight-parseFloat(style.paddingBottom)-20-(host.contains(zoomBar)?zoomBar.offsetHeight:0));
    const count=pages.querySelectorAll('.page-shell').length;
    let cardWidth=Math.min(width,CANVAS_WIDTH*zoomPercent/100);
    if(fitCards&&mode==='classic'){
      cardWidth=Math.min(width,360);
    }else if(fitCards){
      const target=Math.max(1,Math.min(6,count)),gap=24,actionHeight=48;
      let best=0;
      for(let cols=1;cols<=target;cols++){
        const rows=Math.ceil(target/cols);
        const candidate=Math.min(420,(width-gap*(cols-1))/cols,((height-gap*(rows-1))/rows-actionHeight)*.75);
        if(candidate>best)best=candidate;
      }
      cardWidth=Math.max(Math.min(86,width),best);
    }
    cardWidth=Math.min(width,cardWidth);
    if(fitCards)zoomPercent=Math.round(cardWidth/CANVAS_WIDTH*100);
    pages.style.setProperty('--preview-card-width',`${cardWidth}px`);
    const visiblePercent=Math.round(cardWidth/CANVAS_WIDTH*100);
    zoomInput.value=String(Math.max(10,visiblePercent));
    zoomOutput.value=`${visiblePercent}%`;
  }
  zoomInput.addEventListener('input',()=>{fitCards=false;zoomPercent=Number(zoomInput.value);sizeCards();saveZoom();scheduleCardPreviewRefresh();showCaret();});

  function linePoints(item){
    const points=[];let x=item.x;
    for(const token of item.line){
      const width=glyphWidth(measure,token,item.style);
      if(Number.isFinite(token.sourceStart))points.push({offset:token.sourceStart,x});
      x+=width;
      if(Number.isFinite(token.sourceEnd))points.push({offset:token.sourceEnd,x});
      x+=tokenLetterSpacing(token,item.style);
    }
    return points;
  }
  function caretInk(item,token={}){
    measure.font=fontString(item.style,{...token,text:'国Ag'});
    const metrics=measure.measureText('国Ag');
    const ascent=metrics.actualBoundingBoxAscent||item.style.size*.85;
    const descent=metrics.actualBoundingBoxDescent||item.style.size*.2;
    return{inkTop:item.y+Math.round(item.lineHeight*.75)-ascent,inkHeight:ascent+descent};
  }
  function chooseOffset(canvas,event){
    const rect=canvas.getBoundingClientRect(),page=canvas._page;
    const x=(event.clientX-rect.left)*CANVAS_WIDTH/rect.width;
    const y=(event.clientY-rect.top)*CANVAS_HEIGHT/rect.height;
    const lines=page.items.filter(item=>item.type==='text');
    if(!lines.length)return 0;
    const last=lines.at(-1);
    if(y>last.y+last.lineHeight+16){
      const canonical=[...pages.querySelectorAll('.page-shell:not(.preview-caret-shell) .page-frame>canvas')];
      return canvas===canonical.at(-1)?source.value.length:last.sourceEnd;
    }
    const line=lines.reduce((a,b)=>Math.abs(y-(b.y+b.lineHeight/2))<Math.abs(y-(a.y+a.lineHeight/2))?b:a);
    const points=linePoints(line);
    return points.length?points.reduce((a,b)=>Math.abs(b.x-x)<Math.abs(a.x-x)?b:a).offset:line.sourceStart;
  }
  function caretForCanvas(canvas,offset){
    const page=canvas._page,lines=page.items.filter(item=>item.type==='text');
    if(!lines.length){const style=styleForBlock('p',readForm()),lineHeight=Math.ceil(style.size*style.lineHeight);return offset===0?{x:page.bounds.left,y:page.bounds.top,h:lineHeight,...caretInk({style,y:page.bounds.top,lineHeight})}:null;}
    let item=lines.find(line=>offset>=line.sourceStart&&offset<=line.sourceEnd);
    if(!item)return null;
    const points=linePoints(item);
    const point=points.reduce((a,b)=>Math.abs(b.offset-offset)<Math.abs(a.offset-offset)?b:a,points[0]);
    return{x:point?.x??item.x,y:item.y,h:item.lineHeight,...caretInk(item,item.line[0])};
  }
  function articleTokens(){
    const tokens=[];
    for(const block of parseBlocks(source.value,state.images))for(const token of block.tokens||block.lines?.flat()||[]){
      if(typeof token.text==='string'&&Number.isFinite(token.sourceStart)&&token.text!=='• ')tokens.push(token);
    }
    return tokens;
  }
  function articleOffset(plain){
    let seen=0;for(const token of articleTokens()){if(seen+token.text.length>=plain)return Math.min(token.sourceEnd,token.sourceStart+Math.max(0,plain-seen));seen+=token.text.length;}return source.value.length;
  }
  function articlePoint(article,offset){
    let plain=0;for(const token of articleTokens()){
      if(offset<=token.sourceStart)break;
      plain+=offset>=token.sourceEnd?token.text.length:Math.max(0,offset-token.sourceStart);
      if(offset<token.sourceEnd)break;
    }
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT);let node,last;
    while(node=walker.nextNode()){last=node;if(plain<=node.textContent.length)return{node,offset:plain};plain-=node.textContent.length;}
    return last?{node:last,offset:last.textContent.length}:null;
  }
  function showArticleCaret(article){
    const start=articlePoint(article,source.selectionStart),end=articlePoint(article,source.selectionEnd);if(!start||!end)return;
    const range=document.createRange();range.setStart(start.node,start.offset);range.setEnd(end.node,end.offset);
    const bounds=article.getBoundingClientRect(),selected=source.selectionStart!==source.selectionEnd;
    const rects=selected?[...range.getClientRects()]:[range.getBoundingClientRect()];
    for(const rect of rects){if(!rect.height)continue;const mark=document.createElement('span');mark.className=selected?'preview-writing-selection':'preview-writing-caret';mark.setAttribute('aria-hidden','true');Object.assign(mark.style,{left:`${rect.left-bounds.left}px`,top:`${rect.top-bounds.top}px`,height:`${rect.height}px`,...(selected?{width:`${Math.max(2,rect.width)}px`}:{})});article.append(mark);if(scrollToCaret){mark.scrollIntoView({block:'nearest',inline:'nearest'});scrollToCaret=false;}}
  }
  function clearCaretPage(){pages.querySelectorAll('.preview-caret-shell').forEach(node=>node.remove());}
  function paintCaret(canvas,point){
    const scale=canvas.clientWidth/CANVAS_WIDTH;
    const caret=document.createElement('span');caret.className='preview-writing-caret';caret.setAttribute('aria-hidden','true');
    const height=Math.max(19,(point.inkHeight??point.h*.72)*scale+4);
    const top=((point.inkTop??point.y)+(point.inkHeight??point.h*.72)/2)*scale-height/2;
    caret.dataset.layoutY=String(point.y);
    Object.assign(caret.style,{left:`${point.x*scale}px`,top:`${top}px`,height:`${height}px`,background:canvas._page.settings.textColor});
    canvas.parentElement.append(caret);
    canvas.parentElement.classList.add('is-writing');
    status.firstElementChild.textContent='正在编辑 · Enter 换行，空行分段';
    lastCaretGeometry={text:source.value,offset:source.selectionStart,page:Number(canvas.dataset.page),x:point.x,y:point.y};
    // Anchor the native input method at the visible editing position.
    const rect=canvas.getBoundingClientRect();
    Object.assign(source.style,{left:`${rect.left+point.x*scale}px`,top:`${rect.top+top}px`,bottom:'auto',height:`${height}px`});
    if(scrollToCaret){caret.scrollIntoView({block:'nearest',inline:'nearest'});scrollToCaret=false;}
  }
  function paintProbe(result){
    clearCaretPage();
    const canvases=[...pages.querySelectorAll('.page-frame>canvas')];
    let canvas=canvases[result.pageIndex];
    if(!canvas&&result.offset===source.value.length){
      const shell=document.createElement('article');shell.className='page-shell preview-caret-shell';
      const frame=document.createElement('div');frame.className='page-frame';
      canvas=createCardPreview(renderPage(result.page,result.pageIndex,result.pageIndex+1));
      canvas._editingSource=source.value;
      canvas.tabIndex=0;canvas.setAttribute('role','textbox');canvas.setAttribute('aria-label','继续写作的卡片，按回车编辑');canvas.setAttribute('aria-multiline','true');
      const label=document.createElement('div');label.className='page-actions';label.textContent='继续输入';
      frame.append(canvas);shell.append(frame,label);pages.append(shell);
      sizeCards();paintCardPreview(canvas,cardPreviewPixelWidth(canvas.clientWidth));
    }
    if(canvas)paintCaret(canvas,result.point);
  }
  function probeCaret(offset){
    const text=source.value,key=JSON.stringify([text,offset,layoutRevision]);
    if(cachedCaretProbe?.key===key){paintProbe(cachedCaretProbe);return;}
    if(pendingCaretProbe===key)return;
    clearCaretPage();pendingCaretProbe=key;
    const sequence=++caretProbeSequence,revision=layoutRevision;
    const marker=['\u200b','\u2060','\u200c'].find(character=>!text.includes(character))||'\u200b';
    const settings={...readForm(),content:text.slice(0,offset)+marker+text.slice(offset)};
    // A zero-width measurement character makes an unfinished Markdown block
    // measurable by the ORIGINAL layout engine. It never enters the draft,
    // canonical canvases, history, clipboard or download.
    buildPages(settings).then(probePages=>{
      if(sequence!==caretProbeSequence||revision!==layoutRevision||source.value!==text||source.selectionStart!==offset||source.selectionEnd!==offset||document.activeElement!==source||mode!=='immersive')return;
      for(let pageIndex=0;pageIndex<probePages.length;pageIndex++){
        for(const item of probePages[pageIndex].items){
          if(item.type!=='text')continue;
          let x=item.x;
          for(const token of item.line){
            if(token.sourceStart<=offset&&token.sourceEnd>offset&&token.text.includes(marker)){
              const prefix=token.text.slice(0,token.text.indexOf(marker));
              const result={key,offset,pageIndex,page:probePages[pageIndex],point:{x:x+(prefix?glyphWidth(measure,{...token,text:prefix},item.style):0),y:item.y,h:item.lineHeight,...caretInk(item,token)}};
              cachedCaretProbe=result;paintProbe(result);return;
            }
            x+=glyphWidth(measure,token,item.style)+tokenLetterSpacing(token,item.style);
          }
        }
      }
    }).catch(()=>{
      // Keep the draft intact if media/font measurement fails; a later native
      // render or edit retries the caret without inventing line spacing.
    }).finally(()=>{if(sequence===caretProbeSequence)pendingCaretProbe='';});
  }
  function showCaret(){
    pages.querySelectorAll('.preview-writing-caret,.preview-writing-selection').forEach(n=>n.remove());
    pages.querySelectorAll('.page-frame.is-writing').forEach(n=>n.classList.remove('is-writing'));
    if(mode!=='immersive'||!editing||document.activeElement!==source)return;
    const article=pages.querySelector('.article-preview');if(article){showArticleCaret(article);return;}
    if(source.selectionStart!==source.selectionEnd){
      clearCaretPage();
      for(const canvas of pages.querySelectorAll('.page-frame>canvas')){
        const scale=canvas.clientWidth/CANVAS_WIDTH;
        for(const line of canvas._page.items.filter(item=>item.type==='text')){
          if(line.sourceEnd<=source.selectionStart||line.sourceStart>=source.selectionEnd)continue;
          const points=linePoints(line);if(!points.length)continue;
          const near=offset=>points.reduce((a,b)=>Math.abs(b.offset-offset)<Math.abs(a.offset-offset)?b:a);
          const a=near(Math.max(line.sourceStart,source.selectionStart)),b=near(Math.min(line.sourceEnd,source.selectionEnd));
          const highlight=document.createElement('span');highlight.className='preview-writing-selection';highlight.setAttribute('aria-hidden','true');
          Object.assign(highlight.style,{left:`${Math.min(a.x,b.x)*scale}px`,top:`${line.y*scale}px`,width:`${Math.max(2,Math.abs(b.x-a.x)*scale)}px`,height:`${line.lineHeight*scale}px`});canvas.parentElement.append(highlight);
          canvas.parentElement.classList.add('is-writing');
        }
      }
      return;
    }
    for(const canvas of pages.querySelectorAll('.page-shell:not(.preview-caret-shell) .page-frame>canvas')){
      if(canvas._page.settings.content!==source.value)continue;
      const point=caretForCanvas(canvas,source.selectionStart);if(!point)continue;
      caretProbeSequence++;pendingCaretProbe='';clearCaretPage();paintCaret(canvas,point);return;
    }
    probeCaret(source.selectionStart);
  }
  function refresh(){
    zoomBar.hidden=state.appMode==='article';
    if(mode!=='immersive'){
      sizeCards();scheduleCardPreviewRefresh();return;
    }
    articleButton.hidden=state.appMode!=='article';
    status.lastElementChild.textContent=els.status.textContent;
    pages.querySelectorAll('.page-frame>canvas').forEach((canvas,i)=>{
      canvas.tabIndex=0;canvas.setAttribute('role','textbox');canvas.setAttribute('aria-multiline','true');
      canvas.setAttribute('aria-label',`第${i+1}张图文卡片，按回车开始编辑`);
    });
    const article=pages.querySelector('.article-preview');if(article){article.tabIndex=0;article.setAttribute('role','textbox');article.setAttribute('aria-label','公众号长文编辑区，按回车开始编辑');}
    sizeCards();showCaret();scheduleCardPreviewRefresh();
  }
  function scheduleRefresh(){cancelAnimationFrame(refreshFrame);refreshFrame=requestAnimationFrame(refresh);}
  new MutationObserver(scheduleRefresh).observe(els.status,{childList:true,subtree:true,characterData:true});
  window.addEventListener('preview-document-rendered',()=>{layoutRevision++;refresh();});
  window.addEventListener('resize',scheduleRefresh);
  const previewSizeObserver=new ResizeObserver(scheduleRefresh);
  previewSizeObserver.observe(surface);
  previewSizeObserver.observe(pagesHome.parentElement);
  surface.addEventListener('pointerdown',event=>{
    preferredCaretX=null;
    pointerStart={x:event.clientX,y:event.clientY};
    if(event.pointerType!=='mouse'||event.button!==0||source.readOnly||event.target.closest('.preview-image-box,button'))return;
    const canvas=event.target.closest('.page-frame')?.querySelector('canvas');
    if(canvas)dragSelection={offset:chooseOffset(canvas,event),canvas};
  });
  window.addEventListener('pointermove',event=>{
    if(!dragSelection||!event.buttons||Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)<4)return;
    const canvas=document.elementFromPoint(event.clientX,event.clientY)?.closest('.page-frame')?.querySelector('canvas')||dragSelection.canvas;
    const offset=chooseOffset(canvas,event);editing=true;source.focus({preventScroll:true});
    source.setSelectionRange(Math.min(offset,dragSelection.offset),Math.max(offset,dragSelection.offset),offset<dragSelection.offset?'backward':'forward');showCaret();event.preventDefault();
  });
  window.addEventListener('pointerup',()=>{dragSelection=null;});
  surface.addEventListener('click',event=>{
    if(mode!=='immersive'||source.readOnly||event.target.closest('.preview-image-box,button'))return;
    if(pointerStart&&Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>8)return;
    const article=event.target.closest('.article-preview');
    if(article){const point=document.caretRangeFromPoint(event.clientX,event.clientY);if(!point||!article.contains(point.startContainer))return;const prefix=document.createRange();prefix.selectNodeContents(article);prefix.setEnd(point.startContainer,point.startOffset);const offset=articleOffset(prefix.toString().length);editing=true;source.focus({preventScroll:true});source.setSelectionRange(offset,offset);showCaret();return;}
    const canvas=event.target.closest('.page-frame')?.querySelector('canvas');if(!canvas)return;
    const offset=chooseOffset(canvas,event);editing=true;
    source.focus({preventScroll:true});source.setSelectionRange(offset,offset);showCaret();
  });
  surface.addEventListener('keydown',event=>{
    if(event.key!=='Enter'||!event.target.matches('canvas,.article-preview')||source.readOnly)return;
    event.preventDefault();const lines=event.target._page?.items.filter(i=>i.type==='text');
    const offset=lines?.at(-1)?.sourceEnd??source.value.length;editing=true;source.focus({preventScroll:true});source.setSelectionRange(offset,offset);showCaret();
  });
  source.addEventListener('input',()=>{if(mode==='immersive'){editing=true;scrollToCaret=true;}});
  source.addEventListener('keydown',event=>{
    if(mode!=='immersive'||state.appMode!=='cards'||event.isComposing||event.ctrlKey||event.metaKey||event.altKey)return;
    if(!['ArrowUp','ArrowDown','Home','End'].includes(event.key)){preferredCaretX=null;return;}
    const backwards=source.selectionDirection==='backward';
    const focus=backwards?source.selectionStart:source.selectionEnd;
    const anchor=backwards?source.selectionEnd:source.selectionStart;
    const rows=[...pages.querySelectorAll('.page-frame>canvas')].filter(canvas=>canvas._page.settings.content===source.value||canvas._editingSource===source.value).flatMap(canvas=>canvas._page.items.filter(item=>item.type==='text').map(item=>({page:Number(canvas.dataset.page),item,points:linePoints(item)}))).filter(row=>row.points.length);
    let currentRow=rows.find(row=>focus>=row.item.sourceStart&&focus<=row.item.sourceEnd);
    const nearest=(points,offset)=>points.reduce((a,b)=>Math.abs(b.offset-offset)<Math.abs(a.offset-offset)?b:a);
    let current=currentRow?{page:currentRow.page,y:currentRow.item.y,x:nearest(currentRow.points,focus).x}:null;
    if(!current&&lastCaretGeometry?.text===source.value&&lastCaretGeometry.offset===focus)current=lastCaretGeometry;
    if(!current){event.preventDefault();showCaret();return;}
    currentRow??=rows.find(row=>row.page===current.page&&Math.abs(row.item.y-current.y)<.5);
    let next=currentRow;
    if(event.key==='ArrowUp'||event.key==='ArrowDown'){
      preferredCaretX??=current.x;
      const order=row=>row.page*CANVAS_HEIGHT+row.item.y,at=current.page*CANVAS_HEIGHT+current.y;
      next=event.key==='ArrowDown'?rows.find(row=>order(row)>at+.5):rows.filter(row=>order(row)<at-.5).at(-1);
    }
    if(!next){event.preventDefault();return;}
    const point=event.key==='Home'?next.points[0]:event.key==='End'?next.points.at(-1):next.points.reduce((a,b)=>Math.abs(b.x-preferredCaretX)<Math.abs(a.x-preferredCaretX)?b:a);
    event.preventDefault();
    source.setSelectionRange(event.shiftKey?Math.min(anchor,point.offset):point.offset,event.shiftKey?Math.max(anchor,point.offset):point.offset,point.offset<anchor?'backward':'forward');
    scrollToCaret=true;showCaret();
  },true);
  source.addEventListener('select',showCaret);
  source.addEventListener('keyup',showCaret);
  source.addEventListener('blur',()=>{caretProbeSequence++;pendingCaretProbe='';clearCaretPage();pages.querySelectorAll('.preview-writing-caret,.preview-writing-selection').forEach(n=>n.remove());pages.querySelectorAll('.page-frame.is-writing').forEach(n=>n.classList.remove('is-writing'));status.firstElementChild.textContent='点进卡片直接写 · 内容自动续页';});
  function setMode(next){
    mode=next;editing=false;caretProbeSequence++;pendingCaretProbe='';clearCaretPage();source.style.cssText='';document.body.dataset.creationMode=mode;
    document.querySelectorAll('[data-creation-mode]').forEach(button=>{const active=button.dataset.creationMode===mode;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});
    surface.hidden=mode!=='immersive';status.hidden=surface.hidden;zoomBar.hidden=state.appMode==='article';
    if(mode==='immersive'){
      setHistoryOpen(false);surface.append(pages);refresh();
    }else{
      pagesHome.after(pages);articleButton.hidden=true;
      if(articlePanel.matches(':popover-open'))articlePanel.hidePopover();
      pages.querySelectorAll('canvas').forEach(canvas=>{canvas.removeAttribute('tabindex');canvas.removeAttribute('role');canvas.removeAttribute('aria-label');canvas.removeAttribute('aria-multiline');});
      const article=pages.querySelector('.article-preview');if(article){article.removeAttribute('tabindex');article.removeAttribute('role');article.removeAttribute('aria-label');}
      refresh();
    }
    scheduleCardPreviewRefresh();
  }
  document.querySelectorAll('[data-creation-mode]').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.creationMode)));
  setMode(new URLSearchParams(location.search).get('creation')==='immersive'?'immersive':'classic');
  window.wtpNativeCanvasPreview={get mode(){return mode;},get source(){return source.value;},refreshLayout(){refresh();}};
})();
