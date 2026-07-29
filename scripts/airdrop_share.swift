import AppKit
import Foundation

final class AirDropShareDelegate: NSObject, NSSharingServiceDelegate {
    func sharingService(_ sharingService: NSSharingService, didShareItems items: [Any]) {
        NSApp.terminate(nil)
    }

    func sharingService(_ sharingService: NSSharingService, didFailToShareItems items: [Any], error: Error) {
        FileHandle.standardError.write(Data("AirDrop failed: \(error.localizedDescription)\n".utf8))
        NSApp.terminate(nil)
    }
}

let requestedPaths = CommandLine.arguments.dropFirst().filter { $0 != "--check" }
guard !requestedPaths.isEmpty else {
    FileHandle.standardError.write(Data("Missing share paths\n".utf8))
    exit(2)
}

var shareURLs: [URL] = []
for path in requestedPaths {
    let url = URL(fileURLWithPath: path)
    guard FileManager.default.fileExists(atPath: url.path) else {
        FileHandle.standardError.write(Data("Share item not found: \(url.lastPathComponent)\n".utf8))
        exit(3)
    }
    shareURLs.append(url)
}

guard let service = NSSharingService(named: .sendViaAirDrop), service.canPerform(withItems: shareURLs) else {
    FileHandle.standardError.write(Data("AirDrop sharing service is unavailable\n".utf8))
    exit(4)
}

if CommandLine.arguments.contains("--check") {
    print("ready")
    exit(0)
}

let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let delegate = AirDropShareDelegate()
service.delegate = delegate
app.activate(ignoringOtherApps: true)
service.perform(withItems: shareURLs)

DispatchQueue.main.asyncAfter(deadline: .now() + 300) {
    NSApp.terminate(nil)
}
app.run()
