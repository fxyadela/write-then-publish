// One shared toolbar. Move incumbent nodes; keep their IDs and event handlers.
(() => {
  const toolbar = document.querySelector('.editor-controls .toolbar');
  if (!toolbar) return;

  const primary = document.createElement('div');
  primary.className = 'toolbar-text-row';
  primary.setAttribute('role', 'group');
  primary.setAttribute('aria-label', '文字排版');

  const take = selector => {
    const element = toolbar.querySelector(selector);
    if (element) primary.append(element);
  };
  take('[data-format="h1"]');
  take('[data-format="h2"]');

  for (const id of ['fontSizeInput', 'lineHeightInput']) {
    const field = document.getElementById(id)?.closest('label');
    if (field) {
      field.classList.add('toolbar-layout-field');
      primary.append(field);
    }
  }

  take('[data-format="bold"]');
  take('[data-format="italic"]');
  take('#underlineMenu');
  take('[data-format="quote"]');
  take('#colorMenu');
  take('#bgColorMenu');
  take('.preview-history-tools');

  const actions = document.querySelector('.brand-actions');
  for (const selector of ['#contentImageInput','#contentVideoInput']) {
    const node=toolbar.querySelector(selector)?.closest('label');
    if(node)primary.append(node);
  }
  const obsidian = toolbar.querySelector('#obsidianImportMenu');
  if (obsidian) actions.append(obsidian);
  const header = document.getElementById('headerModeToggleBtn');
  if(header){
    const row=document.createElement('div');row.className='preview-avatar-setting';
    const label=document.createElement('span');label.id='previewAvatarSettingLabel';label.textContent='每页头像';
    header.setAttribute('aria-labelledby',label.id);row.append(label,header);
    document.querySelector('.editor-controls').append(row);
  }
  const imageCrop=toolbar.querySelector('summary[aria-label="图片裁剪"]')?.closest('details');
  if(imageCrop){imageCrop.hidden=true;toolbar.append(imageCrop);}
  take('#copyPlainTextBtn');
  take('.settings-menu');
  take('#emojiMenu');
  take('#searchMenu');
  // Retain the hidden legacy fields so original event bindings stay intact.
  const retained=document.createElement('div');retained.hidden=true;
  retained.append(...toolbar.children);document.body.append(retained);
  toolbar.replaceChildren(primary);
  toolbar.classList.add('toolbar-layout-preview');
  // Keep native color/underline panels above the horizontal scroll container.
  primary.querySelectorAll('.tool-menu').forEach(details => {
    const panel = details.querySelector('.tool-popover');
    if (!panel) return;
    panel.setAttribute('popover','manual');
    panel.classList.add('preview-text-popover');
    details.addEventListener('toggle', () => {
      if (!details.open) { if (panel.matches(':popover-open')) panel.hidePopover();return; }
      panel.showPopover();
      const rect = details.getBoundingClientRect();
      panel.style.setProperty('--preview-popover-left',`${Math.max(12,Math.min(rect.left,innerWidth-panel.offsetWidth-12))}px`);
      panel.style.top = `${Math.max(12,Math.min(rect.bottom+8,innerHeight-panel.offsetHeight-12))}px`;
    });
  });
  if (window.lucide) window.lucide.createIcons();
})();
