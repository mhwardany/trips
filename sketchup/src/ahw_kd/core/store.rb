# frozen_string_literal: true

require 'json'

module AHW
  module KD
    # Reads and writes the parameter blob that makes a unit re-editable.
    module Store
      module_function

      def write(group, params)
        dict = group.attribute_dictionary(Const::DICT, true)
        dict[Const::ATTR_KIND]    = 'unit'
        dict[Const::ATTR_VERSION] = Const::SCHEMA
        dict[Const::ATTR_PARAMS]  = JSON.generate(params)
        dict['type'] = params['type']
        dict['name'] = params['name']
        group.name = display_name(params)
        group
      end

      def read(entity)
        return nil unless entity.respond_to?(:attribute_dictionary)

        dict = entity.attribute_dictionary(Const::DICT)
        return nil unless dict && dict[Const::ATTR_KIND] == 'unit'

        raw = dict[Const::ATTR_PARAMS]
        return nil unless raw

        Params.normalize(JSON.parse(raw))
      rescue JSON::ParserError => e
        Log.error(e, 'Store.read')
        nil
      end

      def unit?(entity)
        !read(entity).nil?
      end

      def display_name(params)
        code = params['meta']['code'].to_s.strip
        label = params['name'].to_s.strip
        label = Params.auto_name(params) if label.empty?
        code.empty? ? "AHW #{label}" : "AHW #{code} #{label}"
      end

      # Every unit group in the model, including those nested in groups or
      # components.
      def all_units(entities, collected = [])
        entities.each do |entity|
          if entity.is_a?(Sketchup::Group)
            if unit?(entity)
              collected << entity
            else
              all_units(entity.entities, collected)
            end
          elsif entity.is_a?(Sketchup::ComponentInstance)
            all_units(entity.definition.entities, collected)
          end
        end
        collected
      end

      def selected_unit(model)
        model.selection.each do |entity|
          return entity if unit?(entity)
        end
        # Allow selecting a part inside an open unit.
        path = model.active_path
        if path
          path.reverse_each { |entity| return entity if unit?(entity) }
        end
        nil
      end
    end
  end
end
