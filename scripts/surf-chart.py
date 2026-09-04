#!/usr/bin/env python3
"""
Surf Intel v2 — 7-day outlook chart generator.

Input:  JSON on stdin: { "days": [{"date", "minFt", "maxFt", "periodS", "windKt"}] }
Output: /tmp/surf-outlook.png  (1200×500, dark navy bg)

Dependencies: matplotlib (pip install matplotlib --break-system-packages)
"""

import sys, json, subprocess, os
from datetime import datetime

# Ensure matplotlib is available
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
    import numpy as np
except ImportError:
    subprocess.run(
        [sys.executable, '-m', 'pip', 'install', 'matplotlib', '--break-system-packages', '-q'],
        check=True
    )
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
    import numpy as np

data = json.load(sys.stdin)
days = data.get('days', [])
if not days:
    print("No data", file=sys.stderr)
    sys.exit(1)

# ── styling ──────────────────────────────────────────────────────────────────
BG      = '#0A2540'   # navy
BLUE    = '#1a6cf5'   # wave band
GOLD    = '#f5a623'   # period
WHITE   = '#ffffff'
LGRAY   = '#3a5070'   # grid

plt.rcParams.update({
    'figure.facecolor': BG,
    'axes.facecolor':   BG,
    'text.color':       WHITE,
    'axes.labelcolor':  WHITE,
    'xtick.color':      WHITE,
    'ytick.color':      WHITE,
    'axes.edgecolor':   LGRAY,
    'grid.color':       LGRAY,
    'grid.alpha':       0.25,
    'font.family':      'sans-serif',
    'font.size':        11,
})

labels  = [d['date'] for d in days]
min_ft  = [d.get('minFt', 0) for d in days]
max_ft  = [d.get('maxFt', 0) for d in days]
periods = [d.get('periodS', 8) for d in days]
winds   = [d.get('windKt', 12) for d in days]
x = np.arange(len(days))

fig, ax1 = plt.subplots(figsize=(12, 5))
fig.patch.set_facecolor(BG)

# Filled swell band
ax1.fill_between(x, min_ft, max_ft, color=BLUE, alpha=0.35, linewidth=0)
ax1.plot(x, max_ft, color=BLUE, linewidth=2.5, label='Surf (ft)')
ax1.plot(x, min_ft, color=BLUE, linewidth=1.2, linestyle='--', alpha=0.6)

ax1.set_ylabel('Surf Height (ft)', color=BLUE, fontsize=12)
ax1.tick_params(axis='y', labelcolor=BLUE)
ax1.set_ylim(0, max(max(max_ft) * 1.3, 4))
ax1.set_xticks(x)
ax1.set_xticklabels(labels, fontsize=12)
ax1.grid(True, axis='y', linestyle=':', alpha=0.25)

# Period line (right axis)
ax2 = ax1.twinx()
ax2.plot(x, periods, color=GOLD, linewidth=2, marker='o', markersize=5, label='Period (s)')
ax2.set_ylabel('Period (s)', color=GOLD, fontsize=12)
ax2.tick_params(axis='y', labelcolor=GOLD)
ax2.set_ylim(0, max(max(periods) * 1.4, 16))
ax2.spines['right'].set_color(GOLD)

# Wind dashed line (on ax1 scale, but marked separately)
ax3 = ax1.twinx()
ax3.spines['right'].set_position(('outward', 60))
ax3.plot(x, winds, color=WHITE, linewidth=1.5, linestyle='--', alpha=0.6, label='Wind (kt)')
ax3.set_ylabel('Wind (kt)', color=WHITE, fontsize=11, alpha=0.7)
ax3.tick_params(axis='y', labelcolor='#aaaaaa')
ax3.set_ylim(0, max(max(winds) * 1.5, 25))
ax3.spines['right'].set_color(LGRAY)

# Peak marker
peak_idx = max_ft.index(max(max_ft))
ax1.annotate(
    f'↑ {max_ft[peak_idx]}ft',
    xy=(peak_idx, max_ft[peak_idx]),
    xytext=(peak_idx, max_ft[peak_idx] + max(max_ft) * 0.12),
    ha='center', color=WHITE, fontsize=11, fontweight='bold',
    arrowprops=dict(arrowstyle='->', color=WHITE, lw=1.2)
)

# Title + legend
today = datetime.now().strftime('%b %d, %Y')
ax1.set_title(f'BARBADOS · 7-DAY SURF OUTLOOK · {today}', fontsize=14, fontweight='bold',
              color=WHITE, pad=14)

patches = [
    mpatches.Patch(color=BLUE, label='Surf height (ft)'),
    mpatches.Patch(color=GOLD, label='Swell period (s)'),
    mpatches.Patch(color=WHITE, alpha=0.6, label='Wind (kt)'),
]
ax1.legend(handles=patches, loc='upper left', framealpha=0.15,
           labelcolor=WHITE, facecolor=BG, edgecolor=LGRAY, fontsize=10)

plt.tight_layout(pad=1.5)
out = '/tmp/surf-outlook.png'
plt.savefig(out, dpi=150, bbox_inches='tight', facecolor=BG)
plt.close()
print(f"Chart saved: {out}", file=sys.stderr)
