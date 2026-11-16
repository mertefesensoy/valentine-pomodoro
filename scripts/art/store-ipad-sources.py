"""
store-ipad-sources.py: the sources of the iPad 13" App Store set for 1.5, the couple's close-ups
(docs/implementations/2026-11-15-ipad-store-set.md §9).

    python -P scripts/art/store-ipad-sources.py            write art/src/store-ipad/*.svg and art/jobs/store-ipad.json
    python -P scripts/art/store-ipad-sources.py --check    regenerate in memory and compare; exit 1 on any difference

Contract
  in : scripts/art/store-sources.py, loaded as a module for its helpers only (Baloo 2 shaped by HarfBuzz, Inter as
       live text, the shipped art and tour kit, the sticker lift, the v1.4 Screen pieces); the tokens and strings it
       reads (src/theme/palette.json, src/i18n/en.json, tr.json); the pairing sheet's plane (src/screens/pair/planeArt.ts);
       the constants below.
  out: one SVG strip per language: five 2064 x 2752 panels with the store's gutter, each a caption and one window of
       the iPad's portrait screen (1032 x 1376 pt) cut as a die-cut page, with Pomo & Doro whole on its top edge; and
       the job art/jobs/store-ipad.json, which scripts/art/build.mjs builds into art/out/store-ipad/. Nothing else is
       written: the v1.4 sources, job and outputs are never touched.
  how: every screen is drawn in the app's points from the components named in the record (§9.2), with each size,
       padding and gap from the code. Before writing, the self-checks (§9.5) must pass: every mascot whole in its panel,
       clear of the captions and of the key content; no text, row or card cut by a window's edge.
  needs: uharfbuzz 0.57 and fontTools 4.61, as store-sources.py. Run with -P.
"""
import importlib.util
import json
import math
import os
import re
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
CHECK = '--check' in sys.argv
_spec = importlib.util.spec_from_file_location('store_sources', os.path.join(ROOT, 'scripts', 'art', 'store-sources.py'))
S = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(S)
f, LIGHT, DARK, TONES, tr_ = S.f, S.LIGHT, S.DARK, S.TONES, S.tr_

# ---------------------------------------------------------------------------------------------
# The drafts the owner reviews (record §9.3): the names, the code, the note, the captions.

PARTNER, ME = 'Mert', 'Ekin'  # the owner renamed the partner on 2026-11-16 (was Deniz)
CODE = 'K7MP4Q'  # six characters from the pairing alphabet (no I, L or O)
NOTE = {'en': "So proud of you. Dinner's on me.", 'tr': 'Seninle gurur duyuyorum. Akşam yemeği benden.'}
CAPTIONS = {
    'en': [
        ('Two pages,|one diary', 'You on one, your partner on the other'),
        ('Pair with|your partner', 'Send your code, or type theirs'),
        ('A sticker for|every focus', "And your partner's day, right beside yours"),
        ('See your|partner\'s day', 'Then write them a note'),
        ('Notes for|each other', 'Theirs appears after your next focus'),
    ],
    'tr': [
        ('İki sayfa,|tek günlük', 'Biri senin, biri partnerinin'),
        ('Partnerinle|eşleş', 'Kodunu gönder ya da onunkini yaz'),
        ('Her odağa|bir çıkartma', 'Partnerinin günü de hemen yanında'),
        ('Partnerinin|gününü gör', 'Sonra ona bir not yaz'),
        ('Birbirinize|notlar', 'Onunki, bir sonraki|odaklanmanın ardından görünür'),
    ],
}
TODAY_DATE = {'en': 'Sunday, November 1', 'tr': '1 Kasım Pazar'}  # toLocaleDateString, weekday long, day, month long
HOURS = [(8, 30), (10, 45), (13, 20), (18, 5), (22, 40)]

# ---------------------------------------------------------------------------------------------
# The app's measures (src/theme/layout.ts) and what the record assumes about iPad sheets (§9.4).

XS, SM, MD, LG, XL = 4, 8, 12, 16, 24
EDGE = 1.5
SHEET_W = 540           # UIKit's default form-sheet width (assumed)
PAIR_SHEET_H = 620      # the pairing sheet's full-height detent as a default form sheet (assumed)
SHEET_R = 38            # as the v1.4 set (assumed)
DIM = 0.2               # the dim behind a form sheet (assumed)
BALOO_LINE = 1.602      # Baloo 2's hhea: (1078 + 524) / 1000
BALOO_ASC = 1.078
SF_LINE = 1.19          # the system face's natural line height, per em


def plane():
    """The pairing sheet's plane, route and hearts, from the app's own generated module."""
    text = S.read('src/screens/pair/planeArt.ts')
    board = re.search(r'PLANE_ARTBOARD = \{ w: (\d+), h: (\d+) \}', text)
    paths = dict(re.findall(r'(\w+): "([^"]+)"', text))
    return (int(board.group(1)), int(board.group(2))), paths


# ---------------------------------------------------------------------------------------------
# What a screen draws, recorded for the self-checks: every text's box and every block's box, in screen points.

class Recorder:
    def __init__(self):
        self.texts, self.blocks, self.covers = [], [], []

    def text(self, text, x, y, size, width, anchor, kind):
        x0 = x - {'start': 0, 'middle': width / 2, 'end': width}[anchor]
        asc, desc = (0.8, 0.3) if kind == 'baloo' else (0.78, 0.24)
        self.texts.append((text, x0, y - size * asc, x0 + width, y + size * desc))


REC = None
_inter, _baloo = S.inter, S.baloo


