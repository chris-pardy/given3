import type { UserService } from "./user-service/service.mjs";

const actionToRoles: Record<string, string[]> = {
    "createUser": ["admin"],
    "updateUser": ["admin"],
    "deleteUser": ["admin"],
    "viewUser": ["admin", "user"],
}

export function createAccessCheck(userService: UserService) {
    return async (userId: string, action: string) => {
        const user = await userService.getById(userId);
        const roles = actionToRoles[action];
        if (!roles) {
            throw new Error(`Invalid action: ${action}`);
        }
        if (!roles.some(role => user.roles.includes(role))) {
            throw new Error(`User ${userId} does not have access to ${action}`);
        }
        return true;
    }
}   