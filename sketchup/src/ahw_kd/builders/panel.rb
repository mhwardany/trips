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
        # Corner radius comes from the front spec unless the caller overrides
        # it; a radius only makes sense on a one-piece leaf.
        def radius_for(layout, style)
          return 0.0 unless %w[slab ribbed handleless_j gola].include?(style)

          layout.params['front']['radius'].to_f
        end

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

          radius = radius_for(layout, style)

          case style
          when 'shaker'      then shaker(ents, model, layout, x, y, z, w, h, t, material)
          when 'glass_frame' then glass_frame(ents, model, layout, x, y, z, w, h, t, material)
          when 'glass_full'  then glass_full(ents, model, layout, x, y, z, w, h, t)
          when 'louvre'      then louvre(ents, model, layout, x, y, z, w, h, t, material)
          when 'ribbed'      then ribbed(ents, model, layout, x, y, z, w, h, t, material)
          when 'routed', 'profiled' then routed(ents, model, layout, x, y, z, w, h, t, material)
          when 'handleless_j' then j_profile(ents, model, layout, x, y, z, w, h, t, material)
          else slab(ents, model, x, y, z, w, h, t, material, radius)
          end

          handle(ents, model, layout, x, y, z, w, h, t, opts) unless opts[:no_handle]

          dict = group.attribute_dictionary(Const::DICT, true)
          dict[Const::ATTR_KIND] = 'front'
          dict[Const::ATTR_PART] = opts[:part] || 'Door'
          dict['style'] = style
          group
        end

        # ------------------------------------------------------------ styles
        def slab(ents, model, x, y, z, w, h, t, material, radius = 0.0)
          if radius.to_f < 0.5
            return Geom3.part(ents, model,
                              name: 'Panel', part: 'Front', material: material,
                              x: x, y: y, z: z, w: w, d: t, h: h,
                              length: h, width: w, thick: t, grain: 'height', edges: 'all')
          end

          group = Geom3.group_with(ents, 'Panel')
          Geom3.prism_y(group.entities, y, t, Geom3.rounded_rect(x, z, w, h, radius))
          Geom3.finish_part(group, model,
                            name: 'Panel', part: 'Front', material: material,
                            dims: [w, t, h], length: h, width: w, thick: t,
                            grain: 'height', edges: 'all',
                            note: "R#{radius.round} corners")
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

        # A framed door: aluminium or timber surround with a chosen profile,
        # any infill, and optional glazing bars. This is the aluminium door
        # everyone actually specifies, not a rectangle with a pane in it.
        def glass_frame(ents, model, layout, x, y, z, w, h, t, material)
          spec = layout.params['front']['glass']
          frame_w = Util.clamp(spec['frame_w'].to_f, 10.0, [w, h].min / 2.0 - 5.0)
          frame_t = Util.clamp(spec['frame_t'].to_f, 8.0, 60.0)
          frame_material = spec['frame'] == 'timber' ? material : 'alu_anodised'

          if spec['frame'] == 'none'
            infill(ents, model, layout, spec, x, y, z, w, h, frame_t, material)
            return
          end

          profile = spec['profile']
          [['Frame L', x,                z,                frame_w, h,       :v],
           ['Frame R', x + w - frame_w,  z,                frame_w, h,       :v],
           ['Frame B', x + frame_w,      z,                w - 2 * frame_w, frame_w, :h],
           ['Frame T', x + frame_w,      z + h - frame_w,  w - 2 * frame_w, frame_w, :h]]
            .each do |(name, fx, fz, fw, fh, axis)|
            next if fw <= 0.5 || fh <= 0.5

            frame_member(ents, model, name, frame_material, profile,
                         fx, y, fz, fw, fh, frame_t, axis)
          end

          inset = frame_w - 6.0
          infill(ents, model, layout, spec, x + inset, y, z + inset,
                 w - 2 * inset, h - 2 * inset, frame_t, material)
          glazing_bars(ents, model, spec, frame_material,
                       x + inset, y, z + inset, w - 2 * inset, h - 2 * inset, frame_t)
        end

        # One frame member, drawn from its real section so a slim aluminium
        # profile does not read the same as a classic timber bead.
        def frame_member(ents, model, name, material, profile, x, y, z, w, h, t, axis)
          group = Geom3.group_with(ents, name)
          gents = group.entities

          case profile
          when 'slim'
            Geom3.box(gents, x, y, z, w, t * 0.6, h)
            Geom3.box(gents, x, y + t * 0.6, z, w, t * 0.4, axis == :v ? h : h * 0.55)
          when 'rounded'
            if axis == :v
              Geom3.prism_z(gents, Geom3.rounded_rect(x, y, w, t, [w, t].min / 2.0), z, h)
            else
              Geom3.prism_y(gents, y, t, Geom3.rounded_rect(x, z, w, h, [w, h].min / 2.0))
            end
          when 'classic'
            Geom3.box(gents, x, y, z, w, t, h)
            bead = [w, h].min * 0.35
            if axis == :v
              Geom3.box(gents, x + w - bead, y + t - 6.0, z, bead, 8.0, h)
            else
              Geom3.box(gents, x, y + t - 6.0, z + h - bead, w, 8.0, bead)
            end
          when 'shadow_gap'
            Geom3.box(gents, x, y, z, w, t, h)
            if axis == :v
              Geom3.box(gents, x + w - 4.0, y, z, 4.0, t * 0.5, h)
            else
              Geom3.box(gents, x, y, z + h - 4.0, w, t * 0.5, 4.0)
            end
          else # square
            Geom3.box(gents, x, y, z, w, t, h)
          end

          Geom3.finish_part(group, model,
                            name: name, part: 'Door Frame', material: material,
                            dims: [w, t, h],
                            length: axis == :v ? h : w, width: axis == :v ? w : h,
                            thick: t, note: "#{profile} profile")
        end

        # What sits inside the frame.
        def infill(ents, model, layout, spec, x, y, z, w, h, frame_t, material)
          return if w <= 1.0 || h <= 1.0

          case spec['infill']
          when 'panel'
            thickness = Util.clamp(frame_t * 0.5, 4.0, 22.0)
            Geom3.part(ents, model, name: 'Infill Panel', part: 'Front Panel',
                                    material: spec['panel'],
                                    x: x, y: y + (frame_t - thickness) / 2.0, z: z,
                                    w: w, d: thickness, h: h,
                                    length: h, width: w, thick: thickness, grain: 'height')
          when 'mesh'
            group = Geom3.group_with(ents, 'Mesh')
            gents = group.entities
            pitch = 40.0
            wires = (w / pitch).floor
            rows = (h / pitch).floor
            (1..[wires, 1].max).each { |i| Geom3.box(gents, x + i * pitch - 1.5, y + frame_t / 2.0 - 1.5, z, 3.0, 3.0, h) }
            (1..[rows, 1].max).each { |i| Geom3.box(gents, x, y + frame_t / 2.0 - 1.5, z + i * pitch - 1.5, w, 3.0, 3.0) }
            Geom3.finish_part(group, model, name: 'Mesh', part: 'Infill',
                                            material: 'alu_anodised', dims: [w, 3.0, h],
                                            length: h, width: w, thick: 3.0)
          when 'louvre'
            blades(ents, model, layout, x, y, z, w, h, frame_t, material)
          else
            thickness = Util.clamp(layout.params['front']['glass']['glass_t'].to_f, 3.0, 12.0)
            Geom3.part(ents, model, name: 'Glass', part: 'Glass',
                                    material: glass_material(layout),
                                    x: x, y: y + (frame_t - thickness) / 2.0, z: z,
                                    w: w, d: thickness, h: h,
                                    length: h, width: w, thick: thickness)
          end
        end

        def glazing_bars(ents, model, spec, material, x, y, z, w, h, frame_t)
          horizontal = spec['div_h'].to_i
          vertical = spec['div_v'].to_i
          return if horizontal.zero? && vertical.zero?

          bar = Util.clamp(spec['bar_w'].to_f, 4.0, 80.0)
          group = Geom3.group_with(ents, 'Glazing Bars')
          gents = group.entities
          (1..horizontal).each do |i|
            bz = z + h * i / (horizontal + 1).to_f - bar / 2.0
            Geom3.box(gents, x, y + 2.0, bz, w, frame_t - 4.0, bar)
          end
          (1..vertical).each do |i|
            bx = x + w * i / (vertical + 1).to_f - bar / 2.0
            Geom3.box(gents, bx, y + 2.0, z, bar, frame_t - 4.0, h)
          end
          Geom3.finish_part(group, model, name: 'Glazing Bars', part: 'Door Frame',
                                          material: material, dims: [w, frame_t, bar],
                                          length: w, width: bar, thick: frame_t,
                                          qty: horizontal + vertical)
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

        # A real louvre: stiles and rails, then tilted blades that overlap so
        # the door reads as a louvre in elevation and in section.
        def louvre(ents, model, layout, x, y, z, w, h, t, material)
          frame_w = Util.clamp([w, h].min * 0.12, 45.0, 90.0)
          [['Stile L', x, z, frame_w, h, :v],
           ['Stile R', x + w - frame_w, z, frame_w, h, :v],
           ['Rail B', x + frame_w, z, w - 2 * frame_w, frame_w, :h],
           ['Rail T', x + frame_w, z + h - frame_w, w - 2 * frame_w, frame_w, :h]]
            .each do |(name, fx, fz, fw, fh, axis)|
            next if fw <= 0.5 || fh <= 0.5

            Geom3.part(ents, model, name: name, part: axis == :v ? 'Front Stile' : 'Front Rail',
                                    material: material,
                                    x: fx, y: y, z: fz, w: fw, d: t, h: fh,
                                    length: axis == :v ? h : fw, width: axis == :v ? fw : fh,
                                    thick: t, grain: axis == :v ? 'height' : 'length',
                                    edges: 'all')
          end

          blades(ents, model, layout, x + frame_w, y, z + frame_w,
                 w - 2 * frame_w, h - 2 * frame_w, t, material)
        end

        # The blades themselves, shared by the louvre door and the louvre
        # infill of a framed door.
        def blades(ents, model, layout, x, y, z, w, h, t, material)
          return if w <= 20.0 || h <= 20.0

          angle = 22.0
          blade_w = Util.clamp(t * 2.6, 26.0, 46.0)   # across the blade
          blade_t = Util.clamp(t * 0.45, 5.0, 10.0)   # blade thickness
          rad = angle * Math::PI / 180.0
          pitch = blade_w * Math.cos(rad) * 0.82      # overlap, so no see-through
          count = ((h - 6.0) / pitch).floor
          count = 1 if count < 1
          spare = h - (count - 1) * pitch
          first_z = z + spare / 2.0

          # blade cross-section in the YZ plane, rotated about its centre
          ux = Math.cos(rad)
          uz = -Math.sin(rad)
          vx = Math.sin(rad)
          vz = Math.cos(rad)
          centre_y = y + t / 2.0

          group = Geom3.group_with(ents, 'Louvre Blades')
          gents = group.entities
          count.times do |i|
            cz = first_z + i * pitch
            corners = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map do |(a, b)|
              [centre_y + a * blade_w / 2.0 * ux + b * blade_t / 2.0 * vx,
               cz + a * blade_w / 2.0 * uz + b * blade_t / 2.0 * vz]
            end
            Geom3.prism_x(gents, x, w, corners)
          end
          Geom3.finish_part(group, model,
                            name: 'Louvre Blade', part: 'Louvre Blade', material: material,
                            dims: [w, blade_t, blade_w],
                            length: w, width: blade_w, thick: blade_t,
                            qty: count, note: "#{angle.round} deg tilt, #{pitch.round} mm pitch")
        end

        def ribbed(ents, model, layout, x, y, z, w, h, t, material)
          spec = layout.params['front']['ribbed']
          pitch = Util.clamp(spec['pitch'].to_f, 8.0, 120.0)
          depth = Util.clamp(spec['depth'].to_f, 1.0, t - 4.0)
          base_t = t - depth
          slab(ents, model, x, y, z, w, h, base_t, material, radius_for(layout, 'ribbed'))
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
          slab(ents, model, x, y, z, w, h - grip_h, t, material, radius_for(layout, 'slab'))
          # angled grip returned at the top edge of the leaf
          grip = Geom3.group_with(ents, 'J Grip')
          Geom3.box(grip.entities, x, y, z + h - grip_h, w, t, grip_h)
          Geom3.finish_part(grip, model, name: 'J Grip', part: 'Front', material: material,
                                         dims: [w, t, grip_h], length: w, width: grip_h, thick: t)
        end

        # ----------------------------------------------------------- handles
        # Every handle is drawn parametrically from the same anchor, so any
        # shape works on any leaf, in any finish, horizontal or vertical.
        def handle(ents, model, layout, x, y, z, w, h, t, opts)
          spec = layout.params['front']['handle']
          kind = opts[:handle] || spec['type']
          return if Const::HANDLE_NONE.include?(kind)
          return unless Const::HANDLE_TYPES.include?(kind)
          # a hidden grip lives on the carcass, not on the leaf
          return if spec['mount'] == 'hidden'

          anchor = anchor_for(spec, kind, x, y, z, w, h, t, opts)
          return if anchor.nil?

          group = Geom3.group_with(ents, 'Handle')
          gents = group.entities
          finish = opts[:handle_material] || spec['material']

          case kind
          when *Const::HANDLE_PROFILES
            profile_handle(gents, anchor, spec, kind, x, w)
          when 'bar'          then bar_handle(gents, anchor, spec, :round)
          when 'bar_square'   then bar_handle(gents, anchor, spec, :square)
          when 'tubular'      then bar_handle(gents, anchor, spec, :round, 8.0)
          when 't_bar'        then t_bar_handle(gents, anchor, spec)
          when 'd_handle'     then d_handle(gents, anchor, spec)
          when 'knob_round', 'knob_square', 'knob_knurled',
               'knob_ceramic', 'knob_crystal' then knob_handle(gents, anchor, spec, kind)
          when 'cup_pull'     then cup_handle(gents, anchor, spec)
          when 'shell_pull'   then shell_handle(gents, anchor, spec)
          when 'ring_pull'    then ring_handle(gents, anchor, spec)
          when 'drop_pull'    then drop_handle(gents, anchor, spec)
          when 'edge_pull'    then edge_handle(gents, anchor, spec, x, z, w, h)
          when 'finger_pull'  then finger_handle(gents, anchor, spec, x, w, t)
          when 'recessed_round' then Geom3.cylinder(gents, [anchor[:cx], anchor[:back_y], anchor[:cz]],
                                                    35.0, t, :y, 24)
          when 'recessed_rect'  then Geom3.box(gents, anchor[:cx] - 60.0, anchor[:back_y],
                                               anchor[:cz] - 20.0, 120.0, t, 40.0)
          when 'leather_strap'  then leather_handle(gents, anchor, spec)
          when 'timber_dowel'   then dowel_handle(gents, anchor, spec)
          when 'mid_century'    then wedge_handle(gents, anchor, spec)
          end

          Geom3.finish_part(group, model,
                            name: "Handle #{kind}", part: 'Handle', material: finish,
                            dims: [anchor[:length], spec['proj'].to_f, spec['dia'].to_f],
                            length: anchor[:length], width: spec['dia'].to_f,
                            thick: spec['proj'].to_f,
                            note: "#{kind} / #{Materials.label(finish)}")
          group
        end

        # Where the handle sits on the leaf, and which way it runs.
        def anchor_for(spec, kind, x, y, z, w, h, t, opts)
          horizontal = opts[:handle_horizontal]
          horizontal = %w[top bottom centre].include?(spec['pos']) if horizontal.nil?
          horizontal = true if Const::HANDLE_ALWAYS_HORIZONTAL.include?(kind)
          offset = spec['offset'].to_f
          length = spec['length'].to_f
          # a built-in handle is let into the leaf instead of sitting on it
          face_y = y + t
          if spec['mount'] == 'built_in'
            face_y = y + t - Util.clamp(spec['proj'].to_f, 0.0, t - 2.0)
          end

          if horizontal
            length = Util.clamp(length, 20.0, [w - 16.0, 20.0].max)
            start = x + (w - length) / 2.0
            centre_z = case spec['pos']
                       when 'bottom' then z + offset
                       when 'centre' then z + h / 2.0
                       else z + h - offset
                       end
            centre_z = Util.clamp(centre_z, z + 15.0, z + h - 15.0)
            { horizontal: true, start: start, length: length, mount: spec['mount'],
              cx: x + w / 2.0, cz: centre_z, face_y: face_y, back_y: y,
              leaf_x: x, leaf_z: z, leaf_w: w, leaf_h: h, t: t }
          else
            length = Util.clamp(length, 20.0, [h - 16.0, 20.0].max)
            start_z = z + (h - length) / 2.0
            side = spec['side']
            side = spec['pos'] == 'right' ? 'right' : 'left' if side == 'auto'
            centre_x = side == 'right' ? x + w - offset : x + offset
            centre_x = Util.clamp(centre_x, x + 15.0, x + w - 15.0)
            { horizontal: false, start: start_z, length: length, mount: spec['mount'],
              cx: centre_x, cz: z + h / 2.0, face_y: face_y, back_y: y,
              leaf_x: x, leaf_z: z, leaf_w: w, leaf_h: h, t: t }
          end
        end

        # ------------------------------------------------------------ shapes
        def bar_handle(ents, anchor, spec, section, post_inset = 20.0)
          dia = Util.clamp(spec['dia'].to_f, 4.0, 40.0)
          proj = Util.clamp(spec['proj'].to_f, dia, 120.0)
          bar_y = anchor[:face_y] + proj - dia / 2.0
          length = anchor[:length]

          if anchor[:horizontal]
            if section == :square
              Geom3.box(ents, anchor[:start], bar_y - dia / 2.0, anchor[:cz] - dia / 2.0,
                        length, dia, dia)
            else
              Geom3.cylinder(ents, [anchor[:start], bar_y, anchor[:cz]], dia / 2.0, length, :x, 16)
            end
            posts(ents, anchor, spec, dia, proj, post_inset)
          else
            if section == :square
              Geom3.box(ents, anchor[:cx] - dia / 2.0, bar_y - dia / 2.0, anchor[:start],
                        dia, dia, length)
            else
              Geom3.cylinder(ents, [anchor[:cx], bar_y, anchor[:start]], dia / 2.0, length, :z, 16)
            end
            posts(ents, anchor, spec, dia, proj, post_inset)
          end
        end

        def posts(ents, anchor, spec, dia, proj, inset)
          stem = [dia / 3.0, 3.0].max
          height = [proj - dia / 2.0, 2.0].max
          if inset <= 0.0
            return # tubular: the bar returns straight into the leaf
          end

          if anchor[:horizontal]
            [anchor[:start] + inset, anchor[:start] + anchor[:length] - inset].each do |px|
              Geom3.cylinder(ents, [px, anchor[:face_y], anchor[:cz]], stem, height, :y, 10)
            end
          else
            [anchor[:start] + inset, anchor[:start] + anchor[:length] - inset].each do |pz|
              Geom3.cylinder(ents, [anchor[:cx], anchor[:face_y], pz], stem, height, :y, 10)
            end
          end
        end

        def t_bar_handle(ents, anchor, spec)
          dia = Util.clamp(spec['dia'].to_f, 4.0, 40.0)
          proj = Util.clamp(spec['proj'].to_f, dia, 120.0)
          bar_y = anchor[:face_y] + proj - dia / 2.0
          if anchor[:horizontal]
            Geom3.cylinder(ents, [anchor[:start], bar_y, anchor[:cz]], dia / 2.0, anchor[:length], :x, 16)
            Geom3.cylinder(ents, [anchor[:cx], anchor[:face_y], anchor[:cz]],
                           dia / 2.5, proj - dia / 2.0, :y, 10)
          else
            Geom3.cylinder(ents, [anchor[:cx], bar_y, anchor[:start]], dia / 2.0, anchor[:length], :z, 16)
            Geom3.cylinder(ents, [anchor[:cx], anchor[:face_y], anchor[:cz]],
                           dia / 2.5, proj - dia / 2.0, :y, 10)
          end
        end

        def d_handle(ents, anchor, spec)
          dia = Util.clamp(spec['dia'].to_f, 6.0, 40.0)
          proj = Util.clamp(spec['proj'].to_f, dia + 8.0, 120.0)
          bar_y = anchor[:face_y] + proj - dia / 2.0
          leg = dia * 1.6

          if anchor[:horizontal]
            span = anchor[:length] - 2 * leg
            span = anchor[:length] * 0.5 if span < 20.0
            Geom3.cylinder(ents, [anchor[:start] + (anchor[:length] - span) / 2.0, bar_y, anchor[:cz]],
                           dia / 2.0, span, :x, 16)
            reach = [proj - dia, 2.0].max
            [anchor[:start], anchor[:start] + anchor[:length] - leg].each do |px|
              Geom3.box(ents, px, anchor[:face_y], anchor[:cz] - dia / 2.0, leg, reach, dia)
            end
          else
            span = anchor[:length] - 2 * leg
            span = anchor[:length] * 0.5 if span < 20.0
            Geom3.cylinder(ents, [anchor[:cx], bar_y, anchor[:start] + (anchor[:length] - span) / 2.0],
                           dia / 2.0, span, :z, 16)
            reach = [proj - dia, 2.0].max
            [anchor[:start], anchor[:start] + anchor[:length] - leg].each do |pz|
              Geom3.box(ents, anchor[:cx] - dia / 2.0, anchor[:face_y], pz, dia, reach, leg)
            end
          end
        end

        # Continuous aluminium profiles. These run the full leaf, so they are
        # drawn from a real section rather than sized like a pull handle.
        def profile_handle(ents, anchor, spec, kind, x, w)
          hh = Util.clamp(spec['dia'].to_f * 2.0, 18.0, 80.0)   # face height of the profile
          proj = Util.clamp(spec['proj'].to_f, 8.0, 60.0)
          wt = Util.clamp(proj / 4.0, 1.5, 8.0)
          y0 = anchor[:face_y]
          top = anchor[:cz] + hh / 2.0
          bottom = anchor[:cz] - hh / 2.0

          section =
            case kind
            when 'profile_c'
              # channel with a return top and bottom
              [[y0, bottom], [y0, top], [y0 + proj, top], [y0 + proj, top - wt],
               [y0 + wt, top - wt], [y0 + wt, bottom + wt], [y0 + proj, bottom + wt],
               [y0 + proj, bottom]]
            when 'profile_l'
              # single return at the top
              [[y0, bottom], [y0, top], [y0 + proj, top], [y0 + proj, top - wt],
               [y0 + wt, top - wt], [y0 + wt, bottom]]
            when 'profile_j'
              # return with an upturned lip, the J grip
              [[y0, bottom], [y0, top], [y0 + proj, top], [y0 + proj, top - wt * 2.2],
               [y0 + proj - wt, top - wt * 2.2], [y0 + proj - wt, top - wt],
               [y0 + wt, top - wt], [y0 + wt, bottom]]
            when 'profile_round'
              half = (0..10).map do |i|
                angle = Math::PI * i / 10.0 - Math::PI / 2.0
                [y0 + proj * Math.cos(angle) * 0.5 + proj * 0.5,
                 anchor[:cz] + hh / 2.0 * Math.sin(angle)]
              end
              [[y0, bottom]] + half + [[y0, top]]
            when 'profile_trim'
              # flat trim, barely proud of the face
              [[y0, bottom], [y0, top], [y0 + wt * 1.5, top], [y0 + wt * 1.5, bottom]]
            else # profile_slim
              [[y0, bottom], [y0, top], [y0 + proj, top],
               [y0 + proj, top - hh * 0.45], [y0 + wt, bottom]]
            end

          Geom3.prism_x(ents, x, w, section)
        end

        def knob_handle(ents, anchor, spec, kind)
          dia = Util.clamp(spec['dia'].to_f, 8.0, 60.0)
          proj = Util.clamp(spec['proj'].to_f, 12.0, 80.0)
          stem = [dia / 3.0, 4.0].max
          cx = anchor[:cx]
          cz = anchor[:horizontal] ? anchor[:cz] : anchor[:cz]

          Geom3.cylinder(ents, [cx, anchor[:face_y], cz], stem, proj * 0.55, :y, 12)
          head_y = anchor[:face_y] + proj * 0.55

          case kind
          when 'knob_square'
            Geom3.box(ents, cx - dia, head_y, cz - dia, dia * 2, proj * 0.45, dia * 2)
          when 'knob_knurled'
            Geom3.cylinder(ents, [cx, head_y, cz], dia, proj * 0.45, :y, 20)
            Geom3.cylinder(ents, [cx, head_y + proj * 0.45, cz], dia * 0.8, 4.0, :y, 20)
          when 'knob_ceramic'
            Geom3.cylinder(ents, [cx, head_y, cz], dia * 0.75, proj * 0.2, :y, 20)
            Geom3.cylinder(ents, [cx, head_y + proj * 0.2, cz], dia, proj * 0.25, :y, 20)
          when 'knob_crystal'
            Geom3.cylinder(ents, [cx, head_y, cz], dia, proj * 0.45, :y, 8)
          else
            Geom3.cylinder(ents, [cx, head_y, cz], dia, proj * 0.45, :y, 20)
          end
        end

        # Classic cup / shell pulls, always horizontal. Drawn as a real C
        # section swept along the leaf so the cup is hollow, not a solid block.
        def cup_handle(ents, anchor, spec)
          height = Util.clamp(spec['dia'].to_f * 2.6, 26.0, 70.0)
          proj = Util.clamp(spec['proj'].to_f, 14.0, 50.0)
          wall = Util.clamp(proj / 5.0, 2.0, 6.0)
          y0 = anchor[:face_y]
          top = anchor[:cz] + height / 2.0
          bottom = anchor[:cz] - height / 2.0
          section = [[y0, bottom], [y0, top], [y0 + proj, top],
                     [y0 + proj, top - wall], [y0 + wall, top - wall],
                     [y0 + wall, bottom]]
          Geom3.prism_x(ents, anchor[:start], anchor[:length], section)
        end

        def shell_handle(ents, anchor, spec)
          length = anchor[:length]
          height = Util.clamp(spec['dia'].to_f * 2.2, 22.0, 60.0)
          proj = Util.clamp(spec['proj'].to_f, 12.0, 45.0)
          x = anchor[:start]
          section = [[anchor[:face_y], anchor[:cz] + height / 2.0],
                     [anchor[:face_y] + proj, anchor[:cz] + height / 4.0],
                     [anchor[:face_y] + proj, anchor[:cz] - height / 4.0],
                     [anchor[:face_y], anchor[:cz] - height / 2.0]]
          Geom3.prism_x(ents, x, length, section)
        end

        def ring_handle(ents, anchor, spec)
          dia = Util.clamp(spec['dia'].to_f * 2.4, 24.0, 90.0)
          proj = Util.clamp(spec['proj'].to_f, 10.0, 50.0)
          cx = anchor[:cx]
          cz = anchor[:cz]
          Geom3.cylinder(ents, [cx, anchor[:face_y], cz], dia * 0.34, 6.0, :y, 16)   # back plate
          Geom3.cylinder(ents, [cx, anchor[:face_y] + 6.0, cz], 4.0, proj * 0.4, :y, 8)
          # ring approximated by small links so it works without solid tools
          tube = [dia / 12.0, 2.0].max
          16.times do |i|
            angle = 2 * Math::PI * i / 16.0
            Geom3.cylinder(ents,
                           [cx + dia / 2.0 * Math.cos(angle),
                            anchor[:face_y] + proj * 0.4,
                            cz - dia / 2.0 + dia / 2.0 * Math.sin(angle)],
                           tube, tube * 2.4, :y, 6)
          end
        end

        def drop_handle(ents, anchor, spec)
          dia = Util.clamp(spec['dia'].to_f, 6.0, 30.0)
          proj = Util.clamp(spec['proj'].to_f, 12.0, 60.0)
          length = Util.clamp(anchor[:length] * 0.5, 40.0, 140.0)
          cx = anchor[:cx]
          cz = anchor[:cz]
          Geom3.box(ents, cx - 22.0, anchor[:face_y], cz - 10.0, 44.0, 5.0, 20.0)  # back plate
          Geom3.cylinder(ents, [cx, anchor[:face_y] + 5.0, cz], dia / 2.5, proj * 0.5, :y, 10)
          Geom3.cylinder(ents, [cx, anchor[:face_y] + proj * 0.5, cz - length], dia / 2.0, length, :z, 12)
          Geom3.cylinder(ents, [cx, anchor[:face_y] + proj * 0.5, cz - length], dia, 8.0, :y, 12)
        end

        def edge_handle(ents, anchor, spec, x, z, w, h)
          proj = Util.clamp(spec['proj'].to_f, 10.0, 40.0)
          size = Util.clamp(spec['dia'].to_f * 1.6, 16.0, 40.0)
          if anchor[:horizontal]
            Geom3.box(ents, x, anchor[:face_y], anchor[:cz] - size / 2.0, w, proj, size)
          else
            Geom3.box(ents, anchor[:cx] - size / 2.0, anchor[:face_y], z, size, proj, h)
          end
        end

        # The C channel let into the top edge of the leaf. Drawn 0.3 mm proud
        # of the face so it reads as a recess without z-fighting the panel.
        def finger_handle(ents, anchor, spec, x, w, t)
          height = Util.clamp(spec['dia'].to_f * 2.0, 16.0, 50.0)
          depth = Util.clamp(t * 0.6, 4.0, 14.0)
          top = anchor[:leaf_z] + anchor[:leaf_h]
          y0 = anchor[:back_y] + t - depth
          section = [[y0, top - height], [y0, top], [y0 + depth + 0.3, top],
                     [y0 + depth + 0.3, top - 3.0], [y0 + 3.0, top - 3.0],
                     [y0 + 3.0, top - height]]
          Geom3.prism_x(ents, x + 15.0, [w - 30.0, 10.0].max, section)
        end

        def leather_handle(ents, anchor, spec)
          width = Util.clamp(spec['dia'].to_f * 2.2, 20.0, 60.0)
          proj = Util.clamp(spec['proj'].to_f, 20.0, 90.0)
          length = Util.clamp(anchor[:length] * 0.6, 60.0, 220.0)
          if anchor[:horizontal]
            Geom3.box(ents, anchor[:cx] - length / 2.0, anchor[:face_y], anchor[:cz] - width / 2.0,
                      length, 5.0, width)
            Geom3.box(ents, anchor[:cx] - length / 2.0, anchor[:face_y], anchor[:cz] - width / 2.0,
                      6.0, proj, width)
            Geom3.box(ents, anchor[:cx] + length / 2.0 - 6.0, anchor[:face_y],
                      anchor[:cz] - width / 2.0, 6.0, proj, width)
          else
            Geom3.box(ents, anchor[:cx] - width / 2.0, anchor[:face_y], anchor[:start],
                      width, 5.0, length)
            Geom3.box(ents, anchor[:cx] - width / 2.0, anchor[:face_y], anchor[:start],
                      width, proj, 6.0)
            Geom3.box(ents, anchor[:cx] - width / 2.0, anchor[:face_y],
                      anchor[:start] + length - 6.0, width, proj, 6.0)
          end
        end

        def dowel_handle(ents, anchor, spec)
          dia = Util.clamp(spec['dia'].to_f * 1.6, 12.0, 40.0)
          proj = Util.clamp(spec['proj'].to_f, dia, 90.0)
          bar_y = anchor[:face_y] + proj - dia / 2.0
          if anchor[:horizontal]
            Geom3.cylinder(ents, [anchor[:start], bar_y, anchor[:cz]], dia / 2.0, anchor[:length], :x, 12)
          else
            Geom3.cylinder(ents, [anchor[:cx], bar_y, anchor[:start]], dia / 2.0, anchor[:length], :z, 12)
          end
          posts(ents, anchor, spec, dia, proj, 14.0)
        end

        # Tapered mid-century pull, cut from solid timber.
        def wedge_handle(ents, anchor, spec)
          height = Util.clamp(spec['dia'].to_f * 2.4, 24.0, 70.0)
          proj = Util.clamp(spec['proj'].to_f, 16.0, 70.0)
          length = anchor[:length]
          if anchor[:horizontal]
            section = [[anchor[:face_y], anchor[:cz] + height / 2.0],
                       [anchor[:face_y] + proj, anchor[:cz] + height / 6.0],
                       [anchor[:face_y] + proj, anchor[:cz] - height / 6.0],
                       [anchor[:face_y], anchor[:cz] - height / 2.0]]
            Geom3.prism_x(ents, anchor[:start], length, section)
          else
            Geom3.box(ents, anchor[:cx] - height / 2.0, anchor[:face_y], anchor[:start],
                      height, proj, length)
          end
        end
      end
    end
  end
end
