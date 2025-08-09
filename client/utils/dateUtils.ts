import { format, formatDistanceToNow } from "date-fns";

/** 
 * Returns a human readable string indicating how long ago the date was
 */
export function timeAgo(date: Date | string): string {
  const parsedDate =
    typeof date === "string"
      ? new Date(date.replace(" ", "T").replace(/(\+\d{2})$/, "$1:00"))
      : date;
  return formatDistanceToNow(parsedDate, { addSuffix: true })
}

/** 
 * Returns a date formatted as mm/dd/yyyy
 */
export function formatDate(date: Date | string): string {
  const parsedDate =
    typeof date === "string"
      ? new Date(date.replace(" ", "T").replace(/(\+\d{2})$/, "$1:00"))
      : date;
  return format(parsedDate, "MM/dd/yyyy")
}