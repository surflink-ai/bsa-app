import Foundation
import WatchKit

// MARK: - WebSocket Connection to BSA Relay Server

@Observable
class RelayConnection {
    var isConnected = false
    var priority = PriorityState.empty
    var timer = TimerState.empty
    var heatStatus: HeatStatus?
    var interferenceAlert: InterferenceAlert?
    var lastHapticPattern: String?
    
    private var webSocket: URLSessionWebSocketTask?
    private var session: URLSession?
    private var relayURL: String = ""
    private var heatId: String = ""
    private var athleteId: String = ""
    private var previousPosition: Int = 0
    
    // MARK: - Connect
    
    func connect(relayURL: String, heatId: String, athleteId: String) {
        self.relayURL = relayURL
        self.heatId = heatId
        self.athleteId = athleteId
        
        let urlString = "\(relayURL)/?heat_id=\(heatId)&athlete_id=\(athleteId)"
        guard let url = URL(string: urlString) else {
            print("[WS] Invalid URL: \(urlString)")
            return
        }
        
        session = URLSession(configuration: .default)
        webSocket = session?.webSocketTask(with: url)
        webSocket?.resume()
        isConnected = true
        
        print("[WS] Connecting to \(urlString)")
        receiveMessage()
    }
    
    func disconnect() {
        webSocket?.cancel(with: .goingAway, reason: nil)
        webSocket = nil
        isConnected = false
    }
    
    // MARK: - Receive
    
    private func receiveMessage() {
        webSocket?.receive { [weak self] result in
            switch result {
            case .success(let message):
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
                }
                // Attempt reconnect after 3 seconds
                DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                    if let self = self, !self.relayURL.isEmpty {
                        self.connect(relayURL: self.relayURL, heatId: self.heatId, athleteId: self.athleteId)
                    }
                }
            }
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
