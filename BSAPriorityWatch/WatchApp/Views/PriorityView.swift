import SwiftUI
import WatchKit

// MARK: - Priority View — Main watch face during a heat
// Designed for Apple Watch Ultra 49mm (410 × 502 logical points)

struct PriorityView: View {
    var relay: RelayConnection
    
    var body: some View {
        ZStack {
            // Background
            Color.black.ignoresSafeArea()
            
            // Interference alert overlay
            if let alert = relay.interferenceAlert, alert.isMe {
                interferenceOverlay(alert)
            } else {
                // Normal state
                mainDisplay
            }
        }
    }
    
    // MARK: - Main Display
    
    @ViewBuilder
    private var mainDisplay: some View {
        let phase = relay.priority.phase
        let status = relay.heatStatus?.status ?? "pending"
        
        if status == "complete" || status == "certified" {
            heatCompleteView
        } else if phase == "establishing" {
            establishingView
        } else {
            establishedView
        }
    }
    
    // MARK: - Established Priority View
    
    private var establishedView: some View {
        let p = relay.priority
        let pos = p.myPosition
        let isP1 = pos == 1
        
        return VStack(spacing: 0) {
            // Jersey stripe
            jerseyBar
            
            Spacer().frame(height: 8)
            
            // Position — HUGE
            Text("P\(pos)")
                .font(.system(size: 72, weight: .black, design: .rounded))
                .foregroundColor(positionColor(pos))
                .shadow(color: positionColor(pos).opacity(0.3), radius: 8)
            
            // Status word
            Text(isP1 ? "YOUR WAVE" : "CHASING")
                .font(.system(size: 11, weight: .bold, design: .monospaced))
                .foregroundColor(isP1 ? Color(red: 1, green: 0.84, blue: 0) : .white.opacity(0.3))
                .tracking(3)
            
            Spacer().frame(height: 12)
            
            // Score
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(String(format: "%.2f", p.myTotalScore))
                    .font(.system(size: 28, weight: .bold, design: .monospaced))
                    .foregroundColor(.white)
                
                if let needs = p.myNeedsScore, needs > 0 {
                    Text("need \(String(format: "%.2f", needs))")
                        .font(.system(size: 10, weight: .medium, design: .monospaced))
                        .foregroundColor(.white.opacity(0.25))
                }
            }
            
            // Wave dots
            HStack(spacing: 3) {
                ForEach(0..<max(p.myWaveCount, 0), id: \.self) { _ in
                    Circle()
                        .fill(Color.white.opacity(0.2))
                        .frame(width: 4, height: 4)
                }
            }
            .padding(.top, 4)
            
            Spacer()
            
            // Timer
            timerDisplay
        }
        .padding(.horizontal, 8)
    }
    
    // MARK: - Establishing Phase
    
    private var establishingView: some View {
        let p = relay.priority
        let progress = p.ridersNeeded > 0 ? Double(p.ridersCount) / Double(p.ridersNeeded) : 0
        
        return VStack(spacing: 0) {
            jerseyBar
            
            Spacer().frame(height: 16)
            
            // Progress ring
            ZStack {
                Circle()
                    .stroke(Color.white.opacity(0.06), lineWidth: 4)
                    .frame(width: 80, height: 80)
                
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(
                        Color(red: 0.17, green: 0.65, blue: 0.63),
                        style: StrokeStyle(lineWidth: 4, lineCap: .round)
                    )
                    .frame(width: 80, height: 80)
                    .rotationEffect(.degrees(-90))
                    .animation(.easeInOut(duration: 0.5), value: progress)
                
                VStack(spacing: 2) {
                    Text("\(p.ridersCount)/\(p.ridersNeeded)")
                        .font(.system(size: 20, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                    Text("riders")
                        .font(.system(size: 8, weight: .medium, design: .monospaced))
                        .foregroundColor(.white.opacity(0.2))
                }
            }
            
            Text("ESTABLISHING")
                .font(.system(size: 9, weight: .bold, design: .monospaced))
                .foregroundColor(.white.opacity(0.15))
                .tracking(3)
                .padding(.top, 8)
            
            Spacer()
            
            timerDisplay
        }
        .padding(.horizontal, 8)
    }
    
    // MARK: - Heat Complete
    
    private var heatCompleteView: some View {
        let p = relay.priority
        let pos = p.myResultPosition ?? 0
        let ordinal = pos == 1 ? "1ST" : pos == 2 ? "2ND" : pos == 3 ? "3RD" : "\(pos)TH"
        
        return VStack(spacing: 8) {
            jerseyBar
            
            Spacer()
            
            Text(ordinal)
                .font(.system(size: 48, weight: .black, design: .rounded))
                .foregroundColor(pos <= 2 ? Color(red: 0.17, green: 0.65, blue: 0.63) : .white.opacity(0.5))
            
            Text(String(format: "%.2f", p.myTotalScore))
                .font(.system(size: 22, weight: .bold, design: .monospaced))
                .foregroundColor(.white.opacity(0.7))
            
            Text("HEAT OVER")
                .font(.system(size: 9, weight: .bold, design: .monospaced))
                .foregroundColor(.white.opacity(0.15))
                .tracking(3)
            
            Spacer()
        }
        .padding(.horizontal, 8)
    }
    
    // MARK: - Interference Overlay
    
    private func interferenceOverlay(_ alert: InterferenceAlert) -> some View {
        ZStack {
            Color.red.opacity(0.15)
                .ignoresSafeArea()
            
            VStack(spacing: 12) {
                Spacer()
                
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 36))
                    .foregroundColor(.red)
                
                Text("INTERFERENCE")
                    .font(.system(size: 16, weight: .black, design: .monospaced))
                    .foregroundColor(.red)
                    .tracking(2)
                
                Text(alert.message)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.white.opacity(0.5))
                    .multilineTextAlignment(.center)
                
                Spacer()
                
                timerDisplay
            }
            .padding(.horizontal, 8)
        }
    }
    
    // MARK: - Shared Components
    
    private var jerseyBar: some View {
        let color = jerseySwiftColor(relay.priority.myJersey)
        return Rectangle()
            .fill(color)
            .frame(height: 4)
            .cornerRadius(2)
            .padding(.horizontal, 20)
            .padding(.top, 4)
    }
    
    private var timerDisplay: some View {
        let t = relay.timer
        return VStack(spacing: 0) {
            Text(t.remainingFormatted)
                .font(.system(size: 24, weight: .bold, design: .monospaced))
                .foregroundColor(t.warning ? .red : t.low ? .yellow : .white.opacity(0.6))
                .padding(.bottom, 8)
        }
    }
    
    // MARK: - Helpers
    
    private func positionColor(_ pos: Int) -> Color {
        switch pos {
        case 1: return Color(red: 1, green: 0.84, blue: 0)       // Gold
        case 2: return Color(red: 0.75, green: 0.75, blue: 0.78)  // Silver
        case 3: return Color(red: 0.80, green: 0.50, blue: 0.20)  // Bronze
        default: return Color.white.opacity(0.3)
        }
    }
    
    private func jerseySwiftColor(_ jersey: String?) -> Color {
        switch jersey?.lowercased() {
        case "red":    return Color(red: 0.86, green: 0.15, blue: 0.15)
        case "blue":   return Color(red: 0.15, green: 0.39, blue: 0.92)
        case "white":  return Color(red: 0.89, green: 0.91, blue: 0.94)
        case "yellow": return Color(red: 0.92, green: 0.70, blue: 0.03)
        case "green":  return Color(red: 0.09, green: 0.64, blue: 0.20)
        case "black":  return Color(red: 0.12, green: 0.16, blue: 0.24)
        case "pink":   return Color(red: 0.93, green: 0.30, blue: 0.60)
        case "orange": return Color(red: 0.92, green: 0.35, blue: 0.03)
        default:       return Color.gray
        }
    }
}
