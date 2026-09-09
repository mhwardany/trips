# frozen_string_literal: true
#
# A deliberately small stand-in for the SketchUp Ruby API so the geometry and
# reporting code can be exercised outside SketchUp. It records what the
# builders ask for rather than drawing anything.

class Numeric
  def degrees
    self * Math::PI / 180.0
  end

  def to_l
    self
  end
end

module Geom
  class Vector3d
    attr_accessor :x, :y, :z

    def initialize(x = 0, y = 0, z = 0)
      @x = x.to_f
      @y = y.to_f
      @z = z.to_f
    end

    def length
      Math.sqrt(@x**2 + @y**2 + @z**2)
    end

    def normalize
      len = length
      return self if len.zero?

      Vector3d.new(@x / len, @y / len, @z / len)
    end

    def cross(other)
      Vector3d.new(@y * other.z - @z * other.y,
                   @z * other.x - @x * other.z,
                   @x * other.y - @y * other.x)
    end

    def to_a
      [@x, @y, @z]
    end
  end

  class Point3d
    attr_accessor :x, :y, :z

    def initialize(x = 0, y = 0, z = 0)
      if x.is_a?(Array)
        x, y, z = x
      end
      @x = x.to_f
      @y = y.to_f
      @z = z.to_f
    end

    def -(other)
      Vector3d.new(@x - other.x, @y - other.y, @z - other.z)
    end

    def offset(vector)
      Point3d.new(@x + vector.x, @y + vector.y, @z + vector.z)
    end

    def to_a
      [@x, @y, @z]
    end
  end

  class BoundingBox
    attr_reader :points

    def initialize
      @points = []
    end

    def add(point)
      point = Point3d.new(point) if point.is_a?(Array)
      @points << point
      self
    end

    def empty?
      @points.empty?
    end

    def min
      Point3d.new(@points.map(&:x).min.to_f, @points.map(&:y).min.to_f, @points.map(&:z).min.to_f)
    end

    def max
      Point3d.new(@points.map(&:x).max.to_f, @points.map(&:y).max.to_f, @points.map(&:z).max.to_f)
    end

    def center
      return Point3d.new if empty?

      Point3d.new((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2)
    end

    def width
      empty? ? 0.0 : max.x - min.x
    end

    def height
      empty? ? 0.0 : max.y - min.y
    end

    def depth
      empty? ? 0.0 : max.z - min.z
    end
  end

  class Transformation
    def self.translation(_vector) = new
    def self.rotation(_point, _vector, _angle) = new
    def self.scaling(_point, _x = 1, _y = 1, _z = 1) = new

    def initialize(*_args); end

    def *(other)
      other.is_a?(Transformation) ? self : other
    end
  end
end

ORIGIN = Geom::Point3d.new(0, 0, 0)
GL_LINES = 1
GL_LINE_LOOP = 2
VK_LEFT = 37
VK_RIGHT = 39
VK_UP = 38
VK_DOWN = 40
MB_YESNO = 4
IDYES = 6
IDNO = 7

module Sketchup
  class Color
    def initialize(*_args); end
    attr_accessor :alpha
  end

  class Material
    attr_accessor :color, :alpha, :name

    def initialize(name)
      @name = name
    end
  end

  class Materials
    def initialize
      @map = {}
    end

    def [](name)
      @map[name]
    end

    def add(name)
      @map[name] ||= Material.new(name)
    end
  end

  class Face
    attr_reader :points, :normal, :pulled

    def initialize(points)
      @points = points
      @normal = compute_normal
      @pulled = nil
    end

    def compute_normal
      return Geom::Vector3d.new(0, 0, 1) if @points.size < 3

      a = @points[1] - @points[0]
      b = @points[2] - @points[0]
      a.cross(b).normalize
    end

    def reverse!
      @normal = Geom::Vector3d.new(-@normal.x, -@normal.y, -@normal.z)
      self
    end

    def pushpull(distance)
      @pulled = distance
      self
    end

    def area
      bounds.width * bounds.height
    end

    def bounds
      box = Geom::BoundingBox.new
      @points.each { |point| box.add(point) }
      box
    end
  end

  class Edge; end

  class AttributeDictionary < Hash; end

  class Entities
    include Enumerable

    attr_reader :items

    def initialize(model, owner = nil)
      @model = model
      @owner = owner
      @items = []
    end

    def each(&block) = @items.each(&block)
    def to_a = @items.dup
    def size = @items.size
    def length = @items.size

    def grep(klass)
      @items.select { |item| item.is_a?(klass) }
    end

    def add_group(*_args)
      group = Group.new(@model)
      @items << group
      group
    end

    def add_instance(definition, _transformation)
      instance = ComponentInstance.new(definition)
      @items << instance
      instance
    end

    def add_face(*points)
      points = points.first if points.size == 1 && points.first.is_a?(Array)
      face = Face.new(points.map { |p| p.is_a?(Geom::Point3d) ? p : Geom::Point3d.new(p) })
      @items << face
      @model.counters[:faces] += 1
      face
    end

    def add_edges(points)
      points.each { @model.counters[:edges] += 1 }
      # a closed loop also produces a face in the real API
      add_face(points[0...-1]) if points.size > 3
      []
    end

    def add_circle(centre, _normal, radius, segments = 24)
      @model.counters[:circles] += 1
      Array.new(segments) do |i|
        angle = 2 * Math::PI * i / segments
        Geom::Point3d.new(centre.x + radius * Math.cos(angle),
                          centre.y + radius * Math.sin(angle),
                          centre.z)
      end
    end

    def clear!
      @items.clear
      true
    end

    def erase_entities(list)
      @items -= Array(list)
      true
    end
  end

  class Group
    attr_accessor :name, :material
    attr_reader :entities, :model, :transforms

    def initialize(model)
      @model = model
      @entities = Entities.new(model, self)
      @dicts = {}
      @transforms = []
      @name = ''
    end

    def attribute_dictionary(name, create = false)
      @dicts[name] ||= (create ? AttributeDictionary.new : nil)
    end

    def attribute_dictionaries = @dicts

    def transform!(transformation)
      @transforms << transformation
      self
    end

    def bounds = Geom::BoundingBox.new
  end

  class ComponentDefinition
    attr_reader :entities, :bounds

    def initialize
      @bounds = Geom::BoundingBox.new
    end
  end

  class ComponentInstance
    attr_reader :definition

    def initialize(definition)
      @definition = definition
    end

    def transform!(_t) = self
    def bounds = Geom::BoundingBox.new.add(ORIGIN)
  end

  class Definitions
    def load(_path) = nil
  end

  class Selection
    include Enumerable

    def initialize
      @items = []
    end

    def each(&block) = @items.each(&block)
    def to_a = @items.dup
    def empty? = @items.empty?
    def clear = @items.clear
    def add(item) = @items << item
    def remove_observer(_o) = true
    def add_observer(_o) = true
  end

  class Model
    attr_reader :entities, :materials, :selection, :definitions, :counters

    def initialize
      @counters = Hash.new(0)
      @entities = Entities.new(self)
      @materials = Materials.new
      @selection = Selection.new
      @definitions = Definitions.new
      @attributes = {}
    end

    def get_attribute(dict, key, default = nil)
      (@attributes[dict] || {}).fetch(key, default)
    end

    def set_attribute(dict, key, value)
      (@attributes[dict] ||= {})[key] = value
    end

    def active_entities = @entities
    def active_path = nil
    def active_view = nil
    def start_operation(*_args) = true
    def commit_operation = true
    def abort_operation = true
    def select_tool(_tool) = true
  end

  class SelectionObserver; end
  class AppObserver; end

  @model = Model.new

  class << self
    def active_model = @model
    def status_text=(_text); end
    def read_default(_a, _b, default = nil) = default
    def write_default(_a, _b, _c) = true
    def add_observer(_o) = true
    def remove_observer(_o) = true
    def register_extension(_e, _l = true) = true
    def version = '25.0'
  end
end

module UI
  class HtmlDialog
    STYLE_DIALOG = 1
    def initialize(*_args); end
    def set_file(_p); end
    def add_action_callback(_n, &_b); end
    def set_on_closed(&_b); end
    def show; end
    def visible? = false
    def bring_to_front; end
    def close; end
    def execute_script(_s); end
  end

  class Command
    attr_accessor :small_icon, :large_icon, :tooltip, :status_bar_text, :menu_text
    def initialize(_title, &_block); end
  end

  class Toolbar
    def initialize(_name); end
    def add_item(_i) = self
    def add_separator = self
    def restore = self
  end

  module_function

  def messagebox(_text, _type = 0) = 1
  def openURL(_url) = true
  def openpanel(*_args) = nil
  def savepanel(*_args) = nil
  def menu(_name) = Menu.new
  def start_timer(_delay, _repeat) = 1

  class Menu
    def add_submenu(_name) = Menu.new
    def add_item(_name = nil, &_block) = 1
    def add_separator = 1
  end
end

class SketchupExtension
  attr_accessor :version, :creator, :copyright, :description
  def initialize(_name, _path); end
end

def file_loaded?(_path) = false
def file_loaded(_path) = true
def require_all(*_args) = true
