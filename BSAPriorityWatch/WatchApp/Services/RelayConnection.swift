import Foundation
import WatchKit

// MARK: - Direct WebSocket Connection to BSA Relay Server
// 
// Apple Watch Ultra connects DIRECTLY to the relay server over WiFi.
// No iPhone needed. Watch pre-joins beach WiFi before the heat.
//
// Architecture:
//   Supabase Realtime → Relay Server (Mac mini on beach WiFi) ← WiFi → Watch Ultra
//
// watchOS supports URLSessionWebSocketTask natively.
// Apple Watch Ultra: independent WiFi + 100m water resistance.
// Fallback: LTE cellular on Apple Watch Ultra (cellular model).

@Observable
class RelayConnection {
    var isConnected = false
    var connectionState: ConnectionState = .disconnected
    var priority = PriorityState.empty
    var timer = TimerState.empty
    var heatStatus: HeatStatus?
    var interferenceAlert: InterferenceAlert?
    var lastHapticPattern: String?
    var reconnectCount = 0
    
    enum ConnectionState: String {
        case disconnected = "Disconnected"
        case connecting = "Connecting..."
        case connected = "Connected"
        case reconnecting = "Reconnecting..."
    }
    
    private var webSocket: URLSessionWebSocketTask?
    private var session: URLSession?
    private var relayURL: String = ""
    private var heatId: String = ""
    private var athleteId: String = ""
    private var previousPosition: Int = 0
    private var shouldReconnect = true
    private let maxReconnectAttempts = 50 // Keep trying for a long time (ocean session)
    private let reconnectBaseDelay: TimeInterval = 2.0
    
    // MARK: - Connect (Direct from Watch — no iPhone needed)
    
    func connect(relayURL: String, heatId: String, athleteId: String) {
        self.relayURL = relayURL
        self.heatId = heatId
        self.athleteId = athleteId
        self.shouldReconnect = true
        self.reconnectCount = 0
        
        performConnect()
    }
    
    private func performConnect() {
        let urlString = "\(relayURL)/?heat_id=\(heatId)&athlete_id=\(athleteId)"
        guard let url = URL(string: urlString) else {
            print("[WS] Invalid URL: \(urlString)")
            return
        }
        
        // Configure session for watch — low power, keep-alive
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 300
        config.waitsForConnectivity = true // Wait for WiFi to come back
        
        session = URLSession(configuration: config)
        webSocket = session?.webSocketTask(with: url)
        webSocket?.resume()
        
        connectionState = .connecting
        print("[WS] Connecting to \(urlString) (attempt \(reconnectCount + 1))")
        
        receiveMessage()
        
        // Send periodic pings to keep connection alive
        schedulePing()
    }
    
    func disconnect() {
        shouldReconnect = false
        webSocket?.cancel(with: .goingAway, reason: nil)
        webSocket = nil
        isConnected = false
        connectionState = .disconnected
    }
    
