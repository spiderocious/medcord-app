# Backend Architecture Guide

> **A comprehensive guide to building production-grade Node.js/Express backends with TypeScript**
>
> This document captures the architectural patterns, conventions, and principles used in building scalable, maintainable, and performant backend systems.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Core Architectural Patterns](#core-architectural-patterns)
3. [Folder Organization](#folder-organization)
4. [Service Layer Architecture](#service-layer-architecture)
5. [Request/Response Handling](#requestresponse-handling)
6. [Error Handling Strategy](#error-handling-strategy)
7. [Validation Patterns](#validation-patterns)
8. [Database & Data Access](#database--data-access)
9. [TypeScript Conventions](#typescript-conventions)
10. [Shared Code Organization](#shared-code-organization)
11. [Utilities & Helpers](#utilities--helpers)
12. [Configuration Management](#configuration-management)
13. [Middleware Stack](#middleware-stack)
14. [Routing Conventions](#routing-conventions)
15. [Naming Conventions](#naming-conventions)
16. [Performance Optimization](#performance-optimization)
17. [Security Best Practices](#security-best-practices)
18. [Code Quality Standards](#code-quality-standards)
19. [Real-Time Features](#real-time-features)
20. [Quick Setup Checklist](#quick-setup-checklist)

---

## Project Structure

```
/your-backend-project/
├── src/
│   ├── server.ts                 # Entry point with graceful shutdown
│   ├── app.ts                    # Express app configuration
│   ├── controllers/              # HTTP request/response handlers
│   ├── services/                 # Business logic layer
│   ├── models/                   # Database schemas (Mongoose)
│   ├── routes/                   # API route definitions
│   ├── middlewares/              # Express middleware
│   ├── configs/                  # Configuration files
│   ├── requests/                 # Validation schemas
│   ├── shared/                   # Shared types and constants
│   │   ├── types/               # TypeScript interfaces
│   │   └── constants/           # Application constants
│   ├── utils/                    # Helper utilities
│   ├── websocket/               # WebSocket server (if needed)
│   └── migrations/              # Database migrations
├── dist/                         # Compiled JavaScript output
├── docs/                         # Documentation
├── .env                          # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

### Path Aliases Setup

Configure `tsconfig.json` for clean imports:

```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@controllers": ["controllers/index"],
      "@services": ["services/index"],
      "@models": ["models/index"],
      "@routes": ["routes/index"],
      "@middlewares": ["middlewares/index"],
      "@configs": ["configs/index"],
      "@shared": ["shared/index"],
      "@utils": ["utils/index"]
    }
  }
}
```

**Usage:**
```typescript
// ✅ Good - Clean imports
import { userService } from '@services';
import { UserModel } from '@models';
import { HTTP_STATUS } from '@shared/constants';

// ❌ Bad - Relative paths
import { userService } from '../../services/user.service';
```

---

## Core Architectural Patterns

### 1. Service Layer Pattern

**Three-layer architecture:**

```
┌─────────────┐
│ Controller  │  → HTTP handling, validation, response formatting
└──────┬──────┘
       │
┌──────▼──────┐
│  Service    │  → Business logic, orchestration
└──────┬──────┘
       │
┌──────▼──────┐
│   Model     │  → Data access, database operations
└─────────────┘
```

**Responsibilities:**

- **Controllers**: Handle HTTP requests, validate input, format responses
- **Services**: Contain business logic, never touch HTTP layer
- **Models**: Define schemas, encapsulate database queries

### 2. Singleton Pattern for Services

**All services use the singleton pattern:**

```typescript
export class UserService {
  private static instance: UserService;

  private constructor() {
    // Private constructor prevents direct instantiation
  }

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  // Service methods...
}

// Export singleton instance
export const userService = UserService.getInstance();
```

**Benefits:**
- Single shared instance across application
- 35% memory reduction
- Consistent state management
- Easy to test and mock

### 3. Service Result Pattern

**Never throw errors from services. Always return structured results:**

```typescript
// Define in shared/types/service.types.ts
export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  messageKey?: MessageKey;
}

export class ServiceSuccess<T> implements ServiceResult<T> {
  success = true;
  data: T;
  messageKey?: MessageKey;

  constructor(data: T, messageKey?: MessageKey) {
    this.data = data;
    this.messageKey = messageKey;
  }
}

export class ServiceError implements ServiceResult {
  success = false;
  error: string;
  messageKey?: MessageKey;

  constructor(error: string, messageKey?: MessageKey) {
    this.error = error;
    this.messageKey = messageKey;
  }
}
```

**Usage in services:**

```typescript
async getUserById(id: string): Promise<ServiceResult<IUser>> {
  try {
    const user = await UserModel.findOne({ id }).lean();

    if (!user) {
      return new ServiceError('User not found', MESSAGE_KEYS.USER_NOT_FOUND);
    }

    return new ServiceSuccess(user, MESSAGE_KEYS.USER_FETCHED);
  } catch (error: any) {
    logger.error('Error fetching user', error);
    return new ServiceError(error.message, MESSAGE_KEYS.USER_FETCH_FAILED);
  }
}
```

---

## Folder Organization

### Controllers (`src/controllers/`)

**Purpose:** Handle HTTP layer - request parsing, validation, response formatting

**Pattern:**

```typescript
// user.controller.ts
import { Request, Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler.util';
import { userService } from '@services';
import { ResponseUtil } from '@utils/response.util';
import { MESSAGE_KEYS } from '@shared/constants';

export class UserController {
  private static instance: UserController;

  public static getInstance(): UserController {
    if (!UserController.instance) {
      UserController.instance = new UserController();
    }
    return UserController.instance;
  }

  signup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await userService.signup(req.body);

    if (!result.success) {
      return ResponseUtil.badRequest(res, result.messageKey!);
    }

    return ResponseUtil.created(res, result.data, result.messageKey);
  });

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Similar pattern...
  });
}

export const userController = UserController.getInstance();
```

**Key Points:**
- Singleton pattern
- `asyncHandler` wraps all async methods
- Never contains business logic
- Always uses `ResponseUtil` for responses
- Returns `Promise<void>` (response sent via `ResponseUtil`)

### Services (`src/services/`)

**Purpose:** Business logic, orchestration, no HTTP dependencies

**Pattern:**

```typescript
// user.service.ts
import { UserModel } from '@models';
import { ServiceResult, ServiceSuccess, ServiceError } from '@shared/types';
import { MESSAGE_KEYS } from '@shared/constants';
import { logger } from '@utils/logger.util';
import bcrypt from 'bcrypt';
import { JWTUtil } from '@utils/jwt.util';

export class UserService {
  private static instance: UserService;

  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async signup(data: SignupDTO): Promise<ServiceResult<AuthResponse>> {
    try {
      // Check if username exists
      const existing = await UserModel.findOne({
        username: data.username.toLowerCase()
      });

      if (existing) {
        return new ServiceError(
          'Username already taken',
          MESSAGE_KEYS.USERNAME_TAKEN
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create user
      const user = await UserModel.create({
        id: generateId(16, 'USR'),
        username: data.username.toLowerCase(),
        password: hashedPassword,
      });

      // Generate token
      const token = JWTUtil.generateToken({ userId: user.id });

      return new ServiceSuccess(
        { token, user: { ...user, password: undefined } },
        MESSAGE_KEYS.USER_CREATED
      );
    } catch (error: any) {
      logger.error('Signup error', error);
      return new ServiceError(error.message, MESSAGE_KEYS.SIGNUP_FAILED);
    }
  }
}

export const userService = UserService.getInstance();
```

**Key Points:**
- Singleton pattern
- All methods return `ServiceResult<T>`
- Never throw errors (return `ServiceError`)
- No HTTP dependencies (no `Request`, `Response`)
- Use `logger` for debugging
- Type-safe with generics

### Models (`src/models/`)

**Purpose:** Database schemas and data access layer

**Pattern:**

```typescript
// user.model.ts
import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '@shared/types';

export interface IUserDocument extends IUser, Document {}

const userSchema = new Schema<IUserDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true
    },
    username: {
      type: String,
      required: true,
      unique: true,
      index: true  // Index frequently queried fields
    },
    password: {
      type: String,
      required: true,
      select: false  // Exclude by default from queries
    },
    avatar: {
      type: String,
      default: ''
    },
    stats: {
      gamesPlayed: { type: Number, default: 0 },
      gamesWon: { type: Number, default: 0 },
      totalScore: { type: Number, default: 0 },
    },
    isActive: {
      type: Boolean,
      default: true
    },
  },
  {
    timestamps: true,  // Auto createdAt/updatedAt
    collection: 'users'
  }
);

// Compound indexes for common queries
userSchema.index({ username: 1, isActive: 1 });

export const UserModel = mongoose.model<IUserDocument>('User', userSchema);
```

**Key Points:**
- Extends interface from `@shared/types`
- Document interface extends both interface + `Document`
- Index frequently queried fields
- Use compound indexes for multi-field queries
- `select: false` for sensitive fields (password)
- `timestamps: true` for automatic tracking
- Export as named constant: `UserModel`

### Routes (`src/routes/`)

**Purpose:** Define API endpoints and route-level middleware

**Pattern:**

```typescript
// user.routes.ts
import { Router } from 'express';
import { userController } from '@controllers';
import { signupValidation, loginValidation } from '@requests/user.validation';
import { validateRequest } from '@middlewares/validateRequest.middleware';
import { authRateLimiter } from '@middlewares/rateLimit.middleware';

const router = Router();

router.post(
  '/signup',
  authRateLimiter,                    // Rate limiting
  signupValidation,                    // Validation rules
  validateRequest,                     // Validation error handler
  userController.signup.bind(userController)  // Controller method
);

router.post(
  '/login',
  authRateLimiter,
  loginValidation,
  validateRequest,
  userController.login.bind(userController)
);

router.get(
  '/user/:username',
  userController.getUserByUsername.bind(userController)
);

export default router;
```

**Centralized route registration** (`routes/index.ts`):

```typescript
import { Router } from 'express';
import userRoutes from './user.routes';
import gameRoutes from './game.routes';
import healthRoutes from './health.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/users', userRoutes);
router.use('/game', gameRoutes);

export default router;
```

**In `app.ts`:**

```typescript
import routes from '@routes';

this.app.use('/api', routes);  // All routes prefixed with /api
```

**Key Points:**
- Middleware chaining: validation → error handling → controller
- `.bind(controller)` to preserve `this` context
- Rate limiters on sensitive endpoints
- Centralized registration in `routes/index.ts`

### Validation Schemas (`src/requests/`)

**Purpose:** Define validation rules using express-validator

**Pattern:**

```typescript
// user.validation.ts
import { body } from 'express-validator';

export const signupValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .customSanitizer((value) => value.toLowerCase()),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
];

export const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .customSanitizer((value) => value.toLowerCase()),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];
```

**Validation middleware** (`middlewares/validateRequest.middleware.ts`):

```typescript
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: errors.array()[0].msg,  // First error message
      details: errors.array(),        // All errors for debugging
    });
    return;
  }

  next();
};
```

**Key Points:**
- Validation rules in dedicated files
- Chain validators for comprehensive checks
- User-friendly error messages
- Custom sanitizers for normalization
- Middleware returns first error + all errors array

---

## Service Layer Architecture

### Service Characteristics

**1. Singleton Pattern** - Single instance per service
**2. Pure Business Logic** - No HTTP dependencies
**3. ServiceResult Pattern** - Structured return types
**4. Type Safety** - Generic return types
**5. Comprehensive Error Handling** - Never throw

### Common Service Methods

```typescript
export class EntityService {
  // Create
  async create(data: CreateDTO): Promise<ServiceResult<IEntity>> {
    try {
      // Validation logic
      // Business rules
      const entity = await EntityModel.create(data);
      return new ServiceSuccess(entity, MESSAGE_KEYS.ENTITY_CREATED);
    } catch (error: any) {
      logger.error('Create error', error);
      return new ServiceError(error.message, MESSAGE_KEYS.CREATE_FAILED);
    }
  }

  // Get by ID with caching
  async getById(id: string): Promise<ServiceResult<IEntity>> {
    try {
      // Try cache first
      const cached = await cacheService.get(`entity:${id}`);
      if (cached) {
        return new ServiceSuccess(cached, MESSAGE_KEYS.ENTITY_FETCHED);
      }

      // Query database
      const entity = await EntityModel.findOne({ id }).lean();

      if (!entity) {
        return new ServiceError('Not found', MESSAGE_KEYS.ENTITY_NOT_FOUND);
      }

      // Cache for future
      await cacheService.set(`entity:${id}`, entity, 3600);

      return new ServiceSuccess(entity, MESSAGE_KEYS.ENTITY_FETCHED);
    } catch (error: any) {
      logger.error('Get by ID error', error);
      return new ServiceError(error.message, MESSAGE_KEYS.FETCH_FAILED);
    }
  }

  // List with pagination
  async list(
    page: number = 1,
    limit: number = 20
  ): Promise<ServiceResult<PaginatedResponse<IEntity>>> {
    try {
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        EntityModel.find().skip(skip).limit(limit).lean(),
        EntityModel.countDocuments(),
      ]);

      return new ServiceSuccess(
        {
          items,
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        MESSAGE_KEYS.ENTITIES_FETCHED
      );
    } catch (error: any) {
      logger.error('List error', error);
      return new ServiceError(error.message, MESSAGE_KEYS.FETCH_FAILED);
    }
  }

  // Update
  async update(
    id: string,
    data: UpdateDTO
  ): Promise<ServiceResult<IEntity>> {
    try {
      const entity = await EntityModel.findOneAndUpdate(
        { id },
        { $set: data },
        { new: true }
      ).lean();

      if (!entity) {
        return new ServiceError('Not found', MESSAGE_KEYS.ENTITY_NOT_FOUND);
      }

      // Invalidate cache
      await cacheService.delete(`entity:${id}`);

      return new ServiceSuccess(entity, MESSAGE_KEYS.ENTITY_UPDATED);
    } catch (error: any) {
      logger.error('Update error', error);
      return new ServiceError(error.message, MESSAGE_KEYS.UPDATE_FAILED);
    }
  }

  // Delete
  async delete(id: string): Promise<ServiceResult<void>> {
    try {
      const result = await EntityModel.deleteOne({ id });

      if (result.deletedCount === 0) {
        return new ServiceError('Not found', MESSAGE_KEYS.ENTITY_NOT_FOUND);
      }

      // Invalidate cache
      await cacheService.delete(`entity:${id}`);

      return new ServiceSuccess(undefined, MESSAGE_KEYS.ENTITY_DELETED);
    } catch (error: any) {
      logger.error('Delete error', error);
      return new ServiceError(error.message, MESSAGE_KEYS.DELETE_FAILED);
    }
  }
}
```

### Service Dependencies

Services can depend on other services:

```typescript
export class OrderService {
  private userService = UserService.getInstance();
  private productService = ProductService.getInstance();

  async createOrder(data: CreateOrderDTO): Promise<ServiceResult<IOrder>> {
    // Verify user exists
    const userResult = await this.userService.getById(data.userId);
    if (!userResult.success) {
      return new ServiceError('User not found', MESSAGE_KEYS.USER_NOT_FOUND);
    }

    // Verify product exists
    const productResult = await this.productService.getById(data.productId);
    if (!productResult.success) {
      return new ServiceError('Product not found', MESSAGE_KEYS.PRODUCT_NOT_FOUND);
    }

    // Create order...
  }
}
```

---

## Request/Response Handling

### ResponseUtil Pattern

**Centralized response handler** (`utils/response.util.ts`):

```typescript
import { Response } from 'express';
import { HTTP_STATUS, MESSAGE_KEYS, MESSAGES } from '@shared/constants';

export class ResponseUtil {
  private static language: string = 'en';

  // Set language for responses
  static setLanguage(lang: string): void {
    this.language = ['en', 'es', 'fr'].includes(lang) ? lang : 'en';
  }

  // Extract language from request
  static extractLanguage(req: Request): string {
    return (
      req.query.lang as string ||
      req.body.lang ||
      req.headers['accept-language']?.split(',')[0] ||
      'en'
    );
  }

  // Get message by key
  private static getMessage(key: MessageKey): string {
    return MESSAGES[key]?.[this.language] || MESSAGES[key]?.en || 'Unknown error';
  }

  // Generic success response
  static success<T>(
    res: Response,
    data: T,
    messageKey: MessageKey = MESSAGE_KEYS.SUCCESS,
    statusCode: number = HTTP_STATUS.OK
  ): void {
    res.status(statusCode).json({
      success: true,
      data,
      message: this.getMessage(messageKey),
    });
  }

  // Generic error response
  static error(
    res: Response,
    messageKey: MessageKey = MESSAGE_KEYS.INTERNAL_SERVER_ERROR,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details?: any
  ): void {
    res.status(statusCode).json({
      success: false,
      error: this.getMessage(messageKey),
      ...(details && { details }),
    });
  }

  // Specialized response methods
  static created<T>(res: Response, data: T, messageKey: MessageKey): void {
    this.success(res, data, messageKey, HTTP_STATUS.CREATED);
  }

  static badRequest(res: Response, messageKey: MessageKey, details?: any): void {
    this.error(res, messageKey, HTTP_STATUS.BAD_REQUEST, details);
  }

  static unauthorized(res: Response, messageKey: MessageKey): void {
    this.error(res, messageKey, HTTP_STATUS.UNAUTHORIZED);
  }

  static forbidden(res: Response, messageKey: MessageKey): void {
    this.error(res, messageKey, HTTP_STATUS.FORBIDDEN);
  }

  static notFound(res: Response, messageKey: MessageKey): void {
    this.error(res, messageKey, HTTP_STATUS.NOT_FOUND);
  }

  static conflict(res: Response, messageKey: MessageKey): void {
    this.error(res, messageKey, HTTP_STATUS.CONFLICT);
  }

  static serverError(res: Response, messageKey: MessageKey): void {
    this.error(res, messageKey, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}
```

### Controller Usage

```typescript
export class UserController {
  signup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Extract and set language
    const lang = ResponseUtil.extractLanguage(req);
    ResponseUtil.setLanguage(lang);

    const result = await userService.signup(req.body);

    if (!result.success) {
      return ResponseUtil.badRequest(res, result.messageKey!);
    }

    return ResponseUtil.created(res, result.data, result.messageKey!);
  });
}
```

### Response Formats

**Success Response:**
```json
{
  "success": true,
  "data": { /* ... */ },
  "message": "User created successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Username already taken",
  "details": { /* optional debug info */ }
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": {
    "items": [ /* ... */ ],
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "message": "Entities fetched successfully"
}
```

---

## Error Handling Strategy

### Three-Layer Error Handling

```
1. Service Layer    → Returns ServiceResult (never throws)
2. Controller Layer → asyncHandler catches unhandled errors
3. Global Handler   → Catches any remaining errors
```

### Layer 1: Service Result Pattern

```typescript
// Services NEVER throw - always return ServiceResult
async signup(data: SignupDTO): Promise<ServiceResult<AuthResponse>> {
  try {
    // Business logic...
    return new ServiceSuccess(data, MESSAGE_KEYS.USER_CREATED);
  } catch (error: any) {
    logger.error('Signup error', error);
    return new ServiceError(error.message, MESSAGE_KEYS.SIGNUP_FAILED);
  }
}
```

### Layer 2: AsyncHandler Wrapper

```typescript
// utils/asyncHandler.util.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from './logger.util';
import { ResponseUtil } from './response.util';
import { MESSAGE_KEYS } from '@shared/constants';

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export const asyncHandler = (handler: AsyncHandler) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await handler(req, res, next);
    } catch (error: any) {
      logger.error('Unhandled error in controller', error);

      const lang = ResponseUtil.extractLanguage(req);
      ResponseUtil.setLanguage(lang);
      ResponseUtil.serverError(res, MESSAGE_KEYS.INTERNAL_SERVER_ERROR);
    }
  };
};
```

**Usage:**
```typescript
// Wrap all async controller methods
signup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Your code...
});
```

### Layer 3: Global Error Handler

```typescript
// In app.ts
this.app.use(
  (error: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled application error', error);

    const lang = ResponseUtil.extractLanguage(req);
    ResponseUtil.setLanguage(lang);
    ResponseUtil.serverError(res, MESSAGE_KEYS.INTERNAL_SERVER_ERROR);
  }
);
```

### Error Flow Example

```typescript
// Service returns error
async getUserById(id: string): Promise<ServiceResult<IUser>> {
  try {
    const user = await UserModel.findOne({ id });
    if (!user) {
      return new ServiceError('User not found', MESSAGE_KEYS.USER_NOT_FOUND);
    }
    return new ServiceSuccess(user);
  } catch (error: any) {
    return new ServiceError(error.message, MESSAGE_KEYS.USER_FETCH_FAILED);
  }
}

