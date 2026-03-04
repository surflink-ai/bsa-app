import SwiftUI

// MARK: - Connect View — Direct WiFi connection (no iPhone needed)
// Watch connects directly to relay server over beach WiFi

struct ConnectView: View {
    @Binding var relayURL: String
    @Binding var heatId: String
    @Binding var athleteId: String
    var connectionState: RelayConnection.ConnectionState
    var onConnect: () -> Void
    
    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                // BSA Logo
                Text("BSA")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(Color(red: 0.17, green: 0.65, blue: 0.63))
                
                Text("PRIORITY WATCH")
                    .font(.system(size: 8, weight: .medium, design: .monospaced))
                    .foregroundColor(.white.opacity(0.3))
                    .tracking(2)
                
                // WiFi status indicator
                HStack(spacing: 4) {
                    Image(systemName: "wifi")
                        .font(.system(size: 10))
                        .foregroundColor(.white.opacity(0.3))
                    Text("Direct WiFi · No iPhone needed")
                        .font(.system(size: 8, weight: .medium))
                        .foregroundColor(.white.opacity(0.2))
                }
                .padding(.bottom, 4)
                
                Divider()
                    .background(Color.white.opacity(0.1))
                
                // Relay URL
                VStack(alignment: .leading, spacing: 4) {
                    Text("RELAY SERVER")
                        .font(.system(size: 7, weight: .medium, design: .monospaced))
                        .foregroundColor(.white.opacity(0.3))
                        .tracking(1)
                    
                    TextField("ws://192.168.x.x:8080", text: $relayURL)
                        .font(.system(size: 11, design: .monospaced))
                        .textFieldStyle(.roundedBorder)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                }
                
                // Heat ID
                VStack(alignment: .leading, spacing: 4) {
                    Text("HEAT ID")
                        .font(.system(size: 7, weight: .medium, design: .monospaced))
                        .foregroundColor(.white.opacity(0.3))
                        .tracking(1)
                    
                    TextField("Heat ID", text: $heatId)
                        .font(.system(size: 11, design: .monospaced))
                        .textFieldStyle(.roundedBorder)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                }
                
                // Athlete ID
                VStack(alignment: .leading, spacing: 4) {
                    Text("YOUR ID")
                        .font(.system(size: 7, weight: .medium, design: .monospaced))
                        .foregroundColor(.white.opacity(0.3))
                        .tracking(1)
                    
                    TextField("Athlete ID", text: $athleteId)
                        .font(.system(size: 11, design: .monospaced))
                        .textFieldStyle(.roundedBorder)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                }
                
                // Connect button
                Button(action: onConnect) {
                    HStack {
                        if connectionState == .connecting || connectionState == .reconnecting {
                            ProgressView()
                                .tint(.white)
                                .scaleEffect(0.7)
                        }
                        Text(connectionState == .connecting ? "Connecting..." : "Connect")
                            .font(.system(size: 14, weight: .bold))
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(
                        RoundedRectangle(cornerRadius: 10)
                            .fill(Color(red: 0.17, green: 0.65, blue: 0.63))
                    )
                }
                .disabled(relayURL.isEmpty || heatId.isEmpty || athleteId.isEmpty)
                .opacity(relayURL.isEmpty || heatId.isEmpty || athleteId.isEmpty ? 0.4 : 1)
                
                // Setup instructions
                VStack(spacing: 4) {
                    Text("Setup:")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundColor(.white.opacity(0.25))
                    Text("1. Join beach WiFi on this watch")
                        .font(.system(size: 8))
                        .foregroundColor(.white.opacity(0.15))
                    Text("2. Get your heat + ID from head judge")
                        .font(.system(size: 8))
                        .foregroundColor(.white.opacity(0.15))
                    Text("3. Tap Connect")
                        .font(.system(size: 8))
                        .foregroundColor(.white.opacity(0.15))
                }
                .padding(.top, 4)
            }
            .padding(.horizontal, 10)
        }
        .background(Color.black)
    }
}
