import { readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { User } from "./user.mjs";

export interface UserService {
  getById(id: string): Promise<User>;
  getByEmail(email: string): Promise<User>;
  create(user: Omit<User, "id">): Promise<User>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}

export function createUserService(dbFilePath: string): UserService {
  return {
    getById: async (id) => {
      const users = await readFile(dbFilePath, "utf8");
      return JSON.parse(users).find((user: User) => user.id === id);
    },
    getByEmail: async (email) => {
      const users = await readFile(dbFilePath, "utf8");
      return JSON.parse(users).find((user: User) => user.email === email);
    },
    create: async (user) => {
      const users = await readFile(dbFilePath, "utf8");
      const newUser = { ...user, id: randomUUID() };
      const updatedUsers = JSON.parse(users).concat(newUser);
      await writeFile(dbFilePath, JSON.stringify(updatedUsers, null, 2));
      return newUser;
    },
    update: async (user) => {
      const users = await readFile(dbFilePath, "utf8");
      const updatedUsers = JSON.parse(users).map((u: User) =>
        u.id === user.id ? user : u,
      );
      await writeFile(dbFilePath, JSON.stringify(updatedUsers, null, 2));
      return user;
    },
    delete: async (id) => {
      const users = await readFile(dbFilePath, "utf8");
      const updatedUsers = JSON.parse(users).filter((u: User) => u.id !== id);
      await writeFile(dbFilePath, JSON.stringify(updatedUsers, null, 2));
    },
  };
}
