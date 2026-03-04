import SwiftUI

// BSA Priority Watch — Apple Watch Ultra
// Connects DIRECTLY to Supabase Realtime over internet (Starlink + UniFi AP).
// No relay server. No iPhone. Just WiFi.

@main
struct BSAPriorityWatchApp: App {
    @State private var relay = RelayConnection()
    @State private var heatId = ""
    @State private var athleteId = ""
    @State private var isConnected = false
    
    var body: some Scene {
        WindowGroup {
            if isConnected {
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
                    heatId: $heatId,
                    athleteId: $athleteId,
                    connectionState: relay.connectionState,
                    onConnect: {
                        relay.connect(heatId: heatId, athleteId: athleteId)
                        isConnected = true
                    }
                )
            }
        }
    }
}
