import type { User } from "../user-service/user.mjs";
import type { UserService } from "../user-service/service.mjs";
import { Factory } from "fishery";
import { faker } from "@faker-js/faker";
import { describe, it, expect } from "vitest";
import { given } from "@given3/vitest";
import { createAccessCheck } from "../access-control.mjs";

// Factory for creating users
class UserFactory extends Factory<User> {
  admin() {
    return this.params({
      roles: ["admin"],
    });
  }

  withPhoneNumber() {
    return this.params({
      phone: faker.phone.number(),
    });
  }

  withAddress() {
    return this.params({
      city: faker.location.city(),
      state: faker.location.state(),
      zip: faker.location.zipCode(),
    });
  }
}

describe("the access control system", () => {
  const userService = given<UserService>("userservice");
  const accessCheck = given("accesscheck", () =>
    createAccessCheck(userService.value),
  );
  const resource = given(() => "viewUser");

  const userFactory = given(() =>
    UserFactory.define(({ sequence }) => ({
      id: sequence.toString(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      roles: ["user"],
    })),
  );

  const user = given(() => userFactory.value.build());

  const accessCheckResult = given(() =>
    accessCheck.value(user.value.id, resource.value),
  );

  describe("given a known user", () => {
    userService.define(() => ({
      getById: async (id: string) => {
        if (id === user.value.id) {
          return user.value;
        }
        throw new Error("User not found");
      },
      getByEmail: async (email: string) => {
        if (email === user.value.email) {
          return user.value;
        }
        throw new Error("User not found");
      },
      create: async () => {
        throw new Error("User not found");
      },
      update: async () => {
        throw new Error("User not found");
      },
      delete: async () => {
        throw new Error("User not found");
      },
    }));

    it("should allow access to viewUser", () => {
      resource.define(() => "viewUser");
      expect(accessCheckResult.value).resolves.toBe(true);
    });

    it.each(["createUser", "updateUser", "deleteUser"])(
      "should not allow access to %s",
      (resourceName) => {
        resource.define(() => resourceName);
        expect(accessCheckResult.value).rejects.toThrow();
      },
    );

    describe("given an admin user", () => {
      userFactory.define(() => userFactory.value.admin());

      it.each(["createUser", "updateUser", "deleteUser", "viewUser"])(
        "should allow access to %s",
        (resourceName) => {
          resource.define(() => resourceName);
          console.log(user.value);
          expect(accessCheckResult.value).resolves.toBe(true);
        },
      );
    });
  });
});
