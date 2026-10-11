"""Vector A4 marker: ArUco DICT_4X4_50 ID1, black outer square 150 mm."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('output', type=Path)
args = parser.parse_args()
args.output.parent.mkdir(parents=True, exist_ok=True)
c = canvas.Canvas(str(args.output), pagesize=A4)
c.setTitle('WoodPilot - Repère Photo Métré 150 mm - ArUco ID 1')
c.setFont('Helvetica-Bold', 18)
c.drawString(20*mm, 277*mm, 'WoodPilot - Photo Métré')
c.setFont('Helvetica', 11)
for i, line in enumerate([
    'Repère 150 mm - ArUco DICT_4X4_50 ID 1',
    'Imprimer en taille reelle (100 %), sans ajustement.',
    'Vérifier au réglet les 150 mm du carré noir extérieur.',
]):
    c.drawString(20*mm, (264-i*7)*mm, line)
x, y, side = 30*mm, 75*mm, 150*mm
# Dictionary ID1 = 3994. Six cells per side: 4x4 data with a black border.
code = 3994
cell = side/6
for row in range(6):
    for col in range(6):
        white = 0 < row < 5 and 0 < col < 5 and ((code >> (15-((row-1)*4+col-1))) & 1)
        if not white:
            c.rect(x+col*cell, y+(5-row)*cell, cell, cell, fill=1, stroke=0)
c.setLineWidth(.5)
c.line(x, y-8*mm, x+side, y-8*mm)
for px in (x, x+side):
    c.line(px, y-5*mm, px, y-11*mm)
c.setFont('Helvetica-Bold', 12)
c.drawCentredString(x+side/2, y-15*mm, '150 mm - bord noir à bord noir')
c.setFont('Helvetica', 10)
for i, line in enumerate([
    'Poser la feuille bien à plat sur la surface à mesurer.',
    'Garder le carré entier et sa marge blanche visibles, nets et sans reflet.',
    'Mesurer uniquement des points dans ce même plan.',
    'Ce repere ne permet pas de mesurer la profondeur d\'une pièce.',
    'Mesure indicative : vérifier au mètre avant fabrication.',
]):
    c.drawString(20*mm, (48-i*6)*mm, line)
c.showPage()
c.save()
