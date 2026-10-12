// Smoothed gradients, non-maximum suppression and connected weak-edge recovery.
export function edgePixels({width:w,height:h,data}){
 const gray=new Float32Array(w*h),smooth=new Float32Array(w*h),gx=new Float32Array(w*h),gy=new Float32Array(w*h),mag=new Float32Array(w*h),thin=new Float32Array(w*h);
 for(let i=0;i<gray.length;i++)gray[i]=.299*data[4*i]+.587*data[4*i+1]+.114*data[4*i+2];
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;smooth[i]=(gray[i-w-1]+2*gray[i-w]+gray[i-w+1]+2*gray[i-1]+4*gray[i]+2*gray[i+1]+gray[i+w-1]+2*gray[i+w]+gray[i+w+1])/16;}
 const values=[];
 for(let y=2;y<h-2;y++)for(let x=2;x<w-2;x++){const i=y*w+x;gx[i]=-smooth[i-w-1]+smooth[i-w+1]-2*smooth[i-1]+2*smooth[i+1]-smooth[i+w-1]+smooth[i+w+1];gy[i]=-smooth[i-w-1]-2*smooth[i-w]-smooth[i-w+1]+smooth[i+w-1]+2*smooth[i+w]+smooth[i+w+1];mag[i]=Math.hypot(gx[i],gy[i]);}
 for(let y=2;y<h-2;y++)for(let x=2;x<w-2;x++){const i=y*w+x,a=((Math.atan2(gy[i],gx[i])*180/Math.PI+180)%180),d=a<22.5||a>=157.5?1:a<67.5?w+1:a<112.5?w:w-1;if(mag[i]>=mag[i-d]&&mag[i]>mag[i+d]&&mag[i]>10){thin[i]=mag[i];values.push(mag[i]);}}
 if(!values.length)return [];
 values.sort((a,b)=>a-b);const high=Math.max(28,values[Math.floor(values.length*.8)]*.45),low=high*.45,seen=new Uint8Array(w*h),queue=[];
 for(let i=0;i<thin.length;i++)if(thin[i]>=high){seen[i]=1;queue.push(i);}
 for(let k=0;k<queue.length;k++){const i=queue[k];for(const d of [-w-1,-w,-w+1,-1,1,w-1,w,w+1]){const j=i+d;if(!seen[j]&&thin[j]>=low){seen[j]=1;queue.push(j);}}}
 return queue.map(i=>({x:i%w,y:Math.floor(i/w),angle:Math.atan2(gy[i],gx[i]),strength:mag[i]}));
}
