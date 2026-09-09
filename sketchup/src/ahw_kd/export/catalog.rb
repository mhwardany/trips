# frozen_string_literal: true

require 'json'
require 'fileutils'

module AHW
  module KD
    module Export
      # User preset library. A studio builds its standard units once and
      # reuses them across projects; presets live as JSON next to the plugin
      # so they can be committed to a shared drive.
      module Catalog
        module_function

        def folder
          path = File.join(PATH_LIB, 'data', 'presets')
          FileUtils.mkdir_p(path) unless File.directory?(path)
          path
        rescue StandardError
          File.expand_path('~')
        end

        def file_for(name)
          File.join(folder, "#{Util.slug(name)}.json")
        end

        def list
          Dir.glob(File.join(folder, '*.json')).map do |path|
            data = JSON.parse(File.read(path))
            { 'name' => data['name'] || File.basename(path, '.json'),
              'type' => data['params'] ? data['params']['type'] : data['type'],
              'file' => File.basename(path) }
          rescue StandardError
            nil
          end.compact.sort_by { |entry| entry['name'].to_s.downcase }
        end

        def save(name, params)
          name = name.to_s.strip
          return nil if name.empty?

          payload = { 'name' => name, 'saved' => Util.timestamp,
                      'plugin' => PLUGIN_VERSION, 'params' => Params.normalize(params) }
          File.open(file_for(name), 'w:UTF-8') { |file| file.write(JSON.pretty_generate(payload)) }
          name
        rescue StandardError => e
          Log.error(e, 'Catalog.save')
          nil
        end

        def load(name)
          path = file_for(name)
          path = File.join(folder, name.to_s) unless File.exist?(path)
          return nil unless File.exist?(path)

          data = JSON.parse(File.read(path))
          Params.normalize(data['params'] || data)
        rescue StandardError => e
          Log.error(e, 'Catalog.load')
          nil
        end

        def delete(name)
          path = file_for(name)
          File.delete(path) if File.exist?(path)
          true
        rescue StandardError
          false
        end

        # Export / import the whole library, so presets travel with a project.
        def export_all
          path = UI.savepanel('Export preset library', File.expand_path('~'),
                              'ahw_kd_presets.json')
          return nil unless path

          payload = { 'plugin' => PLUGIN_VERSION, 'exported' => Util.timestamp,
                      'presets' => list.map { |entry| load(entry['file']) }.compact }
          File.open(path, 'w:UTF-8') { |file| file.write(JSON.pretty_generate(payload)) }
          path
        end

        def import_all
          path = UI.openpanel('Import preset library', File.expand_path('~'), 'JSON|*.json||')
          return nil unless path

          data = JSON.parse(File.read(path))
          count = 0
          Array(data['presets']).each do |params|
            normalized = Params.normalize(params)
            count += 1 if save(normalized['name'], normalized)
          end
          count
        rescue StandardError => e
          Log.error(e, 'Catalog.import_all')
          nil
        end
      end
    end
  end
end
