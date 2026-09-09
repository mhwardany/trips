/* AHW Kitchen & Dressing — dialog controller.
   The Ruby side owns the model; this file only edits a params object and
   posts it back. Bilingual EN / AR with full RTL. */
'use strict';

var AHWKD = (function () {

  /* ----------------------------------------------------------- state */
  var S = {
    params: null,
    lists: {},
    lang: 'en',
    editing: false,
    auto: true,
    tab: 'unit',
    boq: null,
    timer: null
  };

  var TABS = ['unit', 'carcass', 'fronts', 'interior', 'top', 'materials', 'presets', 'reports'];

  /* ------------------------------------------------------------ i18n */
  var DICT = {
    unit: ['Unit', 'الوحدة'], carcass: ['Carcass', 'الهيكل'], fronts: ['Fronts', 'الضلف'],
    interior: ['Interior', 'التقسيم الداخلي'], top: ['Top', 'الرخامة'],
    materials: ['Materials', 'الخامات'], presets: ['Presets', 'المكتبة'], reports: ['Reports', 'التقارير'],
    family: ['Family', 'المجموعة'], type: ['Unit type', 'نوع الوحدة'], name: ['Name / code', 'الاسم / الكود'],
    code: ['Drawing code', 'كود الرسم'], room: ['Room', 'الغرفة'], qty: ['Quantity', 'العدد'],
    note: ['Note', 'ملاحظة'],
    w: ['Width mm', 'العرض مم'], h: ['Carcass height mm', 'ارتفاع الهيكل مم'], d: ['Depth mm', 'العمق مم'],
    reset_size: ['Reset to standard size', 'إرجاع المقاس القياسي'],
    open_doors: ['Doors open °', 'فتح الضلف °'], open_drawers: ['Drawers open %', 'فتح الأدراج %'],
    open_lifts: ['Lift / flap open °', 'فتح المكابس °'], explode: ['Exploded view mm', 'تفكيك العرض مم'],
    panel_t: ['Panel mm', 'سمك اللوح مم'], front_t: ['Front mm', 'سمك الضلفة مم'],
    back_t: ['Back mm', 'سمك الظهر مم'], shelf_t: ['Shelf mm', 'سمك الرف مم'],
    back_mode: ['Back fixing', 'تركيب الظهر'], back_inset: ['Back inset mm', 'غاطس الظهر مم'],
    top_mode: ['Top', 'السقف'], rail_w: ['Rail width mm', 'عرض الشنايش مم'],
    bottom_mode: ['Bottom', 'القاعدة'],
    plinth_mode: ['Plinth', 'القاعدة السفلية'], plinth_h: ['Plinth height mm', 'ارتفاع القاعدة مم'],
    plinth_setback: ['Setback mm', 'غاطس القاعدة مم'], plinth_returns: ['Plinth returns', 'جوانب القاعدة'],
    leg_dia: ['Leg diameter mm', 'قطر الرجل مم'], shadow: ['Shadow gap mm', 'فتحة الظل مم'],
    corner: ['Corner', 'الركن'], corner_mode: ['Corner type', 'نوع الركن'],
    corner_side: ['Blind / return side', 'جهة الركن'], blind_w: ['Blind width mm', 'العرض المخفي مم'],
    return_w: ['Return length mm', 'طول الرجوع مم'], return_d: ['Return depth mm', 'عمق الرجوع مم'],
    front_b: ['Fronts on return', 'ضلف على الرجوع'],
    hood_style: ['Hood style', 'نوع الشفاط'],
    front_mode: ['Overlay', 'نظام الضلفة'], gap: ['Gap mm', 'الخلوص مم'],
    reveal_top: ['Top reveal mm', 'فراغ علوي مم'], style: ['Door style', 'شكل الضلفة'],
    show_hinges: ['Draw hinges', 'رسم المفصلات'],
    shaker_rail: ['Shaker rail mm', 'عرض البرواز مم'], shaker_panel_t: ['Inner panel mm', 'سمك الحشوة مم'],
    shaker_inset: ['Panel inset mm', 'غاطس الحشوة مم'],
    rib_pitch: ['Rib pitch mm', 'مسافة الضلع مم'], rib_depth: ['Rib depth mm', 'بروز الضلع مم'],
    glass_type: ['Glass', 'الزجاج'], glass_frame: ['Frame', 'البرواز'],
    frame_w: ['Frame width mm', 'عرض البرواز مم'], frame_t: ['Frame depth mm', 'سمك البرواز مم'],
    glass_t: ['Glass mm', 'سمك الزجاج مم'],
    handle: ['Handle', 'الكالون'], handle_pos: ['Position', 'الموضع'],
    handle_len: ['Length mm', 'الطول مم'], handle_proj: ['Projection mm', 'البروز مم'],
    handle_dia: ['Diameter mm', 'القطر مم'], handle_offset: ['Offset mm', 'المسافة من الحافة مم'],
    rows: ['Front layout (bottom to top)', 'تقسيم الواجهة (من أسفل لأعلى)'],
    add_row: ['Add row', 'إضافة صف'], row_h: ['Height mm (0 = fill)', 'الارتفاع مم (0 = يملأ)'],
    cols: ['Leaves', 'عدد الضلف'], hinge: ['Hinge', 'المفصلة'], lift: ['Lift system', 'نظام المكبس'],
    panels: ['Sliding leaves', 'عدد الضلف الجرار'], appl: ['Appliance', 'الجهاز'],
    integrated: ['Integrated front', 'ضلفة مدمجة'], box: ['Drawer box', 'صندوق الدرج'],
    runner: ['Runner', 'المجرى'], insert: ['Insert', 'الفاصل الداخلي'],
    shelves: ['Shelves', 'عدد الأرفف'], shelf_mode: ['Shelf fixing', 'تثبيت الرف'],
    shelf_setback: ['Shelf setback mm', 'غاطس الرف مم'], dividers: ['Vertical dividers', 'فواصل رأسية'],
    accessories: ['Accessories', 'الإكسسوارات'], add_acc: ['Add accessory', 'إضافة إكسسوار'],
    acc_z: ['Height from inside floor mm', 'الارتفاع من القاع مم'],
    acc_x: ['From inside left mm', 'المسافة من اليسار مم'],
    acc_w: ['Width mm (0 = full)', 'العرض مم (0 = كامل)'], acc_count: ['Count', 'العدد'],
    acc_angle: ['Angle °', 'الزاوية °'], acc_depth: ['Depth mm', 'العمق مم'],
    counter_on: ['Worktop', 'الرخامة'], counter_t: ['Thickness mm', 'السماكة مم'],
    front_oh: ['Front overhang mm', 'بروز أمامي مم'], back_oh: ['Back overhang mm', 'بروز خلفي مم'],
    oh_l: ['Left overhang mm', 'بروز يسار مم'], oh_r: ['Right overhang mm', 'بروز يمين مم'],
    edge: ['Edge profile', 'شكل الحرف'], edge_size: ['Edge size mm', 'مقاس الحرف مم'],
    mitre_t: ['Mitred apron mm', 'ارتفاع المرايا مم'],
    splash_on: ['Upstand', 'الظهر'], splash_h: ['Upstand height mm', 'ارتفاع الظهر مم'],
    splash_t: ['Upstand thickness mm', 'سمك الظهر مم'],
    waterfall_l: ['Waterfall left', 'شلال يسار'], waterfall_r: ['Waterfall right', 'شلال يمين'],
    sink_on: ['Sink', 'الحوض'], sink_mount: ['Mounting', 'التركيب'], sink_w: ['Sink width mm', 'عرض الحوض مم'],
    sink_d: ['Sink depth mm', 'عمق الحوض مم'], bowl_d: ['Bowl depth mm', 'غاطس الحوض مم'],
    bowls: ['Bowls', 'عدد الأحواض'], drainer: ['Drainer board', 'مصفاة'],
    sink_dx: ['Offset X mm', 'إزاحة أفقية مم'], sink_dy: ['Offset Y mm', 'إزاحة رأسية مم'],
    tap: ['Tap', 'الخلاط'], tap_h: ['Tap height mm', 'ارتفاع الخلاط مم'],
    hob_on: ['Hob', 'البوتاجاز'], hob_kind: ['Hob type', 'نوع البوتاجاز'],
    hob_w: ['Hob width mm', 'عرض البوتاجاز مم'], hob_d: ['Hob depth mm', 'عمق البوتاجاز مم'],
    burners: ['Burners', 'عدد الشعلات'],
    m_carcass: ['Carcass', 'الهيكل'], m_front: ['Fronts', 'الضلف'], m_back: ['Back panel', 'الظهر'],
    m_shelf: ['Shelves', 'الأرفف'], m_counter: ['Worktop', 'الرخامة'],
    m_drawer: ['Drawer box', 'صندوق الدرج'], m_plinth: ['Plinth', 'القاعدة'],
    m_hardware: ['Hardware finish', 'تشطيب الإكسسوار'], m_glass: ['Glass', 'الزجاج'],
    preset_name: ['Preset name', 'اسم القالب'], save_preset: ['Save preset', 'حفظ القالب'],
    export_lib: ['Export library', 'تصدير المكتبة'], import_lib: ['Import library', 'استيراد المكتبة'],
    blocks: ['Appliance components', 'بلوكات الأجهزة'],
    blocks_hint: ['Point each appliance at your own .skp block. Units then place your block instead of the placeholder.',
                  'اربط كل جهاز ببلوك .skp خاص بك، وسيتم استخدامه بدل الشكل المبدئي.'],
    browse: ['Browse', 'استعراض'], clear: ['Clear', 'مسح'],
    cutlist: ['Cut list CSV', 'قائمة التقطيع CSV'], hardware: ['Hardware CSV', 'قائمة الإكسسوار CSV'],
    boq: ['BOQ CSV', 'حصر الكميات CSV'], boq_view: ['Preview BOQ', 'عرض الحصر'],
    reports_hint: ['With nothing selected the whole model is reported; with a selection only those units.',
                   'بدون تحديد يتم حصر الموديل كامل، ومع التحديد يتم حصر الوحدات المحددة فقط.'],
    material: ['Material', 'الخامة'], area: ['Area m²', 'المساحة م²'], rate: ['Rate', 'السعر'],
    amount: ['Amount', 'الإجمالي'], total: ['Total', 'الإجمالي'],
    place: ['Place', 'إدراج بالماوس'], insert: ['Insert', 'إدراج'], apply: ['Apply', 'تطبيق'],
    auto: ['Live update', 'تحديث مباشر'], zoom: ['Zoom', 'تكبير'],
    editing: ['editing selected unit', 'تعديل الوحدة المحددة'], newunit: ['new unit', 'وحدة جديدة'],
    load_sel: ['Load selection', 'تحميل المحدد']
  };

  function t(key) {
    var entry = DICT[key];
    if (!entry) { return key; }
    return S.lang === 'ar' ? entry[1] : entry[0];
  }

  var TITLES = {
    base: ['Base cabinet', 'وحدة سفلية'], base_sink: ['Sink base', 'وحدة الحوض'],
    base_hob: ['Hob base', 'وحدة البوتاجاز'], base_corner: ['Corner base', 'وحدة ركن سفلية'],
    base_appliance: ['Appliance base', 'وحدة جهاز'], drawer_bank: ['Drawer bank', 'وحدة أدراج'],
    tall: ['Tall unit', 'وحدة عمودية'], wall: ['Wall cabinet', 'وحدة علوية'],
    wall_lift: ['Lift-up wall', 'علوية بمكبس'], wall_open: ['Open wall shelf', 'رف مفتوح'],
    island: ['Island', 'جزيرة'], hood: ['Extractor hood', 'شفاط'],
    vanity: ['Vanity', 'وحدة حمام'], vanity_wall: ['Wall hung vanity', 'وحدة حمام معلقة'],
    vanity_open: ['Open vanity', 'وحدة حمام مفتوحة'], mirror_unit: ['Mirror cabinet', 'دولاب مرايا'],
    tallboy: ['Tallboy', 'وحدة جانبية'], wardrobe: ['Hinged wardrobe', 'دولاب مفصلات'],
    wardrobe_sliding: ['Sliding wardrobe', 'دولاب جرار'], dressing_open: ['Open dressing', 'دريسنج مفتوح'],
    corner_wardrobe: ['Corner wardrobe', 'دولاب ركن'], shoe_unit: ['Shoe unit', 'وحدة أحذية'],
    island_dresser: ['Dressing island', 'جزيرة دريسنج']
  };

  function title(type) {
    var entry = TITLES[type];
    if (!entry) { return type; }
    return S.lang === 'ar' ? entry[1] : entry[0];
  }

  /* ------------------------------------------------------ path access */
  function get(path) {
    var parts = path.split('.'), node = S.params, i;
    for (i = 0; i < parts.length; i++) {
      if (node === null || node === undefined) { return undefined; }
      node = node[isNaN(parts[i]) ? parts[i] : Number(parts[i])];
    }
    return node;
  }

  function set(path, value) {
    var parts = path.split('.'), node = S.params, i, key;
    for (i = 0; i < parts.length - 1; i++) {
      key = isNaN(parts[i]) ? parts[i] : Number(parts[i]);
      if (node[key] === undefined || node[key] === null) { node[key] = {}; }
      node = node[key];
    }
    key = parts[parts.length - 1];
    node[isNaN(key) ? key : Number(key)] = value;
  }

  /* --------------------------------------------------------- controls */
  function esc(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function num(path, label, step, extra) {
    var value = get(path);
    return '<div class="field"><label>' + esc(label) + '</label>' +
      '<input type="number" step="' + (step || 1) + '" data-path="' + path + '" data-cast="num"' +
      (extra || '') + ' value="' + esc(value) + '"></div>';
  }

  function txt(path, label) {
    return '<div class="field"><label>' + esc(label) + '</label>' +
      '<input type="text" data-path="' + path + '" data-cast="str" value="' + esc(get(path)) + '"></div>';
  }

  function sel(path, label, options, rerender) {
    var value = String(get(path)), html = '', i, opt;
    for (i = 0; i < options.length; i++) {
      opt = options[i];
      html += '<option value="' + esc(opt[0]) + '"' + (String(opt[0]) === value ? ' selected' : '') +
        '>' + esc(opt[1]) + '</option>';
    }
    return '<div class="field"><label>' + esc(label) + '</label>' +
      '<select data-path="' + path + '" data-cast="str"' + (rerender ? ' data-rerender="1"' : '') +
      '>' + html + '</select></div>';
  }

  function chk(path, label, rerender) {
    return '<div class="inline"><input type="checkbox" data-path="' + path + '" data-cast="bool"' +
      (get(path) ? ' checked' : '') + (rerender ? ' data-rerender="1"' : '') +
      '><label>' + esc(label) + '</label></div>';
  }

  function rng(path, label, min, max, step) {
    var value = get(path);
    return '<div class="field"><label>' + esc(label) +
      '<span class="range-value" id="rv-' + path.replace(/\./g, '-') + '">' + esc(value) + '</span></label>' +
      '<input type="range" min="' + min + '" max="' + max + '" step="' + (step || 1) +
      '" data-path="' + path + '" data-cast="num" data-live="1" value="' + esc(value) + '"></div>';
  }

  function pairs(values, labeller) {
    return values.map(function (value) {
      return [value, labeller ? labeller(value) : humanise(value)];
    });
  }

  function humanise(value) {
    return String(value).replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function materialOptions() {
    if (S.materialOptions) { return S.materialOptions; }
    var list = S.lists.materials || [];
    S.materialOptions = list.map(function (m) { return [m.key, m.name]; });
    return S.materialOptions;
  }

  function fieldset(label, body) {
    return '<fieldset><legend>' + esc(label) + '</legend>' + body + '</fieldset>';
  }

  function grid(body, cols) {
    return '<div class="grid' + (cols === 1 ? ' one' : cols === 3 ? ' three' : '') + '">' + body + '</div>';
  }


  /* --------------------------------------------------------- elevation */
  /* A live front elevation of the current params. It mirrors the same
     row-distribution rule the Ruby Layout uses, so what is drawn here is
     what gets built. */
  function distribute(total, heights, minimum) {
    var flexible = [], used = 0, i;
    for (i = 0; i < heights.length; i++) {
      if (heights[i] <= 0) { flexible.push(i); } else { used += heights[i]; }
    }
    if (!flexible.length) {
      if (used <= 0) { return heights.map(function () { return 0; }); }
      var factor = total / used;
      return heights.map(function (h) { return h * factor; });
    }
    var share = (total - used) / flexible.length;
    if (share < minimum) { share = minimum; }
    return heights.map(function (h) { return h <= 0 ? share : h; });
  }

  function applianceHeight(row) {
    var table = {
      oven: 595, oven_double: 888, microwave: 380, coffee: 450, warming: 140,
      dishwasher: 820, dishwasher_slim: 820, washer: 850, dryer: 850,
      washer_dryer: 850, fridge: 1780, fridge_tall: 2000, freezer: 1780,
      wine_cooler: 885, kettle: 260, toaster: 200, coffee_machine: 380,
      blender: 400, tv: 650, custom: 600
    };
    return (table[row.appl] || 600) + 2;
  }

  function geometry() {
    var p = S.params;
    var plinth = p.plinth.mode === 'none' ? 0 : p.plinth.h;
    var z0 = plinth, z1 = plinth + p.h;
    var counter = p.counter.on ? p.counter.t : 0;
    var t = p.panel_t, gap = p.front.gap;
    var area;
    if (p.front.mode === 'inset') {
      area = [t + gap, p.w - t - gap, z0 + t + gap, z1 - t - gap - p.front.reveal_top];
    } else if (p.front.mode === 'overlay_half') {
      area = [t / 2, p.w - t / 2, z0 + t / 2, z1 - t / 2 - p.front.reveal_top];
    } else {
      area = [0, p.w, z0, z1 - p.front.reveal_top];
    }
    var rows = p.rows || [];
    var raw = rows.map(function (row) {
      if (row.kind === 'appliance' && row.h <= 0) { return applianceHeight(row); }
      return row.h;
    });
    var span = area[3] - area[2];
    var heights = distribute(span - gap * (rows.length - 1), raw, 40);
    return { p: p, plinth: plinth, z0: z0, z1: z1, counter: counter, area: area, heights: heights };
  }

  function renderPreview() {
    var node = document.getElementById('preview');
    if (!S.params) { node.innerHTML = ''; return; }

    var g = geometry(), p = S.params;
    var totalH = g.z1 + g.counter;
    var totalW = p.w;
    var pad = 26, boxW = 400, boxH = 190;
    var scale = Math.min((boxW - pad * 2) / Math.max(totalW, 1),
                         (boxH - pad * 2) / Math.max(totalH, 1));
    var ox = (boxW - totalW * scale) / 2;
    var oy = boxH - pad / 2;

    function X(x) { return (ox + x * scale).toFixed(1); }
    function Y(z) { return (oy - z * scale).toFixed(1); }
    function W(v) { return Math.max(v * scale, 0.5).toFixed(1); }

    var svg = '<svg viewBox="0 0 ' + boxW + ' ' + boxH + '" preserveAspectRatio="xMidYMid meet">';

    /* carcass body */
    svg += '<rect class="carc" x="' + X(0) + '" y="' + Y(g.z1) + '" width="' + W(p.w) +
           '" height="' + W(p.h) + '"/>';

    /* plinth */
    if (g.plinth > 0) {
      svg += '<rect class="plinth" x="' + X(20) + '" y="' + Y(g.plinth) + '" width="' +
             W(p.w - 40) + '" height="' + W(g.plinth) + '"/>';
    }

    /* worktop */
    if (g.counter > 0) {
      svg += '<rect class="top" x="' + X(-p.counter.oh_l) + '" y="' + Y(g.z1 + g.counter) +
             '" width="' + W(p.w + p.counter.oh_l + p.counter.oh_r) + '" height="' + W(g.counter) + '"/>';
      if (p.counter.splash.on) {
        svg += '<rect class="top" x="' + X(0) + '" y="' + Y(g.z1 + g.counter + p.counter.splash.h) +
               '" width="' + W(p.w) + '" height="' + W(p.counter.splash.h) + '"/>';
      }
    }

    /* front stack */
    var z = g.area[2], i, k;
    var x0 = g.area[0], x1 = g.area[1];
    if (p.type === 'base_corner' && p.corner.mode === 'blind') {
      if (p.corner.side === 'left') { x0 += p.corner.blind_w; } else { x1 -= p.corner.blind_w; }
    }
    var width = x1 - x0;

    for (i = 0; i < g.heights.length; i++) {
      var row = p.rows[i], h = g.heights[i];
      if (!row || h <= 0) { z += h + p.front.gap; continue; }
      var cols = 1;
      if (row.kind === 'door' || row.kind === 'doors2' || row.kind === 'louvre') { cols = row.cols || 1; }
      if (row.kind === 'doors2' && cols < 2) { cols = 2; }
      if (row.kind === 'sliding' || row.kind === 'bifold') { cols = row.panels || 2; }
      var each = (width - p.front.gap * (cols - 1)) / cols;

      for (k = 0; k < cols; k++) {
        var lx = x0 + k * (each + p.front.gap);
        var cls = 'leaf' + (row.kind === 'open' ? ' open' : '');
        if (row.kind !== 'open') {
          svg += '<rect class="' + cls + '" x="' + X(lx) + '" y="' + Y(z + h) +
                 '" width="' + W(each) + '" height="' + W(h) + '"/>';
        } else {
          svg += '<rect class="leaf open" x="' + X(lx) + '" y="' + Y(z + h) +
                 '" width="' + W(each) + '" height="' + W(h) + '"/>';
        }

        /* hinge / opening indication */
        var cx = parseFloat(X(lx)), cw = parseFloat(W(each));
        var cy = parseFloat(Y(z + h)), ch = parseFloat(W(h));
        if (row.kind === 'door' || row.kind === 'doors2' || row.kind === 'louvre' ||
            row.kind === 'bifold') {
          var left = (cols === 1) ? (row.hinge !== 'right') : (k % 2 === 0);
          svg += left
            ? '<path class="hw" d="M' + (cx + cw) + ' ' + cy + ' L' + cx + ' ' + (cy + ch / 2) +
              ' L' + (cx + cw) + ' ' + (cy + ch) + '"/>'
            : '<path class="hw" d="M' + cx + ' ' + cy + ' L' + (cx + cw) + ' ' + (cy + ch / 2) +
              ' L' + cx + ' ' + (cy + ch) + '"/>';
        } else if (row.kind === 'drawer') {
          svg += '<line class="hw" x1="' + (cx + cw * 0.3) + '" y1="' + (cy + ch * 0.28) +
                 '" x2="' + (cx + cw * 0.7) + '" y2="' + (cy + ch * 0.28) + '"/>';
        } else if (row.kind === 'lift' || row.kind === 'flap') {
          var apex = row.kind === 'lift' ? cy : cy + ch;
          var base = row.kind === 'lift' ? cy + ch : cy;
          svg += '<path class="hw" d="M' + cx + ' ' + base + ' L' + (cx + cw / 2) + ' ' + apex +
                 ' L' + (cx + cw) + ' ' + base + '"/>';
        } else if (row.kind === 'sliding') {
          svg += '<line class="hw" x1="' + (cx + cw * 0.2) + '" y1="' + (cy + ch / 2) +
                 '" x2="' + (cx + cw * 0.8) + '" y2="' + (cy + ch / 2) + '"/>';
        } else if (row.kind === 'appliance') {
          svg += '<text class="tag" x="' + (cx + 3) + '" y="' + (cy + ch / 2) + '">' +
                 esc(humanise(row.appl || '')) + '</text>';
        }
      }
      svg += '<text x="' + (parseFloat(X(x1)) + 4) + '" y="' + (parseFloat(Y(z + h / 2)) + 3) +
             '">' + Math.round(h) + '</text>';
      z += h + p.front.gap;
    }

    /* overall dimensions */
    svg += '<line class="dim" x1="' + X(0) + '" y1="' + (oy + 8) + '" x2="' + X(p.w) +
           '" y2="' + (oy + 8) + '"/>';
    svg += '<text x="' + (ox + totalW * scale / 2 - 14) + '" y="' + (oy + 17) + '">' +
           Math.round(p.w) + '</text>';
    svg += '<text x="4" y="12">' + esc(title(p.type)) + '</text>';
    svg += '<text x="4" y="' + (boxH - 4) + '">' + Math.round(p.w) + ' × ' +
           Math.round(totalH) + ' × ' + Math.round(p.d) + ' mm</text>';
    svg += '</svg>';
    node.innerHTML = svg;
  }

  /* ------------------------------------------------------------ tabs */
  function renderTabs() {
    document.getElementById('tabs').innerHTML = TABS.map(function (id) {
      return '<button data-tab="' + id + '"' + (S.tab === id ? ' class="on"' : '') + '>' + t(id) + '</button>';
    }).join('');
    TABS.forEach(function (id) {
      var node = document.getElementById('tab-' + id);
      node.className = (S.tab === id ? 'on' : '');
    });
  }

  function render() {
    if (!S.params) { return; }
    document.body.className = S.lang === 'ar' ? 'rtl' : '';
    document.documentElement.lang = S.lang;
    renderTabs();
    renderPreview();
    renderUnit();
    renderCarcass();
    renderFronts();
    renderInterior();
    renderTop();
    renderMaterials();
    renderPresets();
    renderReports();
    document.getElementById('btn-place').textContent = t('place');
    document.getElementById('btn-insert').textContent = t('insert');
    document.getElementById('btn-apply').textContent = t('apply');
    var chip = document.getElementById('selection-chip');
    chip.textContent = S.editing ? t('editing') : t('newunit');
    chip.className = 'chip' + (S.editing ? ' edit' : '');
  }

  /* ------------------------------------------------------------ unit */
  function renderUnit() {
    var families = S.lists.families || {};
    var family = S.params.family;
    var types = families[family] || [];
    var html = '';

    html += fieldset(t('unit'),
      grid(
        sel('family', t('family'), Object.keys(families).map(function (f) {
          return [f, humanise(f)];
        }), true) +
        sel('type', t('type'), pairs(types, title), true)
      ) +
      grid(txt('name', t('name')) + txt('meta.code', t('code'))) +
      grid(txt('meta.room', t('room')) + num('meta.qty', t('qty'), 1)) +
      txt('meta.note', t('note'))
    );

    html += fieldset(t('w') + ' / ' + t('h') + ' / ' + t('d'),
      grid(num('w', t('w'), 5) + num('h', t('h'), 5) + num('d', t('d'), 5), 3) +
      '<button class="btn wide" data-act="reset-size">' + t('reset_size') + '</button>'
    );

    if (S.params.type === 'hood') {
      html += fieldset(t('hood_style'),
        sel('hood_style', t('hood_style'),
          pairs(['chimney', 'island', 'integrated', 'wall_box'])));
    }

    html += fieldset(t('open_doors'),
      rng('open.doors', t('open_doors'), 0, 130, 5) +
      rng('open.drawers', t('open_drawers'), 0, 100, 5) +
      rng('open.lifts', t('open_lifts'), 0, 100, 5) +
      rng('explode', t('explode'), 0, 600, 10)
    );

    document.getElementById('tab-unit').innerHTML = html;
  }

  /* --------------------------------------------------------- carcass */
  function renderCarcass() {
    var html = '';
    html += fieldset(t('carcass'),
      grid(num('panel_t', t('panel_t'), 0.5) + num('front_t', t('front_t'), 0.5) +
           num('back_t', t('back_t'), 0.5) + num('shelf_t', t('shelf_t'), 0.5)) +
      grid(sel('back_mode', t('back_mode'), pairs(['grooved', 'rebated', 'applied', 'none'])) +
           num('back_inset', t('back_inset'), 1)) +
      grid(sel('top_mode', t('top_mode'), pairs(['rails', 'full', 'none'])) +
           num('rail_w', t('rail_w'), 5)) +
      sel('bottom_mode', t('bottom_mode'), pairs(['full', 'none']))
    );

    html += fieldset(t('plinth_mode'),
      grid(sel('plinth.mode', t('plinth_mode'), pairs(['panel', 'legs', 'floating', 'none'])) +
           num('plinth.h', t('plinth_h'), 5)) +
      grid(num('plinth.setback', t('plinth_setback'), 5) + num('plinth.leg_dia', t('leg_dia'), 1)) +
      grid(num('plinth.shadow', t('shadow'), 1) + '') +
      chk('plinth.returns', t('plinth_returns'))
    );

    if (S.params.type === 'base_corner' || S.params.type === 'corner_wardrobe') {
      html += fieldset(t('corner'),
        grid(sel('corner.mode', t('corner_mode'), pairs(['blind', 'diagonal', 'l']), true) +
             sel('corner.side', t('corner_side'), pairs(['left', 'right']))) +
        grid(num('corner.blind_w', t('blind_w'), 10) + num('corner.return_w', t('return_w'), 10)) +
        grid(num('corner.return_d', t('return_d'), 10) + '') +
        chk('corner.front_b', t('front_b'))
      );
    }

    document.getElementById('tab-carcass').innerHTML = html;
  }

  /* ---------------------------------------------------------- fronts */
  function renderFronts() {
    var html = '';
    html += fieldset(t('fronts'),
      grid(sel('front.mode', t('front_mode'), pairs(['overlay_full', 'overlay_half', 'inset'])) +
           num('front.gap', t('gap'), 0.5)) +
      grid(sel('front.style', t('style'), pairs(S.lists.styles || []), true) +
           num('front.reveal_top', t('reveal_top'), 1)) +
      chk('front.show_hinges', t('show_hinges'))
    );

    var style = S.params.front.style;
    if (style === 'shaker' || style === 'routed' || style === 'profiled') {
      html += fieldset('Shaker',
        grid(num('front.shaker.rail', t('shaker_rail'), 5) +
             num('front.shaker.panel_t', t('shaker_panel_t'), 1) +
             num('front.shaker.panel_inset', t('shaker_inset'), 1), 3));
    }
    if (style === 'ribbed') {
      html += fieldset('Ribbed',
        grid(num('front.ribbed.pitch', t('rib_pitch'), 1) +
             num('front.ribbed.depth', t('rib_depth'), 0.5)));
    }
    if (style === 'glass_frame' || style === 'glass_full') {
      html += fieldset(t('glass_type'),
        grid(sel('front.glass.type', t('glass_type'), (S.lists.glass || []).map(function (g) {
          return [g.key, g.label];
        })) + sel('front.glass.frame', t('glass_frame'), pairs(['aluminium', 'timber', 'none']))) +
        grid(num('front.glass.frame_w', t('frame_w'), 1) +
             num('front.glass.frame_t', t('frame_t'), 1) +
             num('front.glass.glass_t', t('glass_t'), 0.5), 3));
    }

    html += fieldset(t('handle'),
      grid(sel('front.handle.type', t('handle'), pairs(S.lists.handles || [])) +
           sel('front.handle.pos', t('handle_pos'), pairs(['top', 'bottom', 'left', 'right', 'centre']))) +
      grid(num('front.handle.length', t('handle_len'), 5) +
           num('front.handle.proj', t('handle_proj'), 1)) +
      grid(num('front.handle.dia', t('handle_dia'), 1) +
           num('front.handle.offset', t('handle_offset'), 5)) +
      sel('front.handle.material', t('m_hardware'), materialOptions())
    );

    html += fieldset(t('rows'), rowsEditor() +
      '<button class="btn wide" data-act="add-row">+ ' + t('add_row') + '</button>');

    document.getElementById('tab-fronts').innerHTML = html;
  }

  function rowsEditor() {
    var rows = S.params.rows || [];
    return rows.map(function (row, index) {
      var base = 'rows.' + index;
      var body = '<div class="row-card"><div class="row-head">' +
        '<span class="idx">' + (index + 1) + '</span>' +
        '<select data-path="' + base + '.kind" data-cast="str" data-rerender="1">' +
        (S.lists.kinds || []).map(function (kind) {
          return '<option value="' + kind + '"' + (row.kind === kind ? ' selected' : '') + '>' +
            humanise(kind) + '</option>';
        }).join('') + '</select>' +
        '<button class="icon-btn" data-act="row-up" data-i="' + index + '">&#9650;</button>' +
        '<button class="icon-btn" data-act="row-down" data-i="' + index + '">&#9660;</button>' +
        '<button class="icon-btn" data-act="row-del" data-i="' + index + '">&#10005;</button>' +
        '</div>';

      body += grid(num(base + '.h', t('row_h'), 5) + rowExtra(row, base));
      body += rowDetail(row, base);
      return body + '</div>';
    }).join('');
  }

  function rowExtra(row, base) {
    switch (row.kind) {
      case 'door':
      case 'doors2':
      case 'louvre':
        return num(base + '.cols', t('cols'), 1);
      case 'sliding':
        return num(base + '.panels', t('panels'), 1);
      case 'lift':
        return sel(base + '.lift', t('lift'), (S.lists.lifts || []).map(function (l) {
          return [l.key, l.label];
        }));
      case 'appliance':
        return sel(base + '.appl', t('appl'), pairs(S.lists.appliances || []), true);
      case 'drawer':
        return sel(base + '.drawer.runner', t('runner'), (S.lists.runners || []).map(function (r) {
          return [r.key, r.label];
        }));
      default:
        return '';
    }
  }

  function rowDetail(row, base) {
    var html = '';
    if (row.kind === 'door' || row.kind === 'louvre' || row.kind === 'flap' || row.kind === 'lift') {
      html += sel(base + '.hinge', t('hinge'), pairs(['left', 'right', 'top', 'bottom']));
    }
    if (row.kind === 'drawer') {
      html += chk(base + '.drawer.box', t('box'), true);
      if (row.drawer && row.drawer.box) {
        html += grid(num(base + '.drawer.box_h', 'Box height mm', 5) +
          sel(base + '.drawer.insert', t('insert'),
            pairs(['none', 'cutlery_tray', 'wire_basket', 'plate_rack'])));
      }
    }
    if (row.kind === 'appliance') {
      html += chk(base + '.appl_integrated', t('integrated'));
      html += txt(base + '.block', 'Block .skp');
    }
    html += txt(base + '.note', t('note'));
    return html;
  }

  /* -------------------------------------------------------- interior */
  function renderInterior() {
    var html = fieldset(t('interior'),
      grid(num('interior.shelves', t('shelves'), 1) +
           sel('interior.shelf_mode', t('shelf_mode'), pairs(['adjustable', 'fixed']))) +
      grid(num('interior.shelf_setback', t('shelf_setback'), 1) +
           num('interior.dividers', t('dividers'), 1))
    );

    var list = S.params.interior.accessories || [];
    var cards = list.map(function (acc, index) {
      var base = 'interior.accessories.' + index;
      return '<div class="acc-card"><div class="row-head">' +
        '<span class="idx">' + (index + 1) + '</span>' +
        '<select data-path="' + base + '.type" data-cast="str" data-rerender="1">' +
        (S.lists.accessories || []).map(function (type) {
          return '<option value="' + type + '"' + (acc.type === type ? ' selected' : '') + '>' +
            humanise(type) + '</option>';
        }).join('') + '</select>' +
        '<button class="icon-btn" data-act="acc-del" data-i="' + index + '">&#10005;</button></div>' +
        grid(num(base + '.z', t('acc_z'), 10) + num(base + '.x', t('acc_x'), 10)) +
        grid(num(base + '.w', t('acc_w'), 10) + num(base + '.count', t('acc_count'), 1)) +
        grid(num(base + '.angle', t('acc_angle'), 1) + num(base + '.depth', t('acc_depth'), 10)) +
        '</div>';
    }).join('');

    html += fieldset(t('accessories'), cards +
      '<button class="btn wide" data-act="add-acc">+ ' + t('add_acc') + '</button>');
    document.getElementById('tab-interior').innerHTML = html;
  }

  /* ------------------------------------------------------------- top */
  function renderTop() {
    var html = fieldset(t('counter_on'),
      chk('counter.on', t('counter_on'), true));

    if (S.params.counter.on) {
      html += fieldset(t('edge'),
        grid(num('counter.t', t('counter_t'), 1) +
             sel('counter.edge', t('edge'), pairs(['square', 'bevel', 'bullnose', 'mitred']), true)) +
        grid(num('counter.edge_size', t('edge_size'), 0.5) +
             num('counter.mitre_t', t('mitre_t'), 5)) +
        grid(num('counter.front_oh', t('front_oh'), 5) + num('counter.back_oh', t('back_oh'), 5)) +
        grid(num('counter.oh_l', t('oh_l'), 5) + num('counter.oh_r', t('oh_r'), 5)) +
        chk('counter.splash.on', t('splash_on'), true) +
        (S.params.counter.splash.on
          ? grid(num('counter.splash.h', t('splash_h'), 5) + num('counter.splash.t', t('splash_t'), 1))
          : '') +
        chk('counter.waterfall_l', t('waterfall_l')) +
        chk('counter.waterfall_r', t('waterfall_r'))
      );

      html += fieldset(t('sink_on'), chk('sink.on', t('sink_on'), true) +
        (S.params.sink.on ? (
          grid(sel('sink.mount', t('sink_mount'),
                 pairs(['undermount', 'topmount', 'integrated', 'vessel'])) +
               num('sink.bowls', t('bowls'), 1)) +
          grid(num('sink.w', t('sink_w'), 10) + num('sink.d', t('sink_d'), 10)) +
          grid(num('sink.bowl_d', t('bowl_d'), 5) + num('sink.dx', t('sink_dx'), 10)) +
          grid(num('sink.dy', t('sink_dy'), 10) + num('sink.tap_h', t('tap_h'), 10)) +
          chk('sink.drainer', t('drainer')) + chk('sink.tap', t('tap'))
        ) : ''));

      html += fieldset(t('hob_on'), chk('hob.on', t('hob_on'), true) +
        (S.params.hob.on ? (
          grid(sel('hob.kind', t('hob_kind'), pairs(['gas', 'induction', 'ceramic', 'domino'])) +
               num('hob.burners', t('burners'), 1)) +
          grid(num('hob.w', t('hob_w'), 10) + num('hob.d', t('hob_d'), 10)) +
          grid(num('hob.dx', t('sink_dx'), 10) + num('hob.dy', t('sink_dy'), 10))
        ) : ''));
    }

    document.getElementById('tab-top').innerHTML = html;
  }

  /* ------------------------------------------------------- materials */
  function renderMaterials() {
    var options = materialOptions();
    var html = fieldset(t('materials'),
      sel('materials.carcass', t('m_carcass'), options) +
      sel('materials.front', t('m_front'), options) +
      sel('materials.back', t('m_back'), options) +
      sel('materials.shelf', t('m_shelf'), options) +
      sel('materials.counter', t('m_counter'), options) +
      sel('materials.drawer_box', t('m_drawer'), options) +
      sel('materials.plinth', t('m_plinth'), options) +
      sel('materials.hardware', t('m_hardware'), options) +
      sel('materials.glass', t('m_glass'), options)
    );

    var list = S.lists.materials || [];
    html += fieldset('Library', '<table><thead><tr><th>' + t('material') +
      '</th><th class="num">' + t('rate') + '</th></tr></thead><tbody>' +
      list.map(function (m) {
        return '<tr><td><span class="swatch" style="background:' + m.color + '"></span>' +
          esc(m.name) + '</td><td class="num">' + m.rate + '</td></tr>';
      }).join('') + '</tbody></table>');

    document.getElementById('tab-materials').innerHTML = html;
  }

  /* --------------------------------------------------------- presets */
  function renderPresets() {
    var presets = S.lists.presets || [];
    var html = fieldset(t('presets'),
      '<div class="field"><label>' + t('preset_name') +
      '</label><input type="text" id="preset-name" value="' + esc(S.params.name || '') + '"></div>' +
      '<div class="btn-row"><button class="btn primary" data-act="preset-save">' + t('save_preset') +
      '</button></div>' +
      (presets.length
        ? presets.map(function (p) {
            return '<div class="preset-row"><span>' + esc(p.name) + ' <small>' +
              esc(title(p.type)) + '</small></span>' +
              '<button class="btn" data-act="preset-load" data-name="' + esc(p.file) + '">&#8681;</button>' +
              '<button class="icon-btn" data-act="preset-del" data-name="' + esc(p.name) + '">&#10005;</button></div>';
          }).join('')
        : '<p class="hint">—</p>') +
      '<div class="btn-row"><button class="btn" data-act="preset-export">' + t('export_lib') +
      '</button><button class="btn" data-act="preset-import">' + t('import_lib') + '</button></div>'
    );

    var blocks = S.lists.blocks || {};
    html += fieldset(t('blocks'),
      '<p class="hint">' + t('blocks_hint') + '</p>' +
      (S.lists.appliances || []).map(function (key) {
        var path = blocks[key];
        return '<div class="preset-row"><span>' + humanise(key) +
          (path ? ' <small>' + esc(path.split(/[\\/]/).pop()) + '</small>' : '') + '</span>' +
          '<button class="btn" data-act="block-pick" data-key="' + key + '">' + t('browse') + '</button>' +
          (path ? '<button class="icon-btn" data-act="block-clear" data-key="' + key + '">&#10005;</button>' : '') +
          '</div>';
      }).join('')
    );

    document.getElementById('tab-presets').innerHTML = html;
  }

  /* --------------------------------------------------------- reports */
  function renderReports() {
    var html = fieldset(t('reports'),
      '<p class="hint">' + t('reports_hint') + '</p>' +
      '<div class="btn-row"><button class="btn" data-act="report" data-kind="cutlist">' + t('cutlist') +
      '</button><button class="btn" data-act="report" data-kind="hardware">' + t('hardware') + '</button></div>' +
      '<div class="btn-row"><button class="btn" data-act="report" data-kind="boq">' + t('boq') +
      '</button><button class="btn" data-act="report" data-kind="boq_view">' + t('boq_view') + '</button></div>'
    );

    if (S.boq) {
      html += fieldset('BOQ ' + esc(S.boq.generated),
        '<table><thead><tr><th>' + t('material') + '</th><th class="num">' + t('area') +
        '</th><th class="num">' + t('rate') + '</th><th class="num">' + t('amount') +
        '</th></tr></thead><tbody>' +
        S.boq.materials.map(function (row) {
          return '<tr><td>' + esc(row.material) + '</td><td class="num">' + row.area_m2 +
            '</td><td class="num">' + row.rate + '</td><td class="num">' + row.amount + '</td></tr>';
        }).join('') +
        '</tbody><tfoot><tr><td colspan="3">' + t('total') + '</td><td class="num">' +
        S.boq.total + '</td></tr></tfoot></table>');
    }

    document.getElementById('tab-reports').innerHTML = html;
  }

  /* ----------------------------------------------------------- bridge */
  function call(name, payload) {
    if (window.sketchup && window.sketchup[name]) {
      if (payload === undefined) { window.sketchup[name](); }
      else { window.sketchup[name](payload); }
    }
  }

  function scheduleApply() {
    if (!S.auto || !S.editing) { return; }
    if (S.timer) { clearTimeout(S.timer); }
    S.timer = setTimeout(function () {
      call('apply', JSON.stringify(S.params));
    }, 350);
  }

  function status(text, kind) {
    var node = document.getElementById('status');
    node.textContent = text || '';
    node.className = kind || '';
  }

  /* ------------------------------------------------------------ events */
  function onInput(event) {
    var node = event.target;
    var path = node.getAttribute('data-path');
    if (!path) { return; }
    var cast = node.getAttribute('data-cast');
    var value;
    if (cast === 'num') { value = parseFloat(node.value); if (isNaN(value)) { value = 0; } }
    else if (cast === 'bool') { value = node.checked; }
    else { value = node.value; }
    set(path, value);

    if (node.getAttribute('data-live')) {
      var label = document.getElementById('rv-' + path.replace(/\./g, '-'));
      if (label) { label.textContent = value; }
    }
    renderPreview();
    if (node.getAttribute('data-rerender')) {
      if (path === 'family') {
        var types = (S.lists.families || {})[value] || [];
        if (types.length) { call('defaults', types[0]); return; }
      }
      if (path === 'type') { call('defaults', value); return; }
      render();
    }
    scheduleApply();
  }

  function onClick(event) {
    var node = event.target.closest('[data-act], [data-tab]');
    if (!node) { return; }

    var tab = node.getAttribute('data-tab');
    if (tab) { S.tab = tab; renderTabs(); return; }

    var act = node.getAttribute('data-act');
    var index = parseInt(node.getAttribute('data-i'), 10);
    var rows = S.params.rows;
    var accs = S.params.interior.accessories;

    switch (act) {
      case 'reset-size':
        var envelope = (S.lists.envelopes || {})[S.params.type];
        if (envelope) {
          S.params.w = envelope[0]; S.params.h = envelope[1]; S.params.d = envelope[2];
          render(); scheduleApply();
        }
        break;
      case 'add-row':
        rows.push(JSON.parse(JSON.stringify(rows[rows.length - 1] || { kind: 'door', h: 0, cols: 1 })));
        render(); scheduleApply();
        break;
      case 'row-del':
        if (rows.length > 1) { rows.splice(index, 1); render(); scheduleApply(); }
        break;
      case 'row-up':
        if (index > 0) { rows.splice(index - 1, 0, rows.splice(index, 1)[0]); render(); scheduleApply(); }
        break;
      case 'row-down':
        if (index < rows.length - 1) { rows.splice(index + 1, 0, rows.splice(index, 1)[0]); render(); scheduleApply(); }
        break;
      case 'add-acc':
        accs.push({ type: 'shelf', z: 0, x: 0, w: 0, count: 1, angle: 0, depth: 0, note: '' });
        render(); scheduleApply();
        break;
      case 'acc-del':
        accs.splice(index, 1); render(); scheduleApply();
        break;
      case 'preset-save':
        call('preset_save', JSON.stringify({
          name: document.getElementById('preset-name').value, params: S.params
        }));
        break;
      case 'preset-load':  call('preset_load', node.getAttribute('data-name')); break;
      case 'preset-del':   call('preset_delete', node.getAttribute('data-name')); break;
      case 'preset-export': call('preset_export'); break;
      case 'preset-import': call('preset_import'); break;
      case 'block-pick':   call('pick_block', node.getAttribute('data-key')); break;
      case 'block-clear':  call('clear_block', node.getAttribute('data-key')); break;
      case 'report':
        S.boq = null;
        call('report', node.getAttribute('data-kind'));
        break;
    }
  }

  /* ----------------------------------------------------------- public */
  var api = {
    bootstrap: function (data) {
      S.lists = data;
      S.materialOptions = null;
      S.params = data.params;
      document.getElementById('version').textContent = 'v' + data.version;
      render();
    },
    params: function (params) {
      S.params = params;
      render();
      scheduleApply();
    },
    selection: function (data) {
      S.editing = !!data.found;
      if (data.found) { S.params = data.params; }
      render();
    },
    presets: function (list) { S.lists.presets = list; renderPresets(); },
    blocks: function (map) { S.lists.blocks = map; renderPresets(); },
    boq: function (data) { S.boq = data; renderReports(); },
    status: function (data) {
      status(data.message, data.ok ? 'ok' : 'err');
    },
    lang: function (code) { S.lang = code; render(); }
  };

  document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('input', onInput);
    document.addEventListener('change', onInput);
    document.addEventListener('click', onClick);

    document.getElementById('lang-chip').addEventListener('click', function () {
      S.lang = S.lang === 'ar' ? 'en' : 'ar';
      this.textContent = S.lang === 'ar' ? 'EN' : 'عربي';
      render();
    });
    document.getElementById('selection-chip').addEventListener('click', function () {
      call('load_selection');
    });
    document.getElementById('btn-apply').addEventListener('click', function () {
      call('apply', JSON.stringify(S.params));
    });
    document.getElementById('btn-insert').addEventListener('click', function () {
      call('create', JSON.stringify(S.params));
    });
    document.getElementById('btn-place').addEventListener('click', function () {
      call('place', JSON.stringify(S.params));
    });

    call('ready');
  });

  return api;
}());
