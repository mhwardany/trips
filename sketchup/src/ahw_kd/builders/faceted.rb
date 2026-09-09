# frozen_string_literal: true

module AHW
  module KD
    module Builders
      # Shared machinery for units whose plan is not a rectangle: the diagonal
      # corner and the chamfered end unit. Both are a footprint prism with a
      # front face that sits on an arbitrary line, so both are built from the
      # same three pieces here.
      module Faceted
        module_function

        # Bottom and top panels cut to the footprint.
        def shell(ents, model, layout, points, label = 'Carcass')
          material = layout.material('carcass')
          t = layout.t
          span_x = points.map(&:first).max - points.map(&:first).min
          span_y = points.map(&:last).max - points.map(&:last).min

          if layout.bottom_t.positive?
            bottom = Geom3.group_with(ents, 'Bottom')
            Geom3.prism_z(bottom.entities, points, layout.z0, t)
            Geom3.finish_part(bottom, model, name: 'Bottom', part: 'Bottom',
                                             material: material, dims: [span_x, span_y, t],
                                             length: span_x, width: span_y, thick: t,
                                             note: "#{label} shaped panel")
          end
          return unless layout.top_t.positive?

          top = Geom3.group_with(ents, 'Top')
          Geom3.prism_z(top.entities, points, layout.z1 - t, t)
          Geom3.finish_part(top, model, name: 'Top', part: 'Top',
                                        material: material, dims: [span_x, span_y, t],
                                        length: span_x, width: span_y, thick: t,
                                        note: "#{label} shaped panel")
        end

        # Shelves cut to the same footprint, inset from every edge.
        def shelves(ents, model, layout, points, label = 'shaped')
          count = layout.params['interior']['shelves'].to_i
          return if count <= 0

          inset = layout.t + 4.0
          cx = points.map(&:first).sum / points.size.to_f
          cy = points.map(&:last).sum / points.size.to_f
          shrunk = points.map do |(x, y)|
            dx = x - cx
            dy = y - cy
            len = Math.sqrt(dx * dx + dy * dy)
            len.zero? ? [x, y] : [x - dx / len * inset, y - dy / len * inset]
          end
          span_x = points.map(&:first).max - points.map(&:first).min
          span_y = points.map(&:last).max - points.map(&:last).min
          spacing = layout.inner_h / (count + 1).to_f

          count.times do |i|
            z = layout.inner_z0 + spacing * (i + 1) - layout.shelf_t / 2.0
            shelf = Geom3.group_with(ents, 'Shelf')
            Geom3.prism_z(shelf.entities, shrunk, z, layout.shelf_t)
            Geom3.finish_part(shelf, model, name: 'Shelf', part: 'Shelf',
                                            material: layout.material('shelf'),
                                            dims: [span_x, span_y, layout.shelf_t],
                                            length: span_x, width: span_y,
                                            thick: layout.shelf_t,
                                            note: "#{label} shelf, cut to shape")
          end
        end

        # The front stack drawn flat and then rotated onto the line p1 -> p2.
        # The door's outward face ends up pointing away from the carcass.
        def face_fronts(entities, model, layout, p1, p2, name = 'Fronts')
          dx = p1[0] - p2[0]
          dy = p1[1] - p2[1]
          length = Math.sqrt(dx * dx + dy * dy)
          return if length <= 100.0

          angle = Math.atan2(dy, dx) * 180.0 / Math::PI
          row = layout.params['rows'].first
          leaf_w = length - 2 * layout.gap
          return if leaf_w <= 40.0

          group = Geom3.group_with(entities, name)
          leaf = Panel.build(group.entities, model, layout,
                             name: 'Face Door', part: 'Door',
                             x: layout.gap, y: 0.0, z: layout.z0,
                             w: leaf_w, h: layout.h,
                             style: row ? row['style'] : nil,
                             handle_horizontal: false)
          return group unless leaf

          hinge = row ? row['hinge'] : 'left'
          Fronts.swing!(leaf, hinge, layout.gap, layout.gap + leaf_w,
                        layout.z0, layout.z1, 0.0, layout.params['open']['doors'].to_f)

          Geom3.rotate!(group, ORIGIN, ::Geom::Vector3d.new(0, 0, 1), angle)
          Geom3.move!(group, p2[0], p2[1], 0.0)
          group
        end

        # Worktop cut to the footprint, with the front face pushed out by the
        # overhang along its own normal.
        def face_worktop(entities, model, layout, points, face_index)
          return unless layout.counter?

          spec = layout.params['counter']
          overhang = layout.front_t + spec['front_oh'].to_f
          expanded = offset_edge(points, face_index, overhang)
          span_x = expanded.map(&:first).max - expanded.map(&:first).min
          span_y = expanded.map(&:last).max - expanded.map(&:last).min

          group = Geom3.group_with(entities, 'Worktop')
          Geom3.prism_z(group.entities, expanded, layout.counter_z - spec['t'].to_f, spec['t'].to_f)
          Geom3.finish_part(group, model, name: 'Worktop', part: 'Worktop',
                                          material: layout.material('counter'),
                                          dims: [span_x, span_y, spec['t'].to_f],
                                          length: span_x, width: span_y,
                                          thick: spec['t'].to_f,
                                          note: 'shaped top')
          group
        end

        # Push one edge of a footprint outward along its own normal.
        def offset_edge(points, index, distance)
          a = points[index]
          b = points[(index + 1) % points.size]
          nx = b[1] - a[1]
          ny = -(b[0] - a[0])
          len = Math.sqrt(nx * nx + ny * ny)
          return points if len.zero?

          centre_x = points.map(&:first).sum / points.size.to_f
          centre_y = points.map(&:last).sum / points.size.to_f
          nx = nx / len * distance
          ny = ny / len * distance
          # make sure the normal points away from the middle of the plan
          mid_x = (a[0] + b[0]) / 2.0
          mid_y = (a[1] + b[1]) / 2.0
          if (mid_x + nx - centre_x).abs < (mid_x - centre_x).abs &&
             (mid_y + ny - centre_y).abs < (mid_y - centre_y).abs
            nx = -nx
            ny = -ny
          end

          points.each_with_index.map do |(x, y), i|
            if i == index || i == (index + 1) % points.size
              [x + nx, y + ny]
            else
              [x, y]
            end
          end
        end
      end

      # ------------------------------------------------------------------
      # A chamfered end unit: full width at the back, cut away at one end so
      # the run finishes on an angle instead of a square corner.
      module ChamferUnit
        module_function

        def spec(layout)
          chamfer = layout.params['chamfer']
          [chamfer['side'], chamfer['depth'].to_f, chamfer['front'].to_f]
        end

        def footprint(layout)
          side, depth, front = spec(layout)
          w = layout.w
          d = layout.d
          return [[0.0, 0.0], [w, 0.0], [w, d], [0.0, d]] if depth < 5.0 || front < 5.0

          if side == 'right'
            [[0.0, 0.0], [w, 0.0], [w, d - depth], [w - front, d], [0.0, d]]
          else
            [[0.0, 0.0], [w, 0.0], [w, d], [front, d], [0.0, d - depth]]
          end
        end

        # Index of the footprint edge the door sits on, and its two points.
        def face_edge(layout)
          side, depth, front = spec(layout)
          return [nil, nil, nil] if depth < 5.0 || front < 5.0

          points = footprint(layout)
          index = side == 'right' ? 2 : 3
          [index, points[index], points[(index + 1) % points.size]]
        end

        def build(entities, model, layout)
          points = footprint(layout)
          group = Geom3.group_with(entities, 'Carcass')
          ents = group.entities
          material = layout.material('carcass')
          side, = spec(layout)

          Faceted.shell(ents, model, layout, points, 'Chamfer')

          # the square end keeps a normal gable; the cut end is closed by the
          # angled face itself
          gable_x = side == 'right' ? 0.0 : layout.w - layout.t
          Geom3.part(ents, model, name: 'Gable', part: 'Gable', material: material,
                                  x: gable_x, y: 0.0, z: layout.z0,
                                  w: layout.t, d: layout.d, h: layout.h,
                                  length: layout.h, width: layout.d, thick: layout.t,
                                  edges: 'front')

          if layout.back_t.positive? && layout.params['back_mode'] != 'none'
            Geom3.part(ents, model, name: 'Back', part: 'Back',
                                    material: layout.material('back'),
                                    x: 0.0, y: 0.0, z: layout.inner_z0,
                                    w: layout.w, d: layout.back_t, h: layout.inner_h,
                                    length: layout.w, width: layout.inner_h,
                                    thick: layout.back_t)
          end

          Faceted.shelves(ents, model, layout, points, 'chamfer')
          Carcass.plinth(entities, model, layout)
          group
        end

        def fronts(entities, model, layout)
          _index, p1, p2 = face_edge(layout)
          return Fronts.build(entities, model, layout) if p1.nil?

          Faceted.face_fronts(entities, model, layout, p1, p2, 'Fronts')
        end

        def worktop(entities, model, layout)
          index, p1, = face_edge(layout)
          return Worktop.build(entities, model, layout) if p1.nil?

          Faceted.face_worktop(entities, model, layout, footprint(layout), index)
        end
      end
    end
  end
end
