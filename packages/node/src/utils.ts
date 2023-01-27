export const makeProtocol = (name: string, version: number) => {
  if (name.includes("/")) {
    throw "func name cannot include /";
  }
  return `/${name}/${version}`;
};
