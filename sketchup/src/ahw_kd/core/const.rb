# frozen_string_literal: true

module AHW
  module KD
    # Central dictionary of everything the generators are allowed to build.
    # Anything the UI offers must exist here, so the dialog and the builders can
    # never drift apart.
    module Const
      DICT = 'AHW_KD'          # attribute dictionary written on every unit group
      ATTR_PARAMS   = 'params' # JSON blob of the full parameter set
      ATTR_VERSION  = 'schema'
      ATTR_KIND     = 'kind'   # 'unit' | 'part' | 'counter' | 'appliance'
      ATTR_PART     = 'part'   # part role, used by the cut list
      SCHEMA        = 3

      MM  = 1.0 / 25.4         # millimetre expressed in inches (SketchUp internal)
      TOL = 0.0001

      # ---------------------------------------------------------------- units
      # family => list of unit types
      FAMILIES = {
        'kitchen'  => %w[base base_sink base_hob base_corner base_appliance
                         drawer_bank tall wall wall_lift wall_open island hood],
        'bathroom' => %w[vanity vanity_wall vanity_open mirror_unit tallboy],
        'dressing' => %w[wardrobe wardrobe_sliding dressing_open corner_wardrobe
                         shoe_unit drawer_bank island_dresser]
      }.freeze

      # Carcass envelope per type: [width, CARCASS height, depth] in mm.
      # Height is the carcass body only - the plinth sits below it and the
      # worktop above it, so a base unit reads 150 + 720 + 30 = 900 mm
      # finished worktop height, the 32 mm frameless standard used across
      # GCC / MENA fit-out.
      ENVELOPE = {
        'base'            => [600,  720,  560],
        'base_sink'       => [800,  720,  560],
        'base_hob'        => [600,  720,  560],
        'base_corner'     => [900,  720,  560],
        'base_appliance'  => [600,  720,  560],
        'drawer_bank'     => [600,  720,  560],
        'tall'            => [600, 2100,  580],
        'wall'            => [600,  720,  350],
        'wall_lift'       => [900,  480,  350],
        'wall_open'       => [600,  720,  300],
        'island'          => [1200, 720,  900],
        'hood'            => [900,  700,  500],
        'vanity'          => [800,  720,  480],
        'vanity_wall'     => [800,  500,  480],
        'vanity_open'     => [800,  500,  480],
        'mirror_unit'     => [800,  700,  120],
        'tallboy'         => [400, 1500,  350],
        'wardrobe'        => [1000, 2300, 600],
        'wardrobe_sliding'=> [1800, 2300, 650],
        'dressing_open'   => [1000, 2300, 550],
        'corner_wardrobe' => [1000, 2300, 1000],
        'shoe_unit'       => [800, 1100,  350],
        'island_dresser'  => [1200, 720,  600]
      }.freeze

      # Types that sit on the floor (need a plinth / legs).
      FLOOR_TYPES = %w[base base_sink base_hob base_corner base_appliance drawer_bank
                       tall island vanity tallboy wardrobe wardrobe_sliding
                       dressing_open corner_wardrobe shoe_unit island_dresser].freeze

      # Types that may carry a worktop.
      WORKTOP_TYPES = %w[base base_sink base_hob base_corner base_appliance
                         drawer_bank island vanity vanity_wall vanity_open
                         island_dresser].freeze

      # Types hung off the wall.
      WALL_TYPES = %w[wall wall_lift wall_open hood vanity_wall vanity_open
                      mirror_unit].freeze

      # ---------------------------------------------------------- front kinds
      FRONT_KINDS = %w[door doors2 drawer lift flap open appliance sliding
                       bifold louvre].freeze

      # Lift systems (Blum Aventos naming, the de-facto reference in the region).
      LIFT_SYSTEMS = {
        'hf' => 'Bi-fold lift (Aventos HF) — folds up in two leaves',
        'hs' => 'Up & over lift (Aventos HS) — single leaf swings over carcass',
        'hk' => 'Stay lift (Aventos HK) — single leaf lifts parallel',
        'hl' => 'Lift up (Aventos HL) — leaf lifts vertically, stays parallel',
        'flap' => 'Flap hinge — leaf drops down'
      }.freeze

      DOOR_STYLES = %w[slab shaker routed glass_frame glass_full louvre
                       ribbed handleless_j gola profiled].freeze

      HINGE_SIDES = %w[left right top bottom].freeze

      OVERLAY_MODES = %w[overlay_full overlay_half inset].freeze

      # ------------------------------------------------------------- hardware
      HANDLE_TYPES = %w[none bar knob edge_pull j_profile gola push_open
                        recessed_round leather_strap].freeze

      RUNNER_TYPES = {
        'roller'   => { 'side' => 12.5, 'bottom' => 12.0, 'back' => 20.0, 'label' => 'Roller runner (economy)' },
        'ball'     => { 'side' => 12.5, 'bottom' => 12.0, 'back' => 15.0, 'label' => 'Ball-bearing full extension' },
        'tandem'   => { 'side' => 10.0, 'bottom' => 16.0, 'back' => 12.0, 'label' => 'Concealed undermount (Tandem)' },
        'legrabox' => { 'side' => 9.5,  'bottom' => 16.0, 'back' => 12.0, 'label' => 'Box system (Legrabox / Nova Pro)' }
      }.freeze

      HINGE_TYPES = %w[clip_top_110 clip_top_155 blumotion_110 thick_door_95
                       glass_door_170 pie_corner].freeze

      # --------------------------------------------------------------- glass
      GLASS_TYPES = {
        'clear'    => [0.22, 'Clear float'],
        'bronze'   => [0.45, 'Bronze tinted'],
        'grey'     => [0.45, 'Grey tinted'],
        'frosted'  => [0.60, 'Acid etched / frosted'],
        'reeded'   => [0.55, 'Reeded / fluted'],
        'mirror'   => [0.02, 'Silver mirror'],
        'smoked'   => [0.55, 'Smoked grey'],
        'lacobel'  => [0.02, 'Back-painted (Lacobel)']
      }.freeze

      # ------------------------------------------------------------ interior
      INTERIOR_ACCESSORIES = %w[shelf divider hanging_rail double_rail pull_down_rail
                                trouser_rack tie_rack shoe_shelf wire_basket
                                cutlery_tray plate_rack pull_out_larder
                                magic_corner carousel waste_bin laundry_basket
                                jewellery_drawer glass_shelf led_strip mirror_panel
                                open_niche safe_box vanity_drawer].freeze

      # ---------------------------------------------------------- appliances
      # nominal cut-out envelope in mm [w, h, d]
      APPLIANCES = {
        'oven'        => [560,  595, 550],
        'oven_double' => [560,  888, 550],
        'microwave'   => [560,  380, 550],
        'coffee'      => [560,  450, 550],
        'warming'     => [560,  140, 550],
        'dishwasher'  => [600,  820, 570],
        'dishwasher_slim' => [450, 820, 570],
        'washer'      => [600,  850, 600],
        'dryer'       => [600,  850, 600],
        'washer_dryer'=> [600,  850, 600],
        'fridge'      => [560, 1780, 550],
        'fridge_tall' => [560, 2000, 560],
        'freezer'     => [560, 1780, 550],
        'wine_cooler' => [560,  885, 550],
        'kettle'      => [220,  260, 220],
        'toaster'     => [300,  200, 200],
        'coffee_machine' => [340, 380, 400],
        'blender'     => [200,  400, 200],
        'tv'          => [1100,  650,  70],
        'custom'      => [600,  600, 550]
      }.freeze

      # ------------------------------------------------------------- exports
      CUTLIST_COLUMNS = %w[unit part material length_mm width_mm thickness_mm
                           qty grain edge_l1 edge_l2 edge_w1 edge_w2 area_m2 note].freeze
    end
  end
end
