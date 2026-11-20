from pathlib import Path
from PIL import Image

root = Path('assets/images')
for png in root.rglob('*.png'):
    webp = png.with_suffix('.webp')
    im = Image.open(png).convert('RGB')
    im.save(webp, 'WEBP', quality=82, method=6)
    print(f'{png.name} -> {webp.name} {webp.stat().st_size//1024} KB')
    png.unlink()
