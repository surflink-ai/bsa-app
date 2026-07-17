/**
 * Shared limits for WhatsApp blast sending. Kept small and explicit so a
 * mis-scoped audience (or a compromised admin session) cannot fan out to an
 * unbounded number of recipients and run up the Twilio bill.
 */
export const MAX_BLAST_RECIPIENTS = Number(process.env.MAX_BLAST_RECIPIENTS || 500)
