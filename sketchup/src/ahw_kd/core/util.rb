# frozen_string_literal: true

module AHW
  module KD
    # Small helpers shared by every module. Deliberately free of SketchUp API
    # calls where possible so the geometry maths can be unit tested outside SU.
    module Util
      module_function

      # --- length ---------------------------------------------------------
      # The whole plugin thinks in millimetres; SketchUp thinks in inches.
      def mm(value)
        value.to_f * Const::MM
      end

      def to_mm(inches)
        inches.to_f / Const::MM
      end

      def round_mm(value, step = 0.5)
        (value.to_f / step).round * step
      end

      # --- hashes ---------------------------------------------------------
      def deep_merge(base, override)
        return base.dup if override.nil?

        result = base.dup
        override.each do |key, value|
          current = result[key]
          result[key] = if current.is_a?(Hash) && value.is_a?(Hash)
                          deep_merge(current, value)
                        else
                          value
                        end
        end
        result
      end

      def deep_dup(object)
        case object
        when Hash  then object.each_with_object({}) { |(k, v), h| h[k] = deep_dup(v) }
        when Array then object.map { |v| deep_dup(v) }
        else object
        end
      end

      # Coerce whatever came back from the HTML dialog into the type the
      # schema expects. JSON round-trips turn everything into strings.
      def num(value, fallback = 0.0)
        return fallback if value.nil?
        return value.to_f if value.is_a?(Numeric)

        text = value.to_s.strip
        return fallback if text.empty?

        Float(text)
      rescue ArgumentError, TypeError
        fallback
      end

      def int(value, fallback = 0)
        num(value, fallback).round
      end

      def bool(value, fallback = false)
        case value
        when true, false then value
        when nil then fallback
        when Numeric then !value.zero?
        else %w[true 1 yes on].include?(value.to_s.strip.downcase)
        end
      end

      # Tolerates an inverted range: when a derived upper bound collapses
      # below the lower bound the lower bound wins, so a very small leaf can
      # never produce a negative rail or frame width.
      def clamp(value, low, high)
        return low if high < low
        return low if value < low
        return high if value > high

        value
      end

      # --- strings --------------------------------------------------------
      def slug(text)
        text.to_s.strip.gsub(/[^A-Za-z0-9\-_]+/, '_').gsub(/_+/, '_').sub(/\A_/, '').sub(/_\z/, '')
      end

      def csv_cell(value)
        text = value.to_s
        return text unless text =~ /[",\n;]/

        %("#{text.gsub('"', '""')}")
      end

      # --- geometry maths -------------------------------------------------
      # Distribute a total length over rows. Rows with a positive fixed height
      # keep it; rows declaring 0 share whatever is left, equally.
      def distribute(total, fixed_heights, minimum = 40.0)
        flexible = fixed_heights.each_index.select { |i| fixed_heights[i].to_f <= 0.0 }
        used = fixed_heights.reject { |h| h.to_f <= 0.0 }.map(&:to_f).sum

        if flexible.empty?
          # Nothing flexible: scale the fixed rows so they always fill the opening.
          return fixed_heights.map { |_| 0.0 } if used <= 0
          factor = total / used
          return fixed_heights.map { |h| h.to_f * factor }
        end

        share = (total - used) / flexible.size.to_f
        share = minimum if share < minimum
        fixed_heights.map { |h| h.to_f <= 0.0 ? share : h.to_f }
      end

      # Split a width into n equal columns honouring the gap between them.
      def columns(total, count, gap)
        count = 1 if count < 1
        each = (total - (gap * (count - 1))) / count.to_f
        Array.new(count) { |i| [each * i + gap * i, each] }
      end

      def timestamp
        Time.now.strftime('%Y-%m-%d %H:%M')
      end
    end
  end
end
