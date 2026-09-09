# frozen_string_literal: true

module AHW
  module KD
    # The single source of truth for a unit's definition. Everything the
    # builders draw comes from a params Hash produced here; the HTML dialog
    # only ever edits this Hash. String keys throughout, because the params
    # survive as JSON inside the model's attribute dictionary.
    module Params
      module_function

      def base_defaults
        {
          'schema'   => Const::SCHEMA,
          'type'     => 'base',
          'family'   => 'kitchen',
          'style'    => 'modern',   # see Styles::SPECS
          'name'     => '',
          'w'        => 600.0,
          'h'        => 720.0,
          'd'        => 560.0,

          # carcass construction ------------------------------------------
          'panel_t'   => 18.0,
          'front_t'   => 18.0,
          'back_t'    => 6.0,
          'shelf_t'   => 18.0,
          'back_mode' => 'grooved',   # grooved | rebated | applied | none
          'back_inset'=> 12.0,        # distance from rear face to back panel
          'top_mode'  => 'rails',     # rails | full | none
          'rail_w'    => 100.0,
          'bottom_mode' => 'full',    # full | none
          'side_mode' => 'full',      # full | scribe (side panel returns past front)
          'scribe'    => 20.0,

          'plinth' => {
            'mode'     => 'panel',    # panel | legs | floating | wall_hung | none
            'h'        => 150.0,
            'setback'  => 50.0,
            'leg_dia'  => 40.0,
            'returns'  => false,      # fit plinth returns on exposed ends
            'shadow'   => 0.0,        # floating / wall_hung: shadow gap height
            'led'      => false       # LED strip washing the shadow gap
          },

          # fronts ---------------------------------------------------------
          'front' => {
            'mode'       => 'overlay_full',  # overlay_full | overlay_half | inset
            'gap'        => 3.0,
            'reveal_top' => 0.0,
            'style'      => 'slab',          # see Const::DOOR_STYLES
            'radius'     => 0.0,
            'show_hinges'=> true,
            'hinge_type' => 'blumotion_110',
            'shaker'     => { 'rail' => 70.0, 'panel_t' => 8.0, 'panel_inset' => 10.0 },
            'ribbed'     => { 'pitch' => 30.0, 'depth' => 4.0 },
            'glass'      => {
              'type'    => 'clear',
              'frame'   => 'aluminium',      # aluminium | timber | none
              'frame_w' => 24.0,
              'frame_t' => 20.0,
              'glass_t' => 5.0
            },
            'handle' => {
              'type'     => 'bar',
              'length'   => 160.0,
              'proj'     => 32.0,
              'dia'      => 14.0,
              'pos'      => 'top',           # top | bottom | left | right | centre
              'offset'   => 50.0,
              'material' => 'ss_brushed'
            }
          },

          # front stack, bottom to top ------------------------------------
          'rows' => [row('door')],

          # interior -------------------------------------------------------
          'interior' => {
            'shelves'       => 1,
            'shelf_mode'    => 'adjustable',   # adjustable | fixed
            'shelf_setback' => 20.0,
            'dividers'      => 0,
            'divider_at'    => [],             # explicit x positions (mm), else equal
            'accessories'   => []              # see Const::INTERIOR_ACCESSORIES
          },

          # corner geometry (base_corner, corner_wardrobe) -----------------
          'corner' => {
            'mode'      => 'blind',   # blind | diagonal | l
            'side'      => 'left',    # which side the return / blind sits on
            'blind_w'   => 300.0,     # blind corner: width hidden by the return
            'return_w'  => 900.0,     # diagonal / l: extent along the second wall
            'return_d'  => 560.0,     # l: depth of the return carcass
            'front_b'   => true       # l: fit fronts on the return leg too
          },

          # worktop --------------------------------------------------------
          'counter' => {
            'on'        => false,
            't'         => 20.0,
            'front_oh'  => 20.0,
            'back_oh'   => 0.0,
            'oh_l'      => 0.0,
            'oh_r'      => 0.0,
            'edge'      => 'square',   # square | bevel | bullnose | mitred
            'edge_size' => 3.0,
            'mitre_t'   => 60.0,
            'splash'    => { 'on' => false, 'h' => 60.0, 't' => 18.0 },
            'waterfall_l' => false,
            'waterfall_r' => false
          },

          'sink' => {
            'on'      => false,
            'mount'   => 'undermount', # undermount | topmount | integrated | vessel
            'w'       => 800.0,
            'd'       => 450.0,
            'bowl_d'  => 200.0,
            'bowls'   => 1,
            'drainer' => false,
            'dx'      => 0.0,          # offset from unit centre
            'dy'      => 0.0,
            'tap'     => true,
            'tap_h'   => 300.0
          },

          'hob' => {
            'on'      => false,
            'kind'    => 'gas',        # gas | induction | ceramic | domino
            'w'       => 580.0,
            'd'       => 500.0,
            'burners' => 4,
            'dx'      => 0.0,
            'dy'      => 0.0
          },

          # materials (keys resolved by Core::Materials) --------------------
          'materials' => {
            'carcass'    => 'ply_18_natural',
            'front'      => 'lacquer_white',
            'back'       => 'hdf_white',
            'shelf'      => 'ply_18_natural',
            'counter'    => 'quartz_white',
            'drawer_box' => 'ply_15_natural',
            'plinth'     => 'pvc_black',
            'hardware'   => 'ss_brushed',
            'glass'      => 'glass_clear'
          },

          # presentation ---------------------------------------------------
          'hood_style' => 'chimney',   # chimney | island | integrated | wall_box
          'open' => { 'doors' => 0.0, 'drawers' => 0.0, 'lifts' => 0.0 },
          'explode' => 0.0,

          'meta' => { 'code' => '', 'room' => '', 'note' => '', 'qty' => 1 }
        }
      end

      # A single row of the front stack.
      def row(kind, extra = {})
        base = {
          'kind'   => kind,      # Const::FRONT_KINDS
          'h'      => 0.0,       # 0 => share the remaining height
          'cols'   => 1,
          'hinge'  => 'left',    # left | right | top | bottom ; doors2 alternates
          'style'  => nil,       # nil => inherit front.style
          'lift'   => 'hf',
          'panels' => 2,         # sliding / bifold leaves
          'appl'   => nil,       # appliance key when kind == 'appliance'
          'appl_integrated' => true,
          'block'  => '',        # path or definition name of an external component
          'drawer' => {
            'box'      => true,
            'runner'   => 'tandem',
            'box_h'    => 0.0,   # 0 => derived from front height
            'insert'   => 'none' # cutlery_tray | wire_basket | plate_rack | none
          },
          'note'   => ''
        }
        Util.deep_merge(base, stringify(extra))
      end

      # ------------------------------------------------------------------
      # Per-type presets. Each returns only the deltas from base_defaults.
      # ------------------------------------------------------------------
      def preset(type)
        w, h, d = Const::ENVELOPE[type] || Const::ENVELOPE['base']
        common = { 'type' => type, 'w' => w.to_f, 'h' => h.to_f, 'd' => d.to_f,
                   'family' => family_of(type) }

        specific =
          case type
          when 'base'
            { 'rows' => [row('drawer', 'h' => 140.0), row('door')],
              'counter' => { 'on' => true, 't' => 30.0 },
              'interior' => { 'shelves' => 1 } }

          when 'base_sink'
            { 'rows' => [row('drawer', 'h' => 140.0, 'note' => 'dummy front',
                             'drawer' => { 'box' => false }),
                         row('doors2', 'cols' => 2)],
              'counter' => { 'on' => true, 't' => 30.0 },
              'sink' => { 'on' => true },
              'interior' => { 'shelves' => 0,
                              'accessories' => [accessory('waste_bin', 'count' => 2)] } }

          when 'base_hob'
            { 'rows' => [row('drawer', 'h' => 180.0), row('drawer', 'h' => 0.0)],
              'counter' => { 'on' => true, 't' => 30.0 },
              'hob' => { 'on' => true },
              'interior' => { 'shelves' => 0 } }

          when 'base_corner'
            { 'w' => 900.0, 'rows' => [row('door', 'hinge' => 'right')],
              'counter' => { 'on' => true, 't' => 30.0 },
              'corner' => { 'mode' => 'blind', 'blind_w' => 300.0, 'side' => 'left' },
              'interior' => { 'shelves' => 1,
                              'accessories' => [accessory('magic_corner')] } }

          when 'base_appliance'
            { 'rows' => [row('appliance', 'appl' => 'dishwasher', 'appl_integrated' => true)],
              'counter' => { 'on' => true, 't' => 30.0 },
              'interior' => { 'shelves' => 0 },
              'top_mode' => 'rails', 'bottom_mode' => 'none' }

          when 'drawer_bank'
            { 'rows' => [row('drawer', 'h' => 180.0), row('drawer', 'h' => 180.0),
                         row('drawer', 'h' => 180.0), row('drawer', 'h' => 0.0)],
              'counter' => { 'on' => true, 't' => 30.0 },
              'interior' => { 'shelves' => 0 } }

          when 'tall'
            { 'rows' => [row('door', 'h' => 1250.0), row('door', 'h' => 0.0)],
              'interior' => { 'shelves' => 4 } }

          when 'wall'
            { 'rows' => [row('door')], 'interior' => { 'shelves' => 1 },
              'top_mode' => 'full' }

          when 'wall_lift'
            { 'rows' => [row('lift', 'lift' => 'hf', 'hinge' => 'top')],
              'interior' => { 'shelves' => 1 }, 'top_mode' => 'full' }

          when 'wall_open'
            { 'rows' => [row('open')], 'interior' => { 'shelves' => 2 },
              'top_mode' => 'full', 'back_mode' => 'none' }

          when 'island'
            { 'rows' => [row('drawer', 'h' => 160.0), row('doors2', 'cols' => 2)],
              'counter' => { 'on' => true, 't' => 30.0, 'back_oh' => 300.0,
                             'oh_l' => 20.0, 'oh_r' => 20.0 },
              'interior' => { 'shelves' => 1 } }

          when 'hood'
            { 'rows' => [], 'top_mode' => 'none', 'bottom_mode' => 'none',
              'back_mode' => 'none', 'hood_style' => 'chimney',
              'plinth' => { 'mode' => 'none', 'h' => 0.0 } }

          when 'vanity'
            { 'rows' => [row('doors2', 'cols' => 2)],
              'plinth' => { 'mode' => 'panel', 'h' => 110.0, 'setback' => 40.0 },
              'counter' => { 'on' => true, 't' => 20.0 },
              'sink' => { 'on' => true, 'mount' => 'undermount', 'w' => 500.0, 'd' => 380.0 },
              'materials' => { 'carcass' => 'polywood_18', 'front' => 'polywood_18' },
              'interior' => { 'shelves' => 1 } }

          when 'vanity_wall'
            { 'rows' => [row('drawer', 'h' => 0.0)],
              'counter' => { 'on' => true },
              'sink' => { 'on' => true, 'mount' => 'undermount', 'w' => 500.0, 'd' => 380.0 },
              'plinth' => { 'mode' => 'none', 'h' => 0.0 },
              'materials' => { 'carcass' => 'polywood_18', 'front' => 'polywood_18' },
              'interior' => { 'shelves' => 0 } }

          when 'vanity_open'
            { 'rows' => [row('open')],
              'counter' => { 'on' => true },
              'sink' => { 'on' => true, 'mount' => 'vessel', 'w' => 420.0, 'd' => 420.0 },
              'plinth' => { 'mode' => 'none', 'h' => 0.0 },
              'interior' => { 'shelves' => 1 } }

          when 'mirror_unit'
            { 'rows' => [row('door', 'style' => 'glass_full')],
              'plinth' => { 'mode' => 'none', 'h' => 0.0 },
              'interior' => { 'shelves' => 2 },
              'front' => { 'glass' => { 'type' => 'mirror', 'frame' => 'none' } } }

          when 'tallboy'
            { 'rows' => [row('door')], 'interior' => { 'shelves' => 4 },
              'plinth' => { 'mode' => 'panel', 'h' => 100.0, 'setback' => 40.0 },
              'materials' => { 'carcass' => 'polywood_18', 'front' => 'polywood_18' } }

          when 'wardrobe'
            { 'rows' => [row('doors2', 'cols' => 2)],
              'plinth' => { 'mode' => 'panel', 'h' => 100.0, 'setback' => 40.0 },
              'interior' => {
                'shelves' => 1, 'shelf_setback' => 20.0,
                'accessories' => [accessory('hanging_rail', 'z' => 1650.0),
                                  accessory('led_strip', 'z' => 2280.0)]
              } }

          when 'wardrobe_sliding'
            { 'rows' => [row('sliding', 'panels' => 2)],
              'd' => 650.0,
              'plinth' => { 'mode' => 'panel', 'h' => 100.0, 'setback' => 40.0 },
              'front' => { 'mode' => 'overlay_full', 'gap' => 0.0 },
              'interior' => {
                'shelves' => 2, 'dividers' => 1,
                'accessories' => [accessory('hanging_rail', 'z' => 1650.0)]
              } }

          when 'dressing_open'
            { 'rows' => [row('open')],
              'back_mode' => 'applied',
              'plinth' => { 'mode' => 'panel', 'h' => 100.0, 'setback' => 40.0 },
              'interior' => {
                'shelves' => 2, 'dividers' => 1,
                'accessories' => [accessory('hanging_rail', 'z' => 1000.0),
                                  accessory('hanging_rail', 'z' => 2000.0),
                                  accessory('led_strip', 'z' => 2280.0)]
              } }

          when 'corner_wardrobe'
            { 'rows' => [row('door', 'hinge' => 'left')],
              'plinth' => { 'mode' => 'panel', 'h' => 100.0, 'setback' => 40.0 },
              'corner' => { 'mode' => 'l', 'return_w' => 1000.0, 'return_d' => 600.0 },
              'interior' => { 'shelves' => 2,
                              'accessories' => [accessory('hanging_rail', 'z' => 1650.0)] } }

          when 'shoe_unit'
            { 'rows' => [row('flap', 'h' => 380.0), row('flap', 'h' => 380.0),
                         row('flap', 'h' => 0.0)],
              'plinth' => { 'mode' => 'panel', 'h' => 100.0, 'setback' => 40.0 },
              'interior' => { 'shelves' => 0,
                              'accessories' => [accessory('shoe_shelf', 'count' => 3, 'angle' => 15.0)] } }

          when 'island_dresser'
            { 'rows' => [row('drawer', 'h' => 160.0), row('drawer', 'h' => 160.0),
                         row('drawer', 'h' => 0.0)],
              'counter' => { 'on' => true, 'oh_l' => 20.0, 'oh_r' => 20.0 },
              'interior' => { 'shelves' => 0,
                              'accessories' => [accessory('jewellery_drawer')] } }
          else
            {}
          end

        Util.deep_merge(common, specific)
      end

      def accessory(type, extra = {})
        base = {
          'type'  => type,
          'z'     => 0.0,     # height from inside floor of the carcass (mm)
          'x'     => 0.0,     # from inside left (mm); 0 with w=0 means full width
          'w'     => 0.0,     # 0 => full inside width
          'count' => 1,
          'angle' => 0.0,
          'depth' => 0.0,     # 0 => derived
          'note'  => ''
        }
        Util.deep_merge(base, stringify(extra))
      end

      def defaults(type = 'base')
        Util.deep_merge(base_defaults, preset(type))
      end

      def family_of(type)
        Const::FAMILIES.each { |family, types| return family if types.include?(type) }
        'kitchen'
      end

      # ------------------------------------------------------------------
      # Coercion + sanity clamps. The dialog sends strings; the model may hold
      # params written by an older schema.
      # ------------------------------------------------------------------
      def normalize(raw)
        params = Util.deep_merge(defaults(raw['type'] || 'base'), stringify(raw))

        params['w'] = Util.clamp(Util.num(params['w'], 600.0), 80.0, 6000.0)
        params['h'] = Util.clamp(Util.num(params['h'], 720.0), 80.0, 3600.0)
        params['d'] = Util.clamp(Util.num(params['d'], 560.0), 60.0, 1500.0)

        %w[panel_t front_t back_t shelf_t rail_w back_inset].each do |key|
          params[key] = Util.clamp(Util.num(params[key], 18.0), 1.0, 100.0)
        end
        params['scribe'] = Util.clamp(Util.num(params['scribe'], 20.0), 0.0, 200.0)
        params['side_mode'] = 'full' unless %w[full scribe].include?(params['side_mode'])

        plinth = params['plinth']
        plinth['h']       = Util.clamp(Util.num(plinth['h'], 100.0), 0.0, 400.0)
        plinth['setback'] = Util.clamp(Util.num(plinth['setback'], 50.0), 0.0, 200.0)
        plinth['leg_dia'] = Util.clamp(Util.num(plinth['leg_dia'], 40.0), 10.0, 120.0)
        plinth['returns'] = Util.bool(plinth['returns'], false)
        plinth['led']     = Util.bool(plinth['led'], false)
        plinth['shadow']  = Util.clamp(Util.num(plinth['shadow'], 0.0), 0.0, 200.0)
        plinth['mode']    = 'panel' unless %w[panel legs floating wall_hung none].include?(plinth['mode'])
        plinth['h']       = 0.0 if %w[none wall_hung].include?(plinth['mode'])

        front = params['front']
        front['gap']        = Util.clamp(Util.num(front['gap'], 3.0), 0.0, 30.0)
        front['reveal_top'] = Util.num(front['reveal_top'], 0.0)
        front['radius']     = Util.clamp(Util.num(front['radius'], 0.0), 0.0, 40.0)
        front['show_hinges'] = Util.bool(front['show_hinges'], true)
        front['hinge_type'] = 'blumotion_110' unless Const::HINGE_TYPES.include?(front['hinge_type'])
        front['mode']       = 'overlay_full' unless Const::OVERLAY_MODES.include?(front['mode'])
        front['style']      = 'slab' unless Const::DOOR_STYLES.include?(front['style'])
        %w[rail panel_t panel_inset].each { |k| front['shaker'][k] = Util.num(front['shaker'][k], 10.0) }
        %w[frame_w frame_t glass_t].each { |k| front['glass'][k] = Util.num(front['glass'][k], 20.0) }
        handle = front['handle']
        handle['type'] = 'none' unless Const::HANDLE_TYPES.include?(handle['type'])
        %w[length proj dia offset].each { |k| handle[k] = Util.num(handle[k], 0.0) }

        params['rows'] = Array(params['rows']).map { |r| normalize_row(r) }
        params['rows'] = [row('door')] if params['rows'].empty? && params['type'] != 'hood'

        interior = params['interior']
        interior['shelves']       = Util.clamp(Util.int(interior['shelves'], 0), 0, 30)
        interior['dividers']      = Util.clamp(Util.int(interior['dividers'], 0), 0, 12)
        interior['shelf_setback'] = Util.num(interior['shelf_setback'], 20.0)
        interior['divider_at']    = Array(interior['divider_at']).map { |v| Util.num(v) }
        interior['accessories']   = Array(interior['accessories']).map do |acc|
          normalized = Util.deep_merge(accessory('shelf'), stringify(acc))
          normalized['type']  = 'shelf' unless Const::INTERIOR_ACCESSORIES.include?(normalized['type'])
          %w[z x w angle depth].each { |k| normalized[k] = Util.num(normalized[k], 0.0) }
          normalized['count'] = Util.clamp(Util.int(normalized['count'], 1), 1, 40)
          normalized
        end

        corner = params['corner']
        corner['mode'] = 'blind' unless %w[blind diagonal l].include?(corner['mode'])
        corner['side'] = 'left'  unless %w[left right].include?(corner['side'])
        corner['blind_w']  = Util.clamp(Util.num(corner['blind_w'], 300.0), 0.0, params['w'] - 100.0)
        corner['return_w'] = Util.clamp(Util.num(corner['return_w'], 900.0), 200.0, 3000.0)
        corner['return_d'] = Util.clamp(Util.num(corner['return_d'], 560.0), 200.0, 1200.0)
        corner['front_b']  = Util.bool(corner['front_b'], true)

        counter = params['counter']
        counter['on'] = Util.bool(counter['on'], false)
        counter['on'] = false unless Const::WORKTOP_TYPES.include?(params['type'])
        %w[t front_oh back_oh oh_l oh_r edge_size mitre_t].each { |k| counter[k] = Util.num(counter[k], 0.0) }
        counter['t'] = 12.0 if counter['t'] < 6.0
        counter['splash']['on'] = Util.bool(counter['splash']['on'], false)
        counter['splash']['h']  = Util.num(counter['splash']['h'], 60.0)
        counter['splash']['t']  = Util.num(counter['splash']['t'], 18.0)
        counter['waterfall_l']  = Util.bool(counter['waterfall_l'], false)
        counter['waterfall_r']  = Util.bool(counter['waterfall_r'], false)

        sink = params['sink']
        sink['on'] = Util.bool(sink['on'], false) && counter['on']
        %w[w d bowl_d dx dy tap_h].each { |k| sink[k] = Util.num(sink[k], 0.0) }
        sink['bowls'] = Util.clamp(Util.int(sink['bowls'], 1), 1, 3)
        sink['tap']   = Util.bool(sink['tap'], true)
        sink['drainer'] = Util.bool(sink['drainer'], false)

        hob = params['hob']
        hob['on'] = Util.bool(hob['on'], false) && counter['on']
        %w[w d dx dy].each { |k| hob[k] = Util.num(hob[k], 0.0) }
        hob['burners'] = Util.clamp(Util.int(hob['burners'], 4), 1, 6)

        unless %w[chimney island integrated wall_box].include?(params['hood_style'])
          params['hood_style'] = 'chimney'
        end

        open = params['open']
        open['doors']   = Util.clamp(Util.num(open['doors'], 0.0), 0.0, 130.0)
        open['drawers'] = Util.clamp(Util.num(open['drawers'], 0.0), 0.0, 100.0)
        open['lifts']   = Util.clamp(Util.num(open['lifts'], 0.0), 0.0, 100.0)
        params['explode'] = Util.clamp(Util.num(params['explode'], 0.0), 0.0, 600.0)

        params['style'] = 'modern' unless Styles::SPECS.key?(params['style'])
        params['meta']['qty'] = Util.clamp(Util.int(params['meta']['qty'], 1), 1, 999)
        params['name'] = auto_name(params) if params['name'].to_s.strip.empty?
        params['schema'] = Const::SCHEMA
        params
      end

      def normalize_row(raw)
        normalized = Util.deep_merge(row('door'), stringify(raw))
        normalized['kind']  = 'door' unless Const::FRONT_KINDS.include?(normalized['kind'])
        normalized['h']     = Util.clamp(Util.num(normalized['h'], 0.0), 0.0, 3000.0)
        normalized['cols']  = Util.clamp(Util.int(normalized['cols'], 1), 1, 8)
        normalized['panels']= Util.clamp(Util.int(normalized['panels'], 2), 1, 6)
        normalized['hinge'] = 'left' unless Const::HINGE_SIDES.include?(normalized['hinge'])
        normalized['lift']  = 'hf' unless Const::LIFT_SYSTEMS.key?(normalized['lift'])
        normalized['cols']  = 2 if normalized['kind'] == 'doors2' && normalized['cols'] < 2
        if normalized['kind'] == 'appliance'
          normalized['appl'] = 'oven' unless Const::APPLIANCES.key?(normalized['appl'])
          normalized['appl_integrated'] = Util.bool(normalized['appl_integrated'], true)
        end
        normalized['drawer']['box']   = Util.bool(normalized['drawer']['box'], true)
        normalized['drawer']['box_h'] = Util.num(normalized['drawer']['box_h'], 0.0)
        unless Const::RUNNER_TYPES.key?(normalized['drawer']['runner'])
          normalized['drawer']['runner'] = 'tandem'
        end
        normalized
      end

      # Cabinet code in the convention used on shop drawings: B-600, W-800,
      # T-600, WR-1000 ...
      def auto_name(params)
        prefix = {
          'base' => 'B', 'base_sink' => 'BS', 'base_hob' => 'BH', 'base_corner' => 'BC',
          'base_appliance' => 'BA', 'drawer_bank' => 'BD', 'tall' => 'T',
          'wall' => 'W', 'wall_lift' => 'WL', 'wall_open' => 'WO', 'island' => 'IS',
          'hood' => 'HD', 'vanity' => 'V', 'vanity_wall' => 'VW', 'vanity_open' => 'VO',
          'mirror_unit' => 'MR', 'tallboy' => 'TB', 'wardrobe' => 'WR',
          'wardrobe_sliding' => 'WS', 'dressing_open' => 'DO',
          'corner_wardrobe' => 'WC', 'shoe_unit' => 'SH', 'island_dresser' => 'ID'
        }[params['type']] || 'U'
        format('%s-%d', prefix, params['w'].round)
      end

      def stringify(object)
        case object
        when Hash
          object.each_with_object({}) { |(k, v), h| h[k.to_s] = stringify(v) }
        when Array
          object.map { |v| stringify(v) }
        when Symbol
          object.to_s
        else
          object
        end
      end
    end
  end
end
