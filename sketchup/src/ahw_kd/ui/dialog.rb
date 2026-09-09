# frozen_string_literal: true

require 'json'

module AHW
  module KD
    module Gui
      # The parameter dialog. All state lives in Ruby; the HTML side is a
      # pure view that posts whole params objects back.
      module Dialog
        WIDTH  = 460
        HEIGHT = 860

        class << self
          attr_reader :dialog

          def show
            build unless @dialog
            if @dialog.visible?
              @dialog.bring_to_front
            else
              @dialog.show
            end
            @dialog
          end

          def visible?
            !@dialog.nil? && @dialog.visible?
          end

          def close
            @dialog&.close
          end

          # ------------------------------------------------------------
          def build
            @dialog = ::UI::HtmlDialog.new(
              dialog_title: PLUGIN_NAME,
              preferences_key: 'com.ahw.kd.dialog',
              scrollable: true,
              resizable: true,
              width: WIDTH,
              height: HEIGHT,
              min_width: 380,
              min_height: 480,
              style: ::UI::HtmlDialog::STYLE_DIALOG
            )
            @dialog.set_file(File.join(PATH_HTML, 'index.html'))
            register_callbacks(@dialog)
            @dialog.set_on_closed { @dialog = nil }
            @dialog
          end

          def register_callbacks(dialog)
            dialog.add_action_callback('ready')          { |_ctx| send_bootstrap }
            dialog.add_action_callback('apply')          { |_ctx, json| apply(json) }
            dialog.add_action_callback('create')         { |_ctx, json| create(json) }
            dialog.add_action_callback('place')          { |_ctx, json| place(json) }
            dialog.add_action_callback('load_selection') { |_ctx| push_selection }
            dialog.add_action_callback('preset_save')    { |_ctx, json| preset_save(json) }
            dialog.add_action_callback('preset_load')    { |_ctx, name| preset_load(name) }
            dialog.add_action_callback('preset_delete')  { |_ctx, name| preset_delete(name) }
            dialog.add_action_callback('preset_export')  { |_ctx| Export::Catalog.export_all }
            dialog.add_action_callback('preset_import')  { |_ctx| Export::Catalog.import_all; send_presets }
            dialog.add_action_callback('report')         { |_ctx, kind| report(kind) }
            dialog.add_action_callback('pick_block')     { |_ctx, key| pick_block(key) }
            dialog.add_action_callback('clear_block')    { |_ctx, key| Builders::Appliance.library_set(key, ''); send_blocks }
            dialog.add_action_callback('defaults')       { |_ctx, type| send_defaults(type) }
            dialog.add_action_callback('apply_style')    { |_ctx, json| apply_style(json) }
            dialog.add_action_callback('zoom')           { |_ctx| Sketchup.active_model&.active_view&.zoom_extents }
          end

          # ------------------------------------------------------------
          def call(function, payload)
            return unless @dialog&.visible?

            @dialog.execute_script("AHWKD.#{function}(#{JSON.generate(payload)});")
          end

          def send_bootstrap
            call('bootstrap', {
                   'version'    => PLUGIN_VERSION,
                   'families'   => Const::FAMILIES,
                   'envelopes'  => Const::ENVELOPE,
                   'materials'  => Materials.catalogue,
                   'styles'     => Const::DOOR_STYLES,
                   'handles'    => Const::HANDLE_TYPES,
                   'hinges'     => Const::HINGE_TYPES,
                   'finishes'   => Const::HANDLE_FINISHES.map do |key|
                     { 'key' => key, 'label' => Materials.label(key) }
                   end,
                   'styles_design' => Styles.catalogue,
                   'runners'    => Const::RUNNER_TYPES.map { |k, v| { 'key' => k, 'label' => v['label'] } },
                   'lifts'      => Const::LIFT_SYSTEMS.map { |k, v| { 'key' => k, 'label' => v } },
                   'kinds'      => Const::FRONT_KINDS,
                   'appliances' => Const::APPLIANCES.keys,
                   'accessories'=> Const::INTERIOR_ACCESSORIES,
                   'glass'      => Const::GLASS_TYPES.map { |k, v| { 'key' => k, 'label' => v[1] } },
                   'presets'    => Export::Catalog.list,
                   'blocks'     => Builders::Appliance.library,
                   'params'     => Params.defaults('base')
                 })
            push_selection
          end

          def send_presets
            call('presets', Export::Catalog.list)
          end

          def send_blocks
            call('blocks', Builders::Appliance.library)
          end

          def send_defaults(type)
            call('params', Params.defaults(type.to_s))
          end

          # Applying a design style is a params transform, not a model edit:
          # the dialog gets the new params back and decides what to do with it.
          def apply_style(json)
            payload = parse(json)
            return unless payload

            params = Params.normalize(payload['params'] || {})
            call('params', Styles.apply(params, payload['style']))
          end

          def push_selection
            model = Sketchup.active_model
            return unless model

            unit = Store.selected_unit(model)
            if unit
              call('selection', { 'found' => true, 'params' => Store.read(unit) })
            else
              call('selection', { 'found' => false })
            end
          end

          # ------------------------------------------------------------
          def parse(json)
            json.is_a?(String) ? JSON.parse(json) : json
          rescue JSON::ParserError => e
            Log.error(e, 'Dialog.parse')
            nil
          end

          # Update the selected unit, or build a new one if nothing is selected.
          def apply(json)
            params = parse(json)
            return unless params

            model = Sketchup.active_model
            unit = Store.selected_unit(model)
            return create(params) unless unit

            model.start_operation('AHW Update Unit', true)
            Builders::Unit.rebuild(unit, params)
            model.commit_operation
            model.selection.clear
            model.selection.add(unit)
            call('status', { 'ok' => true, 'message' => 'updated' })
          rescue StandardError => e
            model&.abort_operation
            Log.error(e, 'Dialog.apply')
            call('status', { 'ok' => false, 'message' => e.message })
          end

          def create(json)
            params = parse(json)
            return unless params

            model = Sketchup.active_model
            model.start_operation('AHW Insert Unit', true)
            unit = Builders::Unit.create(model, params)
            model.commit_operation
            model.selection.clear
            model.selection.add(unit)
            call('status', { 'ok' => true, 'message' => 'created' })
          rescue StandardError => e
            model&.abort_operation
            Log.error(e, 'Dialog.create')
            call('status', { 'ok' => false, 'message' => e.message })
          end

          def place(json)
            params = parse(json)
            return unless params

            Sketchup.active_model.select_tool(Tools::PlaceTool.new(params))
            call('status', { 'ok' => true, 'message' => 'place' })
          end

          # ------------------------------------------------------------
          def preset_save(json)
            payload = parse(json)
            return unless payload

            Export::Catalog.save(payload['name'], payload['params'])
            send_presets
          end

          def preset_load(name)
            params = Export::Catalog.load(name)
            call('params', params) if params
          end

          def preset_delete(name)
            Export::Catalog.delete(name)
            send_presets
          end

          # ------------------------------------------------------------
          def report(kind)
            model = Sketchup.active_model
            selection_only = !model.selection.empty?

            case kind.to_s
            when 'cutlist'
              rows = Export::Report.cutlist(model, selection_only)
              path = Export::Report.save(Export::Report.cutlist_csv(rows), 'ahw_cutlist.csv')
              call('status', { 'ok' => !path.nil?, 'message' => path || 'cancelled',
                               'count' => rows.size })
            when 'hardware'
              rows = Export::Report.hardware(model, selection_only)
              path = Export::Report.save(Export::Report.hardware_csv(rows), 'ahw_hardware.csv')
              call('status', { 'ok' => !path.nil?, 'message' => path || 'cancelled',
                               'count' => rows.size })
            when 'boq'
              data = Export::Report.boq(model, selection_only)
              path = Export::Report.save(Export::Report.boq_csv(data), 'ahw_boq.csv')
              call('boq', data)
              call('status', { 'ok' => !path.nil?, 'message' => path || 'cancelled' })
            when 'boq_view'
              call('boq', Export::Report.boq(model, selection_only))
            end
          rescue StandardError => e
            Log.error(e, 'Dialog.report')
            call('status', { 'ok' => false, 'message' => e.message })
          end

          def pick_block(key)
            path = ::UI.openpanel('Select appliance component',
                                  File.expand_path('~'), 'SketchUp Component|*.skp||')
            return unless path

            Builders::Appliance.library_set(key, path)
            send_blocks
          end
        end
      end
    end
  end
end