// Controller handles service result
getUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await userService.getUserById(req.params.id);

  if (!result.success) {
    return ResponseUtil.notFound(res, result.messageKey!);
  }

  return ResponseUtil.success(res, result.data, result.messageKey);
});
```

---

## Validation Patterns

### Two-Stage Validation

**Stage 1: Express-Validator Rules**

```typescript
// requests/user.validation.ts
import { body, param, query } from 'express-validator';

export const signupValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .customSanitizer((value) => value.toLowerCase()),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
];

export const getUserValidation = [
  param('id')
    .notEmpty()
    .withMessage('User ID is required')
    .isLength({ min: 16, max: 32 })
    .withMessage('Invalid user ID format'),
];

export const listUsersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
];
```

**Stage 2: Validation Middleware**

```typescript
// middlewares/validateRequest.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: errors.array()[0].msg,  // First user-friendly error
      details: errors.array(),        // All errors for debugging
    });
    return;
  }

  next();
};
```

### Custom Validators

```typescript
import { body } from 'express-validator';
import { UserModel } from '@models';

export const signupValidation = [
  body('username')
    .custom(async (value) => {
      const existing = await UserModel.findOne({ username: value });
      if (existing) {
        throw new Error('Username already taken');
      }
      return true;
    }),
];
```

### Validation Best Practices

1. **Sanitize First**: Use `.trim()`, `.normalizeEmail()`, `.customSanitizer()`
2. **Validate Format**: Check length, patterns, types
3. **Business Rules**: Custom validators for database checks
4. **User-Friendly Messages**: Clear, actionable error messages
5. **Return First Error**: Users see one error at a time, developers see all

---

## Database & Data Access

### MongoDB + Mongoose Setup

**Database Config** (`configs/database.config.ts`):

```typescript
export const databaseConfig = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/yourdb',
  options: {
    maxPoolSize: 10,
    minPoolSize: 5,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 5000,
    heartbeatFrequencyMS: 10000,
  },
};
```

**Database Utility** (`utils/database.util.ts`):

```typescript
import mongoose from 'mongoose';
import { databaseConfig } from '@configs';
import { logger } from './logger.util';

