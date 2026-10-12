"""Validate canonical JSON; optionally regenerate the UTF-8 Excel-friendly CSV."""
import argparse,csv,json,math,pathlib,re
parser=argparse.ArgumentParser();parser.add_argument('--write-csv',action='store_true');args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parents[2];folder=root/'frontend'/'public'/'woodpilot-mobile'/'suppliers';data=json.loads((folder/'suppliers.json').read_text())
assert isinstance(data,list) and data,'Supplier array must be nonempty'
ids=set();records=set()
categories={'Panneaux','Bois massif','Scierie','Quincaillerie','Finition','Bricolage','Usinage','Affûtage'}
for d in data:
 assert isinstance(d['id'],int) and d['id']>0 and d['id'] not in ids,('Invalid/duplicate ID',d.get('name'))
 ids.add(d['id']);key=(d['name'],d['address']);assert key not in records,('Duplicate establishment',key);records.add(key)
 assert all(isinstance(d[k],str) for k in ['name','address','phone','email','url','description','department','checked'])
 assert d['category'] in categories and isinstance(d['tags'],list) and all(isinstance(t,str) for t in d['tags'])
 assert d['url'].startswith('https://') and re.fullmatch(r'\d{4}-\d{2}-\d{2}',d['checked'])
 country=d.get('country','FR');assert country in {'FR','BE'}
 if country=='FR':assert re.fullmatch(r'\d{2}',d['department'])
 else:assert d['department'].startswith('BE-') and d['borderDistanceUpperBoundKm']<=50 and d.get('borderReference')
 assert (d.get('lat') is None)==(d.get('lon') is None),'Coordinates must form a pair'
 if d.get('lat') is not None:assert math.isfinite(d['lat']) and math.isfinite(d['lon']) and 47<d['lat']<52 and -1<d['lon']<7
headers=['Nom','Activité','Pays','Territoire','Adresse','Téléphone','Email','Source','Services','Vérification','Latitude','Longitude']
rows=[[d['name'],d['category'],d.get('country','FR'),d['department'],d['address'],d['phone'],d['email'],d['url'],', '.join(d['tags']),d['checked'],str(d['lat']) if d.get('lat') is not None else '',str(d['lon']) if d.get('lon') is not None else ''] for d in data]
csvpath=folder/'fournisseurs.csv'
if args.write_csv:
 with csvpath.open('w',encoding='utf-8-sig',newline='') as f:w=csv.writer(f,delimiter=';');w.writerow(headers);w.writerows(rows)
with csvpath.open(encoding='utf-8-sig',newline='') as f:assert list(csv.reader(f,delimiter=';'))==[headers,*rows],'CSV differs from JSON; run --write-csv'
fr=[d for d in data if d.get('country','FR')=='FR'];be=[d for d in data if d.get('country')=='BE']
print(f"OK: {len(data)} établissements, {len(fr)} français dans {len(set(d['department'] for d in fr))} départements, {len(be)} belges ; IDs et CSV cohérents.")
