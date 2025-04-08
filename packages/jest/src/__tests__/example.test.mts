import { given } from "../index.mjs";

describe("example", () => {
  const name = given(() => "John");
  const age = given(() => 30);
  const user = given(() => ({ name: name.value, age: age.value }));

  it("should be able to access the user", () => {
    expect(user.value.name).toBe("John");
  });

  it("the user value should be cached", () => {
    const firstAccess = user.value;
    const secondAccess = user.value;
    expect(firstAccess).toBe(secondAccess);
  });

  it("if the name changes the user value should change", () => {
    name.define(() => "Jane");
    expect(user.value.name).toBe("Jane");
  });
});
