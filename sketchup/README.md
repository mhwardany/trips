# AHW Kitchen & Dressing — SketchUp Extension

Parametric kitchen, bathroom vanity and dressing / wardrobe units for SketchUp.
Every unit stays editable: its full parameter set is stored on the group, so
changing a dimension, a door style or an accessory rebuilds it in place.

**AHW Architects Master** · version 1.0.0 · SketchUp 2017+ (HtmlDialog required)

إضافة SketchUp بارامترية لوحدات المطابخ ووحدات الحمامات وغرف الملابس. كل وحدة
تظل قابلة للتعديل لأن بياناتها محفوظة داخل الجروب نفسه، فأي تغيير في المقاس أو
شكل الضلفة أو الإكسسوار يعيد بناء الوحدة في مكانها.

---

## 1. Installation | التركيب

```bash
bash sketchup/scripts/build_rbz.sh      # produces sketchup/dist/ahw_kitchen_dressing-1.0.0.rbz
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
   envelope loads automatically.
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

**Handles:** bar, knob, edge pull, J-profile, gola, push-to-open, recessed round,
leather strap; position, length, projection and diameter are all parametric.

**Glass:** clear, bronze, grey, smoked, frosted, reeded / fluted, mirror,
back-painted (Lacobel), with aluminium, timber or frameless surrounds.

---

## 5. Interior | التقسيمات الداخلية

Shelves and vertical dividers are generated per bay. On top of those, any number
of accessories can be placed by height, offset and width:

hanging rail · double rail · pull-down rail · trouser rack · tie rack ·
shoe shelf (sloped, adjustable angle) · wire basket · laundry basket ·
cutlery tray · plate rack · pull-out larder · magic corner · carousel ·
waste bin · jewellery drawer · glass shelf · LED strip · mirror panel ·
open niche · safe box · vanity drawer

---

## 6. Worktop, sink and hob | الرخامة والحوض والبوتاجاز

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

## 7. Corners | الأركان

| Mode | Behaviour |
|---|---|
| `blind` | straight carcass, fixed blind panel over the dead width, magic corner inside |
| `diagonal` | true 45° corner carcass with a door on the diagonal face |
| `l` | two carcasses meeting at the angle — how an L wardrobe is actually made |

---

## 8. Appliances and external blocks | الأجهزة والبلوكات الخارجية

Every appliance is drawn as a placeholder carrying the correct cut-out envelope
(oven, double oven, microwave, coffee machine, warming drawer, dishwasher,
slim dishwasher, washing machine, dryer, washer-dryer, fridge, tall fridge,
freezer, wine cooler, kettle, toaster, coffee machine, blender, TV).

To use your own blocks: **Presets tab → Appliance components → Browse** and point
each appliance at a `.skp` file. The path is remembered across sessions and used
for every unit from then on. A single row can also override the block with its
own path.

---

## 9. Materials | الخامات

Panels: plywood 12/15/18, marine plywood, MDF, moisture-resistant MDF, HDF,
MFC (white / oak / walnut / anthracite), **polywood / PVC board 16 & 18**, WPC,
blockboard, solid beech, solid oak.

Finishes: matt and gloss lacquer, acrylic, HPL, veneer, PET, Fenix.

Tops: quartz, granite, marble, Corian, porcelain slab, stainless, compact
laminate, solid oak.

Each material carries an indicative supply-and-fix rate per m², which is what
drives the BOQ. Edit the rates in `src/ahw_kd/core/materials.rb` to match your
own supply chain.

---

## 10. Reports | التقارير

With nothing selected the whole model is reported; with a selection, only those
units.

- **Cut list CSV** — unit, part, material, length × width × thickness, quantity,
  grain direction, edge banding per edge, area m², note.
- **Hardware schedule CSV** — hinges, runners, lift mechanisms, sliding tracks,
  handles, rails, corner mechanisms, lighting, legs, taps, sinks, hobs.
- **BOQ CSV** — area by material with rate and amount, plus a per-unit table with
  overall W × H × D, panel m², front m² and cost.

---

## 11. Presets | المكتبة

23 factory presets ship with the plugin (base units, sink and hob bases, drawer
banks, both corner types, larder and appliance towers, wall and lift-up units,
island, hood, vanities, mirror cabinet, hinged and sliding wardrobes, open
dressing, shoe unit, dressing island, L corner wardrobe).

Save your own from the Presets tab; the library is plain JSON in
`src/ahw_kd/data/presets/` and can be exported and imported so a studio standard
travels with the project.

Regenerate the factory set with:

```bash
ruby sketchup/scripts/build_presets.rb
```

---

## 12. Presentation | العرض

- **Open / Close doors & drawers** — swings doors, slides drawers and lifts the
  Aventos leaves through their real kinematics.
- **Exploded view** — pulls fronts, interior, worktop and plinth apart by a set
  distance for assembly drawings.
- Both are non-destructive: they are parameters, so the unit rebuilds back.

---

## 13. Development | التطوير

```bash
ruby sketchup/test/run_tests.rb
```

80 headless checks run against a small stand-in for the SketchUp API
(`test/stub_sketchup.rb`): dimension maths, every unit type, every door style,
every front kind, every accessory, every appliance, every corner and plinth mode,
every worktop edge profile, all shipped presets, and the three reports. They do
not replace testing inside SketchUp, but they catch the failures that actually
happen while developing.

```
src/ahw_kd.rb              extension registration
src/ahw_kd/main.rb         requires, commands, menu and toolbar
src/ahw_kd/core/           const, util, log, params, materials, geom, layout, store
src/ahw_kd/builders/       carcass, panel, drawer, fronts, interior, worktop,
                           appliance, special (diagonal corner + hood), unit
src/ahw_kd/export/         cut list / hardware / BOQ, preset catalog
src/ahw_kd/ui/             HtmlDialog bridge, placement tool, observers, HTML UI
```

---

## 14. Known limits | حدود النسخة الحالية

- Bullnose and bevel edges are drawn as real section profiles; more elaborate
  moulded profiles (ogee, dupont) are not in the library yet.
- Gola / J-profile is drawn on the leaf; the carcass-side gola channel is not
  generated.
- The dialog's elevation preview is a 2D read of the same rules the builder uses,
  not a render of the built geometry.
- Solid Tools are not used anywhere, so the plugin works in SketchUp Make as well
  as Pro.
