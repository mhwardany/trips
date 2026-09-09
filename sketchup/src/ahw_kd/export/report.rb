# frozen_string_literal: true

module AHW
  module KD
    module Export
      # Cut list, hardware schedule and BOQ. Everything is read back off the
      # attributes the builders wrote, so what is exported always matches what
      # is in the model.
      module Report
        module_function

        # ---------------------------------------------------------- gather
        def parts_of(unit)
          params = Store.read(unit)
          return [] unless params

          rows = []
          collect(unit.entities, rows)
          qty = params['meta']['qty'].to_i
          qty = 1 if qty < 1
          rows.each do |row|
            row['unit'] = Store.display_name(params)
            row['unit_type'] = params['type']
            row['room'] = params['meta']['room']
            row['qty'] = row['qty'].to_i * qty
          end
          rows
        end

        def collect(entities, rows)
          entities.each do |entity|
            next unless entity.is_a?(Sketchup::Group)

            dict = entity.attribute_dictionary(Const::DICT)
            if dict && dict[Const::ATTR_KIND] == 'part'
              rows << {
                'part'      => dict[Const::ATTR_PART].to_s,
                'material'  => dict['material'].to_s,
                'length_mm' => dict['length_mm'].to_f,
                'width_mm'  => dict['width_mm'].to_f,
                'thick_mm'  => dict['thick_mm'].to_f,
                'qty'       => dict['qty'].to_i,
                'grain'     => dict['grain'].to_s,
                'edges'     => dict['edges'].to_s,
                'note'      => dict['note'].to_s
              }
            end
            collect(entity.entities, rows)
          end
        end

        def units(model, selection_only)
          source = selection_only && !model.selection.empty? ? model.selection.to_a : model.entities.to_a
          Store.all_units(EntityList.new(source))
        end

        # A tiny adapter so Store.all_units can walk a plain Array as well as
        # a Sketchup::Entities collection.
        class EntityList
          include Enumerable

          def initialize(array)
            @array = array
          end

          def each(&block)
            @array.each(&block)
          end
        end

        # ------------------------------------------------------------ cut list
        # Panels only (anything with three real dimensions and a sheet
        # material) grouped by identical size and material.
        def cutlist(model, selection_only = false)
          aggregate = {}
          units(model, selection_only).each do |unit|
            parts_of(unit).each do |row|
              next if row['length_mm'] <= 0.1 || row['width_mm'] <= 0.1
              next unless sheet_material?(row['material'])

              key = [row['unit'], row['part'], row['material'],
                     row['length_mm'], row['width_mm'], row['thick_mm']].join('|')
              entry = aggregate[key] ||= row.merge('qty' => 0)
              entry['qty'] += row['qty']
            end
          end

          aggregate.values.sort_by { |row| [row['unit'], row['part'], -row['length_mm']] }
        end

        def sheet_material?(key)
          spec = Materials::LIBRARY[key.to_s]
          return false unless spec

          %w[panel finish top glass].include?(spec[:cat])
        end

        def cutlist_csv(rows)
          lines = [Const::CUTLIST_COLUMNS.join(',')]
          rows.each do |row|
            area = row['length_mm'] * row['width_mm'] / 1_000_000.0 * row['qty']
            edges = row['edges'].to_s
            all = edges == 'all'
            lines << [
              row['unit'], row['part'], Materials.label(row['material']),
              row['length_mm'].round(1), row['width_mm'].round(1), row['thick_mm'].round(1),
              row['qty'], row['grain'],
              all || edges.include?('front') ? 'ABS 2mm' : '',
              all ? 'ABS 2mm' : '',
              all ? 'ABS 2mm' : '',
              all || edges.include?('top') ? 'ABS 2mm' : '',
              area.round(3), row['note']
            ].map { |cell| Util.csv_cell(cell) }.join(',')
          end
          lines.join("\n")
        end

        # ------------------------------------------------------- hardware
        def hardware(model, selection_only = false)
          aggregate = Hash.new(0)
          notes = {}
          units(model, selection_only).each do |unit|
            parts_of(unit).each do |row|
              next unless hardware_part?(row['part'])

              key = [row['part'], row['note']].join(' — ').sub(/ — \z/, '')
              aggregate[key] += row['qty']
              notes[key] = row['note']
            end
          end
          aggregate.map { |description, qty| { 'item' => description, 'qty' => qty } }
                   .sort_by { |row| row['item'] }
        end

        def hardware_part?(part)
          ['Handle', 'Hinge', 'Drawer Runner', 'Lift Mechanism', 'Sliding Track',
           'Hanging Rail', 'Accessory', 'Corner Mechanism', 'Lighting', 'Leg',
           'Tap', 'Sink', 'Hob', 'Hood Filter'].include?(part.to_s)
        end

        def hardware_csv(rows)
          lines = ['item,qty']
          rows.each { |row| lines << [row['item'], row['qty']].map { |c| Util.csv_cell(c) }.join(',') }
          lines.join("\n")
        end

        # ------------------------------------------------------------- BOQ
        # Area by material with an indicative supply-and-fix rate, plus a
        # per-unit summary — the two tables a fit-out estimator actually wants.
        def boq(model, selection_only = false, currency = 'USD')
          by_material = Hash.new { |h, k| h[k] = { 'area' => 0.0, 'qty' => 0 } }
          by_unit = []

          units(model, selection_only).each do |unit|
            params = Store.read(unit)
            next unless params

            rows = parts_of(unit)
            unit_area = 0.0
            unit_cost = 0.0
            rows.each do |row|
              next if row['length_mm'] <= 0.1 || row['width_mm'] <= 0.1
              next unless sheet_material?(row['material'])

              area = row['length_mm'] * row['width_mm'] / 1_000_000.0 * row['qty']
              by_material[row['material']]['area'] += area
              by_material[row['material']]['qty'] += row['qty']
              unit_area += area
              unit_cost += area * Materials.rate(row['material'])
            end

            layout = Layout.new(params)
            by_unit << {
              'unit'      => Store.display_name(params),
              'type'      => params['type'],
              'room'      => params['meta']['room'],
              'w'         => params['w'].round,
              'h'         => layout.total_h.round,
              'd'         => layout.total_d.round,
              'qty'       => params['meta']['qty'],
              'panel_m2'  => unit_area.round(3),
              'front_m2'  => (params['w'] * layout.front_span / 1_000_000.0 *
                              params['meta']['qty']).round(3),
              'cost'      => unit_cost.round(2)
            }
          end

          materials = by_material.map do |key, value|
            rate = Materials.rate(key)
            { 'material' => Materials.label(key), 'key' => key,
              'area_m2' => value['area'].round(3), 'qty' => value['qty'],
              'rate' => rate, 'amount' => (value['area'] * rate).round(2) }
          end.sort_by { |row| -row['amount'] }

          { 'currency' => currency,
            'materials' => materials,
            'units' => by_unit,
            'total' => materials.map { |row| row['amount'] }.sum.round(2),
            'generated' => Util.timestamp }
        end

        def boq_csv(data)
          lines = ["AHW Kitchen & Dressing — BOQ,#{data['generated']}", '']
          lines << 'Material,Area m2,Pieces,Rate,Amount'
          data['materials'].each do |row|
            lines << [row['material'], row['area_m2'], row['qty'], row['rate'], row['amount']]
                     .map { |c| Util.csv_cell(c) }.join(',')
          end
          lines << ['', '', '', 'TOTAL', data['total']].join(',')
          lines << ''
          lines << 'Unit,Type,Room,W,H,D,Qty,Panel m2,Front m2,Cost'
          data['units'].each do |row|
            lines << [row['unit'], row['type'], row['room'], row['w'], row['h'], row['d'],
                      row['qty'], row['panel_m2'], row['front_m2'], row['cost']]
                     .map { |c| Util.csv_cell(c) }.join(',')
          end
          lines.join("\n")
        end

        # ----------------------------------------------------------- export
        def save(content, suggested)
          path = UI.savepanel('Export', File.expand_path('~'), suggested)
          return nil unless path

          path = "#{path}.csv" unless path.downcase.end_with?('.csv')
          File.open(path, 'w:UTF-8') { |file| file.write("﻿" + content) }
          path
        rescue StandardError => e
          Log.error(e, 'Report.save')
          UI.messagebox("Could not write the file:\n#{e.message}")
          nil
        end
      end
    end
  end
end
