import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBending, bendingText } from '../public/woodpilot-mobile/cintrage.js';
test('Cintrage : corde 800 mm, flèche 120 mm', () => {
  const result = calculateBending(800, 120);
  assert.ok(Math.abs(result.radius - 726.6666666667) < 1e-7);
  assert.ok(Math.abs(result.angle - 66.79697693597) < 1e-7);
  assert.ok(Math.abs(result.arcLength - 847.1677492823336) < 1e-7);
});
test('Demi-cercle et arc très plat restent finis', () => {
  const semicircle = calculateBending(800, 400);
  assert.equal(semicircle.radius, 400);
  assert.equal(semicircle.angle, 180);
  assert.ok(Math.abs(semicircle.arcLength - 400 * Math.PI) < 1e-8);
  assert.ok(Math.abs(calculateBending(800, .001).arcLength - 800) < .001);
});
test('Refuse les dimensions invalides et les arcs majeurs', () => {
  for (const [chord, sagitta] of [[0,120],[800,0],[-800,120],[NaN,120],[800,Infinity],[800,401],[1000001,1],[800,.0001]]) {
    assert.throws(() => calculateBending(chord, sagitta), RangeError);
  }
});
test('Le partage décrit les entrées, unités et hypothèse', () => {
  const text = bendingText(800,120);
  assert.match(text, /arc circulaire mineur/);
  assert.match(text, /Corde : 800 mm/);
  assert.match(text, /Rayon : 726,7 mm/);
  assert.match(text, /Angle au centre : 66,8°/);
});

test('Pente / diagonale : triangle 3-4-5 et angles complémentaires', async () => {
  const { calculateSlope } = await import('../public/woodpilot-mobile/slope.js');
  const result = calculateSlope(800, 600);
  assert.equal(result.diagonal, 1000);
  assert.equal(result.percent, 75);
  assert.ok(Math.abs(result.angle - 36.8698976458) < 1e-8);
  assert.equal(result.angle + result.complementaryAngle, 90);
});
test('Pente nulle, valeurs invalides et partage autonome', async () => {
  const { calculateSlope, slopeText } = await import('../public/woodpilot-mobile/slope.js');
  assert.deepEqual(calculateSlope(800, 0), {diagonal:800, percent:0, angle:0, complementaryAngle:90});
  for (const pair of [[0, 600], [800, -1], [Infinity, 600], [800, NaN], [1000001, 600]]) {
    assert.throws(() => calculateSlope(...pair), RangeError);
  }
  const text = slopeText(800,600);
  assert.match(text, /Diagonale théorique : 1\s000 mm/);
  assert.match(text, /Pente : 75 %/);
  assert.match(text, /contrôler les deux diagonales/);
});

