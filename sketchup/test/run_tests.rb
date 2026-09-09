# frozen_string_literal: true
#
# Headless checks. These do not replace testing inside SketchUp, but they
# catch the failures that actually happen while developing: typos, nil
# dereferences, and dimension maths that does not add up.

$LOAD_PATH.unshift(File.expand_path('stubs', __dir__))
require_relative 'stub_sketchup'

module AHW
  module KD
    PLUGIN_NAME    = 'AHW Kitchen & Dressing'
    PLUGIN_ID      = 'ahw_kd'
    PLUGIN_VERSION = '1.1.0'
    PATH_ROOT = File.expand_path('../src', __dir__).freeze
    PATH_LIB  = File.join(PATH_ROOT, 'ahw_kd').freeze
    PATH_HTML = File.join(PATH_LIB, 'ui', 'html').freeze
    PATH_DATA = File.join(PATH_LIB, 'data').freeze
  end
end

require File.join(AHW::KD::PATH_LIB, 'main.rb')

include AHW::KD

FAILURES = []
CHECKS = [0]

def check(label)
  CHECKS[0] += 1
  result = yield
  raise "expected truthy, got #{result.inspect}" unless result
rescue StandardError => e
  FAILURES << "#{label}: #{e.class}: #{e.message}\n    #{Array(e.backtrace).first(3).join("\n    ")}"
end

def close_to(a, b, tolerance = 0.01)
  (a - b).abs <= tolerance
end

puts "AHW Kitchen & Dressing — headless checks\n\n"

# ---------------------------------------------------------------- utils
check('Util.mm round trip') { close_to(Util.to_mm(Util.mm(600.0)), 600.0) }
check('Util.distribute fills') do
  heights = Util.distribute(1000.0, [140.0, 0.0, 0.0])
  close_to(heights.sum, 1000.0) && close_to(heights[1], heights[2])
end
check('Util.distribute scales fixed rows') do
  heights = Util.distribute(600.0, [400.0, 400.0])
  close_to(heights.sum, 600.0)
end
check('Util.columns spans width with gaps') do
  cols = Util.columns(900.0, 3, 3.0)
  last = cols.last
  close_to(last[0] + last[1], 900.0)
end
check('Util.bool') { Util.bool('true') && !Util.bool('false') && Util.bool(1) }

# --------------------------------------------------------------- params
ALL_TYPES = Const::FAMILIES.values.flatten.uniq

ALL_TYPES.each do |type|
  check("defaults(#{type}) normalise cleanly") do
    params = Params.normalize(Params.defaults(type))
    params['type'] == type && params['w'].positive? && params['h'].positive?
  end
end

check('normalize clamps silly sizes') do
  params = Params.normalize(Params.defaults('base').merge('w' => '-50', 'h' => '99999'))
  params['w'] >= 80.0 && params['h'] <= 3600.0
end

check('normalize survives a params blob with unknown keys') do
  params = Params.normalize({ 'type' => 'wall', 'nonsense' => true, 'rows' => [{ 'kind' => 'bogus' }] })
  params['rows'].first['kind'] == 'door'
end

check('auto name follows the drawing convention') do
  Params.auto_name(Params.defaults('wall')) == 'W-600'
end

# --------------------------------------------------------------- layout
check('base layout puts the worktop at 900 mm') do
  layout = Layout.new(Params.normalize(Params.defaults('base')))
  close_to(layout.total_h, 900.0, 0.5)
end

check('row heights fill the front opening exactly') do
  layout = Layout.new(Params.normalize(Params.defaults('drawer_bank')))
  heights = layout.row_heights
  expected = layout.front_span - layout.gap * (heights.size - 1)
  close_to(heights.sum, expected, 0.5)
end

check('rows stack without overlapping') do
  layout = Layout.new(Params.normalize(Params.defaults('drawer_bank')))
  positions = layout.row_positions
  ok = true
  positions.each_cons(2) do |(z1, h1), (z2, _h2)|
    ok &&= close_to(z1 + h1 + layout.gap, z2, 0.5)
  end
  ok
end

check('inset fronts sit inside the carcass') do
  params = Params.normalize(Params.defaults('base'))
  params['front']['mode'] = 'inset'
  layout = Layout.new(params)
  area = layout.front_area
  area[0] >= layout.inner_x0 && area[1] <= layout.inner_x1
end

