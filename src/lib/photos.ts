// Event photo gallery data
// Key = LiveHeats event ID, Value = array of photo objects
// To add photos: add the event ID and photo URLs here
// Future: move to Supabase or CMS

interface Photo {
  src: string
  alt?: string
  credit?: string
}

const eventPhotos: Record<string, Photo[]> = {
  // Example:
  // "abc123": [
  //   { src: "https://example.com/photo1.jpg", alt: "Finals action", credit: "John Doe Photography" },
  // ],
}

export function getEventPhotos(eventId: string): Photo[] {
  return eventPhotos[eventId] || []
}
