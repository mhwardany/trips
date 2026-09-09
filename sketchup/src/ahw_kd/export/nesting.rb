# frozen_string_literal: true

module AHW
  module KD
    module Export
      # Sheet optimisation. A cut list is only half the answer on site: the
      # workshop needs to know how many boards to buy and how much of each is
      # waste. This packs the panels onto standard sheets with a guillotine
      # shelf algorithm - the same way a panel saw actually cuts, in straight
      # runs across the board.
      module Nesting
        KERF = 4.0        # saw blade
        TRIM = 10.0       # edge trim on each side of the sheet

        module_function

        # rows: cut-list rows. Returns one result per material + thickness.
        def plan(rows, sheet_w = 2440.0, sheet_h = 1220.0)
          groups = Hash.new { |h, k| h[k] = [] }
          rows.each do |row|
            next if row['length_mm'].to_f <= 0.1 || row['width_mm'].to_f <= 0.1

            key = [row['material'], row['thick_mm']]
            row['qty'].to_i.times do
              groups[key] << {
                'length' => row['length_mm'].to_f,
                'width'  => row['width_mm'].to_f,
                'grain'  => row['grain'].to_s,
                'part'   => row['part'],
                'unit'   => row['unit']
              }
            end
          end

          groups.map do |(material, thickness), pieces|
            pack(material, thickness, pieces, sheet_w, sheet_h)
          end.sort_by { |result| -result['sheets'] }
        end

        # Shelf packing: pieces are sorted tall first, laid in rows across the
        # sheet, and a new sheet starts when the next row will not fit.
        def pack(material, thickness, pieces, sheet_w, sheet_h)
          usable_w = sheet_w - 2 * TRIM
          usable_h = sheet_h - 2 * TRIM

          placed = []
          oversize = []
          pieces.each do |piece|
            long = [piece['length'], piece['width']].max
            short = [piece['length'], piece['width']].min
            # a piece with free grain may be turned to fit the board better
            if piece['grain'] == 'any' || piece['grain'].empty?
              w = long
              h = short
            else
              w = piece['length']
              h = piece['width']
            end
            if w > usable_w && h <= usable_w && w <= usable_h
              w, h = h, w
            end
            if w > usable_w || h > usable_h
              oversize << piece
              next
            end
            placed << piece.merge('w' => w, 'h' => h)
          end

          placed.sort_by! { |piece| [-piece['h'], -piece['w']] }

          sheets = 0
          shelf_y = 0.0
          shelf_h = 0.0
          cursor_x = 0.0
          used_area = 0.0

          placed.each do |piece|
            if sheets.zero?
              sheets = 1
              shelf_y = 0.0
              shelf_h = piece['h']
              cursor_x = 0.0
            end

            if cursor_x + piece['w'] > usable_w
              # next shelf
              shelf_y += shelf_h + KERF
              shelf_h = piece['h']
              cursor_x = 0.0
              if shelf_y + shelf_h > usable_h
                sheets += 1
                shelf_y = 0.0
                shelf_h = piece['h']
              end
            end
            shelf_h = piece['h'] if piece['h'] > shelf_h
            cursor_x += piece['w'] + KERF
            used_area += piece['w'] * piece['h']
          end

          sheet_area = sheet_w * sheet_h
          total_area = sheets * sheet_area
          waste = total_area.positive? ? (1.0 - used_area / total_area) * 100.0 : 0.0

          {
            'material'   => material,
            'label'      => Materials.label(material),
            'thickness'  => thickness,
            'pieces'     => placed.size,
            'oversize'   => oversize.size,
            'sheets'     => sheets,
            'sheet_size' => "#{sheet_w.round} x #{sheet_h.round}",
            'used_m2'    => (used_area / 1_000_000.0).round(3),
            'sheet_m2'   => (total_area / 1_000_000.0).round(3),
            'waste_pct'  => waste.round(1)
          }
        end

        def csv(results, currency = '')
          lines = ['Material,Thickness mm,Pieces,Sheets,Sheet size,Used m2,Sheet m2,Waste %']
          results.each do |row|
            lines << [row['label'], row['thickness'], row['pieces'], row['sheets'],
                      row['sheet_size'], row['used_m2'], row['sheet_m2'], row['waste_pct']]
                     .map { |cell| Util.csv_cell(cell) }.join(',')
          end
          oversize = results.map { |row| row['oversize'].to_i }.sum
          lines << ''
          lines << "Total sheets,#{results.map { |r| r['sheets'] }.sum}"
          lines << "Pieces too large for the sheet,#{oversize}" if oversize.positive?
          lines << "Currency,#{currency}" unless currency.to_s.empty?
          lines.join("\n")
        end
      end
    end
  end
end
