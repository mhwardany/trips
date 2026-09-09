# frozen_string_literal: true

module AHW
  module KD
    module Tools
      # Click-to-place tool. Draws the footprint under the cursor, snaps to
      # SketchUp inferences, rotates with the arrow keys and keeps placing in
      # a run until Escape.
      class PlaceTool
        def initialize(params)
          @params = Params.normalize(params)
          @layout = Layout.new(@params)
          @rotation = 0.0
          @point = Sketchup::InputPoint.new
          @last = nil
          @chain = true
        end

        def activate
          @point.clear
          Sketchup.status_text = status
        end

        def deactivate(view)
          view.invalidate
          Sketchup.status_text = ''
        end

        def status
          'AHW: click to place — left/right arrow rotates 90°, ' \
            'Shift toggles run mode, Escape ends'
        end

        def onMouseMove(_flags, x, y, view)
          @point.pick(view, x, y)
          view.tooltip = @point.tooltip
          view.invalidate
        end

        def onKeyDown(key, _repeat, _flags, view)
          case key
          when VK_LEFT  then @rotation = (@rotation + 90.0) % 360.0
          when VK_RIGHT then @rotation = (@rotation - 90.0) % 360.0
          when VK_UP    then @rotation = (@rotation + 15.0) % 360.0
          when VK_DOWN  then @rotation = (@rotation - 15.0) % 360.0
          when 16       then @chain = !@chain   # Shift
          end
          view.invalidate
          true
        end

        def onLButtonDown(_flags, _x, _y, view)
          return unless @point.valid?

          model = view.model
          origin = @point.position
          model.start_operation('AHW Place Unit', true)
          unit = Builders::Unit.create(model, @params, transformation(origin))
          model.commit_operation
          model.selection.clear
          model.selection.add(unit)
          @last = origin

          model.select_tool(nil) unless @chain
          view.invalidate
        end

        def onCancel(_reason, view)
          view.model.select_tool(nil)
        end

        def transformation(origin)
          ::Geom::Transformation.translation(origin - ORIGIN) *
            ::Geom::Transformation.rotation(ORIGIN, ::Geom::Vector3d.new(0, 0, 1),
                                            @rotation.degrees)
        end

        def draw(view)
          @point.draw(view) if @point.valid?
          return unless @point.valid?

          origin = @point.position
          corners = footprint.map do |(x, y, z)|
            transformation(origin) * Geom3.p3(x, y, z)
          end
          view.line_width = 2
          view.drawing_color = 'orange'
          view.draw(GL_LINE_LOOP, corners[0, 4])
          view.draw(GL_LINE_LOOP, corners[4, 4])
          4.times { |i| view.draw(GL_LINES, [corners[i], corners[i + 4]]) }
        end

        def footprint
          w = @params['w'].to_f
          d = @layout.total_d
          h = @layout.total_h
          [[0, 0, 0], [w, 0, 0], [w, d, 0], [0, d, 0],
           [0, 0, h], [w, 0, h], [w, d, h], [0, d, h]]
        end

        def getExtents
          bounds = ::Geom::BoundingBox.new
          bounds.add(@point.position) if @point.valid?
          bounds
        end
      end
    end
  end
end
