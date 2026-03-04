import Foundation
import WatchKit

// MARK: - Direct Supabase Realtime Connection
//
// Apple Watch Ultra connects DIRECTLY to Supabase Realtime over the internet.
// No relay server needed. No iPhone needed.
//
// Architecture:
//   Supabase Realtime (wss://veggfcumdveuoumrblcn.supabase.co/realtime) ← internet → Watch Ultra
//
// Beach setup: Starlink + UniFi outdoor AP → Watch connects over WiFi to internet
// The watch subscribes to comp_heats + comp_heat_athletes changes via Supabase Realtime.
// Also polls /api/judge/priority for full state on connect.

@MainActor
@Observable
class RelayConnection {
    var isConnected = false
    var connectionState: ConnectionState = .disconnected
    var priority = PriorityState.empty
    var timer = TimerState.empty
    var heatStatus: HeatStatus?
    var interferenceAlert: InterferenceAlert?
    var reconnectCount = 0
    
    enum ConnectionState: String {
        case disconnected = "Disconnected"
        case connecting = "Connecting..."
        case connected = "Connected"
        case reconnecting = "Reconnecting..."
    }
    
    // Supabase config
    private let supabaseURL = "https://veggfcumdveuoumrblcn.supabase.co"
    private let supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZ2dmY3VtZHZldW91bXJibGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjM5MTUsImV4cCI6MjA4NzY5OTkxNX0.jIpiFFheiqkbKUEaHuQPN01fSYEE3U1Fygj3nfoxyao"
    private let bsaBaseURL = "https://bsa.surf"
    
    private var webSocket: URLSessionWebSocketTask?
    private var session: URLSession?
    private var heatId: String = ""
    private var athleteId: String = ""
    private var shouldReconnect = true
    private let maxReconnectAttempts = 50
    private var timerTask: Task<Void, Never>?
    private var pollTask: Task<Void, Never>?
    private var heatStartTime: Date?
    private var heatDurationMinutes: Int = 20
    
    // MARK: - Connect
    
    func connect(heatId: String, athleteId: String) {
        self.heatId = heatId
        self.athleteId = athleteId
        self.shouldReconnect = true
        self.reconnectCount = 0
        self.connectionState = .connecting
        
        // 1. Fetch initial state via REST
        Task { await fetchFullState() }
        
        // 2. Subscribe to Realtime changes
        connectRealtime()
        
        // 3. Start polling as backup (every 3s) — Realtime can be flaky on watch WiFi
        startPolling()
        
        // 4. Start local timer
        startTimer()
    }
    
    func disconnect() {
        shouldReconnect = false
        webSocket?.cancel(with: .goingAway, reason: nil)
        webSocket = nil
        timerTask?.cancel()
        pollTask?.cancel()
        isConnected = false
        connectionState = .disconnected
    }
    
    // MARK: - REST: Fetch Full State
    
    private func fetchFullState() async {
        // Fetch heat data
        guard let heatURL = URL(string: "\(supabaseURL)/rest/v1/comp_heats?id=eq.\(heatId)&select=id,status,heat_number,duration_minutes,actual_start,is_paused,priority_order,priority_established,priority_riders,certified") else { return }
        
        var heatReq = URLRequest(url: heatURL)
        heatReq.setValue(supabaseKey, forHTTPHeaderField: "apikey")
        heatReq.setValue("Bearer \(supabaseKey)", forHTTPHeaderField: "Authorization")
        
        // Fetch athletes
        guard let athURL = URL(string: "\(supabaseURL)/rest/v1/comp_heat_athletes?heat_id=eq.\(heatId)&select=id,athlete_name,jersey_color,wave_count,total_score,needs_score,has_priority,priority_status,priority_position,penalty,is_disqualified,result_position&order=seed_position") else { return }
        
        var athReq = URLRequest(url: athURL)
        athReq.setValue(supabaseKey, forHTTPHeaderField: "apikey")
        athReq.setValue("Bearer \(supabaseKey)", forHTTPHeaderField: "Authorization")
        
        do {
            let session = URLSession.shared
            let (heatData, _) = try await session.data(for: heatReq)
            let (athData, _) = try await session.data(for: athReq)
            
            guard let heats = try? JSONSerialization.jsonObject(with: heatData) as? [[String: Any]],
                  let heat = heats.first,
                  let athletes = try? JSONSerialization.jsonObject(with: athData) as? [[String: Any]] else { return }
            
            updateState(heat: heat, athletes: athletes)
            isConnected = true
            connectionState = .connected
        } catch {
            print("[REST] Fetch error: \(error.localizedDescription)")
        }
    }
    
