# frozen_string_literal: true

require 'json'

module AHW
  module KD
    # Project pricing. Material rates move between projects and between
    # suppliers, so they are never baked into the model: the library rate is
    # only a starting point and everything here is stored on the SketchUp
    # model itself, so it travels with the .skp and is reviewed per project.
    #
    # On top of the material cost sit uplift lines - fabrication, wastage,
    # transport, margin - each a percentage that can be edited or removed.
    module Pricing
      DICT = 'AHW_KD_Pricing'

      DEFAULT_UPLIFTS = [
        { 'name' => 'Fabrication / مصنعيات', 'percent' => 30.0, 'on' => 'materials' },
        { 'name' => 'Wastage / هالك',        'percent' => 8.0,  'on' => 'materials' },
        { 'name' => 'Transport & fixing / نقل وتركيب', 'percent' => 0.0, 'on' => 'subtotal' }
      ].freeze

      DEFAULTS = {
        'currency' => 'EGP',
        'rates'    => {},          # material key => rate per m2, overriding the library
        'uplifts'  => DEFAULT_UPLIFTS,
        'sheet'    => { 'w' => 2440.0, 'h' => 1220.0 },
        'note'     => ''
      }.freeze

      module_function

      def defaults
        Util.deep_dup(DEFAULTS.merge('uplifts' => DEFAULT_UPLIFTS.map { |u| u.dup }))
      end

      def read(model)
        raw = model&.get_attribute(DICT, 'data')
        return defaults unless raw

        normalize(JSON.parse(raw))
      rescue StandardError => e
        Log.error(e, 'Pricing.read')
        defaults
      end

      def write(model, data)
        data = normalize(data)
        model.set_attribute(DICT, 'data', JSON.generate(data))
        data
      end

      def normalize(raw)
        data = Util.deep_merge(defaults, Params.stringify(raw || {}))
        data['currency'] = data['currency'].to_s.strip
        data['currency'] = 'EGP' if data['currency'].empty?

        rates = {}
        (data['rates'] || {}).each do |key, value|
          next unless Materials::LIBRARY.key?(key.to_s)

          rate = Util.num(value, -1.0)
          rates[key.to_s] = rate if rate >= 0.0
        end
        data['rates'] = rates

        data['uplifts'] = Array(data['uplifts']).map do |uplift|
          {
            'name'    => uplift['name'].to_s.strip.empty? ? 'Uplift' : uplift['name'].to_s,
            'percent' => Util.clamp(Util.num(uplift['percent'], 0.0), -100.0, 500.0),
            'on'      => %w[materials subtotal].include?(uplift['on']) ? uplift['on'] : 'materials'
          }
        end

        data['sheet']['w'] = Util.clamp(Util.num(data['sheet']['w'], 2440.0), 500.0, 6000.0)
        data['sheet']['h'] = Util.clamp(Util.num(data['sheet']['h'], 1220.0), 500.0, 3000.0)
        data
      end

      # The rate actually used for a material: the project override if the
      # user set one, otherwise the library figure.
      def rate(data, key)
        override = data['rates'][key.to_s]
        return override.to_f if override

        Materials.rate(key)
      end

      def overridden?(data, key)
        data['rates'].key?(key.to_s)
      end

      # Build the priced lines from a materials total.
      # Returns { materials:, lines: [...], total: }
      def summarise(data, materials_total)
        materials_total = materials_total.to_f
        lines = []
        running = materials_total

        data['uplifts'].each do |uplift|
          next if uplift['percent'].abs < 0.001

          base = uplift['on'] == 'subtotal' ? running : materials_total
          amount = base * uplift['percent'] / 100.0
          running += amount
          lines << {
            'name' => uplift['name'], 'percent' => uplift['percent'],
            'on' => uplift['on'], 'base' => base.round(2), 'amount' => amount.round(2)
          }
        end

        { 'materials' => materials_total.round(2),
          'lines' => lines,
          'total' => running.round(2),
          'currency' => data['currency'] }
      end
    end
  end
end
