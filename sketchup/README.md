# AHW Kitchen & Dressing — SketchUp Extension

Parametric kitchen, bathroom vanity and dressing / wardrobe units for SketchUp.
Every unit stays editable: its full parameter set is stored on the group, so
changing a dimension, a door style or an accessory rebuilds it in place.

**AHW Architects Master** · version 1.1.0 · SketchUp 2017+ (HtmlDialog required)

إضافة SketchUp بارامترية لوحدات المطابخ ووحدات الحمامات وغرف الملابس. كل وحدة
تظل قابلة للتعديل لأن بياناتها محفوظة داخل الجروب نفسه، فأي تغيير في المقاس أو
شكل الضلفة أو الإكسسوار يعيد بناء الوحدة في مكانها.

---

## 1. Installation | التركيب

```bash
bash sketchup/scripts/build_rbz.sh      # produces sketchup/dist/ahw_kitchen_dressing-1.1.0.rbz
```

In SketchUp: **Window → Extension Manager → Install Extension** and pick the
`.rbz`. Then enable the toolbar from **View → Toolbars → AHW Kitchen & Dressing**.

To develop without packaging, copy or symlink `sketchup/src/ahw_kd.rb` and
`sketchup/src/ahw_kd/` into your SketchUp `Plugins` folder.

---

## 2. Quick start | البداية السريعة

1. **Extensions → AHW Kitchen & Dressing → Unit Designer** opens the parameter
   dialog with a live front elevation.
2. Pick a family (kitchen / bathroom / dressing) and a unit type; the standard
   envelope loads automatically. One click on a **design style** chip sets the
   whole look — door profile, handle, edge detail, plinth and palette.
3. **Place** puts the unit under the cursor — left/right arrows rotate 90°,
   up/down rotate 15°, the tool keeps placing until Escape so a whole run goes
   in with successive clicks.
4. Select any placed unit and the dialog loads its parameters; edits apply live.
5. **Reports** exports the cut list, hardware schedule and BOQ as CSV.

---

## 3. Unit types | أنواع الوحدات

| Family | Types |
|---|---|
| Kitchen | base, base_sink, base_hob, base_corner, base_appliance, drawer_bank, tall, wall, wall_lift, wall_open, island, hood |
| Bathroom | vanity, vanity_wall, vanity_open, mirror_unit, tallboy |
| Dressing | wardrobe, wardrobe_sliding, dressing_open, corner_wardrobe, shoe_unit, drawer_bank, island_dresser |

### Height convention

`h` is the **carcass body only**. The plinth sits below it and the worktop above,
so a standard base unit reads:

```
150 (plinth) + 720 (carcass) + 30 (worktop) = 900 mm finished worktop height
```

This is the 32 mm frameless standard used across GCC / MENA fit-out.

### Local axes

```
origin = back bottom left of the carcass
+X  left  -> right          width
+Y  wall  -> into the room   carcass 0..d, fronts d..d+front_t
+Z  floor -> up              plinth, carcass, worktop
```

Dropping a unit on a wall line therefore needs no offset.

---

## 4. Fronts | الضلف

The front of a unit is a **stack of rows, bottom to top**. A row with height `0`
shares whatever height is left, so a four-drawer bank with three fixed drawers
resizes correctly when the carcass height changes.

| Row kind | Notes |
|---|---|
| `door` / `doors2` | 1..8 leaves, hinge left / right, alternating for multi-leaf |
| `drawer` | front + optional box, runner system, internal insert |
| `lift` | Aventos HF (bi-fold), HS (up & over), HK (stay), HL (parallel) |
| `flap` | bottom hinged, used for shoe units |
| `sliding` | 2..6 leaves on a track, each on its own plane |
| `bifold` | folding pair |
| `louvre` | slatted leaf |
| `open` | no front (open shelving / niche) |
| `appliance` | appliance envelope + optional integrated front |

**Door styles:** slab, shaker, routed, profiled, glass_frame, glass_full, louvre,
ribbed (fluted), handleless_j, gola.

**Overlay:** full overlay, half overlay, inset — the reveal maths follows
automatically.

### Handles

25 shapes, every one drawn parametrically and available in any finish:

| Group | Shapes |
|---|---|
| Bars | round bar, square bar, T-bar, D / bow handle, tubular, continuous long profile |
| Knobs | round, square, knurled, ceramic, cut crystal |
| Classic | cup pull (real C section), shell pull, ring pull, drop pull |
| Handleless | edge pull, finger-pull channel, J-profile, gola, push-to-open |
| Recessed | round recess, rectangular recess |
| Material-led | leather strap, solid timber dowel, tapered mid-century pull |

