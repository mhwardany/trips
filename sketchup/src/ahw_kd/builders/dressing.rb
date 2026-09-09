# frozen_string_literal: true

module AHW
  module KD
    module Builders
      # Whole dressing rooms, not just single wardrobes. Give it the room
      # dimensions and it lays a run of modules along each wall, divides them
      # into a sensible mix of hanging, shelving and drawers, and turns the
      # corners without the modules clashing.
      #
      # Wall A runs along +X at y = 0. Wall B is the left return (x = 0,
      # running into the room). Wall C is the right return (x = wall_a).
      module DressingRoom
        DEFAULTS = {
          'layout'    => 'l_shape',   # single | l_shape | u_shape | walk_in
          'wall_a'    => 3200.0,
          'wall_b'    => 2600.0,
          'wall_c'    => 2600.0,
          'h'         => 2300.0,
          'd'         => 600.0,
          'module_w'  => 1000.0,
          'template'  => 'balanced',  # balanced | hanging | shelving | drawers
          'doors'     => 'hinged',    # hinged | sliding | open
          'style'     => 'modern',
          'plinth_h'  => 100.0,
          'island'    => true,        # walk_in only
          'island_w'  => 1400.0,
          'island_d'  => 700.0,
          'name'      => 'Dressing'
        }.freeze

        module_function

        def defaults
          Util.deep_dup(DEFAULTS)
        end

        def normalize(raw)
          spec = Util.deep_merge(defaults, Params.stringify(raw || {}))
          spec['layout'] = 'l_shape' unless Const::DRESSING_LAYOUTS.include?(spec['layout'])
          spec['template'] = 'balanced' unless %w[balanced hanging shelving drawers]
                                               .include?(spec['template'])
          spec['doors'] = 'hinged' unless %w[hinged sliding open].include?(spec['doors'])
          spec['style'] = 'modern' unless Styles::SPECS.key?(spec['style'])
          %w[wall_a wall_b wall_c h d module_w plinth_h island_w island_d].each do |key|
            spec[key] = Util.num(spec[key], DEFAULTS[key])
          end
          spec['wall_a']   = Util.clamp(spec['wall_a'], 400.0, 20_000.0)
          spec['wall_b']   = Util.clamp(spec['wall_b'], 400.0, 20_000.0)
          spec['wall_c']   = Util.clamp(spec['wall_c'], 400.0, 20_000.0)
          spec['h']        = Util.clamp(spec['h'], 800.0, 3400.0)
          spec['d']        = Util.clamp(spec['d'], 300.0, 1200.0)
          spec['module_w'] = Util.clamp(spec['module_w'], 300.0, 1500.0)
          spec['island']   = Util.bool(spec['island'], true)
          spec
        end

        # How many modules a run needs, and how wide each one is.
        def divide(length, target)
          return [] if length < 200.0

          count = (length / target).round
          count = 1 if count < 1
          count += 1 while length / count > 1200.0
          width = length / count.to_f
          Array.new(count) { width }
        end

        # The interior mix. A dressing room that is all hanging is useless, so
        # the balanced template cycles through the three module kinds.
        def module_kind(template, index)
          return template unless template == 'balanced'

          %w[hanging shelving drawers hanging][index % 4]
        end

        def module_params(spec, width, kind, index)
          params = Params.defaults(spec['doors'] == 'sliding' ? 'wardrobe_sliding' : 'wardrobe')
          params['w'] = width
          params['h'] = spec['h'] - spec['plinth_h']
          params['d'] = spec['d']
          params['plinth']['h'] = spec['plinth_h']
          params['plinth']['mode'] = spec['plinth_h'] <= 1.0 ? 'none' : 'panel'
          params['meta']['room'] = spec['name']
          params['name'] = format('%s-%02d', kind[0, 2].upcase, index + 1)

          inner_h = params['h'] - 2 * params['panel_t']

          case kind
          when 'hanging'
            params['rows'] = front_rows(spec, width)
            params['interior'] = Util.deep_merge(params['interior'], {
              'shelves' => 1, 'dividers' => 0,
              'accessories' => [
                Params.accessory('hanging_rail', 'z' => inner_h * 0.46),
                Params.accessory('hanging_rail', 'z' => inner_h * 0.94),
                Params.accessory('led_strip', 'z' => inner_h - 20.0)
              ]
            })
          when 'shelving'
            params['rows'] = front_rows(spec, width)
            params['interior'] = Util.deep_merge(params['interior'], {
              'shelves' => 5, 'dividers' => width > 900 ? 1 : 0,
              'accessories' => [Params.accessory('led_strip', 'z' => inner_h - 20.0)]
            })
          when 'drawers'
            params['rows'] = [Params.row('drawer', 'h' => 0.0),
                              Params.row('drawer', 'h' => 200.0),
                              Params.row('drawer', 'h' => 200.0),
                              Params.row('door', 'h' => inner_h * 0.45)]
            params['interior'] = Util.deep_merge(params['interior'], {
              'shelves' => 0, 'dividers' => 0,
              'accessories' => [
                Params.accessory('hanging_rail', 'z' => inner_h * 0.92),
                Params.accessory('jewellery_drawer', 'z' => 200.0)
              ]
            })
          end

          Params.normalize(Styles.apply(params, spec['style']))
        end

        def front_rows(spec, width)
          case spec['doors']
          when 'open'    then [Params.row('open')]
          when 'sliding' then [Params.row('sliding', 'panels' => width > 1400 ? 3 : 2)]
          else [Params.row('doors2', 'cols' => width > 700 ? 2 : 1)]
          end
        end

        # ------------------------------------------------------------------
        # Placement. Each run knows its own transformation, so the modules sit
        # against the right wall facing into the room.
        def runs(spec)
          list = []
          depth = spec['d']

          widths = divide(spec['wall_a'], spec['module_w'])
          cursor = 0.0
          widths.each_with_index do |width, index|
            list << { 'wall' => 'A', 'w' => width, 'index' => index,
                      'rotate' => 0.0, 'x' => cursor, 'y' => 0.0 }
            cursor += width
          end

          if %w[l_shape u_shape walk_in].include?(spec['layout'])
            # left return starts clear of wall A's depth
            length = spec['wall_b'] - depth
            cursor = spec['wall_b']
            divide(length, spec['module_w']).each_with_index do |width, index|
              list << { 'wall' => 'B', 'w' => width, 'index' => index,
                        'rotate' => -90.0, 'x' => 0.0, 'y' => cursor }
              cursor -= width
            end
          end

          if %w[u_shape walk_in].include?(spec['layout'])
            length = spec['wall_c'] - depth
            cursor = depth
            divide(length, spec['module_w']).each_with_index do |width, index|
              list << { 'wall' => 'C', 'w' => width, 'index' => index,
                        'rotate' => 90.0, 'x' => spec['wall_a'], 'y' => cursor }
              cursor += width
            end
          end

          list
        end

        def build(model, raw, origin = nil)
          spec = normalize(raw)
          origin ||= ORIGIN
          room = model.active_entities.add_group
          room.name = "AHW #{spec['name']} #{spec['layout']}"
          created = []

          runs(spec).each do |run|
            kind = module_kind(spec['template'], run['index'])
            params = module_params(spec, run['w'], kind, run['index'])
            params['meta']['code'] = "#{spec['name'][0, 3].upcase}-#{run['wall']}#{run['index'] + 1}"

            transformation =
              ::Geom::Transformation.translation(
                ::Geom::Vector3d.new(Util.mm(run['x']), Util.mm(run['y']), 0)
              ) * ::Geom::Transformation.rotation(
                ORIGIN, ::Geom::Vector3d.new(0, 0, 1), run['rotate'].degrees
              )
            created << Unit.create(model, params, transformation, room.entities)
          end

          created << island(model, spec, room) if spec['layout'] == 'walk_in' && spec['island']

          room.transform!(::Geom::Transformation.translation(origin - ORIGIN)) if origin != ORIGIN
          dict = room.attribute_dictionary(Const::DICT, true)
          dict[Const::ATTR_KIND] = 'room'
          dict['layout'] = spec['layout']
          dict['modules'] = created.size
          [room, created.compact]
        end

        def island(model, spec, room)
          params = Params.defaults('island_dresser')
          params['w'] = spec['island_w']
          params['d'] = spec['island_d']
          params['h'] = 720.0
          params['meta']['room'] = spec['name']
          params['name'] = 'Island'
          params['interior']['accessories'] = [
            Params.accessory('jewellery_drawer', 'z' => 300.0),
            Params.accessory('watch_box', 'z' => 120.0, 'count' => 4)
          ]
          params = Params.normalize(Styles.apply(params, spec['style']))

          x = (spec['wall_a'] - spec['island_w']) / 2.0
          y = spec['d'] + (spec['wall_b'] - spec['d'] - spec['island_d']) / 2.0
          transformation = ::Geom::Transformation.translation(
            ::Geom::Vector3d.new(Util.mm(x), Util.mm([y, spec['d'] + 300.0].max), 0)
          )
          Unit.create(model, params, transformation, room.entities)
        end
      end
    end
  end
end
