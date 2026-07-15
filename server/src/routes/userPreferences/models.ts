import type { UserPreferences } from '../../db/models.js';
import type { ErrorResponse } from '../../http/models.js';

export type UpdateUserPreferencesRequest = Partial<UserPreferences>;

export type GetUserPreferencesResponse = UserPreferences | ErrorResponse;
export type UpdateUserPreferencesResponse = UserPreferences | ErrorResponse;
