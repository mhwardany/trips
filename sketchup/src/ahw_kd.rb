# frozen_string_literal: true
#
# AHW Kitchen & Dressing  —  parametric cabinetry for SketchUp
# AHW Architects Master  |  https://github.com/mhwardany
#
# Registration file. Keep this file and the ahw_kd/ folder together inside
# the SketchUp Plugins directory.

require 'sketchup.rb'
require 'extensions.rb'

module AHW
  module KD
    PLUGIN_NAME    = 'AHW Kitchen & Dressing'
    PLUGIN_ID      = 'ahw_kd'
    PLUGIN_VERSION = '1.1.0'

    PATH_ROOT = File.dirname(__FILE__).freeze
    PATH_LIB  = File.join(PATH_ROOT, 'ahw_kd').freeze
    PATH_HTML = File.join(PATH_LIB, 'ui', 'html').freeze
    PATH_DATA = File.join(PATH_LIB, 'data').freeze

    unless file_loaded?(__FILE__)
      ext = SketchupExtension.new(PLUGIN_NAME, File.join(PATH_LIB, 'main'))
      ext.version     = PLUGIN_VERSION
      ext.creator     = 'AHW Architects Master'
      ext.copyright   = "#{Time.now.year} AHW Architects Master"
      ext.description = 'Parametric kitchen, bathroom vanity and dressing/wardrobe ' \
                        'units with full carcass, fronts, hardware, worktops, ' \
                        'appliance slots, cut list and BOQ export.'
      Sketchup.register_extension(ext, true)
      file_loaded(__FILE__)
    end
  end
end
