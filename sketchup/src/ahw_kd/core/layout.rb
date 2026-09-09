# frozen_string_literal: true

module AHW
  module KD
    # Turns a params Hash into the derived dimensions every builder needs.
    # Computing them once here is what keeps carcass, fronts, drawers and
    # worktop in agreement.
    class Layout
      attr_reader :params, :w, :h, :d, :t, :front_t, :back_t, :shelf_t,
                  :plinth_h, :z0, :z1, :top_t, :bottom_t,
                  :back_y0, :back_y1, :cavity_y0, :cavity_y1,
                  :inner_x0, :inner_x1, :inner_w, :inner_z0, :inner_z1, :inner_h,
                  :front_y0, :front_y1, :gap

      def initialize(params)
        @params = params
        @w = params['w'].to_f
        @h = params['h'].to_f
        @d = params['d'].to_f
        @t = params['panel_t'].to_f
        @front_t = params['front_t'].to_f
        @back_t  = params['back_t'].to_f
        @shelf_t = params['shelf_t'].to_f
        @gap = params['front']['gap'].to_f

        @plinth_h = params['plinth']['mode'] == 'none' ? 0.0 : params['plinth']['h'].to_f
        @z0 = @plinth_h
        @z1 = @plinth_h + @h

        @bottom_t = params['bottom_mode'] == 'none' ? 0.0 : @t
        @top_t    = params['top_mode'] == 'none' ? 0.0 : @t

        case params['back_mode']
        when 'none'
          @back_y0 = 0.0
          @back_y1 = 0.0
        when 'grooved'
          @back_y0 = params['back_inset'].to_f
          @back_y1 = @back_y0 + @back_t
        else # rebated | applied
          @back_y0 = 0.0
          @back_y1 = @back_t
        end

        @cavity_y0 = @back_y1
        @cavity_y1 = @d

        @inner_x0 = @t
        @inner_x1 = @w - @t
        @inner_w  = @inner_x1 - @inner_x0
        @inner_z0 = @z0 + @bottom_t
        @inner_z1 = @z1 - @top_t
        @inner_h  = @inner_z1 - @inner_z0

        @front_y0 = @d
        @front_y1 = @d + @front_t
      end

      def type
        params['type']
      end

      def floor_unit?
        Const::FLOOR_TYPES.include?(type)
      end

      def counter?
        params['counter']['on'] && Const::WORKTOP_TYPES.include?(type)
      end

      def counter_t
        counter? ? params['counter']['t'].to_f : 0.0
      end

      def counter_z
        z1 + counter_t
      end

      def total_h
        z1 + counter_t
      end

      # Total front-to-back footprint including doors and worktop overhang.
      def total_d
        far = front_y1
        if counter?
          far = [far, front_y1 + params['counter']['front_oh'].to_f].max
        end
        far
      end

      # The rectangle the fronts have to cover: [x0, x1, z0, z1] in mm plus
      # the y plane where the front's back face sits.
      def front_area
        reveal = params['front']['reveal_top'].to_f
        case params['front']['mode']
        when 'inset'
          [inner_x0 + gap, inner_x1 - gap, inner_z0 + gap, inner_z1 - gap - reveal,
           @d - @front_t]
        when 'overlay_half'
          [@t / 2.0, @w - @t / 2.0, @z0 + @t / 2.0, @z1 - @t / 2.0 - reveal, @d]
        else # overlay_full
          [0.0, @w, @z0, @z1 - reveal, @d]
        end
      end

      def front_face_y
        front_area[4] + @front_t
      end

      # Height available to the front stack.
      def front_span
        area = front_area
        area[3] - area[2]
      end

      def front_width
        area = front_area
        area[1] - area[0]
      end

      # Resolved row heights, bottom to top, honouring rows that ask to fill.
      def row_heights
        rows = params['rows']
        return [] if rows.empty?

        heights = rows.map { |r| appliance_row_height(r) }
        total = front_span - gap * (rows.size - 1)
        Util.distribute(total, heights, 40.0)
      end

      # An appliance row is fixed by the appliance envelope unless overridden.
      def appliance_row_height(row)
        return row['h'].to_f unless row['kind'] == 'appliance' && row['h'].to_f <= 0.0

        spec = Const::APPLIANCES[row['appl']]
        return 0.0 unless spec

        spec[1].to_f + 2.0 # nominal clearance around the appliance
      end

      # Bottom z of each row's front, bottom to top.
      def row_positions
        heights = row_heights
        area = front_area
        z = area[2]
        heights.map do |height|
          bottom = z
          z += height + gap
          [bottom, height]
        end
      end

      def material(role)
        params['materials'][role] || params['materials']['carcass']
      end
    end
  end
end