    // Keep-alive ping every 15 seconds (important for WiFi in ocean environment)
    private func schedulePing() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 15) { [weak self] in
            guard let self = self, self.isConnected else { return }
            self.webSocket?.sendPing { error in
                if let error = error {
                    print("[WS] Ping failed: \(error.localizedDescription)")
                }
            }
            self.schedulePing()
        }
    }
    
    // MARK: - Receive
    
    private func receiveMessage() {
        webSocket?.receive { [weak self] result in
            switch result {
            case .success(let message):
                DispatchQueue.main.async {
                    self?.isConnected = true
                    self?.connectionState = .connected
                    self?.reconnectCount = 0 // Reset on successful receive
                }
                
                switch message {
                case .string(let text):
                    self?.handleMessage(text)
                case .data(let data):
                    if let text = String(data: data, encoding: .utf8) {
                        self?.handleMessage(text)
                    }
                @unknown default:
                    break
                }
                // Continue receiving
                self?.receiveMessage()
                
            case .failure(let error):
                print("[WS] Receive error: \(error.localizedDescription)")
                DispatchQueue.main.async {
                    self?.isConnected = false
                    self?.connectionState = .reconnecting
                }
                self?.attemptReconnect()
            }
        }
    }
    
    // MARK: - Reconnect with exponential backoff
    // Critical: surfer may temporarily lose WiFi in the ocean
    // Keep trying — they'll come back in range
    
    private func attemptReconnect() {
        guard shouldReconnect, reconnectCount < maxReconnectAttempts else {
            print("[WS] Max reconnect attempts reached or stopped")
            DispatchQueue.main.async {
                self.connectionState = .disconnected
            }
            return
        }
        
        reconnectCount += 1
        // Exponential backoff: 2s, 4s, 8s, max 30s
        let delay = min(reconnectBaseDelay * pow(2, Double(min(reconnectCount - 1, 4))), 30.0)
        
        print("[WS] Reconnecting in \(delay)s (attempt \(reconnectCount)/\(maxReconnectAttempts))")
        
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
            guard let self = self, self.shouldReconnect else { return }
            self.webSocket?.cancel(with: .goingAway, reason: nil)
            self.performConnect()
        }
    }
    
    // MARK: - Message Handler
    
    private func handleMessage(_ text: String) {
        guard let data = text.data(using: .utf8) else { return }
        
        // Parse the envelope to get the type
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String,
              let payloadData = json["data"] else { return }
        
        let payloadJson = try? JSONSerialization.data(withJSONObject: payloadData)
        
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            
            switch type {
            case "priority":
                if let pj = payloadJson, let state = try? JSONDecoder().decode(PriorityState.self, from: pj) {
                    let oldPosition = self.priority.myPosition
                    self.priority = state
                    
                    // Haptic feedback on priority change
                    if state.myPosition != oldPosition && oldPosition != 0 {
                        if state.myPosition == 1 {
                            // Gained P1! Strong buzz
                            self.playHaptic(.notification, type: .success)
                            self.playHaptic(.notification, type: .success) // double for emphasis
                        } else if state.myPosition < oldPosition {
                            // Moved up
                            self.playHaptic(.notification, type: .success)
                        } else {
                            // Moved down
                            self.playHaptic(.click)
                        }
                    }
                }
                
            case "timer":
                if let pj = payloadJson, let state = try? JSONDecoder().decode(TimerState.self, from: pj) {
                    self.timer = state
                    
                    // 30 second warning haptic
                    if state.warning && state.remainingSeconds == 30 {
                        self.playHaptic(.notification, type: .warning)
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                            self.playHaptic(.notification, type: .warning)
                        }
                    }
                }
                
            case "interference":
                if let pj = payloadJson, let alert = try? JSONDecoder().decode(InterferenceAlert.self, from: pj) {
                    self.interferenceAlert = alert
                    
                    if alert.isMe {
                        // Double strong buzz for interference on me
                        self.playHaptic(.notification, type: .failure)
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                            self.playHaptic(.notification, type: .failure)
                        }
                    }
                    
                    // Clear alert after 5 seconds
                    DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
                        self.interferenceAlert = nil
                    }
                }
                
            case "heat_status":
                if let pj = payloadJson, let status = try? JSONDecoder().decode(HeatStatus.self, from: pj) {
                    self.heatStatus = status
                    
                    if status.status == "complete" {
                        // Long buzz for heat end
                        self.playHaptic(.notification, type: .warning)
                    }
                }
                
            case "haptic":
                if let pj = payloadJson, let trigger = try? JSONDecoder().decode(HapticTrigger.self, from: pj) {
                    self.lastHapticPattern = trigger.pattern
                    self.playHaptic(.notification, type: .warning)
                }
                
            default:
                print("[WS] Unknown message type: \(type)")
            }
        }
    }
    
    // MARK: - Haptics
    
    private func playHaptic(_ type: WKHapticType, type notificationType: WKInterfaceDevice.NotificationType? = nil) {
        #if os(watchOS)
        if let nt = notificationType {
            WKInterfaceDevice.current().play(type)
        } else {
            WKInterfaceDevice.current().play(type)
        }
        #endif
    }
    
    private func playHaptic(_ type: WKHapticType) {
        #if os(watchOS)
        WKInterfaceDevice.current().play(type)
        #endif
    }
}
