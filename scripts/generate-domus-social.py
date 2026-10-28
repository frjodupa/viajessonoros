#!/usr/bin/env python3
"""Genera una imagen social (1200×630) con el logotipo oficial protegido."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/"public"
OUT=PUBLIC/"talleres-domus"/"domus-social.jpg"
W,H=1200,630
im=Image.new("RGB",(W,H),(251,247,239))
draw=ImageDraw.Draw(im)
# Fondo editorial en capas suaves, con área de fotografía a la derecha.
photo=Image.open(PUBLIC/"viajes-sonoros-social.jpg").convert("RGB")
pw,ph=photo.size
crop_w=int(ph*0.95)
if pw>crop_w: photo=photo.crop(((pw-crop_w)//2,0,(pw+crop_w)//2,ph))
photo=photo.resize((560,630),Image.Resampling.LANCZOS)
im.paste(photo,(640,0))
# Velo claro sobre la fotografía para legibilidad.
overlay=Image.new("RGBA",(W,H),(0,0,0,0))
d=ImageDraw.Draw(overlay)
d.rectangle((0,0,655,630),fill=(252,248,241,255))
for x in range(640,780,3):
 d.rectangle((x,0,x+3,630),fill=(252,248,241,max(0,int(255*(780-x)/140))))
im=Image.alpha_composite(im.convert("RGBA"),overlay)
d=ImageDraw.Draw(im)
deep=(52,37,95,255); gold=(150,109,59,255)
font_sans="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
font_serif="/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
logo=Image.open(PUBLIC/"logo-oficial.png").convert("RGBA")
logo.thumbnail((220,130),Image.Resampling.LANCZOS)
im.alpha_composite(logo,(55,34))
d.text((55,172),"TALLERES DE INICIACIÓN · CÁCERES",fill=gold,font=ImageFont.truetype(font_sans,19))
d.text((48,230),"Talleres Domus",fill=deep,font=ImageFont.truetype(font_serif,57))
d.text((48,307),"Pan Drums",fill=gold,font=ImageFont.truetype(font_serif,69))
d.text((55,409),"Para niños y adultos",fill=deep,font=ImageFont.truetype(font_sans,27))
d.text((55,454),"Clases de 90 minutos · Instrumentos incluidos",fill=deep,font=ImageFont.truetype(font_sans,18))
d.rounded_rectangle((48,515,492,580),radius=25,fill=deep)
d.text((78,534),"DESCUBRE Y RESERVA TU PLAZA",fill=(255,255,255,255),font=ImageFont.truetype(font_sans,20))
OUT.parent.mkdir(parents=True,exist_ok=True)
im.convert("RGB").save(OUT,"JPEG",quality=88,optimize=True,subsampling=0)
print(OUT)