test('Angles : onglets égaux et convention scie', async () => {
  const {calculateMiter,miterText}=await import('../public/woodpilot-mobile/calculators.js');
  assert.deepEqual(calculateMiter(90),{miter:45,halfAngle:45});
  assert.equal(calculateMiter(120).miter,30);
  for(const angle of [0,180,NaN,Infinity,-90])assert.throws(()=>calculateMiter(angle),RangeError);
  assert.match(miterText(90),/scie à 0° = coupe d’équerre/);
});
test('Répartition : reconstruction de la longueur, espaces et axes', async () => {
  const {calculateSpacing}=await import('../public/woodpilot-mobile/calculators.js');
  const withEnds=calculateSpacing(1000,40,5,true);
  assert.ok(Math.abs(withEnds.gap*6+5*40-1000)<1e-9);
  assert.ok(Math.abs(withEnds.positions[0]-withEnds.gap-20)<1e-9);
  const flush=calculateSpacing(1000,40,5,false);
  assert.equal(flush.gap,200);assert.deepEqual(flush.positions,[20,260,500,740,980]);
  for(const args of [[100,60,2,true],[1000,40,1,true],[1000,40,2.5,true],[1000,0,5,true],[Infinity,40,5,true]])assert.throws(()=>calculateSpacing(...args),RangeError);
});
test('Saisie : virgule, signe, entiers et ajustements précis',async()=>{
  const {parseNumber,adjustNumber}=await import('../public/woodpilot-mobile/number-model.js');
  assert.equal(parseNumber('19,2'),19.2);assert.equal(adjustNumber('19,2',1),20.2);
  assert.equal(parseNumber('-50',{min:-100}),-50);assert.equal(parseNumber('0',{min:0}),0);
  for(const value of ['', ' ', '0x20','1e5','NaN','1,2,3'])assert.throws(()=>parseNumber(value),RangeError);
  assert.throws(()=>parseNumber('2,5',{integer:true}),RangeError);
});
test('Caisson : dimensions extérieures et panneaux séparés par épaisseur',async()=>{
  const {generateCabinet,calculateNesting}=await import('../public/woodpilot-mobile/manufacturing.js');
  const pieces=generateCabinet({width:800,height:720,depth:560,thickness:19,shelves:1,backThickness:6});
  assert.deepEqual(pieces.map(p=>[p.name,p.lengthMm,p.widthMm,p.quantity,p.thicknessMm]),[['Côté',720,554,2,19],['Dessus / dessous',762,554,2,19],['Tablette',762,554,1,19],['Fond rapporté',720,800,1,6]]);
  const groups=calculateNesting({panel:{lengthMm:2800,widthMm:2070,sawKerfMm:4},pieces});
  assert.deepEqual(groups.map(g=>g.thickness),[19,6]);
  assert.equal(groups.reduce((s,g)=>s+g.result.overflowPieces.length,0),0);
  assert.throws(()=>generateCabinet({width:30,height:720,depth:560,thickness:19,shelves:1,backThickness:6}),RangeError);
});
test('Calpinage : hors format, fil et espace du trait de scie',async()=>{
  const {calculateNesting,validateCutList,cutListCsv}=await import('../public/woodpilot-mobile/manufacturing.js');
  const panel={lengthMm:1000,widthMm:600,sawKerfMm:4};
  const piece={name:'Tablette',lengthMm:500,widthMm:600,quantity:2,thicknessMm:19,allowRotation:false};
  assert.equal(calculateNesting({panel,pieces:[piece]})[0].result.panels.length,2);
  const result=calculateNesting({panel,pieces:[{...piece,lengthMm:600,widthMm:800,quantity:1}]})[0].result;
  assert.equal(result.overflowPieces.length,1);assert.equal(result.panels.length,0);
  assert.equal(calculateNesting({panel,pieces:[{...piece,lengthMm:600,widthMm:800,quantity:1,allowRotation:true}]})[0].result.overflowPieces.length,0);
  assert.throws(()=>validateCutList({panel,pieces:[{...piece,quantity:201}]}),RangeError);
  assert.match(cutListCsv({panel,pieces:[{...piece,name:'=SUM(A1)'}]}),/"'=SUM\(A1\)"/);
});
test('Photo Métré : coordonnées normalisées et validation des sauvegardes',async()=>{
  const {normalizedPoint,validatePhoto}=await import('../public/woodpilot-mobile/photo-model.js');
  assert.deepEqual(normalizedPoint(50,20,100,100),{x:.5,y:.2});
  assert.deepEqual(normalizedPoint(-5,200,100,100),{x:0,y:1});
  assert.throws(()=>validatePhoto({image:'javascript:alert(1)',lines:[]}),RangeError);
  assert.throws(()=>validatePhoto({image:'data:image/jpeg;base64,AAAA',lines:[{a:{x:2,y:0},b:{x:1,y:1},value:800}]}),RangeError);
});
test('PDF : table de références cohérente, objets et image JPEG',async()=>{
  const {jpegPdf}=await import('../public/woodpilot-mobile/export-result.js');
  const bytes=new Uint8Array(await jpegPdf(new Uint8Array([255,216,255,217]),1200,800).arrayBuffer());
  const content=new TextDecoder().decode(bytes);
  assert.match(content,/^%PDF-1.4/);assert.match(content,/\/DCTDecode/);
  const offset=Number(content.match(/startxref\n(\d+)/)[1]);
  assert.equal(new TextDecoder().decode(bytes.slice(offset,offset+4)),'xref');
  const offsets=[...content.matchAll(/(\d{10}) 00000 n/g)].map(m=>Number(m[1]));
  offsets.forEach((position,i)=>assert.equal(new TextDecoder().decode(bytes.slice(position,position+7)),`${i+1} 0 obj`));
});

test('Arêtiers : parité avec appcalpi, symétrie et sommet désaxé',async()=>{
  const {calculateAretiers,faceTemplate,templateSvg}=await import('../public/woodpilot-mobile/aretiers.js');
  const regular={n:6,R:300,H:400,dx:0,dy:0,zCut:0,zCut2:0};
  const model=calculateAretiers(regular);
  for(const edge of model.items){assert.ok(Math.abs(edge.length-500)<1e-9);assert.ok(Math.abs(edge.delta-49.582561794289774)<1e-9);assert.ok(Math.abs(edge.bevelTool-65.20871910285511)<1e-9);}
  const offset={n:5,R:300,H:400,dx:50,dy:-30,zCut:200,zCut2:250};
  const asymmetric=calculateAretiers(offset);
  const referenceLengths=[472.65209192385896,511.1247474561023,536.8897879197489,516.8078707701576,476.4561604968906];
  asymmetric.items.forEach((item,i)=>{assert.ok(Math.abs(item.length-referenceLengths[i])<1e-8);assert.ok(Math.abs(item.cutLength-referenceLengths[i]*.625)<1e-8);});
  assert.ok(Math.abs(asymmetric.items[0].bevelTool-58.29970047426437)<1e-9);
  // Le centre d'une section désaxée suit l'interpolation apex/base.
  const section=asymmetric.sections[1];
  assert.ok(Math.abs(section.points.reduce((sum,p)=>sum+p[0],0)/5-31.25)<1e-8);
  const face=faceTemplate(offset,0);
  assert.equal(face.points.length,4);
  assert.ok(Math.abs(Math.hypot(face.points[3][0],face.points[3][1])-asymmetric.items[0].cutLength)<1e-8);
  assert.match(templateSvg(offset,0),/width="[0-9.]+mm"/);
  for(const patch of [{n:2},{R:0},{H:0},{zCut:400},{dx:NaN}])assert.throws(()=>calculateAretiers({...regular,...patch}),RangeError);
});