def _rec_inter(text, x, y, size, fill, weight=400, anchor='start', runs=None):
    if REC is not None:
        full = ''.join(r[0] for r in runs) if runs else text
        REC.text(full, x, y, size, S.inter_width(full, size, weight if weight in S.INTER_W else 600), anchor, 'inter')
    return _inter(text, x, y, size, fill, weight, anchor, runs)


def _rec_baloo(text, x, y, size, fill, anchor='start', weight='SemiBold', lang='en', tnum=False):
    if REC is not None:
        REC.text(text, x, y, size, S.shape(text, size, weight, lang, tnum)[1], anchor, 'baloo')
    return _baloo(text, x, y, size, fill, anchor, weight, lang, tnum)


S.inter, S.baloo = _rec_inter, _rec_baloo  # the Screen pieces call them through the module, so they're recorded too


# ---------------------------------------------------------------------------------------------
# The 1.5 screens, in the app's points, on the iPad's portrait screen.

class Pad(S.Screen):
    """The iPad's screen. A subclass for another device sets DEVICE and BOTTOM_INSET and overrides sheet_frame and
    sheet_width (store-iphone-sources.py); the iPad's values are the record's (§9.4)."""
    DEVICE = 'ipad'
    BOTTOM_INSET = 20  # the window's bottom safe area, under a sheet's pinned actions

    def __init__(self, t, lang, hour):
        super().__init__(self.DEVICE, t, lang, hour)

    def sheet_width(self):
        return SHEET_W

    def sheet_frame(self, h, full):
        """Where a sheet with `h` of content sits: (x, y, width, height). On iPad every form sheet is centred, and the
        full-height one (pairing) is a default form sheet, PAIR_SHEET_H tall."""
        return (self.W - SHEET_W) / 2, (self.H - h) / 2, SHEET_W, h

    def finish(self):
        """Anything the system draws over the app's sheets; nothing on iPad."""

    def note_lines(self, width):
        """The love note's lines at 20 pt in `width` points."""
        return S.wrap_inter(NOTE[self.lang], 20, 400, width)

    def block(self, x0, y0, x1, y1):
        REC.blocks.append((x0, y0, x1, y1))

    # -- the 1.4 pieces, with their boxes recorded ------------------------------------------------
    def today_row(self, cy, done, owed, landing=False, goal=False):
        lw = S.inter_width(self.s('today.label'), 13, 600)
        total = lw + 8 + (done + owed) * 34 + (26 if goal else 0)
        self.block((self.W - total) / 2, cy - 17, (self.W + total) / 2, cy + 17)
        super().today_row(cy, done, owed, landing, goal)

    def controls_idle(self, start_key, b):
        self.block(self.x0, b - 196, self.x0 + self.pad, b)
        super().controls_idle(start_key, b)

    # -- the Timer around the Ring -----------------------------------------------------------------
    def ring_timer(self, phase, n, timer, colour, done, owed, start_key, landing=False, goal=False):
        """The Ring's column (TimerScreen.tsx): the phase line, the Ring centred in its slot, then the partner slot,
        today's row and the controls at the foot. Returns the partner slot's top."""
        self.frame()
        self.top_row(phase, n)
        b, partner_y, cy, size = self.ring_layout()
        self.ring(self.W / 2, cy, size, 0, colour, timer)
        self.today_row(b - 231, done, owed, landing=landing, goal=goal)
        self.controls_idle(start_key, b)
        self.tab_bar(0)
        self.home_indicator()
        return partner_y

    def strip_box(self, y):
        t = self.t
        self.block(self.x0, y, self.x0 + self.pad, y + 72)
        self.add(f'<rect x="{f(self.x0 + 0.75)}" y="{f(y + 0.75)}" width="{f(self.pad - 1.5)}" height="70.5" rx="22" fill="{t["paper"]}" stroke="{t["edge"]}" stroke-width="1.5"/>')

    def day_parts(self, sessions, minutes):
        shown = min(sessions, 3)
        more = self.s('today.more', count=sessions - 3) if sessions > 3 else None
        chip_w = S.inter_width(more, 12, 600) + 2 * XS if more else 0
        group = shown * 22 + (shown - 1) * 2 + ((2 + chip_w) if more else 0)
        text = self.s('partner.minToday_other', n=minutes)
        return shown, more, chip_w, group, text, group + SM + S.inter_width(text, 14, 400)

    def day_wraps(self, sessions, minutes, avail):
        """Whether PartnerDay's row (flexWrap) breaks into the stickers over the line in `avail` points."""
        return self.day_parts(sessions, minutes)[-1] > avail

    def partner_day(self, x, cy, sessions, minutes, centered=False, avail=None):
        """PartnerDay: up to three stickers (22 pt, 2 apart), '+n' past three, then 'n min today', 8 apart. Centred in
        `avail` points too narrow for one row, it wraps: the stickers, then the line under them, 8 apart."""
        t = self.t
        shown, more, chip_w, group, text, total = self.day_parts(sessions, minutes)
        if avail is not None and total > avail:
            top = cy - (22 + SM + 19) / 2
            gx = x - group / 2
            for i in range(shown):
                self.add(self.pose_sticker('doro' if i % 2 else 'pomo', 'celebrating', gx + i * 24 + 11, top + 11, 22))
            if more:
                self.add(f'<rect x="{f(gx + shown * 24)}" y="{f(top + 2.5)}" width="{f(chip_w)}" height="17" rx="8" fill="{t["primarySoft"]}"/>')
                self.add(S.inter(more, gx + shown * 24 + chip_w / 2, top + 15.3, 12, t['primaryInk'], 600, 'middle'))
            self.add(S.inter(text, x, top + 22 + SM + 14, 14, t['inkSoft'], 400, 'middle'))
            return
        x0 = x - total / 2 if centered else x
        for i in range(shown):
            self.add(self.pose_sticker('doro' if i % 2 else 'pomo', 'celebrating', x0 + i * 24 + 11, cy, 22))
        if more:
            cx = x0 + shown * 24
            self.add(f'<rect x="{f(cx)}" y="{f(cy - 8.5)}" width="{f(chip_w)}" height="17" rx="8" fill="{t["primarySoft"]}"/>')
            self.add(S.inter(more, cx + chip_w / 2, cy + 4.3, 12, t['primaryInk'], 600, 'middle'))
        self.add(S.inter(text, x0 + group + SM, cy + 5, 14, t['inkSoft'], 400))

    def strip_paired(self, y, sessions, minutes):
        """PartnerStrip.tsx: Doro (44, idle), the partner's name (17, semibold) over their day, 12 apart, padded 12/16."""
        t = self.t
        self.strip_box(y)
        self.add(self.pose_sticker('doro', 'idle', self.x0 + LG + 22, y + 36, 44))
        tx = self.x0 + LG + 44 + MD
        top = y + 36 - (17 * SF_LINE + 2 + 22) / 2
        self.add(S.inter(PARTNER, tx, top + 16, 17, t['ink'], 600))
        self.partner_day(tx, top + 17 * SF_LINE + 2 + 11, sessions, minutes)

    def strip_solo_pair(self, y):
        """The solo, idle strip of 1.5 (TimerScreen.tsx, showPair): the pair, 'Pomo & Doro are ready' and the Pair line."""
        t = self.t
        self.strip_box(y)
        self.add(self.pose_sticker('pomo', 'idle', self.x0 + LG + 20, y + 36, 40))
        self.add(self.pose_sticker('doro', 'idle', self.x0 + LG + 52, y + 36, 40))
        tx = self.x0 + LG + 72 + MD
        top = y + 36 - (19 + 2 + 20) / 2
        self.add(S.inter(self.s('partner.readyShort'), tx, top + 14, 14, t['ink'], 500))
        self.add(S.inter(self.s('partner.pair'), tx, top + 21 + 15, 15, t['primaryInk'], 600))

    # -- panel 1: Facing pages, paired -------------------------------------------------------------
    def spread_paired(self, phase, n, timer, done, owed, goal, partner_sessions, partner_minutes, start_key):
        """SpreadPages.tsx, paired, in the Timer's column: the pages as tall as their rows (heads, the spine's frame,
        the feet), centred with today's row between the phase line and the controls (the face isn't in the ring slot)."""
        t = self.t
        self.frame()
        self.top_row(phase, n)
        b = self.bottom - LG
        page_w = (self.pad - SM) / 2
        sticker = round(min(page_w * 0.34, 64))
        timer_line = 56 * BALOO_LINE
        frame_h = EDGE + MD + timer_line + XS + SM + 6 + LG + EDGE
        heads_h = SM + 13 * SF_LINE + SM + sticker
        frame_row_h = SM + XS + frame_h + XS
        day_h = 22 + SM + 19 if self.day_wraps(partner_sessions, partner_minutes, page_w - 2 * MD) else 22
        foot_h = SM + max(44, day_h) + LG  # the paired foot is at least 44 tall, its day centred in it
        spread_h = heads_h + frame_row_h + foot_h
        centre_top, centre_bottom = self.top + SM + 44 + LG, (b - 196) - LG
        top = centre_top + (centre_bottom - centre_top - (spread_h + LG + 34)) / 2
        left, right = self.x0, self.x0 + page_w + SM
        self.block(left - 4, top - 4, self.x0 + self.pad + 4, top + spread_h + 4)
        for x, rot, hinge, side in ((left, -1, left + page_w, 'l'), (right, 1, right, 'r')):
            self.add(f'<g transform="rotate({rot} {f(hinge)} {f(top + spread_h)})"><path d="{S.page_path(x, top, page_w, spread_h, side)}" fill="{t["paper"]}" stroke="{t["edge"]}" stroke-width="1.5"/></g>')
        for x, label, who in ((left, self.s('spread.you'), 'pomo'), (right, PARTNER, 'doro')):
            cx = x + page_w / 2
            self.add(S.inter(label, cx, top + SM + 12.5, 13, t['inkSoft'], 600, 'middle'))
            self.add(self.pose_sticker(who, 'idle', cx, top + SM + 13 * SF_LINE + SM + sticker / 2, sticker))
        halo_w = self.pad * 0.66 + 2 * XS
        hx, hy = self.W / 2 - halo_w / 2, top + heads_h + SM
        self.add(f'<rect x="{f(hx)}" y="{f(hy)}" width="{f(halo_w)}" height="{f(frame_h + 2 * XS)}" rx="26" fill="{t["page"]}"/>')
        fx, fy, fw = hx + XS, hy + XS, halo_w - 2 * XS
        self.add(f'<rect x="{f(fx + 0.75)}" y="{f(fy + 0.75)}" width="{f(fw - 1.5)}" height="{f(frame_h - 1.5)}" rx="22" fill="{t["page"]}" stroke="{t["edge"]}" stroke-width="1.5"/>')
        self.add(S.baloo(timer, self.W / 2, fy + EDGE + MD + 56 * BALOO_ASC + (timer_line - 56 * (BALOO_ASC + 0.524)) / 2, 56, t['ink'], 'middle', lang=self.lang, tnum=True))
        bar_y = fy + EDGE + MD + timer_line + XS + SM
        self.add(f'<rect x="{f(fx + EDGE + LG)}" y="{f(bar_y)}" width="{f(fw - 2 * EDGE - 2 * LG)}" height="6" rx="3" fill="{t["ringTrack"]}"/>')
        foot_y = top + heads_h + frame_row_h
        self.partner_day(right + page_w / 2, foot_y + SM + max(44, day_h) / 2, partner_sessions, partner_minutes, centered=True, avail=page_w - 2 * MD)
        self.today_row(top + spread_h + LG + 17, done, owed, goal=goal)
        self.controls_idle(start_key, b)
        self.tab_bar(0)
        self.home_indicator()

    # -- sheets ------------------------------------------------------------------------------------
    def sheet(self, h, fill, full=False):
        """A form sheet with `h` of content over a dim, where sheet_frame puts it (record §9.4). Returns its top-left
        corner; self.sw and self.sh are its width and height. A sheet that reaches the screen's foot runs its corners
        past it."""
        sx, sy, sw, sh = self.sheet_frame(h, full)
        self.sw, self.sh = sw, sh
        drawn_h = sh + SHEET_R if sy + sh >= self.H else sh
        self.add(f'<rect width="{self.W}" height="{self.H}" fill="#000000" opacity="{DIM}"/>')
        self.add(f'<rect x="{f(sx)}" y="{f(sy)}" width="{f(sw)}" height="{f(drawn_h)}" rx="{SHEET_R}" fill="{fill}"/>')
        # What was drawn before it and lies inside it is hidden by it; what's drawn after is on it.
        REC.covers.append(((sx, sy, sx + sw, sy + sh), len(REC.texts), len(REC.blocks)))
        # A full-height sheet's content ends above the window's bottom safe area; a window may crop that empty foot.
        self.block(sx, sy, sx + sw, sy + sh - (self.BOTTOM_INSET if full else 0))
        return sx, sy

    def sheet_head(self, sx, sy, title):
        """PairScreen's and PartnerScreen's head: the title centred in 44 pt, the 36-pt close button at the right."""
        t = self.t
        self.add(S.inter(title, sx + self.sw / 2, sy + MD + 22 + 6, 17, t['ink'], 600, 'middle'))
        cx, cy = sx + self.sw - LG - 18, sy + MD + 4 + 18
        self.add(f'<circle cx="{f(cx)}" cy="{f(cy)}" r="18" fill="{t["field"]}"/>')
        self.add(S.glyph('close', cx, cy, 20, t['inkSoft']))

    def code_cells(self, cx, top, value):
        """CodeCells.tsx: two rows of three 40 x 48 cells, 6 apart; a filled cell is page-coloured with the edge, an
        empty one dashed in edgeStrong."""
        t = self.t
        for i in range(6):
            x = cx - (3 * 40 + 2 * 6) / 2 + (i % 3) * 46
            y = top + (i // 3) * 54
            ch = value[i] if i < len(value) else ''
            if ch:
                self.add(f'<rect x="{f(x + 0.75)}" y="{f(y + 0.75)}" width="38.5" height="46.5" rx="8" fill="{t["page"]}" stroke="{t["edge"]}" stroke-width="1.5"/>')
                self.add(S.inter(ch, x + 20, y + 24 + 8, 22, t['ink'], 600, 'middle'))
            else:
                self.add(f'<rect x="{f(x + 0.75)}" y="{f(y + 0.75)}" width="38.5" height="46.5" rx="8" fill="none" stroke="{t["edgeStrong"]}" stroke-width="1.5" stroke-dasharray="4.2 4.2"/>')

    def pair_sheet(self):
        """PairScreen.tsx at its code step: the head, the two pages (Spread.tsx, 230 tall, leaning 1° to the spine) with
        your code and the partner's empty cells, the plane scene in the height left, and the pinned actions."""
        t = self.t
        sx, sy = self.sheet(PAIR_SHEET_H, t['page'], full=True)
        sw, sh = self.sw, self.sh
        self.sheet_head(sx, sy, self.s('pair.title'))
        bx, by, pw, ph = sx + LG, sy + MD + 44 + MD, (sw - 2 * LG - SM) / 2, 230
        pages = (
            (bx, -1, bx + pw, 'l', ME, CODE, self.s('pair.lasts')),
            (bx + pw + SM, 1, bx + pw + SM, 'r', self.s('pair.partner'), '', self.s('pair.tapToType')),
        )
        for x, rot, hinge, side, who, code, mini in pages:
            self.add(f'<g transform="rotate({rot} {f(hinge)} {f(by + ph)})">')
            self.add(f'<path d="{S.page_path(x, by, pw, ph, side)}" fill="{t["paper"]}" stroke="{t["edge"]}" stroke-width="1.5"/>')
            cx = x + pw / 2
            self.add(S.inter(who, cx, by + MD + 12.5, 13, t['inkSoft'], 600, 'middle'))
            self.code_cells(cx, by + MD + 13 * SF_LINE + SM, code)
            self.add(S.inter(mini, cx, by + MD + 13 * SF_LINE + SM + 102 + SM + 13.5, 13, t['inkSoft'], 400, 'middle'))
            self.add('</g>')
        pinned = SM + 56 + SM + 44 + self.BOTTOM_INSET  # padding, the pill, the gap, the link, the window's bottom inset
        slot_top = by + ph + MD
        slot_h = sh - pinned - (slot_top - sy) - XL
        (aw, ah), art_paths = plane()
        k = min((sw - 2 * LG) / aw, slot_h / ah, 1.3)
        ax, ay = sx + LG + (sw - 2 * LG - aw * k) / 2, slot_top + slot_h - ah * k
        stroke = f'stroke="{t["edgeStrong"]}" stroke-width="{f(EDGE / k)}" stroke-linejoin="round"'
        self.add(f'<g transform="translate({f(ax)} {f(ay)}) scale({f(k)})">'
                 f'<path d="{art_paths["route"]}" fill="{t["edgeStrong"]}"/><path d="{art_paths["heartBig"]}" fill="{t["accent"]}"/>'
                 f'<path d="{art_paths["heartSmall"]}" fill="{t["primary"]}"/><path d="{art_paths["planeLow"]}" fill="{t["primarySoft"]}" {stroke}/>'
                 f'<path d="{art_paths["planeTop"]}" fill="{t["paper"]}" {stroke}/></g>')
        for who, (mx, my) in (('pomo', (62, 226)), ('doro', (299, 226))):
            self.add(self.pose_sticker(who, 'idle', ax + mx * k, ay + my * k, 88 * k))
        py = sy + sh - pinned + SM
        self.pill(self.s('pair.send'), py, w=sw - 2 * LG, cx=sx + sw / 2)
        self.add(S.inter(self.s('pair.newCode'), sx + sw / 2, py + 56 + SM + 22 + 6, 16, t['primaryInk'], 600, 'middle'))

    def partner_sheet(self, sessions, minutes, goal, updated_min):
        """PartnerScreen.tsx sized to its content: the head, PartnerCard.tsx (the date, a row of 40-pt cells, the line),
        when it was updated, and the list group with 'Write … a note' and its footer."""
        t = self.t
        card_h = EDGE + MD + 13 * SF_LINE + SM + 40 + SM + 20 + MD + EDGE
        list_h = EDGE + 44 + EDGE
        footer = S.wrap_inter(self.s('partner.noteFooter'), 13, 400, self.sheet_width() - 4 * LG)
        h = MD + 44 + MD + card_h + MD + 18 + MD + list_h + SM + 18 * len(footer) + LG
        sx, sy = self.sheet(h, t['page'])
        self.sheet_head(sx, sy, PARTNER)
        x, w, y = sx + LG, self.sw - 2 * LG, sy + MD + 44 + MD
        self.add(f'<rect x="{f(x + 0.75)}" y="{f(y + 0.75)}" width="{f(w - 1.5)}" height="{f(card_h - 1.5)}" rx="22" fill="{t["paper"]}" stroke="{t["edge"]}" stroke-width="1.5"/>')
        ix, iy = x + EDGE + LG, y + EDGE + MD
        self.add(S.inter(TODAY_DATE[self.lang], ix, iy + 12.5, 13, t['inkSoft'], 600))
        ry = iy + 13 * SF_LINE + SM
        owed = math.ceil((goal - minutes) / (minutes / sessions)) if goal > minutes else 0
        for i in range(sessions + owed):
            cx = ix + i * 48 + 20
            if i < sessions:
                self.add(self.pose_sticker('doro' if i % 2 else 'pomo', 'celebrating', cx, ry + 20, 40))
            else:
                self.add(self.dashed(cx, ry + 20, 18.25))
        line = ' · '.join([self.s('stats.sessions_other', count=sessions), self.s('stats.minutesShort_other', n=minutes), self.s('partner.goal', n=goal)])
        self.add(S.inter(line, ix, ry + 40 + SM + 15, 15, t['ink'], 500))
        uy = y + card_h + MD
        self.add(S.inter(self.s('partner.updatedMinutes_other', count=updated_min), x, uy + 13.5, 13, t['inkSoft'], 400))
        ly = uy + 18 + MD
        self.add(f'<rect x="{f(x + 0.75)}" y="{f(ly + 0.75)}" width="{f(w - 1.5)}" height="{f(list_h - 1.5)}" rx="14" fill="{t["paper"]}" stroke="{t["edge"]}" stroke-width="1.5"/>')
        self.add(S.inter(self.s('partner.write', name=PARTNER), x + EDGE + LG, ly + list_h / 2 + 6, 17, t['primaryInk'], 400))
        for j, line in enumerate(footer):
            self.add(S.inter(line, x + LG, ly + list_h + SM + 13.5 + j * 18, 13, t['inkSoft'], 400))

    def note_sheet(self):
        """LoveNoteSheet.tsx sized to its content, the partner's note: Pomo (44, no lift) beside 'A note from …' in
        Baloo 2 at 22, the note at 20/28, and Close (at least 160 x 44, page-coloured with the edge), 24 around, 16 apart."""
        t = self.t
        lines = self.note_lines(self.sheet_width() - 2 * XL)
        h = XL + 44 + LG + 28 * len(lines) + LG + 44 + XL
        sx, sy = self.sheet(h, t['paper'])
        self.add(S.sticker(S.pose('pomo', 'celebrating'), sx + XL + 22, sy + XL + 22, 44))
        self.add(S.baloo(self.s('loveNote.from', name=PARTNER), sx + XL + 44 + MD, sy + XL + 22 + 6.1, 22, t['ink'], lang=self.lang))
        ny = sy + XL + 44 + LG
        for i, line in enumerate(lines):
            self.add(S.inter(line, sx + XL, ny + i * 28 + 21, 20, t['ink'], 400))
        cy = ny + 28 * len(lines) + LG
        label = self.s('loveNote.close')
        cw = max(160, S.inter_width(label, 17, 600) + 2 * XL)
        self.add(f'<rect x="{f(sx + self.sw / 2 - cw / 2 + 0.75)}" y="{f(cy + 0.75)}" width="{f(cw - 1.5)}" height="42.5" rx="21.25" fill="{t["page"]}" stroke="{t["edge"]}" stroke-width="1.5"/>')
        self.add(S.inter(label, sx + self.sw / 2, cy + 22 + 6, 17, t['ink'], 600, 'middle'))

    # -- the five screens ----------------------------------------------------------------------------
    def p1(self):
        self.spread_paired('focus', 1, '25:00', 0, S.GOAL_SESSIONS, False, 1, 25, 'startFocus')

    def p2(self):
        y = self.ring_timer('focus', 2, '25:00', self.t['ringFocus'], 1, 3, 'startFocus')
        self.strip_solo_pair(y)
        self.pair_sheet()

    def p3(self):
        y = self.ring_timer('shortBreak', 3, '05:00', self.t['ringBreak'], 3, 1, 'startBreak', landing=True)
        self.strip_paired(y, 2, 50)

    def p4(self):
        y = self.ring_timer('focus', 4, '25:00', self.t['ringFocus'], 3, 1, 'startFocus')
        self.strip_paired(y, 3, 75)
        self.partner_sheet(3, 75, S.GOAL_MIN, 12)

    def p5(self):
        # Facing pages at night: the note covers the spine's frame whole, so no timer shows half covered, and the pages'
        # heads (you, your partner) show above it and today's full row below it.
        self.spread_paired('longBreak', 4, '15:00', 4, 0, True, 4, 100, 'startBreak')
        self.note_sheet()


def screen(panel, lang, cls=Pad):
    """Panel `panel`'s screen on the device `cls` draws, and what it recorded."""
    global REC
    REC = Recorder()
    sc = cls(DARK if panel == 4 else LIGHT, lang, HOURS[panel])
    getattr(sc, f'p{panel + 1}')()
    sc.finish()
    rec, REC = REC, None
    return ''.join(sc.out), rec


# ---------------------------------------------------------------------------------------------
# The strip: the day's grounds, the five pages, the captions and the cast.

PW, PH, G, N = 2064, 2752, 92, 5
SW = N * PW + (N - 1) * G
CARD_TOP, CARD_FOOT, CARD_MAX_W, CUT = 960, 56, 1904, 18
CAP = (156, 62, 1860, 250)  # headline px, subline px, box width, first baseline
# Each panel's window of the screen (pt, record §9.2).
# Panel 4's starts 89 pt above the sheet, so the Ring shows as its top arc behind the sheet rather than as two slivers
# in a thin band; panel 5's is panel 1's, the spread with the note over its spine.
WINDOWS = [(236, 440, 560, 390), (236, 372, 560, 631), (236, 388, 560, 752), (236, 440, 560, 430), (236, 440, 560, 390)]
# Who sits on each page's top edge: (look, who, side, size). Looks: a pose, ('wave', hand) or ('look', eyes).
CAST = [
    [(('wave', 'wave-left'), 'pomo', -1, 400), (('wave', 'wave-right'), 'doro', 1, 390)],
    [(('look', 'look-right'), 'pomo', -1, 400), (('look', 'look-left'), 'doro', 1, 400)],
    [(('celebrating',), 'pomo', -1, 400), (('celebrating',), 'doro', 1, 400)],
    [(('break',), 'pomo', -1, 360), (('break',), 'doro', 1, 350)],
    [(('sleepy',), 'pomo', -1, 360), (('sleepy',), 'doro', 1, 360)],
]


class Layout:
    """One set's composition: the panel and its gutter, the page box below the captions, the captions' sizes, each
    panel's window and cast, and the screen class that draws the device. IPAD is the approved iPad set's; the iPhone's
    is in store-iphone-sources.py."""

    def __init__(self, title, panel, gutter, card_top, card_foot, card_max_w, cap, windows, cast, screen_cls, corners=None):
        self.title, (self.PW, self.PH), self.G = title, panel, gutter
        self.SW = N * self.PW + (N - 1) * self.G
        self.CARD_TOP, self.CARD_FOOT, self.CARD_MAX_W = card_top, card_foot, card_max_w
        self.CAP, self.WINDOWS, self.CAST, self.screen_cls = cap, windows, cast, screen_cls
        # Each page's corner radius in screen points: 22 (radius.l), unless a window is exactly a sheet's own rectangle.
        self.CORNERS = corners or [22] * N


IPAD = Layout('App Store screenshots, iPad 13", {lang}: two pages, one diary (1.5)', (PW, PH), G,
              CARD_TOP, CARD_FOOT, CARD_MAX_W, CAP, WINDOWS, CAST, Pad)


def scale_of(rect, lay=IPAD):
    return min(lay.CARD_MAX_W / rect[2], (lay.PH - lay.CARD_TOP - lay.CARD_FOOT) / rect[3])


def window_of(i, lay, lang):
    """Panel i's window: one for every language, or a {lang: window} where a sheet's height differs by language."""
    w = lay.WINDOWS[i]
    return w[lang] if isinstance(w, dict) else w


def card_box(i, lay=IPAD, lang='en'):
    """The window's rectangle in the strip (px), and its scale: as wide as it can be, its top at CARD_TOP, or centred
    in the room below the captions when it's shorter than that room."""
    rect = window_of(i, lay, lang)
    s = scale_of(rect, lay)
    w, h = rect[2] * s, rect[3] * s
    room = lay.PH - lay.CARD_TOP - lay.CARD_FOOT
    y = lay.CARD_TOP + max(0, (room - h) / 2)
    return i * (lay.PW + lay.G) + (lay.PW - w) / 2, y, w, h, s


def look_paths(look, who):
    if look[0] == 'wave':
        return S.tour(who, 'smile', 'grin', look[1], raise_hand=24)
    if look[0] == 'look':
        return S.tour(who, look[1], 'smile')
    if look[0] == 'break':
        return S.MUG_CUT + S.pose(who, 'break')
    if look[0] == 'sleepy':
        return S.night_marks(S.pose(who, 'sleepy'), DARK['inkSoft'])
    return S.pose(who, look[0])


def art_box(paths):
    """The art's extent in its 512 artboard."""
    xs, ys = [], []
    for d, *_ in paths:
        nums = [float(n) for n in S.NUM_RE.findall(d)]
        xs += nums[0::2]
        ys += nums[1::2]
    return min(xs), min(ys), max(xs), max(ys)


def caption_boxes(i, lang, cx, lay=IPAD):
    head, sub, max_w, base = lay.CAP
    h_text, s_text = CAPTIONS[lang][i]
    out = []
    lines = [l for part in h_text.split('|') for l in S.wrap_baloo(part, head, max_w, lang=lang)]
    for j, line in enumerate(lines):
        out.append((line, base + j * head * 1.04, head, 'SemiBold'))
    y = base + (len(lines) - 1) * head * 1.04 + sub * 1.75
    for j, line in enumerate(l for part in s_text.split('|') for l in S.wrap_baloo(part, sub, max_w * 0.96, 'Medium', lang)):
        out.append((line, y + j * sub * 1.3, sub, 'Medium'))
    boxes = []
    for line, y, size, weight in out:
        w = S.baloo_width(line, size, weight, lang)
        boxes.append((line, y, size, weight, (cx - w / 2, y - size * 0.82, cx + w / 2, y + size * 0.3)))
    return boxes


def overlaps(a, b, pad=0):
    return a[0] < b[2] + pad and b[0] < a[2] + pad and a[1] < b[3] + pad and b[1] < a[3] + pad


def inside(a, b):
    return a[0] >= b[0] and a[1] >= b[1] and a[2] <= b[2] and a[3] <= b[3]


def strip_svg(lang, problems, lay=IPAD):
    PW, PH, G, SW, WINDOWS, CAST = lay.PW, lay.PH, lay.G, lay.SW, lay.WINDOWS, lay.CAST
    margin = (PW - lay.CAP[2]) / 2  # the caption box's side margin
    ids = S.Ids('w')
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{SW}" height="{PH}" viewBox="0 0 {SW} {PH}">',
           f'<title>{lay.title.format(lang=lang)}</title>']
    k = PW / 1320
    out.append(f'<rect x="-40" y="-40" width="{SW + 80}" height="{PH + 80}" fill="{TONES[0]}"/>')
    for i in range(1, N):  # the day's grounds, each tone entering on the strip's sweeping cut (store-sources.py)
        sx = i * (PW + G) - G / 2
        a, b, c = (150, -140, 110) if i % 2 else (-120, 160, -90)
        top, mid, bot = sx + a * k, sx + b * k, sx + c * k
        out.append(f'<path d="M{f(top)} -40 C{f(top)} {f(PH * 0.22)} {f(mid)} {f(PH * 0.3)} {f(mid)} {f(PH * 0.5)} '
                   f'C{f(mid)} {f(PH * 0.7)} {f(bot)} {f(PH * 0.78)} {f(bot)} {f(PH + 40)} H{SW + 40} V-40 Z" fill="{TONES[i]}"/>')
    for i in range(N):
        x0 = i * (PW + G)
        night = i >= 3
        t = DARK if night else LIGHT
        content, rec = screen(i, lang, lay.screen_cls)
        rect = window_of(i, lay, lang)
        cx_, cy_, w, h, s = card_box(i, lay, lang)
        win = (rect[0], rect[1], rect[0] + rect[2], rect[1] + rect[3])

        # Self-check: nothing visible is cut by the window's edge (wholly in, wholly out, or under a sheet).
        drawn = [(tx[0], tx[1:], ('t', n)) for n, tx in enumerate(rec.texts)] + [('a block', b_, ('b', n)) for n, b_ in enumerate(rec.blocks)]
        for name, box, (kind, n) in drawn:
            # What shows of it is the part inside the window, unless a sheet drawn after it hides that part.
            seen = (max(box[0], win[0]), max(box[1], win[1]), min(box[2], win[2]), min(box[3], win[3]))
            covered = any(inside(seen, c_) and n < (nt if kind == 't' else nb) for c_, nt, nb in rec.covers)
            if overlaps(box, win) and not inside(box, win) and not covered:
                problems.append(f'{lang} panel {i + 1}: "{name}" is cut by the window ({", ".join(f(v) for v in box)})')

        # The page: the die-cut edge and the lift, then the window.
        colour, alpha = S.split_alpha(t['stickerShadow'])
        layer = 1 - (1 - alpha) ** (1 / 3)
        r = lay.CORNERS[i] * s
        out.append('<g transform="translate(7 14)">')
        for reach in (0, 1, 2):
            stroke = f' stroke="{colour}" stroke-width="{f(reach * 14)}" stroke-linejoin="round"' if reach else ''
            out.append(f'<rect x="{f(cx_ - CUT)}" y="{f(cy_ - CUT)}" width="{f(w + 2 * CUT)}" height="{f(h + 2 * CUT)}" rx="{f(r + CUT)}" fill="{colour}" opacity="{f(layer)}"{stroke}/>')
        out.append('</g>')
        out.append(f'<rect x="{f(cx_ - CUT)}" y="{f(cy_ - CUT)}" width="{f(w + 2 * CUT)}" height="{f(h + 2 * CUT)}" rx="{f(r + CUT)}" fill="{t["stickerEdge"]}"/>')
        clip = ids()
        out.append(f'<clipPath id="{clip}"><rect x="{f(cx_)}" y="{f(cy_)}" width="{f(w)}" height="{f(h)}" rx="{f(r)}"/></clipPath>')
        out.append(f'<g clip-path="url(#{clip})"><g transform="translate({f(cx_ - rect[0] * s)} {f(cy_ - rect[1] * s)}) scale({f(s)})">{content}</g></g>')

        # The captions.
        centre = x0 + PW / 2
        ink = t['ink']
        soft = DARK['inkSoft'] if night else (LIGHT['ink'] if i == 2 else LIGHT['inkSoft'])
        caps = caption_boxes(i, lang, centre, lay)
        for line, y, size, weight, box in caps:
            out.append(_baloo(line, centre, y, size, ink if weight == 'SemiBold' else soft, 'middle', weight, lang))
            if box[0] < x0 + margin or box[2] > x0 + PW - margin:
                problems.append(f'{lang} panel {i + 1}: caption line "{line}" runs past its box')

        # Pomo & Doro, whole, on the page's top edge, in front of it.
        for look, who, side, size in CAST[i]:
            paths = look_paths(look, who)
            ax0, ay0, ax1, ay1 = art_box(paths)
            u = size / 512
            foot = cy_ - CUT + size * 0.03  # sunk 3 % of its size into the page's cut edge, as the strip stands them
            top = foot - ay1 * u
            inset = r * 0.8  # clear of the page's rounded corner, so the feet are on its straight top edge
            if side < 0:
                mcx = cx_ + inset - ax0 * u + 256 * u
            else:
                mcx = cx_ + w - inset - ax1 * u + 256 * u
            box = (mcx - 256 * u + ax0 * u, top + ay0 * u, mcx - 256 * u + ax1 * u, top + ay1 * u + 12 * u)
            out.append(S.sticker(paths, mcx, top + size / 2, size, t['stickerShadow'], edge=DARK['stickerEdge'] if night else None))
            if box[0] < x0 + 24 or box[2] > x0 + PW - 24 or box[1] < 24:
                problems.append(f'{lang} panel {i + 1}: {who} is not whole inside the panel')
            for line, _, _, _, cbox in caps:
                if overlaps(box, cbox, 16):
                    problems.append(f'{lang} panel {i + 1}: {who} touches the caption "{line}"')
            # Key content: whatever of the mascot lies over the window, mapped back to the screen's points.
            if overlaps(box, (cx_, cy_, cx_ + w, cy_ + h)):
                bx = (max(box[0], cx_), max(box[1], cy_), min(box[2], cx_ + w), min(box[3], cy_ + h))
                pt = ((bx[0] - cx_) / s + rect[0], (bx[1] - cy_) / s + rect[1], (bx[2] - cx_) / s + rect[0], (bx[3] - cy_) / s + rect[1])
                for name, tb, (kind, n) in drawn:
                    seen = (max(tb[0], win[0]), max(tb[1], win[1]), min(tb[2], win[2]), min(tb[3], win[3]))
                    hidden = any(inside(seen, c_) and n < (nt if kind == 't' else nb) for c_, nt, nb in rec.covers)
                    # A sheet's own box is a container: its texts and rows are checked, not its paper.
                    sheet = kind == 'b' and any(tb[:2] == c_[:2] for c_, _, _ in rec.covers)
                    if overlaps(pt, tb) and not hidden and not sheet:  # what a sheet hides isn't content the mascot can cover
                        problems.append(f'{lang} panel {i + 1}: {who} covers "{name}"')
    out.append('</svg>')
    return ''.join(out) + '\n'