    // MARK: - Update State from JSON
    
    private func updateState(heat: [String: Any], athletes: [[String: Any]]) {
        let oldPosition = priority.myPosition
        
        // Heat status
        let status = heat["status"] as? String ?? "pending"
        let established = heat["priority_established"] as? Bool ?? false
        let riders = heat["priority_riders"] as? [String] ?? []
        let priorityOrder = heat["priority_order"] as? [String] ?? []
        let heatNumber = heat["heat_number"] as? Int ?? 0
        let certified = heat["certified"] as? Bool ?? false
        let durationMin = heat["duration_minutes"] as? Int ?? 20
        let _ = heat["is_paused"] as? Bool ?? false
        
        heatDurationMinutes = durationMin
        if let startStr = heat["actual_start"] as? String {
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            heatStartTime = formatter.date(from: startStr)
        }
        
        // Find my athlete
        let me = athletes.first { ($0["id"] as? String) == athleteId }
        let myPos = priorityOrder.firstIndex(of: athleteId).map { $0 + 1 } ?? 0
        
        // Build priority order
        let order = priorityOrder.enumerated().map { (i, id) -> PriorityEntry in
            let a = athletes.first { ($0["id"] as? String) == id }
            return PriorityEntry(
                position: i + 1,
                athleteId: id,
                athleteName: a?["athlete_name"] as? String ?? "Unknown",
                jerseyColor: a?["jersey_color"] as? String,
                priorityStatus: a?["priority_status"] as? String ?? "none",
                isMe: id == athleteId
            )
        }
        
        priority = PriorityState(
            phase: established ? "established" : "establishing",
            myPosition: myPos,
            myPriorityStatus: me?["priority_status"] as? String ?? "none",
            myJersey: me?["jersey_color"] as? String,
            myWaveCount: me?["wave_count"] as? Int ?? 0,
            myTotalScore: me?["total_score"] as? Double ?? 0,
            myNeedsScore: me?["needs_score"] as? Double,
            myResultPosition: me?["result_position"] as? Int,
            myPenalty: me?["penalty"] as? String,
            myIsDisqualified: me?["is_disqualified"] as? Bool ?? false,
            priorityOrder: order,
            ridersCount: riders.count,
            ridersNeeded: max(athletes.count - 1, 1),
            athleteCount: athletes.count
        )
        
        heatStatus = HeatStatus(
            status: status,
            heatNumber: heatNumber,
            certified: certified,
            priorityEstablished: established,
            message: nil
        )
        
        // Haptics on priority change
        if myPos != oldPosition && oldPosition != 0 {
            if myPos == 1 {
                playHaptic(.success)
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { self.playHaptic(.success) }
            } else if myPos < oldPosition {
                playHaptic(.success)
            } else if myPos > oldPosition {
                playHaptic(.start) // click
            }
        }
        
        // Check for interference on me
        if let penalty = me?["penalty"] as? String, penalty != "none", penalty != priority.myPenalty {
            interferenceAlert = InterferenceAlert(
                athleteId: athleteId,
                waveNumber: 0,
                penaltyType: penalty,
                isMe: true,
                message: penalty == "double_interference" ? "DISQUALIFIED" : "2nd best wave halved"
            )
            playHaptic(.failure)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { self.playHaptic(.failure) }
            DispatchQueue.main.asyncAfter(deadline: .now() + 5) { self.interferenceAlert = nil }
        }
    }
    
    // MARK: - Supabase Realtime WebSocket
    
