# frozen_string_literal: true
#
# Regenerates the factory preset library shipped with the plugin.
#   ruby sketchup/scripts/build_presets.rb

$LOAD_PATH.unshift(File.expand_path('../test/stubs', __dir__))
require_relative '../test/stub_sketchup'

module AHW
  module KD
    PLUGIN_NAME    = 'AHW Kitchen & Dressing'
    PLUGIN_ID      = 'ahw_kd'
    PLUGIN_VERSION = '1.0.0'
    PATH_ROOT = File.expand_path('../src', __dir__).freeze
    PATH_LIB  = File.join(PATH_ROOT, 'ahw_kd').freeze
    PATH_HTML = File.join(PATH_LIB, 'ui', 'html').freeze
    PATH_DATA = File.join(PATH_LIB, 'data').freeze
  end
end

require File.join(AHW::KD::PATH_LIB, 'main.rb')
include AHW::KD

def preset(name, type, overrides = {})
  params = Util.deep_merge(Params.defaults(type), Params.stringify(overrides))
  params['name'] = name
  Export::Catalog.save(name, params)
  puts "  #{name}"
end

puts 'Writing factory presets...'

# ------------------------------------------------------------- kitchen
preset('K Base 600 drawer + door', 'base',
       'rows' => [Params.row('drawer', 'h' => 140.0, 'drawer' => { 'runner' => 'tandem',
                                                                   'insert' => 'cutlery_tray' }),
                  Params.row('door')],
       'interior' => { 'shelves' => 1 })

preset('K Base Sink 800', 'base_sink',
       'w' => 800.0,
       'sink' => { 'on' => true, 'mount' => 'undermount', 'w' => 600.0, 'd' => 420.0, 'bowls' => 1 },
       'interior' => { 'accessories' => [Params.accessory('waste_bin', 'count' => 2, 'z' => 20.0)] })

preset('K Base Hob 600 two drawers', 'base_hob',
       'hob' => { 'on' => true, 'kind' => 'gas', 'burners' => 4, 'w' => 580.0, 'd' => 500.0 })

preset('K Drawer bank 600 Legrabox', 'drawer_bank',
       'rows' => [Params.row('drawer', 'h' => 180.0, 'drawer' => { 'runner' => 'legrabox' }),
                  Params.row('drawer', 'h' => 180.0, 'drawer' => { 'runner' => 'legrabox' }),
                  Params.row('drawer', 'h' => 180.0, 'drawer' => { 'runner' => 'legrabox' }),
                  Params.row('drawer', 'h' => 0.0,   'drawer' => { 'runner' => 'legrabox' })])

preset('K Corner blind 900 magic corner', 'base_corner',
       'corner' => { 'mode' => 'blind', 'blind_w' => 300.0, 'side' => 'left' },
       'interior' => { 'accessories' => [Params.accessory('magic_corner', 'z' => 30.0)] })

preset('K Corner diagonal 900', 'base_corner',
       'corner' => { 'mode' => 'diagonal', 'return_w' => 900.0, 'return_d' => 560.0 },
       'interior' => { 'shelves' => 1 })

preset('K Tall larder 600', 'tall',
       'rows' => [Params.row('door', 'h' => 1250.0), Params.row('door', 'h' => 0.0)],
       'interior' => { 'shelves' => 0,
                       'accessories' => [Params.accessory('pull_out_larder', 'count' => 5, 'z' => 20.0)] })

preset('K Tall oven + microwave 600', 'tall',
       'rows' => [Params.row('drawer', 'h' => 200.0),
                  Params.row('appliance', 'appl' => 'oven'),
                  Params.row('appliance', 'appl' => 'microwave'),
                  Params.row('door', 'h' => 0.0)])

preset('K Tall fridge housing 600', 'tall',
       'h' => 2100.0,
       'rows' => [Params.row('appliance', 'appl' => 'fridge', 'appl_integrated' => true),
                  Params.row('door', 'h' => 0.0)])

preset('K Wall 600 shaker', 'wall',
       'front' => { 'style' => 'shaker' }, 'interior' => { 'shelves' => 1 })

