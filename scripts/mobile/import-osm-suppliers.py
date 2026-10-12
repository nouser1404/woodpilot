"""Import local Overpass extracts; no network calls. Usage: script RAW_DIRECTORY."""
import csv,json,math,re,sys,unicodedata
from pathlib import Path
from datetime import date
raw=Path(sys.argv[1]); dest=Path(__file__).resolve().parents[2]/'frontend/public/woodpilot-mobile/suppliers'
countries=['FR','BE','LU','DE','CH','IT','ES','AD','MC']
missing=[c for c in countries if not (raw/f'{c}.json').exists()]
if missing: raise SystemExit('Missing extracts: '+','.join(missing))
def norm(s): return re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())
def sphere(lat,lon):
 a,b=map(math.radians,(lat,lon));return (math.cos(a)*math.cos(b),math.cos(a)*math.sin(b),math.sin(a))
def distance(a,b):return 6371*2*math.asin(min(1,math.sqrt(sum((x-y)**2 for x,y in zip(sphere(*a),sphere(*b))))/2))
border_grid={}
for way in json.loads((raw/'borders.json').read_text())['elements']:
 g=way.get('geometry',[])
 if way.get('tags',{}).get('maritime')!='yes' and g and all(40<=p['lat']<=52 and -6.5<=p['lon']<=11 for p in g):
  for p in g:
   k=(math.floor(p['lat']*2),math.floor(p['lon']*2));border_grid.setdefault(k,set()).add(sphere(p['lat'],p['lon']))
def border_bound(lat,lon):
 p=sphere(lat,lon);a,b=math.floor(lat*2),math.floor(lon*2)
 candidates=[q for i in range(a-2,a+3) for j in range(b-2,b+3) for q in border_grid.get((i,j),[])]
 if not candidates:return 1000
 chord=min(sum((x-y)**2 for x,y in zip(p,q)) for q in candidates)
 return 6371*2*math.asin(min(1,math.sqrt(chord)/2))
polygons=[]
for f in json.loads((raw/'department-polygons.json').read_text())['features']:
 geom=f['geometry'];parts=geom['coordinates'] if geom['type']=='MultiPolygon' else [geom['coordinates']]
 for rings in parts:
  pts=rings[0];polygons.append((f['properties']['code'],(min(p[0] for p in pts),min(p[1] for p in pts),max(p[0] for p in pts),max(p[1] for p in pts)),rings))
def inside(x,y,ring):
 hit=False;j=len(ring)-1
 for i,(xi,yi) in enumerate(ring):
  xj,yj=ring[j]
  if (yi>y)!=(yj>y) and x<(xj-xi)*(y-yi)/(yj-yi)+xi:hit=not hit
  j=i
 return hit
def department(lat,lon):
 for code,(xmin,ymin,xmax,ymax),rings in polygons:
  if xmin<=lon<=xmax and ymin<=lat<=ymax and inside(lon,lat,rings[0]) and not any(inside(lon,lat,r) for r in rings[1:]):return code
 return 'FR-UNKNOWN'
curated=json.loads((dest/'suppliers.json').read_text());rows=[];aliases={};seen={};today=date.today().isoformat()
previous=json.loads((dest/'osm-id-map.json').read_text()) if (dest/'osm-id-map.json').exists() else {}
for country in countries:
 print('Import '+country,flush=True)
 for e in json.loads((raw/f'{country}.json').read_text())['elements']:
  t=e.get('tags',{});name=t.get('name') or t.get('brand');pos=e.get('center',e);lat,lon=pos.get('lat'),pos.get('lon')
  if not name or lat is None or t.get('disused')=='yes' or t.get('abandoned')=='yes' or t.get('opening_hours')=='closed' or 'disused:shop' in t:continue
  if re.search(r'bois de chauffage|firewood|brennholz',name,re.I):continue
  key=f"{e['type']}/{e['id']}"
  if key in aliases:continue
  bound=None
  if country!='FR':
   bound=border_bound(lat,lon)
   if bound>49:continue
  duplicate=next((s for s in curated if s.get('lat') is not None and distance((lat,lon),(s['lat'],s['lon']))<.25 and (norm(name) in norm(s['name']) or norm(s['name']) in norm(name))),None)
  duplicate=duplicate or next((s for s in seen.get(norm(name),[]) if distance((lat,lon),(s['lat'],s['lon']))<.12),None)
  if duplicate:aliases[key]=duplicate['id'];continue
  identity=previous.get(key,1000000000000+e['id']*10+{'node':0,'way':1,'relation':2}[e['type']])
  prior=next((s for s in curated+rows if s['id']==identity),None)
  if prior:aliases[key]=identity;continue
  aliases[key]=identity
  shop=t.get('shop');craft=t.get('craft','');trade=t.get('trade','')
  category='Scierie' if craft=='sawmill' or t.get('industrial')=='sawmill' else 'Affûtage' if craft.startswith('sharpening') else 'Finition' if shop=='paint' else 'Quincaillerie' if shop=='hardware' or trade=='hardware' else 'Bois massif' if shop in ('wood','timber') or trade in ('wood','timber') else 'Bricolage'
  address=' '.join(filter(None,[t.get('addr:housenumber'),t.get('addr:street'),t.get('addr:postcode'),t.get('addr:city')])) or 'Adresse non renseignée — position cartographique'
  row=dict(id=identity,name=name,category=category,country=country,department=department(lat,lon) if country=='FR' else country+'-ALL',address=address,phone=t.get('contact:phone',t.get('phone','')),email=t.get('contact:email',t.get('email','')),url='https://www.openstreetmap.org/'+key,description='Adresse communautaire OpenStreetMap. Activité et prestations à confirmer auprès de l’établissement.',tags=[],checked=today,lat=lat,lon=lon,sourceType='open_data',geoType='osm_point',geoSource='OpenStreetMap')
  if bound is not None:row.update(borderDistanceUpperBoundKm=round(bound,3),borderScope='À moins de 50 km de la frontière terrestre française (repère cartographique, marge de sécurité 1 km).')
  rows.append(row);seen.setdefault(norm(name),[]).append(row)
(dest/'community-suppliers.json').write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':'))+'\n')
(dest/'osm-id-map.json').write_text(json.dumps(aliases,separators=(',',':'))+'\n')
metadata=dict(date=today,license='ODbL-1.0',source='https://www.openstreetmap.org/copyright',exhaustive=False,countries={c:sum(s['country']==c for s in rows) for c in countries},borderMethod='Distance au sommet le plus proche des frontières terrestres communes OSM, majorant cartographique ; seuil 49 km pour une limite de 50 km.',departments=len(set(s['department'] for s in rows if s['country']=='FR')))
(dest/'catalog-metadata.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
with (dest/'catalogue-national.csv').open('w',encoding='utf-8-sig',newline='') as out:
 writer=csv.writer(out,delimiter=';');writer.writerow(['Nom','Activité','Pays','Territoire','Adresse','Téléphone','Email','Source','Date extraction/consultation','Statut'])
 for s in curated+rows:writer.writerow([s.get(k,'FR' if k=='country' else '') for k in ['name','category','country','department','address','phone','email','url','checked']]+['Communautaire, à confirmer' if s.get('sourceType')=='open_data' else 'Fiche sélectionnée'])
print(json.dumps(metadata,ensure_ascii=False))