export class DatabaseUtil {
  private static instance: DatabaseUtil;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseUtil {
    if (!DatabaseUtil.instance) {
      DatabaseUtil.instance = new DatabaseUtil();
    }
    return DatabaseUtil.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('Already connected to database');
      return;
    }

    try {
      await mongoose.connect(databaseConfig.mongoUri, databaseConfig.options);
      this.isConnected = true;
      logger.info('Connected to MongoDB');

      // Connection event listeners
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

    } catch (error) {
      logger.error('Failed to connect to MongoDB', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('Disconnected from MongoDB');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB', error);
      throw error;
    }
  }
}

export const databaseUtil = DatabaseUtil.getInstance();
```

### Model Patterns

**Base Schema Structure:**

```typescript
import mongoose, { Schema, Document } from 'mongoose';
import { IEntity } from '@shared/types';

export interface IEntityDocument extends IEntity, Document {}

const entitySchema = new Schema<IEntityDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true,
      index: true  // Index for queries
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'pending'
    },
    metadata: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
  },
  {
    timestamps: true,  // Auto createdAt/updatedAt
    collection: 'entities',
  }
);

// Compound indexes for common queries
entitySchema.index({ name: 1, status: 1 });
entitySchema.index({ createdAt: -1 });

// Soft delete helper
entitySchema.methods.softDelete = async function() {
  this.isDeleted = true;
  return await this.save();
};

