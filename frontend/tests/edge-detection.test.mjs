import test from 'node:test';
import assert from 'node:assert/strict';
import {detectSegments,closestSegment} from '../public/woodpilot-mobile/edge-detection.js';
function picture(w,h,fn){const data=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=4*(y*w+x),v=fn(x,y);data[i]=data[i+1]=data[i+2]=v;data[i+3]=255;}return {width:w,height:h,data};}
test('Low contrast edges survive adaptive filtering',()=>{
 const im=picture(320,240,(x,y)=>x>=60&&x<260&&y>=50&&y<190?140:160),lines=detectSegments(im);
 assert.equal(lines.length,4);assert.ok(closestSegment({x:.5,y:50/240},lines,320,240,4));
});
test('Parallel thin borders stay distinct',()=>{
 const im=picture(320,240,(x,y)=>y>=80&&y<90?20:220),lines=detectSegments(im);
 assert.ok(closestSegment({x:.5,y:80/240},lines,320,240,3));assert.ok(closestSegment({x:.5,y:90/240},lines,320,240,3));
});
test('Separated collinear objects are not joined across a void',()=>{
 const im=picture(400,200,(x,y)=>y>=70&&y<120&&((x>=30&&x<140)||(x>=250&&x<370))?30:220),lines=detectSegments(im);
 assert.ok(closestSegment({x:80/400,y:70/200},lines,400,200,4));assert.ok(closestSegment({x:300/400,y:70/200},lines,400,200,4));
 assert.equal(closestSegment({x:.5,y:70/200},lines,400,200,8),null);
});
test('Oblique edges retain perspective instead of snapping to horizontal',()=>{
 const im=picture(480,320,(x,y)=>y>70+x*.3?80:200),lines=detectSegments(im);
 const line=closestSegment({x:.5,y:142/320},lines,480,320,5);assert.ok(line);
 assert.ok(Math.abs((line.b.y-line.a.y)*320/((line.b.x-line.a.x)*480)-.3)<.03);
});
test('Deterministic and bounded on a high resolution noisy photo',()=>{
 const im=picture(960,640,(x,y)=>120+((x*17+y*31)%9)),lines=detectSegments(im);
 assert.equal(lines.length,0);assert.deepEqual(detectSegments(im),lines);
 assert.throws(()=>detectSegments({...im,width:961}));
});
