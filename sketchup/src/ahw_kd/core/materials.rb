# frozen_string_literal: true

module AHW
  module KD
    # Material library. Every entry knows what it looks like in the model and
    # what it costs per square metre, so the same table drives the render and
    # the BOQ. Rates are indicative supply-and-fix figures for the MENA / GCC
    # market and are meant to be overridden per project.
    module Materials
      PREFIX = 'AHW '

      LIBRARY = {
        # ---------------------------------------------------------- panels
        'ply_18_natural'   => { name: 'Plywood 18mm Natural',     color: [196, 156, 104], cat: 'panel',  rate: 42.0,  t: 18 },
        'ply_18_marine'    => { name: 'Marine Plywood 18mm',      color: [176, 134, 84],  cat: 'panel',  rate: 68.0,  t: 18 },
        'ply_15_natural'   => { name: 'Plywood 15mm Natural',     color: [200, 162, 112], cat: 'panel',  rate: 36.0,  t: 15 },
        'ply_12_natural'   => { name: 'Plywood 12mm Natural',     color: [204, 168, 120], cat: 'panel',  rate: 30.0,  t: 12 },
        'mdf_18_raw'       => { name: 'MDF 18mm Raw',             color: [176, 140, 100], cat: 'panel',  rate: 26.0,  t: 18 },
        'mdf_18_moisture'  => { name: 'MDF 18mm Moisture Resist', color: [120, 150, 120], cat: 'panel',  rate: 34.0,  t: 18 },
        'hdf_white'        => { name: 'HDF 6mm White',            color: [238, 236, 230], cat: 'panel',  rate: 12.0,  t: 6 },
        'mfc_white'        => { name: 'MFC 18mm White',           color: [242, 241, 237], cat: 'panel',  rate: 30.0,  t: 18 },
        'mfc_oak'          => { name: 'MFC 18mm Natural Oak',     color: [198, 164, 116], cat: 'panel',  rate: 34.0,  t: 18 },
        'mfc_walnut'       => { name: 'MFC 18mm Walnut',          color: [104, 72,  48],  cat: 'panel',  rate: 36.0,  t: 18 },
        'mfc_anthracite'   => { name: 'MFC 18mm Anthracite',      color: [62,  64,  66],  cat: 'panel',  rate: 34.0,  t: 18 },
        'polywood_18'      => { name: 'Polywood / PVC Board 18mm',color: [246, 246, 244], cat: 'panel',  rate: 44.0,  t: 18 },
        'polywood_16'      => { name: 'Polywood / PVC Board 16mm',color: [246, 246, 244], cat: 'panel',  rate: 40.0,  t: 16 },
        'wpc_18'           => { name: 'WPC Board 18mm',           color: [226, 224, 218], cat: 'panel',  rate: 52.0,  t: 18 },
        'blockboard_18'    => { name: 'Blockboard 18mm',          color: [206, 172, 122], cat: 'panel',  rate: 32.0,  t: 18 },
        'solid_beech'      => { name: 'Solid Beech',              color: [214, 180, 138], cat: 'panel',  rate: 120.0, t: 20 },
        'solid_oak'        => { name: 'Solid Oak',                color: [190, 154, 106], cat: 'panel',  rate: 165.0, t: 20 },

        # ---------------------------------------------------------- finishes
        'lacquer_white'    => { name: 'Lacquer Matt White',       color: [248, 248, 246], cat: 'finish', rate: 110.0 },
        'lacquer_black'    => { name: 'Lacquer Matt Black',       color: [34,  34,  36],  cat: 'finish', rate: 115.0 },
        'lacquer_greige'   => { name: 'Lacquer Greige',           color: [186, 178, 166], cat: 'finish', rate: 110.0 },
        'lacquer_sage'     => { name: 'Lacquer Sage Green',       color: [140, 152, 132], cat: 'finish', rate: 115.0 },
        'lacquer_navy'     => { name: 'Lacquer Deep Navy',        color: [40,  54,  78],  cat: 'finish', rate: 115.0 },
        'gloss_white'      => { name: 'High Gloss White',         color: [252, 252, 252], cat: 'finish', rate: 130.0 },
        'acrylic_white'    => { name: 'Acrylic Gloss White',      color: [250, 251, 252], cat: 'finish', rate: 150.0 },
        'acrylic_grey'     => { name: 'Acrylic Gloss Grey',       color: [150, 154, 158], cat: 'finish', rate: 150.0 },
        'hpl_oak'          => { name: 'HPL Natural Oak',          color: [196, 162, 116], cat: 'finish', rate: 95.0 },
        'hpl_walnut'       => { name: 'HPL American Walnut',      color: [96,  66,  44],  cat: 'finish', rate: 98.0 },
        'hpl_concrete'     => { name: 'HPL Concrete Grey',        color: [156, 156, 154], cat: 'finish', rate: 92.0 },
        'veneer_oak'       => { name: 'Veneer Oak Lacquered',     color: [192, 158, 112], cat: 'finish', rate: 175.0 },
        'veneer_walnut'    => { name: 'Veneer Walnut Lacquered',  color: [92,  62,  42],  cat: 'finish', rate: 190.0 },
        'pet_white'        => { name: 'PET Matt White',           color: [246, 246, 244], cat: 'finish', rate: 105.0 },
        'fenix_grey'       => { name: 'Fenix NTM Grigio',         color: [96,  98,  100], cat: 'finish', rate: 220.0 },

        # ------------------------------------------------------------- tops
        'quartz_white'     => { name: 'Quartz Pure White',        color: [244, 244, 242], cat: 'top',    rate: 420.0, t: 20 },
        'quartz_calacatta' => { name: 'Quartz Calacatta',         color: [240, 238, 234], cat: 'top',    rate: 520.0, t: 20 },
        'quartz_grey'      => { name: 'Quartz Concrete Grey',     color: [172, 172, 170], cat: 'top',    rate: 430.0, t: 20 },
        'granite_black'    => { name: 'Granite Absolute Black',   color: [30,  30,  32],  cat: 'top',    rate: 380.0, t: 20 },
        'marble_carrara'   => { name: 'Marble Carrara',           color: [236, 236, 232], cat: 'top',    rate: 560.0, t: 20 },
        'marble_emperador' => { name: 'Marble Emperador',         color: [96,  70,  52],  cat: 'top',    rate: 540.0, t: 20 },
        'corian_white'     => { name: 'Corian Glacier White',     color: [246, 246, 246], cat: 'top',    rate: 620.0, t: 12 },
        'porcelain_slab'   => { name: 'Porcelain Slab 12mm',      color: [232, 230, 226], cat: 'top',    rate: 480.0, t: 12 },
        'stainless_top'    => { name: 'Stainless Steel Top',      color: [178, 180, 182], cat: 'top',    rate: 520.0, t: 20 },
        'compact_laminate' => { name: 'Compact Laminate 12mm',    color: [214, 210, 202], cat: 'top',    rate: 260.0, t: 12 },
        'butcher_oak'      => { name: 'Solid Oak Worktop 40mm',   color: [190, 152, 104], cat: 'top',    rate: 340.0, t: 40 },

        # ------------------------------------------------------------ glass
        'glass_clear'      => { name: 'Glass Clear',              color: [206, 222, 226], cat: 'glass',  rate: 180.0, alpha: 0.22 },
        'glass_bronze'     => { name: 'Glass Bronze',             color: [150, 118, 82],  cat: 'glass',  rate: 210.0, alpha: 0.45 },
        'glass_grey'       => { name: 'Glass Grey',               color: [128, 130, 132], cat: 'glass',  rate: 205.0, alpha: 0.45 },
        'glass_smoked'     => { name: 'Glass Smoked',             color: [92,  92,  96],  cat: 'glass',  rate: 215.0, alpha: 0.55 },
        'glass_frosted'    => { name: 'Glass Acid Etched',        color: [226, 230, 230], cat: 'glass',  rate: 220.0, alpha: 0.60 },
        'glass_reeded'     => { name: 'Glass Reeded / Fluted',    color: [214, 226, 228], cat: 'glass',  rate: 260.0, alpha: 0.55 },
        'glass_mirror'     => { name: 'Mirror Silver',            color: [216, 222, 224], cat: 'glass',  rate: 190.0, alpha: 0.02 },
        'glass_lacobel'    => { name: 'Back-painted Lacobel',     color: [40,  42,  46],  cat: 'glass',  rate: 240.0, alpha: 0.02 },

        # --------------------------------------------------------- hardware
        'ss_brushed'       => { name: 'Stainless Brushed',        color: [176, 178, 180], cat: 'metal',  rate: 0.0 },
        'alu_anodised'     => { name: 'Aluminium Anodised',       color: [186, 188, 190], cat: 'metal',  rate: 0.0 },
        'black_matt'       => { name: 'Matt Black Metal',         color: [38,  38,  40],  cat: 'metal',  rate: 0.0 },
        'brass_brushed'    => { name: 'Brushed Brass',            color: [176, 144, 82],  cat: 'metal',  rate: 0.0 },
        'chrome'           => { name: 'Polished Chrome',          color: [206, 210, 214], cat: 'metal',  rate: 0.0 },
        'pvc_black'        => { name: 'PVC Plinth Black',         color: [44,  44,  46],  cat: 'metal',  rate: 18.0 },
        'led_warm'         => { name: 'LED Warm 3000K',           color: [255, 226, 170], cat: 'light',  rate: 0.0, alpha: 0.75 },
        'appliance_steel'  => { name: 'Appliance Stainless',      color: [162, 166, 170], cat: 'metal',  rate: 0.0 },
        'appliance_black'  => { name: 'Appliance Black Glass',    color: [26,  26,  28],  cat: 'metal',  rate: 0.0 }
      }.freeze

      module_function

      def entry(key)
        LIBRARY[key.to_s] || LIBRARY['ply_18_natural']
      end

      def label(key)
        entry(key)[:name]
      end

      def rate(key)
        entry(key)[:rate].to_f
      end

      def keys_by_category(category)
        LIBRARY.select { |_, v| v[:cat] == category }.keys
      end

      def catalogue
        LIBRARY.map do |key, value|
          { 'key' => key, 'name' => value[:name], 'cat' => value[:cat],
            'rate' => value[:rate], 'color' => format('#%02X%02X%02X', *value[:color]) }
        end
      end

      # Fetch (or create) the SketchUp material for a library key.
      def get(model, key)
        spec = entry(key)
        name = PREFIX + spec[:name]
        material = model.materials[name]
        return material if material

        material = model.materials.add(name)
        material.color = Sketchup::Color.new(*spec[:color])
        material.alpha = spec[:alpha] if spec[:alpha]
        material
      rescue StandardError
        nil
      end

      # Paint a face/group/component safely; a missing material must never
      # abort a build.
      def paint(model, entity, key)
        material = get(model, key)
        entity.material = material if material && entity.respond_to?(:material=)
        entity
      end
    end
  end
end
