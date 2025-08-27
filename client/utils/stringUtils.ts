export function formatName(name: string) {
  const namesArr = name.split(" ");
  const firstName = namesArr[0];
  const lastName = namesArr[1] + " " + (namesArr.length > 2 ? namesArr.slice(2).join(" ") : "");

  return {
    firstName,
    lastName,
  };
}
