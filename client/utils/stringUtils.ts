export function formatName(name: string) {
  const namesArr = name.split(" ")
  const firstName = namesArr[0]
  const lastName = namesArr[1]

  return `${firstName[0]}. ${lastName}`
}