    private func connectRealtime() {
        // Supabase Realtime endpoint
        let realtimeURL = supabaseURL.replacingOccurrences(of: "https://", with: "wss://") + "/realtime/v1/websocket?apikey=\(supabaseKey)&vsn=1.0.0"
        
        guard let url = URL(string: realtimeURL) else { return }
        
        let config = URLSessionConfiguration.default
        config.waitsForConnectivity = true
        session = URLSession(configuration: config)
        webSocket = session?.webSocketTask(with: url)
        webSocket?.resume()
        
        // Join the channel for our heat's tables
        let joinHeat = """
        {"topic":"realtime:public:comp_heats:id=eq.\(heatId)","event":"phx_join","payload":{"config":{"postgres_changes":[{"event":"*","schema":"public","table":"comp_heats","filter":"id=eq.\(heatId)"}]}},"ref":"1"}
        """
        
        let joinAthletes = """
        {"topic":"realtime:public:comp_heat_athletes:heat_id=eq.\(heatId)","event":"phx_join","payload":{"config":{"postgres_changes":[{"event":"*","schema":"public","table":"comp_heat_athletes","filter":"heat_id=eq.\(heatId)"}]}},"ref":"2"}
        """
        
        webSocket?.send(.string(joinHeat)) { _ in }
        webSocket?.send(.string(joinAthletes)) { _ in }
        
        receiveRealtime()
        scheduleHeartbeat()
    }
    
    private func receiveRealtime() {
        Task {
            guard let webSocket = self.webSocket else { return }
            do {
                while !Task.isCancelled && shouldReconnect {
                    let msg = try await webSocket.receive()
                    if case .string(let text) = msg {
                        // Any change → refetch full state
                        if text.contains("postgres_changes") && text.contains("UPDATE") {
                            await fetchFullState()
                        }
                    }
                }
            } catch {
                print("[RT] Error: \(error.localizedDescription)")
                // Polling will keep us alive — Realtime is bonus
            }
        }
    }
    
    // Supabase Realtime requires heartbeat every 30s
    private func scheduleHeartbeat() {
        Task {
            while !Task.isCancelled && shouldReconnect {
                try? await Task.sleep(nanoseconds: 30_000_000_000) // 30 seconds
                guard shouldReconnect else { break }
                let hb = """
                {"topic":"phoenix","event":"heartbeat","payload":{},"ref":"hb"}
                """
                webSocket?.send(.string(hb)) { _ in }
            }
        }
    }
    
    // MARK: - Polling (backup — works even if Realtime drops)
    
    private func startPolling() {
        pollTask = Task {
            while shouldReconnect && !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 3_000_000_000) // 3 seconds
                await fetchFullState()
            }
        }
    }
    
    // MARK: - Local Timer (no network needed once heat starts)
    
    private func startTimer() {
        timerTask = Task {
            while shouldReconnect && !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 1_000_000_000) // 1 second
                updateTimer()
            }
        }
    }
    
    private func updateTimer() {
        guard let start = heatStartTime, heatStatus?.status == "live" else {
            timer = TimerState(remainingSeconds: heatDurationMinutes * 60, remainingFormatted: formatTime(heatDurationMinutes * 60), durationMinutes: heatDurationMinutes, isPaused: false, status: heatStatus?.status ?? "pending", warning: false, low: false)
            return
        }
        
        let elapsed = Int(Date().timeIntervalSince(start))
        let total = heatDurationMinutes * 60
        let remaining = max(0, total - elapsed)
        
        let oldWarning = timer.warning
        
        timer = TimerState(
            remainingSeconds: remaining,
            remainingFormatted: formatTime(remaining),
            durationMinutes: heatDurationMinutes,
            isPaused: false,
            status: "live",
            warning: remaining <= 30,
            low: remaining <= 300 && remaining > 30
        )
        
        // 30-second warning haptic
        if timer.warning && !oldWarning {
            playHaptic(.notification)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { self.playHaptic(.notification) }
        }
    }
    
    private func formatTime(_ totalSeconds: Int) -> String {
        let mins = totalSeconds / 60
        let secs = totalSeconds % 60
        return "\(mins):\(String(format: "%02d", secs))"
    }
    
    // MARK: - Haptics
    
    private func playHaptic(_ type: WKHapticType) {
        WKInterfaceDevice.current().play(type)
    }
}