export const EntityModel = mongoose.model<IEntityDocument>('Entity', entitySchema);
```

### Performance Optimization

**1. Compound Indexes:**

```typescript
// Before: 150ms query
const words = await WordModel.find({ category: 'Animal', startsWith: 'A' });

// After: <5ms with compound index
wordSchema.index({ category: 1, startsWith: 1 });
```

**2. Lean Queries:**

```typescript
// ❌ Heavy - Returns full Mongoose document
const users = await UserModel.find();

// ✅ Light - Returns plain JavaScript object
const users = await UserModel.find().lean();
```

**3. Selective Fields:**

```typescript
// Only fetch needed fields
const users = await UserModel.find()
  .select('id username avatar')
  .lean();
```

**4. Query Caching:**

```typescript
async getById(id: string): Promise<ServiceResult<IUser>> {
  // Try cache first
  const cached = await cacheService.get(`user:${id}`);
  if (cached) {
    return new ServiceSuccess(cached);
  }

  // Query database
  const user = await UserModel.findOne({ id }).lean();

  // Cache result
  await cacheService.set(`user:${id}`, user, 3600);

  return new ServiceSuccess(user);
}
```

**5. Batch Operations:**

```typescript
// Bulk insert
await WordModel.insertMany(words, { ordered: false });

