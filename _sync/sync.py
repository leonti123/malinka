"""Блок «Новые работы» на malinka-zefir.ru из стены группы ВК club220975829.

Запускается в GitHub Actions (секрет VK_TOKEN = сервисный ключ приложения ВК, только чтение wall.get).
Берёт последние посты группы с фото, кладёт первое фото в img/w/<id>.jpg (600x750) и переписывает
строку `const FEED=[...];` в index.html. Ручные подписи для отдельных постов: _sync/overrides.json.
Проверка без API: python _sync/sync.py --wall=файл.json (ответ wall.get в том же виде).
"""
import io, json, os, re, sys, time, urllib.parse, urllib.request
from PIL import Image, ImageOps

GID = 220975829
COUNT = 6
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'img', 'w')
INDEX = os.path.join(ROOT, 'index.html')
MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
UA = {'User-Agent': 'Mozilla/5.0 (malinka-zefir site sync)'}


def api(method, **params):
    token = os.environ.get('VK_TOKEN', '')
    if not token:
        sys.exit('VK_TOKEN is not set')
    params.update(access_token=token, v='5.199')
    req = urllib.request.Request('https://api.vk.com/method/' + method, data=urllib.parse.urlencode(params).encode(), headers=UA)
    data = json.loads(urllib.request.urlopen(req, timeout=30).read())
    if 'error' in data:  # не печатать запрос: в нём токен
        e = data['error']; sys.exit(f"VK {method} error {e.get('error_code')}: {e.get('error_msg')}")
    return data['response']


def fetch(url):
    err = None
    for i in range(3):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read()
        except Exception as e:  # noqa: BLE001
            err = e; time.sleep(2 * (i + 1))
    raise err


def biggest(sizes):
    return max((s for s in sizes if s.get('url')), key=lambda s: s.get('width', 0) * s.get('height', 0))['url']


EMOJI = re.compile('[\U0001F000-\U0001FFFF☀-➿️‍⭐⭕←-⇿⌀-⏿]')


def clean(text):
    t = re.sub(r'\[(?:club|id|public)\d+\|([^\]]+)\]', r'\1', text)
    t = re.sub(r'https?://\S+|vk\.(?:com|ru)/\S+', '', t)
    t = re.sub(r'#\S+', '', t)
    t = EMOJI.sub('', t)
    # хвост с контактами: «Мой каталог: Для заказа пишите: @... или 8-911-...»
    t = re.split(r'(?i)\b(?:мой каталог|каталог:|для заказа|для заказов|заказать можно|по вопросам|пишите в|пишите:|звоните|телефон для)', t)[0]
    t = re.sub(r'@\S+', '', t)
    t = re.sub(r'(?:\+7|8)[\s(-]*\d{3}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}', '', t)
    t = re.sub(r'(\d)\s*(?:руб(?:лей|\.)?|р\.)(?=[\s,.!;)]|$)', r'\1 ₽', t)
    t = re.sub(r'(\d)(кг|гр|г|см)\b', r'\1 \2', t)
    t = re.sub(r'(\d)(\d{3}) ₽', r'\1 \2 ₽', t)
    t = re.sub(r'\s+', ' ', t).strip(' .,;:-–—')
    return t


def short(t, mx=170):
    if len(t) <= mx:
        return t
    parts, out = re.split(r'(?<=[.!?])\s+', t), ''
    for p in parts:
        if len(out) + len(p) + 1 > mx:
            break
        out = (out + ' ' + p).strip()
    if not out:
        out = t[:mx].rsplit(' ', 1)[0] + '…'
    return out


def main():
    arg = next((a for a in sys.argv[1:] if a.startswith('--wall=')), None)
    wall = json.load(open(arg[7:]))['items'] if arg else api('wall.get', owner_id=-GID, count=40)['items']
    over = json.load(open(os.path.join(ROOT, '_sync', 'overrides.json'), encoding='utf-8'))
    feed = []
    for p in sorted(wall, key=lambda p: -p['date']):
        if p.get('copy_history') or p.get('marked_as_ads') or p.get('is_pinned') or p.get('from_id', -GID) != -GID:
            continue
        ph = [a['photo'] for a in p.get('attachments', []) if a.get('type') == 'photo']
        if not ph:
            continue
        pid = str(p['id'])
        o = over.get(pid, {})
        text = clean(p.get('text', ''))
        t = o.get('t') or short(text) or 'Новая работа в группе'
        alt = o.get('alt') or (re.split(r'[.!?]', text)[0][:80] if text else 'Работа мастерской Малинка')
        lt = time.gmtime(p['date'] + 3 * 3600)  # время Петербурга
        if not o.get('t') and len(t) > 3 and not t.endswith(('.', '!', '?', '…')):
            t += '.'
        f = os.path.join(IMG, pid + '.jpg')
        if not os.path.exists(f):
            im = ImageOps.exif_transpose(Image.open(io.BytesIO(fetch(biggest(ph[0]['sizes']))))).convert('RGB')
            ImageOps.fit(im, (600, 750), Image.LANCZOS).save(f, 'JPEG', quality=80, optimize=True, progressive=True)
            print('new photo', pid)
        feed.append({'id': int(pid), 'd': f'{lt.tm_mday} {MON[lt.tm_mon - 1]}', 'alt': alt, 't': t})
        if len(feed) == COUNT:
            break
    if not feed:
        sys.exit('no photo posts found, page left as is')
    keep = {f"{x['id']}.jpg" for x in feed}
    for name in os.listdir(IMG):
        if name.endswith('.jpg') and name not in keep:
            os.remove(os.path.join(IMG, name))
    html = open(INDEX, encoding='utf-8').read()
    line = 'const FEED=' + json.dumps(feed, ensure_ascii=False, separators=(',', ':')) + ';'
    new, n = re.subn(r'const FEED=\[.*?\];', lambda m: line, html, count=1)
    if n != 1:
        sys.exit('FEED line not found in index.html')
    if new != html:
        open(INDEX, 'w', encoding='utf-8').write(new)
        print('index.html updated:', [x['id'] for x in feed])
    else:
        print('no changes')


if __name__ == '__main__':
    main()