check('appliance rows take the appliance height') do
  params = Params.normalize(Params.defaults('tall'))
  params['rows'] = [Params.row('appliance', 'appl' => 'oven'),
                    Params.row('door', 'h' => 0.0)]
  layout = Layout.new(Params.normalize(params))
  close_to(layout.row_heights.first, 597.0, 1.0)
end

# -------------------------------------------------------------- builders
MODEL = Sketchup.active_model

built = {}
ALL_TYPES.each do |type|
  check("build #{type}") do
    params = Params.defaults(type)
    unit = Builders::Unit.create(MODEL, params)
    built[type] = unit
    unit.entities.size.positive? && Store.read(unit)['type'] == type
  end
end

check('every built unit reports parts') do
  ALL_TYPES.all? do |type|
    unit = built[type]
    next true unless unit

    Export::Report.parts_of(unit).size.positive?
  end
end

check('open state rebuild keeps the unit editable') do
  unit = built['base']
  params = Store.read(unit)
  params['open']['doors'] = 90.0
  params['open']['drawers'] = 100.0
  Builders::Unit.rebuild(unit, params)
  Store.read(unit)['open']['doors'] == 90.0
end

check('rebuild is idempotent in part count') do
  unit = built['wardrobe']
  before = Export::Report.parts_of(unit).size
  Builders::Unit.rebuild(unit, Store.read(unit))
  Export::Report.parts_of(unit).size == before
end

check('every door style builds') do
  Const::DOOR_STYLES.all? do |style|
    params = Params.defaults('wall')
    params['front']['style'] = style
    Builders::Unit.create(MODEL, params).entities.size.positive?
  end
end

check('every front kind builds') do
  Const::FRONT_KINDS.all? do |kind|
    params = Params.defaults('base')
    params['rows'] = [Params.row(kind, 'appl' => 'oven')]
    Builders::Unit.create(MODEL, params).entities.size.positive?
  end
end

check('every worktop edge profile builds') do
  %w[square bevel bullnose mitred].all? do |edge|
    params = Params.defaults('base')
    params['counter']['edge'] = edge
    Builders::Unit.create(MODEL, params).entities.size.positive?
  end
end

check('every interior accessory builds') do
  Const::INTERIOR_ACCESSORIES.all? do |type|
    params = Params.defaults('wardrobe')
    params['interior']['accessories'] = [Params.accessory(type, 'z' => 500.0, 'count' => 2)]
    Builders::Unit.create(MODEL, params).entities.size.positive?
  end
end

check('every appliance placeholder builds') do
  Const::APPLIANCES.keys.all? do |appl|
    params = Params.defaults('tall')
    params['rows'] = [Params.row('appliance', 'appl' => appl)]
    Builders::Unit.create(MODEL, params).entities.size.positive?
  end
end

check('every plinth mode builds') do
  %w[panel legs floating wall_hung none].all? do |mode|
    params = Params.defaults('base')
    params['plinth']['mode'] = mode
    Builders::Unit.create(MODEL, params).entities.size.positive?
  end
end

check('the integrated floating base draws its shadow gap and LED') do
  params = Params.defaults('vanity_wall')
  params['plinth'] = params['plinth'].merge(
    'mode' => 'floating', 'h' => 150.0, 'setback' => 70.0, 'shadow' => 25.0, 'led' => true
  )
  unit = Builders::Unit.create(MODEL, params)
  parts = Export::Report.parts_of(unit)
  parts.any? { |row| row['part'] == 'Plinth' } && parts.any? { |row| row['part'] == 'Lighting' }
end

check('a wall hung unit gets a rail and no plinth height') do
  params = Params.defaults('vanity_wall')
  params['plinth'] = params['plinth'].merge('mode' => 'wall_hung', 'led' => true)
  normalized = Params.normalize(params)
  unit = Builders::Unit.create(MODEL, normalized)
  parts = Export::Report.parts_of(unit)
  normalized['plinth']['h'].zero? && parts.any? { |row| row['part'] == 'Mounting Rail' }
end

# ------------------------------------------------------------- handles
check('every handle finish exists in the material library') do
  Const::HANDLE_FINISHES.all? { |key| Materials::LIBRARY.key?(key) }
end

check('every handle type builds horizontally and vertically') do
  Const::HANDLE_TYPES.all? do |kind|
    %w[top left].all? do |pos|
      params = Params.defaults('base')
      params['front']['handle']['type'] = kind
      params['front']['handle']['pos'] = pos
      Builders::Unit.create(MODEL, params).entities.size.positive?
    end
  end