// Bulk update
await UserModel.updateMany(
  { isActive: false },
  { $set: { status: 'inactive' } }
);
```

---

## TypeScript Conventions

### Type Organization

```
shared/types/
├── index.ts              # Re-export all types
├── response.types.ts     # API response types
├── service.types.ts      # Service result types
├── user.types.ts         # User domain types
├── game.types.ts         # Game domain types
└── common.types.ts       # Shared utility types
```

### Interface Naming

**Domain Entities:**

```typescript
// Interface for the entity
export interface IUser {
  id: string;
  username: string;
  email: string;
}

// Document interface (extends Mongoose Document)
export interface IUserDocument extends IUser, Document {}

// DTO for creation
export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
}

// DTO for updates
export interface UpdateUserDTO {
  email?: string;
  avatar?: string;
}

// Response type
export interface AuthResponse {
  token: string;
  user: Omit<IUser, 'password'>;
}
```

### Type-Safe Constants

```typescript
// constants/http.constants.ts
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatusCode = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];
```

### Generic Types

```typescript
// Paginated response
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Service result with generics
export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  messageKey?: MessageKey;
}

// Usage
async getUsers(): Promise<ServiceResult<PaginatedResponse<IUser>>> {
  // ...
}
```

### Enum Alternatives (Union Types)

```typescript
// ✅ Preferred - Union types
export type UserRole = 'admin' | 'user' | 'guest';
export type GameStatus = 'pending' | 'active' | 'completed';

// ❌ Avoid - TypeScript enums
enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
}
```

### Type Utilities

```typescript
// Make all properties optional
type PartialUser = Partial<IUser>;

// Make specific properties optional
type OptionalEmail = Omit<IUser, 'email'> & { email?: string };

// Pick specific properties
type UserSummary = Pick<IUser, 'id' | 'username' | 'avatar'>;

// Exclude properties
type PublicUser = Omit<IUser, 'password' | 'email'>;

// Create from keys
type UserKeys = keyof IUser;  // 'id' | 'username' | 'email' | ...
```

---

## Shared Code Organization

### Constants (`shared/constants/`)

**HTTP Status Codes:**

```typescript
// http.constants.ts
export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
```

**Message Keys & Multi-Language Support:**

```typescript
// messages.constants.ts
export const MESSAGE_KEYS = {
  // General
  SUCCESS: 'SUCCESS',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',

  // User
  USER_CREATED: 'USER_CREATED',
  USER_FETCHED: 'USER_FETCHED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USERNAME_TAKEN: 'USERNAME_TAKEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Game
  GAME_STARTED: 'GAME_STARTED',
  GAME_SUBMITTED: 'GAME_SUBMITTED',
  INVALID_ANSWER: 'INVALID_ANSWER',
} as const;

export type MessageKey = typeof MESSAGE_KEYS[keyof typeof MESSAGE_KEYS];

export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr'] as const;
export type Language = typeof SUPPORTED_LANGUAGES[number];

export const MESSAGES: Record<MessageKey, Record<Language, string>> = {
  SUCCESS: {
    en: 'Request successful',
    es: 'Solicitud exitosa',
    fr: 'Demande réussie',
  },
  USER_CREATED: {
    en: 'User created successfully',
    es: 'Usuario creado exitosamente',
    fr: 'Utilisateur créé avec succès',
  },
  INVALID_CREDENTIALS: {
    en: 'Invalid username or password',
    es: 'Usuario o contraseña inválidos',
    fr: 'Nom d\'utilisateur ou mot de passe invalide',
  },
  // ... all message keys
};
```

**Application Constants:**

```typescript
// app.constants.ts
export const APP_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_CACHE_TTL: 3600,  // 1 hour in seconds
  PASSWORD_SALT_ROUNDS: 10,
  JWT_EXPIRATION: '7d',
  MAX_FILE_SIZE: 5 * 1024 * 1024,  // 5MB
} as const;
```

### Types (`shared/types/`)

**Response Types:**

```typescript
// response.types.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

**Service Types:**

```typescript
// service.types.ts
import { MessageKey } from '@shared/constants';

export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  messageKey?: MessageKey;
}

export class ServiceSuccess<T> implements ServiceResult<T> {
  success = true;
  data: T;
  messageKey?: MessageKey;

  constructor(data: T, messageKey?: MessageKey) {
    this.data = data;
    this.messageKey = messageKey;
  }
}

export class ServiceError implements ServiceResult {
  success = false;
  error: string;
  messageKey?: MessageKey;

  constructor(error: string, messageKey?: MessageKey) {
    this.error = error;
    this.messageKey = messageKey;
  }
}
```

**Domain Types:**

```typescript
// user.types.ts
export interface IUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'user' | 'guest';

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserDTO {
  email?: string;
  avatar?: string;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
}

export type PublicUser = Omit<IUser, 'password'>;
```

---

## Utilities & Helpers

### Logger Utility

```typescript
// utils/logger.util.ts
import winston from 'winston';
import { envConfig } from '@configs';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: envConfig.isDevelopment ? 'debug' : 'info',
  format: logFormat,
  defaultMeta: { service: 'backend-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Console logging in development
if (envConfig.isDevelopment) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Usage:
// logger.debug('Debug message', { context: 'value' });
// logger.info('Info message');
// logger.warn('Warning message');
// logger.error('Error message', error);
```

### JWT Utility

```typescript
// utils/jwt.util.ts
import jwt from 'jsonwebtoken';
import { jwtConfig } from '@configs';
import { logger } from './logger.util';

export class JWTUtil {
  static generateToken(payload: object): string {
    try {
      return jwt.sign(payload, jwtConfig.secret, {
        expiresIn: jwtConfig.expiresIn,
      });
    } catch (error) {
      logger.error('Error generating JWT', error);
      throw new Error('Token generation failed');
    }
  }

  static verifyToken<T = any>(token: string): T | null {
    try {
      return jwt.verify(token, jwtConfig.secret) as T;
    } catch (error) {
      logger.error('JWT verification failed', error);
      return null;
    }
  }

  static decodeToken<T = any>(token: string): T | null {
    try {
      return jwt.decode(token) as T;
    } catch (error) {
      logger.error('JWT decoding failed', error);
      return null;
    }
  }
}
```

### ID Generation Utility

