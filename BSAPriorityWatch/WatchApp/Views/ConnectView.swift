import SwiftUI

// MARK: - Connect View — Browse active heats, tap your name
// Light mode, jersey colors only — matches iPad judge UI

struct ConnectView: View {
    var connectionState: RelayConnection.ConnectionState
    var onConnect: (String, String) -> Void  // (heatId, athleteId)

    @State private var heats: [LiveHeat] = []
    @State private var selectedHeat: LiveHeat?
    @State private var isLoading = true
    @State private var errorMsg: String?

    private let supabaseURL = "https://veggfcumdveuoumrblcn.supabase.co"
    private let supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZ2dmY3VtZHZldW91bXJibGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjM5MTUsImV4cCI6MjA4NzY5OTkxNX0.jIpiFFheiqkbKUEaHuQPN01fSYEE3U1Fygj3nfoxyao"

    // Theme
    private let bgGradient = LinearGradient(
        colors: [
            Color(red: 0.89, green: 0.91, blue: 0.94),
            Color(red: 0.93, green: 0.95, blue: 0.96),
            Color(red: 0.90, green: 0.92, blue: 0.94)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    private let textPrimary = Color(red: 0.06, green: 0.09, blue: 0.16)
    private let textSecondary = Color(red: 0.06, green: 0.09, blue: 0.16).opacity(0.55)
    private let textMuted = Color(red: 0.06, green: 0.09, blue: 0.16).opacity(0.25)
    private let cardBg = Color.white.opacity(0.55)
    private let cardBorder = Color.black.opacity(0.08)

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    VStack(spacing: 10) {
                        ProgressView().tint(textSecondary)
                        Text("Finding heats...")
                            .font(.system(size: 12))
                            .foregroundColor(textMuted)
                    }
                } else if let heat = selectedHeat {
                    athleteListView(heat: heat)
                } else if heats.isEmpty {
                    VStack(spacing: 10) {
                        Image(systemName: "wave.3.right")
                            .font(.system(size: 28))
                            .foregroundColor(textMuted)
                        Text("No active heats")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(textSecondary)
                        Button("Refresh") { Task { await fetchHeats() } }
                            .font(.system(size: 13))
                            .foregroundColor(textPrimary)
                    }
                } else {
                    heatListView
                }
            }
            .background(bgGradient.ignoresSafeArea())
            .task { await fetchHeats() }
        }
    }

    // MARK: - Heat List

    private var heatListView: some View {
        ScrollView {
            VStack(spacing: 6) {
                Text("BSA")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(textPrimary)

                Text("SELECT HEAT")
                    .font(.system(size: 8, weight: .medium, design: .monospaced))
                    .foregroundColor(textMuted)
                    .tracking(2)
                    .padding(.bottom, 4)

                ForEach(heats) { heat in
                    Button(action: { selectedHeat = heat }) {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Heat \(heat.heatNumber)")
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundColor(textPrimary)
                                Text("\(heat.athleteCount) surfers")
                                    .font(.system(size: 10))
                                    .foregroundColor(textSecondary)
                            }
                            Spacer()
                            Circle()
                                .fill(Color(red: 0.09, green: 0.64, blue: 0.20))
                                .frame(width: 8, height: 8)
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .background(
                            RoundedRectangle(cornerRadius: 10)
                                .fill(cardBg)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(cardBorder, lineWidth: 1)
                                )
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 8)
        }
    }

    // MARK: - Athlete List

    private func athleteListView(heat: LiveHeat) -> some View {
        ScrollView {
            VStack(spacing: 6) {
                HStack {
                    Button(action: { selectedHeat = nil }) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(textPrimary)
                    }
                    .buttonStyle(.plain)

                    Spacer()

                    Text("HEAT \(heat.heatNumber)")
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .foregroundColor(textSecondary)
                        .tracking(1)

                    Spacer()

                    Image(systemName: "chevron.left")
                        .font(.system(size: 11))
                        .opacity(0)
                }
                .padding(.horizontal, 4)

                Text("TAP YOUR NAME")
                    .font(.system(size: 7, weight: .medium, design: .monospaced))
                    .foregroundColor(textMuted)
                    .tracking(2)
                    .padding(.bottom, 2)

                ForEach(heat.athletes) { athlete in
                    Button(action: {
                        onConnect(heat.id, athlete.id)
                    }) {
                        HStack(spacing: 8) {
                            // Jersey color swatch
                            RoundedRectangle(cornerRadius: 4)
                                .fill(jerseyColor(athlete.jersey))
                                .frame(width: 14, height: 14)

                            Text(athlete.name)
                                .font(.system(size: 14, weight: .medium))
                                .foregroundColor(textPrimary)
                                .lineLimit(1)

                            Spacer()

                            Text(athlete.jersey.uppercased())
                                .font(.system(size: 8, weight: .bold, design: .monospaced))
                                .foregroundColor(textMuted)
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .background(
                            RoundedRectangle(cornerRadius: 10)
                                .fill(cardBg)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(cardBorder, lineWidth: 1)
                                )
                        )
                    }
                    .buttonStyle(.plain)
                }

                if connectionState == .connecting {
                    HStack(spacing: 6) {
                        ProgressView().tint(textSecondary).scaleEffect(0.6)
                        Text("Connecting...")
                            .font(.system(size: 11))
                            .foregroundColor(textMuted)
                    }
                    .padding(.top, 6)
                }
            }
            .padding(.horizontal, 8)
        }
    }

    // MARK: - Jersey Color

    private func jerseyColor(_ jersey: String) -> Color {
        switch jersey.lowercased() {
        case "red":    return Color(red: 0.86, green: 0.15, blue: 0.15)
        case "blue":   return Color(red: 0.15, green: 0.39, blue: 0.92)
        case "white":  return Color(red: 0.80, green: 0.84, blue: 0.88)
        case "yellow": return Color(red: 0.92, green: 0.70, blue: 0.03)
        case "green":  return Color(red: 0.09, green: 0.64, blue: 0.20)
        case "black":  return Color(red: 0.12, green: 0.16, blue: 0.24)
        case "pink":   return Color(red: 0.93, green: 0.30, blue: 0.60)
        case "orange": return Color(red: 0.92, green: 0.35, blue: 0.03)
        default:       return Color.gray
        }
    }

    // MARK: - Fetch Heats

    private func fetchHeats() async {
        isLoading = true
        errorMsg = nil

        guard let url = URL(string: "\(supabaseURL)/rest/v1/comp_heats?status=in.(live,upcoming)&select=id,heat_number,status,duration_minutes&order=heat_number") else { return }

        var req = URLRequest(url: url)
        req.setValue(supabaseKey, forHTTPHeaderField: "apikey")
        req.setValue("Bearer \(supabaseKey)", forHTTPHeaderField: "Authorization")

        do {
            let (data, _) = try await URLSession.shared.data(for: req)
            guard let rows = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
                isLoading = false
                return
            }

            var result: [LiveHeat] = []
            for row in rows {
                guard let id = row["id"] as? String,
                      let num = row["heat_number"] as? Int else { continue }

                let athletes = await fetchAthletes(heatId: id)
                result.append(LiveHeat(id: id, heatNumber: num, athleteCount: athletes.count, athletes: athletes))
            }

            heats = result

            if result.count == 1 {
                selectedHeat = result[0]
            }
        } catch {
            errorMsg = error.localizedDescription
        }

        isLoading = false
    }

    private func fetchAthletes(heatId: String) async -> [HeatAthlete] {
        guard let url = URL(string: "\(supabaseURL)/rest/v1/comp_heat_athletes?heat_id=eq.\(heatId)&select=id,athlete_name,jersey_color,seed_position&order=seed_position") else { return [] }

        var req = URLRequest(url: url)
        req.setValue(supabaseKey, forHTTPHeaderField: "apikey")
        req.setValue("Bearer \(supabaseKey)", forHTTPHeaderField: "Authorization")

        do {
            let (data, _) = try await URLSession.shared.data(for: req)
            guard let rows = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else { return [] }

            return rows.compactMap { row in
                guard let id = row["id"] as? String,
                      let name = row["athlete_name"] as? String else { return nil }
                let jersey = row["jersey_color"] as? String ?? "white"
                return HeatAthlete(id: id, name: name, jersey: jersey)
            }
        } catch {
            return []
        }
    }
}

// MARK: - Models

struct LiveHeat: Identifiable {
    let id: String
    let heatNumber: Int
    let athleteCount: Int
    let athletes: [HeatAthlete]
}

struct HeatAthlete: Identifiable {
    let id: String
    let name: String
    let jersey: String
}
