# frozen_string_literal: true

module AHW
  module KD
    # Design styles. A designer does not pick a door profile, then a handle,
    # then an edge detail in isolation - those decisions belong together.
    # Applying a style sets the whole coherent set in one move; every value
    # stays editable afterwards.
    module Styles
      SPECS = {
        'modern' => {
          'label' => ['Modern', 'مودرن'],
          'front' => { 'mode' => 'overlay_full', 'gap' => 3.0, 'style' => 'slab', 'radius' => 0.0,
                       'handle' => { 'type' => 'bar', 'pos' => 'top', 'length' => 192.0,
                                     'proj' => 32.0, 'dia' => 14.0, 'offset' => 45.0,
                                     'material' => 'ss_brushed' } },
          'counter' => { 't' => 30.0, 'edge' => 'square', 'edge_size' => 2.0 },
          'plinth' => { 'mode' => 'panel', 'h' => 150.0, 'setback' => 50.0 },
          'materials' => { 'kitchen'  => { 'front' => 'lacquer_white', 'carcass' => 'mfc_white',
                                           'counter' => 'quartz_white' },
                           'bathroom' => { 'front' => 'lacquer_white', 'carcass' => 'polywood_18',
                                           'counter' => 'quartz_white' },
                           'dressing' => { 'front' => 'lacquer_white', 'carcass' => 'mfc_white',
                                           'counter' => 'quartz_white' } }
        },

        'ultra_modern' => {
          'label' => ['Ultra modern', 'ألترا مودرن'],
          'front' => { 'mode' => 'overlay_full', 'gap' => 2.0, 'style' => 'handleless_j',
                       'radius' => 0.0,
                       'handle' => { 'type' => 'push_open', 'pos' => 'top', 'length' => 0.0,
                                     'proj' => 0.0, 'dia' => 0.0, 'offset' => 0.0,
                                     'material' => 'black_matt' } },
          'counter' => { 't' => 20.0, 'edge' => 'mitred', 'mitre_t' => 80.0 },
          'plinth' => { 'mode' => 'floating', 'h' => 150.0, 'setback' => 70.0, 'shadow' => 25.0 },
          'materials' => { 'kitchen'  => { 'front' => 'fenix_grey', 'carcass' => 'mfc_anthracite',
                                           'counter' => 'porcelain_slab' },
                           'bathroom' => { 'front' => 'fenix_grey', 'carcass' => 'polywood_18',
                                           'counter' => 'corian_white' },
                           'dressing' => { 'front' => 'fenix_grey', 'carcass' => 'mfc_anthracite',
                                           'counter' => 'porcelain_slab' } }
        },

        'contemporary' => {
          'label' => ['Contemporary', 'كونتمبورري'],
          'front' => { 'mode' => 'overlay_full', 'gap' => 3.0, 'style' => 'ribbed', 'radius' => 0.0,
                       'ribbed' => { 'pitch' => 32.0, 'depth' => 5.0 },
                       'handle' => { 'type' => 'long_profile', 'pos' => 'top', 'length' => 600.0,
                                     'proj' => 22.0, 'dia' => 26.0, 'offset' => 20.0,
                                     'material' => 'black_matt' } },
          'counter' => { 't' => 20.0, 'edge' => 'mitred', 'mitre_t' => 60.0 },
          'plinth' => { 'mode' => 'panel', 'h' => 150.0, 'setback' => 60.0 },
          'materials' => { 'kitchen'  => { 'front' => 'veneer_oak', 'carcass' => 'mfc_oak',
                                           'counter' => 'quartz_grey' },
                           'bathroom' => { 'front' => 'veneer_teak', 'carcass' => 'polywood_18',
                                           'counter' => 'quartz_grey' },
                           'dressing' => { 'front' => 'veneer_walnut', 'carcass' => 'mfc_walnut',
                                           'counter' => 'quartz_grey' } }
        },

        'classic' => {
          'label' => ['Classic', 'كلاسيك'],
          'front' => { 'mode' => 'overlay_full', 'gap' => 3.0, 'style' => 'shaker', 'radius' => 0.0,
                       'shaker' => { 'rail' => 90.0, 'panel_t' => 10.0, 'panel_inset' => 6.0 },
                       'handle' => { 'type' => 'cup_pull', 'pos' => 'centre', 'length' => 96.0,
                                     'proj' => 26.0, 'dia' => 14.0, 'offset' => 60.0,
                                     'material' => 'brass_polished' } },
          'counter' => { 't' => 30.0, 'edge' => 'bullnose', 'edge_size' => 15.0 },
          'plinth' => { 'mode' => 'panel', 'h' => 150.0, 'setback' => 40.0, 'returns' => true },
          'materials' => { 'kitchen'  => { 'front' => 'lacquer_ivory', 'carcass' => 'mdf_18_raw',
                                           'counter' => 'marble_carrara' },
                           'bathroom' => { 'front' => 'lacquer_ivory', 'carcass' => 'polywood_18',
                                           'counter' => 'marble_carrara' },
                           'dressing' => { 'front' => 'lacquer_cream', 'carcass' => 'mdf_18_raw',
                                           'counter' => 'marble_carrara' } }
        },

        'neo_classic' => {
          'label' => ['Neo classic', 'نيو كلاسيك'],
          'front' => { 'mode' => 'overlay_full', 'gap' => 3.0, 'style' => 'routed', 'radius' => 0.0,
                       'handle' => { 'type' => 'drop_pull', 'pos' => 'centre', 'length' => 120.0,
                                     'proj' => 34.0, 'dia' => 12.0, 'offset' => 70.0,
                                     'material' => 'gold_pvd' } },
          'counter' => { 't' => 30.0, 'edge' => 'bullnose', 'edge_size' => 15.0 },
          'plinth' => { 'mode' => 'panel', 'h' => 160.0, 'setback' => 40.0, 'returns' => true },
          'materials' => { 'kitchen'  => { 'front' => 'patina_gold', 'carcass' => 'mdf_18_raw',
                                           'counter' => 'marble_emperador' },
                           'bathroom' => { 'front' => 'patina_gold', 'carcass' => 'polywood_18',
                                           'counter' => 'marble_emperador' },
                           'dressing' => { 'front' => 'patina_gold', 'carcass' => 'mdf_18_raw',
                                           'counter' => 'marble_emperador' } }
        },

        'minimal' => {
          'label' => ['Minimal', 'مينيمال'],
          'front' => { 'mode' => 'overlay_full', 'gap' => 2.0, 'style' => 'slab', 'radius' => 0.0,
                       'handle' => { 'type' => 'finger_pull', 'pos' => 'top', 'length' => 0.0,
                                     'proj' => 0.0, 'dia' => 16.0, 'offset' => 20.0,
                                     'material' => 'alu_anodised' } },
          'counter' => { 't' => 12.0, 'edge' => 'square', 'edge_size' => 1.0 },
          'plinth' => { 'mode' => 'floating', 'h' => 130.0, 'setback' => 80.0, 'shadow' => 20.0 },
          'materials' => { 'kitchen'  => { 'front' => 'pet_white', 'carcass' => 'mfc_white',
                                           'counter' => 'compact_laminate' },
                           'bathroom' => { 'front' => 'pet_white', 'carcass' => 'polywood_18',
                                           'counter' => 'compact_laminate' },
                           'dressing' => { 'front' => 'pet_white', 'carcass' => 'mfc_white',
                                           'counter' => 'compact_laminate' } }
        },

        'industrial' => {
          'label' => ['Industrial', 'إندستريال'],
          'front' => { 'mode' => 'overlay_full', 'gap' => 4.0, 'style' => 'slab', 'radius' => 0.0,
                       'handle' => { 'type' => 't_bar', 'pos' => 'top', 'length' => 224.0,
                                     'proj' => 38.0, 'dia' => 16.0, 'offset' => 50.0,
                                     'material' => 'gunmetal' } },
          'counter' => { 't' => 20.0, 'edge' => 'square', 'edge_size' => 2.0 },
          'plinth' => { 'mode' => 'legs', 'h' => 150.0, 'setback' => 50.0, 'leg_dia' => 50.0 },
          'materials' => { 'kitchen'  => { 'front' => 'hpl_concrete', 'carcass' => 'ply_18_natural',
                                           'counter' => 'stainless_top' },
                           'bathroom' => { 'front' => 'hpl_concrete', 'carcass' => 'polywood_18',
                                           'counter' => 'stainless_top' },
                           'dressing' => { 'front' => 'hpl_concrete', 'carcass' => 'ply_18_natural',
                                           'counter' => 'stainless_top' } }
        },

        'scandinavian' => {
          'label' => ['Scandinavian', 'إسكندنافي'],
          'front' => { 'mode' => 'overlay_full', 'gap' => 3.0, 'style' => 'slab', 'radius' => 0.0,
                       'handle' => { 'type' => 'timber_dowel', 'pos' => 'top', 'length' => 160.0,
                                     'proj' => 34.0, 'dia' => 18.0, 'offset' => 50.0,
                                     'material' => 'oak_handle' } },
          'counter' => { 't' => 40.0, 'edge' => 'bevel', 'edge_size' => 3.0 },
          'plinth' => { 'mode' => 'panel', 'h' => 140.0, 'setback' => 50.0 },
          'materials' => { 'kitchen'  => { 'front' => 'mfc_white', 'carcass' => 'ply_18_natural',
                                           'counter' => 'butcher_oak' },
                           'bathroom' => { 'front' => 'mfc_oak', 'carcass' => 'polywood_18',
                                           'counter' => 'butcher_oak' },
                           'dressing' => { 'front' => 'mfc_oak', 'carcass' => 'ply_18_natural',
                                           'counter' => 'butcher_oak' } }
        }
      }.freeze

      module_function

      def keys
        SPECS.keys
      end

      def label(key, lang = 'en')
        spec = SPECS[key.to_s]
        return key.to_s unless spec

        lang == 'ar' ? spec['label'][1] : spec['label'][0]
      end

      def catalogue
        SPECS.map { |key, spec| { 'key' => key, 'en' => spec['label'][0], 'ar' => spec['label'][1] } }
      end

      # Returns a new params Hash with the style applied. Sizes, front layout
      # and interior fit-out are never touched - only the look.
      def apply(params, key)
        spec = SPECS[key.to_s]
        return params unless spec

        result = Util.deep_dup(params)
        family = result['family'] || Params.family_of(result['type'])
        palette = spec['materials'][family] || spec['materials']['kitchen']

        result['front']   = Util.deep_merge(result['front'], spec['front'])
        result['counter'] = Util.deep_merge(result['counter'], spec['counter'])
        result['plinth']  = Util.deep_merge(result['plinth'], spec['plinth'])

        result['materials'] = result['materials'].merge(
          'front'      => palette['front'],
          'carcass'    => palette['carcass'],
          'shelf'      => palette['carcass'],
          'counter'    => palette['counter'],
          'drawer_box' => result['materials']['drawer_box'],
          'hardware'   => spec['front']['handle']['material']
        )

        # Types whose front is glass by definition keep their glass.
        if %w[mirror_unit].include?(result['type'])
          result['front']['style'] = 'glass_full'
        end
        # Wall hung units never gain a plinth from a style.
        if Const::WALL_TYPES.include?(result['type'])
          result['plinth'] = result['plinth'].merge('mode' => 'none', 'h' => 0.0)
        end

        result['style'] = key.to_s
        result
      end
    end
  end
end