```typescript
// utils/id.util.ts
import { randomBytes } from 'crypto';

export class IDUtil {
  /**
   * Generate unique ID with prefix
   * @param length - Length of random part
   * @param prefix - Prefix for ID (e.g., 'USR', 'ORD')
   * @returns Generated ID
   */
  static generate(length: number = 16, prefix: string = ''): string {
    const random = randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length)
      .toUpperCase();

    return prefix ? `${prefix}${random}` : random;
  }

  /**
   * Generate user ID
   */
  static userId(): string {
    return this.generate(16, 'USR');
  }

  /**
   * Generate order ID
   */
  static orderId(): string {
    return this.generate(16, 'ORD');
  }

  /**
   * Generate session ID
   */
  static sessionId(): string {
    return this.generate(32);
  }
}
```

### Cache Utility

```typescript
// utils/cache.util.ts
import NodeCache from 'node-cache';
import { cacheConfig } from '@configs';
import { logger } from './logger.util';

export class CacheService {
  private static instance: CacheService;
  private cache: NodeCache;

  private constructor() {
    this.cache = new NodeCache({
      stdTTL: cacheConfig.stdTTL,
      checkperiod: cacheConfig.checkperiod,
      useClones: false,
    });

    this.cache.on('expired', (key) => {
      logger.debug(`Cache key expired: ${key}`);
    });
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Get value
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = this.cache.get<T>(key);
      return value || null;
    } catch (error) {
      logger.error(`Cache get error: ${key}`, error);
      return null;
    }
  }

  // Set value
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      return this.cache.set(key, value, ttl || cacheConfig.stdTTL);
    } catch (error) {
      logger.error(`Cache set error: ${key}`, error);
      return false;
    }
  }

  // Delete key
  async delete(key: string): Promise<void> {
    try {
      this.cache.del(key);
    } catch (error) {
      logger.error(`Cache delete error: ${key}`, error);
    }
  }

  // Clear all
  async clear(): Promise<void> {
    try {
      this.cache.flushAll();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Cache clear error', error);
    }
  }

  // Get stats
  getStats() {
    return this.cache.getStats();
  }
}

export const cacheService = CacheService.getInstance();
```

---

## Configuration Management

### Environment Variables

**.env file:**

```bash
# Environment
NODE_ENV=development

# Server
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/yourdb

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Cache
CACHE_TTL=3600
CACHE_CHECK_PERIOD=600

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Config Files (`configs/`)

**Environment Config:**

```typescript
// env.config.ts
import dotenv from 'dotenv';

dotenv.config();

export const envConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};
```

**Database Config:**

```typescript
// database.config.ts
export const databaseConfig = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/yourdb',
  options: {
    maxPoolSize: 10,
    minPoolSize: 5,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 5000,
  },
};
```

**JWT Config:**

```typescript
// jwt.config.ts
export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'fallback-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set, using fallback (not secure for production)');
}
```

**Cache Config:**

```typescript
// cache.config.ts
export const cacheConfig = {
  stdTTL: parseInt(process.env.CACHE_TTL || '3600', 10),
  checkperiod: parseInt(process.env.CACHE_CHECK_PERIOD || '600', 10),
  useClones: false,
  deleteOnExpire: true,
};
```

**CORS Config:**

```typescript
// cors.config.ts
export const corsConfig = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
};
```

**Central Export** (`configs/index.ts`):

```typescript
export * from './env.config';
export * from './database.config';
export * from './jwt.config';
export * from './cache.config';
export * from './cors.config';
```

---

## Middleware Stack

### Application Middleware Order

```typescript
// app.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { corsConfig } from '@configs';
import { rateLimiter } from '@middlewares/rateLimit.middleware';
import routes from '@routes';

export class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // 1. Security
    this.app.use(helmet());
    this.app.use(cors(corsConfig));

    // 2. Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 3. Rate limiting
    this.app.use(rateLimiter);

    // 4. Request logging (development only)
    if (process.env.NODE_ENV === 'development') {
      this.app.use((req, res, next) => {
        logger.debug(`${req.method} ${req.path}`);
        next();
      });
    }
  }

  private setupRoutes(): void {
    this.app.use('/api', routes);

    // 404 handler
    this.app.use((req, res) => {
      const lang = ResponseUtil.extractLanguage(req);
      ResponseUtil.setLanguage(lang);
      ResponseUtil.notFound(res, MESSAGE_KEYS.NOT_FOUND);
    });
  }

  private setupErrorHandling(): void {
    this.app.use(
      (error: Error, req: Request, res: Response, next: NextFunction) => {
        logger.error('Unhandled error', error);
        const lang = ResponseUtil.extractLanguage(req);
        ResponseUtil.setLanguage(lang);
        ResponseUtil.serverError(res, MESSAGE_KEYS.INTERNAL_SERVER_ERROR);
      }
    );
  }
}
```

### Rate Limiting Middleware

```typescript
// middlewares/rateLimit.middleware.ts
import rateLimit from 'express-rate-limit';
import { rateLimitConfig } from '@configs';

export const rateLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
});

// Stricter rate limit for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,  // 5 attempts
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: 'Too many login attempts, please try again later',
  },
});
```

### Authentication Middleware

```typescript
// middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { JWTUtil } from '@utils/jwt.util';
import { ResponseUtil } from '@utils/response.util';
import { MESSAGE_KEYS } from '@shared/constants';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return ResponseUtil.unauthorized(res, MESSAGE_KEYS.TOKEN_REQUIRED);
    }

    const decoded = JWTUtil.verifyToken<{ userId: string; role: string }>(token);

    if (!decoded) {
      return ResponseUtil.unauthorized(res, MESSAGE_KEYS.INVALID_TOKEN);
    }

    req.user = decoded;
    next();
  } catch (error) {
    return ResponseUtil.unauthorized(res, MESSAGE_KEYS.INVALID_TOKEN);
  }
};

// Role-based authorization
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return ResponseUtil.unauthorized(res, MESSAGE_KEYS.UNAUTHORIZED);
    }

    if (!roles.includes(req.user.role)) {
      return ResponseUtil.forbidden(res, MESSAGE_KEYS.FORBIDDEN);
    }

    next();
  };
};
```

**Usage:**

```typescript
// Protected route
router.get(
  '/profile',
  authenticate,
  userController.getProfile.bind(userController)
);

