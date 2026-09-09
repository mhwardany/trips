# frozen_string_literal: true

module AHW
  module KD
    module Builders
      # Drawer box, runners and inserts. The front leaf itself is drawn by
      # Panel; this module adds everything behind it and returns the travel
      # distance so the caller can animate the open state.
      module Drawer
        module_function

        # bay_x / bay_w describe the carcass opening this drawer runs in.
        def build(parent, model, layout, row, bay_x, bay_w, front_z, front_h)
          spec = row['drawer']
          runner = Const::RUNNER_TYPES[spec['runner']] || Const::RUNNER_TYPES['tandem']
          side_clear   = runner['side']
          bottom_clear = runner['bottom']
          back_clear   = runner['back']

          box_w = bay_w - 2 * side_clear
          box_d = (layout.cavity_y1 - layout.cavity_y0) - back_clear
          return 0.0 if box_w <= 40.0 || box_d <= 60.0

          box_h = spec['box_h'].to_f
          box_h = Util.clamp(front_h - 40.0, 60.0, 250.0) if box_h <= 0.0
          box_z = front_z + bottom_clear

          group = Geom3.group_with(parent, 'Drawer Box')
          ents = group.entities
          box_t = 15.0
          material = layout.material('drawer_box')
          x0 = bay_x + side_clear
          y0 = layout.cavity_y0

          # sides
          Geom3.part(ents, model, name: 'Box Side L', part: 'Drawer Side', material: material,
                                  x: x0, y: y0, z: box_z, w: box_t, d: box_d, h: box_h,
                                  length: box_d, width: box_h, thick: box_t)
          Geom3.part(ents, model, name: 'Box Side R', part: 'Drawer Side', material: material,
                                  x: x0 + box_w - box_t, y: y0, z: box_z,
                                  w: box_t, d: box_d, h: box_h,
                                  length: box_d, width: box_h, thick: box_t)
          inner_w = box_w - 2 * box_t
          # front and back of the box
          Geom3.part(ents, model, name: 'Box Back', part: 'Drawer Back', material: material,
                                  x: x0 + box_t, y: y0, z: box_z,
                                  w: inner_w, d: box_t, h: box_h,
                                  length: inner_w, width: box_h, thick: box_t)
          Geom3.part(ents, model, name: 'Box Front', part: 'Drawer Front Panel', material: material,
                                  x: x0 + box_t, y: y0 + box_d - box_t, z: box_z,
                                  w: inner_w, d: box_t, h: box_h,
                                  length: inner_w, width: box_h, thick: box_t)
          # bottom, housed 10 mm up from the underside of the sides
          Geom3.part(ents, model, name: 'Box Bottom', part: 'Drawer Bottom', material: 'hdf_white',
                                  x: x0 + 4.0, y: y0 + 4.0, z: box_z + 10.0,
                                  w: box_w - 8.0, d: box_d - 8.0, h: 6.0,
                                  length: box_d, width: box_w, thick: 6.0)

          insert(ents, model, spec['insert'], x0 + box_t, y0 + box_t, box_z + 16.0,
                 inner_w, box_d - 2 * box_t, box_h - 20.0)

          runners(parent, model, layout, spec['runner'], bay_x, bay_w, box_z, box_d)
          box_d
        end

        def runners(parent, model, layout, kind, bay_x, bay_w, z, depth)
          spec = Const::RUNNER_TYPES[kind] || Const::RUNNER_TYPES['tandem']
          group = Geom3.group_with(parent, 'Runners')
          ents = group.entities
          rail_h = kind == 'roller' ? 45.0 : 25.0
          [bay_x + 1.0, bay_x + bay_w - spec['side'] + 1.0].each do |x|
            Geom3.box(ents, x, layout.cavity_y0, z - 6.0, spec['side'] - 2.0, depth, rail_h)
          end
          Geom3.finish_part(group, model,
                            name: "Runner #{kind}", part: 'Drawer Runner',
                            material: 'alu_anodised',
                            dims: [depth, spec['side'], rail_h],
                            length: depth, width: rail_h, thick: spec['side'],
                            qty: 2, note: spec['label'])
        end

        # ------------------------------------------------------------ inserts
        def insert(ents, model, kind, x, y, z, w, d, h)
          return if kind.nil? || kind == 'none' || w <= 20.0 || d <= 20.0

          case kind
          when 'cutlery_tray'
            group = Geom3.group_with(ents, 'Cutlery Tray')
            gents = group.entities
            divisions = 5
            step = w / divisions.to_f
            (0..divisions).each do |i|
              Geom3.box(gents, x + i * step - 4.0, y, z, 8.0, d, [h, 70.0].min)
            end
            Geom3.box(gents, x, y, z, w, 8.0, [h, 70.0].min)
            Geom3.box(gents, x, y + d - 8.0, z, w, 8.0, [h, 70.0].min)
            Geom3.finish_part(group, model, name: 'Cutlery Tray', part: 'Accessory',
                                            material: 'mfc_oak', dims: [w, d, 70.0],
                                            length: w, width: d, thick: 70.0)
          when 'wire_basket'
            group = Geom3.group_with(ents, 'Wire Basket')
            gents = group.entities
            Geom3.tube(gents, x, y, z, w, d, [h, 100.0].min, 6.0)
            Geom3.finish_part(group, model, name: 'Wire Basket', part: 'Accessory',
                                            material: 'chrome', dims: [w, d, 100.0],
                                            length: w, width: d, thick: 100.0)
          when 'plate_rack'
            group = Geom3.group_with(ents, 'Plate Rack')
            gents = group.entities
            pegs = (w / 90.0).floor
            pegs = 1 if pegs < 1
            pegs.times do |i|
              Geom3.cylinder(gents, [x + 45.0 + i * 90.0, y + 40.0, z], 6.0, [h, 120.0].min, :z, 8)
              Geom3.cylinder(gents, [x + 45.0 + i * 90.0, y + d - 40.0, z], 6.0, [h, 120.0].min, :z, 8)
            end
            Geom3.finish_part(group, model, name: 'Plate Rack', part: 'Accessory',
                                            material: 'chrome', dims: [w, d, 120.0],
                                            length: w, width: d, thick: 120.0)
          end
        end
      end
    end
  end
end
