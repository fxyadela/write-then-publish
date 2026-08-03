#!/usr/bin/env python3
"""从同一套几何生成所有品牌图标（favicon.ico / PNG / og-image）。

之前这批图是手工导出的，标记被缩到画布左上角只占 21%，
在标签页里看过去就是一个白方块。这里把几何定义成唯一真源，
所有尺寸都从它渲染，就不会再出现某一档尺寸单独画错。

用法：python3 scripts/build_brand_icons.py
"""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "brand"

INK = (23, 32, 47, 255)          # #17202f
PAPER = (255, 255, 255, 255)
SS = 8                            # 超采样倍数，缩回目标尺寸时得到抗锯齿

# 所有几何都写在 64 单位的方格里，跟 favicon.svg 保持同一坐标系。
BOX = 64.0


def quad(p0, p1, p2, steps=24):
    """二次贝塞尔采样成折线。"""
    out = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        out.append((
            u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
            u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
        ))
    return out


def nib(scale=1.0, weight=0.0):
    """笔尖：一条指向左下的斜向笔画。weight 让它在小尺寸下更粗。"""
    pts = [(14, 50), (17 - weight, 39 - weight), (35, 21), (44 + weight, 30 + weight), (26, 48)]
    return _placed(pts, scale)


def spark(scale=1.0):
    """右上角的四角星，控制点往中心收形成尖角，跟 favicon.svg 的路径一致。"""
    top, right, bottom, left = (47, 4), (59, 16), (47, 28), (35, 16)
    pts = []
    pts += quad(top, (49.9, 12.1), right)
    pts += quad(right, (49.9, 19.9), bottom)
    pts += quad(bottom, (44.1, 19.9), left)
    pts += quad(left, (44.1, 12.1), top)
    return _placed(pts, scale)


# 原始构图的包围盒是 x 14→59、y 4→50，中心在 (36.5, 27)，比画布中心偏右上。
# 先把它挪正再谈缩放；直接按中心放大会把四角星顶出上边缘。
ART_SHIFT = (BOX / 2 - 36.5, BOX / 2 - 27.0)


def _placed(pts, scale):
    """先居中，再以画布中心为原点缩放。"""
    cx = cy = BOX / 2
    out = []
    for x, y in pts:
        x += ART_SHIFT[0]
        y += ART_SHIFT[1]
        out.append((cx + (x - cx) * scale, cy + (y - cy) * scale))
    return out


def render(size, *, simple=False, scale=1.12, weight=0.0, radius_ratio=14 / 64):
    """渲染一张 size×size 的图标。simple=True 时省掉四角星，只留加粗的笔尖。"""
    px = size * SS
    img = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    unit = px / BOX

    draw.rounded_rectangle(
        [0, 0, px - 1, px - 1],
        radius=px * radius_ratio,
        fill=INK,
    )

    def to_px(pts):
        return [(x * unit, y * unit) for x, y in pts]

    draw.polygon(to_px(nib(scale, weight)), fill=PAPER)
    if not simple:
        draw.polygon(to_px(spark(scale)), fill=PAPER)

    return img.resize((size, size), Image.LANCZOS)


def build():
    BRAND.mkdir(exist_ok=True)

    # 16px 上笔尖 + 星星会糊成两团，这一档只留加粗的笔尖，单个形状才认得出。
    layers = [
        render(16, simple=True, scale=1.22, weight=2.6),
        render(32, scale=1.0, weight=0.8),
        render(48, scale=1.0, weight=0.3),
    ]
    layers[2].save(
        ROOT / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=layers[:2],
    )

    render(96, scale=1.0).save(BRAND / "icon-96.png")
    render(192, scale=1.0).save(BRAND / "icon-192.png")
    # iOS 自己会切圆角，给它方角实底，否则圆角会被切两次露出白边。
    render(180, scale=1.0, radius_ratio=0).save(BRAND / "apple-touch-icon.png")

    # og-image.png 是排好版的社交预览卡，标记本来就画对了，这里不碰。
    print("已生成：favicon.ico / icon-96 / icon-192 / apple-touch-icon")


if __name__ == "__main__":
    build()
