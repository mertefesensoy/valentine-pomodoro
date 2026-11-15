import ExpoModulesCore

// Keeps a Mac's display on while a session runs, for the iPhone and iPad app
// running on a Mac ("Designed for iPad"), 1.5.2.
//
// 1.5.1's fix for DEF-010 (expo-keep-awake) sets
// UIApplication.isIdleTimerDisabled. Two Apple forum threads (698318, 740654)
// say a Mac ignores that for an iPad app. ProcessInfo's activity with
// .idleDisplaySleepDisabled is public API on iOS 7.0+, and on a Mac it is the
// call macOS apps make to hold the display on. Whether it takes effect for an
// iPad app on a Mac is checked on a Mac (record:
// docs/implementations/2026-11-15-v152-mac.md).
//
// On an iPhone or iPad this module does nothing: isiOSAppOnMac is false there,
// so 1.5.1's idle-timer path is the only one.
//
// The closures hop to the main queue and call @MainActor methods, the pattern
// expo-status-bar's StatusBarModule uses with the same Swift 5.9 setting.
public final class MacDisplayAwakeModule: Module {
  // Read and written on the main actor only.
  private var wanted = false
  private var inForeground = true
  private var activity: NSObjectProtocol?

  public func definition() -> ModuleDefinition {
    Name("MacDisplayAwake")

    // A session wants the display on.
    Function("hold") {
      DispatchQueue.main.async {
        self.setWanted(true)
      }
    }

    // No session wants it any more.
    Function("release") {
      DispatchQueue.main.async {
        self.setWanted(false)
      }
    }

    OnAppEntersForeground {
      DispatchQueue.main.async {
        self.setInForeground(true)
      }
    }

    OnAppEntersBackground {
      DispatchQueue.main.async {
        self.setInForeground(false)
      }
    }

    OnDestroy {
      DispatchQueue.main.async {
        self.setWanted(false)
      }
    }
  }

  @MainActor
  private func setWanted(_ value: Bool) {
    wanted = value
    apply()
  }

  @MainActor
  private func setInForeground(_ value: Bool) {
    inForeground = value
    apply()
  }

  // Holds one activity while a session wants the display, the app is in the
  // foreground, and it runs on a Mac; ends it otherwise.
  @MainActor
  private func apply() {
    let shouldHold = wanted && inForeground && ProcessInfo.processInfo.isiOSAppOnMac
    if shouldHold && activity == nil {
      activity = ProcessInfo.processInfo.beginActivity(
        options: [.userInitiated, .idleDisplaySleepDisabled],
        reason: "A Valentine Pomodoro session is running"
      )
    } else if !shouldHold, let held = activity {
      ProcessInfo.processInfo.endActivity(held)
      activity = nil
    }
  }
}
