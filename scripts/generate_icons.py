import math
import cairo
from PIL import Image

def generate_svg(filename):
    svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="20%" y1="10%" x2="80%" y2="90%">
      <stop offset="0%" stop-color="#0b1326"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>

    <!-- Radial Glow inside upper-right -->
    <radialGradient id="radialGlow" cx="68%" cy="32%" r="55%">
      <stop offset="0%" stop-color="#0284c7" stop-opacity="0.3"/>
      <stop offset="60%" stop-color="#10b981" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
    </radialGradient>

    <!-- Area Fill Gradient -->
    <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.32"/>
      <stop offset="50%" stop-color="#06b6d4" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.02"/>
    </linearGradient>

    <!-- Curve Stroke Gradient -->
    <linearGradient id="lineGrad" x1="16%" y1="65%" x2="76%" y2="22%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="48%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>

    <!-- Clip Path for Squircle -->
    <clipPath id="squircleClip">
      <rect x="16" y="16" width="480" height="480" rx="112" ry="112"/>
    </clipPath>
  </defs>

  <!-- Background Squircle with Border -->
  <g clip-path="url(#squircleClip)">
    <rect x="16" y="16" width="480" height="480" fill="url(#bgGrad)"/>
    <circle cx="348" cy="164" r="280" fill="url(#radialGlow)"/>

    <!-- Subtle ATH horizontal dashed line -->
    <line x1="60" y1="230" x2="452" y2="230" stroke="#94a3b8" stroke-opacity="0.35" stroke-width="4" stroke-dasharray="16 12"/>

    <!-- Tactical DCA Accumulation Pillars -->
    <rect x="110" y="276" width="26" height="124" rx="10" fill="#0ea5e9" fill-opacity="0.15"/>
    <rect x="182" y="318" width="26" height="102" rx="10" fill="#0ea5e9" fill-opacity="0.15"/>
    <rect x="244" y="358" width="26" height="72" rx="10" fill="#0ea5e9" fill-opacity="0.15"/>
    <rect x="304" y="266" width="26" height="144" rx="10" fill="#0ea5e9" fill-opacity="0.15"/>
    <rect x="366" y="180" width="26" height="204" rx="10" fill="#0ea5e9" fill-opacity="0.15"/>

    <!-- Gradient Area Under Curve -->
    <path d="M 82 430 L 82 230 C 154 245, 184 368, 236 368 C 287 368, 328 205, 382 124 L 382 430 Z" fill="url(#areaGrad)"/>

    <!-- Soft Ambient Glow behind Dynamic Curve -->
    <path d="M 82 230 C 154 245, 184 368, 236 368 C 287 368, 328 205, 382 124" fill="none" stroke="#06b6d4" stroke-opacity="0.25" stroke-width="42" stroke-linecap="round"/>

    <!-- Main Dynamic Trajectory Curve -->
    <path d="M 82 230 C 154 245, 184 368, 236 368 C 287 368, 328 205, 380 128" fill="none" stroke="url(#lineGrad)" stroke-width="22" stroke-linecap="round"/>

    <!-- Arrowhead at ATH Breakout Peak -->
    <polygon points="398,96 348,124 366,140 376,166" fill="#34d399"/>

    <!-- ATH Breakout intersection node -->
    <circle cx="328" cy="230" r="14" fill="#10b981" fill-opacity="0.35"/>
    <circle cx="328" cy="230" r="7" fill="#6ee7b7"/>

    <!-- Glowing Tactical "Dip" Node (Buy Point) -->
    <circle cx="236" cy="368" r="42" fill="#06b6d4" fill-opacity="0.22"/>
    <circle cx="236" cy="368" r="24" fill="#0f172a" stroke="#06b6d4" stroke-width="7"/>
    <circle cx="236" cy="368" r="10" fill="#38bdf8"/>
  </g>

  <!-- Border Ring -->
  <rect x="16" y="16" width="480" height="480" rx="112" ry="112" fill="none" stroke="#38bdf8" stroke-opacity="0.3" stroke-width="9"/>
