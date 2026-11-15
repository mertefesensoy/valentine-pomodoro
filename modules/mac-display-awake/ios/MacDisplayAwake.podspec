Pod::Spec.new do |s|
  s.name           = 'MacDisplayAwake'
  s.version        = '1.0.0'
  s.summary        = 'Keeps a Mac display on while a session runs, for the iPhone and iPad app on a Mac.'
  s.description    = 'A local Expo module of Valentine Pomodoro (1.5.2, DEF-010 on the Mac).'
  s.license        = 'UNLICENSED'
  s.author         = 'Valentine Pomodoro'
  s.homepage       = 'https://github.com/mertefesensoy/valentine-pomodoro'
  s.platforms      = {
    :ios => '16.4'
  }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/mertefesensoy/valentine-pomodoro.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = "**/*.{h,m,swift}"
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
