# frozen_string_literal: true

module AHW
  module KD
    module Builders
      # Appliances are either a parametric placeholder built here, or an
      # external .skp component the user supplies. The placeholder always
      # carries the correct cut-out envelope so the joinery stays right even
      # when the real block is swapped in later.
      module Appliance
        DEFAULTS_KEY = 'AHW_KD_Appliances'

        module_function

        # Persisted map of appliance key => .skp path, so a studio can point
        # the plugin at its own block library once.
        def library
          raw = Sketchup.read_default(DEFAULTS_KEY, 'paths', '{}')
          JSON.parse(raw)
        rescue StandardError
          {}
        end

        def library_set(key, path)
          map = library
          if path.to_s.strip.empty?
            map.delete(key.to_s)
          else
            map[key.to_s] = path.to_s
          end
          Sketchup.write_default(DEFAULTS_KEY, 'paths', JSON.generate(map))
          map
        end

        def envelope(row)
          spec = Const::APPLIANCES[row['appl']] || Const::APPLIANCES['custom']
          spec.map(&:to_f)
        end

        # x, z  bottom-left of the appliance opening in the carcass
        def build(parent, model, layout, row, x, z, w, h)
          spec_w, _spec_h, spec_d = envelope(row)
          depth = [spec_d, layout.d - 20.0].min
          width = [w, spec_w].min
          width = w if width <= 0
          bx = x + (w - width) / 2.0
          by = layout.cavity_y1 - depth

          group = Geom3.group_with(parent, "Appliance #{row['appl']}")
          dict = group.attribute_dictionary(Const::DICT, true)
          dict[Const::ATTR_KIND] = 'appliance'
          dict['appliance'] = row['appl'].to_s
          dict['envelope']  = [width, h, depth].map { |v| Util.round_mm(v) }.join(' x ')

          path = row['block'].to_s.strip
          path = library[row['appl'].to_s].to_s if path.empty?

          unless path.empty?
            placed = place_block(group, model, path, bx, by, z, width, h, depth)
            return group if placed
          end

          placeholder(group.entities, model, row['appl'].to_s, bx, by, z, width, h, depth)
          group
        end

        # ----------------------------------------------------- external block
        def place_block(group, model, path, x, y, z, w, h, d)
          return false unless File.exist?(path)

          definition = model.definitions.load(path)
          return false unless definition

          instance = group.entities.add_instance(definition, ::Geom::Transformation.new)
          bounds = definition.bounds
          if bounds.width > 0 && bounds.height > 0 && bounds.depth > 0
            sx = Util.mm(w) / bounds.width
            sy = Util.mm(d) / bounds.depth
            sz = Util.mm(h) / bounds.height
            # uniform-ish scaling keeps the block from looking distorted
            scale = ::Geom::Transformation.scaling(ORIGIN, sx, sy, sz)
            instance.transform!(scale)
          end
          offset = instance.bounds.min
          instance.transform!(::Geom::Transformation.translation(
                                ::Geom::Vector3d.new(Util.mm(x) - offset.x,
                                                     Util.mm(y) - offset.y,
                                                     Util.mm(z) - offset.z)
                              ))
          group.attribute_dictionary(Const::DICT, true)['block'] = path
          true
        rescue StandardError => e
          Log.error(e, "Appliance.place_block #{path}")
          false
        end

        # ------------------------------------------------------- placeholder
        def placeholder(ents, model, kind, x, y, z, w, h, d)
          body = Geom3.group_with(ents, 'Body')
          Geom3.box(body.entities, x, y, z, w, d, h)
          Materials.paint(model, body, 'appliance_steel')

          face_y = y + d
          front = Geom3.group_with(ents, 'Front')
          fents = front.entities

          case kind
          when 'oven', 'oven_double', 'microwave', 'coffee', 'wine_cooler', 'warming'
            Geom3.box(fents, x + 20.0, face_y - 6.0, z + 20.0, w - 40.0, 8.0, h - 90.0)
            Materials.paint(model, front, 'appliance_black')
            control = Geom3.group_with(ents, 'Controls')
            Geom3.box(control.entities, x + 20.0, face_y - 6.0, z + h - 60.0, w - 40.0, 8.0, 45.0)
            Materials.paint(model, control, 'appliance_black')
            bar = Geom3.group_with(ents, 'Handle')
            Geom3.cylinder(bar.entities, [x + 30.0, face_y + 25.0, z + h - 78.0],
                           9.0, w - 60.0, :x, 12)
            Materials.paint(model, bar, 'ss_brushed')
          when 'dishwasher', 'dishwasher_slim', 'washer', 'dryer', 'washer_dryer'
            Geom3.box(fents, x + 10.0, face_y - 4.0, z + 10.0, w - 20.0, 6.0, h - 120.0)
            Materials.paint(model, front, 'appliance_steel')
            if kind.start_with?('washer') || kind == 'dryer'
              porthole = Geom3.group_with(ents, 'Door')
              Geom3.cylinder(porthole.entities, [x + w / 2.0, face_y, z + h / 2.0 - 40.0],
                             [w, h].min / 3.2, 24.0, :y, 24)
              Materials.paint(model, porthole, 'glass_smoked')
            end
            panel = Geom3.group_with(ents, 'Controls')
            Geom3.box(panel.entities, x + 10.0, face_y - 4.0, z + h - 100.0, w - 20.0, 6.0, 80.0)
            Materials.paint(model, panel, 'appliance_black')
          when 'fridge', 'fridge_tall', 'freezer'
            split = z + h * 0.62
            Geom3.box(fents, x + 6.0, face_y - 4.0, z + 6.0, w - 12.0, 8.0, split - z - 10.0)
            Geom3.box(fents, x + 6.0, face_y - 4.0, split, w - 12.0, 8.0, z + h - split - 6.0)
            Materials.paint(model, front, 'appliance_steel')
            bar = Geom3.group_with(ents, 'Handle')
            Geom3.cylinder(bar.entities, [x + w - 60.0, face_y + 26.0, split - 400.0],
                           9.0, 380.0, :z, 12)
            Geom3.cylinder(bar.entities, [x + w - 60.0, face_y + 26.0, split + 40.0],
                           9.0, 380.0, :z, 12)
            Materials.paint(model, bar, 'ss_brushed')
          when 'kettle', 'toaster', 'coffee_machine', 'blender'
            Materials.paint(model, body, 'appliance_black')
          when 'tv'
            Geom3.box(fents, x + 8.0, face_y - 4.0, z + 8.0, w - 16.0, 6.0, h - 16.0)
            Materials.paint(model, front, 'glass_lacobel')
          else
            Materials.paint(model, front, 'appliance_steel')
          end
          ents
        end
      end
    end
  end
end
