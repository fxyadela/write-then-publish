// This page demonstrates the product; creation and account actions use the
// shared workspace and its original onboarding/account UI.
(() => {
  const app=document.getElementById('site-home').shadowRoot.getElementById('home-app');
  const q=selector=>app.querySelector(selector);
  const qa=selector=>[...app.querySelectorAll(selector)];
  const icons=()=>window.lucide?.createIcons({root:app.getRootNode()});
  const examples=[
    '<strong>把时间留给内容。</strong><p>写完一篇图文，最费时间的往往是反复排版：调整换行、插入图片，再把长内容拆成多张卡片。写了就发把这些事放在同一个工作区，让你把时间留给内容本身。接着往下写。<span class="mini-caret" aria-hidden="true"></span></p>',
    '<p>正文与图片一起排好，内容写满后自动续到下一张。段落顺序保留下来，图片也会跟随正文。</p><img src="home-assets/example-comic-mint-bunny-v1.png" alt="薄荷绿小兔与AI终端的两格漫画">',
    '<p><b>经典模式</b>适合先把思路写清楚：左侧整理 Markdown 正文，右侧查看实时排版。标题、加粗、高亮和图片工具都继续保留，字号与行距也能随时调整。接着写下去，长内容会接续生成卡片。</p>',
    '<p><b>沉浸写作</b>直接在卡片里修改文字，写满就自动续页。图片跟随正文排好，也可以继续调整段落。</p><p>经典与沉浸共用同一份正文和完整工具栏，随时切换，都能接着写下去，不用来回复制内容。</p>',
    '<p>同一篇正文，可以排成图文卡片，也可以换成公众号长文。创作方式决定在哪里写，<mark>文章排版决定呈现什么样。</mark></p><p>为长文选好主题、字体和配色，再复制到公众号后台，发布前的排版就轻松多了。</p>',
    '<p>稿件保存在当前浏览器，也能另存可编辑原稿。连接 Obsidian 后，笔记与图片也能导入并同步。</p><p>导出可以重命名，单张普通卡片直接下载图片，多张或多个文件再打包。保存原稿，下次接着写。</p>'
  ];

  function card(content){
    const node=document.createElement('article');node.className='demo-card';
    node.innerHTML=`<div class="mini-author"><img src="home-assets/creator-avatar.webp" alt=""><div class="mini-author-meta"><strong>捏捏番茄 <img class="mini-verified" src="home-assets/verified.svg" alt="原版认证"></strong><small>全网 60 万订阅的创作者</small></div><i data-lucide="ellipsis" aria-hidden="true"></i></div><div class="mini-card-content${content.includes('<img')?' has-image':''}">${content}</div>`;
    return node;
  }
  examples.forEach(content=>{
    const cell=document.createElement('div');cell.className='demo-card-cell';cell.append(card(content));q('.demo-cards').append(cell);
  });
  q('.output-cards-visual').append(card('<strong>把时间留给内容。</strong><p>先把想法写下来。</p><img src="home-assets/example-comic-mint-bunny-v1.png" alt=""><p><mark>写完，不必再到处排版。</mark></p>'));

  // The source column and both creation-mode illustrations share one article.
  const markdown=q('.demo-markdown');markdown.replaceChildren();
  examples.forEach(html=>{
    const fragment=document.createElement('template');fragment.innerHTML=html;
    [...fragment.content.children].forEach(part=>{
      const line=document.createElement('p');
      line.textContent=part.tagName==='IMG'?'[[image:mint-bunny]]':(part.tagName==='STRONG'?'# ':'')+part.textContent;
      markdown.append(line);
    });
  });

  const pages=['home','intro','about'];
  const scrollHost=q('#home-content');
  function showPage(name,{remember=true}={}){
    const current=pages.includes(name)?name:'home';
    const changed=app.dataset.page!==current;
    app.dataset.page=current;
    pages.forEach(page=>{q(`#${page}-page`).hidden=page!==current;});
    qa('.home-nav [data-page]').forEach(button=>{
      if(button.dataset.page===current)button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
    });
    if(changed){scrollHost.scrollTop=0;markIntroSection('writing');}
    if(remember&&location.hash!==`#${current}`)history.pushState({page:current},'',`#${current}`);
    if(document.documentElement.dataset.siteView==='home')document.title=`${{home:'写了就发',intro:'功能简介',about:'关于捏捏番茄'}[current]} · Write Then Publish`;
  }
  function markIntroSection(name){
    const selected=name==='layouts'?'layouts':'writing';
    app.dataset.introTab=selected;
    qa('.intro-navigation [data-intro-section]').forEach(button=>{
      if(button.dataset.introSection===selected)button.setAttribute('aria-current','location');
      else button.removeAttribute('aria-current');
    });
  }
  function showIntroSection(name){
    const selected=name==='layouts'?'layouts':'writing';
    const top=selected==='writing'?0:scrollHost.scrollTop+
      q('#layouts-panel').getBoundingClientRect().top-scrollHost.getBoundingClientRect().top-
      q('.intro-navigation').offsetHeight-24;
    markIntroSection(selected);
    scrollHost.scrollTo({top,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  scrollHost.addEventListener('scroll',()=>{
    if(app.dataset.page!=='intro')return;
    const threshold=scrollHost.getBoundingClientRect().top+q('.intro-navigation').offsetHeight+48;
    markIntroSection(q('#layouts-panel').getBoundingClientRect().top<=threshold?'layouts':'writing');
  },{passive:true});
  function showDemoMode(name){
    const mode=name==='immersive'?'immersive':'classic',immersive=mode==='immersive';
    app.dataset.demoMode=mode;
    qa('.mode-option').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.demoMode===mode)));
    q('.demo-stage').classList.toggle('is-immersive',immersive);
    q('.demo-window').setAttribute('aria-label',`${immersive?'沉浸写作':'经典模式'}示例稿`);
    q('#demo-title').textContent=`写了就发 · ${immersive?'沉浸写作':'经典模式'}`;
    q('#demo-caption').textContent=immersive?'沉浸写作 · 直接在卡片上改，写满后自动续到下一张':'经典模式 · 左边写 Markdown，右边实时预览多张卡片与自动分页';
  }
  const dialog=q('#media-dialog');
  function showMedia(name){
    const body=q('#media-body');body.replaceChildren();
    dialog.dataset.media=name;
    q('#media-title').textContent=name==='official-account'?'关注公众号 / 贴图号':name==='motion'?'实况图文：原图与点开后的效果':'公众号长文示例';
    q('#close-media').setAttribute('aria-label',name==='official-account'?'关闭关注二维码':'关闭示例');
    function figure(src,caption){const node=document.createElement('figure'),title=document.createElement('figcaption'),img=document.createElement('img');title.textContent=caption;img.src=src;img.alt=caption;node.append(title,img);return node;}
    if(name==='official-account'){
      const account=document.createElement('div');account.className='official-account-dialog';
      account.innerHTML='<strong>捏捏番茄AI</strong><img class="official-account-qr" src="home-assets/wechat-public-qr.jpg" alt="捏捏番茄AI公众号关注二维码" width="430" height="430"><p class="official-account-help">使用微信扫一扫，或保存图片后在微信中识别。</p>';body.append(account);
    }else if(name==='motion'){
      const pair=document.createElement('div');pair.className='media-pair';pair.append(figure('home-assets/live-original.webp','原图：图文卡片内的实况图片'),figure('home-assets/live-settings.webp','点开后：选片段、时长、倍速、画面比例与保留原声'));body.append(pair);
    }else{
      const example=figure('home-assets/article-mode-user-1485.png','你提供的公众号长文排版与样式设置示例');example.className='article-full-example';body.append(example);
    }
    dialog.showModal();
  }
  app.addEventListener('click',event=>{
    const page=event.target.closest('button[data-page],a.brand');
    if(page){event.preventDefault();showPage(page.dataset.page||'home');return;}
    const section=event.target.closest('button[data-intro-section]');
    if(section){showIntroSection(section.dataset.introSection);return;}
    const mode=event.target.closest('button[data-demo-mode]');
    if(mode){showDemoMode(mode.dataset.demoMode);return;}
    const media=event.target.closest('button[data-media]');
    if(media)showMedia(media.dataset.media);
  });
  q('#close-media').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{const rect=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom))dialog.close();});
  window.addEventListener('popstate',()=>showPage(location.hash.slice(1),{remember:false}));
  window.addEventListener('hashchange',()=>showPage(location.hash.slice(1),{remember:false}));
  showPage(location.hash.slice(1),{remember:false});markIntroSection('writing');showDemoMode('classic');icons();
})();
