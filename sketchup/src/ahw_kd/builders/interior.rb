# frozen_string_literal: true

module AHW
  module KD
    module Builders
      # Everything that lives inside the carcass and is not a shelf or a
      # divider: hanging rails, shoe shelves, pull-outs, corner mechanisms,
      # baskets, LED and mirror panels.
      module Interior
        module_function

        def build(entities, model, layout)
          accessories = layout.params['interior']['accessories']
          return nil if accessories.empty?

          group = Geom3.group_with(entities, 'Interior')
          ents = group.entities
          accessories.each do |accessory|
            Log.guard("accessory #{accessory['type']}") do
              place(ents, model, layout, accessory)
            end
          end
          group
        end

        # Resolve the horizontal span an accessory occupies inside the carcass.
        def span(layout, accessory)
          width = accessory['w'].to_f
          x = layout.inner_x0 + accessory['x'].to_f
          width = layout.inner_w - accessory['x'].to_f if width <= 0.0
          width = Util.clamp(width, 10.0, layout.inner_x1 - x)
          [x, width]
        end

        def depth(layout, accessory, fallback)
          value = accessory['depth'].to_f
          value = fallback if value <= 0.0
          [value, layout.cavity_y1 - layout.cavity_y0].min
        end

        def place(ents, model, layout, accessory)
          x, width = span(layout, accessory)
          z = layout.inner_z0 + accessory['z'].to_f
          z = Util.clamp(z, layout.inner_z0, layout.inner_z1)

          case accessory['type']
          when 'shelf', 'glass_shelf'
            material = accessory['type'] == 'glass_shelf' ? 'glass_clear' : layout.material('shelf')
            thickness = accessory['type'] == 'glass_shelf' ? 8.0 : layout.shelf_t
            d = depth(layout, accessory, layout.cavity_y1 - layout.cavity_y0 - 20.0)
            Geom3.part(ents, model, name: 'Shelf', part: 'Shelf', material: material,
                                    x: x, y: layout.cavity_y0, z: z,
                                    w: width, d: d, h: thickness,
                                    length: width, width: d, thick: thickness, edges: 'front')

          when 'hanging_rail', 'double_rail'
            rail(ents, model, layout, x, width, z, accessory)
            rail(ents, model, layout, x, width, z - 900.0, accessory) if accessory['type'] == 'double_rail'

          when 'pull_down_rail'
            rail(ents, model, layout, x + 20.0, width - 40.0, z, accessory)
            group = Geom3.group_with(ents, 'Pull Down Mechanism')
            [x + 10.0, x + width - 40.0].each do |ax|
              Geom3.box(group.entities, ax, layout.cavity_y1 - 320.0, z - 60.0, 30.0, 300.0, 90.0)
            end
            Geom3.finish_part(group, model, name: 'Pull Down Rail', part: 'Accessory',
                                            material: 'alu_anodised', dims: [30.0, 300.0, 90.0],
                                            length: 300.0, width: 90.0, thick: 30.0, qty: 2)

          when 'trouser_rack', 'tie_rack'
            slides = accessory['type'] == 'trouser_rack' ? 6 : 10
            d = depth(layout, accessory, layout.cavity_y1 - layout.cavity_y0 - 60.0)
            group = Geom3.group_with(ents, 'Pull Out Rack')
            gents = group.entities
            Geom3.box(gents, x, layout.cavity_y0, z, width, d, 20.0)
            slides.times do |i|
              bar_z = z + 30.0 + i * 45.0
              Geom3.cylinder(gents, [x + 20.0, layout.cavity_y0 + 30.0, bar_z],
                             6.0, d - 60.0, :y, 8)
              Geom3.cylinder(gents, [x + width - 20.0, layout.cavity_y0 + 30.0, bar_z],
                             6.0, d - 60.0, :y, 8)
            end
            Geom3.finish_part(group, model, name: accessory['type'], part: 'Accessory',
                                            material: 'alu_anodised',
                                            dims: [width, d, slides * 45.0],
                                            length: width, width: d, thick: 40.0,
                                            note: 'side mounted pull-out')

          when 'shoe_shelf'
            count = accessory['count'].to_i
            angle = accessory['angle'].to_f
            angle = 15.0 if angle <= 0.0
            d = depth(layout, accessory, layout.cavity_y1 - layout.cavity_y0 - 20.0)
            spacing = (layout.inner_z1 - z) / [count, 1].max.to_f
            count.times do |i|
              shelf_z = z + spacing * i
              shelf = Geom3.group_with(ents, 'Shoe Shelf')
              Geom3.box(shelf.entities, x, layout.cavity_y0, shelf_z, width, d, layout.shelf_t)
              Geom3.rotate!(shelf, Geom3.p3(x, layout.cavity_y0, shelf_z),
                            ::Geom::Vector3d.new(1, 0, 0), -angle)
              Geom3.finish_part(shelf, model, name: 'Shoe Shelf', part: 'Shoe Shelf',
                                              material: layout.material('shelf'),
                                              dims: [width, d, layout.shelf_t],
                                              length: width, width: d, thick: layout.shelf_t,
                                              edges: 'front', note: "#{angle.round} deg")
              lip = Geom3.group_with(ents, 'Shoe Lip')
              Geom3.box(lip.entities, x, layout.cavity_y1 - 30.0, shelf_z, width, 12.0, 40.0)
              Materials.paint(model, lip, 'alu_anodised')
            end

          when 'wire_basket', 'laundry_basket'
            count = accessory['count'].to_i
            d = depth(layout, accessory, layout.cavity_y1 - layout.cavity_y0 - 60.0)
            height = accessory['type'] == 'laundry_basket' ? 350.0 : 150.0
            count.times do |i|
              basket = Geom3.group_with(ents, 'Basket')
              bz = z + i * (height + 60.0)
              Geom3.tube(basket.entities, x + 10.0, layout.cavity_y0 + 20.0, bz,
                         width - 20.0, d, height, 8.0)
              Geom3.box(basket.entities, x + 10.0, layout.cavity_y0 + 20.0, bz,
                        width - 20.0, d, 8.0)
              Geom3.finish_part(basket, model, name: accessory['type'], part: 'Accessory',
                                               material: 'chrome',
                                               dims: [width - 20.0, d, height],
                                               length: width, width: d, thick: height)
            end

          when 'pull_out_larder'
            d = depth(layout, accessory, layout.cavity_y1 - layout.cavity_y0 - 40.0)
            group = Geom3.group_with(ents, 'Pull Out Larder')
            gents = group.entities
            levels = [accessory['count'].to_i, 5].max
            step = (layout.inner_z1 - z) / levels.to_f
            Geom3.box(gents, x + 20.0, layout.cavity_y0, z, 30.0, d, layout.inner_z1 - z)
            Geom3.box(gents, x + width - 50.0, layout.cavity_y0, z, 30.0, d, layout.inner_z1 - z)
            levels.times do |i|
              Geom3.box(gents, x + 20.0, layout.cavity_y0, z + step * i, width - 50.0, d, 20.0)
            end
            Geom3.finish_part(group, model, name: 'Pull Out Larder', part: 'Accessory',
                                            material: 'chrome',
                                            dims: [width, d, layout.inner_z1 - z],
                                            length: width, width: d, thick: 0,
                                            note: "#{levels} tiers, full extension")

          when 'magic_corner', 'carousel'
            corner_mech(ents, model, layout, accessory, x, width, z)

          when 'waste_bin'
            count = accessory['count'].to_i
            d = depth(layout, accessory, 420.0)
            bin_w = (width - 60.0) / count.to_f
            count.times do |i|
              bin = Geom3.group_with(ents, 'Waste Bin')
              bx = x + 30.0 + i * bin_w
              Geom3.tube(bin.entities, bx + 10.0, layout.cavity_y0 + 40.0, z + 20.0,
                         bin_w - 20.0, d, 380.0, 6.0)
              Geom3.box(bin.entities, bx + 10.0, layout.cavity_y0 + 40.0, z + 20.0,
                        bin_w - 20.0, d, 6.0)
              Geom3.finish_part(bin, model, name: 'Waste Bin', part: 'Accessory',
                                            material: 'appliance_black',
                                            dims: [bin_w, d, 380.0],
                                            length: bin_w, width: d, thick: 380.0,
                                            note: 'pull-out waste system')
            end

          when 'jewellery_drawer'
            d = depth(layout, accessory, layout.cavity_y1 - layout.cavity_y0 - 60.0)
            group = Geom3.group_with(ents, 'Jewellery Insert')
            gents = group.entities
            cells = 6
            step = width / cells.to_f
            (0..cells).each { |i| Geom3.box(gents, x + i * step - 4.0, layout.cavity_y0, z, 8.0, d, 45.0) }
            Geom3.box(gents, x, layout.cavity_y0, z, width, 8.0, 45.0)
            Geom3.box(gents, x, layout.cavity_y0 + d - 8.0, z, width, 8.0, 45.0)
            Geom3.finish_part(group, model, name: 'Jewellery Insert', part: 'Accessory',
                                            material: 'mfc_walnut', dims: [width, d, 45.0],
                                            length: width, width: d, thick: 45.0)

          when 'led_strip'
            group = Geom3.group_with(ents, 'LED')
            Geom3.box(group.entities, x, layout.cavity_y1 - 40.0, z - 12.0, width, 22.0, 12.0)
            Geom3.finish_part(group, model, name: 'LED Strip', part: 'Lighting',
                                            material: 'led_warm', dims: [width, 22.0, 12.0],
                                            length: width, width: 22.0, thick: 12.0,
                                            note: 'aluminium profile, 3000K')

          when 'mirror_panel'
            Geom3.part(ents, model, name: 'Mirror Panel', part: 'Mirror',
                                    material: 'glass_mirror',
                                    x: x, y: layout.cavity_y0, z: z,
                                    w: width, d: 6.0, h: layout.inner_z1 - z,
                                    length: layout.inner_z1 - z, width: width, thick: 6.0)

          when 'open_niche'
            group = Geom3.group_with(ents, 'Niche')
            height = accessory['count'].to_i * 300.0
            Geom3.box(group.entities, x, layout.cavity_y0, z, width, 20.0, height)
            Materials.paint(model, group, 'led_warm')

          when 'safe_box'
            Geom3.part(ents, model, name: 'Safe', part: 'Accessory', material: 'black_matt',
                                    x: x, y: layout.cavity_y0, z: z,
                                    w: [width, 450.0].min, d: 400.0, h: 350.0,
                                    length: 450.0, width: 400.0, thick: 350.0)

          when 'divider'
            Geom3.part(ents, model, name: 'Divider', part: 'Divider',
                                    material: layout.material('carcass'),
                                    x: x, y: layout.cavity_y0, z: z,
                                    w: layout.t, d: layout.cavity_y1 - layout.cavity_y0,
                                    h: layout.inner_z1 - z,
                                    length: layout.inner_z1 - z,
                                    width: layout.cavity_y1 - layout.cavity_y0,
                                    thick: layout.t, grain: 'height', edges: 'front')

          when 'belt_rack', 'valet_rod'
            group = Geom3.group_with(ents, humanise_name(accessory['type']))
            gents = group.entities
            reach = depth(layout, accessory, layout.cavity_y1 - layout.cavity_y0 - 40.0)
            if accessory['type'] == 'valet_rod'
              Geom3.cylinder(gents, [x + 30.0, layout.cavity_y0 + 20.0, z], 8.0, reach, :y, 12)
              Geom3.box(gents, x, layout.cavity_y0, z - 20.0, 20.0, 40.0, 40.0)
            else
              Geom3.box(gents, x, layout.cavity_y0, z, 20.0, reach, 20.0)
              hooks = Util.clamp(accessory['count'], 1, 12)
              hooks.times do |i|
                Geom3.cylinder(gents, [x + 10.0, layout.cavity_y0 + 30.0 + i * 45.0, z - 30.0],
                               5.0, 30.0, :z, 8)
              end
            end
            Geom3.finish_part(group, model, name: humanise_name(accessory['type']),
                                            part: 'Accessory', material: 'ss_brushed',
                                            dims: [20.0, reach, 40.0],
                                            length: reach, width: 40.0, thick: 20.0,
                                            note: 'side mounted, pull-out')

          when 'watch_box'
            d = depth(layout, accessory, 320.0)
            group = Geom3.group_with(ents, 'Watch Box')
            gents = group.entities
            cells = Util.clamp(accessory['count'], 1, 10)
            step = [width / cells.to_f, 60.0].max
            cells.times do |i|
              Geom3.tube(gents, x + i * step, layout.cavity_y0, z, step - 6.0, d, 70.0, 6.0)
              Geom3.cylinder(gents, [x + i * step + step / 2.0 - 3.0,
                                     layout.cavity_y0 + d / 2.0, z + 10.0],
                             22.0, 45.0, :z, 16)
            end
            Geom3.finish_part(group, model, name: 'Watch Box', part: 'Accessory',
                                            material: 'mfc_walnut',
                                            dims: [width, d, 70.0],
                                            length: width, width: d, thick: 70.0,
                                            note: "#{cells} cushions")

          when 'pull_out_table'
            d = depth(layout, accessory, layout.cavity_y1 - layout.cavity_y0 - 20.0)
            group = Geom3.group_with(ents, 'Pull Out Table')
            gents = group.entities
            Geom3.box(gents, x, layout.cavity_y0, z, width, d, 18.0)
            [x + 4.0, x + width - 16.0].each do |rx|
              Geom3.box(gents, rx, layout.cavity_y0, z - 20.0, 12.0, d, 20.0)
            end
            Geom3.finish_part(group, model, name: 'Pull Out Table', part: 'Accessory',
                                            material: layout.material('shelf'),
                                            dims: [width, d, 18.0],
                                            length: width, width: d, thick: 18.0,
                                            note: 'full extension pull-out worktop')

          when 'spice_rack'
            d = depth(layout, accessory, 120.0)
            tiers = Util.clamp(accessory['count'], 1, 8)
            group = Geom3.group_with(ents, 'Spice Rack')
            gents = group.entities
            tiers.times do |i|
              tz = z + i * 140.0
              Geom3.box(gents, x, layout.cavity_y0, tz, width, d, 16.0)
              Geom3.box(gents, x, layout.cavity_y0 + d - 10.0, tz, width, 10.0, 45.0)
            end
            Geom3.finish_part(group, model, name: 'Spice Rack', part: 'Accessory',
                                            material: layout.material('shelf'),
                                            dims: [width, d, 16.0],
                                            length: width, width: d, thick: 16.0,
                                            qty: tiers, note: 'door mounted spice tiers')

          when 'bottle_pullout'
            d = depth(layout, accessory, layout.cavity_y1 - layout.cavity_y0 - 40.0)
            height = layout.inner_z1 - z
            group = Geom3.group_with(ents, 'Bottle Pull Out')
            gents = group.entities
            narrow = [width, 200.0].min
            Geom3.tube(gents, x, layout.cavity_y0, z, narrow, d, height, 10.0)
            tiers = Util.clamp(accessory['count'], 1, 8)
            tiers.times do |i|
              Geom3.box(gents, x + 10.0, layout.cavity_y0 + 10.0,
                        z + (height / (tiers + 1).to_f) * (i + 1),
                        narrow - 20.0, d - 20.0, 12.0)
            end
            Geom3.finish_part(group, model, name: 'Bottle Pull Out', part: 'Accessory',
                                            material: 'chrome',
                                            dims: [narrow, d, height],
                                            length: narrow, width: d, thick: height,
                                            note: 'tall narrow pull-out, full extension')

          # ------------------------------------------------ bathroom fit-out
          when 'u_drawer'
            # a drawer that wraps around the basin trap: two side pockets and
            # a low bridge across the front
            d = depth(layout, accessory, layout.cavity_y1 - layout.cavity_y0 - 60.0)
            group = Geom3.group_with(ents, 'U Drawer')
            gents = group.entities
            height = 160.0
            cut = Util.clamp(accessory['w'].positive? ? accessory['w'] : width * 0.4,
                             80.0, width - 120.0)
            side = (width - cut) / 2.0
            [x, x + width - side].each do |sx|
              Geom3.tube(gents, sx, layout.cavity_y0, z, side, d, height, 15.0)
              Geom3.box(gents, sx, layout.cavity_y0, z, side, d, 15.0)
            end
            Geom3.box(gents, x + side, layout.cavity_y0 + d - 15.0, z, cut, 15.0, height)
            Geom3.finish_part(group, model, name: 'U Drawer', part: 'Drawer Box',
                                            material: layout.material('drawer_box'),
                                            dims: [width, d, height],
                                            length: width, width: d, thick: height,
                                            note: "U cut-out #{cut.round} mm for the trap")

          when 'towel_rail'
            group = Geom3.group_with(ents, 'Towel Rail')
            gents = group.entities
            reach = depth(layout, accessory, 300.0)
            bars = Util.clamp(accessory['count'], 1, 4)
            bars.times do |i|
              Geom3.cylinder(gents, [x + 20.0, layout.cavity_y1 - 40.0 - i * 60.0, z],
                             10.0, [width - 40.0, 40.0].max, :x, 12)
            end
            [x, x + width - 20.0].each do |bx|
              Geom3.box(gents, bx, layout.cavity_y1 - 60.0, z - 30.0, 20.0, 50.0, 60.0)
            end
            Geom3.finish_part(group, model, name: 'Towel Rail', part: 'Accessory',
                                            material: 'chrome',
                                            dims: [width, reach, 20.0],
                                            length: width, width: 20.0, thick: 20.0,
                                            qty: bars, note: 'pull-out towel rail')

          when 'tissue_niche'
            d = depth(layout, accessory, 140.0)
            group = Geom3.group_with(ents, 'Tissue Niche')
            gents = group.entities
            niche_w = [width, 280.0].min
            Geom3.tube(gents, x, layout.cavity_y0, z, niche_w, d, 160.0, 12.0)
            Geom3.box(gents, x, layout.cavity_y0, z, niche_w, d, 12.0)
            Geom3.finish_part(group, model, name: 'Tissue Niche', part: 'Accessory',
                                            material: layout.material('carcass'),
                                            dims: [niche_w, d, 160.0],
                                            length: niche_w, width: d, thick: 160.0,
                                            note: 'concealed tissue / bin niche')

          when 'hair_dryer_holder'
            d = depth(layout, accessory, 180.0)
            group = Geom3.group_with(ents, 'Hair Dryer Holder')
            gents = group.entities
            Geom3.cylinder(gents, [x + 60.0, layout.cavity_y0 + d / 2.0, z], 55.0, 12.0, :z, 20)
            Geom3.tube(gents, x + 10.0, layout.cavity_y0 + d / 2.0 - 50.0, z, 100.0, 100.0, 130.0, 6.0)
            Geom3.box(gents, x, layout.cavity_y0, z + 150.0, 120.0, 60.0, 40.0)
            Geom3.finish_part(group, model, name: 'Hair Dryer Holder', part: 'Accessory',
                                            material: 'ss_brushed',
                                            dims: [120.0, d, 190.0],
                                            length: 120.0, width: d, thick: 190.0,
                                            note: 'with socket box above')

          when 'cutlery_tray', 'plate_rack', 'vanity_drawer'
            d = depth(layout, accessory, layout.cavity_y1 - layout.cavity_y0 - 60.0)
            Drawer.insert(ents, model, accessory['type'], x, layout.cavity_y0, z, width, d, 120.0)
          end
        end

        def humanise_name(key)
          key.to_s.split('_').map(&:capitalize).join(' ')
        end

        def rail(ents, model, layout, x, width, z, accessory)
          d = depth(layout, accessory, layout.cavity_y1 - layout.cavity_y0)
          y = layout.cavity_y0 + d / 2.0
          group = Geom3.group_with(ents, 'Hanging Rail')
          gents = group.entities
          Geom3.cylinder(gents, [x + 6.0, y, z], 15.0, width - 12.0, :x, 16)
          [x, x + width - 12.0].each do |bx|
            Geom3.box(gents, bx, y - 30.0, z - 30.0, 12.0, 60.0, 60.0)
          end
          Geom3.finish_part(group, model,
                            name: 'Hanging Rail', part: 'Hanging Rail',
                            material: 'ss_brushed', dims: [width, 30.0, 30.0],
                            length: width, width: 30.0, thick: 30.0,
                            note: 'oval rail with end supports')
        end

        def corner_mech(ents, model, layout, accessory, x, width, z)
          group = Geom3.group_with(ents, 'Corner Mechanism')
          gents = group.entities
          if accessory['type'] == 'carousel'
            radius = [width, layout.cavity_y1 - layout.cavity_y0].min / 2.0 - 20.0
            2.times do |i|
              Geom3.cylinder(gents, [x + width / 2.0, layout.cavity_y0 + radius + 20.0,
                                     z + 120.0 + i * 380.0], radius, 20.0, :z, 24)
            end
            Geom3.cylinder(gents, [x + width / 2.0, layout.cavity_y0 + radius + 20.0, z],
                           18.0, layout.inner_z1 - z, :z, 12)
          else
            2.times do |i|
              tray_z = z + 80.0 + i * 320.0
              Geom3.box(gents, x + 20.0, layout.cavity_y0 + 40.0, tray_z,
                        width * 0.5, layout.cavity_y1 - layout.cavity_y0 - 80.0, 20.0)
              Geom3.box(gents, x + width * 0.55, layout.cavity_y0 + 40.0, tray_z,
                        width * 0.4, layout.cavity_y1 - layout.cavity_y0 - 120.0, 20.0)
            end
          end
          Geom3.finish_part(group, model,
                            name: accessory['type'], part: 'Corner Mechanism',
                            material: 'chrome',
                            dims: [width, layout.cavity_y1 - layout.cavity_y0, 400.0],
                            length: width, width: 0, thick: 0,
                            note: accessory['type'] == 'carousel' ? '3/4 carousel' : 'magic corner pull-out')
        end
      end
    end
  end
end
