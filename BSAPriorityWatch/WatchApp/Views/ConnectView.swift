import SwiftUI

// MARK: - Connect View — Just heat + athlete ID
// No relay URL needed — connects directly to Supabase over internet

struct ConnectView: View {
    @Binding var heatId: String
    @Binding var athleteId: String
    var connectionState: RelayConnection.ConnectionState
    var onConnect: () -> Void
    
    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                // BSA Logo
                Text("BSA")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(Color(red: 0.17, green: 0.65, blue: 0.63))
                
                Text("PRIORITY")
                    .font(.system(size: 9, weight: .medium, design: .monospaced))
                    .foregroundColor(.white.opacity(0.3))
                    .tracking(3)
                
                Divider()
                    .background(Color.white.opacity(0.1))
                    .padding(.vertical, 2)
                
                // Heat ID
                VStack(alignment: .leading, spacing: 4) {
                    Text("HEAT")
                        .font(.system(size: 7, weight: .bold, design: .monospaced))
                        .foregroundColor(.white.opacity(0.3))
                        .tracking(1)
                    
                    TextField("Heat ID", text: $heatId)
                        .font(.system(size: 12, design: .monospaced))
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                }
                
                // Athlete ID
                VStack(alignment: .leading, spacing: 4) {
                    Text("YOU")
                        .font(.system(size: 7, weight: .bold, design: .monospaced))
                        .foregroundColor(.white.opacity(0.3))
                        .tracking(1)
                    
                    TextField("Your ID", text: $athleteId)
                        .font(.system(size: 12, design: .monospaced))
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                }
                
                // Connect button
                Button(action: onConnect) {
                    HStack(spacing: 6) {
                        if connectionState == .connecting || connectionState == .reconnecting {
                            ProgressView()
                                .tint(.white)
                                .scaleEffect(0.7)
                        }
                        Text(connectionState == .connecting ? "Connecting..." : "Go")
                            .font(.system(size: 16, weight: .bold))
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color(red: 0.17, green: 0.65, blue: 0.63))
                    )
                }
                .disabled(heatId.isEmpty || athleteId.isEmpty)
                .opacity(heatId.isEmpty || athleteId.isEmpty ? 0.4 : 1)
                
                // Info
                HStack(spacing: 4) {
                    Image(systemName: "wifi")
                        .font(.system(size: 9))
                    Text("Connects via WiFi · No phone needed")
                        .font(.system(size: 8))
                }
                .foregroundColor(.white.opacity(0.15))
            }
            .padding(.horizontal, 10)
        }
        .background(Color.black)
    }
}
