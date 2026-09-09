# frozen_string_literal: true

module AHW
  module KD
    module Builders
      # A single front leaf: slab, shaker, glass, louvre ... plus its handle.
      # Everything is drawn in unit coordinates; the caller applies the open
      # transformation afterwards.
      module Panel
        module_function

        # x, z    bottom-left of the leaf in the front plane
        # y       back face of the leaf
        # w, h    leaf size ; t leaf thickness
        def build(parent, model, layout, opts)
          x = opts[:x].to_f
          y = opts[:y].to_f
          z = opts[:z].to_f
          w = opts[:w].to_f
          h = opts[:h].to_f
          t = (opts[:t] || layout.front_t).to_f
          return nil if w <= 1.0 || h <= 1.0

          style = opts[:style] || layout.params['front']['style']
          name  = opts[:name] || 'Front'
          group = Geom3.group_with(parent, name)
          ents  = group.entities
          material = opts[:material] || layout.material('front')

          case style
          when 'shaker'      then shaker(ents, model, layout, x, y, z, w, h, t, material)
          when 'glass_frame' then glass_frame(ents, model, layout, x, y, z, w, h, t, material)
          when 'glass_full'  then glass_full(ents, model, layout, x, y, z, w, h, t)
          when 'louvre'      then louvre(ents, model, layout, x, y, z, w, h, t, material)
          when 'ribbed'      then ribbed(ents, model, layout, x, y, z, w, h, t, material)
          when 'routed', 'profiled' then routed(ents, model, layout, x, y, z, w, h, t, material)
          when 'handleless_j' then j_profile(ents, model, layout, x, y, z, w, h, t, material)
          else slab(ents, model, x, y, z, w, h, t, material)
          end

          handle(ents, model, layout, x, y, z, w, h, t, opts) unless opts[:no_handle]

          dict = group.attribute_dictionary(Const::DICT, true)
          dict[Const::ATTR_KIND] = 'front'
          dict[Const::ATTR_PART] = opts[:part] || 'Door'
          dict['style'] = style
          group
        end

        # ------------------------------------------------------------ styles
        def slab(ents, model, x, y, z, w, h, t, material)
          Geom3.part(ents, model,
                     name: 'Panel', part: 'Front', material: material,
                     x: x, y: y, z: z, w: w, d: t, h: h,
                     length: h, width: w, thick: t, grain: 'height', edges: 'all')
        end

        def shaker(ents, model, layout, x, y, z, w, h, t, material)
          spec = layout.params['front']['shaker']
          rail = Util.clamp(spec['rail'].to_f, 20.0, [w, h].min / 2.0 - 10.0)
          panel_t = Util.clamp(spec['panel_t'].to_f, 3.0, t - 4.0)
          inset = Util.clamp(spec['panel_inset'].to_f, 0.0, t - panel_t)

          # stiles (vertical) then rails (horizontal)
          Geom3.part(ents, model, name: 'Stile L', part: 'Front Stile', material: material,
                                  x: x, y: y, z: z, w: rail, d: t, h: h,
                                  length: h, width: rail, thick: t, grain: 'height', edges: 'all')
          Geom3.part(ents, model, name: 'Stile R', part: 'Front Stile', material: material,
                                  x: x + w - rail, y: y, z: z, w: rail, d: t, h: h,
                                  length: h, width: rail, thick: t, grain: 'height', edges: 'all')
          middle = w - 2 * rail
          if middle > 1.0
            Geom3.part(ents, model, name: 'Rail Bottom', part: 'Front Rail', material: material,
                                    x: x + rail, y: y, z: z, w: middle, d: t, h: rail,
                                    length: middle, width: rail, thick: t, edges: 'all')
            Geom3.part(ents, model, name: 'Rail Top', part: 'Front Rail', material: material,
                                    x: x + rail, y: y, z: z + h - rail, w: middle, d: t, h: rail,
                                    length: middle, width: rail, thick: t, edges: 'all')
            centre_h = h - 2 * rail
            if centre_h > 1.0
              Geom3.part(ents, model, name: 'Centre Panel', part: 'Front Panel', material: material,
                                      x: x + rail - 8.0, y: y + inset, z: z + rail - 8.0,
                                      w: middle + 16.0, d: panel_t, h: centre_h + 16.0,
                                      length: centre_h, width: middle, thick: panel_t, grain: 'height')
            end
          end
        end

        def glass_frame(ents, model, layout, x, y, z, w, h, t, material)
          spec = layout.params['front']['glass']
          frame_w = Util.clamp(spec['frame_w'].to_f, 10.0, [w, h].min / 2.0 - 5.0)
          frame_t = Util.clamp(spec['frame_t'].to_f, 8.0, 60.0)
          glass_t = Util.clamp(spec['glass_t'].to_f, 3.0, 12.0)
          frame_material = spec['frame'] == 'timber' ? material : 'alu_anodised'

          if spec['frame'] != 'none'
            Geom3.part(ents, model, name: 'Frame L', part: 'Door Frame', material: frame_material,
                                    x: x, y: y, z: z, w: frame_w, d: frame_t, h: h,
                                    length: h, width: frame_w, thick: frame_t)
            Geom3.part(ents, model, name: 'Frame R', part: 'Door Frame', material: frame_material,
                                    x: x + w - frame_w, y: y, z: z, w: frame_w, d: frame_t, h: h,
                                    length: h, width: frame_w, thick: frame_t)
            middle = w - 2 * frame_w
            if middle > 1.0
              Geom3.part(ents, model, name: 'Frame B', part: 'Door Frame', material: frame_material,
                                      x: x + frame_w, y: y, z: z, w: middle, d: frame_t, h: frame_w,
                                      length: middle, width: frame_w, thick: frame_t)
              Geom3.part(ents, model, name: 'Frame T', part: 'Door Frame', material: frame_material,
                                      x: x + frame_w, y: y, z: z + h - frame_w,
                                      w: middle, d: frame_t, h: frame_w,
                                      length: middle, width: frame_w, thick: frame_t)
            end
          end

          inset = spec['frame'] == 'none' ? 0.0 : frame_w - 6.0
          glass_w = w - 2 * inset
          glass_h = h - 2 * inset
          return if glass_w <= 1.0 || glass_h <= 1.0

          Geom3.part(ents, model, name: 'Glass', part: 'Glass', material: glass_material(layout),
                                  x: x + inset, y: y + (frame_t - glass_t) / 2.0, z: z + inset,
                                  w: glass_w, d: glass_t, h: glass_h,
                                  length: glass_h, width: glass_w, thick: glass_t)
        end

        def glass_full(ents, model, layout, x, y, z, w, h, t)
          glass_t = Util.clamp(layout.params['front']['glass']['glass_t'].to_f, 4.0, 12.0)
          Geom3.part(ents, model, name: 'Glass', part: 'Glass', material: glass_material(layout),
                                  x: x, y: y, z: z, w: w, d: glass_t, h: h,
                                  length: h, width: w, thick: glass_t)
        end

        def glass_material(layout)
          "glass_#{layout.params['front']['glass']['type']}"
        end

        def louvre(ents, model, layout, x, y, z, w, h, t, material)
          frame_w = 60.0
          Geom3.part(ents, model, name: 'Stile L', part: 'Front Stile', material: material,
                                  x: x, y: y, z: z, w: frame_w, d: t, h: h,
                                  length: h, width: frame_w, thick: t, grain: 'height')
          Geom3.part(ents, model, name: 'Stile R', part: 'Front Stile', material: material,
                                  x: x + w - frame_w, y: y, z: z, w: frame_w, d: t, h: h,
                                  length: h, width: frame_w, thick: t, grain: 'height')
          inner_w = w - 2 * frame_w
          return if inner_w <= 1.0

          pitch = 44.0
          slat_t = 10.0
          count = ((h - 20.0) / pitch).floor
          count = 1 if count < 1
          count.times do |i|
            slat_z = z + 10.0 + i * pitch
            slat = Geom3.group_with(ents, 'Louvre Slat')
            Geom3.box(slat.entities, x + frame_w, y + 2.0, slat_z, inner_w, t - 4.0, slat_t)
            Geom3.rotate!(slat, Geom3.p3(x + frame_w, y + 2.0, slat_z + slat_t / 2.0),
                          ::Geom::Vector3d.new(1, 0, 0), 20.0)
            Geom3.finish_part(slat, model, name: 'Louvre Slat', part: 'Louvre Slat',
                                           material: material, dims: [inner_w, t - 4.0, slat_t],
                                           length: inner_w, width: 44.0, thick: slat_t)
          end
        end

        def ribbed(ents, model, layout, x, y, z, w, h, t, material)
          spec = layout.params['front']['ribbed']
          pitch = Util.clamp(spec['pitch'].to_f, 8.0, 120.0)
          depth = Util.clamp(spec['depth'].to_f, 1.0, t - 4.0)
          base_t = t - depth
          Geom3.part(ents, model, name: 'Panel', part: 'Front', material: material,
                                  x: x, y: y, z: z, w: w, d: base_t, h: h,
                                  length: h, width: w, thick: t, grain: 'height', edges: 'all')
          fins = (w / pitch).floor
          fins = 1 if fins < 1
          fin_w = pitch * 0.6
          fins.times do |i|
            fx = x + i * pitch + (pitch - fin_w) / 2.0
            next if fx + fin_w > x + w

            Geom3.box(ents, fx, y + base_t, z, fin_w, depth, h)
          end
        end

        def routed(ents, model, layout, x, y, z, w, h, t, material)
          border = 60.0
          Geom3.part(ents, model, name: 'Panel', part: 'Front', material: material,
                                  x: x, y: y, z: z, w: w, d: t, h: h,
                                  length: h, width: w, thick: t, grain: 'height', edges: 'all')
          inner_w = w - 2 * border
          inner_h = h - 2 * border
          return if inner_w <= 20.0 || inner_h <= 20.0

          # shallow rebate reading as a routed moulding
          Geom3.box(ents, x + border, y + t - 4.0, z + border, inner_w, 4.0, inner_h)
        end

        def j_profile(ents, model, layout, x, y, z, w, h, t, material)
          grip_h = Util.clamp(h * 0.25, 8.0, 30.0)
          slab(ents, model, x, y, z, w, h - grip_h, t, material)
          # angled grip returned at the top edge of the leaf
          grip = Geom3.group_with(ents, 'J Grip')
          Geom3.box(grip.entities, x, y, z + h - grip_h, w, t, grip_h)
          Geom3.finish_part(grip, model, name: 'J Grip', part: 'Front', material: material,
                                         dims: [w, t, grip_h], length: w, width: grip_h, thick: t)
        end

        # ----------------------------------------------------------- handles
        def handle(ents, model, layout, x, y, z, w, h, t, opts)
          spec = layout.params['front']['handle']
          kind = opts[:handle] || spec['type']
          return if kind == 'none' || kind == 'j_profile' || kind == 'gola' || kind == 'push_open'

          material = spec['material']
          face_y = y + t
          proj = spec['proj'].to_f
          length = Util.clamp(spec['length'].to_f, 30.0, [w, h].max)
          offset = spec['offset'].to_f
          dia = Util.clamp(spec['dia'].to_f, 4.0, 40.0)
          horizontal = opts[:handle_horizontal]
          horizontal = %w[top bottom centre].include?(spec['pos']) if horizontal.nil?

          group = Geom3.group_with(ents, 'Handle')
          gents = group.entities

          if horizontal
            length = [length, w - 20.0].min
            hx = x + (w - length) / 2.0
            hz = case spec['pos']
                 when 'bottom' then z + offset
                 when 'centre' then z + h / 2.0
                 else z + h - offset
                 end
          else
            length = [length, h - 20.0].min
            hz = z + (h - length) / 2.0
            hx = case spec['pos']
                 when 'right' then x + w - offset
                 else x + offset
                 end
          end

          case kind
          when 'knob'
            Geom3.cylinder(gents, [x + w / 2.0, face_y, z + h - offset], dia / 2.0, proj, :y, 16)
            Geom3.cylinder(gents, [x + w / 2.0, face_y + proj, z + h - offset], dia, 8.0, :y, 16)
          when 'edge_pull'
            if horizontal
              Geom3.box(gents, x, face_y, hz - 10.0, w, 18.0, 20.0)
            else
              Geom3.box(gents, hx - 10.0, face_y, z, 20.0, 18.0, h)
            end
          when 'recessed_round'
            Geom3.cylinder(gents, [x + w / 2.0, y, z + h - offset], 35.0, t, :y, 24)
          when 'leather_strap'
            Geom3.box(gents, x + w / 2.0 - 15.0, face_y, z + h - offset - 60.0, 30.0, 6.0, 60.0)
          else # bar
            if horizontal
              Geom3.cylinder(gents, [hx, face_y + proj - dia / 2.0, hz], dia / 2.0, length, :x, 12)
              Geom3.cylinder(gents, [hx + 20.0, face_y, hz], dia / 3.0, proj - dia / 2.0, :y, 8)
              Geom3.cylinder(gents, [hx + length - 20.0, face_y, hz], dia / 3.0, proj - dia / 2.0, :y, 8)
            else
              Geom3.cylinder(gents, [hx, face_y + proj - dia / 2.0, hz], dia / 2.0, length, :z, 12)
              Geom3.cylinder(gents, [hx, face_y, hz + 20.0], dia / 3.0, proj - dia / 2.0, :y, 8)
              Geom3.cylinder(gents, [hx, face_y, hz + length - 20.0], dia / 3.0, proj - dia / 2.0, :y, 8)
            end
          end

          Geom3.finish_part(group, model,
                            name: "Handle #{kind}", part: 'Handle', material: material,
                            dims: [length, proj, dia], length: length, width: dia, thick: proj,
                            note: kind)
        end
      end
    end
  end
end