end

check('a drawn handle reaches the hardware schedule with its finish') do
  params = Params.defaults('wall')
  params['front']['handle']['type'] = 'cup_pull'
  params['front']['handle']['material'] = 'brass_polished'
  unit = Builders::Unit.create(MODEL, params)
  Export::Report.parts_of(unit).any? do |row|
    row['part'] == 'Handle' && row['material'] == 'brass_polished'
  end
end

check('handle types that need no geometry draw none') do
  Const::HANDLE_NONE.all? do |kind|
    params = Params.defaults('wall')
    params['front']['handle']['type'] = kind
    unit = Builders::Unit.create(MODEL, params)
    Export::Report.parts_of(unit).none? { |row| row['part'] == 'Handle' }
  end
end

# -------------------------------------------------------- design styles
check('every design style applies and builds on every family') do
  Styles.keys.all? do |style|
    %w[base vanity wardrobe].all? do |type|
      params = Styles.apply(Params.defaults(type), style)
      params['style'] == style &&
        Builders::Unit.create(MODEL, Params.normalize(params)).entities.size.positive?
    end
  end
end

check('a style changes the look but never the size or the front layout') do
  before = Params.normalize(Params.defaults('drawer_bank'))
  after  = Params.normalize(Styles.apply(before, 'classic'))
  before['w'] == after['w'] && before['h'] == after['h'] && before['d'] == after['d'] &&
    before['rows'].size == after['rows'].size &&
    before['rows'].map { |r| r['kind'] } == after['rows'].map { |r| r['kind'] } &&
    after['front']['style'] == 'shaker' &&
    after['front']['handle']['type'] == 'cup_pull' &&
    after['materials']['front'] == 'lacquer_ivory'
end

check('a style never puts a plinth under a wall hung type') do
  Styles.keys.all? do |style|
    params = Styles.apply(Params.defaults('wall'), style)
    params['plinth']['mode'] == 'none'
  end
end

check('every style palette resolves to real materials') do
  Styles::SPECS.values.all? do |spec|
    spec['materials'].values.all? do |palette|
      palette.values.all? { |key| Materials::LIBRARY.key?(key) }
    end && Materials::LIBRARY.key?(spec['front']['handle']['material'])
  end
end

check('every corner mode builds') do
  %w[blind diagonal l].all? do |mode|
    params = Params.defaults('base_corner')
    params['corner']['mode'] = mode
    Builders::Unit.create(MODEL, params).entities.size.positive?
  end
end

check('every hood style builds') do
  %w[chimney island integrated wall_box].all? do |style|
    params = Params.defaults('hood')
    params['hood_style'] = style
    Builders::Unit.create(MODEL, params).entities.size.positive?
  end
end

check('a run places units side by side') do
  units = Builders::Unit.create_run(MODEL, [Params.defaults('base'),
                                            Params.defaults('base_sink'),
                                            Params.defaults('drawer_bank')])
  units.size == 3
end

# ----------------------------------------------------------- robustness
check('clamp survives an inverted range') do
  Util.clamp(70.0, 20.0, -5.0) == 20.0 && Util.clamp(5.0, 20.0, 100.0) == 20.0
end

check('a tiny unit builds without negative parts') do
  params = Params.defaults('wall')
  params['w'] = 120.0
  params['h'] = 150.0
  params['front']['style'] = 'shaker'
  unit = Builders::Unit.create(MODEL, params)
  parts = Export::Report.parts_of(unit)
  parts.all? { |row| row['length_mm'] >= 0 && row['width_mm'] >= 0 && row['thick_mm'] >= 0 }
end

check('an oversized unit still resolves its rows') do
  params = Params.defaults('wardrobe')
  params['w'] = 3000.0
  params['h'] = 3000.0
  params['interior']['dividers'] = 4
  params['rows'] = [Params.row('doors2', 'cols' => 6)]
  Builders::Unit.create(MODEL, params).entities.size.positive?
end

check('a unit with no back, no top and no plinth builds') do
  params = Params.defaults('wall_open')
  params['back_mode'] = 'none'
  params['top_mode'] = 'none'
  params['bottom_mode'] = 'none'
  params['plinth']['mode'] = 'none'
  Builders::Unit.create(MODEL, params).entities.size.positive?
end

check('every handle type builds on a small leaf') do
  Const::HANDLE_TYPES.all? do |handle|
    params = Params.defaults('wall')
    params['w'] = 300.0
    params['front']['handle']['type'] = handle
    Builders::Unit.create(MODEL, params).entities.size.positive?
  end
