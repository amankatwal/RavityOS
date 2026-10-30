import { fromZonedTime, toZonedTime } from "date-fns-tz";

export function calculateNextDailyRun({
time,
timezone,
after = new Date(),
}: {
time: string;
timezone: string;
after?: Date;
}) {
const [hour, minute] = time.split(":").map(Number);
const localAfter = toZonedTime(after, timezone);
const localCandidate = new Date(localAfter);

localCandidate.setHours(hour, minute, 0, 0);

let candidateUtc = fromZonedTime(localCandidate, timezone);

if (candidateUtc <= after) {
localCandidate.setDate(localCandidate.getDate() + 1);
candidateUtc = fromZonedTime(localCandidate, timezone);
}

return candidateUtc;
}
