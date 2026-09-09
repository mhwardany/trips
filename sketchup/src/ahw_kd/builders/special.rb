# frozen_string_literal: true

module AHW
  module KD
    module Builders
      # Diagonal corner carcass. The unit sits in the internal angle of two
      # walls: wall A is the plane y = 0, wall B is the plane x = 0.
      module DiagonalCorner
        module_function

        def footprint(layout)
          spec = layout.params['corner']
          w = layout.w
          d = layout.d
          rw = spec['return_w'].to_f
          rd = spec['return_d'].to_f
          [[0.0, 0.0], [w, 0.0], [w, d], [rd, rw], [0.0, rw]]
        end

        def diagonal_points(layout)
          spec = layout.params['corner']
          [[layout.w, layout.d], [spec['return_d'].to_f, spec['return_w'].to_f]]
        end

        def build(entities, model, layout)
          spec = layout.params['corner']
          t = layout.t
          rw = spec['return_w'].to_f
          rd = spec['return_d'].to_f
          material = layout.material('carcass')

          group = Geom3.group_with(entities, 'Carcass')
          ents = group.entities
          points = footprint(layout)

          if layout.bottom_t.positive?
            bottom = Geom3.group_with(ents, 'Bottom')
            Geom3.prism_z(bottom.entities, points, layout.z0, t)
            Geom3.finish_part(bottom, model, name: 'Bottom', part: 'Bottom', material: material,
                                             dims: [layout.w, rw, t],
                                             length: layout.w, width: rw, thick: t)
          end
          if layout.top_t.positive?
            top = Geom3.group_with(ents, 'Top')
            Geom3.prism_z(top.entities, points, layout.z1 - t, t)
            Geom3.finish_part(top, model, name: 'Top', part: 'Top', material: material,
                                          dims: [layout.w, rw, t],
                                          length: layout.w, width: rw, thick: t)
          end

          Geom3.part(ents, model, name: 'Side A', part: 'Gable', material: material,
                                  x: layout.w - t, y: 0.0, z: layout.z0,
                                  w: t, d: layout.d, h: layout.h,
                                  length: layout.h, width: layout.d, thick: t, edges: 'front')
          Geom3.part(ents, model, name: 'Side B', part: 'Gable', material: material,
                                  x: 0.0, y: rw - t, z: layout.z0,
                                  w: rd, d: t, h: layout.h,
                                  length: layout.h, width: rd, thick: t, edges: 'front')

          if layout.back_t.positive? && layout.params['back_mode'] != 'none'
            Geom3.part(ents, model, name: 'Back A', part: 'Back', material: layout.material('back'),
                                    x: 0.0, y: 0.0, z: layout.inner_z0,
                                    w: layout.w, d: layout.back_t, h: layout.inner_h,
                                    length: layout.w, width: layout.inner_h, thick: layout.back_t)
            Geom3.part(ents, model, name: 'Back B', part: 'Back', material: layout.material('back'),
                                    x: 0.0, y: 0.0, z: layout.inner_z0,
                                    w: layout.back_t, d: rw, h: layout.inner_h,
                                    length: rw, width: layout.inner_h, thick: layout.back_t)
          end

          shelf_prism(ents, model, layout, points)
          Carcass.plinth(entities, model, layout)
          group
        end

        def shelf_prism(ents, model, layout, points)
          count = layout.params['interior']['shelves'].to_i
          return if count <= 0

          inset = layout.t + 4.0
          shrunk = points.map do |(x, y)|
            [Util.clamp(x, inset, 1.0e6), Util.clamp(y, inset, 1.0e6)]
          end
          spacing = layout.inner_h / (count + 1).to_f
          count.times do |i|
            z = layout.inner_z0 + spacing * (i + 1) - layout.shelf_t / 2.0
            shelf = Geom3.group_with(ents, 'Shelf')
            Geom3.prism_z(shelf.entities, shrunk, z, layout.shelf_t)
            Geom3.finish_part(shelf, model, name: 'Shelf', part: 'Shelf',
                                            material: layout.material('shelf'),
                                            dims: [layout.w, layout.params['corner']['return_w'].to_f,
                                                   layout.shelf_t],
                                            length: layout.w, width: layout.d,
                                            thick: layout.shelf_t, note: 'corner shelf, cut to shape')
          end
        end

        # The door lives on the 45 degree face; it is drawn flat and then
        # rotated into the diagonal plane.
        def fronts(entities, model, layout)
          p1, p2 = diagonal_points(layout)
          dx = p1[0] - p2[0]
          dy = p1[1] - p2[1]
          length = Math.sqrt(dx * dx + dy * dy)
          return if length <= 100.0

          angle = Math.atan2(dy, dx) * 180.0 / Math::PI
          row = layout.params['rows'].first
          leaf_w = length - 2 * layout.gap

          group = Geom3.group_with(entities, 'Fronts')
          leaf = Panel.build(group.entities, model, layout,
                             name: 'Corner Door', part: 'Door',
                             x: layout.gap, y: 0.0, z: layout.z0,
                             w: leaf_w, h: layout.h,
                             style: row ? row['style'] : nil,
                             handle_horizontal: false)
          return unless leaf

          hinge = row ? row['hinge'] : 'left'
          Fronts.swing!(leaf, hinge, layout.gap, layout.gap + leaf_w,
                        layout.z0, layout.z1, 0.0, layout.params['open']['doors'].to_f)

          Geom3.rotate!(group, ORIGIN, ::Geom::Vector3d.new(0, 0, 1), angle)
          Geom3.move!(group, p2[0], p2[1], 0.0)
          group
        end

        def worktop(entities, model, layout)
          return unless layout.counter?

          spec = layout.params['counter']
          overhang = layout.front_t + spec['front_oh'].to_f
          points = footprint(layout)
          # push the diagonal edge outward along its normal
          p1 = points[2]
          p2 = points[3]
          nx = (p2[1] - p1[1])
          ny = -(p2[0] - p1[0])
          length = Math.sqrt(nx * nx + ny * ny)
          return if length.zero?

          nx = nx / length * overhang
          ny = ny / length * overhang
          nx = -nx if nx.negative?
          ny = -ny if ny.negative?
          expanded = [points[0], [points[1][0], points[1][1]],
                      [p1[0] + nx, p1[1] + ny], [p2[0] + nx, p2[1] + ny], points[4]]

          group = Geom3.group_with(entities, 'Worktop')
          Geom3.prism_z(group.entities, expanded, layout.counter_z - spec['t'].to_f, spec['t'].to_f)
          Geom3.finish_part(group, model, name: 'Worktop', part: 'Worktop',
                                          material: layout.material('counter'),
                                          dims: [layout.w, layout.params['corner']['return_w'].to_f,
                                                 spec['t'].to_f],
                                          length: layout.w, width: layout.d, thick: spec['t'].to_f,
                                          note: 'diagonal corner top')
          group
        end
      end

      # ------------------------------------------------------------------
      # Extractor hoods. The unit is placed by the user at the required
      # height above the worktop, so everything is drawn from z = 0 up.
      module Hood
        module_function

        def build(entities, model, layout)
          style = layout.params['hood_style'] || 'chimney'
          group = Geom3.group_with(entities, 'Hood')
          ents = group.entities
          w = layout.w
          d = layout.d
          h = layout.h
          material = layout.material('front')

          case style
          when 'integrated'
            Geom3.part(ents, model, name: 'Hood Body', part: 'Hood', material: 'appliance_steel',
                                    x: 0.0, y: 0.0, z: 0.0, w: w, d: d, h: h,
                                    length: w, width: d, thick: h)
            Geom3.part(ents, model, name: 'Visor', part: 'Hood', material: 'appliance_black',
                                    x: 0.0, y: d, z: 0.0, w: w, d: 20.0, h: 120.0,
                                    length: w, width: 120.0, thick: 20.0)
          when 'wall_box'
            Geom3.part(ents, model, name: 'Hood Box', part: 'Hood', material: material,
                                    x: 0.0, y: 0.0, z: 0.0, w: w, d: d, h: h,
                                    length: w, width: d, thick: h)
            filter(ents, model, w, d, 0.0)
          else # chimney / island
            canopy_h = 180.0
            canopy = Geom3.group_with(ents, 'Canopy')
            section = [[0.0, canopy_h], [d, canopy_h], [d * 0.75, 0.0], [d * 0.25, 0.0]]
            Geom3.prism_x(canopy.entities, 0.0, w, section)
            Geom3.finish_part(canopy, model, name: 'Canopy', part: 'Hood',
                                             material: 'appliance_steel',
                                             dims: [w, d, canopy_h],
                                             length: w, width: d, thick: canopy_h)
            chimney_w = w * 0.4
            chimney_d = d * 0.45
            chimney_y = style == 'island' ? (d - chimney_d) / 2.0 : 0.0
            Geom3.part(ents, model, name: 'Chimney', part: 'Hood', material: 'appliance_steel',
                                    x: (w - chimney_w) / 2.0, y: chimney_y, z: canopy_h,
                                    w: chimney_w, d: chimney_d, h: h - canopy_h,
                                    length: h - canopy_h, width: chimney_w, thick: chimney_d)
            filter(ents, model, w, d, 0.0)
          end
          group
        end

        def filter(ents, model, w, d, z)
          filters = Geom3.group_with(ents, 'Filters')
          count = [(w / 300.0).round, 1].max
          each = (w - 40.0) / count.to_f
          count.times do |i|
            Geom3.box(filters.entities, 20.0 + i * each, d * 0.2, z + 6.0,
                      each - 10.0, d * 0.6, 10.0)
          end
          Geom3.finish_part(filters, model, name: 'Grease Filter', part: 'Hood Filter',
                                            material: 'ss_brushed',
                                            dims: [each, d * 0.6, 10.0],
                                            length: each, width: d * 0.6, thick: 10.0,
                                            qty: count)
        end
      end
    end
  end
end
