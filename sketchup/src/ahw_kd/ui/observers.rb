# frozen_string_literal: true

module AHW
  module KD
    module Gui
      # Keeps the dialog in step with what is selected in the model.
      class SelectionWatcher < Sketchup::SelectionObserver
        def onSelectionBulkChange(_selection)
          refresh
        end

        def onSelectionCleared(_selection)
          refresh
        end

        def onSelectionAdded(_selection, _entity)
          refresh
        end

        def refresh
          return unless Dialog.visible?

          ::UI.start_timer(0.05, false) { Dialog.push_selection }
        end
      end

      class Models < Sketchup::AppObserver
        def onNewModel(model)
          Gui.attach(model)
        end

        def onOpenModel(model)
          Gui.attach(model)
        end
      end

      module_function

      def attach(model = Sketchup.active_model)
        return unless model

        @watcher ||= SelectionWatcher.new
        model.selection.remove_observer(@watcher)
        model.selection.add_observer(@watcher)
      rescue StandardError => e
        Log.error(e, 'Gui.attach')
      end

      def install_observers
        @app_observer ||= Models.new
        Sketchup.remove_observer(@app_observer)
        Sketchup.add_observer(@app_observer)
        attach
      end
    end
  end
end
