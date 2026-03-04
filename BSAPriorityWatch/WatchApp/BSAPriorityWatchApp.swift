import SwiftUI

// BSA Priority Watch — Apple Watch Ultra
// Connects DIRECTLY to relay server over WiFi. No iPhone needed.
// Watch pre-joins beach WiFi before entering water.

@main
struct BSAPriorityWatchApp: App {
    @State private var relay = RelayConnection()
    @State private var relayURL = UserDefaults.standard.string(forKey: "relayURL") ?? "ws://192.168.1.1:8080"
    @State private var heatId = ""
    @State private var athleteId = ""
    @State private var isConnected = false
    
    var body: some Scene {
        WindowGroup {
            if isConnected && relay.isConnected {
                PriorityView(relay: relay)
                    .toolbar {
                        ToolbarItem(placement: .topBarLeading) {
                            Button(action: {
                                relay.disconnect()
                                isConnected = false
                            }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.white.opacity(0.3))
                                    .font(.system(size: 12))
                            }
                        }
                    }
            } else {
                ConnectView(
                    relayURL: $relayURL,
                    heatId: $heatId,
                    athleteId: $athleteId,
                    connectionState: relay.connectionState,
                    onConnect: {
                        // Save relay URL for next time
                        UserDefaults.standard.set(relayURL, forKey: "relayURL")
                        relay.connect(relayURL: relayURL, heatId: heatId, athleteId: athleteId)
                        isConnected = true
                    }
                )
            }
        }
    }
}