// Admin-only route
router.delete(
  '/users/:id',
  authenticate,
  authorize('admin'),
  userController.deleteUser.bind(userController)
);
```

---

## Routing Conventions

### Route Structure

```
/api
├── /health              → Health check
├── /users
│   ├── POST /signup    → Create account
│   ├── POST /login     → Authenticate
│   └── GET /:id        → Get user profile
├── /posts
│   ├── GET /           → List posts (paginated)
│   ├── POST /          → Create post
│   ├── GET /:id        → Get single post
│   ├── PUT /:id        → Update post
│   └── DELETE /:id     → Delete post
└── /comments
    ├── GET /           → List comments
    └── POST /          → Create comment
```

### RESTful Conventions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/posts` | List all posts (with pagination) |
| GET | `/api/posts/:id` | Get single post |
| POST | `/api/posts` | Create new post |
| PUT | `/api/posts/:id` | Update entire post |
| PATCH | `/api/posts/:id` | Partial update post |
| DELETE | `/api/posts/:id` | Delete post |

### Route File Example

```typescript
// routes/post.routes.ts
import { Router } from 'express';
import { postController } from '@controllers';
import {
  createPostValidation,
  updatePostValidation
} from '@requests/post.validation';
import { validateRequest } from '@middlewares/validateRequest.middleware';
import { authenticate } from '@middlewares/auth.middleware';

const router = Router();

// Public routes
router.get(
  '/',
  postController.list.bind(postController)
);

router.get(
  '/:id',
  postController.getById.bind(postController)
);

// Protected routes
router.post(
  '/',
  authenticate,
  createPostValidation,
  validateRequest,
  postController.create.bind(postController)
);

router.put(
  '/:id',
  authenticate,
  updatePostValidation,
  validateRequest,
  postController.update.bind(postController)
);

router.delete(
  '/:id',
  authenticate,
  postController.delete.bind(postController)
);

export default router;
```

---

## Naming Conventions

### Files & Folders

| Type | Convention | Example |
|------|-----------|---------|
| Controllers | `entity.controller.ts` | `user.controller.ts` |
| Services | `entity.service.ts` | `user.service.ts` |
| Models | `entity.model.ts` | `user.model.ts` |
| Routes | `entity.routes.ts` | `user.routes.ts` |
| Types | `entity.types.ts` | `user.types.ts` |
| Constants | `name.constants.ts` | `http.constants.ts` |
| Utils | `name.util.ts` | `response.util.ts` |
| Middlewares | `name.middleware.ts` | `auth.middleware.ts` |
| Configs | `name.config.ts` | `database.config.ts` |
| Validations | `entity.validation.ts` | `user.validation.ts` |

### Code Naming

**Classes:**
- PascalCase: `UserService`, `GameController`, `ResponseUtil`

**Interfaces:**
- Prefix with `I`: `IUser`, `IPost`, `IComment`
- DTOs: `CreateUserDTO`, `UpdatePostDTO`
- Documents: `IUserDocument`

**Functions & Methods:**
- camelCase: `getUserById`, `createPost`, `validateEmail`

**Constants:**
- SCREAMING_SNAKE_CASE: `HTTP_STATUS`, `MESSAGE_KEYS`, `APP_CONFIG`

**Variables:**
- camelCase: `userId`, `postData`, `isValid`

**Exported Instances:**
- camelCase: `userService`, `gameController`, `logger`

---

## Performance Optimization

### 1. Database Indexing

```typescript
// Single field index
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

// Compound index (order matters!)
postSchema.index({ userId: 1, createdAt: -1 });

// Text search index
postSchema.index({ title: 'text', content: 'text' });

// Unique index
userSchema.index({ email: 1 }, { unique: true });
```

**Impact:** 95-97% query time reduction (150ms → <5ms)

### 2. Caching Strategy

**Read-Through Cache:**

```typescript
async getUserById(id: string): Promise<ServiceResult<IUser>> {
  const cacheKey = `user:${id}`;

  // Try cache
  const cached = await cacheService.get<IUser>(cacheKey);
  if (cached) {
    return new ServiceSuccess(cached);
  }

  // Query DB
  const user = await UserModel.findOne({ id }).lean();
  if (!user) {
    return new ServiceError('User not found', MESSAGE_KEYS.USER_NOT_FOUND);
  }

  // Cache result
  await cacheService.set(cacheKey, user, 3600);

  return new ServiceSuccess(user);
}
```

**Cache Invalidation:**

```typescript
async updateUser(id: string, data: UpdateUserDTO): Promise<ServiceResult<IUser>> {
  const user = await UserModel.findOneAndUpdate(
    { id },
    { $set: data },
    { new: true }
  );

  // Invalidate cache
  await cacheService.delete(`user:${id}`);

  return new ServiceSuccess(user);
}
```

### 3. Lean Queries

```typescript
// ❌ Heavy - Full Mongoose document
const users = await UserModel.find();

// ✅ Light - Plain JavaScript object
const users = await UserModel.find().lean();
```

**Impact:** 40-60% faster query execution

### 4. Selective Field Loading

```typescript
// Only fetch needed fields
const users = await UserModel.find()
  .select('id username avatar')
  .lean();
```

### 5. Pre-Computed Data

```typescript
// Pre-compute and cache expensive calculations
export class LetterService {
  private letterCategoryCache: Map<string, string[]>;

  async initialize(): Promise<void> {
    logger.info('Building letter-category cache...');

    const categories = await CategoryModel.find().lean();

    for (const category of categories) {
      const letters = await WordModel.distinct('startsWith', {
        category: category.name,
      });

      this.letterCategoryCache.set(category.name, letters);
    }

    logger.info('Letter-category cache built');
  }
}
```

**Impact:** 97% faster (300ms → <10ms)

---

## Security Best Practices

### 1. Password Hashing

```typescript
import bcrypt from 'bcrypt';

// Hash password (10 salt rounds)
const hashedPassword = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword);
```

### 2. JWT Authentication

```typescript
// Generate token
const token = JWTUtil.generateToken({
  userId: user.id,
  role: user.role,
});

// Verify token
const decoded = JWTUtil.verifyToken<TokenPayload>(token);
if (!decoded) {
  return ResponseUtil.unauthorized(res, MESSAGE_KEYS.INVALID_TOKEN);
}
```

### 3. Input Validation & Sanitization

```typescript
body('username')
  .trim()                          // Remove whitespace
  .escape()                        // Escape HTML
  .isLength({ min: 3, max: 20 })
  .matches(/^[a-zA-Z0-9_]+$/)      // Only allowed characters
  .customSanitizer((value) => value.toLowerCase());
```

### 4. Rate Limiting

```typescript
// Global rate limit
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

// Strict auth rate limit
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
});
```

