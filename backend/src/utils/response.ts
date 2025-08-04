import type { Response } from "express";
import type { ApiResponse, PaginatedResponse } from "../types/api";

export const successResponse = <T>(res: Response, data: T, message?: string): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  res.json(response);
};

export const errorResponse = (res: Response, error: string, statusCode = 400): void => {
  const response: ApiResponse = {
    success: false,
    error,
  };

  res.status(statusCode).json(response);
};

export const paginatedResponse = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
): void => {
  const response: ApiResponse<PaginatedResponse<T>> = {
    success: true,
    data: {
      items: data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    },
  };

  res.json(response);
};
