"""Re-subset the bundled CJK fonts (needs: pip install fonttools brotli).

The repo ships trimmed copies of Dela Gothic One, DotGothic16 and Yusei Magic:
Latin, symbols, all kana and a few hundred common kanji. If you put new kanji in
config.json, the build warns about missing glyphs. Fix: download the full fonts
(links in README.md next to this file) into a folder, then run

    python3 stage/fonts/subset.py <folder-with-full-ttfs> "新しい漢字"

and commit the regenerated files in stage/fonts/.
"""
import sys
from pathlib import Path
from fontTools import subset

FONTS = ['DelaGothicOne-Regular.ttf', 'DotGothic16-Regular.ttf', 'YuseiMagic-Regular.ttf']

RANGES = [
    (0x20, 0x7E), (0xA0, 0xFF),        # basic latin + latin-1
    (0x2010, 0x205E),                  # punctuation
    (0x2190, 0x21FF),                  # arrows
    (0x2212, 0x2212), (0x2260, 0x2265),
    (0x2460, 0x24FF),                  # circled numbers
    (0x25A0, 0x25FF),                  # shapes
    (0x2600, 0x266F),                  # stars, notes, hearts
    (0x3000, 0x303F),                  # CJK punctuation
    (0x3040, 0x30FF),                  # hiragana + katakana
    (0xFF01, 0xFF9F),                  # fullwidth + halfwidth forms
]

KANJI = (
    '放課後日本語当券入場整理番号開演会料金席再生中終機材楽屋公演本前売別途満員御礼軽音部練習照明物販曲新旧作詞編歌唱奏録配信'
    '東京大阪横浜名古屋都福岡札幌北海道沖縄学生校高中小大情報安全攻撃防御解析調査証拠痕跡監視検知不正対策開発勉強英漢字読書'
    '趣味好嫌今週月火水木金土年時分秒朝昼夜春夏秋冬西南上下左右外内一二三四五六七八九十百千万円人名私僕俺君彼女友達先輩後'
    '期間限定特別招待出演予定次回最高感謝挑戦未来夢力心愛音楽声光影空海山川花雪雨風星天地世界国家族猫犬茶菓子休憩'
    '電気動画像映画面画撮影写真記事集合宿題試験合格卒業入学授業教室部室先生同級遊戯攻略対戦勝負技術科工場作品'
    '管理者権限暗号鍵認証通信網接続回線設定変更確認完了失敗成功警告注意危険禁止許可取扱精密器'
    '卓譜拍盤弦鼓唄響奏者客場階段控室裏表舞台幕袖'
)


def unicodes(extra=''):
    cps = set()
    for a, b in RANGES:
        cps.update(range(a, b + 1))
    cps.update(ord(c) for c in KANJI + extra)
    return sorted(cps)


def main():
    src = Path(sys.argv[1])
    extra = sys.argv[2] if len(sys.argv) > 2 else ''
    here = Path(__file__).parent
    for name in FONTS:
        opts = subset.Options()
        opts.layout_features = ['*']
        opts.name_IDs = ['*']
        opts.notdef_outline = True
        opts.glyph_names = False
        f = subset.load_font(str(src / name), opts)
        s = subset.Subsetter(opts)
        s.populate(unicodes=unicodes(extra))
        s.subset(f)
        subset.save_font(f, str(here / name), opts)
        print(name, (here / name).stat().st_size // 1024, 'KB')


if __name__ == '__main__':
    main()
