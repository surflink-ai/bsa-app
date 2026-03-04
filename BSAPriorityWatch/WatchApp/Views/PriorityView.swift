import SwiftUI

// MARK: - Main Watch Face — Priority Display

struct PriorityView: View {
    let relay: RelayConnection
    
    private var jerseyColor: Color {
        guard let jersey = relay.priority.myJersey,
              let rgb = JerseyColors.colors[jersey] else {
            return .gray
        }
        return Color(red: rgb.r, green: rgb.g, blue: rgb.b)
    }
    
    private var priorityColor: Color {
        switch relay.priority.myPosition {
        case 1: return .yellow // Gold
        case 2: return Color(red: 0.75, green: 0.75, blue: 0.75) // Silver
        case 3: return Color(red: 0.80, green: 0.50, blue: 0.20) // Bronze
        default: return Color.white.opacity(0.25)
        }
    }
    
    private var timerColor: Color {
        if relay.timer.warning { return .red }
        if relay.timer.low { return .yellow }
        return Color(red: 0.17, green: 0.65, blue: 0.63) // BSA teal
    }
    
    var body: some View {
        ZStack {
            // Background
            Color.black.ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Jersey stripe
                jerseyColor
                    .frame(height: 4)
                
                // Top bar: BSA + Heat info
                HStack {
                    Text("BSA")
                        .font(.system(size: 10, weight: .bold, design: .default))
                        .foregroundColor(Color(red: 0.17, green: 0.65, blue: 0.63))
                    
                    Spacer()
                    
                    if let hs = relay.heatStatus {
                        Text("H\(hs.heatNumber ?? 0)")
                            .font(.system(size: 8, weight: .medium, design: .monospaced))
                            .foregroundColor(.white.opacity(0.3))
                    }
                }
                .padding(.horizontal, 12)
                .padding(.top, 6)
                
                Spacer()
                
                // Priority section — the hero
                if relay.priority.phase == "establishing" {
                    establishingView
                } else {
                    establishedView
                }
                
                Spacer()
                
                // Bottom stats
                HStack {
                    // Timer
                    VStack(spacing: 1) {
                        Text(relay.timer.remainingFormatted)
                            .font(.system(size: 16, weight: .bold, design: .monospaced))
                            .foregroundColor(timerColor)
                        Text("TIME")
                            .font(.system(size: 6, weight: .medium, design: .monospaced))
                            .foregroundColor(.white.opacity(0.2))
                    }
                    
                    Spacer()
                    
                    // Wave count
                    VStack(spacing: 1) {
                        Text("\(relay.priority.myWaveCount)")
                            .font(.system(size: 16, weight: .bold, design: .monospaced))
                            .foregroundColor(.white)
                        Text("WAVES")
                            .font(.system(size: 6, weight: .medium, design: .monospaced))
                            .foregroundColor(.white.opacity(0.2))
                    }
                    
                    Spacer()
                    
                    // Total score
                    VStack(spacing: 1) {
                        Text(String(format: "%.2f", relay.priority.myTotalScore))
                            .font(.system(size: 16, weight: .bold, design: .monospaced))
                            .foregroundColor(
                                relay.priority.myResultPosition == 1
                                    ? Color(red: 0.17, green: 0.65, blue: 0.63)
                                    : .white.opacity(0.5)
                            )
                        Text("TOTAL")
                            .font(.system(size: 6, weight: .medium, design: .monospaced))
                            .foregroundColor(.white.opacity(0.2))
                    }
                }
                .padding(.horizontal, 12)
                .padding(.top, 4)
                .overlay(
                    Rectangle()
                        .fill(Color.white.opacity(0.06))
                        .frame(height: 1),
                    alignment: .top
                )
                .padding(.bottom, 8)
            }
            
            // Interference overlay
            if let alert = relay.interferenceAlert, alert.isMe {
                interferenceOverlay(alert: alert)
            }
        }
    }
    
    // MARK: - Established Priority View
    
    private var establishedView: some View {
        VStack(spacing: 2) {
            Text("PRIORITY")
                .font(.system(size: 8, weight: .medium, design: .monospaced))
                .foregroundColor(.white.opacity(0.25))
                .tracking(1.5)
            
            if relay.priority.myPosition > 0 {
                Text("P\(relay.priority.myPosition)")
                    .font(.system(size: 64, weight: .bold))
                    .foregroundColor(priorityColor)
                    .shadow(color: relay.priority.myPosition == 1 ? .yellow.opacity(0.3) : .clear, radius: 12)
                
                if relay.priority.myPosition == 1 {
                    Text("YOUR WAVE")
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                        .foregroundColor(.yellow)
                        .tracking(1)
                } else if let needs = relay.priority.myNeedsScore {
                    Text("need \(String(format: "%.2f", needs))")
                        .font(.system(size: 13, weight: .bold, design: .monospaced))
                        .foregroundColor(.white.opacity(0.5))
                }
            } else {
                Text("—")
                    .font(.system(size: 64, weight: .bold))
                    .foregroundColor(.white.opacity(0.15))
            }
            
            if relay.priority.myPriorityStatus == "suspended" {
                Text("SUSPENDED")
                    .font(.system(size: 8, weight: .bold, design: .monospaced))
                    .foregroundColor(.yellow.opacity(0.6))
                    .tracking(1)
            }
        }
    }
    
    // MARK: - Establishing Phase View
    
    private var establishingView: some View {
        VStack(spacing: 6) {
            Text("PRIORITY")
                .font(.system(size: 8, weight: .medium, design: .monospaced))
                .foregroundColor(.white.opacity(0.25))
                .tracking(1.5)
            
            Text("Establishing...")
                .font(.system(size: 11, weight: .medium, design: .monospaced))
                .foregroundColor(.white.opacity(0.3))
            
            // Dots showing riders progress
            HStack(spacing: 6) {
                ForEach(0..<relay.priority.ridersNeeded, id: \.self) { i in
                    Circle()
                        .fill(i < relay.priority.ridersCount
                              ? Color(red: 0.17, green: 0.65, blue: 0.63)
                              : Color.clear)
                        .frame(width: 10, height: 10)
                        .overlay(
                            Circle()
                                .stroke(
                                    i < relay.priority.ridersCount
                                        ? Color(red: 0.17, green: 0.65, blue: 0.63)
                                        : Color.white.opacity(0.15),
                                    lineWidth: 1.5
                                )
                        )
                }
            }
            
            Text("\(relay.priority.ridersCount) of \(relay.priority.ridersNeeded) riders")
                .font(.system(size: 8, weight: .medium, design: .monospaced))
                .foregroundColor(.white.opacity(0.2))
        }
    }
    
    // MARK: - Interference Overlay
    
    private func interferenceOverlay(alert: InterferenceAlert) -> some View {
        ZStack {
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.red.opacity(0.15))
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color.red.opacity(0.4), lineWidth: 2)
                )
            
            VStack(spacing: 4) {
                Text("🚩")
                    .font(.system(size: 28))
                
                Text("INTERFERENCE")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.red)
                    .tracking(0.8)
                
                Text(alert.penaltyType == "double_interference"
                     ? "DISQUALIFIED"
                     : "2nd best wave halved · P\(relay.priority.myPosition)")
                    .font(.system(size: 8, weight: .medium, design: .monospaced))
                    .foregroundColor(.red.opacity(0.6))
                    .multilineTextAlignment(.center)
            }
        }
        .ignoresSafeArea()
    }
}

// MARK: - Preview

#Preview {
    let relay = RelayConnection()
    PriorityView(relay: relay)
}