# ---------------------------------------------------------------------------------------------
# The job

def job():
    assets = []
    for lang in ('en', 'tr'):
        crops = [{'name': f'{i + 1:02d}-{PW}x{PH}', 'rect': [i * (PW + G), 0, PW, PH], 'px': PW} for i in range(N)]
        assets.append({'id': f'store-ipad15-{lang}', 'src': f'art/src/store-ipad/store-ipad15-{lang}.svg', 'kind': 'store-ipad',
                       'png': [round(SW / 5)], 'crops': crops})
    return {
        'about': "1.5's iPad 13\" App Store screenshots, the couple's close-ups (docs/implementations/2026-11-15-ipad-store-set.md "
                 '§9): one strip per language, five panels side by side with the store\'s gutter, written by '
                 'scripts/art/store-ipad-sources.py. Each panel is a crop at 2064 x 2752; the whole strip also exports at a fifth of its width.',
        'assets': assets,
    }


def files(problems):
    out = {f'art/src/store-ipad/store-ipad15-{lang}.svg': strip_svg(lang, problems) for lang in ('en', 'tr')}
    out['art/jobs/store-ipad.json'] = json.dumps(job(), indent=1, ensure_ascii=False) + '\n'
    return out


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    problems = []
    written = files(problems)
    if problems:
        for p in problems:
            print(f'✖ {p}')
        print(f'✖ {len(problems)} self-check failure(s); nothing written')
        sys.exit(1)
    print('✔ self-checks: every mascot whole, in front and clear of the captions and key content; nothing cut by a window')
    differences = 0
    for rel, text in written.items():
        path = os.path.join(ROOT, rel)
        if CHECK:
            if not (os.path.exists(path) and open(path, encoding='utf-8', newline='').read() == text):
                differences += 1
                print(f'✖ {rel} is not what the generator writes')
        else:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, 'w', encoding='utf-8', newline='') as fh:
                fh.write(text)
            print(f'✔ wrote {rel}')
    if CHECK:
        print(f'✖ {differences} file(s) differ' if differences else '✔ every iPad store source matches the generator')
        sys.exit(1 if differences else 0)


if __name__ == '__main__':
    main()