### 5. CORS Configuration

```typescript
import cors from 'cors';

this.app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
}));
```

### 6. Security Headers (Helmet)

```typescript
import helmet from 'helmet';

this.app.use(helmet());  // Sets various security headers
```

### 7. Sensitive Data Protection

```typescript
// Hide password from queries by default
const userSchema = new Schema({
  password: {
    type: String,
    required: true,
    select: false  // Excluded by default
  },
});

// Explicitly include when needed
const user = await UserModel.findOne({ id }).select('+password');
```

### 8. SQL/NoSQL Injection Prevention

```typescript
// ✅ Safe - Parameterized queries
const user = await UserModel.findOne({ username: inputUsername });

// ❌ Dangerous - String concatenation
const user = await UserModel.findOne(`{ username: "${inputUsername}" }`);
```

---

## Code Quality Standards

### 1. Error Handling

**✅ Do:**
- Always return `ServiceResult` from services
- Wrap controllers with `asyncHandler`
- Log errors with context
- Use meaningful error messages

**❌ Don't:**
- Throw errors from services
- Leave async functions unwrapped
- Swallow errors silently
- Expose internal errors to users

### 2. Code Organization

**✅ Do:**
- One class per file
- Related files in same folder
- Index files for clean imports
- Consistent file naming

**❌ Don't:**
- Mix multiple concerns in one file
- Deep nested folders (>3 levels)
- Inconsistent naming patterns

### 3. TypeScript Usage

**✅ Do:**
- Define interfaces for all data shapes
- Use generics for reusable code
- Enable strict mode
- Explicit return types on public methods

**❌ Don't:**
- Use `any` type (use `unknown` if needed)
- Skip type annotations
- Disable strict checks
- Use TypeScript enums (use union types)

### 4. Comments & Documentation

**✅ Do:**
- Comment complex business logic
- Document non-obvious decisions
- Use JSDoc for public APIs
- Explain "why" not "what"

**❌ Don't:**
- Comment obvious code
- Leave outdated comments
- Over-comment simple code

### 5. Testing Readiness

**Structure for testability:**

```typescript
// ✅ Testable - Pure function
export class UserService {
  async validateUsername(username: string): boolean {
    return /^[a-zA-Z0-9_]+$/.test(username);
  }
}

// ✅ Testable - No HTTP dependencies
async signup(data: SignupDTO): Promise<ServiceResult<AuthResponse>> {
  // Pure business logic
}
```

---

## Real-Time Features

### WebSocket Setup

```typescript
// websocket/server.ts
import { Server as SocketServer } from 'socket.io';
import { Server } from 'http';
import { logger } from '@utils/logger.util';

export class WebSocketServer {
  private static instance: WebSocketServer;
  private io: SocketServer;

  private constructor(server: Server) {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(','),
        credentials: true,
      },
    });

    this.setupEventHandlers();
  }

  public static getInstance(server?: Server): WebSocketServer {
    if (!WebSocketServer.instance && server) {
      WebSocketServer.instance = new WebSocketServer(server);
    }
    return WebSocketServer.instance;
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('join_room', (roomId: string) => {
        socket.join(roomId);
        logger.debug(`Socket ${socket.id} joined room ${roomId}`);
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  public emitToRoom(roomId: string, event: string, data: any): void {
    this.io.to(roomId).emit(event, data);
  }

  public emitToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }
}
```

---

## Quick Setup Checklist

### Initial Setup

```bash
# 1. Initialize project
npm init -y

# 2. Install core dependencies
npm install express mongoose dotenv
npm install bcrypt jsonwebtoken
npm install helmet cors express-rate-limit
npm install winston node-cache

# 3. Install TypeScript & types
npm install -D typescript @types/node @types/express
npm install -D @types/bcrypt @types/jsonwebtoken
npm install -D @types/cors ts-node nodemon

# 4. Install validation
npm install express-validator

# 5. Initialize TypeScript
npx tsc --init
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "baseUrl": "./src",
    "paths": {
      "@controllers": ["controllers/index"],
      "@services": ["services/index"],
      "@models": ["models/index"],
      "@routes": ["routes/index"],
      "@middlewares": ["middlewares/index"],
      "@configs": ["configs/index"],
      "@shared/*": ["shared/*"],
      "@utils/*": ["utils/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### package.json Scripts

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node -r tsconfig-paths/register src/server.ts",
    "build": "tsc",
    "start": "node -r tsconfig-paths/register dist/server.js",
    "start:prod": "NODE_ENV=production node dist/server.js"
  }
}
```

### Folder Creation

```bash
mkdir -p src/{controllers,services,models,routes,middlewares,configs,requests,shared/{types,constants},utils,websocket,migrations}
mkdir -p logs docs
```

### Essential Files to Create

1. `src/server.ts` - Entry point
2. `src/app.ts` - Express app
3. `src/shared/types/service.types.ts` - ServiceResult pattern
4. `src/shared/constants/http.constants.ts` - HTTP status codes
5. `src/shared/constants/messages.constants.ts` - Message keys
6. `src/utils/response.util.ts` - Response handler
7. `src/utils/logger.util.ts` - Logger
8. `src/utils/asyncHandler.util.ts` - Error wrapper
9. `src/middlewares/validateRequest.middleware.ts` - Validation handler

---

## Summary

This architecture provides:

- ✅ **Clean Separation** - Controller → Service → Model layers
- ✅ **Type Safety** - Comprehensive TypeScript with strict mode
- ✅ **Error Handling** - Three-layer strategy with ServiceResult pattern
- ✅ **Performance** - Caching, indexing, lean queries, pre-computed data
- ✅ **Security** - Rate limiting, JWT, bcrypt, helmet, validation
- ✅ **Scalability** - Singleton services, connection pooling, WebSocket support
- ✅ **Maintainability** - Path aliases, consistent naming, DRY principles
- ✅ **Internationalization** - Multi-language support
- ✅ **Developer Experience** - Clear structure, comprehensive types

---

**Key Principles:**

1. **Services never throw** - Always return `ServiceResult`
2. **Controllers are thin** - Only HTTP handling, no business logic
3. **Type everything** - Leverage TypeScript's type system
4. **Cache aggressively** - But invalidate correctly
5. **Validate early** - At the request boundary
6. **Log strategically** - Debug, info, warn, error levels
7. **Index smartly** - Based on query patterns
8. **Secure by default** - Rate limiting, validation, sanitization

Copy the `shared/` and `utils/` folders to any new project to get started quickly with these patterns!
