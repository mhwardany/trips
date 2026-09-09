# frozen_string_literal: true

module AHW
  module KD
    module Builders
      # The box: gables, top, bottom, back, plinth, shelves and dividers.
      module Carcass
        module_function

        def build(entities, model, layout)
          group = Geom3.group_with(entities, 'Carcass')
          ents = group.entities

          sides(ents, model, layout)
          bottom(ents, model, layout)
          top(ents, model, layout)
          back(ents, model, layout)
          dividers(ents, model, layout)
          shelves(ents, model, layout)
          plinth(entities, model, layout)
          blind_panel(entities, model, layout) if blind?(layout.params)
          group
        end

        def blind?(params)
          params['type'] == 'base_corner' && params['corner']['mode'] == 'blind'
        end

        # ---------------------------------------------------------- gables
        def sides(ents, model, layout)
          material = layout.material('carcass')
          depth = layout.d
          height = layout.h

          [['Side L', 0.0], ['Side R', layout.w - layout.t]].each do |name, x|
            Geom3.part(ents, model,
                       name: name, part: 'Gable', material: material,
                       x: x, y: 0.0, z: layout.z0,
                       w: layout.t, d: depth, h: height,
                       length: height, width: depth, thick: layout.t,
                       grain: 'height', edges: 'front')
          end
        end

        def bottom(ents, model, layout)
          return if layout.bottom_t <= 0.0

          Geom3.part(ents, model,
                     name: 'Bottom', part: 'Bottom', material: layout.material('carcass'),
                     x: layout.inner_x0, y: 0.0, z: layout.z0,
                     w: layout.inner_w, d: layout.d, h: layout.t,
                     length: layout.inner_w, width: layout.d, thick: layout.t,
                     edges: 'front')
        end

        def top(ents, model, layout)
          case layout.params['top_mode']
          when 'full'
            Geom3.part(ents, model,
                       name: 'Top', part: 'Top', material: layout.material('carcass'),
                       x: layout.inner_x0, y: 0.0, z: layout.z1 - layout.t,
                       w: layout.inner_w, d: layout.d, h: layout.t,
                       length: layout.inner_w, width: layout.d, thick: layout.t,
                       edges: 'front')
          when 'rails'
            rail_w = layout.params['rail_w'].to_f
            back_y = layout.cavity_y0
            [['Rail Back', back_y], ['Rail Front', layout.d - rail_w]].each do |name, y|
              Geom3.part(ents, model,
                         name: name, part: 'Rail', material: layout.material('carcass'),
                         x: layout.inner_x0, y: y, z: layout.z1 - layout.t,
                         w: layout.inner_w, d: rail_w, h: layout.t,
                         length: layout.inner_w, width: rail_w, thick: layout.t)
            end
          end
        end

        def back(ents, model, layout)
          mode = layout.params['back_mode']
          return if mode == 'none' || layout.back_t <= 0.0

          if mode == 'applied'
            x = 0.0
            width = layout.w
            z = layout.z0
            height = layout.h
          else
            groove = mode == 'grooved' ? 6.0 : 0.0
            x = layout.inner_x0 - groove
            width = layout.inner_w + 2 * groove
            z = layout.inner_z0 - groove
            height = (layout.inner_z1 + groove) - z
          end

          Geom3.part(ents, model,
                     name: 'Back', part: 'Back', material: layout.material('back'),
                     x: x, y: layout.back_y0, z: z,
                     w: width, d: layout.back_t, h: height,
                     length: height, width: width, thick: layout.back_t,
                     grain: 'height')
        end

        # ------------------------------------------------------- divisions
        # Vertical partitions split the carcass into bays; shelves are then
        # generated per bay so a dressing module reads correctly.
        def bay_edges(layout)
          count = layout.params['interior']['dividers'].to_i
          explicit = layout.params['interior']['divider_at']
          edges = [layout.inner_x0]

          positions =
            if !explicit.empty?
              explicit.map { |v| layout.inner_x0 + v.to_f }
            elsif count.positive?
              step = layout.inner_w / (count + 1).to_f
              (1..count).map { |i| layout.inner_x0 + step * i - layout.t / 2.0 }
            else
              []
            end

          positions.each do |x|
            x = Util.clamp(x, layout.inner_x0, layout.inner_x1 - layout.t)
            edges << x << x + layout.t
          end
          edges << layout.inner_x1
          edges
        end

        def bays(layout)
          edges = bay_edges(layout)
          result = []
          index = 0
          while index < edges.size - 1
            x0 = edges[index]
            x1 = edges[index + 1]
            result << [x0, x1 - x0] if x1 - x0 > 1.0
            index += 2
          end
          result
        end

        def dividers(ents, model, layout)
          edges = bay_edges(layout)
          index = 1
          while index < edges.size - 2
            x = edges[index]
            Geom3.part(ents, model,
                       name: 'Divider', part: 'Divider', material: layout.material('carcass'),
                       x: x, y: layout.cavity_y0, z: layout.inner_z0,
                       w: layout.t, d: layout.cavity_y1 - layout.cavity_y0, h: layout.inner_h,
                       length: layout.inner_h, width: layout.cavity_y1 - layout.cavity_y0,
                       thick: layout.t, grain: 'height', edges: 'front')
            index += 2
          end
        end

        def shelves(ents, model, layout)
          count = layout.params['interior']['shelves'].to_i
          return if count <= 0

          setback = layout.params['interior']['shelf_setback'].to_f
          depth = (layout.cavity_y1 - setback) - layout.cavity_y0
          return if depth <= 20.0

          spacing = layout.inner_h / (count + 1).to_f
          bays(layout).each do |(x, width)|
            (1..count).each do |i|
              z = layout.inner_z0 + spacing * i - layout.shelf_t / 2.0
              Geom3.part(ents, model,
                         name: 'Shelf', part: 'Shelf', material: layout.material('shelf'),
                         x: x, y: layout.cavity_y0, z: z,
                         w: width, d: depth, h: layout.shelf_t,
                         length: width, width: depth, thick: layout.shelf_t,
                         edges: 'front')
            end
          end
        end

        # ---------------------------------------------------------- plinth
        def plinth(entities, model, layout)
          mode = layout.params['plinth']['mode']
          height = layout.plinth_h
          return if mode == 'none' || height <= 0.0

          group = Geom3.group_with(entities, 'Plinth')
          ents = group.entities
          setback = layout.params['plinth']['setback'].to_f
          face_y = layout.front_y1 - setback

          case mode
          when 'legs'
            radius = layout.params['plinth']['leg_dia'].to_f / 2.0
            inset = 60.0
            [[inset, inset], [layout.w - inset, inset],
             [inset, layout.d - inset], [layout.w - inset, layout.d - inset]].each do |(x, y)|
              leg = Geom3.group_with(ents, 'Leg')
              Geom3.cylinder(leg.entities, [x, y, 0.0], radius, height, :z, 16)
              Geom3.finish_part(leg, model,
                                name: 'Leg', part: 'Leg', material: 'black_matt',
                                length: height, width: radius * 2, thick: radius * 2,
                                dims: [radius * 2, radius * 2, height])
            end
            Geom3.part(ents, model,
                       name: 'Plinth Front', part: 'Plinth', material: layout.material('plinth'),
                       x: 0.0, y: face_y - layout.t, z: 0.0,
                       w: layout.w, d: layout.t, h: height,
                       length: layout.w, width: height, thick: layout.t, edges: 'top')
          when 'floating'
            shadow = layout.params['plinth']['shadow'].to_f
            body = height - shadow
            return if body <= 5.0

            Geom3.part(ents, model,
                       name: 'Plinth Box', part: 'Plinth', material: layout.material('plinth'),
                       x: 40.0, y: 40.0, z: 0.0,
                       w: layout.w - 80.0, d: layout.d - 80.0, h: body,
                       length: layout.w - 80.0, width: body, thick: layout.t)
          else # panel
            Geom3.part(ents, model,
                       name: 'Plinth Front', part: 'Plinth', material: layout.material('plinth'),
                       x: 0.0, y: face_y - layout.t, z: 0.0,
                       w: layout.w, d: layout.t, h: height,
                       length: layout.w, width: height, thick: layout.t, edges: 'top')
            # side returns only where the unit ends a run
            if layout.params['plinth']['returns']
              [0.0, layout.w - layout.t].each do |x|
                Geom3.part(ents, model,
                           name: 'Plinth Side', part: 'Plinth', material: layout.material('plinth'),
                           x: x, y: 0.0, z: 0.0,
                           w: layout.t, d: face_y - layout.t, h: height,
                           length: face_y, width: height, thick: layout.t)
              end
            end
          end
          group
        end

        # A blind corner's dead width is closed with a fixed panel so the
        # elevation reads correctly.
        def blind_panel(entities, model, layout)
          width = layout.params['corner']['blind_w'].to_f
          return if width <= 10.0

          x = layout.params['corner']['side'] == 'left' ? 0.0 : layout.w - width
          Geom3.part(entities, model,
                     name: 'Blind Panel', part: 'Blind Panel', material: layout.material('front'),
                     x: x, y: layout.front_y0, z: layout.z0,
                     w: width, d: layout.front_t, h: layout.h,
                     length: layout.h, width: width, thick: layout.front_t,
                     grain: 'height', edges: 'all')
        end
      end
    end
  end
end
