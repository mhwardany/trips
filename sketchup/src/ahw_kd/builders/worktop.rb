# frozen_string_literal: true

module AHW
  module KD
    module Builders
      # Worktop, upstand, waterfall ends, sink and hob. The slab is extruded
      # from a real edge profile so a mitred 60 mm apron or a bullnose reads
      # correctly in section as well as in 3D.
      module Worktop
        module_function

        def build(entities, model, layout)
          return nil unless layout.counter?

          spec = layout.params['counter']
          t = spec['t'].to_f
          y0 = -spec['back_oh'].to_f
          y1 = layout.front_y1 + spec['front_oh'].to_f
          depth = y1 - y0
          x0 = -spec['oh_l'].to_f
          width = layout.w + spec['oh_l'].to_f + spec['oh_r'].to_f
          z_top = layout.counter_z

          group = Geom3.group_with(entities, 'Worktop')
          ents = group.entities

          slab = Geom3.group_with(ents, 'Slab')
          section = Geom3.counter_section(y0, depth, t, z_top,
                                          spec['edge'], spec['edge_size'].to_f,
                                          spec['mitre_t'].to_f)
          Geom3.prism_x(slab.entities, x0, width, section)

          cut_sink(slab, layout, z_top, t)
          cut_hob(slab, layout, z_top, t)

          Geom3.finish_part(slab, model,
                            name: 'Worktop', part: 'Worktop',
                            material: layout.material('counter'),
                            dims: [width, depth, t],
                            length: width, width: depth, thick: t,
                            note: "#{spec['edge']} edge")

          upstand(ents, model, layout, x0, width, z_top)
          waterfall(ents, model, layout, x0, width, y0, depth, t, z_top)
          Sink.build(ents, model, layout, z_top, t) if layout.params['sink']['on']
          Hob.build(ents, model, layout, z_top, t) if layout.params['hob']['on']
          group
        end

        def sink_rect(layout)
          spec = layout.params['sink']
          centre_x = layout.w / 2.0 + spec['dx'].to_f
          centre_y = layout.d / 2.0 + spec['dy'].to_f
          width = spec['w'].to_f
          depth = spec['d'].to_f
          width += width * 0.55 if spec['drainer']
          [centre_x - width / 2.0, centre_y - depth / 2.0, width, depth]
        end

        def hob_rect(layout)
          spec = layout.params['hob']
          centre_x = layout.w / 2.0 + spec['dx'].to_f
          centre_y = layout.d / 2.0 + spec['dy'].to_f
          [centre_x - spec['w'].to_f / 2.0, centre_y - spec['d'].to_f / 2.0,
           spec['w'].to_f, spec['d'].to_f]
        end

        def cut_sink(slab, layout, z_top, t)
          return unless layout.params['sink']['on']
          return if layout.params['sink']['mount'] == 'vessel'

          x, y, w, d = sink_rect(layout)
          inset = layout.params['sink']['mount'] == 'topmount' ? 12.0 : 0.0
          Geom3.cut_rect_hole(slab, [x + inset, y + inset, w - 2 * inset, d - 2 * inset],
                              t, z_top)
        end

        def cut_hob(slab, layout, z_top, t)
          return unless layout.params['hob']['on']

          x, y, w, d = hob_rect(layout)
          Geom3.cut_rect_hole(slab, [x, y, w, d], t, z_top)
        end

        def upstand(ents, model, layout, x0, width, z_top)
          spec = layout.params['counter']['splash']
          return unless spec['on']

          height = spec['h'].to_f
          thickness = spec['t'].to_f
          return if height <= 5.0

          Geom3.part(ents, model,
                     name: 'Upstand', part: 'Upstand',
                     material: layout.material('counter'),
                     x: x0, y: -layout.params['counter']['back_oh'].to_f,
                     z: z_top, w: width, d: thickness, h: height,
                     length: width, width: height, thick: thickness)
        end

        def waterfall(ents, model, layout, x0, width, y0, depth, t, z_top)
          spec = layout.params['counter']
          height = z_top - t
          return if height <= 50.0

          if spec['waterfall_l']
            Geom3.part(ents, model, name: 'Waterfall L', part: 'Worktop Leg',
                                    material: layout.material('counter'),
                                    x: x0, y: y0, z: 0.0, w: t, d: depth, h: height,
                                    length: height, width: depth, thick: t)
          end
          return unless spec['waterfall_r']

          Geom3.part(ents, model, name: 'Waterfall R', part: 'Worktop Leg',
                                  material: layout.material('counter'),
                                  x: x0 + width - t, y: y0, z: 0.0,
                                  w: t, d: depth, h: height,
                                  length: height, width: depth, thick: t)
        end
      end

      # ------------------------------------------------------------------
      module Sink
        module_function

        def build(ents, model, layout, z_top, counter_t)
          spec = layout.params['sink']
          x, y, w, d = Worktop.sink_rect(layout)
          bowl_d = spec['bowl_d'].to_f
          bowls = spec['bowls'].to_i
          drainer = spec['drainer']

          group = Geom3.group_with(ents, "Sink #{spec['mount']}")
          gents = group.entities

          bowl_zone_w = drainer ? w / (bowls + 0.55) * bowls : w
          each_w = (bowl_zone_w - 10.0 * (bowls - 1)) / bowls.to_f

          case spec['mount']
          when 'vessel'
            bowls.times do |i|
              bx = x + i * (each_w + 10.0)
              Geom3.tube(gents, bx, y, z_top, each_w, d, bowl_d, 12.0)
              Geom3.box(gents, bx, y, z_top, each_w, d, 12.0)
            end
          when 'topmount'
            Geom3.box(gents, x, y, z_top, w, d, 8.0) # rim
            bowls.times do |i|
              bx = x + 12.0 + i * (each_w + 10.0)
              Geom3.tube(gents, bx, y + 12.0, z_top - bowl_d, each_w - 24.0, d - 24.0, bowl_d, 8.0)
              Geom3.box(gents, bx, y + 12.0, z_top - bowl_d, each_w - 24.0, d - 24.0, 8.0)
            end
          else # undermount / integrated
            bowls.times do |i|
              bx = x + i * (each_w + 10.0)
              top = z_top - counter_t
              Geom3.tube(gents, bx, y, top - bowl_d, each_w, d, bowl_d, 8.0)
              Geom3.box(gents, bx, y, top - bowl_d, each_w, d, 8.0)
            end
          end

          material = spec['mount'] == 'integrated' ? layout.material('counter') : 'ss_brushed'
          Geom3.finish_part(group, model,
                            name: 'Sink', part: 'Sink', material: material,
                            dims: [w, d, bowl_d], length: w, width: d, thick: bowl_d,
                            note: "#{spec['mount']} #{bowls} bowl")

          tap(ents, model, layout, x, y, w, d, z_top) if spec['tap']
          group
        end

        def tap(ents, model, layout, x, y, w, d, z_top)
          spec = layout.params['sink']
          height = spec['tap_h'].to_f
          cx = x + w / 2.0
          cy = y - 60.0
          cy = 40.0 if cy < 40.0

          group = Geom3.group_with(ents, 'Tap')
          gents = group.entities
          Geom3.cylinder(gents, [cx, cy, z_top], 22.0, 12.0, :z, 16)
          Geom3.cylinder(gents, [cx, cy, z_top], 16.0, height, :z, 16)
          Geom3.cylinder(gents, [cx, cy, z_top + height], 12.0, 190.0, :y, 12)
          Geom3.finish_part(group, model,
                            name: 'Tap', part: 'Tap', material: 'chrome',
                            dims: [44.0, 190.0, height],
                            length: height, width: 190.0, thick: 44.0)
        end
      end

      # ------------------------------------------------------------------
      module Hob
        module_function

        def build(ents, model, layout, z_top, counter_t)
          spec = layout.params['hob']
          x, y, w, d = Worktop.hob_rect(layout)
          group = Geom3.group_with(ents, "Hob #{spec['kind']}")
          gents = group.entities

          case spec['kind']
          when 'induction', 'ceramic'
            Geom3.box(gents, x, y, z_top - 4.0, w, d, 8.0)
            Materials.paint(model, group, 'glass_lacobel')
          when 'domino'
            Geom3.box(gents, x, y, z_top - 4.0, w, d, 8.0)
            Materials.paint(model, group, 'appliance_black')
          else # gas
            Geom3.box(gents, x, y, z_top - 4.0, w, d, 10.0)
            burners = spec['burners'].to_i
            positions = burner_positions(x, y, w, d, burners)
            positions.each do |(bx, by, radius)|
              Geom3.cylinder(gents, [bx, by, z_top + 6.0], radius, 14.0, :z, 16)
              Geom3.cylinder(gents, [bx, by, z_top + 6.0], radius * 0.45, 22.0, :z, 12)
            end
            Materials.paint(model, group, 'appliance_black')
          end

          Geom3.finish_part(group, model,
                            name: 'Hob', part: 'Hob', material: 'appliance_black',
                            dims: [w, d, 40.0], length: w, width: d, thick: 40.0,
                            note: "#{spec['kind']} #{spec['burners']} burner")
          # body below the worktop, so the cabinet below is checked for clash
          body = Geom3.group_with(ents, 'Hob Body')
          Geom3.box(body.entities, x + 20.0, y + 20.0, z_top - counter_t - 80.0,
                    w - 40.0, d - 40.0, 80.0)
          Materials.paint(model, body, 'appliance_steel')
          group
        end

        def burner_positions(x, y, w, d, count)
          case count
          when 1 then [[x + w / 2.0, y + d / 2.0, 65.0]]
          when 2 then [[x + w * 0.28, y + d / 2.0, 55.0], [x + w * 0.72, y + d / 2.0, 70.0]]
          when 3 then [[x + w * 0.25, y + d * 0.3, 50.0], [x + w * 0.25, y + d * 0.72, 50.0],
                       [x + w * 0.72, y + d * 0.5, 75.0]]
          when 5 then [[x + w * 0.2, y + d * 0.28, 48.0], [x + w * 0.2, y + d * 0.74, 48.0],
                       [x + w * 0.5, y + d * 0.5, 80.0],
                       [x + w * 0.8, y + d * 0.28, 48.0], [x + w * 0.8, y + d * 0.74, 55.0]]
          else [[x + w * 0.26, y + d * 0.28, 48.0], [x + w * 0.26, y + d * 0.74, 60.0],
                [x + w * 0.74, y + d * 0.28, 70.0], [x + w * 0.74, y + d * 0.74, 48.0]]
          end
        end
      end
    end
  end
end