**Finishes** (20, all changeable per unit): brushed and polished brass, gold PVD,
rose gold, copper, antique bronze, gunmetal, matt black, brushed stainless,
polished chrome, satin nickel, anodised aluminium, matt white, ivory, white
ceramic, cut crystal, solid oak, solid walnut, tan and black leather.

Position (top / bottom / left / right / centre), length, projection, diameter
and edge offset are parametric on every shape; the hinge type is selectable and
carries through to the hardware schedule.

**Glass:** clear, bronze, grey, smoked, frosted, reeded / fluted, mirror,
back-painted (Lacobel), with aluminium, timber or frameless surrounds.

### Design styles | أنماط التصميم

Eight one-click looks. Each sets door profile, handle shape and finish, worktop
edge, plinth type and the full material palette together — the decisions a
designer makes as a set, not one at a time. **Sizes and the front layout are
never touched**, so a style can be tried on a finished unit.

| Style | Reads as |
|---|---|
| Modern | slab lacquer, brushed steel bar, square 30 mm quartz |
| Ultra modern | handleless J with push-to-open, Fenix, mitred 80 mm apron, floating base with LED shadow gap |
| Contemporary | fluted / ribbed veneer, continuous black profile handle, mitred 60 mm |
| Classic | shaker with 90 mm rail, ivory lacquer, polished brass cup pulls, bullnose Carrara |
| Neo classic | routed fronts, ivory with gold patina, gold PVD drop pulls, Emperador |
| Minimal | slab PET, finger-pull channel, 12 mm compact laminate, floating base |
| Industrial | HPL concrete, gunmetal T-bar, stainless top, adjustable legs |
| Scandinavian | light oak, solid oak dowel handle, 40 mm butcher oak top |

---

## 5. Bases | القواعد

Five base types, including the suspended details used across current work:

| Mode | Behaviour |
|---|---|
| `panel` | clip-on plinth panel, optional side returns |
| `legs` | adjustable legs with a clip-on panel |
| `floating` | **integrated suspended base** — a smaller box recessed on every side so the carcass floats, with an adjustable shadow gap and an optional LED wash |
| `wall_hung` | fully suspended: nothing touches the floor, concealed mounting rail at the back and optional under-unit LED |
| `none` | no base at all |

---

## 6. Interior | التقسيمات الداخلية

Shelves and vertical dividers are generated per bay. On top of those, 33
accessories can be placed anywhere by height, offset, width, count and angle:

**Kitchen** — cutlery tray · plate rack · spice rack · bottle pull-out ·
pull-out larder · magic corner · carousel · waste bins · wire baskets

**Dressing** — hanging rail · double rail · pull-down rail · trouser rack ·
tie rack · belt rack · valet rod · sloped shoe shelves (adjustable angle) ·
jewellery insert · watch box · pull-out table · laundry basket · safe box

**Bathroom** — U-drawer cut around the basin trap · towel rail · tissue niche ·
hair-dryer holder with socket box · vanity drawer

**Any unit** — shelf · glass shelf · divider · open niche · LED strip ·
mirror panel

---

## 7. Worktop, sink and hob | الرخامة والحوض والبوتاجاز

The worktop is extruded from a real edge section, so it reads correctly in
section as well as in 3D:

- **Edge profiles:** square, bevel, bullnose, mitred apron (adjustable apron
  height — the usual 60–100 mm quartz detail).
- **Overhangs:** front, back, left, right — the island breakfast overhang is just
  a back overhang.
- **Waterfall** ends on either side, **upstand** with its own height and thickness.
- **Sink:** undermount, top mount, integrated, vessel; 1–3 bowls, drainer board,
  bowl depth, offsets, and a tap with adjustable height.
- **Hob:** gas (1–6 burners, sized burner rings), induction, ceramic, domino,
  with the body below the worktop so clashes with the cabinet show up.

Both sink and hob cut a real hole through the slab.

---

## 8. Corners | الأركان

| Mode | Behaviour |
|---|---|
| `blind` | straight carcass, fixed blind panel over the dead width, magic corner inside |
| `diagonal` | true 45° corner carcass with a door on the diagonal face |
| `l` | two carcasses meeting at the angle — how an L wardrobe is actually made |

---

## 9. Appliances and external blocks | الأجهزة والبلوكات الخارجية

Every appliance is drawn as a placeholder carrying the correct cut-out envelope
(oven, double oven, microwave, coffee machine, warming drawer, dishwasher,
slim dishwasher, washing machine, dryer, washer-dryer, fridge, tall fridge,
freezer, wine cooler, kettle, toaster, coffee machine, blender, TV).

