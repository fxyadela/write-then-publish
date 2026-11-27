// Direct file selection, retaining the original upload/crop event handler.
(() => {
  const button=document.getElementById('previewAvatarButton');
  const input=document.getElementById('avatarInput');
  const panel=document.getElementById('previewAvatarPanel');
  button.removeAttribute('popovertarget');
  button.after(input);
  panel.remove();
  button.addEventListener('click',()=>input.click());
})();