test('Expressions : priorité, virgule, parenthèses et refus de code',async()=>{
  const {calculateExpression}=await import('../public/woodpilot-mobile/expression.js');
  assert.equal(calculateExpression('1842 - 2*19'),1804);
  assert.equal(calculateExpression('(800 + 20) / 2'),410);
  assert.equal(calculateExpression('-2,5 × (4−1)'),-7.5);
  for(const input of ['1/0','1..2','1 2','2**3','(2+3','Math.random()','1;alert(1)','1e3',')1('])assert.throws(()=>calculateExpression(input));
  assert.throws(()=>calculateExpression('('.repeat(33)+'1'+')'.repeat(33)));
});
test('Arêtes : rectangle contrasté, absence de texture et sélection tactile',async()=>{
  const {detectSegments,closestSegment}=await import('../public/woodpilot-mobile/edge-detection.js');
  const width=240,height=180,data=new Uint8ClampedArray(width*height*4).fill(255);
  assert.deepEqual(detectSegments({width,height,data}),[]);
  for(let y=35;y<145;y++)for(let x=40;x<200;x++){const i=(y*width+x)*4;data[i]=data[i+1]=data[i+2]=30;}
  const segments=detectSegments({width,height,data});assert.equal(segments.length,4);
  for(const segment of segments)for(const point of [segment.a,segment.b])assert.ok(point.x>=0&&point.x<=1&&point.y>=0&&point.y<=1);
  assert.ok(closestSegment({x:.5,y:35/height},segments,width,height));
  assert.equal(closestSegment({x:.5,y:.5},segments,width,height),null);
  assert.throws(()=>detectSegments({width:500,height,data}));
});
test('Chutes : un seul stock réel, épaisseur et rectangles récupérables',async()=>{
  const {calculateNesting}=await import('../public/woodpilot-mobile/manufacturing.js');
  const {validateOffcut,recoverableOffcuts}=await import('../public/woodpilot-mobile/offcuts.js');
  const sourceOffcut={id:'test',name:'Chute',lengthMm:1000,widthMm:500,thicknessMm:19};
  validateOffcut(sourceOffcut);
  const data={panel:{lengthMm:1000,widthMm:500,sawKerfMm:4},sourceOffcut,pieces:[{name:'Côté',lengthMm:900,widthMm:400,thicknessMm:19,quantity:2,allowRotation:false}]};
  const [{result}]=calculateNesting(data);assert.equal(result.panels.length,1);assert.equal(result.overflowPieces.length,1);
  assert.ok(result.utilizationPct<=100);
  assert.throws(()=>calculateNesting({...data,pieces:[{...data.pieces[0],thicknessMm:18}]}));
  assert.throws(()=>calculateNesting({...data,panel:{...data.panel,lengthMm:1200}}));
  assert.throws(()=>validateOffcut({...sourceOffcut,widthMm:0}));
  assert.deepEqual(recoverableOffcuts({freeRects:[{lengthMm:400,widthMm:200},{lengthMm:90,widthMm:600}]},19),[{name:'Chute 1',lengthMm:400,widthMm:200,thicknessMm:19}]);
});
test('Favoris : réorganisation stable sans perte ni duplication',async()=>{
  const {moveFavourite}=await import('../public/woodpilot-mobile/favourites.js');
  const ids=['photo','bending','cabinet'];assert.deepEqual(moveFavourite(ids,'bending',-1),['bending','photo','cabinet']);assert.deepEqual(ids,['photo','bending','cabinet']);assert.deepEqual(moveFavourite(ids,'photo',-1),ids);
});
test('Photos : annotations et notes rétrocompatibles avec les sauvegardes V1',async()=>{
  const {validatePhoto}=await import('../public/woodpilot-mobile/photo-model.js');
  const photo={image:'data:image/jpeg;base64,YQ==',lines:[],annotations:[{point:{x:.5,y:.5},text:'Mur gauche'}],notes:'Contrôler la prise électrique'};
  validatePhoto(photo);validatePhoto({image:photo.image,lines:[]});
  assert.throws(()=>validatePhoto({...photo,annotations:[{point:{x:2,y:0},text:'Mur'}]}));
  assert.throws(()=>validatePhoto({...photo,notes:'x'.repeat(2001)}));
});

test('Sauvegardes de chutes : réimport sans recréer un stock utilisé',async()=>{
  const {prepareOffcutImport}=await import('../public/woodpilot-mobile/offcuts.js');
  const original={id:'stock-1',name:'Chute',lengthMm:800,widthMm:400,thicknessMm:19};
  const current={...original,usedAt:'2026-10-07'};
  assert.deepEqual(prepareOffcutImport([original],[current]),[]);
  assert.deepEqual(prepareOffcutImport([original],[]),[original]);
  assert.throws(()=>prepareOffcutImport([original,original]));
  assert.throws(()=>prepareOffcutImport([{...original,id:null}]));
});