</svg>'''
    with open(filename, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Generated {filename}")

def draw_cairo_icon(ctx, width, height):
    ctx.save()
    ctx.scale(width, height)
    
    pad = 0.03
    r = 0.22
    x0, y0, x1, y1 = pad, pad, 1.0 - pad, 1.0 - pad
    
    # Define squircle path
    def squircle_path():
        ctx.new_sub_path()
        ctx.arc(x1 - r, y0 + r, r, -math.pi/2, 0)
        ctx.arc(x1 - r, y1 - r, r, 0, math.pi/2)
        ctx.arc(x0 + r, y1 - r, r, math.pi/2, math.pi)
        ctx.arc(x0 + r, y0 + r, r, math.pi, 3*math.pi/2)
        ctx.close_path()

    # Clip everything inside squircle
    squircle_path()
    ctx.clip()

    # Background gradient
    bg_pat = cairo.LinearGradient(0.2, 0.1, 0.8, 0.9)
    bg_pat.add_color_stop_rgb(0.0, 11/255.0, 19/255.0, 38/255.0)  # #0b1326
    bg_pat.add_color_stop_rgb(1.0, 2/255.0, 6/255.0, 23/255.0)    # #020617
    ctx.set_source(bg_pat)
    ctx.paint()
    
    # Glow inside upper-right
    glow_pat = cairo.RadialGradient(0.68, 0.32, 0.05, 0.68, 0.32, 0.55)
    glow_pat.add_color_stop_rgba(0.0, 2/255.0, 132/255.0, 199/255.0, 0.3)
    glow_pat.add_color_stop_rgba(0.6, 16/255.0, 185/255.0, 129/255.0, 0.1)
    glow_pat.add_color_stop_rgba(1.0, 0.0, 0.0, 0.0, 0.0)
    ctx.set_source(glow_pat)
    ctx.paint()

    # ATH horizontal dashed line
    ath_y = 0.45
    ctx.set_source_rgba(148/255.0, 163/255.0, 184/255.0, 0.35)
    ctx.set_line_width(0.008)
    ctx.set_dash([0.03, 0.024], 0.0)
    ctx.move_to(0.12, ath_y)
    ctx.line_to(0.88, ath_y)
    ctx.stroke()
    ctx.set_dash([], 0.0)

    # Tactical DCA Pillars
    pillars = [
        (0.22, 0.54, 0.79),
        (0.36, 0.62, 0.82),
        (0.48, 0.70, 0.84),
        (0.60, 0.52, 0.80),
        (0.72, 0.35, 0.75),
    ]
    bar_w = 0.052
    for px, py_top, py_bot in pillars:
        br = bar_w * 0.4
        ctx.new_sub_path()
        ctx.arc(px + bar_w/2 - br, py_top + br, br, -math.pi/2, 0)
        ctx.arc(px + bar_w/2 - br, py_bot - br, br, 0, math.pi/2)
        ctx.arc(px - bar_w/2 + br, py_bot - br, br, math.pi/2, math.pi)
        ctx.arc(px - bar_w/2 + br, py_top + br, br, math.pi, 3*math.pi/2)
        ctx.close_path()
        ctx.set_source_rgba(14/255.0, 165/255.0, 233/255.0, 0.15)
        ctx.fill()

    # Area fill under curve
    ctx.move_to(0.16, 0.84)
    ctx.line_to(0.16, 0.45)
    ctx.curve_to(0.30, 0.48, 0.36, 0.72, 0.46, 0.72)
    ctx.curve_to(0.56, 0.72, 0.64, 0.40, 0.74, 0.25)
    ctx.line_to(0.74, 0.84)
    ctx.close_path()

    area_pat = cairo.LinearGradient(0.46, 0.22, 0.46, 0.84)
    area_pat.add_color_stop_rgba(0.0, 16/255.0, 185/255.0, 129/255.0, 0.32)
    area_pat.add_color_stop_rgba(0.5, 6/255.0, 182/255.0, 212/255.0, 0.18)
    area_pat.add_color_stop_rgba(1.0, 2/255.0, 132/255.0, 199/255.0, 0.02)
    ctx.set_source(area_pat)
    ctx.fill()

    # Soft Ambient Glow
    ctx.move_to(0.16, 0.45)
    ctx.curve_to(0.30, 0.48, 0.36, 0.72, 0.46, 0.72)
    ctx.curve_to(0.56, 0.72, 0.64, 0.40, 0.74, 0.25)
    ctx.set_line_width(0.08)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_source_rgba(6/255.0, 182/255.0, 212/255.0, 0.22)
    ctx.stroke()

    # Dynamic Curve
    line_pat = cairo.LinearGradient(0.16, 0.60, 0.74, 0.25)
    line_pat.add_color_stop_rgb(0.0, 2/255.0, 132/255.0, 199/255.0)   # Sky
    line_pat.add_color_stop_rgb(0.48, 6/255.0, 182/255.0, 212/255.0)  # Cyan
    line_pat.add_color_stop_rgb(1.0, 16/255.0, 185/255.0, 129/255.0)  # Emerald
    
    ctx.move_to(0.16, 0.45)
    ctx.curve_to(0.30, 0.48, 0.36, 0.72, 0.46, 0.72)
    ctx.curve_to(0.56, 0.72, 0.64, 0.40, 0.74, 0.25)
    ctx.set_line_width(0.044)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_source(line_pat)
    ctx.stroke()

    # Arrowhead at peak
    angle = math.atan2(-0.25, 0.16)
    tip_x, tip_y = 0.78, 0.19
    a_len = 0.10
    a_w = 0.052
    cos_a = math.cos(angle)
    sin_a = math.sin(angle)
    
    p_tip = (tip_x, tip_y)
    p_left = (tip_x - a_len * cos_a + a_w * sin_a, tip_y - a_len * sin_a - a_w * cos_a)
    p_mid = (tip_x - a_len * 0.62 * cos_a, tip_y - a_len * 0.62 * sin_a)
    p_right = (tip_x - a_len * cos_a - a_w * sin_a, tip_y - a_len * sin_a + a_w * cos_a)
    
    ctx.move_to(p_tip[0], p_tip[1])
    ctx.line_to(p_left[0], p_left[1])
    ctx.line_to(p_mid[0], p_mid[1])
    ctx.line_to(p_right[0], p_right[1])
    ctx.close_path()
    ctx.set_source_rgb(52/255.0, 211/255.0, 153/255.0)
    ctx.fill()

    # Glowing Tactical "Dip" Node
    node_x, node_y = 0.46, 0.72
    ctx.arc(node_x, node_y, 0.082, 0, 2*math.pi)
    ctx.set_source_rgba(6/255.0, 182/255.0, 212/255.0, 0.25)
    ctx.fill()
    ctx.arc(node_x, node_y, 0.048, 0, 2*math.pi)
    ctx.set_source_rgb(15/255.0, 23/255.0, 42/255.0)
    ctx.fill_preserve()
    ctx.set_line_width(0.015)
    ctx.set_source_rgb(6/255.0, 182/255.0, 212/255.0)
    ctx.stroke()
    ctx.arc(node_x, node_y, 0.02, 0, 2*math.pi)
    ctx.set_source_rgb(56/255.0, 189/255.0, 248/255.0)
    ctx.fill()

    # ATH Breakout Node
    ctx.arc(0.64, 0.45, 0.028, 0, 2*math.pi)
    ctx.set_source_rgba(16/255.0, 185/255.0, 129/255.0, 0.38)
    ctx.fill()
    ctx.arc(0.64, 0.45, 0.015, 0, 2*math.pi)
    ctx.set_source_rgb(110/255.0, 231/255.0, 183/255.0)
    ctx.fill()

    # Reset clip to draw crisp outer squircle border
    ctx.reset_clip()
    squircle_path()
    ctx.set_line_width(0.018)
    ctx.set_source_rgba(56/255.0, 189/255.0, 248/255.0, 0.3)
    ctx.stroke()

    ctx.restore()

# 1. Generate SVG
generate_svg("public/favicon.svg")

# 2. Render master 512x512 PNG
surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, 512, 512)
ctx = cairo.Context(surface)
draw_cairo_icon(ctx, 512, 512)
master_png_path = "public/icons/icon-512x512.png"
surface.write_to_png(master_png_path)
print("Saved 512x512 PNG.")

# 3. Generate all PWA icon sizes and multi-res favicon.ico using PIL Lanczos downsampling
master_img = Image.open(master_png_path)

sizes = [72, 96, 128, 144, 152, 192, 384]
for s in sizes:
    resized = master_img.resize((s, s), Image.Resampling.LANCZOS)
    resized.save(f"public/icons/icon-{s}x{s}.png")
    print(f"Saved icon-{s}x{s}.png")

# Apple Touch Icon (180x180)
apple_icon = master_img.resize((180, 180), Image.Resampling.LANCZOS)
apple_icon.save("public/apple-touch-icon.png")
print("Saved apple-touch-icon.png")

# Multi-resolution favicon.ico (16x16, 32x32, 48x48)
master_img.save("public/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
print("Saved multi-resolution favicon.ico")
