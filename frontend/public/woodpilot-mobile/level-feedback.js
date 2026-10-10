// Keep raw measurement precision; stabilize only alignment feedback and display.
export function stabilizeLevel(reading,previous=null,now=0){
  const eligible=reading.angle<=(previous?.aligned?.4:.2);
  const since=eligible?(previous?.since??now):null;
  const aligned=eligible&&(previous?.aligned||now-since>=500);
  const axis=(value,last)=>aligned?0:Math.abs(value-(last??value))<.1?(last??value):Math.round(value*10)/10;
  return {aligned,since,x:axis(reading.x,previous?.x),y:axis(reading.y,previous?.y)};
}
export function roundedLevel(value){return Math.round(value)||0;}
