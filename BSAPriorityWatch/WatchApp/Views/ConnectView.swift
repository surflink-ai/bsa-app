import SwiftUI

// MARK: - Connect View — Enter relay server + select heat

struct ConnectView: View {
    @Binding var relayURL: String
    @Binding var heatId: String
    @Binding var athleteId: String
    var onConnect: () -> Void
    
    @State private var showScanner = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // BSA Logo
                Text("BSA")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(Color(red: 0.17, green: 0.65, blue: 0.63))
                
                Text("PRIORITY WATCH")
                    .font(.system(size: 8, weight: .medium, design: .monospaced))
                    .foregroundColor(.white.opacity(0.3))
                    .tracking(2)
                
                Divider()
                    .background(Color.white.opacity(0.1))
                    .padding(.vertical, 4)
                
                // Relay URL
                VStack(alignment: .leading, spacing: 4) {
                    Text("RELAY SERVER")
                        .font(.system(size: 7, weight: .medium, design: .monospaced))
                        .foregroundColor(.white.opacity(0.3))
                        .tracking(1)
                    
                    TextField("ws://192.168.x.x:8080", text: $relayURL)
                        .font(.system(size: 12, design: .monospaced))
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
                        .font(.system(size: 12, design: .monospaced))
                        .textFieldStyle(.roundedBorder)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                }
                
                // Athlete ID
                VStack(alignment: .leading, spacing: 4) {
                    Text("ATHLETE ID")
                        .font(.system(size: 7, weight: .medium, design: .monospaced))
                        .foregroundColor(.white.opacity(0.3))
                        .tracking(1)
                    
                    TextField("Your athlete ID", text: $athleteId)
                        .font(.system(size: 12, design: .monospaced))
                        .textFieldStyle(.roundedBorder)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                }
                
                // Connect button
                Button(action: onConnect) {
                    Text("Connect")
                        .font(.system(size: 14, weight: .bold))
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
                
                Text("Or scan QR from head judge")
                    .font(.system(size: 9, weight: .medium))
                    .foregroundColor(.white.opacity(0.2))
            }
            .padding(.horizontal, 12)
        }
        .background(Color.black)
    }
}
