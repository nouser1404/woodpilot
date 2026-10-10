const degrees=value=>value*180/Math.PI;
export function levelAxes(gravity,mode='level',screenAngle=0){
 if(!gravity||![gravity.x,gravity.y,gravity.z,screenAngle].every(Number.isFinite)||!['level','plumb'].includes(mode)||Math.hypot(gravity.x,gravity.y,gravity.z)<.1)throw new RangeError('Mesure du capteur invalide.');
 const a=screenAngle*Math.PI/180,x=gravity.x*Math.cos(a)+gravity.y*Math.sin(a),y=-gravity.x*Math.sin(a)+gravity.y*Math.cos(a),z=gravity.z;
 return mode==='level'?{x:degrees(Math.atan2(x,Math.abs(z))),y:degrees(Math.atan2(y,Math.abs(z)))}:{x:degrees(Math.atan2(x,Math.abs(y))),y:degrees(Math.atan2(z,Math.abs(y)))};
}
export function levelReading(axes,zero={x:0,y:0},axis='both'){
 if(![axes?.x,axes?.y,zero?.x,zero?.y].every(Number.isFinite))throw new RangeError('Inclinaison invalide.');
 if(!['both','horizontal','vertical'].includes(axis))throw new RangeError('Axe de contrôle invalide.');
 const x=axis==='vertical'?0:axes.x-zero.x,y=axis==='horizontal'?0:axes.y-zero.y;
 const angle=Math.abs(x)>=90||Math.abs(y)>=90?90:degrees(Math.atan(Math.hypot(Math.tan(x*Math.PI/180),Math.tan(y*Math.PI/180))));
 return {x,y,angle,aligned:angle<=.2,mmPerMeter:angle>=89.9?null:Math.tan(angle*Math.PI/180)*1000};
}
