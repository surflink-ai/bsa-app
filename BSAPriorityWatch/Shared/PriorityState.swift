import Foundation

// MARK: - Priority State Model
// Shared between iOS companion and watchOS app

struct PriorityState: Codable, Equatable {
    var phase: String // "establishing" or "established"
    var myPosition: Int // 0 = no priority, 1 = P1, etc.
    var myPriorityStatus: String // "active", "suspended", "none"
    var myJersey: String?
    var myWaveCount: Int
    var myTotalScore: Double
    var myNeedsScore: Double?
    var myResultPosition: Int?
    var myPenalty: String?
    var myIsDisqualified: Bool
    var priorityOrder: [PriorityEntry]
    var ridersCount: Int
    var ridersNeeded: Int
    var athleteCount: Int
    
    enum CodingKeys: String, CodingKey {
        case phase
        case myPosition = "my_position"
        case myPriorityStatus = "my_priority_status"
        case myJersey = "my_jersey"
        case myWaveCount = "my_wave_count"
        case myTotalScore = "my_total_score"
        case myNeedsScore = "my_needs_score"
        case myResultPosition = "my_result_position"
        case myPenalty = "my_penalty"
        case myIsDisqualified = "my_is_disqualified"
        case priorityOrder = "priority_order"
        case ridersCount = "riders_count"
        case ridersNeeded = "riders_needed"
        case athleteCount = "athlete_count"
    }
    
    static let empty = PriorityState(
        phase: "establishing", myPosition: 0, myPriorityStatus: "none",
        myJersey: nil, myWaveCount: 0, myTotalScore: 0, myNeedsScore: nil,
        myResultPosition: nil, myPenalty: nil, myIsDisqualified: false,
        priorityOrder: [], ridersCount: 0, ridersNeeded: 3, athleteCount: 4
    )
}

struct PriorityEntry: Codable, Equatable, Identifiable {
    var position: Int
    var athleteId: String
    var athleteName: String
    var jerseyColor: String?
    var priorityStatus: String
    var isMe: Bool
    
    var id: String { athleteId }
    
    enum CodingKeys: String, CodingKey {
        case position
        case athleteId = "athlete_id"
        case athleteName = "athlete_name"
        case jerseyColor = "jersey_color"
        case priorityStatus = "priority_status"
        case isMe = "is_me"
    }
}

struct TimerState: Codable, Equatable {
    var remainingSeconds: Int
    var remainingFormatted: String
    var durationMinutes: Int
    var isPaused: Bool
    var status: String
    var warning: Bool // 30 sec
    var low: Bool // under 5 min
    
    enum CodingKeys: String, CodingKey {
        case remainingSeconds = "remaining_seconds"
        case remainingFormatted = "remaining_formatted"
        case durationMinutes = "duration_minutes"
        case isPaused = "is_paused"
        case status, warning, low
    }
    
    static let empty = TimerState(
        remainingSeconds: 0, remainingFormatted: "0:00",
        durationMinutes: 20, isPaused: false, status: "pending",
        warning: false, low: false
    )
}

struct InterferenceAlert: Codable {
    var athleteId: String
    var waveNumber: Int
    var penaltyType: String
    var isMe: Bool
    var message: String
    
    enum CodingKeys: String, CodingKey {
        case athleteId = "athlete_id"
        case waveNumber = "wave_number"
        case penaltyType = "penalty_type"
        case isMe = "is_me"
        case message
    }
}

struct HeatStatus: Codable {
    var status: String
    var heatNumber: Int?
    var certified: Bool?
    var priorityEstablished: Bool?
    var message: String?
    
    enum CodingKeys: String, CodingKey {
        case status
        case heatNumber = "heat_number"
        case certified
        case priorityEstablished = "priority_established"
        case message
    }
}

struct HapticTrigger: Codable {
    var pattern: String // "priority_gained", "priority_changed", "interference", "heat_ending"
    var message: String?
}

// MARK: - WebSocket Message Envelope

struct RelayMessage: Codable {
    var type: String
    var data: AnyCodable
}

// Simple AnyCodable wrapper for JSON decoding
struct AnyCodable: Codable {
    let value: Any
    
    init(_ value: Any) { self.value = value }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let dict = try? container.decode([String: AnyCodable].self) {
            value = dict.mapValues { $0.value }
        } else if let arr = try? container.decode([AnyCodable].self) {
            value = arr.map { $0.value }
        } else if let str = try? container.decode(String.self) {
            value = str
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let dbl = try? container.decode(Double.self) {
            value = dbl
        } else if let bool = try? container.decode(Bool.self) {
            value = bool
        } else {
            value = NSNull()
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        if let str = value as? String { try container.encode(str) }
        else if let int = value as? Int { try container.encode(int) }
        else if let dbl = value as? Double { try container.encode(dbl) }
        else if let bool = value as? Bool { try container.encode(bool) }
        else { try container.encodeNil() }
    }
}

// MARK: - Jersey Colors

struct JerseyColors {
    static let colors: [String: (r: Double, g: Double, b: Double)] = [
        "red": (0.86, 0.15, 0.15),
        "blue": (0.15, 0.39, 0.92),
        "white": (0.89, 0.91, 0.94),
        "yellow": (0.92, 0.70, 0.03),
        "green": (0.09, 0.64, 0.20),
        "black": (0.12, 0.16, 0.24),
        "pink": (0.93, 0.28, 0.60),
        "orange": (0.92, 0.35, 0.03),
    ]
}
