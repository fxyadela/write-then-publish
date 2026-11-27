// One document keeps the incumbent account controller and browser draft scope.
// The informational pages use a shadow root so their styles cannot alter tools.
(() => {
  const host=document.getElementById('site-home');
  const root=host.attachShadow({mode:'open'});
  const style=document.createElement('link');
  style.rel='stylesheet';style.href='src/home.css?v=20261128-site';
  root.append(style,document.getElementById('site-home-template').content.cloneNode(true));
  const visible=()=>document.documentElement.dataset.siteView==='home';
  let starting=false;
  const homeScroll=()=>root.querySelector('#home-content');
  function updateAccount(){
    const button=root.querySelector('[data-open-account]');
    button.textContent=cloudState.user?'账号':'登录';
    button.hidden=LOCAL_DEPLOYMENT_MODE;
  }
  function showHome(){
    saveState();
    document.documentElement.dataset.siteView='home';
    updateAccount();
    root.querySelector('.home-nav button[data-page="home"]').click();
  }
  async function start(button){
    if(starting)return;
    starting=true;button.setAttribute('aria-busy','true');
    try{
      await window.wtpAccountReady;
      document.documentElement.dataset.siteView='workspace';
      history.pushState(null,'','#workspace');
      document.title=LOCAL_DEPLOYMENT_MODE?'写了就发（本地版）':'写了就发 | Write Then Publish';
      applyPanelLayout();
      await render();
      let needsGuide=true;
      try{needsGuide=localStorage.getItem(ONBOARDING_STORAGE_KEY)!=='completed';}catch{}
      if(needsGuide){
        await showGuideProjectForDemo();
        onboardingMode='first-run';showOnboardingStep(0);
      }
      window.wtpNativeCanvasPreview?.refreshLayout();
    }finally{starting=false;button.removeAttribute('aria-busy');}
  }
  root.addEventListener('click',async event=>{
    const create=event.target.closest('[data-start-creation]');
    if(create){event.preventDefault();void start(create);return;}
    const account=event.target.closest('[data-open-account]');
    if(account){
      event.preventDefault();const scroll=homeScroll().scrollTop;
      await window.wtpAccountReady;
      openAccountModal();
      homeScroll().scrollTop=scroll;
    }
  });
  document.addEventListener('click',event=>{
    if(event.target.closest('.reference-brand')){event.preventDefault();showHome();}
  });
  const accountObserver=new MutationObserver(()=>updateAccount());
  document.addEventListener('DOMContentLoaded',()=>{
    updateAccount();
    accountObserver.observe(document.getElementById('accountButtonLabel'),{childList:true,subtree:true,characterData:true});
  },{once:true});
  window.addEventListener('popstate',()=>{
    const workspace=location.hash==='#workspace';
    document.documentElement.dataset.siteView=workspace?'workspace':'home';
    if(workspace){applyPanelLayout();void render();}
  });
  window.wtpSiteHome={isVisible:visible,show:showHome};
})();
