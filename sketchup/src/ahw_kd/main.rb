# frozen_string_literal: true

require 'sketchup.rb'
require 'json'

module AHW
  module KD
    %w[
      core/const core/util core/log core/styles core/params core/materials
      core/pricing core/geom
      core/layout core/store
      builders/panel builders/drawer builders/appliance builders/carcass
      builders/fronts builders/interior builders/worktop builders/faceted builders/special
      builders/unit builders/dressing
      export/report export/nesting export/catalog
      ui/dialog ui/tools ui/observers
    ].each { |file| require File.join(PATH_LIB, "#{file}.rb") }

    # ------------------------------------------------------------------
    # Commands
    # ------------------------------------------------------------------
    module Commands
      module_function

      def model
        Sketchup.active_model
      end

      def designer
        Gui::Dialog.show
      end

      def quick_insert(type)
        Sketchup.active_model.select_tool(Tools::PlaceTool.new(Params.defaults(type)))
      end

      def edit_selected
        unit = Store.selected_unit(model)
        unless unit
          ::UI.messagebox('Select an AHW unit first.')
          return
        end
        Gui::Dialog.show
        ::UI.start_timer(0.2, false) { Gui::Dialog.push_selection }
      end

      def rebuild(scope)
        units = if scope == :selection
                  model.selection.to_a.select { |entity| Store.unit?(entity) }
                else
                  Store.all_units(model.entities)
                end
        if units.empty?
          ::UI.messagebox('No AHW units found.')
          return
        end

        model.start_operation('AHW Rebuild', true)
        units.each do |unit|
          params = Store.read(unit)
          Builders::Unit.rebuild(unit, params) if params
        end
        model.commit_operation
        ::UI.messagebox("Rebuilt #{units.size} unit(s).")
      rescue StandardError => e
        model.abort_operation
        Log.error(e, 'Commands.rebuild')
        ::UI.messagebox("Rebuild failed: #{e.message}")
      end

      # Presentation toggle: swing every door / drawer of the selection open
      # or shut without touching any other parameter.
      def toggle_open(scope, open)
        units = if scope == :selection && !model.selection.empty?
                  model.selection.to_a.select { |entity| Store.unit?(entity) }
                else
                  Store.all_units(model.entities)
                end
        return ::UI.messagebox('No AHW units found.') if units.empty?

        model.start_operation('AHW Open State', true)
        units.each do |unit|
          params = Store.read(unit)
          next unless params

          params['open']['doors']   = open ? 75.0 : 0.0
          params['open']['drawers'] = open ? 70.0 : 0.0
          params['open']['lifts']   = open ? 60.0 : 0.0
          Builders::Unit.rebuild(unit, params)
        end
        model.commit_operation
      rescue StandardError => e
        model.abort_operation
        Log.error(e, 'Commands.toggle_open')
      end

      def explode(distance)
        units = model.selection.to_a.select { |entity| Store.unit?(entity) }
        units = Store.all_units(model.entities) if units.empty?
        return if units.empty?

        model.start_operation('AHW Exploded View', true)
        units.each do |unit|
          params = Store.read(unit)
          next unless params

          params['explode'] = distance
          Builders::Unit.rebuild(unit, params)
        end
        model.commit_operation
      rescue StandardError => e
        model.abort_operation
        Log.error(e, 'Commands.explode')
      end

      def export(kind)
        selection_only = !model.selection.empty?
        case kind
        when :cutlist
          rows = Export::Report.cutlist(model, selection_only)
          return ::UI.messagebox('Nothing to export.') if rows.empty?

          path = Export::Report.save(Export::Report.cutlist_csv(rows), 'ahw_cutlist.csv')
          ::UI.messagebox("Cut list saved:\n#{path}") if path
        when :hardware
          rows = Export::Report.hardware(model, selection_only)
          return ::UI.messagebox('Nothing to export.') if rows.empty?

          path = Export::Report.save(Export::Report.hardware_csv(rows), 'ahw_hardware.csv')
          ::UI.messagebox("Hardware schedule saved:\n#{path}") if path
        when :boq
          data = Export::Report.boq(model, selection_only)
          return ::UI.messagebox('Nothing to export.') if data['units'].empty?

          path = Export::Report.save(Export::Report.boq_csv(data), 'ahw_boq.csv')
          if path
            ::UI.messagebox("BOQ saved:\n#{path}\n" \
                            "Total: #{data['total']} #{data['currency']}")
          end
        when :nesting
          settings = Pricing.read(model)
          rows = Export::Report.cutlist(model, selection_only)
          return ::UI.messagebox('Nothing to nest.') if rows.empty?

          results = Export::Nesting.plan(rows, settings['sheet']['w'], settings['sheet']['h'])
          path = Export::Report.save(Export::Nesting.csv(results, settings['currency']),
                                     'ahw_nesting.csv')
          sheets = results.map { |row| row['sheets'] }.sum
          ::UI.messagebox("Nesting saved:\n#{path}\nSheets required: #{sheets}") if path
        when :job_order
          orders = Export::Report.job_order(model, selection_only)
          return ::UI.messagebox('Nothing to export.') if orders.empty?

          path = Export::Report.save(Export::Report.job_order_csv(orders), 'ahw_job_order.csv')
          ::UI.messagebox("Job order saved:\n#{path}\nUnits: #{orders.size}") if path
        end
      end

      def about
        answer = ::UI.messagebox(
          "#{PLUGIN_NAME}  v#{PLUGIN_VERSION}\n" \
          "#{PLUGIN_COMPANY}\n" \
          "Developed by #{PLUGIN_AUTHOR}  |  تطوير: #{PLUGIN_AUTHOR_AR}\n" \
          "#{PLUGIN_WEBSITE}\n\n" \
          "Parametric kitchen, bathroom vanity and dressing units:\n" \
          "carcass, fronts, handles, worktops, appliances, interiors,\n" \
          "project pricing, cut list with sheet nesting, BOQ and job order.\n\n" \
          'Open the website?', MB_YESNO
        )
        ::UI.openURL(PLUGIN_WEBSITE) if answer == IDYES
      end

      def dressing_room
        Gui::Dialog.show
        ::UI.start_timer(0.3, false) { Gui::Dialog.call('open_tab', 'room') }
      end

      def pricing
        Gui::Dialog.show
        ::UI.start_timer(0.3, false) { Gui::Dialog.call('open_tab', 'pricing') }
      end
    end

    # ------------------------------------------------------------------
    # Menu + toolbar
    # ------------------------------------------------------------------
    module Interface
      ICONS = File.join(PATH_LIB, 'ui', 'icons')

      module_function

      def command(title, icon, tooltip, status, &block)
        cmd = ::UI::Command.new(title, &block)
        small = File.join(ICONS, "#{icon}.svg")
        if File.exist?(small)
          cmd.small_icon = small
          cmd.large_icon = small
        end
        cmd.tooltip = tooltip
        cmd.status_bar_text = status
        cmd.menu_text = title
        cmd
      end

      def install
        menu = ::UI.menu('Extensions').add_submenu(PLUGIN_NAME)
        toolbar = ::UI::Toolbar.new(PLUGIN_NAME)

        designer = command('Unit Designer', 'designer', 'Open the AHW unit designer',
                           'Create and edit parametric kitchen, vanity and dressing units') do
          Commands.designer
        end
        edit = command('Edit Selected', 'edit', 'Edit the selected unit',
                       'Load the selected AHW unit into the designer') { Commands.edit_selected }

        toolbar.add_item(designer)
        toolbar.add_item(edit)
        toolbar.add_separator
        menu.add_item(designer)
        menu.add_item(edit)

        quick = menu.add_submenu('Quick Insert')
        [%w[base Base\ Cabinet], %w[drawer_bank Drawer\ Bank], %w[base_sink Sink\ Base],
         %w[base_hob Hob\ Base], %w[base_corner Corner\ Base], %w[tall Tall\ Unit],
         %w[wall Wall\ Cabinet], %w[wall_lift Lift\ Up\ Wall], %w[island Island],
         %w[hood Extractor\ Hood], %w[vanity Vanity], %w[vanity_wall Wall\ Hung\ Vanity],
         %w[mirror_unit Mirror\ Cabinet], %w[wardrobe Wardrobe],
         %w[wardrobe_sliding Sliding\ Wardrobe], %w[dressing_open Open\ Dressing],
         %w[corner_wardrobe Corner\ Wardrobe], %w[shoe_unit Shoe\ Unit]].each do |type, title|
          quick.add_item(title) { Commands.quick_insert(type) }
        end

        menu.add_item('Dressing Room Generator') { Commands.dressing_room }
        menu.add_item('Project Pricing') { Commands.pricing }

        %w[base wall wardrobe vanity].each do |type|
          toolbar.add_item(command(type.capitalize, "unit_#{type}", "Insert #{type}",
                                   "Place a parametric #{type} unit") { Commands.quick_insert(type) })
        end
        toolbar.add_separator

        menu.add_separator
        menu.add_item('Rebuild Selected') { Commands.rebuild(:selection) }
        menu.add_item('Rebuild All')      { Commands.rebuild(:all) }
        menu.add_separator

        presentation = menu.add_submenu('Presentation')
        presentation.add_item('Open Doors & Drawers')  { Commands.toggle_open(:selection, true) }
        presentation.add_item('Close Doors & Drawers') { Commands.toggle_open(:selection, false) }
        presentation.add_item('Exploded View')         { Commands.explode(250.0) }
        presentation.add_item('Assembled View')        { Commands.explode(0.0) }

        open_cmd = command('Open / Close', 'open', 'Swing doors and drawers open',
                           'Toggle the open state of the selected units') do
          Commands.toggle_open(:selection, true)
        end
        toolbar.add_item(open_cmd)

        menu.add_separator
        reports = menu.add_submenu('Reports')
        cutlist = command('Cut List', 'cutlist', 'Export the cut list to CSV',
                          'Panel schedule with sizes, edge banding and areas') { Commands.export(:cutlist) }
        hardware = command('Hardware Schedule', 'hardware', 'Export the hardware schedule',
                           'Hinges, runners, lifts, handles and accessories') { Commands.export(:hardware) }
        boq = command('BOQ', 'boq', 'Export the bill of quantities',
                      'Area by material at project rates, with uplifts') { Commands.export(:boq) }
        nesting = command('Sheet Nesting', 'cutlist', 'Optimise the panels onto sheets',
                          'How many boards the job needs and how much is waste') do
          Commands.export(:nesting)
        end
        job = command('Job Order', 'hardware', 'Export the workshop job order',
                      'Per unit: panels, hardware and finishes') { Commands.export(:job_order) }
        [cutlist, hardware, nesting, boq, job].each do |cmd|
          reports.add_item(cmd)
          toolbar.add_item(cmd)
        end

        menu.add_separator
        menu.add_item("About #{PLUGIN_NAME}") { Commands.about }
        menu.add_item("#{PLUGIN_COMPANY} — #{PLUGIN_WEBSITE}") { ::UI.openURL(PLUGIN_WEBSITE) }

        toolbar.restore
        toolbar
      end
    end

    unless file_loaded?(__FILE__)
      Interface.install
      Gui.install_observers
      file_loaded(__FILE__)
    end
  end
end
