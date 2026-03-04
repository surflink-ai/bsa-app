import SwiftUI

@main
struct BSAPriorityWatchApp: App {
    @State private var relay = RelayConnection()
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
                    connectionState: relay.connectionState,
                    onConnect: { heatId, athleteId in
                        relay.connect(heatId: heatId, athleteId: athleteId)
                        isConnected = true
                    }
                )
            }
        }
    }
}
