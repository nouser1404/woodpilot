// Tap-accessible help, also available with a keyboard; operational errors remain visible.
export function installToolHelp(){
  for(const root of document.querySelectorAll('.tool-dialog')){
    const paragraphs=[...root.children,...root.querySelectorAll('.photo-calibration [data-calibration-controls] > p:not([role])')].filter(e=>e.tagName==='P'&&e.textContent.trim()&&e.getAttribute('role')!=='alert'&&(!e.hasAttribute('role')||e.matches('[data-level-sound-status],[data-level-axis-status]'))&&!e.matches('[data-detection-status],[data-source-offcut],.photo-warning'));
    if(!paragraphs.length)continue;
    const header=root.querySelector('.tool-header');if(!header)continue;
    const panel=document.createElement('div');panel.id=root.id+'Help';panel.className='tool-help-popover';panel.setAttribute('popover','auto');panel.setAttribute('role','note');
    const title=document.createElement('strong');title.textContent='Mode d’emploi';panel.append(title,...paragraphs);
    const close=document.createElement('button');close.className='secondary-btn';close.textContent='Compris';close.onclick=()=>panel.hidePopover();panel.append(close);
    const button=document.createElement('button');button.className='icon-btn tool-help-button';button.type='button';button.setAttribute('aria-label','Aide '+(root.querySelector('h2')?.textContent||''));button.setAttribute('popovertarget',panel.id);button.innerHTML='<span class="material-symbols-rounded" aria-hidden="true">help</span>';header.insertBefore(button,header.querySelector('[data-close]'));root.append(panel);
  }
}
