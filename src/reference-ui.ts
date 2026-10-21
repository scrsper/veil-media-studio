export function icon(name:string){
 const paths:Record<string,string>={
 'General':'M24 3 45 24 24 45 3 24Z M24 10v28M10 24h28M19 19l10 10M29 19 19 29',
 'Upper Body':'M20 6q4-4 8 0v8l9 5 4 17-8 2-3-9 1 15H17l1-15-3 9-8-2 4-17 9-5Z',
 'Arms':'M8 35q8-2 14-11l4-12 6-5 6 4-1 7-7-1-2 9q8-7 13-1l1 10q-15 10-34 0Z',
 'Legs':'M15 5h18l2 10-5 15 3 13h-8l-2-14 1-11-4 11-1 14h-8l4-15-3-13Z',
 'Face':'M24 4c-13 0-14 11-11 20 2 9 7 17 11 17s9-8 11-17C38 15 37 4 24 4Z M16 20h6m4 0h6M24 23l-2 7h4m-7 5h10',
 'Eyes':'M4 24q20-25 40 0-20 25-40 0Z M29 24a5 5 0 1 1-10 0 5 5 0 1 1 10 0',
 'Nose':'M24 8 14 32q10 8 20 0l-4-8 M18 34h3m6 0h3',
 'Mouth':'M4 25q11-10 20-3 9-7 20 3-20 19-40 0Z M4 25q20 4 40 0',
 'Ears':'M16 39C5 19 16 3 28 8s12 17 1 24c-5 2-3 12-10 10M20 29c-5-9-2-17 5-14s6 8-1 11',
 'Hair':'M10 35C0 10 19 0 30 6c18 4 18 20 9 36l-8-11 3-16-10 8-6-10-4 16Z',
 'Cosmetics':'M8 40 24 20l7 7-19 16Z M25 16l10-9 7 6-9 11Z M10 4v12M4 10h12',
 'Outfit':'M16 7 4 16l6 10 7-4v22h14V22l7 4 6-10-12-9q-8 9-16 0Z',
 'Underwear':'M8 9 5 24q8 12 19 0 11 12 19 0L40 9M24 24v4M9 35h30L24 46Z',
 'Light':'M17 34c0-10-8-10-8-19a15 15 0 0 1 30 0c0 9-8 9-8 19Zm1 5h12m-10 5h8',
 'Crest':'M24 3c10 9-12 13-5 23 5 7 16 0 12-9 14 15-1 25-7 24C5 41 1 23 13 14M24 24v23M8 31q16 15 32-4'
 };const alias=name==='Morphs'||name==='Preset'?'General':name==='Male'||name==='Female'?'Upper Body':name;
 return `<svg viewBox="0 0 48 48" aria-hidden="true" class="ui-icon"><path d="${paths[alias]||paths.General}" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
export const referenceLayout=`
<section id="stage"><div id="viewport"></div></section>
<header class="game-header"><h1><span class="crest">${icon('Crest')}</span><span class="brand-name">VEIL<small>MEDIA STUDIO</small></span></h1><nav id="main-tabs" aria-label="Customization sections"></nav><button id="load" class="back" title="Load appearance" aria-label="Load preset">↥ <span>Load appearance</span></button><input id="file" type="file" accept="application/json" hidden></header>
<section class="appearance-tools" aria-label="Appearance and lighting">
<div class="panel-eyebrow">YOUR CHARACTER</div><div class="types"><button data-type="Veil_Male" title="Male" aria-label="Male">${icon('Male')}<span>Male</span></button><button data-type="Veil_Female" class="selected" title="Female" aria-label="Female">${icon('Female')}<span>Female</span></button></div>
<details class="tool-section" open><summary>Appearance</summary><label class="tool-label color-line">Skin Color <input id="skin-color" aria-label="Skin Color" type="color" value="#c7c7c7"></label>
<div class="tool-label">Custom Skin Gloss</div><label class="check-line"><input id="skin-gloss-enabled" type="checkbox" checked> All Skin Gloss</label>
<label class="tool-label">All Skin Gloss <input id="skin-gloss" aria-label="All Skin Gloss" type="range" min="0" max="100" value="50"></label>
<div class="tool-label">Preview Outfit</div><div class="square-options"><button id="underwear" class="selected" title="Underwear preview" aria-label="Underwear preview">${icon('Underwear')}</button><button id="outfit" title="Base outfit" aria-label="Base outfit">${icon('Outfit')}</button></div>
<label class="check-line"><input id="hide-undergarments" type="checkbox"> Hide undergarments</label><label id="anatomy-option" class="check-line" hidden><input id="anatomy-detail" type="checkbox" checked> Anatomy detail</label><p id="skin-preview-note" class="cosmetic-note" hidden>Original body proportions with local skin and anatomy details.</p>
</details><details class="tool-section"><summary>Motion & gaze</summary><label class="check-line motion"><input id="look-tracking" type="checkbox" checked> Follow pointer with head and eyes</label>
<div class="tool-label">Action Preview</div>
<label class="cosmetic-field">Action <select id="action-preview" aria-label="Action preview"><option value="idle">Creator idle</option><option value="Walk">Walk</option><option value="Run">Run</option><option value="Run_Jump_Start">Jump takeoff</option><option value="Run_Jump_Loop">In the air</option><option value="Run_Jump_Land">Landing</option></select></label>
<label class="cosmetic-field">Speed <select id="action-speed" aria-label="Playback speed"><option value="0.5">Half speed</option><option value="1" selected>Normal</option><option value="1.5">Fast</option></select></label>
<button id="action-replay">Replay action</button>
<label class="check-line motion"><input id="idle-motion" type="checkbox" checked> Play animation</label>
<label class="check-line motion"><input id="secondary-motion" type="checkbox" checked> Secondary motion</label>
</details><details class="tool-section"><summary>Lighting studio</summary><div class="tool-label">Lighting Type</div><div class="square-options"><button data-light="studio" title="Studio lighting" aria-label="Studio lighting">${icon('Light')}</button><button data-light="daylight" class="selected" title="Daylight" aria-label="Daylight">☼</button><button data-light="evening" title="Neutral lighting" aria-label="Neutral lighting">☾</button></div>
<div class="tool-label">Lighting Position <button id="light-reset" title="Reset lighting" aria-label="Reset lighting">⟳</button></div><div id="light-pad" tabindex="0" role="slider" aria-label="Lighting position" aria-valuemin="-70" aria-valuemax="70" aria-valuenow="-35"><div class="compass">✧</div><span id="light-point">◈</span></div>
</details>
</section>
<aside class="editor"><nav id="categories" aria-label="Detail categories"></nav><div class="editor-content"><div class="editor-heading"><span id="editor-kicker"></span><h2 id="editor-title"></h2></div><div id="sliders"></div><div class="actions"><button id="reset" title="Reset current controls" aria-label="Reset controls">⟲</button><button id="save" class="primary">Save appearance</button></div></div></aside>
<div class="camera"><button id="face" title="Face view" aria-label="Face view">${icon('Face')}<span>Portrait</span></button><button id="body" class="selected" title="Full body" aria-label="Full body">◈<span>Full body</span></button><button id="body-detail" title="Body detail view" aria-label="Body detail view">⌕<span>Detail</span></button><button id="turn" title="Turn around" aria-label="Turn around">↻<span>Turn</span></button></div>
<div class="scene-caption"><span>MAKE YOUR SCENE</span><small>Character / Motion / Light</small></div><div id="notice" role="status" aria-live="polite">Loading appearance…</div>`;
export const bodyControls=[
 {name:'Height',section:'General',value:50},{name:'Head Size',section:'General',value:45},{name:'Shoulder Width',section:'Upper Body',value:50},{name:'Chest Size',section:'Upper Body',value:50},{name:'Waist Size',section:'Upper Body',value:50},
 {name:'Arm Thickness',section:'Arms',value:50},{name:'Arm Length',section:'Arms',value:50},
 {name:'Pelvis Size',section:'Glutes',value:50},{name:'Hip Size',section:'Glutes',value:60},{name:'Hip Height',section:'Glutes',value:45},
 {name:'Leg Thickness',section:'Legs',value:25},{name:'Thigh Length',section:'Legs',value:30},{name:'Thigh Thickness',section:'Legs',value:40},{name:'Calf Length',section:'Legs',value:40},{name:'Calf Thickness',section:'Legs',value:60},{name:'Foot Width',section:'Feet',value:50}
];

