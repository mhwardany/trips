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
          [[0.0, 0.0], [layout.w, 0.0], [layout.w, layout.d],
           [spec['return_d'].to_f, spec['return_w'].to_f], [0.0, spec['return_w'].to_f]]
        end

        # The diagonal face is the edge between points 2 and 3.
        FACE_INDEX = 2

        def diagonal_points(layout)
          points = footprint(layout)
          [points[2], points[3]]
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

          Faceted.shell(ents, model, layout, points, 'Corner')

          # gables close the two open ends where the neighbouring runs meet
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

          Faceted.shelves(ents, model, layout, points, 'corner')
          Carcass.plinth(entities, model, layout)
          group
        end

        def fronts(entities, model, layout)
          p1, p2 = diagonal_points(layout)
          Faceted.face_fronts(entities, model, layout, p1, p2, 'Fronts')
        end

        def worktop(entities, model, layout)
          Faceted.face_worktop(entities, model, layout, footprint(layout), FACE_INDEX)
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
