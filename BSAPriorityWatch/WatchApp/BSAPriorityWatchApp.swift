import SwiftUI

@main
struct BSAPriorityWatchApp: App {
    @State private var relay = RelayConnection()
    @State private var relayURL = "ws://192.168.1.1:8080"
    @State private var heatId = ""
    @State private var athleteId = ""
    @State private var isConnected = false
    
    var body: some Scene {
        WindowGroup {
            if isConnected {
                PriorityView(relay: relay)
                    .onDisappear {
                        relay.disconnect()
                    }
            } else {
                ConnectView(
                    relayURL: $relayURL,
                    heatId: $heatId,
                    athleteId: $athleteId,
                    onConnect: {
                        relay.connect(relayURL: relayURL, heatId: heatId, athleteId: athleteId)
                        isConnected = true
                    }
                )
            }
        }
    }
}