end

check('a corner radius produces a real rounded leaf') do
  params = Params.defaults('wall')
  params['front']['style'] = 'slab'
  params['front']['radius'] = 12.0
  unit = Builders::Unit.create(MODEL, params)
  Export::Report.parts_of(unit).any? { |row| row['note'].to_s.include?('R12') }
end

check('rounded_rect closes and respects the radius limit') do
  outline = Geom3.rounded_rect(0.0, 0.0, 100.0, 40.0, 500.0)
  xs = outline.map(&:first)
  zs = outline.map(&:last)
  outline.size > 8 && xs.min >= -0.01 && xs.max <= 100.01 &&
    zs.min >= -0.01 && zs.max <= 40.01
end

check('a scribe gable runs past the fronts') do
  plain = Params.normalize(Params.defaults('tall'))
  scribed = Params.normalize(plain.merge('side_mode' => 'scribe', 'scribe' => 25.0))
  a = Export::Report.parts_of(Builders::Unit.create(MODEL, plain))
      .find { |row| row['part'] == 'Gable' }
  b = Export::Report.parts_of(Builders::Unit.create(MODEL, scribed))
      .find { |row| row['part'] == 'Gable' }
  b['width_mm'] > a['width_mm'] && b['note'].to_s.include?('scribe')
end

check('the hinge type reaches the hardware schedule') do
  params = Params.defaults('wall')
  params['front']['hinge_type'] = 'glass_door_170'
  unit = Builders::Unit.create(MODEL, params)
  Export::Report.parts_of(unit).any? do |row|
    row['part'] == 'Hinge' && row['note'].to_s.include?('glass door 170')
  end
end

check('every hinge type normalises and builds') do
  Const::HINGE_TYPES.all? do |kind|
    params = Params.defaults('wall')
    params['front']['hinge_type'] = kind
    Params.normalize(params)['front']['hinge_type'] == kind &&
      Builders::Unit.create(MODEL, params).entities.size.positive?
  end
end

# --------------------------------------------------------------- reports
check('cut list produces panels') do
  rows = Export::Report.cutlist(MODEL, false)
  rows.size.positive? && rows.all? { |row| row['length_mm'].positive? }
end

check('cut list CSV has the documented columns') do
  csv = Export::Report.cutlist_csv(Export::Report.cutlist(MODEL, false))
  csv.lines.first.strip == Const::CUTLIST_COLUMNS.join(',')
end

check('hardware schedule lists hinges and runners') do
  rows = Export::Report.hardware(MODEL, false)
  rows.any? { |row| row['item'].to_s.include?('Hinge') } &&
    rows.any? { |row| row['item'].to_s.include?('Runner') }
end

check('BOQ totals are positive') do
  data = Export::Report.boq(MODEL, false)
  data['total'].positive? && data['units'].size.positive? && data['materials'].size.positive?
end

check('BOQ CSV renders') do
  Export::Report.boq_csv(Export::Report.boq(MODEL, false)).include?('TOTAL')
end

# -------------------------------------------------------------- catalog
check('preset round trip') do
  name = "__test_#{Process.pid}"
  params = Params.defaults('vanity')
  Export::Catalog.save(name, params)
  loaded = Export::Catalog.load(name)
  Export::Catalog.delete(name)
  loaded && loaded['type'] == 'vanity'
end

check('every shipped preset loads and builds') do
  presets = Export::Catalog.list
  presets.size.positive? && presets.all? do |entry|
    params = Export::Catalog.load(entry['file'])
    params && Builders::Unit.create(MODEL, params).entities.size.positive?
  end
end

# ------------------------------------------------------------- materials
check('every material key used by a preset exists') do
  ALL_TYPES.all? do |type|
    Params.defaults(type)['materials'].values.all? { |key| Materials::LIBRARY.key?(key) }
  end
end

check('material catalogue is dialog ready') do
  Materials.catalogue.all? { |entry| entry['key'] && entry['name'] && entry['color'] =~ /\A#[0-9A-F]{6}\z/ }
end

# ------------------------------------------------------------------ done
puts "checks run: #{CHECKS[0]}"
if FAILURES.empty?
  puts 'ALL PASSED'
  exit 0
else
  puts "FAILED: #{FAILURES.size}"
  FAILURES.each { |failure| puts "  - #{failure}" }
  exit 1
end
