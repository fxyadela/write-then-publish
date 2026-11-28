// Reference-led local workspace: move incumbent controls, retain their handlers.
(() => {
  document.body.classList.add('reference-workspace');
  const header=document.querySelector('.preview-entry-bar');
  const workspace=document.querySelector('.workspace');
  const editor=document.querySelector('.editor-panel');
  const brandRow=document.querySelector('.brand-row');
  const oldBrand=document.querySelector('.brand-title');
  const actions=document.querySelector('.brand-actions');
  const toolbarRow=document.querySelector('.toolbar-text-row');
  const writing=document.querySelector('.preview-creation-switch');
  const output=document.querySelector('#appModeSwitch');
  const previewHeader=document.querySelector('.preview-topbar');
  const previewPanel=document.querySelector('#previewPanel');
  const surface=document.querySelector('.preview-native-surface');
  const topbarActions=previewHeader.querySelector('.topbar-actions');
  const account=document.querySelector('#accountDock');
  const feedback=document.querySelector('#feedbackBtn');
  const historyToggle=document.querySelector('#historyToggleBtn');
  const credit=document.querySelector('.site-credit');
  const footer=document.querySelector('.site-footer');

  const home=document.createElement('a');
  home.className='reference-brand';home.href='#home';
  home.innerHTML='<img src="brand/mark.svg" alt=""><span><strong>写了就发</strong><small>Write Then Publish</small></span>';
  const modeButton=document.createElement('button');
  modeButton.type='button';modeButton.id='referenceWritingTrigger';modeButton.className='reference-mode-trigger';
  modeButton.setAttribute('popovertarget','referenceWritingMenu');
  modeButton.setAttribute('aria-controls','referenceWritingMenu');
  modeButton.setAttribute('aria-expanded','false');
  modeButton.innerHTML='<span class="reference-mode-mark"><i data-lucide="panels-left-bottom" aria-hidden="true"></i></span><span class="reference-mode-label">写作方式</span><strong>经典模式</strong><i data-lucide="chevron-down" aria-hidden="true"></i>';
  const modeMenu=document.createElement('section');
  modeMenu.id='referenceWritingMenu';modeMenu.setAttribute('popover','auto');modeMenu.setAttribute('aria-label','选择写作方式');
  modeMenu.innerHTML='<p>选择你在哪里写</p>';
  modeMenu.append(writing);document.body.append(modeMenu);
  writing.setAttribute('aria-label','写作方式');
  for(const button of writing.querySelectorAll('button')){
    const classic=button.dataset.creationMode==='classic';
    button.innerHTML=`<span class="reference-mode-icon"><i data-lucide="${classic?'panels-left-bottom':'pen-line'}" aria-hidden="true"></i></span><span><strong>${classic?'经典模式':'沉浸写作'}</strong><small>${classic?'左侧编辑 Markdown，右侧实时预览':'隐藏编辑栏，直接在卡片上修改文字'}</small></span><i class="reference-mode-check" data-lucide="check" aria-hidden="true"></i>`;
  }
  const mobileStyle=document.createElement('button');
  mobileStyle.type='button';mobileStyle.className='reference-style-toggle';mobileStyle.setAttribute('aria-label','打开样式设置');
  mobileStyle.innerHTML='<i data-lucide="sliders-horizontal" aria-hidden="true"></i><span>样式</span>';
  const nav=document.createElement('div');nav.className='reference-global-actions';nav.append(feedback,mobileStyle,account);
  header.replaceChildren(historyToggle,home,modeButton,nav);
  header.classList.add('reference-global-header');

  oldBrand.hidden=true;brandRow.classList.add('reference-document-bar');
  output.setAttribute('aria-label','文章排版');
  output.querySelector('[data-app-mode="cards"]').innerHTML='<i data-lucide="panels-top-left" aria-hidden="true"></i><span>图文卡片</span>';
  output.querySelector('[data-app-mode="article"]').innerHTML='<i data-lucide="align-left" aria-hidden="true"></i><span>公众号长文</span>';
  previewHeader.firstElementChild.hidden=true;
  previewHeader.prepend(output);
  previewHeader.classList.add('reference-output-bar');
  topbarActions.prepend(els.copyWechat);

  const rail=document.createElement('aside');rail.className='reference-style-rail';rail.setAttribute('aria-label','样式设置');
  rail.innerHTML='<header><h2>卡片样式</h2><div><button type="button" class="reference-reset" aria-label="重置样式" title="重置样式"><i data-lucide="rotate-ccw" aria-hidden="true"></i></button><button type="button" class="reference-close-style" aria-label="关闭样式面板"><i data-lucide="x" aria-hidden="true"></i></button></div></header><div class="reference-rail-scroll"><div class="reference-card-settings"><section class="reference-author"><h3>作者信息</h3></section><section class="reference-typography"><h3>文字</h3><div></div></section><section class="reference-ratio"><h3>卡片比例</h3><span>3:4</span></section><section class="reference-background"><h3>主题色 <span>纯白</span></h3><div class="reference-swatches"></div></section><section class="reference-advanced"><h3>其他样式</h3><div></div></section></div><div class="reference-article-settings"></div><footer></footer></div>';
  workspace.append(rail);
  rail.querySelector('.reference-author').append(document.querySelector('.profile-inline'),document.querySelector('.preview-avatar-setting'));
  for(const id of ['fontSizeInput','lineHeightInput']) rail.querySelector('.reference-typography>div').append(document.getElementById(id).closest('label'));
  for(const id of ['textColorInput','accentColorInput','bgColorInput','zhFontInput','enFontInput','imageHeightInput']) rail.querySelector('.reference-advanced>div').append(document.getElementById(id).closest('label'));
  // All settings now live in the rail; remove the empty toolbar entry.
  document.querySelector('.settings-menu').remove();
  rail.querySelector('.reference-article-settings').append(els.articleSettings,els.syncWechat);
  const articleSections=[...els.articleSettings.children];
  els.articleSettings.append(articleSections[0],articleSections[3],articleSections[1],articleSections[2]);
  els.articleSettings.querySelectorAll('[data-article-color]').forEach(button=>{button.setAttribute('aria-label',button.textContent.trim());button.title=button.textContent.trim();});
  els.copyWechat.setAttribute('aria-label','复制公众号格式');
  rail.querySelector('footer').append(credit);
  // The existing migration actions remain available from the account area.
  const migration=document.querySelector('#migrationTestControls');
  if(migration) rail.querySelector('footer').append(migration);
  footer.hidden=true;

  const palettes=[['#ffffff','纯白'],['#f5efe5','暖米'],['#e7f3ef','浅绿'],['#edf0ff','浅蓝'],['#292d33','石墨黑'],['#1f7160','墨翠绿']];
  for(const [value,name] of palettes){
    const button=document.createElement('button');button.type='button';button.dataset.cardBackground=value;
    button.setAttribute('aria-label',name);button.title=name;button.style.setProperty('--reference-swatch',value);
    button.addEventListener('click',()=>{
      els.bgColor.value=value;
      els.textColor.value=['#292d33','#1f7160'].includes(value)?'#ffffff':'#202938';
      els.bgColor.dispatchEvent(new Event('input',{bubbles:true}));
    });
    rail.querySelector('.reference-swatches').append(button);
  }
  const leftStatus=document.createElement('div');leftStatus.className='reference-editor-status';
  leftStatus.innerHTML='<span>Markdown</span><span>本地草稿</span>';editor.append(leftStatus);
  const rightStatus=document.createElement('div');rightStatus.className='reference-preview-status';
  rightStatus.append(els.status);
  const zoom=document.querySelector('.preview-zoom-bar');rightStatus.append(zoom);
  const fit=document.createElement('span');fit.className='reference-fit-label';fit.textContent='适应窗口';rightStatus.append(fit);
  previewPanel.append(rightStatus);

  // Keep the existing Obsidian controls in their details menu, but render the
  // panel in the top layer so editor overflow and the style rail cannot clip it.
  const obsidianMenu=document.querySelector('#obsidianImportMenu');
  const obsidianSummary=obsidianMenu.querySelector('summary');
  const obsidianPopover=obsidianMenu.querySelector('.tool-popover');
  obsidianPopover.id='referenceObsidianPopover';
  obsidianPopover.classList.add('reference-obsidian-popover');
  obsidianPopover.setAttribute('popover','manual');
  obsidianPopover.setAttribute('aria-label','Obsidian 双向同步');
  obsidianSummary.setAttribute('aria-controls',obsidianPopover.id);
  obsidianSummary.setAttribute('aria-expanded','false');
  function placeObsidianPopover(){
    if(!obsidianPopover.matches(':popover-open'))return;
    const margin=12,gap=8,r=obsidianSummary.getBoundingClientRect();
    const viewport=window.visualViewport;
    const left=viewport?.offsetLeft||0,top=viewport?.offsetTop||0;
    const width=viewport?.width||innerWidth,height=viewport?.height||innerHeight;
    obsidianPopover.style.setProperty('--reference-obsidian-height',`${Math.max(0,height-margin*2)}px`);
    const below=Math.max(0,top+height-margin-r.bottom-gap);
    const above=Math.max(0,r.top-gap-top-margin);
    const naturalHeight=obsidianPopover.scrollHeight+2;
    const openAbove=below<Math.min(naturalHeight,240)&&above>below;
    obsidianPopover.style.setProperty('--reference-obsidian-height',`${openAbove?above:below}px`);
    const box=obsidianPopover.getBoundingClientRect();
    const x=Math.max(left+margin,Math.min(r.left,left+width-box.width-margin));
    const y=openAbove?r.top-gap-box.height:r.bottom+gap;
    obsidianPopover.style.setProperty('--reference-obsidian-left',`${x}px`);
    obsidianPopover.style.setProperty('--reference-obsidian-top',`${Math.max(top+margin,Math.min(y,top+height-box.height-margin))}px`);
  }
  obsidianMenu.addEventListener('toggle',()=>{
    obsidianSummary.setAttribute('aria-expanded',String(obsidianMenu.open));
    if(obsidianMenu.open){
      if(!obsidianPopover.matches(':popover-open'))obsidianPopover.showPopover();
      placeObsidianPopover();
    }else if(obsidianPopover.matches(':popover-open')){
      const restoreFocus=obsidianPopover.contains(document.activeElement);
      obsidianPopover.hidePopover();
      if(restoreFocus)obsidianSummary.focus({preventScroll:true});
    }
  });
  window.addEventListener('resize',placeObsidianPopover);
  window.visualViewport?.addEventListener('resize',placeObsidianPopover);
  window.visualViewport?.addEventListener('scroll',placeObsidianPopover);
  document.addEventListener('scroll',event=>{
    if(!obsidianPopover.contains(event.target))placeObsidianPopover();
  },{capture:true,passive:true});

  const openStyles=()=>{document.body.classList.add('reference-styles-open');rail.focus({preventScroll:true});};
  rail.tabIndex=-1;
  mobileStyle.addEventListener('click',openStyles);
  rail.querySelector('.reference-close-style').addEventListener('click',()=>document.body.classList.remove('reference-styles-open'));
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    const dialog=[...document.querySelectorAll('[role="dialog"]:not(.hidden),dialog[open]')].some(node=>node.getClientRects().length>0);
    if(dialog||modeMenu.matches(':popover-open')||obsidianMenu.open)return;
    document.body.classList.remove('reference-styles-open');
  },true);
  rail.querySelector('.reference-reset').addEventListener('click',()=>{
    if(state.appMode==='article'){
      for(const selector of ['[data-article-theme="classic"]','[data-article-font="sans"]','[data-article-size="normal"]','[data-article-color="#0f766e"]'])document.querySelector(selector).click();
    }else{
      const defaults={fontSizeInput:String(DEFAULT_CARD_FONT_SIZE),lineHeightInput:'1.85',textColorInput:'#202938',accentColorInput:'#2563eb',bgColorInput:'#ffffff',zhFontInput:'zh-system',enFontInput:'en-system',imageHeightInput:'1048'};
      for(const [id,value] of Object.entries(defaults))document.getElementById(id).value=value;
      els.fontSize.dispatchEvent(new Event('input',{bubbles:true}));
    }
  });

  function placeMenu(){
    if(!modeMenu.matches(':popover-open'))return;
    const r=modeButton.getBoundingClientRect();
    modeMenu.style.left=`${Math.max(12,Math.min(r.left,innerWidth-modeMenu.offsetWidth-12))}px`;
    modeMenu.style.top=`${r.bottom+8}px`;
    modeMenu.style.maxHeight=`${Math.max(140,innerHeight-r.bottom-20)}px`;
  }
  modeMenu.addEventListener('toggle',()=>{modeButton.setAttribute('aria-expanded',String(modeMenu.matches(':popover-open')));placeMenu();});
  modeMenu.addEventListener('keydown',event=>{
    if(!['ArrowUp','ArrowDown'].includes(event.key))return;
    const buttons=[...writing.querySelectorAll('button')],index=buttons.indexOf(document.activeElement);
    event.preventDefault();buttons[(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length].focus();
  });
  function arrange(){
    const immersive=document.body.dataset.creationMode==='immersive';
    const article=state.appMode==='article';
    const actionHost=immersive?toolbarRow:brandRow;
    if(actions.parentElement!==actionHost)actionHost.append(actions);
    brandRow.hidden=immersive;
    if(immersive){surface.before(previewHeader);editor.append(rightStatus);}else{previewPanel.prepend(previewHeader);previewPanel.append(rightStatus);}
    if(topbarActions.parentElement!==previewHeader)previewHeader.append(topbarActions);
    if(els.articleSettings.parentElement!==rail.querySelector('.reference-article-settings'))rail.querySelector('.reference-article-settings').prepend(els.articleSettings);
    rail.querySelector('.reference-card-settings').hidden=article;
    rail.querySelector('.reference-article-settings').hidden=!article;
    rail.querySelector('header h2').textContent=article?'长文样式':'卡片样式';
    modeButton.querySelector('strong').textContent=immersive?'沉浸写作':'经典模式';
    fit.hidden=!article;
    const text=els.content.value.trim();
    leftStatus.firstElementChild.textContent=`Markdown · ${[...text.replace(/\s/g,'')].length} 字`;
    const color=els.bgColor.value.toLowerCase();
    const name=palettes.find(([value])=>value===color)?.[1]||'自定义';
    rail.querySelector('.reference-background h3 span').textContent=name;
    rail.querySelectorAll('[data-card-background]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.cardBackground===color)));
    const readOnly=isBuiltInProjectId(state.currentProjectId);
    rail.querySelectorAll('.reference-card-settings input,.reference-card-settings select,.reference-card-settings button').forEach(control=>{
      control.disabled=readOnly||(control===els.headerModeToggle&&article);
      control.setAttribute('aria-disabled',String(control.disabled));
      if(control.disabled){
        if(!('previousTabIndex' in control.dataset))control.dataset.previousTabIndex=control.getAttribute('tabindex')||'';
        control.setAttribute('tabindex','-1');
      }else{
        const previous=control.dataset.previousTabIndex;
        if(previous&&previous!=='-1')control.setAttribute('tabindex',previous);
        else control.removeAttribute('tabindex');
        delete control.dataset.previousTabIndex;
      }
    });
    rail.querySelector('.reference-reset').disabled=readOnly;
    requestAnimationFrame(()=>window.wtpNativeCanvasPreview.refreshLayout());
  }
  for(const button of writing.querySelectorAll('button'))button.addEventListener('click',()=>{arrange();if(modeMenu.matches(':popover-open'))modeMenu.hidePopover();modeButton.focus({preventScroll:true});});
  window.addEventListener('preview-document-rendered',arrange);
  window.addEventListener('resize',()=>{placeMenu();});
  els.content.addEventListener('input',()=>{const text=els.content.value;leftStatus.firstElementChild.textContent=`Markdown · ${[...text.replace(/\s/g,'')].length} 字`;});
  storeExperienceVersion(WELCOME_BACK_STORAGE_KEY);els.welcomeBackModal.classList.add('hidden');
  arrange();

  let seeded=false;
  const observer=new MutationObserver(()=>{void seed();});
  async function seed(){
    if(seeded||!cloudState.initialized||!entryState.resolved)return;
    seeded=true;observer.disconnect();
    syncHistoryAvailability();
    if(!state.projects.length){
      await createNewProject();
      els.content.value='# 把时间留给内容。\n\n一份正文，可以排成图文卡片，也可以排成公众号长文。\n\n**经典模式**，在左边整理正文，右边实时查看排版。\n\n**沉浸写作**，直接点进卡片修改文字，内容变长后自动续页。\n\n创作方式决定在哪里写；文章排版决定最后呈现什么样。\n\n图片、实况、Obsidian、查找替换和所有排版工具，都继续保留。';
      els.content.dispatchEvent(new Event('input',{bubbles:true}));
    }
    setHistoryOpen(false);arrange();window.dispatchEvent(new Event('resize'));
    if(new URLSearchParams(location.search).get('entry')==='login')openAccountModal();
  }
  observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  window.addEventListener('preview-document-rendered',seed);void seed();
  window.lucide?.createIcons();
})();