preset('K Wall lift 900 Aventos HF glass', 'wall_lift',
       'front' => { 'style' => 'glass_frame',
                    'glass' => { 'type' => 'reeded', 'frame' => 'aluminium' } },
       'rows' => [Params.row('lift', 'lift' => 'hf', 'hinge' => 'top')])

preset('K Wall open shelf 600', 'wall_open',
       'interior' => { 'shelves' => 2,
                       'accessories' => [Params.accessory('led_strip', 'z' => 690.0)] })

preset('K Island 1800 breakfast', 'island',
       'w' => 1800.0,
       'counter' => { 'on' => true, 't' => 30.0, 'back_oh' => 350.0, 'oh_l' => 25.0,
                      'oh_r' => 25.0, 'edge' => 'mitred', 'mitre_t' => 80.0,
                      'waterfall_l' => true, 'waterfall_r' => true },
       'rows' => [Params.row('drawer', 'h' => 180.0), Params.row('doors2', 'cols' => 3)])

preset('K Hood chimney 900', 'hood', 'hood_style' => 'chimney')

# ------------------------------------------------------------ bathroom
preset('B Vanity wall hung 800 polywood', 'vanity_wall',
       'materials' => { 'carcass' => 'polywood_18', 'front' => 'polywood_18',
                        'back' => 'polywood_16', 'shelf' => 'polywood_18',
                        'counter' => 'quartz_white' },
       'rows' => [Params.row('drawer', 'h' => 0.0, 'drawer' => { 'runner' => 'tandem' })],
       'sink' => { 'on' => true, 'mount' => 'undermount', 'w' => 500.0, 'd' => 380.0 })

preset('B Vanity floor 900 two doors', 'vanity',
       'w' => 900.0,
       'materials' => { 'carcass' => 'polywood_18', 'front' => 'lacquer_greige' },
       'sink' => { 'on' => true, 'mount' => 'topmount', 'w' => 560.0, 'd' => 420.0 })

preset('B Mirror cabinet 800', 'mirror_unit',
       'front' => { 'style' => 'glass_full', 'glass' => { 'type' => 'mirror', 'frame' => 'none' } },
       'rows' => [Params.row('doors2', 'cols' => 2)],
       'interior' => { 'shelves' => 2,
                       'accessories' => [Params.accessory('led_strip', 'z' => 660.0)] })

# ------------------------------------------------------------ dressing
preset('D Wardrobe 1000 hinged', 'wardrobe',
       'interior' => { 'shelves' => 1,
                       'accessories' => [Params.accessory('hanging_rail', 'z' => 1600.0),
                                         Params.accessory('led_strip', 'z' => 2260.0)] })

preset('D Wardrobe 1800 sliding', 'wardrobe_sliding',
       'rows' => [Params.row('sliding', 'panels' => 2)],
       'front' => { 'style' => 'glass_full', 'glass' => { 'type' => 'lacobel' } },
       'interior' => { 'shelves' => 2, 'dividers' => 1,
                       'accessories' => [Params.accessory('hanging_rail', 'z' => 1600.0)] })

preset('D Open dressing 1000', 'dressing_open',
       'interior' => { 'shelves' => 2, 'dividers' => 1,
                       'accessories' => [Params.accessory('hanging_rail', 'z' => 950.0),
                                         Params.accessory('hanging_rail', 'z' => 1900.0),
                                         Params.accessory('trouser_rack', 'z' => 400.0, 'w' => 450.0),
                                         Params.accessory('led_strip', 'z' => 2260.0)] })

preset('D Shoe unit 800 flaps', 'shoe_unit',
       'interior' => { 'accessories' => [Params.accessory('shoe_shelf', 'count' => 4, 'angle' => 15.0)] })

preset('D Dressing island 1200', 'island_dresser',
       'interior' => { 'accessories' => [Params.accessory('jewellery_drawer', 'z' => 400.0)] })

preset('D Corner wardrobe L 1000', 'corner_wardrobe',
       'corner' => { 'mode' => 'l', 'return_w' => 1400.0, 'return_d' => 600.0, 'front_b' => true })

puts "done — #{Export::Catalog.list.size} presets in #{Export::Catalog.folder}"
