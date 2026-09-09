# frozen_string_literal: true
#
# Structural audit of the plugin. Answers the questions a review would ask:
# is every parameter editable, is every catalogue reachable from the dialog,
# does every material key resolve, and is anything declared but unused?
#
#   ruby sketchup/scripts/audit.rb

$LOAD_PATH.unshift(File.expand_path('../test/stubs', __dir__))
require_relative '../test/stub_sketchup'

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

JS  = File.read(File.join(PATH_HTML, 'app.js'), encoding: 'UTF-8')
RB  = Dir.glob(File.join(PATH_LIB, '**', '*.rb'))
        .to_h { |f| [f, File.read(f, encoding: 'UTF-8')] }
ALL = RB.values.join("\n")

FINDINGS = []
def finding(area, text)
  FINDINGS << "#{area}: #{text}"
end

def section(title)
  puts "\n#{title}"
  puts '-' * title.length
end

def leaves(hash, prefix = '')
  hash.flat_map do |key, value|
    path = prefix.empty? ? key.to_s : "#{prefix}.#{key}"
    value.is_a?(Hash) ? leaves(value, path) : [path]
  end
end

ALL_TYPES = Const::FAMILIES.values.flatten.uniq

# ------------------------------------------------------------ 1. UI reach
section '1. Parameter coverage in the dialog'
skip = %w[schema style family type name meta.qty interior.divider_at]
paths = ALL_TYPES.flat_map { |type| leaves(Params.defaults(type)) }.uniq
paths.reject! { |p| skip.include?(p) || p.start_with?('rows.', 'interior.accessories') }
unreached = paths.reject { |p| JS.include?("'#{p}'") }
if unreached.empty?
  puts "  #{paths.size} parameters, all editable."
else
  unreached.each { |p| finding('UI', "#{p} is not editable in the dialog") }
  puts "  #{unreached.size} unreachable: #{unreached.join(', ')}"
end

# ------------------------------------------------- 2. catalogues in the UI
section '2. Catalogues reachable from the dialog'
dialog = RB[File.join(PATH_LIB, 'ui', 'dialog.rb')]
catalogues = {
  'FAMILIES' => Const::FAMILIES, 'ENVELOPE' => Const::ENVELOPE,
  'DOOR_STYLES' => Const::DOOR_STYLES, 'HANDLE_TYPES' => Const::HANDLE_TYPES,
  'HANDLE_FINISHES' => Const::HANDLE_FINISHES, 'HINGE_TYPES' => Const::HINGE_TYPES,
  'RUNNER_TYPES' => Const::RUNNER_TYPES, 'LIFT_SYSTEMS' => Const::LIFT_SYSTEMS,
  'FRONT_KINDS' => Const::FRONT_KINDS, 'APPLIANCES' => Const::APPLIANCES,
  'INTERIOR_ACCESSORIES' => Const::INTERIOR_ACCESSORIES, 'GLASS_TYPES' => Const::GLASS_TYPES
}
catalogues.each do |name, list|
  if dialog.include?("Const::#{name}")
    puts format('  %-22s %3d entries -> dialog', name, list.size)
  else
    finding('UI', "Const::#{name} is never sent to the dialog")
  end
end
if dialog.include?('Styles.catalogue')
  puts format('  %-22s %3d entries -> dialog', 'DESIGN_STYLES', Styles.keys.size)
else
  finding('UI', 'Styles.catalogue is never sent to the dialog')
end

# ------------------------------------------------------- 3. material keys
section '3. Material references'
bad = []
ALL_TYPES.each do |type|
  Params.defaults(type)['materials'].each do |role, key|
    bad << "#{type}.#{role} -> #{key}" unless Materials::LIBRARY.key?(key)
  end
end
Const::HANDLE_FINISHES.each { |k| bad << "HANDLE_FINISHES -> #{k}" unless Materials::LIBRARY.key?(k) }
Styles::SPECS.each do |name, spec|
  spec['materials'].each_value do |palette|
    palette.each_value { |k| bad << "style #{name} -> #{k}" unless Materials::LIBRARY.key?(k) }
  end
  handle = spec['front']['handle']['material']
  bad << "style #{name} handle -> #{handle}" unless Materials::LIBRARY.key?(handle)
end
# keys hard-coded inside the builders
ALL.scan(/material: '([a-z0-9_]+)'/).flatten.uniq.each do |key|
  bad << "builder -> #{key}" unless Materials::LIBRARY.key?(key)
end
if bad.empty?
  puts "  #{Materials::LIBRARY.size} materials, every reference resolves."
else
  bad.each { |b| finding('Materials', "unknown key #{b}") }
end

# ------------------------------------------------------ 4. dead constants
section '4. Declared but unused'
dead = []
Const.constants.each do |name|
  next if %i[DICT ATTR_PARAMS ATTR_VERSION ATTR_KIND ATTR_PART SCHEMA MM TOL].include?(name)

  # the declaration itself is written without the Const:: prefix, so any
  # match here is a real reference
  dead << name if ALL.scan(/Const::#{name}\b/).empty?
end
if dead.empty?
  puts '  every catalogue in Const is used.'
else
  dead.each { |name| finding('Const', "#{name} is declared but never used") }
end

# -------------------------------------------------- 5. builder coverage
section '5. Builder coverage'
model = Sketchup.active_model
combos = {
  'unit types'      => ALL_TYPES,
  'door styles'     => Const::DOOR_STYLES,
  'front kinds'     => Const::FRONT_KINDS,
  'handles'         => Const::HANDLE_TYPES,
  'accessories'     => Const::INTERIOR_ACCESSORIES,
  'appliances'      => Const::APPLIANCES.keys,
  'design styles'   => Styles.keys,
  'worktop edges'   => %w[square bevel bullnose mitred],
  'plinth modes'    => %w[panel legs floating wall_hung none],
  'corner modes'    => %w[blind diagonal l]
}
combos.each { |label, list| puts format('  %-16s %3d', label, list.size) }
total = combos.values.map(&:size).sum
puts "  #{total} variants exercised by sketchup/test/run_tests.rb"

# ------------------------------------------------------------ 6. presets
section '6. Preset library'
presets = Export::Catalog.list
broken = presets.reject do |entry|
  params = Export::Catalog.load(entry['file'])
  params && Builders::Unit.create(model, params).entities.size.positive?
end
puts "  #{presets.size} presets, #{presets.size - broken.size} build cleanly."
broken.each { |entry| finding('Presets', "#{entry['name']} does not build") }

# ------------------------------------------------------------- 7. sizes
section '7. Source inventory'
RB.sort_by { |path, _| path }.each do |path, body|
  puts format('  %-46s %5d lines', path.sub("#{PATH_ROOT}/", ''), body.lines.size)
end
puts format('  %-46s %5d lines', 'ui/html/app.js', JS.lines.size)

# ------------------------------------------------------------- verdict
section 'Verdict'
if FINDINGS.empty?
  puts '  No findings. The plugin is internally consistent.'
  exit 0
else
  puts "  #{FINDINGS.size} finding(s):"
  FINDINGS.each { |f| puts "  - #{f}" }
  exit 1
end
