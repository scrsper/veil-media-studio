/** Group existing controls without replacing them or losing their handlers. */
export function groupStyleControls(panel: Element) {
  const sections = new Map<string, HTMLElement>();
  const controls = Array.from(panel.children).filter(e => e.matches('label'));
  const choose = (label: string) => /iris|pupil|sclera/i.test(label) ? 'Eyes'
    : /brow|eyelash|facial hair/i.test(label) ? 'Brows & lashes'
    : /lip/i.test(label) ? 'Lips'
    : /paint|tattoo|scar|freckle/i.test(label) ? 'Paint & markings'
    : 'Complexion & makeup';
  for (const name of ['Eyes', 'Brows & lashes', 'Complexion & makeup', 'Lips', 'Paint & markings']) {
    const section = document.createElement('section');
    section.className = 'open-control-section style-section';
    const title = document.createElement('h3');
    title.textContent = name;
    section.append(title);
    sections.set(name, section);
    panel.append(section);
  }
  for (const control of controls) {
    const title = control.querySelector('input,select')?.getAttribute('aria-label') ?? '';
    sections.get(choose(title))!.append(control);
  }
}
