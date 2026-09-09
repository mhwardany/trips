# frozen_string_literal: true

module AHW
  module KD
    module Builders
      # Assembles a complete unit and keeps it re-editable: the params are
      # stored on the group, so rebuilding after a parameter change is a
      # clear-and-redraw inside the same group, preserving its placement.
      module Unit
        module_function

        def create(model, params, transformation = nil, parent = nil)
          params = Params.normalize(params)
          parent ||= model.active_entities
          group = parent.add_group
          build_into(group, model, params)
          Store.write(group, params)
          group.transform!(transformation) if transformation
          group
        end

        def rebuild(group, params)
          model = group.model
          params = Params.normalize(params)
          clear(group)
          build_into(group, model, params)
          Store.write(group, params)
          group
        end

        def clear(group)
          entities = group.entities
          if entities.respond_to?(:clear!)
            entities.clear!
          else
            entities.erase_entities(entities.to_a)
          end
        end

        # ------------------------------------------------------------------
        def build_into(group, model, params)
          layout = Layout.new(params)
          entities = group.entities

          case params['type']
          when 'hood'
            Hood.build(entities, model, layout)
          else
            if diagonal?(params)
              DiagonalCorner.build(entities, model, layout)
              DiagonalCorner.fronts(entities, model, layout)
              Interior.build(entities, model, layout)
              DiagonalCorner.worktop(entities, model, layout)
            else
              Carcass.build(entities, model, layout)
              Interior.build(entities, model, layout)
              Fronts.build(entities, model, layout)
              Worktop.build(entities, model, layout)
              return_leg(entities, model, layout) if l_shaped?(params)
            end
          end

          explode!(group, layout)
          group
        end

        def diagonal?(params)
          %w[base_corner corner_wardrobe].include?(params['type']) &&
            params['corner']['mode'] == 'diagonal'
        end

        def l_shaped?(params)
          %w[base_corner corner_wardrobe].include?(params['type']) &&
            params['corner']['mode'] == 'l'
        end

        # An L corner is manufactured as two carcasses meeting at the angle,
        # so it is drawn that way: the return leg is a full unit in its own
        # right, rotated onto the second wall.
        def return_leg(entities, model, layout)
          spec = layout.params['corner']
          length = spec['return_w'].to_f - layout.d
          return if length <= 150.0

          sub = Util.deep_dup(layout.params)
          sub['type']   = layout.params['type'] == 'corner_wardrobe' ? 'wardrobe' : 'base'
          sub['w']      = length
          sub['d']      = spec['return_d'].to_f
          sub['name']   = "#{layout.params['name']}-R"
          sub['rows']   = spec['front_b'] ? layout.params['rows'] : [Params.row('open')]
          sub['counter']['on'] = false
          sub['sink']['on'] = false
          sub['hob']['on']  = false
          sub['corner']['mode'] = 'none'

          leg_layout = Layout.new(Params.normalize(sub))
          leg = Geom3.group_with(entities, 'Return Leg')
          Carcass.build(leg.entities, model, leg_layout)
          Interior.build(leg.entities, model, leg_layout)
          Fronts.build(leg.entities, model, leg_layout)

          Geom3.rotate!(leg, ORIGIN, ::Geom::Vector3d.new(0, 0, 1), -90.0)
          Geom3.move!(leg, 0.0, spec['return_w'].to_f, 0.0)
          leg
        end

        # ------------------------------------------------------------------
        # Presentation: pull the assembly apart along the depth axis so a
        # drawing can show the make-up of the unit.
        def explode!(group, layout)
          distance = layout.params['explode'].to_f
          return if distance <= 0.1

          group.entities.grep(Sketchup::Group).each do |child|
            case child.name
            when 'Fronts'   then Geom3.move!(child, 0.0, distance, 0.0)
            when 'Interior' then Geom3.move!(child, 0.0, distance * 0.45, 0.0)
            when 'Worktop'  then Geom3.move!(child, 0.0, 0.0, distance * 0.6)
            when 'Plinth'   then Geom3.move!(child, 0.0, distance * 0.25, -distance * 0.3)
            end
          end
        end

        # ------------------------------------------------------------------
        # Build a whole run of units along the X axis in one operation.
        def create_run(model, list, origin = nil)
          origin ||= ORIGIN
          created = []
          cursor = 0.0
          list.each do |entry|
            params = Params.normalize(entry)
            transformation = ::Geom::Transformation.translation(
              ::Geom::Vector3d.new(origin.x + Util.mm(cursor), origin.y, origin.z)
            )
            created << create(model, params, transformation)
            cursor += params['w'].to_f
          end
          created
        end
      end
    end
  end
end
