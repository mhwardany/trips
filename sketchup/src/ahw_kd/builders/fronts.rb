# frozen_string_literal: true

module AHW
  module KD
    module Builders
      # Walks the front stack row by row and produces doors, drawer fronts,
      # lifts, sliding leaves and appliance openings, then applies the open
      # state so a presentation view can show the unit working.
      module Fronts
        module_function

        def build(entities, model, layout)
          params = layout.params
          return nil if params['rows'].empty?

          x0, x1, _z0, _z1, back_y = layout.front_area
          x0, x1 = blind_adjust(layout, x0, x1)
          width = x1 - x0
          return nil if width <= 20.0

          group = Geom3.group_with(entities, 'Fronts')
          ents = group.entities

          layout.row_positions.each_with_index do |(z, height), index|
            row = params['rows'][index]
            next unless row
            next if height <= 5.0

            Log.guard("row #{index} #{row['kind']}") do
              build_row(ents, model, layout, row, x0, width, z, height, back_y)
              gola_channel(ents, model, layout, row, x0, width, z, height)
            end
          end
          group
        end

        # A hidden grip is a channel fixed to the carcass above the leaf, not
        # hardware on the leaf. Drawing it here keeps the handleless kitchen
        # honest: the leaf stays plain and the grip is a real aluminium section.
        def gola_channel(ents, model, layout, row, x, width, z, height)
          spec = layout.params['front']['handle']
          return unless spec['mount'] == 'hidden'
          return if %w[open appliance sliding].include?(row['kind'])

          depth = Util.clamp(spec['proj'].to_f, 12.0, 60.0)
          face = Util.clamp(spec['dia'].to_f * 2.0, 20.0, 60.0)
          wall = Util.clamp(depth / 4.0, 1.5, 8.0)
          y0 = layout.d - depth
          top = z + height + layout.gap
          bottom = top - face

          group = Geom3.group_with(ents, 'Gola Channel')
          section = [[y0, bottom], [y0, top], [y0 + depth, top], [y0 + depth, top - wall],
                     [y0 + wall, top - wall], [y0 + wall, bottom + wall],
                     [y0 + depth, bottom + wall], [y0 + depth, bottom]]
          Geom3.prism_x(group.entities, x, width, section)
          Geom3.finish_part(group, model,
                            name: 'Gola Channel', part: 'Gola Profile',
                            material: layout.material('hardware'),
                            dims: [width, depth, face],
                            length: width, width: face, thick: depth,
                            note: 'carcass mounted handleless grip')
        end

        # A blind corner only shows a front over the accessible part.
        def blind_adjust(layout, x0, x1)
          return [x0, x1] unless layout.type == 'base_corner' &&
                                 layout.params['corner']['mode'] == 'blind'

          blind = layout.params['corner']['blind_w'].to_f
          if layout.params['corner']['side'] == 'left'
            [x0 + blind, x1]
          else
            [x0, x1 - blind]
          end
        end

        # -------------------------------------------------------------- rows
        def build_row(ents, model, layout, row, x, width, z, height, back_y)
          case row['kind']
          when 'open'      then nil
          when 'drawer'    then drawer_row(ents, model, layout, row, x, width, z, height, back_y)
          when 'lift'      then lift_row(ents, model, layout, row, x, width, z, height, back_y)
          when 'flap'      then flap_row(ents, model, layout, row, x, width, z, height, back_y)
          when 'sliding'   then sliding_row(ents, model, layout, row, x, width, z, height, back_y)
          when 'bifold'    then bifold_row(ents, model, layout, row, x, width, z, height, back_y)
          when 'appliance' then appliance_row(ents, model, layout, row, x, width, z, height, back_y)
          when 'louvre'    then door_row(ents, model, layout, row, x, width, z, height, back_y, 'louvre')
          else door_row(ents, model, layout, row, x, width, z, height, back_y)
          end
        end

        def door_row(ents, model, layout, row, x, width, z, height, back_y, style = nil)
          cols = row['cols'].to_i
          cols = 2 if row['kind'] == 'doors2' && cols < 2
          cols = 1 if cols < 1
          angle = layout.params['open']['doors'].to_f

          Util.columns(width, cols, layout.gap).each_with_index do |(dx, leaf_w), index|
            hinge = leaf_hinge(row, cols, index)
            leaf = Panel.build(ents, model, layout,
                               name: "Door #{index + 1}", part: 'Door',
                               x: x + dx, y: back_y, z: z, w: leaf_w, h: height,
                               style: style || row['style'],
                               handle_horizontal: false)
            next unless leaf

            hinge_hardware(ents, model, layout, x + dx, leaf_w, z, height, hinge, back_y)
            swing!(leaf, hinge, x + dx, x + dx + leaf_w, z, z + height, back_y, angle)
          end
        end

        def leaf_hinge(row, cols, index)
          return row['hinge'] if cols == 1

          index.even? ? 'left' : 'right'
        end

        def drawer_row(ents, model, layout, row, x, width, z, height, back_y)
          group = Geom3.group_with(ents, 'Drawer')
          gents = group.entities
          Panel.build(gents, model, layout,
                      name: 'Drawer Front', part: 'Drawer Front',
                      x: x, y: back_y, z: z, w: width, h: height,
                      style: row['style'], handle_horizontal: true)

          travel = 0.0
          if row['drawer']['box']
            bay_x = layout.inner_x0
            bay_w = layout.inner_w
            travel = Drawer.build(gents, model, layout, row, bay_x, bay_w, z, height).to_f
          end

          percent = layout.params['open']['drawers'].to_f
          Geom3.move!(group, 0.0, travel * percent / 100.0, 0.0) if percent.positive? && travel.positive?
          group
        end

        def flap_row(ents, model, layout, row, x, width, z, height, back_y)
          leaf = Panel.build(ents, model, layout,
                             name: 'Flap', part: 'Flap',
                             x: x, y: back_y, z: z, w: width, h: height,
                             style: row['style'], handle_horizontal: true)
          return unless leaf

          angle = layout.params['open']['lifts'].to_f
          swing!(leaf, 'bottom', x, x + width, z, z + height, back_y, angle)
        end

        def lift_row(ents, model, layout, row, x, width, z, height, back_y)
          angle = layout.params['open']['lifts'].to_f
          system = row['lift']

          if system == 'hf'
            half = (height - layout.gap) / 2.0
            lower = Panel.build(ents, model, layout,
                                name: 'Lift Lower', part: 'Lift Leaf',
                                x: x, y: back_y, z: z, w: width, h: half,
                                style: row['style'], handle_horizontal: true)
            upper = Panel.build(ents, model, layout,
                                name: 'Lift Upper', part: 'Lift Leaf',
                                x: x, y: back_y, z: z + half + layout.gap, w: width, h: half,
                                style: row['style'], no_handle: true)
            top_z = z + height
            joint_z = z + half + layout.gap
            axis = ::Geom::Vector3d.new(1, 0, 0)
            if angle.positive?
              Geom3.rotate!(lower, Geom3.p3(x, back_y, joint_z), axis, -2.0 * angle)
              Geom3.rotate!(lower, Geom3.p3(x, back_y, top_z), axis, angle)
              Geom3.rotate!(upper, Geom3.p3(x, back_y, top_z), axis, angle)
            end
            lift_arm(ents, model, layout, x, width, z, height, system)
            return
          end

          leaf = Panel.build(ents, model, layout,
                             name: 'Lift', part: 'Lift Leaf',
                             x: x, y: back_y, z: z, w: width, h: height,
                             style: row['style'], handle_horizontal: true)
          return unless leaf

          case system
          when 'hs'
            # up and over: pivot sits above and behind the top edge
            Geom3.rotate!(leaf, Geom3.p3(x, back_y + 70.0, z + height + 70.0),
                          ::Geom::Vector3d.new(1, 0, 0), angle)
          when 'hl'
            # parallel lift: no rotation, the leaf rises and steps forward
            factor = Util.clamp(angle / 90.0, 0.0, 1.0)
            Geom3.move!(leaf, 0.0, 90.0 * factor, height * 0.9 * factor)
          else # hk
            swing!(leaf, 'top', x, x + width, z, z + height, back_y, angle)
          end
          lift_arm(ents, model, layout, x, width, z, height, system)
        end

        def sliding_row(ents, model, layout, row, x, width, z, height, back_y)
          panels = row['panels'].to_i
          panels = 2 if panels < 2
          overlap = 40.0
          leaf_w = (width + overlap * (panels - 1)) / panels.to_f
          track_t = layout.front_t + 6.0
          percent = Util.clamp(layout.params['open']['doors'].to_f / 90.0, 0.0, 1.0)

          track(ents, model, layout, x, width, z, height, back_y, panels)

          panels.times do |index|
            offset = index * (leaf_w - overlap)
            y = back_y - index * track_t
            leaf = Panel.build(ents, model, layout,
                               name: "Sliding #{index + 1}", part: 'Sliding Leaf',
                               x: x + offset, y: y, z: z, w: leaf_w, h: height,
                               style: row['style'],
                               handle: 'recessed_round', handle_horizontal: false)
            next unless leaf

            if percent.positive? && index.zero?
              Geom3.move!(leaf, (leaf_w - overlap) * percent, 0.0, 0.0)
            end
          end
        end

        def bifold_row(ents, model, layout, row, x, width, z, height, back_y)
          half = (width - layout.gap) / 2.0
          angle = layout.params['open']['doors'].to_f
          axis = ::Geom::Vector3d.new(0, 0, 1)

          outer = Panel.build(ents, model, layout,
                              name: 'Bifold Outer', part: 'Bifold Leaf',
                              x: x, y: back_y, z: z, w: half, h: height,
                              style: row['style'], handle_horizontal: false)
          inner = Panel.build(ents, model, layout,
                              name: 'Bifold Inner', part: 'Bifold Leaf',
                              x: x + half + layout.gap, y: back_y, z: z, w: half, h: height,
                              style: row['style'], no_handle: true)
          return if angle.zero?

          joint = x + half + layout.gap / 2.0
          Geom3.rotate!(inner, Geom3.p3(joint, back_y, z), axis, -2.0 * angle) if inner
          Geom3.rotate!(inner, Geom3.p3(x, back_y, z), axis, angle) if inner
          Geom3.rotate!(outer, Geom3.p3(x, back_y, z), axis, angle) if outer
        end

        def appliance_row(ents, model, layout, row, x, width, z, height, back_y)
          Appliance.build(ents, model, layout, row, layout.inner_x0, z, layout.inner_w, height)
          return unless row['appl_integrated']

          Panel.build(ents, model, layout,
                      name: 'Integrated Front', part: 'Appliance Front',
                      x: x, y: back_y, z: z, w: width, h: height,
                      style: row['style'],
                      handle_horizontal: true)
        end

        # ---------------------------------------------------------- movement
        def swing!(leaf, hinge, x0, x1, z0, z1, back_y, angle)
          return if angle.abs < 0.01

          case hinge
          when 'right'
            Geom3.rotate!(leaf, Geom3.p3(x1, back_y, z0), ::Geom::Vector3d.new(0, 0, 1), -angle)
          when 'bottom'
            Geom3.rotate!(leaf, Geom3.p3(x0, back_y, z0), ::Geom::Vector3d.new(1, 0, 0), -angle)
          when 'top'
            Geom3.rotate!(leaf, Geom3.p3(x0, back_y, z1), ::Geom::Vector3d.new(1, 0, 0), angle)
          else
            Geom3.rotate!(leaf, Geom3.p3(x0, back_y, z0), ::Geom::Vector3d.new(0, 0, 1), angle)
          end
        end

        # ---------------------------------------------------------- hardware
        def hinge_hardware(ents, model, layout, x, width, z, height, side, back_y)
          return unless Util.bool(layout.params['front']['show_hinges'], true)
          return unless %w[left right].include?(side)

          count = height > 1600 ? 4 : (height > 900 ? 3 : 2)
          plate_x = side == 'left' ? layout.inner_x0 : layout.inner_x1 - 55.0
          group = Geom3.group_with(ents, 'Hinges')
          gents = group.entities
          margin = 90.0
          step = count > 1 ? (height - 2 * margin) / (count - 1).to_f : 0.0

          count.times do |index|
            hz = z + margin + step * index
            Geom3.box(gents, plate_x, layout.cavity_y1 - 90.0, hz - 15.0, 55.0, 60.0, 30.0)
            cup_x = side == 'left' ? x + 22.0 : x + width - 22.0
            Geom3.cylinder(gents, [cup_x, back_y, hz], 17.5, 12.0, :y, 16)
          end
          kind = layout.params['front']['hinge_type']
          Geom3.finish_part(group, model,
                            name: 'Hinges', part: 'Hinge',
                            material: layout.material('hardware'),
                            dims: [55.0, 60.0, 30.0], length: 0, width: 0, thick: 0,
                            qty: count, note: kind.to_s.tr('_', ' '))
        end

        def lift_arm(ents, model, layout, x, width, z, height, system)
          group = Geom3.group_with(ents, 'Lift Mechanism')
          gents = group.entities
          [layout.inner_x0 + 5.0, layout.inner_x1 - 60.0].each do |ax|
            Geom3.box(gents, ax, layout.cavity_y1 - 200.0, z + height - 180.0, 55.0, 190.0, 170.0)
          end
          Geom3.finish_part(group, model,
                            name: "Lift #{system.upcase}", part: 'Lift Mechanism',
                            material: 'ss_brushed', dims: [55.0, 190.0, 170.0],
                            length: 0, width: 0, thick: 0, qty: 2,
                            note: Const::LIFT_SYSTEMS[system].to_s)
        end

        def track(ents, model, layout, x, width, z, height, back_y, panels)
          group = Geom3.group_with(ents, 'Sliding Track')
          gents = group.entities
          depth = layout.front_t * panels + 20.0
          Geom3.box(gents, x, back_y - depth, z + height, width, depth, 40.0)
          Geom3.box(gents, x, back_y - depth, z - 20.0, width, depth, 20.0)
          Geom3.finish_part(group, model,
                            name: 'Sliding Track', part: 'Sliding Track',
                            material: 'alu_anodised', dims: [width, depth, 40.0],
                            length: width, width: depth, thick: 40.0, qty: 2)
        end
      end
    end
  end
end
