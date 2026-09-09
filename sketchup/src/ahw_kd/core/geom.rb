# frozen_string_literal: true

module AHW
  module KD
    # Low level geometry primitives. Everything here takes millimetres and
    # converts to SketchUp's internal inches at the boundary, so the builders
    # above never deal with unit conversion.
    #
    # Local axes for every unit. The origin sits at the BACK bottom left of
    # the carcass, so dropping a unit on a wall line needs no offset:
    #   +X  left -> right          (width)
    #   +Y  wall -> into the room  (depth: carcass 0..d, fronts d..d+front_t)
    #   +Z  floor -> up            (height: plinth, then carcass, then top)
    module Geom3
      module_function

      def p3(x, y, z)
        ::Geom::Point3d.new(Util.mm(x), Util.mm(y), Util.mm(z))
      end

      # --------------------------------------------------------------- solids
      # Axis aligned box. Returns the pushpulled face's parent entities.
      def box(entities, x, y, z, w, d, h)
        return nil if w.abs < 0.01 || d.abs < 0.01 || h.abs < 0.01

        x, w = x + w, -w if w.negative?
        y, d = y + d, -d if d.negative?
        z, h = z + h, -h if h.negative?

        face = entities.add_face(p3(x, y, z), p3(x + w, y, z),
                                 p3(x + w, y + d, z), p3(x, y + d, z))
        return nil unless face

        face.reverse! if face.normal.z < 0
        face.pushpull(Util.mm(h))
        face
      rescue StandardError => e
        Log.warn("box failed: #{e.message}")
        nil
      end

      # A named, materialised, cut-list aware panel inside its own group.
      # size is [w, d, h] in mm; the cut list derives L x W x T from it.
      def part(parent, model, opts)
        w = opts[:w].to_f
        d = opts[:d].to_f
        h = opts[:h].to_f
        return nil if w.abs < 0.01 || d.abs < 0.01 || h.abs < 0.01

        group = parent.add_group
        box(group.entities, opts[:x].to_f, opts[:y].to_f, opts[:z].to_f, w, d, h)
        finish_part(group, model, opts.merge(dims: [w, d, h]))
      end

      def finish_part(group, model, opts)
        group.name = opts[:name].to_s unless opts[:name].to_s.empty?
        Materials.paint(model, group, opts[:material]) if opts[:material]

        dims = (opts[:dims] || [0, 0, 0]).map { |v| v.to_f.abs }
        length, width, thickness = dims.sort.reverse

        dict = group.attribute_dictionary(Const::DICT, true)
        dict[Const::ATTR_KIND] = 'part'
        dict[Const::ATTR_PART] = opts[:part] || opts[:name].to_s
        dict['material']  = opts[:material].to_s
        dict['length_mm'] = Util.round_mm(opts[:length] || length)
        dict['width_mm']  = Util.round_mm(opts[:width]  || width)
        dict['thick_mm']  = Util.round_mm(opts[:thick]  || thickness)
        dict['qty']       = opts[:qty] || 1
        dict['grain']     = (opts[:grain] || 'length').to_s
        dict['edges']     = (opts[:edges] || '').to_s
        dict['note']      = (opts[:note] || '').to_s
        group
      end

      # Prism extruded upward from an arbitrary footprint drawn in the XY
      # plane. points is an array of [x, y] pairs in mm.
      def prism_z(entities, points, z, height)
        return nil if points.size < 3 || height.abs < 0.01

        face = entities.add_face(points.map { |(x, y)| p3(x, y, z) })
        return nil unless face

        face.reverse! if face.normal.z < 0
        face.pushpull(Util.mm(height))
        face
      rescue StandardError => e
        Log.warn("prism_z failed: #{e.message}")
        nil
      end

      # Prism extruded along X from a cross-section drawn in the YZ plane.
      # section is an array of [y, z] pairs in mm, counter-clockwise.
      def prism_x(entities, x0, width, section)
        pts = section.map { |(y, z)| p3(x0, y, z) }
        face = entities.add_face(pts)
        return nil unless face

        distance = Util.mm(width)
        face.pushpull(face.normal.x > 0 ? distance : -distance)
        face
      rescue StandardError => e
        Log.warn("prism_x failed: #{e.message}")
        nil
      end

      # Prism extruded along Y from a cross-section drawn in the XZ plane.
      # section is an array of [x, z] pairs in mm.
      def prism_y(entities, y0, depth, section)
        pts = section.map { |(x, z)| p3(x, y0, z) }
        face = entities.add_face(pts)
        return nil unless face

        distance = Util.mm(depth)
        face.pushpull(face.normal.y > 0 ? distance : -distance)
        face
      rescue StandardError => e
        Log.warn("prism_y failed: #{e.message}")
        nil
      end

      # Outline of a rectangle with rounded corners, in the XZ plane, ready
      # for prism_y. Falls back to a plain rectangle when the radius is nil.
      def rounded_rect(x, z, w, h, radius, segments = 5)
        r = Util.clamp(radius.to_f, 0.0, [w, h].min / 2.0 - 0.5)
        return [[x, z], [x + w, z], [x + w, z + h], [x, z + h]] if r < 0.5

        corners = [[x + r,     z + r,     Math::PI,        1.5 * Math::PI],
                   [x + w - r, z + r,     1.5 * Math::PI,  2.0 * Math::PI],
                   [x + w - r, z + h - r, 0.0,             0.5 * Math::PI],
                   [x + r,     z + h - r, 0.5 * Math::PI,  Math::PI]]
        corners.flat_map do |(cx, cz, from, to)|
          (0..segments).map do |i|
            angle = from + (to - from) * i / segments.to_f
            [cx + r * Math.cos(angle), cz + r * Math.sin(angle)]
          end
        end
      end

      # --------------------------------------------------------------- holes
      # Cut a rectangular hole straight down through a solid group.
      # rect is [x, y, w, d] in mm; the hole is cut from the group's top face.
      def cut_rect_hole(group, rect, depth, z_top)
        x, y, w, d = rect.map(&:to_f)
        return false if w <= 0.5 || d <= 0.5

        entities = group.entities
        top = top_face_at(entities, z_top)
        return false unless top

        loop_pts = [p3(x, y, z_top), p3(x + w, y, z_top),
                    p3(x + w, y + d, z_top), p3(x, y + d, z_top)]
        entities.add_edges(loop_pts + [loop_pts.first])

        inner = entities.grep(Sketchup::Face).find do |face|
          next false unless (face.normal.z - 1.0).abs < 0.01 || (face.normal.z + 1.0).abs < 0.01
          next false unless (face.bounds.center.z - Util.mm(z_top)).abs < Util.mm(0.5)

          centre = face.bounds.center
          centre.x > Util.mm(x) && centre.x < Util.mm(x + w) &&
            centre.y > Util.mm(y) && centre.y < Util.mm(y + d) &&
            face.bounds.width <= Util.mm(w + 0.6) && face.bounds.height <= Util.mm(d + 0.6)
        end
        return false unless inner

        inner.reverse! if inner.normal.z < 0
        inner.pushpull(-Util.mm(depth))
        true
      rescue StandardError => e
        Log.warn("cut_rect_hole failed: #{e.message}")
        false
      end

      def top_face_at(entities, z_top)
        target = Util.mm(z_top)
        candidates = entities.grep(Sketchup::Face).select do |face|
          face.normal.z > 0.9 && (face.bounds.center.z - target).abs < Util.mm(0.5)
        end
        candidates.max_by(&:area)
      end

      # --------------------------------------------------------- revolutions
      # Cylinder along an axis (:x, :y or :z), centred on `centre` [x, y, z].
      def cylinder(entities, centre, radius, height, axis = :z, segments = 24)
        cx, cy, cz = centre.map(&:to_f)
        normal = case axis
                 when :x then ::Geom::Vector3d.new(1, 0, 0)
                 when :y then ::Geom::Vector3d.new(0, 1, 0)
                 else ::Geom::Vector3d.new(0, 0, 1)
                 end
        circle = entities.add_circle(p3(cx, cy, cz), normal, Util.mm(radius), segments)
        face = entities.add_face(circle)
        return nil unless face

        direction = case axis
                    when :x then face.normal.x
                    when :y then face.normal.y
                    else face.normal.z
                    end
        distance = Util.mm(height)
        face.pushpull(direction >= 0 ? distance : -distance)
        face
      rescue StandardError => e
        Log.warn("cylinder failed: #{e.message}")
        nil
      end

      # A rectangular open tube (four walls, no top or bottom) — used for
      # drawer boxes, sink bowls and shadow gaps.
      def tube(entities, x, y, z, w, d, h, t)
        return if w <= 2 * t || d <= 2 * t

        box(entities, x, y, z, t, d, h)                      # left
        box(entities, x + w - t, y, z, t, d, h)              # right
        box(entities, x + t, y, z, w - 2 * t, t, h)          # front
        box(entities, x + t, y + d - t, z, w - 2 * t, t, h)  # back
      end

      # ------------------------------------------------------------ profiles
      # Cross-sections used by the worktop generator, drawn in the YZ plane.
      # y0 is the front face, depth runs to the back, z_top is the finished
      # top surface.
      def counter_section(y0, depth, t, z_top, edge, edge_size, mitre_t)
        y1 = y0 + depth
        z_bottom = z_top - t

        case edge
        when 'bevel'
          c = Util.clamp(edge_size, 0.5, [t / 2.0, 20.0].min)
          [[y0 + c, z_top], [y1, z_top], [y1, z_bottom], [y0 + c, z_bottom],
           [y0, z_bottom + c], [y0, z_top - c]]
        when 'bullnose'
          r = Util.clamp([edge_size, t / 2.0].max, 1.0, t / 2.0)
          # half round swept from the top front corner down to the bottom
          arc = (0..8).map do |i|
            angle = Math::PI * i / 8.0                       # 0 .. pi, top to bottom
            [y0 + r - r * Math.sin(angle), z_top - r + r * Math.cos(angle)]
          end
          [[y1, z_top], [y1, z_bottom], [y0 + r, z_bottom]] +
            arc.reverse + [[y0 + r, z_top]]
        when 'mitred'
          apron = Util.clamp(mitre_t, t, 400.0)
          [[y0, z_top], [y1, z_top], [y1, z_bottom], [y0 + t, z_bottom],
           [y0 + t, z_top - apron], [y0, z_top - apron]]
        else # square
          [[y0, z_top], [y1, z_top], [y1, z_bottom], [y0, z_bottom]]
        end
      end

      # ------------------------------------------------------------ helpers
      def group_with(parent, name)
        group = parent.add_group
        group.name = name.to_s
        group
      end

      def rotate!(entity, origin, axis, degrees)
        return if degrees.abs < 0.01

        transform = ::Geom::Transformation.rotation(origin, axis, degrees.degrees)
        entity.transform!(transform)
      end

      def move!(entity, dx, dy, dz)
        return if dx.abs < 0.001 && dy.abs < 0.001 && dz.abs < 0.001

        entity.transform!(::Geom::Transformation.translation(
                            ::Geom::Vector3d.new(Util.mm(dx), Util.mm(dy), Util.mm(dz))
                          ))
      end
    end
  end
end