To use your own blocks: **Presets tab → Appliance components → Browse** and point
each appliance at a `.skp` file. The path is remembered across sessions and used
for every unit from then on. A single row can also override the block with its
own path.

---

## 10. Materials | الخامات

84 materials, every one selectable per role (carcass, fronts, back, shelves,
worktop, drawer box, plinth, hardware, glass).

**Panels** — plywood 12/15/18, marine plywood, MDF, moisture-resistant MDF, HDF,
MFC (white / oak / walnut / anthracite), **polywood / PVC board 16 & 18**, WPC,
blockboard, solid beech, solid oak.

**Finishes** — matt and gloss lacquer (white, black, greige, sage, navy, ivory,
cream, taupe, burgundy, olive, custom RAL), acrylic, HPL, veneer (oak, walnut,
ash, teak), PET, Fenix, ivory with gold patina.

**Tops** — quartz, granite, marble, Corian, porcelain slab, stainless, compact
laminate, solid oak.

**Metals and hardware** — 20 finishes from brushed steel to gold PVD, rose gold,
copper, antique bronze and leather (see §4).

Each material carries an indicative supply-and-fix rate per m², which is what
drives the BOQ. Edit the rates in `src/ahw_kd/core/materials.rb` to match your
own supply chain.

---

## 11. Reports | التقارير

With nothing selected the whole model is reported; with a selection, only those
units.

- **Cut list CSV** — unit, part, material, length × width × thickness, quantity,
  grain direction, edge banding per edge, area m², note.
- **Hardware schedule CSV** — hinges, runners, lift mechanisms, sliding tracks,
  handles, rails, corner mechanisms, lighting, legs, taps, sinks, hobs.
- **BOQ CSV** — area by material with rate and amount, plus a per-unit table with
  overall W × H × D, panel m², front m² and cost.

---

## 12. Presets | المكتبة

33 factory presets ship with the plugin, including one per design style and a
suspended LED vanity. Save your own from the Presets tab; the library is plain JSON in
`src/ahw_kd/data/presets/` and can be exported and imported so a studio standard
travels with the project.

Regenerate the factory set with:

```bash
ruby sketchup/scripts/build_presets.rb
```

---

## 13. Presentation | العرض

- **Open / Close doors & drawers** — swings doors, slides drawers and lifts the
  Aventos leaves through their real kinematics.
- **Exploded view** — pulls fronts, interior, worktop and plinth apart by a set
  distance for assembly drawings.
- Both are non-destructive: they are parameters, so the unit rebuilds back.

---

## 14. Development | التطوير

```bash
ruby sketchup/test/run_tests.rb     # 100 behavioural checks
ruby sketchup/scripts/audit.rb      # structural audit
```

The checks run against a small stand-in for the SketchUp API
(`test/stub_sketchup.rb`): dimension maths, every unit type, door style, front
kind, handle shape in both orientations, design style on every family,
accessory, appliance, corner mode, plinth mode and worktop edge profile, all
shipped presets, the three reports, and a set of degenerate inputs. They do not
replace testing inside SketchUp, but they catch the failures that actually
happen while developing.

The audit answers what a review would ask: is every parameter editable from the
dialog, is every catalogue reachable, does every material key resolve, and is
anything declared but unused. It exits non-zero on any finding.

```
src/ahw_kd.rb              extension registration
src/ahw_kd/main.rb         requires, commands, menu and toolbar
src/ahw_kd/core/           const, util, log, styles, params, materials, geom,
                           layout, store
src/ahw_kd/builders/       carcass, panel, drawer, fronts, interior, worktop,
                           appliance, special (diagonal corner + hood), unit
src/ahw_kd/export/         cut list / hardware / BOQ, preset catalog
src/ahw_kd/ui/             HtmlDialog bridge, placement tool, observers, HTML UI
```

---

## 15. Known limits | حدود النسخة الحالية

- Bullnose and bevel edges are drawn as real section profiles; more elaborate
  moulded profiles (ogee, dupont) are not in the library yet.
- Gola / J-profile and the finger-pull channel are drawn on the leaf; the
  carcass-side gola channel is not generated.
- Corner radius applies to one-piece leaves (slab, ribbed, handleless); framed
  and shaker fronts stay square.
- The dialog's elevation preview is a 2D read of the same rules the builder uses,
  not a render of the built geometry.
- Solid Tools are not used anywhere, so the plugin works in SketchUp Make as well
  as Pro.
