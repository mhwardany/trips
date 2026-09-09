# frozen_string_literal: true

module AHW
  module KD
    module Log
      @debug = false

      class << self
        attr_accessor :debug

        def info(message)
          puts "[AHW-KD] #{message}" if @debug
        end

        def warn(message)
          puts "[AHW-KD] WARN #{message}"
        end

        def error(exception, context = nil)
          puts "[AHW-KD] ERROR #{context} #{exception.class}: #{exception.message}"
          puts exception.backtrace.first(8).join("\n") if @debug && exception.backtrace
        end

        # Wrap risky work so one bad unit never leaves the model in a half
        # built state.
        def guard(context)
          yield
        rescue StandardError => e
          error(e, context)
          nil
        end
      end
    end
  end
end
